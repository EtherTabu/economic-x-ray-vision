type EvidenceImportAuditFsModule = typeof import("node:fs");
type EvidenceImportAuditPathModule = typeof import("node:path");

const {
  existsSync: evidenceImportAuditExistsSync,
  mkdirSync: evidenceImportAuditMkdirSync,
  readFileSync: evidenceImportAuditReadFileSync,
  writeFileSync: evidenceImportAuditWriteFileSync
} = process.getBuiltinModule("fs") as EvidenceImportAuditFsModule;
const {
  dirname: evidenceImportAuditDirname,
  resolve: evidenceImportAuditResolve
} = process.getBuiltinModule("path") as EvidenceImportAuditPathModule;

const evidenceImportAuditRegistryPath = evidenceImportAuditResolve(
  "data/exports/evidence_import_registry.json"
);
const evidenceImportAuditOutputPath = evidenceImportAuditResolve(
  "data/exports/evidence_import_audit.json"
);

type EvidenceImportAuditRegistry = {
  import_count: number;
  summary: {
    total_evidence_imports: number;
    imports_by_collection_status: Record<string, number>;
    imports_by_review_status: Record<string, number>;
    imports_by_provenance_status: Record<string, number>;
    linked_constraints: number;
    linked_artifacts: number;
    orphan_imports: number;
    imports_with_missing_required_metadata: number;
    artifact_needs_with_matching_imported_evidence: number;
    artifact_needs_still_uncovered: number;
    top_validation_packets_with_imported_evidence_coverage: Array<{
      packet_id: string;
      coverage_status: string;
    }>;
  };
  imports: Array<{
    evidence_id: string;
    title: string;
    collection_status: string;
    review_status: string;
    validation_errors: string[];
  }>;
};

const evidenceImportAuditRegistry = JSON.parse(
  evidenceImportAuditReadFileSync(evidenceImportAuditRegistryPath, "utf8")
) as EvidenceImportAuditRegistry;
const evidenceImportAuditFailures: string[] = [];
const evidenceImportAuditImports = evidenceImportAuditRegistry.imports;
const evidenceImportAuditCompletedWithoutMetadata = evidenceImportAuditImports.filter(
  (evidence) =>
    ["collected", "needs_review"].includes(evidence.collection_status) &&
    evidence.validation_errors.length > 0
);
const evidenceImportAuditReviewedWithoutMetadata = evidenceImportAuditImports.filter(
  (evidence) =>
    ["reviewed", "accepted", "rejected", "needs_followup"].includes(
      evidence.review_status
    ) && evidence.validation_errors.length > 0
);
const evidenceImportAuditAcceptedImports = evidenceImportAuditImports.filter(
  (evidence) => evidence.review_status === "accepted"
);

if (
  evidenceImportAuditRegistry.import_count !==
  evidenceImportAuditRegistry.summary.total_evidence_imports
) {
  evidenceImportAuditFailures.push("registry import count does not match summary");
}
if (evidenceImportAuditRegistry.summary.imports_with_missing_required_metadata > 0) {
  evidenceImportAuditFailures.push("one or more imports has missing metadata");
}
if (evidenceImportAuditCompletedWithoutMetadata.length > 0) {
  evidenceImportAuditFailures.push(
    "one or more collected imports lacks required collection metadata"
  );
}
if (evidenceImportAuditReviewedWithoutMetadata.length > 0) {
  evidenceImportAuditFailures.push(
    "one or more reviewed imports lacks required review metadata"
  );
}
if (evidenceImportAuditAcceptedImports.length > 0) {
  evidenceImportAuditFailures.push(
    "accepted imports are not expected until a real review workflow exists"
  );
}

const evidenceImportAuditOutput = {
  generated_at: new Date().toISOString(),
  result: evidenceImportAuditFailures.length === 0 ? "PASS" : "FAIL",
  summary: evidenceImportAuditRegistry.summary,
  failures: evidenceImportAuditFailures
};

evidenceImportAuditMkdirSync(evidenceImportAuditDirname(evidenceImportAuditOutputPath), {
  recursive: true
});
evidenceImportAuditWriteStableJson(
  evidenceImportAuditOutputPath,
  evidenceImportAuditOutput
);

console.log("Evidence import audit");
console.log(`- total evidence imports: ${evidenceImportAuditRegistry.import_count}`);
console.log(
  `- collection statuses: ${evidenceImportAuditFormatDistribution(
    evidenceImportAuditRegistry.summary.imports_by_collection_status
  )}`
);
console.log(
  `- review statuses: ${evidenceImportAuditFormatDistribution(
    evidenceImportAuditRegistry.summary.imports_by_review_status
  )}`
);
console.log(
  `- provenance statuses: ${evidenceImportAuditFormatDistribution(
    evidenceImportAuditRegistry.summary.imports_by_provenance_status
  )}`
);
console.log(`- linked constraints: ${evidenceImportAuditRegistry.summary.linked_constraints}`);
console.log(`- linked artifacts: ${evidenceImportAuditRegistry.summary.linked_artifacts}`);
console.log(`- orphan imports: ${evidenceImportAuditRegistry.summary.orphan_imports}`);
console.log(
  `- artifact needs with matching imported evidence: ${evidenceImportAuditRegistry.summary.artifact_needs_with_matching_imported_evidence}`
);
console.log(
  `- artifact needs still uncovered: ${evidenceImportAuditRegistry.summary.artifact_needs_still_uncovered}`
);

if (evidenceImportAuditFailures.length > 0) {
  console.error("- evidence import audit failures:");
  evidenceImportAuditFailures.forEach((failure) => console.error(`  - ${failure}`));
  process.exitCode = 1;
} else {
  console.log("- result: PASS");
}

function evidenceImportAuditFormatDistribution(values: Record<string, number>) {
  return Object.entries(values)
    .map(([label, count]) => `${label} (${count})`)
    .join(", ");
}

function evidenceImportAuditWriteStableJson(
  path: string,
  output: Record<string, unknown>
) {
  const stableOutput = evidenceImportAuditPreserveGeneratedAt(path, output);
  evidenceImportAuditWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function evidenceImportAuditPreserveGeneratedAt(
  path: string,
  output: Record<string, unknown>
) {
  if (!evidenceImportAuditExistsSync(path)) return output;
  const existing = JSON.parse(evidenceImportAuditReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const comparable = { ...existing, generated_at: output.generated_at };
  if (JSON.stringify(comparable) === JSON.stringify(output)) {
    return { ...output, generated_at: existing.generated_at };
  }
  return output;
}
