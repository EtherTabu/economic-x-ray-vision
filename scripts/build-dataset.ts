type DatasetFsModule = typeof import("node:fs");
type DatasetPathModule = typeof import("node:path");

const {
  existsSync: datasetExistsSync,
  mkdirSync: datasetMkdirSync,
  readFileSync: datasetReadFileSync,
  writeFileSync: datasetWriteFileSync
} = process.getBuiltinModule("fs") as DatasetFsModule;
const {
  dirname: datasetDirname,
  resolve: datasetResolve
} = process.getBuiltinModule("path") as DatasetPathModule;

type RawRecord = Record<string, unknown> & {
  id: string;
  origin: "seed" | "intake";
  category: string;
  opportunity_type: string;
  validation_status: string;
  evidence_strength: string;
  source_type: string;
  evidence: string[];
  sources: string[];
  validation_notes: string[];
  evidence_gaps: string[];
  upstream_constraints: string[];
  downstream_constraints: string[];
  related_processes: string[];
  affected_systems: string[];
  solution_hypotheses: string[];
  time_waste: number;
  capital_waste: number;
  labor_waste: number;
  growth_trend: "Decreasing" | "Stable" | "Increasing";
  digital_solution_potential: number;
  automation_potential: number;
  ai_potential: number;
  implementation_complexity: number;
  regulatory_complexity: number;
  adoption_complexity: number;
  confidence: number;
  source_quality: number;
  measurement_difficulty: number;
  data_availability: number;
  visibility_score: number;
  overlooked_score: number;
};

type ScoredRawRecord = RawRecord & {
  scores: Record<string, number>;
};

const datasetOutputPath = datasetResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const datasetEvidenceOutputPath = datasetResolve("data/exports/evidence_dossiers.json");

function buildDatasetSnapshot() {
  const records = loadCurrentRegistry();
  const scoredRecords = records.map((record) => ({
    ...record,
    scores: scoreRecord(record)
  }));
  const datasetQualitySummary = qualitySummary(scoredRecords);

  return {
    generated_at: new Date().toISOString(),
    record_count: scoredRecords.length,
    records: scoredRecords,
    dataset_summary: {
      seed_records: scoredRecords.filter((record) => record.origin === "seed").length,
      intake_records: scoredRecords.filter((record) => record.origin === "intake").length,
      category_distribution: distribution(scoredRecords.map((record) => record.category)),
      opportunity_type_distribution: distribution(
        scoredRecords.map((record) => record.opportunity_type)
      ),
      evidence_dossier_summary: readEvidenceDossierSummary()
    },
    score_summary: scoreSummary(scoredRecords),
    quality_summary: datasetQualitySummary
  };
}

function readEvidenceDossierSummary() {
  if (!datasetExistsSync(datasetEvidenceOutputPath)) {
    return null;
  }

  const evidenceExport = JSON.parse(
    datasetReadFileSync(datasetEvidenceOutputPath, "utf8")
  ) as { validation_summary?: unknown };

  return evidenceExport.validation_summary ?? null;
}

function writeDatasetSnapshot() {
  const snapshot = buildDatasetSnapshot();
  datasetMkdirSync(datasetDirname(datasetOutputPath), { recursive: true });
  datasetWriteFileSync(datasetOutputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(
    `Built dataset snapshot with ${snapshot.record_count} records at ${datasetOutputPath}.`
  );
  return snapshot;
}

function loadCurrentRegistry() {
  const seedSource = datasetReadFileSync(
    datasetResolve("src/data/healthcareConstraints.ts"),
    "utf8"
  );
  const intakeSource = datasetReadFileSync(
    datasetResolve("src/data/generated/intakeConstraints.ts"),
    "utf8"
  );

  return [
    ...extractArray(seedSource, "healthcareConstraints"),
    ...extractArray(intakeSource, "intakeConstraints")
  ] as RawRecord[];
}

function extractArray(source: string, exportName: string) {
  const marker = `export const ${exportName}:`;
  const markerIndex = source.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error(`Could not find ${exportName} export.`);
  }

  const arrayStart = source.indexOf("[", markerIndex);
  const arrayEnd = source.lastIndexOf("];");

  if (arrayStart === -1 || arrayEnd === -1 || arrayEnd <= arrayStart) {
    throw new Error(`Could not parse ${exportName} array.`);
  }

  const arrayLiteral = source.slice(arrayStart, arrayEnd + 1);
  return Function(`"use strict"; return (${arrayLiteral});`)() as unknown[];
}

