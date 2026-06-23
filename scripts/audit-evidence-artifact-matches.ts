type EvidenceMatchAuditFsModule = typeof import("node:fs");
type EvidenceMatchAuditPathModule = typeof import("node:path");

const { readFileSync: evidenceMatchAuditReadFileSync } =
  process.getBuiltinModule("fs") as EvidenceMatchAuditFsModule;
const { resolve: evidenceMatchAuditResolve } = process.getBuiltinModule(
  "path"
) as EvidenceMatchAuditPathModule;

const evidenceMatchAuditPath = evidenceMatchAuditResolve(
  "data/exports/evidence_artifact_matches.json"
);
const evidenceMatchAuditArtifactPath = evidenceMatchAuditResolve(
  "data/exports/evidence_artifact_library.json"
);
const evidenceMatchAuditDatasetPath = evidenceMatchAuditResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const evidenceMatchAuditImportPath = evidenceMatchAuditResolve(
  "data/exports/evidence_import_registry.json"
);

type EvidenceMatchAuditExport = {
  summary: {
    evidence_import_count: number;
    artifact_need_count: number;
    matched_artifact_count: number;
    candidate_artifact_count: number;
    blocked_artifact_count: number;
    uncovered_artifact_count: number;
    rejected_evidence_count: number;
    artifact_coverage_distribution: Record<string, number>;
    top_validation_packet_artifact_needs: number;
    top_validation_packet_uncovered_artifacts: number;
  };
  top_validation_packet_coverage: Array<{
    packet_id: string;
    artifact_need_count: number;
    matched_artifact_count: number;
    candidate_artifact_count: number;
    blocked_artifact_count: number;
    uncovered_artifact_count: number;
  }>;
  matches: Array<{
    match_id: string;
    artifact_id: string;
    constraint_id: string;
    coverage_status: string;
    collection_status: string;
    review_status: string;
  }>;
  artifact_coverage: Array<{
    artifact_id: string;
    constraint_id: string;
    coverage_status: string;
    match_count: number;
    generated_artifact_status: string;
  }>;
};

const evidenceMatchAuditExport = JSON.parse(
  evidenceMatchAuditReadFileSync(evidenceMatchAuditPath, "utf8")
) as EvidenceMatchAuditExport;
const evidenceMatchAuditArtifactExport = JSON.parse(
  evidenceMatchAuditReadFileSync(evidenceMatchAuditArtifactPath, "utf8")
) as { artifacts: Array<{ artifact_id: string; status: string }> };
const evidenceMatchAuditDataset = JSON.parse(
  evidenceMatchAuditReadFileSync(evidenceMatchAuditDatasetPath, "utf8")
) as { records: Array<{ id: string }> };
const evidenceMatchAuditImports = JSON.parse(
  evidenceMatchAuditReadFileSync(evidenceMatchAuditImportPath, "utf8")
) as { imports: Array<{ evidence_id: string; tags: string[]; import_file: string }> };

const evidenceMatchAuditFailures: string[] = [];
const evidenceMatchAuditArtifactIds = new Set(
  evidenceMatchAuditArtifactExport.artifacts.map((artifact) => artifact.artifact_id)
);
const evidenceMatchAuditConstraintIds = new Set(
  evidenceMatchAuditDataset.records.map((record) => record.id)
);
const evidenceMatchAuditMatchIds = new Set<string>();
const evidenceMatchAuditDuplicateMatchIds = evidenceMatchAuditExport.matches.filter(
  (match) => {
    if (evidenceMatchAuditMatchIds.has(match.match_id)) return true;
    evidenceMatchAuditMatchIds.add(match.match_id);
    return false;
  }
);
const evidenceMatchAuditRejectedCoverage = evidenceMatchAuditExport.matches.filter(
  (match) =>
    (match.collection_status === "rejected" || match.review_status === "rejected") &&
    match.coverage_status !== "rejected_no_coverage"
);
const evidenceMatchAuditTemplateImports = evidenceMatchAuditImports.imports.filter(
  (evidence) =>
    evidence.import_file.includes("templates") || evidence.tags.includes("template")
);
const evidenceMatchAuditInvalidArtifactMatches =
  evidenceMatchAuditExport.matches.filter(
    (match) => !evidenceMatchAuditArtifactIds.has(match.artifact_id)
  );
