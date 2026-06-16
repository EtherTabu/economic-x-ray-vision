type ValidationTaskAuditFsModule = typeof import("node:fs");
type ValidationTaskAuditPathModule = typeof import("node:path");

const { readFileSync: taskAuditReadFileSync } = process.getBuiltinModule(
  "fs"
) as ValidationTaskAuditFsModule;
const { resolve: taskAuditResolve } = process.getBuiltinModule(
  "path"
) as ValidationTaskAuditPathModule;

const taskAuditPath = taskAuditResolve("data/exports/validation_tasks.json");

type TaskAuditRecord = {
  task_id: string;
  constraint_id: string;
  constraint_title: string;
  industry: string;
  task_type: string;
  task_title: string;
  priority_score: number;
  severity: string;
  status: string;
};

const taskAuditExport = JSON.parse(
  taskAuditReadFileSync(taskAuditPath, "utf8")
) as {
  task_count: number;
  task_summary: {
    task_type_distribution: Record<string, number>;
    tasks_by_industry: Record<string, number>;
    tasks_by_severity: Record<string, number>;
    high_opportunity_weak_evidence_tasks: number;
    primary_document_needed_tasks: number;
    source_url_needed_tasks: number;
    local_observation_needed_tasks: number;
  };
  tasks: TaskAuditRecord[];
};

const tasks = taskAuditExport.tasks;
const openTasks = tasks.filter((task) => task.status === "open");
const blockedTasks = tasks.filter((task) => task.status === "blocked");
const reviewReadyTasks = tasks.filter((task) => task.status === "review_ready");
const topTasks = tasks.slice(0, 5);

console.log("Validation task audit");
console.log(`- total tasks: ${tasks.length}`);
console.log(`- open tasks: ${openTasks.length}`);
console.log(`- blocked tasks: ${blockedTasks.length}`);
console.log(`- review-ready tasks: ${reviewReadyTasks.length}`);
console.log(
  `- task type distribution: ${taskAuditFormatDistribution(
    taskAuditExport.task_summary.task_type_distribution
  )}`
);
console.log(
  `- tasks by industry: ${taskAuditFormatDistribution(
    taskAuditExport.task_summary.tasks_by_industry
  )}`
);
console.log(
  `- tasks by severity: ${taskAuditFormatDistribution(
    taskAuditExport.task_summary.tasks_by_severity
  )}`
);
console.log(
  `- high opportunity weak evidence tasks: ${taskAuditExport.task_summary.high_opportunity_weak_evidence_tasks}`
);
console.log(
  `- primary-document-needed tasks: ${taskAuditExport.task_summary.primary_document_needed_tasks}`
);
console.log(
  `- source-url-needed tasks: ${taskAuditExport.task_summary.source_url_needed_tasks}`
);
console.log(
  `- local-observation-needed tasks: ${taskAuditExport.task_summary.local_observation_needed_tasks}`
);
console.log("- top validation tasks:");
topTasks.forEach((task) => {
  console.log(
    `  - ${task.constraint_title}: ${task.priority_score} ${task.task_title}`
  );
});

if (tasks.length === 0 || taskAuditExport.task_count !== tasks.length) {
  process.exitCode = 1;
}

function taskAuditFormatDistribution(values: Record<string, number>) {
  return Object.entries(values)
    .map(([label, count]) => `${label} (${count})`)
    .join(", ");
}
