import {
  archetypeById,
  constraintArchetypes
} from "@/lib/constraintArchetypes";
import {
  findCrossIndustryAnalogs,
  type CrossIndustryAnalog
} from "@/lib/crossIndustryAnalogs";
import { buildInterventionStrategies } from "@/lib/interventionSimulator";
import type {
  ConstraintArchetypeId,
  ScoredConstraint
} from "@/types/constraint";

export type ArchetypeSummary = {
  archetype_id: ConstraintArchetypeId;
  display_name: string;
  definition: string;
  record_count: number;
  affected_industries: string[];
  top_constraints: string[];
  average_priority_score: number;
  average_validation_confidence: number;
  average_intervention_priority: number;
  validation_risk: string;
  common_evidence_needed: string[];
  common_interventions: string[];
  validation_risks: string[];
  why_the_pattern_matters: string;
};

export type ArchetypePortfolio = {
  total_archetypes_detected: number;
  archetype_distribution: Record<string, number>;
  industry_distribution: Record<string, number>;
  highest_priority_archetype: ArchetypeSummary;
  most_widespread_archetype: ArchetypeSummary;
  most_under_validated_archetype: ArchetypeSummary;
  highest_intervention_opportunity_archetype: ArchetypeSummary;
  archetype_summaries: ArchetypeSummary[];
  cross_industry_analogs: CrossIndustryAnalog[];
};

export function analyzeArchetypes(
  constraints: ScoredConstraint[]
): ArchetypePortfolio {
  const strategies = buildInterventionStrategies(constraints);
  const strategyByConstraint = new Map(
    strategies.map((strategy) => [strategy.constraint_id, strategy])
  );
  const summaries = constraintArchetypes
    .map((archetype) => {
      const records = constraints.filter((constraint) =>
        [constraint.primary_archetype, ...constraint.secondary_archetypes].includes(
          archetype.archetype_id
        )
      );

      if (records.length === 0) {
        return null;
      }

      const interventionScores = records.map(
        (record) =>
          strategyByConstraint.get(record.id)?.intervention_priority_score ?? 0
      );
      const affectedIndustries = unique(records.map((record) => record.industry));
      const averageValidation = average(
        records.map((record) => record.scores.validation_confidence_score)
      );

      return {
        archetype_id: archetype.archetype_id,
        display_name: archetype.display_name,
        definition: archetype.plain_english_definition,
        record_count: records.length,
        affected_industries: affectedIndustries,
        top_constraints: records
          .slice()
          .sort(
            (first, second) =>
              second.scores.total_priority_score - first.scores.total_priority_score
          )
          .slice(0, 5)
          .map((record) => record.title),
        average_priority_score: average(
          records.map((record) => record.scores.total_priority_score)
        ),
        average_validation_confidence: averageValidation,
        average_intervention_priority: average(interventionScores),
        validation_risk:
          averageValidation < 6.5
            ? "Under-validated pattern; use for hypothesis generation before action."
            : "Moderate validation signal; compare local measures before scaling interventions.",
        common_evidence_needed: archetype.common_evidence_needed,
        common_interventions: archetype.common_interventions,
        validation_risks: archetype.validation_risks,
        why_the_pattern_matters: `${archetype.display_name} appears across ${affectedIndustries.length} industry group${affectedIndustries.length === 1 ? "" : "s"}, which suggests a reusable constraint pattern rather than a sector-only issue.`
      } satisfies ArchetypeSummary;
    })
    .filter((summary): summary is ArchetypeSummary => summary !== null)
    .sort((first, second) => second.record_count - first.record_count);

  const crossIndustryAnalogs = findCrossIndustryAnalogs(constraints, 12);

  return {
    total_archetypes_detected: summaries.length,
    archetype_distribution: distribution(
      constraints.map((constraint) => constraint.primary_archetype)
    ),
    industry_distribution: distribution(
      constraints.map((constraint) => constraint.industry)
    ),
    highest_priority_archetype: topBy(
      summaries,
      (summary) => summary.average_priority_score
    ),
    most_widespread_archetype: topBy(
      summaries,
      (summary) => summary.affected_industries.length
    ),
    most_under_validated_archetype: topBy(
      summaries,
      (summary) => 11 - summary.average_validation_confidence
    ),
    highest_intervention_opportunity_archetype: topBy(
      summaries,
      (summary) => summary.average_intervention_priority
    ),
    archetype_summaries: summaries,
    cross_industry_analogs: crossIndustryAnalogs
  };
}

export function getArchetypeLabel(archetypeId: ConstraintArchetypeId) {
  return archetypeById[archetypeId]?.display_name ?? archetypeId.replaceAll("_", " ");
}

function topBy(
  summaries: ArchetypeSummary[],
  selector: (summary: ArchetypeSummary) => number
) {
  return summaries
    .slice()
    .sort((first, second) => selector(second) - selector(first))[0];
}

function distribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function average(values: number[]) {
  return round(values.reduce((total, value) => total + value, 0) / values.length);
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
