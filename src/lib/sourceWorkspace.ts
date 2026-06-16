import type { EvidencePackPortfolio } from "@/lib/evidencePacks";
import type { SourceRecord } from "@/lib/sourceRegistry";
import type { ValidationEvidencePacketPortfolio } from "@/lib/validationEvidencePackets";
import type { ScoredConstraint } from "@/types/constraint";

export type SourceWorkspaceConstraintDependency = {
  constraint_id: string;
  constraint_title: string;
  industry: string;
  validation_confidence: number;
  defensibility_score: number;
  provenance_status: string;
  recommended_source_upgrade: string;
  investigation_route: string;
  network_route: string;
};

export type SourceWorkspacePacketLink = {
  packet_id: string;
  constraint_id: string;
  constraint_title: string;
  triage_rank: number;
  request_category: string;
  expected_artifact: string;
};

export type SourceWorkspaceRecord = {
  source_id: string;
  title: string;
  source_type: string;
  publisher: string;
  provenance_level: string;
  citation_status: string;
  trust_weight: number;
  verification_need: string;
  dependency_count: number;
  weakest_defensibility_score: number;
  average_defensibility_score: number;
  weakest_provenance_status: string;
  primary_document_needed: boolean;
  needs_url: boolean;
  local_observation_needed: boolean;
  weak_dependency_count: number;
  constraint_dependencies: SourceWorkspaceConstraintDependency[];
  evidence_packet_links: SourceWorkspacePacketLink[];
};

export type SourceWorkspaceSummary = {
  source_count: number;
  weak_source_count: number;
  primary_document_needed_count: number;
  needs_url_count: number;
  local_observation_needed_count: number;
  average_trust_weight: number;
  average_dependency_count: number;
  most_reused_source: string;
  weakest_source: string;
  citation_status_distribution: Record<string, number>;
  provenance_level_distribution: Record<string, number>;
};

export type SourceWorkspace = {
  summary: SourceWorkspaceSummary;
  records: SourceWorkspaceRecord[];
};

export function buildSourceWorkspace({
  constraints,
  evidencePackPortfolio,
  evidencePacketPortfolio
}: {
  constraints: ScoredConstraint[];
  evidencePackPortfolio: EvidencePackPortfolio;
  evidencePacketPortfolio: ValidationEvidencePacketPortfolio;
}): SourceWorkspace {
  const constraintsById = new Map(
    constraints.map((constraint) => [constraint.id, constraint])
  );
  const packsByConstraintId = new Map(
    evidencePackPortfolio.packs.map((pack) => [pack.constraint_id, pack])
  );
  const packetsByConstraintId = new Map(
    evidencePacketPortfolio.packets.map((packet) => [packet.constraint_id, packet])
  );

  const records = evidencePackPortfolio.source_summary.source_count
    ? sourceRecordsFromPortfolio(evidencePackPortfolio).map((source) =>
        buildSourceWorkspaceRecord(
          source,
          constraintsById,
          packsByConstraintId,
          packetsByConstraintId
        )
      )
    : [];

  const sortedRecords = records.sort(
    (first, second) =>
      Number(second.primary_document_needed) - Number(first.primary_document_needed) ||
      first.weakest_defensibility_score - second.weakest_defensibility_score ||
      second.dependency_count - first.dependency_count ||
      first.title.localeCompare(second.title)
  );

  return {
    summary: summarizeSources(sortedRecords),
    records: sortedRecords
  };
}

function sourceRecordsFromPortfolio(
  evidencePackPortfolio: EvidencePackPortfolio
): SourceRecord[] {
  const sources = new Map<string, SourceRecord>();
  evidencePackPortfolio.packs.forEach((pack) => {
    pack.source_records.forEach((source) => {
      sources.set(source.source_id, source);
    });
  });
  return Array.from(sources.values());
}

