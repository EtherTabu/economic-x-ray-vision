type ValidationPacketAuditFsModule = typeof import("node:fs");
type ValidationPacketAuditPathModule = typeof import("node:path");

const { readFileSync: packetAuditReadFileSync } = process.getBuiltinModule(
  "fs"
) as ValidationPacketAuditFsModule;
const { resolve: packetAuditResolve } = process.getBuiltinModule(
  "path"
) as ValidationPacketAuditPathModule;

const packetAuditPath = packetAuditResolve(
  "data/exports/validation_evidence_packets.json"
);

type PacketAuditPacket = {
  packet_id: string;
  constraint_title: string;
  request_category: string;
  recalibrated_severity: string;
  validation_burden_score: number;
  artifact_checklist: string[];
  pass_criteria: string[];
  fail_criteria: string[];
  expected_confidence_impact: {
    estimated_score_lift: number;
    impact_level: string;
  };
};

const packetAuditExport = JSON.parse(
  packetAuditReadFileSync(packetAuditPath, "utf8")
) as {
  summary: {
    packet_count: number;
    top_queue_coverage: number;
    category_distribution: Record<string, number>;
    high_impact_packets: number;
    critical_packets: number;
    average_expected_score_lift: number;
  };
  packets: PacketAuditPacket[];
};

console.log("Validation evidence packet audit");
console.log(`- packet count: ${packetAuditExport.summary.packet_count}`);
console.log(`- top queue coverage: ${packetAuditExport.summary.top_queue_coverage}%`);
console.log(
  `- category distribution: ${packetAuditFormatDistribution(
    packetAuditExport.summary.category_distribution
  )}`
);
console.log(`- high impact packets: ${packetAuditExport.summary.high_impact_packets}`);
console.log(`- critical packets: ${packetAuditExport.summary.critical_packets}`);
console.log(
  `- average expected score lift: ${packetAuditExport.summary.average_expected_score_lift}`
);
console.log("- top packet requests:");
packetAuditExport.packets.slice(0, 5).forEach((packet, index) => {
  console.log(
    `  ${index + 1}. ${packet.constraint_title}: ${packet.request_category}, ${packet.expected_confidence_impact.impact_level}, +${packet.expected_confidence_impact.estimated_score_lift}`
  );
});

const missingPacketIds = packetAuditExport.packets.filter(
  (packet) => !packet.packet_id
);
const thinPackets = packetAuditExport.packets.filter(
  (packet) =>
    packet.artifact_checklist.length < 4 ||
    packet.pass_criteria.length < 3 ||
    packet.fail_criteria.length < 3
);

if (
  packetAuditExport.summary.packet_count < 5 ||
  packetAuditExport.summary.packet_count > 10 ||
  packetAuditExport.summary.top_queue_coverage !== 100 ||
  missingPacketIds.length > 0 ||
  thinPackets.length > 0
) {
  process.exitCode = 1;
}

function packetAuditFormatDistribution(values: Record<string, number>) {
  return Object.entries(values)
    .map(([label, count]) => `${label} (${count})`)
    .join(", ");
}
