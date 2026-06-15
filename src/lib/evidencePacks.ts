import { buildEvidenceDossier } from "@/lib/evidenceDossier";
import {
  buildSourceRegistry,
  sourceIdFor,
  type SourceRecord,
  type SourceRegistrySummary
} from "@/lib/sourceRegistry";
import type { ScoredConstraint } from "@/types/constraint";

export type ClaimSupportLevel = "weak" | "moderate" | "strong";

export type ClaimSupport = {
  claim: string;
  support_level: ClaimSupportLevel;
  evidence_text: string;
  supporting_source_ids: string[];
  unresolved_gap: string;
};

export type EvidencePack = {
  constraint_id: string;
  constraint_title: string;
  core_claim: string;
  source_records: SourceRecord[];
  claim_support: ClaimSupport[];
  evidence_gaps: string[];
  provenance_notes: string[];
  provenance_status: "thin" | "workable" | "strong";
  source_coverage_score: number;
  claim_support_score: number;
  provenance_score: number;
  defensibility_score: number;
  recommended_source_upgrade: string;
  audit_flags: string[];
};

export type EvidencePackSummary = SourceRegistrySummary & {
  evidence_pack_count: number;
  average_defensibility_score: number;
  thin_provenance_records: number;
  records_with_unresolved_gaps: number;
  top_source_upgrade_targets: string[];
};

export type EvidencePackPortfolio = {
  source_summary: SourceRegistrySummary;
  evidence_pack_summary: EvidencePackSummary;
  packs: EvidencePack[];
};

export function buildEvidencePackPortfolio(
  constraints: ScoredConstraint[]
): EvidencePackPortfolio {
  const registry = buildSourceRegistry(constraints);
  const sourcesById = new Map(
    registry.sources.map((source) => [source.source_id, source])
  );
  const packs = constraints
    .map((constraint) => buildEvidencePack(constraint, sourcesById))
    .sort(
      (first, second) => first.defensibility_score - second.defensibility_score
    );

  return {
    source_summary: registry.summary,
    evidence_pack_summary: summarizeEvidencePacks(packs, registry.summary),
    packs
  };
}

export function buildEvidencePack(
  constraint: ScoredConstraint,
  sourcesById?: Map<string, SourceRecord>
): EvidencePack {
  const dossier = buildEvidenceDossier(constraint);
  const localSourceMap =
    sourcesById ??
    new Map(
      buildSourceRegistry([constraint]).sources.map((source) => [
        source.source_id,
        source
      ])
    );
  const sourceRecords = constraint.sources
    .map((sourceTitle) => localSourceMap.get(sourceIdFor(sourceTitle)))
    .filter((source): source is SourceRecord => Boolean(source));
  const sourceCoverage = round(Math.min(10, sourceRecords.length * 2.5));
  const claimSupportScore = round(
    constraint.scores.evidence_score * 0.5 +
      constraint.scores.validation_confidence_score * 0.3 +
      sourceCoverage * 0.2
  );
  const provenanceScore = round(
    sourceRecords.reduce((total, source) => total + source.trust_weight, 0) /
      Math.max(1, sourceRecords.length)
  );
  const defensibility = round(
    claimSupportScore * 0.42 +
      provenanceScore * 0.33 +
      constraint.scores.measurability_score * 0.15 +
      (10 - constraint.evidence_gaps.length * 0.8) * 0.1
  );

  return {
    constraint_id: constraint.id,
    constraint_title: constraint.title,
    core_claim: dossier.core_claim,
    source_records: sourceRecords,
    claim_support: claimSupport(constraint, sourceRecords),
    evidence_gaps: constraint.evidence_gaps,
    provenance_notes: provenanceNotes(constraint, sourceRecords),
    provenance_status: provenanceStatus(defensibility),
    source_coverage_score: sourceCoverage,
    claim_support_score: clamp(claimSupportScore),
    provenance_score: clamp(provenanceScore),
    defensibility_score: clamp(defensibility),
    recommended_source_upgrade: recommendedSourceUpgrade(constraint, sourceRecords),
    audit_flags: auditFlags(constraint, sourceRecords, defensibility)
  };
}

