import type {
  ConstraintArchetypeId,
  ScoredConstraint
} from "@/types/constraint";

export type CrossIndustryAnalog = {
  source_constraint_id: string;
  source_constraint_title: string;
  source_industry: string;
  analog_constraint_id: string;
  analog_constraint_title: string;
  analog_industry: string;
  shared_archetypes: ConstraintArchetypeId[];
  shared_affected_systems: string[];
  shared_intervention_types: string[];
  similarity_score: number;
  why_the_analog_matters: string;
  what_can_be_learned: string;
  validation_risk: string;
};

export function findCrossIndustryAnalogs(
  constraints: ScoredConstraint[],
  limit = 12
): CrossIndustryAnalog[] {
  const pairs: CrossIndustryAnalog[] = [];

  for (let sourceIndex = 0; sourceIndex < constraints.length; sourceIndex += 1) {
    for (
      let analogIndex = sourceIndex + 1;
      analogIndex < constraints.length;
      analogIndex += 1
    ) {
      const source = constraints[sourceIndex];
      const analog = constraints[analogIndex];

      if (source.industry === analog.industry) {
        continue;
      }

      const pair = buildAnalog(source, analog);

      if (pair.similarity_score >= 4.5) {
        pairs.push(pair);
      }
    }
  }

  return pairs
    .sort((first, second) => second.similarity_score - first.similarity_score)
    .slice(0, limit);
}

export function findAnalogsForConstraint(
  constraint: ScoredConstraint,
  constraints: ScoredConstraint[],
  limit = 3
) {
  return constraints
    .filter((candidate) => candidate.id !== constraint.id)
    .filter((candidate) => candidate.industry !== constraint.industry)
    .map((candidate) => buildAnalog(constraint, candidate))
    .filter((analog) => analog.similarity_score >= 4.5)
    .sort((first, second) => second.similarity_score - first.similarity_score)
    .slice(0, limit);
}

function buildAnalog(
  source: ScoredConstraint,
  analog: ScoredConstraint
): CrossIndustryAnalog {
  const sharedArchetypes = intersection(
    archetypeSignature(source),
    archetypeSignature(analog)
  );
  const sharedSystems = intersection(
    normalizedTerms(source.affected_systems),
    normalizedTerms(analog.affected_systems)
  );
  const sharedInterventions = intersection(
    interventionHints(source),
    interventionHints(analog)
  );
  const score = round(
    Math.min(
      10,
      sharedArchetypes.length * 2.8 +
        sharedSystems.length * 0.8 +
        sharedInterventions.length * 1.1 +
        (source.category === analog.category ? 0.8 : 0) +
        (source.opportunity_type === analog.opportunity_type ? 0.7 : 0) +
        scoreProximity(source, analog)
    )
  );
  const strongestSharedArchetype =
    sharedArchetypes[0] ?? source.primary_archetype;

  return {
    source_constraint_id: source.id,
    source_constraint_title: source.title,
    source_industry: source.industry,
    analog_constraint_id: analog.id,
    analog_constraint_title: analog.title,
    analog_industry: analog.industry,
    shared_archetypes: sharedArchetypes,
    shared_affected_systems: sharedSystems,
    shared_intervention_types: sharedInterventions,
    similarity_score: score,
    why_the_analog_matters: `${source.title} and ${analog.title} both express ${strongestSharedArchetype.replaceAll("_", " ")} through different sector workflows.`,
    what_can_be_learned: `Compare how ${source.industry} and ${analog.industry} measure queue age, handoffs, evidence gaps, and bounded interventions for the same bottleneck pattern.`,
    validation_risk:
      source.scores.validation_confidence_score < 7 ||
      analog.scores.validation_confidence_score < 7
        ? "One or both records are still under-validated; treat the analog as a hypothesis generator."
        : "Both records have enough validation signal for stronger comparative analysis."
  };
}

function archetypeSignature(constraint: ScoredConstraint) {
  return [constraint.primary_archetype, ...constraint.secondary_archetypes];
}

function interventionHints(constraint: ScoredConstraint) {
  const hints = new Set<string>();

  if (constraint.opportunity_type === "Automation") hints.add("automation_assist");
  if (constraint.opportunity_type === "Data Quality") hints.add("data_integration");
  if (constraint.opportunity_type === "Capacity Optimization") hints.add("queue_triage");
  if (constraint.category === "Manual Verification") hints.add("data_integration");
  if (constraint.category === "Duplicated Work") hints.add("standardization");
  if (constraint.category === "Compliance Drag") hints.add("policy_simplification");
  if (constraint.scores.validation_confidence_score < 7) hints.add("evidence_collection");

  return Array.from(hints);
}

function normalizedTerms(values: string[]) {
  return values
    .map((value) => value.toLowerCase())
    .map((value) => value.replace(/\b(system|portal|workflow|platform)\b/g, "").trim())
    .filter(Boolean);
}

function intersection<T>(first: T[], second: T[]) {
  const secondSet = new Set(second);
  return Array.from(new Set(first.filter((value) => secondSet.has(value))));
}

function scoreProximity(source: ScoredConstraint, analog: ScoredConstraint) {
  const priorityGap = Math.abs(
    source.scores.total_priority_score - analog.scores.total_priority_score
  );
  const strategicGap = Math.abs(
    source.scores.total_strategic_score - analog.scores.total_strategic_score
  );

  return Math.max(0, 1.8 - (priorityGap + strategicGap) * 0.15);
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
