import { ConstraintComparisonWorkspace } from "@/components/ConstraintComparisonWorkspace";
import { constraintRegistry } from "@/data/constraintRegistry";
import { buildConstraintComparisonPortfolio } from "@/lib/constraintComparison";
import { getConstraintsWithScores } from "@/lib/constraints";

export default function ComparePage() {
  const scoredConstraints = getConstraintsWithScores(constraintRegistry);
  const portfolio = buildConstraintComparisonPortfolio(scoredConstraints);

  return <ConstraintComparisonWorkspace portfolio={portfolio} />;
}
