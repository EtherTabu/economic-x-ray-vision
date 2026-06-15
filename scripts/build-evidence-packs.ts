{
type EvidencePackFsModule = typeof import("node:fs");
type EvidencePackPathModule = typeof import("node:path");

const {
  existsSync: evidencePackExistsSync,
  mkdirSync: evidencePackMkdirSync,
  readFileSync: evidencePackReadFileSync,
  writeFileSync: evidencePackWriteFileSync
} = process.getBuiltinModule("fs") as EvidencePackFsModule;
const {
  dirname: evidencePackDirname,
  resolve: evidencePackResolve
} = process.getBuiltinModule("path") as EvidencePackPathModule;

type EvidencePackRecord = {
  id: string;
  title: string;
  category: string;
  source_type: string;
  validation_status: string;
  source_quality: number;
  evidence: string[];
  evidence_gaps: string[];
  sources: string[];
  related_processes: string[];
  affected_systems: string[];
  downstream_constraints: string[];
  data_availability: number;
  measurement_difficulty: number;
  confidence_reasoning: string;
  scores: Record<string, number>;
};

type EvidencePackSource = {
  source_id: string;
  title: string;
  source_type: string;
  publisher: string;
  referenced_by: string[];
  provenance_level: string;
  citation_status: string;
  trust_weight: number;
  verification_need: string;
};

const evidencePackDatasetPath = evidencePackResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const evidencePackOutputPath = evidencePackResolve(
  "data/exports/evidence_packs.json"
);
const sourceRegistryOutputPath = evidencePackResolve(
  "data/exports/source_registry.json"
);

function evidencePackMain() {
  const dataset = JSON.parse(
    evidencePackReadFileSync(evidencePackDatasetPath, "utf8")
  ) as { records: EvidencePackRecord[] };
  const sourceRegistry = buildSourceRegistry(dataset.records);
  const sourceMap = new Map(
    sourceRegistry.sources.map((source) => [source.source_id, source])
  );
  const packs = dataset.records
    .map((record) => buildEvidencePack(record, sourceMap))
    .sort(
      (first, second) => first.defensibility_score - second.defensibility_score
    );
  const packExport = {
    generated_at: new Date().toISOString(),
    evidence_pack_count: packs.length,
    source_summary: sourceRegistry.summary,
    evidence_pack_summary: summarizePacks(packs, sourceRegistry.summary),
    packs
  };
  const registryExport = {
    generated_at: new Date().toISOString(),
    ...sourceRegistry
  };

  evidencePackMkdirSync(evidencePackDirname(evidencePackOutputPath), {
    recursive: true
  });
  writeStableJson(evidencePackOutputPath, packExport);
  writeStableJson(sourceRegistryOutputPath, registryExport);
  console.log(
    `Built ${packs.length} evidence packs and ${sourceRegistry.sources.length} source records.`
  );
}

function buildSourceRegistry(records: EvidencePackRecord[]) {
  const sourceMap = new Map<string, EvidencePackSource>();

  records.forEach((record) => {
    record.sources.forEach((sourceTitle) => {
      const sourceId = sourceIdFor(sourceTitle);
      const existing = sourceMap.get(sourceId);
      const source =
        existing ??
        ({
          source_id: sourceId,
          title: sourceTitle,
          source_type: record.source_type,
          publisher: publisherFromTitle(sourceTitle),
          referenced_by: [],
          provenance_level: provenanceLevel(record.source_type),
          citation_status: citationStatus(record.source_type),
          trust_weight: trustWeight(record.source_type, record.source_quality),
          verification_need: verificationNeed(record.source_type)
        } satisfies EvidencePackSource);

      source.referenced_by = Array.from(new Set([...source.referenced_by, record.id])).sort();
      source.trust_weight = round(
        (source.trust_weight + trustWeight(record.source_type, record.source_quality)) /
          2
      );
      sourceMap.set(sourceId, source);
    });
  });

  const sources = Array.from(sourceMap.values()).sort((first, second) =>
    first.title.localeCompare(second.title)
  );

  return {
    sources,
    summary: {
      source_count: sources.length,
      constraint_coverage_count: records.filter((record) => record.sources.length > 0)
        .length,
      average_trust_weight: round(
        sources.reduce((total, source) => total + source.trust_weight, 0) /
          sources.length
      ),
      provenance_distribution: distribution(
        sources.map((source) => source.provenance_level)
      ),
      citation_status_distribution: distribution(
        sources.map((source) => source.citation_status)
      ),
      sources_needing_primary_documents: sources.filter(
        (source) => source.citation_status === "needs-primary-document"
      ).length
    }
  };
}

function buildEvidencePack(
  record: EvidencePackRecord,
  sourceMap: Map<string, EvidencePackSource>
) {
  const sources = record.sources
    .map((sourceTitle) => sourceMap.get(sourceIdFor(sourceTitle)))
    .filter((source): source is EvidencePackSource => Boolean(source));
  const sourceCoverage = round(Math.min(10, sources.length * 2.5));
  const claimSupportScore = round(
    record.scores.evidence_score * 0.5 +
      record.scores.validation_confidence_score * 0.3 +
      sourceCoverage * 0.2
  );
  const provenanceScore = round(
    sources.reduce((total, source) => total + source.trust_weight, 0) /
      Math.max(1, sources.length)
  );
  const defensibility = clamp(
    round(
      claimSupportScore * 0.42 +
        provenanceScore * 0.33 +
        record.scores.measurability_score * 0.15 +
        (10 - record.evidence_gaps.length * 0.8) * 0.1
    )
  );

  return {
    constraint_id: record.id,
    constraint_title: record.title,
    core_claim: `${record.title} creates ${record.category.toLowerCase()} through ${record.related_processes[0]}.`,
    source_records: sources,
    claim_support: [
      {
        claim: `The constraint exists in ${record.related_processes[0]}.`,
        support_level: supportLevel(record.scores.evidence_score),
        evidence_text: record.evidence[0] ?? "No direct evidence text yet.",
        supporting_source_ids: sources.map((source) => source.source_id),
        unresolved_gap: record.evidence_gaps[0] ?? "Local frequency still needs verification."
      },
      {
        claim: `The constraint affects ${record.downstream_constraints[0]}.`,
        support_level: supportLevel(record.scores.downstream_impact_score),
        evidence_text: record.evidence[1] ?? record.confidence_reasoning,
        supporting_source_ids: sources.map((source) => source.source_id),
        unresolved_gap:
          record.evidence_gaps[1] ?? "Downstream impact needs a measured baseline."
      }
    ],
    evidence_gaps: record.evidence_gaps,
    provenance_notes: [
      `${sources.length} source locator(s) currently attached.`,
      `Source type is ${record.source_type}; validation status is ${record.validation_status}.`,
      "No external fetch, scraping, or citation enrichment has been performed."
    ],
    provenance_status:
      defensibility >= 7.5 ? "strong" : defensibility >= 5.8 ? "workable" : "thin",
    source_coverage_score: sourceCoverage,
    claim_support_score: clamp(claimSupportScore),
    provenance_score: clamp(provenanceScore),
    defensibility_score: defensibility,
    recommended_source_upgrade: recommendedSourceUpgrade(record, sources),
    audit_flags: auditFlags(record, sources, defensibility)
  };
}

function summarizePacks(
  packs: Array<{
    constraint_title: string;
    defensibility_score: number;
    provenance_status: string;
    evidence_gaps: string[];
  }>,
  sourceSummary: Record<string, unknown>
) {
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

function recommendedSourceUpgrade(
  record: EvidencePackRecord,
  sources: EvidencePackSource[]
) {
  const primaryNeed = sources.find(
    (source) => source.citation_status === "needs-primary-document"
  );
  if (primaryNeed) return `Attach the specific primary document for ${primaryNeed.title}.`;
  if (record.data_availability < 7) {
    return `Add local operational evidence from ${record.affected_systems[0]}.`;
  }
  return `Add URL, publication date, and scope notes for ${sources[0]?.title ?? "the strongest source"}.`;
}

function auditFlags(
  record: EvidencePackRecord,
  sources: EvidencePackSource[],
  defensibility: number
) {
  const flags: string[] = [];
  if (sources.length < 2) flags.push("fewer than two source locators");
  if (record.evidence_gaps.length > 2) flags.push("multiple unresolved evidence gaps");
  if (defensibility < 6) flags.push("low defensibility score");
  if (record.validation_status !== "Validated") flags.push("not validated");
  return flags.length > 0 ? flags : ["no major source-pack flags"];
}

function sourceIdFor(title: string) {
  return `source:${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function publisherFromTitle(title: string) {
  return title
    .split(
      / guidance| surveys| resources| benchmarks| research| reports| index| standards| programs| case studies/i
    )[0]
    .trim();
}

function provenanceLevel(sourceType: string) {
  if (sourceType === "Operational Pattern") return "operational-pattern";
  if (sourceType === "Mixed Secondary") return "secondary-reference";
  return "source-title-only";
}

function citationStatus(sourceType: string) {
  if (sourceType === "Operational Pattern") return "local-observation-needed";
  if (sourceType === "Government" || sourceType === "Professional Association") {
    return "needs-primary-document";
  }
  return "needs-url";
}

function verificationNeed(sourceType: string) {
  if (sourceType === "Operational Pattern") {
    return "Attach local observation notes, logs, or interview records.";
  }
  if (sourceType === "Government") {
    return "Attach specific agency document, program page, or dataset reference.";
  }
  return "Attach source URL, publication date, and scope notes.";
}

function trustWeight(sourceType: string, sourceQuality: number) {
  const boost =
    sourceType === "Government"
      ? 1
      : sourceType === "Professional Association"
        ? 0.7
        : sourceType === "Industry Benchmark"
          ? 0.5
          : sourceType === "Mixed Secondary"
            ? 0.2
            : -0.2;
  return clamp(round(sourceQuality + boost));
}

function supportLevel(score: number) {
  if (score >= 7.5) return "strong";
  if (score >= 5.5) return "moderate";
  return "weak";
}

function distribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function clamp(score: number) {
  return Math.max(1, Math.min(10, score));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function writeStableJson(path: string, output: Record<string, unknown>) {
  const stableOutput = preserveGeneratedAt(path, output);
  evidencePackWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function preserveGeneratedAt(path: string, output: Record<string, unknown>) {
  if (!evidencePackExistsSync(path)) return output;
  const existing = JSON.parse(evidencePackReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const comparable = { ...existing, generated_at: output.generated_at };
  if (JSON.stringify(comparable) === JSON.stringify(output)) {
    return { ...output, generated_at: existing.generated_at };
  }
  return output;
}

evidencePackMain();
}
