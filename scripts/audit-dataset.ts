type AuditModule = typeof import("node:module");

const { createRequire: auditCreateRequire } = process.getBuiltinModule(
  "module"
) as AuditModule;
const auditRequire = auditCreateRequire(__filename);
const { buildDatasetSnapshot: auditBuildDatasetSnapshot } = auditRequire(
  "./build-dataset.ts"
) as {
  buildDatasetSnapshot: () => {
    quality_summary: {
      total_records: number;
      seed_records: number;
      intake_records: number;
      data_quality_score: number;
      validation_coverage_score: number;
      evidence_completeness_score: number;
      relationship_completeness_score: number;
      duplicate_ids: string[];
      records_needing_validation: string[];
      high_opportunity_weak_evidence_records: string[];
    };
  };
};

const snapshot = auditBuildDatasetSnapshot();
const quality = snapshot.quality_summary;

console.log("Dataset audit");
console.log(`- total records: ${quality.total_records}`);
console.log(`- seed records: ${quality.seed_records}`);
console.log(`- intake records: ${quality.intake_records}`);
console.log(`- data quality score: ${quality.data_quality_score}`);
console.log(`- validation coverage: ${quality.validation_coverage_score}`);
console.log(`- evidence completeness: ${quality.evidence_completeness_score}`);
console.log(`- relationship completeness: ${quality.relationship_completeness_score}`);
console.log(`- duplicate ids: ${quality.duplicate_ids.length}`);
console.log(`- records needing validation: ${quality.records_needing_validation.length}`);
console.log(
  `- high opportunity / weak evidence: ${quality.high_opportunity_weak_evidence_records.length}`
);

if (quality.duplicate_ids.length > 0) {
  process.exitCode = 1;
}