const evidenceMatchAuditInvalidConstraintMatches =
  evidenceMatchAuditExport.matches.filter(
    (match) => !evidenceMatchAuditConstraintIds.has(match.constraint_id)
  );
const evidenceMatchAuditInvalidArtifactCoverage =
  evidenceMatchAuditExport.artifact_coverage.filter(
    (artifact) =>
      !evidenceMatchAuditArtifactIds.has(artifact.artifact_id) ||
      !evidenceMatchAuditConstraintIds.has(artifact.constraint_id)
  );
const evidenceMatchAuditMutatedArtifactStatus =
  evidenceMatchAuditExport.artifact_coverage.filter(
    (artifact) => artifact.generated_artifact_status !== "not_collected"
  );
const evidenceMatchAuditSummary = evidenceMatchAuditExport.summary;
const evidenceMatchAuditAccounted =
  evidenceMatchAuditSummary.matched_artifact_count +
  evidenceMatchAuditSummary.candidate_artifact_count +
  evidenceMatchAuditSummary.blocked_artifact_count +
  evidenceMatchAuditSummary.uncovered_artifact_count;
const evidenceMatchAuditPacketAccounted =
  evidenceMatchAuditExport.top_validation_packet_coverage.every(
    (packet) =>
      packet.artifact_need_count ===
      packet.matched_artifact_count +
        packet.candidate_artifact_count +
        packet.blocked_artifact_count +
        packet.uncovered_artifact_count
  );

console.log("Evidence artifact matching audit");
console.log(
  `- imported evidence records: ${evidenceMatchAuditSummary.evidence_import_count}`
);
console.log(`- artifact needs: ${evidenceMatchAuditSummary.artifact_need_count}`);
console.log(`- matched artifacts: ${evidenceMatchAuditSummary.matched_artifact_count}`);
console.log(
  `- candidate artifacts: ${evidenceMatchAuditSummary.candidate_artifact_count}`
);
console.log(`- blocked artifacts: ${evidenceMatchAuditSummary.blocked_artifact_count}`);
console.log(
  `- uncovered artifacts: ${evidenceMatchAuditSummary.uncovered_artifact_count}`
);
console.log(
  `- top packet uncovered artifacts: ${evidenceMatchAuditSummary.top_validation_packet_uncovered_artifacts}`
);

if (evidenceMatchAuditInvalidArtifactMatches.length > 0) {
  evidenceMatchAuditFailures.push("one or more matches references an unknown artifact");
}
if (evidenceMatchAuditInvalidConstraintMatches.length > 0) {
  evidenceMatchAuditFailures.push("one or more matches references an unknown constraint");
}
if (evidenceMatchAuditInvalidArtifactCoverage.length > 0) {
  evidenceMatchAuditFailures.push("one or more artifact coverage records is orphaned");
}
if (evidenceMatchAuditTemplateImports.length > 0) {
  evidenceMatchAuditFailures.push("template evidence entered the import registry");
}
if (evidenceMatchAuditRejectedCoverage.length > 0) {
  evidenceMatchAuditFailures.push("rejected imports are counted as coverage");
}
if (evidenceMatchAuditDuplicateMatchIds.length > 0) {
  evidenceMatchAuditFailures.push("duplicate match IDs found");
}
if (evidenceMatchAuditAccounted !== evidenceMatchAuditSummary.artifact_need_count) {
  evidenceMatchAuditFailures.push(
    "matched + candidate + blocked + uncovered artifacts do not equal artifact count"
  );
}
if (!evidenceMatchAuditPacketAccounted) {
  evidenceMatchAuditFailures.push("top validation packet artifact accounting is inconsistent");
}
if (evidenceMatchAuditMutatedArtifactStatus.length > 0) {
  evidenceMatchAuditFailures.push("generated artifact statuses were changed");
}
if (
  evidenceMatchAuditArtifactExport.artifacts.some(
    (artifact) => artifact.status !== "not_collected"
  )
) {
  evidenceMatchAuditFailures.push("artifact library contains a non-not_collected status");
}

if (evidenceMatchAuditFailures.length > 0) {
  console.error("- evidence matching audit failures:");
  evidenceMatchAuditFailures.forEach((failure) => console.error(`  - ${failure}`));
  process.exitCode = 1;
} else {
  console.log("- result: PASS");
}
