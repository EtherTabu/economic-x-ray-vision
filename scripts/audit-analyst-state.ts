type AnalystStateAuditFsModule = typeof import("node:fs");
type AnalystStateAuditPathModule = typeof import("node:path");

const { readFileSync: analystStateAuditReadFileSync } = process.getBuiltinModule(
  "fs"
) as AnalystStateAuditFsModule;
const { resolve: analystStateAuditResolve } = process.getBuiltinModule(
  "path"
) as AnalystStateAuditPathModule;

const analystStateAuditPath = analystStateAuditResolve(
  "data/exports/analyst_state_template.json"
);
const analystStateAuditArtifactPath = analystStateAuditResolve(
  "data/exports/evidence_artifact_library.json"
);
const analystStateAuditTaskPath = analystStateAuditResolve(
  "data/exports/validation_tasks.json"
);
const analystStateAuditCampaignPath = analystStateAuditResolve(
  "data/exports/validation_campaigns.json"
);
const analystStateAuditTriagePath = analystStateAuditResolve(
  "data/exports/validation_triage.json"
);
const analystStateAuditDatasetPath = analystStateAuditResolve(
  "data/exports/constraint_dataset_snapshot.json"
);

type AnalystStateAuditRecord = {
  state_id: string;
  entity_type: "artifact" | "validation_task" | "campaign" | "constraint";
  entity_id: string;
  status: string;
  owner: string;
  last_reviewed_at: string | null;
  updated_at: string | null;
  source: string;
  related_constraint_ids: string[];
  related_artifact_ids: string[];
  related_validation_task_ids: string[];
  related_campaign_ids: string[];
};

const analystStateAuditExport = analystStateAuditReadJson<{
  summary: {
    total_state_records: number;
    status_distribution: Record<string, number>;
    entity_type_distribution: Record<string, number>;
    high_priority_artifact_coverage: number;
    campaign_constraint_coverage: number;
    top_triage_constraint_coverage: number;
  };
  states: AnalystStateAuditRecord[];
}>(analystStateAuditPath);
const analystStateAuditArtifacts = analystStateAuditReadJson<{
  artifacts: Array<{ artifact_id: string; priority: number }>;
}>(analystStateAuditArtifactPath).artifacts;
const analystStateAuditTasks = analystStateAuditReadJson<{
  tasks: Array<{ task_id: string }>;
}>(analystStateAuditTaskPath).tasks;
const analystStateAuditCampaigns = analystStateAuditReadJson<{
  campaigns: Array<{
    campaign_id: string;
    selected_constraints: Array<{ constraint_id: string }>;
  }>;
}>(analystStateAuditCampaignPath).campaigns;
const analystStateAuditTriage = analystStateAuditReadJson<{
  topValidationQueue: Array<{ constraint_id: string }>;
}>(analystStateAuditTriagePath);
const analystStateAuditDataset = analystStateAuditReadJson<{
  records: Array<{ id: string }>;
}>(analystStateAuditDatasetPath);

const analystStateAuditFailures: string[] = [];
const analystStateAuditArtifactIds = new Set(
  analystStateAuditArtifacts.map((artifact) => artifact.artifact_id)
);
const analystStateAuditTaskIds = new Set(
  analystStateAuditTasks.map((task) => task.task_id)
);
const analystStateAuditCampaignIds = new Set(
  analystStateAuditCampaigns.map((campaign) => campaign.campaign_id)
);
const analystStateAuditConstraintIds = new Set(
  analystStateAuditDataset.records.map((record) => record.id)
);
const analystStateAuditStateIds = new Set<string>();
const analystStateAuditArtifactStateIds = new Set(
  analystStateAuditExport.states
    .filter((state) => state.entity_type === "artifact")
    .map((state) => state.entity_id)
);
const analystStateAuditTaskStateIds = new Set(
  analystStateAuditExport.states
    .filter((state) => state.entity_type === "validation_task")
    .map((state) => state.entity_id)
);
const analystStateAuditCampaignStateIds = new Set(
  analystStateAuditExport.states
    .filter((state) => state.entity_type === "campaign")
    .map((state) => state.entity_id)
);
const analystStateAuditConstraintStateIds = new Set(
  analystStateAuditExport.states
    .filter((state) => state.entity_type === "constraint")
    .map((state) => state.entity_id)
);
const analystStateAuditAllowedStatuses = new Set([
  "not_collected",
  "identified",
  "collected",
  "needs_review",
  "rejected",
  "blocked",
  "open",
  "in_progress",
  "review_ready",
  "accepted",
  "deferred",
  "not_started",
  "planning",
  "active",
  "complete",
  "unreviewed",
  "reviewed",
  "needs_evidence",
  "decision_ready"
]);
const analystStateAuditForbiddenTemplateStatuses = new Set([
  "collected",
  "accepted",
  "complete",
  "reviewed",
  "decision_ready"
]);
const analystStateAuditCampaignConstraintIds = new Set(
  analystStateAuditCampaigns.flatMap((campaign) =>
    campaign.selected_constraints.map((constraint) => constraint.constraint_id)
  )
);
const analystStateAuditTopTriageConstraintIds = new Set(
  analystStateAuditTriage.topValidationQueue.map((item) => item.constraint_id)
);
const analystStateAuditHighPriorityArtifactIds = new Set(
  analystStateAuditArtifacts
    .filter((artifact) => artifact.priority >= 8)
    .map((artifact) => artifact.artifact_id)
);

