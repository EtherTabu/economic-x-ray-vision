import { ValidationWorkbench } from "@/components/ValidationWorkbench";
import { constraintRegistry } from "@/data/constraintRegistry";
import { buildAnalystStateTemplate } from "@/lib/analystState";
import { getConstraintsWithScores } from "@/lib/constraints";
import { buildEvidenceArtifactLibrary } from "@/lib/evidenceArtifacts";
import { buildValidationEvidencePacketPortfolio } from "@/lib/validationEvidencePackets";
import { buildValidationTaskPortfolio } from "@/lib/validationTasks";
import { buildValidationTriagePortfolio } from "@/lib/validationTriage";

export default function ValidationPage() {
  const scoredConstraints = getConstraintsWithScores(constraintRegistry);
  const portfolio = buildValidationTaskPortfolio(scoredConstraints);
  const triage = buildValidationTriagePortfolio(portfolio.tasks);
  const evidencePackets = buildValidationEvidencePacketPortfolio(triage);
  const artifactLibrary = buildEvidenceArtifactLibrary(scoredConstraints);
  const analystState = buildAnalystStateTemplate(scoredConstraints);

  return (
    <ValidationWorkbench
      analystState={analystState}
      artifactLibrary={artifactLibrary}
      evidencePackets={evidencePackets}
      portfolio={portfolio}
      triage={triage}
    />
  );
}
