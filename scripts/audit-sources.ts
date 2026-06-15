{
type SourceAuditFsModule = typeof import("node:fs");
type SourceAuditPathModule = typeof import("node:path");

const { readFileSync: sourceAuditReadFileSync } = process.getBuiltinModule(
  "fs"
) as SourceAuditFsModule;
const { resolve: sourceAuditResolve } = process.getBuiltinModule(
  "path"
) as SourceAuditPathModule;

const sourceRegistryPath = sourceAuditResolve("data/exports/source_registry.json");
const evidencePackPath = sourceAuditResolve("data/exports/evidence_packs.json");

type EvidencePackAuditExport = {
  evidence_pack_count: number;
  source_summary: {
    source_count: number;
    average_trust_weight: number;
    provenance_distribution: Record<string, number>;
    citation_status_distribution: Record<string, number>;
    sources_needing_primary_documents: number;
  };
  evidence_pack_summary: {
    average_defensibility_score: number;
    thin_provenance_records: number;
    records_with_unresolved_gaps: number;
    top_source_upgrade_targets: string[];
  };
  packs: Array<{
    constraint_title: string;
    defensibility_score: number;
    provenance_status: string;
    recommended_source_upgrade: string;
    audit_flags: string[];
  }>;
};

const sourceRegistry = JSON.parse(sourceAuditReadFileSync(sourceRegistryPath, "utf8")) as {
  summary: EvidencePackAuditExport["source_summary"];
};
const evidencePackExport = JSON.parse(
  sourceAuditReadFileSync(evidencePackPath, "utf8")
) as EvidencePackAuditExport;

console.log("Source registry and evidence pack audit");
console.log(`- source records: ${sourceRegistry.summary.source_count}`);
console.log(`- evidence packs: ${evidencePackExport.evidence_pack_count}`);
console.log(
  `- average source trust: ${sourceRegistry.summary.average_trust_weight}`
);
console.log(
  `- average defensibility: ${evidencePackExport.evidence_pack_summary.average_defensibility_score}`
);
console.log(
  `- thin provenance records: ${evidencePackExport.evidence_pack_summary.thin_provenance_records}`
);
console.log(
  `- records with unresolved gaps: ${evidencePackExport.evidence_pack_summary.records_with_unresolved_gaps}`
);
console.log(
  `- sources needing primary documents: ${sourceRegistry.summary.sources_needing_primary_documents}`
);
console.log(
  `- provenance distribution: ${formatDistribution(
    sourceRegistry.summary.provenance_distribution
  )}`
);
console.log(
  `- citation status distribution: ${formatDistribution(
    sourceRegistry.summary.citation_status_distribution
  )}`
);
console.log("- top source upgrade targets:");
evidencePackExport.packs.slice(0, 5).forEach((pack) => {
  console.log(
    `  - ${pack.constraint_title}: ${pack.defensibility_score} ${pack.recommended_source_upgrade}`
  );
});

if (
  sourceRegistry.summary.source_count === 0 ||
  evidencePackExport.evidence_pack_count === 0
) {
  process.exitCode = 1;
}

function formatDistribution(values: Record<string, number>) {
  return Object.entries(values)
    .map(([label, count]) => `${label} (${count})`)
    .join(", ");
}
}
