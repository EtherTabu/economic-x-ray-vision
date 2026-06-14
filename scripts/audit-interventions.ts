type InterventionAuditFsModule = typeof import("node:fs");
type InterventionAuditPathModule = typeof import("node:path");

const { readFileSync: interventionAuditReadFileSync } = process.getBuiltinModule(
  "fs"
) as InterventionAuditFsModule;
const { resolve: interventionAuditResolve } = process.getBuiltinModule(
  "path"
) as InterventionAuditPathModule;

type InterventionAuditStrategy = {
  constraint_id: string;
  constraint_title: string;
  intervention_type: string;
  intervention_priority_score: number;
  pilotability_score: number;
  ai_leverage_score: number;
  evidence_dependency_score: number;
  action_confidence: number;
};

const interventionAuditPath = interventionAuditResolve(
  "data/exports/intervention_strategies.json"
);
const interventionAuditExport = JSON.parse(
  interventionAuditReadFileSync(interventionAuditPath, "utf8")
) as {
  strategy_count: number;
  record_count: number;
  intervention_summary: {
    average_action_confidence: number;
    intervention_type_distribution: Record<string, number>;
  };
  strategies: InterventionAuditStrategy[];
};

const interventionAuditStrategies = interventionAuditExport.strategies;

console.log("Intervention audit");
console.log(`- total strategies: ${interventionAuditExport.strategy_count}`);
console.log(`- total constraints covered: ${interventionAuditExport.record_count}`);
console.log("- top 5 intervention priorities:");
topInterventions(interventionAuditStrategies, "intervention_priority_score").forEach(
  printStrategy
);
console.log("- top fast wins:");
topInterventions(interventionAuditStrategies, "pilotability_score").forEach(printStrategy);
console.log("- top AI leverage candidates:");
topInterventions(interventionAuditStrategies, "ai_leverage_score").forEach(printStrategy);
console.log("- top validation-dependent interventions:");
topInterventions(interventionAuditStrategies, "evidence_dependency_score").forEach(
  printStrategy
);
console.log(
  `- intervention type distribution: ${Object.entries(
    interventionAuditExport.intervention_summary.intervention_type_distribution
  )
    .map(([type, count]) => `${type} (${count})`)
    .join(", ")}`
);
console.log(
  `- average action confidence: ${interventionAuditExport.intervention_summary.average_action_confidence}`
);
console.log("- lowest confidence intervention candidates:");
[...interventionAuditStrategies]
  .sort((first, second) => first.action_confidence - second.action_confidence)
  .slice(0, 5)
  .forEach(printStrategy);

function topInterventions(
  strategies: InterventionAuditStrategy[],
  key: keyof InterventionAuditStrategy
) {
  return [...strategies]
    .sort((first, second) => Number(second[key]) - Number(first[key]))
    .slice(0, 5);
}

function printStrategy(strategy: InterventionAuditStrategy) {
  console.log(
    `  - ${strategy.constraint_title}: ${strategy.intervention_priority_score} ${strategy.intervention_type}`
  );
}
