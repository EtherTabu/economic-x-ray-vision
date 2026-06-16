import { ValidationWorkbench } from "@/components/ValidationWorkbench";
import { constraintRegistry } from "@/data/constraintRegistry";
import { getConstraintsWithScores } from "@/lib/constraints";
import { buildValidationTaskPortfolio } from "@/lib/validationTasks";
import { buildValidationTriagePortfolio } from "@/lib/validationTriage";

export default function ValidationPage() {
  const scoredConstraints = getConstraintsWithScores(constraintRegistry);
  const portfolio = buildValidationTaskPortfolio(scoredConstraints);
  const triage = buildValidationTriagePortfolio(portfolio.tasks);

  return <ValidationWorkbench portfolio={portfolio} triage={triage} />;
}
