import { scoreConstraint } from "@/lib/scoring";
import type {
  ConstraintCategory,
  ConstraintIntelligenceObject,
  OpportunityType,
  RecordOrigin,
  ScoredConstraint,
  SortOption
} from "@/types/constraint";

export type DecisionFilter =
  | "All"
  | "AI-solvable"
  | "Low-complexity / high-impact"
  | "Under-validated"
  | "Under-measured";

export function getConstraintsWithScores(
  constraints: ConstraintIntelligenceObject[]
): ScoredConstraint[] {
  return constraints.map((constraint) => ({
    ...constraint,
    scores: scoreConstraint(constraint)
  }));
}

export function categoryOptions(
  constraints: ScoredConstraint[]
): ConstraintCategory[] {
  return Array.from(new Set(constraints.map((constraint) => constraint.category))).sort();
}

export function opportunityTypeOptions(
  constraints: ScoredConstraint[]
): OpportunityType[] {
  return Array.from(
    new Set(constraints.map((constraint) => constraint.opportunity_type))
  ).sort();
}

export function sortAndFilterConstraints(
  constraints: ScoredConstraint[],
  category: ConstraintCategory | "All",
  origin: RecordOrigin | "All",
  opportunityType: OpportunityType | "All",
  decisionFilter: DecisionFilter,
  sortBy: SortOption
): ScoredConstraint[] {
  return constraints
    .filter((constraint) => category === "All" || constraint.category === category)
    .filter((constraint) => origin === "All" || constraint.origin === origin)
    .filter(
      (constraint) =>
        opportunityType === "All" || constraint.opportunity_type === opportunityType
    )
    .filter((constraint) => matchesDecisionFilter(constraint, decisionFilter))
    .sort((first, second) => second.scores[sortBy] - first.scores[sortBy]);
}

function matchesDecisionFilter(
  constraint: ScoredConstraint,
  decisionFilter: DecisionFilter
) {
  if (decisionFilter === "AI-solvable") {
    return constraint.scores.ai_readiness_score >= 7;
  }

  if (decisionFilter === "Low-complexity / high-impact") {
    return (
      constraint.implementation_complexity <= 6 &&
      constraint.scores.downstream_impact_score >= 7
    );
  }

  if (decisionFilter === "Under-validated") {
    return constraint.scores.validation_confidence_score < 7;
  }

  if (decisionFilter === "Under-measured") {
    return constraint.measurement_difficulty >= 6 || constraint.data_availability < 7;
  }

  return true;
}
