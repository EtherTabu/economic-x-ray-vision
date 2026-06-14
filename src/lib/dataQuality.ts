import type { ScoredConstraint, SortOption } from "@/types/constraint";

export type ScoreRangeSummary = Record<
  SortOption,
  {
    min: number;
    max: number;
    average: number;
  }
>;

export type DatasetQualitySummary = {
  total_records: number;
  seed_records: number;
  intake_records: number;
  data_quality_score: number;
  validation_coverage_score: number;
  evidence_completeness_score: number;
  relationship_completeness_score: number;
  records_needing_validation: string[];
  strongest_under_validated_opportunity: string;
  category_distribution: Record<string, number>;
  opportunity_type_distribution: Record<string, number>;
  score_range_summary: ScoreRangeSummary;
  missing_evidence_fields: Record<string, string[]>;
  missing_relationship_fields: Record<string, string[]>;
  low_validation_confidence_records: string[];
  high_strategic_score_records: string[];
  high_opportunity_weak_evidence_records: string[];
  duplicate_ids: string[];
  invalid_source_evidence_metadata: string[];
};

const scoreKeys: SortOption[] = [
  "severity_score",
  "solvability_score",
  "ai_readiness_score",
  "overlooked_opportunity_score",
  "evidence_score",
  "measurability_score",
  "validation_confidence_score",
  "constraint_density_score",
  "downstream_impact_score",
  "opportunity_score",
  "total_strategic_score",
  "total_priority_score"
];

export function analyzeDatasetQuality(
  constraints: ScoredConstraint[]
): DatasetQualitySummary {
  const missingEvidence = missingFields(constraints, [
    "evidence",
    "sources",
    "confidence_reasoning",
    "validation_notes",
    "evidence_gaps"
  ]);
  const missingRelationships = missingFields(constraints, [
    "upstream_constraints",
    "downstream_constraints",
    "related_processes",
    "affected_systems",
    "solution_hypotheses"
  ]);
  const lowValidation = constraints
    .filter((item) => item.scores.validation_confidence_score < 7)
    .map((item) => item.id);
  const highStrategic = constraints
    .filter((item) => item.scores.total_strategic_score >= 8)
    .map((item) => item.id);
  const highOpportunityWeakEvidence = constraints
    .filter(
      (item) =>
        item.scores.opportunity_score >= 7 && item.scores.evidence_score < 7
    )
    .map((item) => item.id);

  const evidenceCompleteness = completenessScore(missingEvidence, constraints.length, 5);
  const relationshipCompleteness = completenessScore(
    missingRelationships,
    constraints.length,
    5
  );
  const validationCoverage = percent(
    constraints.filter((item) => item.scores.validation_confidence_score >= 7).length,
    constraints.length
  );
  const metadataValidity = percent(
    constraints.length - invalidMetadata(constraints).length,
    constraints.length
  );
  const dataQuality = round(
    evidenceCompleteness * 0.3 +
      relationshipCompleteness * 0.25 +
      validationCoverage * 0.25 +
      metadataValidity * 0.2
  );

  return {
    total_records: constraints.length,
    seed_records: constraints.filter((item) => item.origin === "seed").length,
    intake_records: constraints.filter((item) => item.origin === "intake").length,
    data_quality_score: dataQuality,
    validation_coverage_score: validationCoverage,
    evidence_completeness_score: evidenceCompleteness,
    relationship_completeness_score: relationshipCompleteness,
    records_needing_validation: recordsNeedingValidation(constraints),
    strongest_under_validated_opportunity: strongestUnderValidated(constraints).id,
    category_distribution: distribution(constraints.map((item) => item.category)),
    opportunity_type_distribution: distribution(
      constraints.map((item) => item.opportunity_type)
    ),
    score_range_summary: scoreRangeSummary(constraints),
    missing_evidence_fields: missingEvidence,
    missing_relationship_fields: missingRelationships,
    low_validation_confidence_records: lowValidation,
    high_strategic_score_records: highStrategic,
    high_opportunity_weak_evidence_records: highOpportunityWeakEvidence,
    duplicate_ids: duplicateIds(constraints),
    invalid_source_evidence_metadata: invalidMetadata(constraints)
  };
}

function recordsNeedingValidation(constraints: ScoredConstraint[]) {
  return constraints
    .filter(
      (item) =>
        item.validation_status !== "Validated" ||
        item.scores.validation_confidence_score < 7
    )
    .map((item) => item.id);
}

function strongestUnderValidated(constraints: ScoredConstraint[]) {
  return constraints.reduce((top, item) => {
    const itemScore =
      item.scores.total_strategic_score +
      (11 - item.scores.validation_confidence_score);
    const topScore =
      top.scores.total_strategic_score + (11 - top.scores.validation_confidence_score);

    return itemScore > topScore ? item : top;
  });
}

function scoreRangeSummary(constraints: ScoredConstraint[]): ScoreRangeSummary {
  return Object.fromEntries(
    scoreKeys.map((key) => {
      const values = constraints.map((item) => item.scores[key]);
      return [
        key,
        {
          min: round(Math.min(...values)),
          max: round(Math.max(...values)),
          average: round(values.reduce((total, value) => total + value, 0) / values.length)
        }
      ];
    })
  ) as ScoreRangeSummary;
}

function missingFields(
  constraints: ScoredConstraint[],
  fields: Array<keyof ScoredConstraint>
) {
  return Object.fromEntries(
    constraints
      .map((constraint) => [
        constraint.id,
        fields.filter((field) => isMissing(constraint[field]))
      ])
      .filter(([, missing]) => (missing as string[]).length > 0)
  ) as Record<string, string[]>;
}

function invalidMetadata(constraints: ScoredConstraint[]) {
  return constraints
    .filter(
      (item) =>
        item.evidence_strength.length === 0 ||
        item.source_type.length === 0 ||
        item.validation_status.length === 0 ||
        item.sources.length === 0 ||
        item.evidence.length === 0
    )
    .map((item) => item.id);
}

function isMissing(value: unknown) {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return typeof value !== "string" || value.trim().length === 0;
}

function duplicateIds(constraints: ScoredConstraint[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  constraints.forEach((item) => {
    if (seen.has(item.id)) {
      duplicates.add(item.id);
    }

    seen.add(item.id);
  });

  return Array.from(duplicates);
}

function distribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function completenessScore(
  missing: Record<string, string[]>,
  recordCount: number,
  fieldCount: number
) {
  const missingCount = Object.values(missing).reduce(
    (total, fields) => total + fields.length,
    0
  );
  return round(10 - (missingCount / (recordCount * fieldCount)) * 10);
}

function percent(count: number, total: number) {
  return round((count / total) * 10);
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