analystStateAuditExport.states.forEach((state) => {
  if (analystStateAuditStateIds.has(state.state_id)) {
    analystStateAuditFailures.push(`duplicate state id: ${state.state_id}`);
  }
  analystStateAuditStateIds.add(state.state_id);

  if (!analystStateAuditAllowedStatuses.has(state.status)) {
    analystStateAuditFailures.push(`invalid status: ${state.status}`);
  }
  if (analystStateAuditForbiddenTemplateStatuses.has(state.status)) {
    analystStateAuditFailures.push(`template contains completed/reviewed status: ${state.status}`);
  }
  if (state.owner !== "unassigned") {
    analystStateAuditFailures.push(`template contains assigned owner: ${state.state_id}`);
  }
  if (state.last_reviewed_at !== null || state.updated_at !== null) {
    analystStateAuditFailures.push(`template contains review/update timestamp: ${state.state_id}`);
  }
  if (state.source !== "analyst_state_template") {
    analystStateAuditFailures.push(`invalid source marker: ${state.state_id}`);
  }
});

analystStateAuditExport.states
  .filter((state) => state.entity_type === "artifact")
  .forEach((state) => {
    if (!analystStateAuditArtifactIds.has(state.entity_id)) {
      analystStateAuditFailures.push(`orphan artifact state: ${state.entity_id}`);
    }
  });
analystStateAuditExport.states
  .filter((state) => state.entity_type === "validation_task")
  .forEach((state) => {
    if (!analystStateAuditTaskIds.has(state.entity_id)) {
      analystStateAuditFailures.push(`orphan validation task state: ${state.entity_id}`);
    }
  });
analystStateAuditExport.states
  .filter((state) => state.entity_type === "campaign")
  .forEach((state) => {
    if (!analystStateAuditCampaignIds.has(state.entity_id)) {
      analystStateAuditFailures.push(`orphan campaign state: ${state.entity_id}`);
    }
  });
analystStateAuditExport.states
  .filter((state) => state.entity_type === "constraint")
  .forEach((state) => {
    if (!analystStateAuditConstraintIds.has(state.entity_id)) {
      analystStateAuditFailures.push(`orphan constraint state: ${state.entity_id}`);
    }
  });

analystStateAuditHighPriorityArtifactIds.forEach((artifactId) => {
  if (!analystStateAuditArtifactStateIds.has(artifactId)) {
    analystStateAuditFailures.push(`missing high-priority artifact state: ${artifactId}`);
  }
});
analystStateAuditTaskIds.forEach((taskId) => {
  if (!analystStateAuditTaskStateIds.has(taskId)) {
    analystStateAuditFailures.push(`missing validation task state: ${taskId}`);
  }
});
analystStateAuditCampaignIds.forEach((campaignId) => {
  if (!analystStateAuditCampaignStateIds.has(campaignId)) {
    analystStateAuditFailures.push(`missing campaign state: ${campaignId}`);
  }
});
analystStateAuditCampaignConstraintIds.forEach((constraintId) => {
  if (!analystStateAuditConstraintStateIds.has(constraintId)) {
    analystStateAuditFailures.push(`missing campaign constraint state: ${constraintId}`);
  }
});
analystStateAuditTopTriageConstraintIds.forEach((constraintId) => {
  if (!analystStateAuditConstraintStateIds.has(constraintId)) {
    analystStateAuditFailures.push(`missing top triage constraint state: ${constraintId}`);
  }
});

console.log("Analyst state template audit");
console.log(`- state records: ${analystStateAuditExport.summary.total_state_records}`);
console.log(
  `- entity distribution: ${analystStateAuditFormatDistribution(
    analystStateAuditExport.summary.entity_type_distribution
  )}`
);
console.log(
  `- status distribution: ${analystStateAuditFormatDistribution(
    analystStateAuditExport.summary.status_distribution
  )}`
);
console.log(
  `- high-priority artifact coverage: ${analystStateAuditExport.summary.high_priority_artifact_coverage}%`
);
console.log(
  `- campaign constraint coverage: ${analystStateAuditExport.summary.campaign_constraint_coverage}%`
);
console.log(
  `- top triage constraint coverage: ${analystStateAuditExport.summary.top_triage_constraint_coverage}%`
);

if (analystStateAuditFailures.length > 0) {
  console.error("- analyst state audit failures:");
  analystStateAuditFailures.forEach((failure) => console.error(`  - ${failure}`));
  process.exitCode = 1;
} else {
  console.log("- result: PASS");
}

function analystStateAuditReadJson<T>(path: string) {
  return JSON.parse(analystStateAuditReadFileSync(path, "utf8")) as T;
}

function analystStateAuditFormatDistribution(values: Record<string, number>) {
  return Object.entries(values)
    .map(([label, count]) => `${label} (${count})`)
    .join(", ");
}
