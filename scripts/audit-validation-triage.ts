type ValidationTriageAuditFsModule = typeof import("node:fs");
type ValidationTriageAuditPathModule = typeof import("node:path");

const { readFileSync: triageAuditReadFileSync } = process.getBuiltinModule(
  "fs"
) as ValidationTriageAuditFsModule;
const { resolve: triageAuditResolve } = process.getBuiltinModule(
  "path"
) as ValidationTriageAuditPathModule;

const triageAuditPath = triageAuditResolve("data/exports/validation_triage.json");

type TriageAuditRecord = {
  constraint_id: string;
  constraint_title: string;
  validation_burden_score: number;
  recalibrated_severity: string;
  next_best_action: {
    action_title: string;
    cluster_type: string;
    priority_score: number;
  };
};

const triageAuditExport = JSON.parse(
  triageAuditReadFileSync(triageAuditPath, "utf8")
) as {
  summary: {
    constraints_with_tasks: number;
    total_tasks_compressed: number;
    top_queue_count: number;
    original_critical_tasks: number;
    recalibrated_critical_count: number;
    recalibrated_severity_distribution: Record<string, number>;
    cluster_distribution: Record<string, number>;
    average_validation_burden_score: number;
  };
  constraint_level_triage: TriageAuditRecord[];
  topValidationQueue: TriageAuditRecord[];
};

console.log("Validation triage audit");
console.log(`- constraints with tasks: ${triageAuditExport.summary.constraints_with_tasks}`);
console.log(`- raw tasks compressed: ${triageAuditExport.summary.total_tasks_compressed}`);
console.log(`- top validation queue: ${triageAuditExport.summary.top_queue_count}`);
console.log(`- original critical tasks: ${triageAuditExport.summary.original_critical_tasks}`);
console.log(
  `- recalibrated critical constraints: ${triageAuditExport.summary.recalibrated_critical_count}`
);
console.log(
  `- recalibrated severity distribution: ${triageAuditFormatDistribution(
    triageAuditExport.summary.recalibrated_severity_distribution
  )}`
);
console.log(
  `- cluster distribution: ${triageAuditFormatDistribution(
    triageAuditExport.summary.cluster_distribution
  )}`
);
console.log(
  `- average validation burden: ${triageAuditExport.summary.average_validation_burden_score}`
);
console.log("- top validation queue:");
triageAuditExport.topValidationQueue.forEach((triage, index) => {
  console.log(
    `  ${index + 1}. ${triage.constraint_title}: burden ${triage.validation_burden_score}, ${triage.next_best_action.cluster_type}, ${triage.next_best_action.action_title}`
  );
});

const missingAction = triageAuditExport.constraint_level_triage.filter(
  (triage) => !triage.next_best_action?.action_title
);

if (
  triageAuditExport.summary.top_queue_count < 5 ||
  triageAuditExport.summary.top_queue_count > 10 ||
  missingAction.length > 0 ||
  triageAuditExport.summary.recalibrated_critical_count >=
    triageAuditExport.summary.original_critical_tasks
) {
  process.exitCode = 1;
}

function triageAuditFormatDistribution(values: Record<string, number>) {
  return Object.entries(values)
    .map(([label, count]) => `${label} (${count})`)
    .join(", ");
}