function buildSourceWorkspaceRecord(
  source: SourceRecord,
  constraintsById: Map<string, ScoredConstraint>,
  packsByConstraintId: Map<string, EvidencePackPortfolio["packs"][number]>,
  packetsByConstraintId: Map<
    string,
    ValidationEvidencePacketPortfolio["packets"][number]
  >
): SourceWorkspaceRecord {
  const dependencies = source.referenced_by
    .map((constraintId): SourceWorkspaceConstraintDependency | null => {
      const constraint = constraintsById.get(constraintId);
      const pack = packsByConstraintId.get(constraintId);
      if (!constraint || !pack) return null;

      return {
        constraint_id: constraint.id,
        constraint_title: constraint.title,
        industry: constraint.industry,
        validation_confidence: constraint.scores.validation_confidence_score,
        defensibility_score: pack.defensibility_score,
        provenance_status: pack.provenance_status,
        recommended_source_upgrade: pack.recommended_source_upgrade,
        investigation_route: `/constraints/${constraint.id}`,
        network_route: `/network?focus=${constraint.id}`
      };
    })
    .filter(
      (
        dependency
      ): dependency is SourceWorkspaceConstraintDependency => Boolean(dependency)
    )
    .sort(
      (first, second) =>
        first.defensibility_score - second.defensibility_score ||
        first.constraint_title.localeCompare(second.constraint_title)
    );
  const packetLinks = dependencies
    .map((dependency) => packetsByConstraintId.get(dependency.constraint_id))
    .filter((packet): packet is ValidationEvidencePacketPortfolio["packets"][number] =>
      Boolean(packet)
    )
    .map((packet) => ({
      packet_id: packet.packet_id,
      constraint_id: packet.constraint_id,
      constraint_title: packet.constraint_title,
      triage_rank: packet.triage_rank,
      request_category: packet.request_category,
      expected_artifact: packet.expected_artifact
    }))
    .sort((first, second) => first.triage_rank - second.triage_rank);
  const defensibilityScores = dependencies.map(
    (dependency) => dependency.defensibility_score
  );
  const weakestDefensibility =
    defensibilityScores.length > 0 ? Math.min(...defensibilityScores) : 10;
  const averageDefensibility =
    defensibilityScores.length > 0
      ? round(
          defensibilityScores.reduce((sum, score) => sum + score, 0) /
            defensibilityScores.length
        )
      : 10;

  return {
    source_id: source.source_id,
    title: source.title,
    source_type: source.source_type,
    publisher: source.publisher,
    provenance_level: source.provenance_level,
    citation_status: source.citation_status,
    trust_weight: source.trust_weight,
    verification_need: source.verification_need,
    dependency_count: dependencies.length,
    weakest_defensibility_score: weakestDefensibility,
    average_defensibility_score: averageDefensibility,
    weakest_provenance_status: weakestProvenanceStatus(dependencies),
    primary_document_needed: source.citation_status === "needs-primary-document",
    needs_url: source.citation_status === "needs-url",
    local_observation_needed:
      source.citation_status === "local-observation-needed",
    weak_dependency_count: dependencies.filter(
      (dependency) =>
        dependency.defensibility_score < 6 ||
        dependency.provenance_status === "thin"
    ).length,
    constraint_dependencies: dependencies,
    evidence_packet_links: packetLinks
  };
}

function summarizeSources(records: SourceWorkspaceRecord[]): SourceWorkspaceSummary {
  const weakSources = records.filter(
    (source) =>
      source.trust_weight < 6 ||
      source.weakest_defensibility_score < 6 ||
      source.weakest_provenance_status === "thin"
  );

  return {
    source_count: records.length,
    weak_source_count: weakSources.length,
    primary_document_needed_count: records.filter(
      (source) => source.primary_document_needed
    ).length,
    needs_url_count: records.filter((source) => source.needs_url).length,
    local_observation_needed_count: records.filter(
      (source) => source.local_observation_needed
    ).length,
    average_trust_weight: round(
      records.reduce((sum, source) => sum + source.trust_weight, 0) /
        Math.max(1, records.length)
    ),
    average_dependency_count: round(
      records.reduce((sum, source) => sum + source.dependency_count, 0) /
        Math.max(1, records.length)
    ),
    most_reused_source:
      records.slice().sort((first, second) => second.dependency_count - first.dependency_count)[0]
        ?.title ?? "None",
    weakest_source: weakSources[0]?.title ?? "None",
    citation_status_distribution: distribution(
      records.map((source) => source.citation_status)
    ),
    provenance_level_distribution: distribution(
      records.map((source) => source.provenance_level)
    )
  };
}

function weakestProvenanceStatus(
  dependencies: SourceWorkspaceConstraintDependency[]
) {
  if (dependencies.some((dependency) => dependency.provenance_status === "thin")) {
    return "thin";
  }
  if (
    dependencies.some((dependency) => dependency.provenance_status === "workable")
  ) {
    return "workable";
  }
  return "strong";
}

function distribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
