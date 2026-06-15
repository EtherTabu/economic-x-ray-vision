type NetworkAuditFsModule = typeof import("node:fs");
type NetworkAuditPathModule = typeof import("node:path");

const { readFileSync: networkAuditReadFileSync } = process.getBuiltinModule(
  "fs"
) as NetworkAuditFsModule;
const { resolve: networkAuditResolve } = process.getBuiltinModule(
  "path"
) as NetworkAuditPathModule;

type NetworkAuditExport = {
  summary: {
    total_nodes: number;
    total_edges: number;
    constraint_node_count: number;
    archetype_node_count: number;
    industry_node_count: number;
    most_connected_constraint: string;
    most_connected_archetype: string;
    strongest_cross_industry_bridge: string;
  };
  top_connected_constraints: Array<{ label: string; priority_score?: number }>;
  top_connected_archetypes: Array<{ label: string }>;
  bridge_constraints: Array<{ label: string; industry?: string }>;
  weak_evidence_clusters: Array<{
    label: string;
    record_count: number;
    average_validation_confidence: number;
  }>;
  high_intervention_clusters: Array<{
    label: string;
    average_intervention_score: number;
  }>;
};

const networkAuditPath = networkAuditResolve(
  "data/exports/constraint_network.json"
);
const networkAuditExport = JSON.parse(
  networkAuditReadFileSync(networkAuditPath, "utf8")
) as NetworkAuditExport;

console.log("Constraint network audit");
console.log(`- total nodes: ${networkAuditExport.summary.total_nodes}`);
console.log(`- total edges: ${networkAuditExport.summary.total_edges}`);
console.log(
  `- constraint nodes: ${networkAuditExport.summary.constraint_node_count}`
);
console.log(`- archetype nodes: ${networkAuditExport.summary.archetype_node_count}`);
console.log(`- industry nodes: ${networkAuditExport.summary.industry_node_count}`);
console.log(
  `- most connected constraint: ${networkAuditExport.summary.most_connected_constraint}`
);
console.log(
  `- most connected archetype: ${networkAuditExport.summary.most_connected_archetype}`
);
console.log(
  `- strongest cross-industry bridge: ${networkAuditExport.summary.strongest_cross_industry_bridge}`
);
console.log("- top connected constraints:");
networkAuditExport.top_connected_constraints.slice(0, 5).forEach((node) => {
  console.log(`  - ${node.label}: priority ${node.priority_score ?? "n/a"}`);
});
console.log("- top connected archetypes:");
networkAuditExport.top_connected_archetypes.slice(0, 5).forEach((node) => {
  console.log(`  - ${node.label}`);
});
console.log("- cross-industry bridge constraints:");
networkAuditExport.bridge_constraints.slice(0, 5).forEach((node) => {
  console.log(`  - ${node.label} (${node.industry})`);
});
console.log("- weak evidence clusters:");
networkAuditExport.weak_evidence_clusters.slice(0, 5).forEach((cluster) => {
  console.log(
    `  - ${cluster.label}: ${cluster.record_count} records, validation ${cluster.average_validation_confidence}`
  );
});
console.log("- high intervention clusters:");
networkAuditExport.high_intervention_clusters.slice(0, 5).forEach((cluster) => {
  console.log(`  - ${cluster.label}: intervention ${cluster.average_intervention_score}`);
});

if (
  networkAuditExport.summary.total_nodes === 0 ||
  networkAuditExport.summary.total_edges === 0
) {
  process.exitCode = 1;
}
