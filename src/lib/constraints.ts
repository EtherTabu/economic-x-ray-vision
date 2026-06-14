import { scoreConstraint } from "@/lib/scoring";
import type {
  ConstraintCategory,
  ConstraintIntelligenceObject,
  RecordOrigin,
  ScoredConstraint,
  SortOption
} from "@/types/constraint";

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

export function sortAndFilterConstraints(
  constraints: ScoredConstraint[],
  category: ConstraintCategory | "All",
  origin: RecordOrigin | "All",
  sortBy: SortOption
): ScoredConstraint[] {
  return constraints
    .filter((constraint) => category === "All" || constraint.category === category)
    .filter((constraint) => origin === "All" || constraint.origin === origin)
    .sort((first, second) => second.scores[sortBy] - first.scores[sortBy]);
}
