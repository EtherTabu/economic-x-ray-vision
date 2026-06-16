import { ValidationWorkbench } from "@/components/ValidationWorkbench";
import { constraintRegistry } from "@/data/constraintRegistry";
import { getConstraintsWithScores } from "@/lib/constraints";
import { buildValidationEvidencePacketPortfolio } from "@/lib/validationEvidencePackets";
import { buildValidationTaskPortfolio } from "@/lib/validationTasks";
import { buildValidationTriagePortfolio } from "@/lib/validationTriage";

export default function ValidationPage() {
  const scoredConstraints = getConstraintsWithScores(constraintRegistry);
  const portfolio = buildValidationTaskPortfolio(scoredConstraints);
  const triage = buildValidationTriagePortfolio(portfolio.tasks);
  const evidencePackets = buildValidationEvidencePacketPortfolio(triage);

  return (
    <ValidationWorkbench
      evidencePackets={evidencePackets}
      portfolio={portfolio}
      triage={triage}
    />
  );
}
