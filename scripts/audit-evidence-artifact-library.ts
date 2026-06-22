type ArtifactAuditFsModule = typeof import("node:fs");
type ArtifactAuditPathModule = typeof import("node:path");

const { readFileSync: artifactAuditReadFileSync } = process.getBuiltinModule(
  "fs"
) as ArtifactAuditFsModule;
const { resolve: artifactAuditResolve } = process.getBuiltinModule(
  "path"
) as ArtifactAuditPathModule;

const artifactAuditPath = artifactAuditResolve(
  "data/exports/evidence_artifact_library.json"
);
const artifactAuditPacketPath = artifactAuditResolve(
  "data/exports/validation_evidence_packets.json"
);
const artifactAuditCampaignPath = artifactAuditResolve(
  "data/exports/validation_campaigns.json"
);

type ArtifactAuditRecord = {
  artifact_id: string;
  constraint_id: string;
  artifact_type: string;
  artifact_title: string;
  priority: number;
  related_packet_ids: string[];
  status: string;
  gaps: string[];
};

const artifactAuditExport = JSON.parse(
  artifactAuditReadFileSync(artifactAuditPath, "utf8")
) as {
  summary: {
    artifact_count: number;
    constraints_with_artifacts: number;
    top_packet_coverage: number;
    campaign_constraint_coverage: number;
    primary_evidence_needed_count: number;
    constraints_blocked_by_missing_artifacts: number;
    high_priority_artifact_count: number;
    artifact_type_distribution: Record<string, number>;
    status_distribution: Record<string, number>;
  };
  artifacts: ArtifactAuditRecord[];
};
const artifactAuditPackets = JSON.parse(
  artifactAuditReadFileSync(artifactAuditPacketPath, "utf8")
) as { packets: Array<{ packet_id: string; constraint_id: string }> };
const artifactAuditCampaigns = JSON.parse(
  artifactAuditReadFileSync(artifactAuditCampaignPath, "utf8")
) as {
  campaigns: Array<{
    selected_constraints: Array<{ constraint_id: string }>;
  }>;
};

const artifactAuditFailures: string[] = [];
const artifactAuditPacketIds = new Set(
  artifactAuditExport.artifacts.flatMap((artifact) => artifact.related_packet_ids)
);
const artifactAuditCampaignConstraintIds = new Set(
  artifactAuditCampaigns.campaigns.flatMap((campaign) =>
    campaign.selected_constraints.map((constraint) => constraint.constraint_id)
  )
);
const artifactAuditConstraintIds = new Set(
  artifactAuditExport.artifacts.map((artifact) => artifact.constraint_id)
);
const artifactAuditFakeLinks = artifactAuditExport.artifacts.filter((artifact) =>
  JSON.stringify(artifact).match(/https?:\/\//i)
);
const artifactAuditInvalidStatuses = artifactAuditExport.artifacts.filter(
  (artifact) => !["needed", "not_collected"].includes(artifact.status)
);

console.log("Evidence artifact library audit");
console.log(`- artifact count: ${artifactAuditExport.summary.artifact_count}`);
console.log(
  `- constraints with artifacts: ${artifactAuditExport.summary.constraints_with_artifacts}`
);
console.log(
  `- top packet coverage: ${artifactAuditExport.summary.top_packet_coverage}%`
);
console.log(
  `- campaign constraint coverage: ${artifactAuditExport.summary.campaign_constraint_coverage}%`
);
console.log(
  `- primary evidence needed: ${artifactAuditExport.summary.primary_evidence_needed_count}`
);
console.log(
  `- blocked constraints: ${artifactAuditExport.summary.constraints_blocked_by_missing_artifacts}`
);
console.log(
  `- high priority artifacts: ${artifactAuditExport.summary.high_priority_artifact_count}`
);
console.log(
  `- artifact type distribution: ${artifactAuditFormatDistribution(
    artifactAuditExport.summary.artifact_type_distribution
  )}`
);
console.log(
  `- status distribution: ${artifactAuditFormatDistribution(
    artifactAuditExport.summary.status_distribution
  )}`
);

if (artifactAuditExport.summary.artifact_count === 0) {
  artifactAuditFailures.push("artifact library is empty");
}
if (
  artifactAuditPackets.packets.some(
    (packet) => !artifactAuditPacketIds.has(packet.packet_id)
  )
) {
  artifactAuditFailures.push("one or more top evidence packets has no artifact need");
}
if (
  Array.from(artifactAuditCampaignConstraintIds).some(
    (constraintId) => !artifactAuditConstraintIds.has(constraintId)
  )
) {
  artifactAuditFailures.push("one or more campaign constraints has no artifact need");
}
if (artifactAuditFakeLinks.length > 0) {
  artifactAuditFailures.push("artifact library contains URL-like content");
}
if (artifactAuditInvalidStatuses.length > 0) {
  artifactAuditFailures.push("artifact library contains invalid statuses");
}
if (artifactAuditExport.summary.primary_evidence_needed_count === 0) {
  artifactAuditFailures.push("expected at least one primary evidence artifact need");
}

if (artifactAuditFailures.length > 0) {
  console.error("- artifact audit failures:");
  artifactAuditFailures.forEach((failure) => console.error(`  - ${failure}`));
  process.exitCode = 1;
} else {
  console.log("- result: PASS");
}

function artifactAuditFormatDistribution(values: Record<string, number>) {
  return Object.entries(values)
    .map(([label, count]) => `${label} (${count})`)
    .join(", ");
}