function qualitySummary(records: ScoredRawRecord[]) {
  const missingEvidence = missingFields(records, [
    "evidence",
    "sources",
    "validation_notes",
    "evidence_gaps"
  ]);
  const missingRelationships = missingFields(records, [
    "upstream_constraints",
    "downstream_constraints",
    "related_processes",
    "affected_systems",
    "solution_hypotheses"
  ]);
  const lowValidation = records
    .filter((record) => record.scores.validation_confidence_score < 7)
    .map((record) => record.id);
  const highStrategic = records
    .filter((record) => record.scores.total_strategic_score >= 8)
    .map((record) => record.id);
  const highOpportunityWeakEvidence = records
    .filter(
      (record) =>
        record.scores.opportunity_score >= 7 && record.scores.evidence_score < 7
    )
    .map((record) => record.id);
  const invalidMetadata = records
    .filter(
      (record) =>
        record.evidence.length === 0 ||
        record.sources.length === 0 ||
        record.evidence_strength.length === 0 ||
        record.source_type.length === 0 ||
        record.validation_status.length === 0
    )
    .map((record) => record.id);
  const validationCoverage = round(
    (records.filter((record) => record.scores.validation_confidence_score >= 7)
      .length /
      records.length) *
      10
  );
  const evidenceCompleteness = completenessScore(missingEvidence, records.length, 4);
  const relationshipCompleteness = completenessScore(
    missingRelationships,
    records.length,
    5
  );

  return {
    total_records: records.length,
    seed_records: records.filter((record) => record.origin === "seed").length,
    intake_records: records.filter((record) => record.origin === "intake").length,
    data_quality_score: round(
      evidenceCompleteness * 0.35 +
        relationshipCompleteness * 0.3 +
        validationCoverage * 0.25 +
        ((records.length - invalidMetadata.length) / records.length) * 10 * 0.1
    ),
    validation_coverage_score: validationCoverage,
    evidence_completeness_score: evidenceCompleteness,
    relationship_completeness_score: relationshipCompleteness,
    records_needing_validation: records
      .filter(
        (record) =>
          record.validation_status !== "Validated" ||
          record.scores.validation_confidence_score < 7
      )
      .map((record) => record.id),
    strongest_under_validated_opportunity: strongestUnderValidated(records).id,
    missing_evidence_fields: missingEvidence,
    missing_relationship_fields: missingRelationships,
    low_validation_confidence_records: lowValidation,
    high_strategic_score_records: highStrategic,
    high_opportunity_weak_evidence_records: highOpportunityWeakEvidence,
    duplicate_ids: duplicateIds(records),
    invalid_source_evidence_metadata: invalidMetadata,
    category_distribution: distribution(records.map((record) => record.category)),
    opportunity_type_distribution: distribution(
      records.map((record) => record.opportunity_type)
    ),
    score_range_summary: scoreSummary(records)
  };
}

function scoreRecord(record: RawRecord) {
  const severity_score = round(
    record.time_waste * 0.3 +
      record.capital_waste * 0.3 +
      record.labor_waste * 0.3 +
      trendBoost(record.growth_trend)
  );
  const solvability_score = round(
    record.digital_solution_potential * 0.35 +
      record.automation_potential * 0.25 +
      invertComplexity(
        record.implementation_complexity,
        record.regulatory_complexity,
        record.adoption_complexity
      ) *
        0.4
  );
  const ai_readiness_score = round(
    record.ai_potential * 0.45 +
      record.digital_solution_potential * 0.25 +
      record.confidence * 0.15 +
      invertComplexity(record.regulatory_complexity) * 0.15
  );
  const overlooked_opportunity_score = round(
    record.overlooked_score * 0.45 +
      (11 - record.visibility_score) * 0.25 +
      severity_score * 0.2 +
      solvability_score * 0.1
  );
  const evidence_score = round(
    evidenceStrengthValue(record.evidence_strength) * 0.35 +
      record.source_quality * 0.35 +
      validationStatusValue(record.validation_status) * 0.2 +
      record.confidence * 0.1
  );
  const measurability_score = round(
    record.data_availability * 0.45 +
      invertComplexity(record.measurement_difficulty) * 0.35 +
      record.source_quality * 0.2
  );
  const validation_confidence_score = round(
    evidence_score * 0.4 +
      measurability_score * 0.25 +
      record.confidence * 0.2 +
      validationStatusValue(record.validation_status) * 0.15
  );
  const constraint_density_score = round(
    Math.min(
      10,
      2 +
        record.upstream_constraints.length * 1.2 +
        record.downstream_constraints.length * 1.5 +
        record.related_processes.length * 0.8 +
        record.affected_systems.length * 0.7
    )
  );
  const downstream_impact_score = round(
    severity_score * 0.35 +
      record.downstream_constraints.length * 0.9 +
      record.affected_systems.length * 0.55 +
      record.capital_waste * 0.1 +
      record.labor_waste * 0.1
  );
  const opportunity_score = round(
    solvability_score * 0.28 +
      ai_readiness_score * 0.22 +
      record.digital_solution_potential * 0.14 +
      record.automation_potential * 0.14 +
      validation_confidence_score * 0.12 +
      opportunityTypeBoost(record.opportunity_type)
  );
  const total_priority_score = round(
    (severity_score * 0.35 +
      solvability_score * 0.25 +
      ai_readiness_score * 0.15 +
      overlooked_opportunity_score * 0.25) *
      0.85 +
      validation_confidence_score * 0.15
  );
  const total_strategic_score = round(
    downstream_impact_score * 0.3 +
      constraint_density_score * 0.25 +
      opportunity_score * 0.3 +
      total_priority_score * 0.15
  );

  return {
    severity_score: clampScore(severity_score),
    solvability_score: clampScore(solvability_score),
    ai_readiness_score: clampScore(ai_readiness_score),
    overlooked_opportunity_score: clampScore(overlooked_opportunity_score),
    evidence_score: clampScore(evidence_score),
    measurability_score: clampScore(measurability_score),
    validation_confidence_score: clampScore(validation_confidence_score),
    constraint_density_score: clampScore(constraint_density_score),
    downstream_impact_score: clampScore(downstream_impact_score),
    opportunity_score: clampScore(opportunity_score),
    total_strategic_score: clampScore(total_strategic_score),
    total_priority_score: clampScore(total_priority_score)
  };
}

