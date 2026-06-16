import { ValidationWorkbench } from "@/components/ValidationWorkbench";
import { constraintRegistry } from "@/data/constraintRegistry";
import { getConstraintsWithScores } from "@/lib/constraints";
import { buildValidationTaskPortfolio } from "@/lib/validationTasks";

export default function ValidationPage() {
  const scoredConstraints = getConstraintsWithScores(constraintRegistry);
  const portfolio = buildValidationTaskPortfolio(scoredConstraints);

  return <ValidationWorkbench portfolio={portfolio} />;
}
