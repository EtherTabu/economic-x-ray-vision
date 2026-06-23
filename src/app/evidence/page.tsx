import evidenceArtifactMatches from "../../../data/exports/evidence_artifact_matches.json";
import { EvidenceMatchingWorkspace } from "@/components/EvidenceMatchingWorkspace";
import type { EvidenceArtifactMatchWorkspace } from "@/components/EvidenceMatchingWorkspace";

export default function EvidencePage() {
  return (
    <EvidenceMatchingWorkspace
      workspace={evidenceArtifactMatches as EvidenceArtifactMatchWorkspace}
    />
  );
}