function scoreSummary(records: ScoredRawRecord[]) {
  const keys = Object.keys(records[0].scores);
  return Object.fromEntries(
    keys.map((key) => {
      const values = records.map((record) => record.scores[key]);
      return [
        key,
        {
          min: round(Math.min(...values)),
          max: round(Math.max(...values)),
          average: round(values.reduce((total, value) => total + value, 0) / values.length)
        }
      ];
    })
  );
}

function missingFields(records: ScoredRawRecord[], fields: string[]) {
  return Object.fromEntries(
    records
      .map((record) => [
        record.id,
        fields.filter((field) => {
          const value = record[field];
          return Array.isArray(value)
            ? value.length === 0
            : typeof value !== "string" || value.trim().length === 0;
        })
      ])
      .filter(([, missing]) => (missing as string[]).length > 0)
  );
}

function strongestUnderValidated(records: ScoredRawRecord[]) {
  return records.reduce((top, record) => {
    const recordScore =
      record.scores.total_strategic_score +
      (11 - record.scores.validation_confidence_score);
    const topScore =
      top.scores.total_strategic_score + (11 - top.scores.validation_confidence_score);

    return recordScore > topScore ? record : top;
  });
}

function duplicateIds(records: ScoredRawRecord[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  records.forEach((record) => {
    if (seen.has(record.id)) {
      duplicates.add(record.id);
    }

    seen.add(record.id);
  });

  return Array.from(duplicates);
}

function distribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function completenessScore(missing: Record<string, string[]>, total: number, fields: number) {
  const missingCount = Object.values(missing).reduce(
    (sum, values) => sum + values.length,
    0
  );
  return round(10 - (missingCount / (total * fields)) * 10);
}

function invertComplexity(...values: number[]) {
  return 11 - values.reduce((sum, value) => sum + value, 0) / values.length;
}

function trendBoost(trend: RawRecord["growth_trend"]) {
  return trend === "Increasing" ? 0.9 : trend === "Stable" ? 0.5 : 0.1;
}

function evidenceStrengthValue(strength: string) {
  return strength === "High" ? 9 : strength === "Moderate" ? 6 : 3;
}

function validationStatusValue(status: string) {
  if (status === "Validated") return 9;
  if (status === "Partially Validated") return 7;
  if (status === "Plausible") return 5;
  return 2;
}

function opportunityTypeBoost(type: string) {
  if (type === "Automation") return 1;
  if (type === "Data Quality") return 0.8;
  if (type === "Workflow Redesign") return 0.7;
  if (type === "Capacity Optimization") return 0.6;
  return 0.5;
}

function clampScore(score: number) {
  return Math.max(1, Math.min(10, score));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

module.exports = {
  buildDatasetSnapshot,
  writeDatasetSnapshot
};

if (require.main === module) {
  writeDatasetSnapshot();
}