function summarizeEvidencePacks(
  packs: EvidencePack[],
  sourceSummary: SourceRegistrySummary
): EvidencePackSummary {
  return {
    ...sourceSummary,
    evidence_pack_count: packs.length,
    average_defensibility_score: round(
      packs.reduce((total, pack) => total + pack.defensibility_score, 0) /
        packs.length
    ),
    thin_provenance_records: packs.filter((pack) => pack.provenance_status === "thin")
      .length,
    records_with_unresolved_gaps: packs.filter((pack) => pack.evidence_gaps.length > 0)
      .length,
    top_source_upgrade_targets: packs.slice(0, 5).map((pack) => pack.constraint_title)
  };
}

function claimSupport(
  constraint: ScoredConstraint,
  sourceRecords: SourceRecord[]
): ClaimSupport[] {
  const sourceIds = sourceRecords.map((source) => source.source_id);

  return [
    {
      claim: `The constraint exists in ${constraint.related_processes[0]}.`,
      support_level: supportLevel(constraint.scores.evidence_score),
      evidence_text: constraint.evidence[0] ?? "No direct evidence text yet.",
      supporting_source_ids: sourceIds,
      unresolved_gap: constraint.evidence_gaps[0] ?? "Local frequency still needs verification."
    },
    {
      claim: `The constraint affects ${constraint.downstream_constraints[0]}.`,
      support_level: supportLevel(constraint.scores.downstream_impact_score),
      evidence_text: constraint.evidence[1] ?? constraint.confidence_reasoning,
      supporting_source_ids: sourceIds,
      unresolved_gap: constraint.evidence_gaps[1] ?? "Downstream impact needs a measured baseline."
    },
    {
      claim: `The constraint is measurable through ${constraint.affected_systems[0]}.`,
      support_level: supportLevel(constraint.scores.measurability_score),
      evidence_text: `Data availability ${constraint.data_availability}/10 and measurement difficulty ${constraint.measurement_difficulty}/10.`,
      supporting_source_ids: sourceIds,
      unresolved_gap: constraint.evidence_gaps[2] ?? "Measurement instrumentation needs confirmation."
    }
  ];
}

function provenanceNotes(
  constraint: ScoredConstraint,
  sourceRecords: SourceRecord[]
) {
  return [
    `${sourceRecords.length} source locator(s) currently attached.`,
    `Source type is ${constraint.source_type}; validation status is ${constraint.validation_status}.`,
    "No external fetch, scraping, or citation enrichment has been performed in this local-first phase."
  ];
}

function recommendedSourceUpgrade(
  constraint: ScoredConstraint,
  sourceRecords: SourceRecord[]
) {
  const primaryNeed = sourceRecords.find(
    (source) => source.citation_status === "needs-primary-document"
  );

  if (primaryNeed) {
    return `Attach the specific primary document for ${primaryNeed.title}.`;
  }

  if (constraint.data_availability < 7) {
    return `Add local operational evidence from ${constraint.affected_systems[0]}.`;
  }

  return `Add URL, publication date, and scope notes for ${sourceRecords[0]?.title ?? "the strongest source"}.`;
}

function auditFlags(
  constraint: ScoredConstraint,
  sourceRecords: SourceRecord[],
  defensibility: number
) {
  const flags: string[] = [];

  if (sourceRecords.length < 2) flags.push("fewer than two source locators");
  if (constraint.evidence_gaps.length > 2) flags.push("multiple unresolved evidence gaps");
  if (defensibility < 6) flags.push("low defensibility score");
  if (constraint.validation_status !== "Validated") flags.push("not validated");

  return flags.length > 0 ? flags : ["no major source-pack flags"];
}

function supportLevel(score: number): ClaimSupportLevel {
  if (score >= 7.5) return "strong";
  if (score >= 5.5) return "moderate";
  return "weak";
}

function provenanceStatus(score: number): EvidencePack["provenance_status"] {
  if (score >= 7.5) return "strong";
  if (score >= 5.8) return "workable";
  return "thin";
}

function clamp(score: number) {
  return Math.max(1, Math.min(10, score));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
