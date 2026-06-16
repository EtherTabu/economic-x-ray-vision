import { SourceRegistryWorkspace } from "@/components/SourceRegistryWorkspace";
import { constraintRegistry } from "@/data/constraintRegistry";
import { getConstraintsWithScores } from "@/lib/constraints";
import { buildEvidencePackPortfolio } from "@/lib/evidencePacks";
import { buildSourceWorkspace } from "@/lib/sourceWorkspace";
import { buildValidationEvidencePacketPortfolio } from "@/lib/validationEvidencePackets";
import { buildValidationTaskPortfolio } from "@/lib/validationTasks";
import { buildValidationTriagePortfolio } from "@/lib/validationTriage";

export default function SourcesPage() {
  const scoredConstraints = getConstraintsWithScores(constraintRegistry);
  const evidencePackPortfolio = buildEvidencePackPortfolio(scoredConstraints);
  const validationTaskPortfolio = buildValidationTaskPortfolio(scoredConstraints);
  const triage = buildValidationTriagePortfolio(validationTaskPortfolio.tasks);
  const evidencePacketPortfolio = buildValidationEvidencePacketPortfolio(triage);
  const workspace = buildSourceWorkspace({
    constraints: scoredConstraints,
    evidencePackPortfolio,
    evidencePacketPortfolio
  });

  return <SourceRegistryWorkspace workspace={workspace} />;
}
