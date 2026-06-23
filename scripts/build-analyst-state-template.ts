type AnalystStateBuildFsModule = typeof import("node:fs");
type AnalystStateBuildPathModule = typeof import("node:path");

const {
  existsSync: analystStateBuildExistsSync,
  mkdirSync: analystStateBuildMkdirSync,
  readFileSync: analystStateBuildReadFileSync,
  writeFileSync: analystStateBuildWriteFileSync
} = process.getBuiltinModule("fs") as AnalystStateBuildFsModule;
const {
  dirname: analystStateBuildDirname,
  resolve: analystStateBuildResolve
} = process.getBuiltinModule("path") as AnalystStateBuildPathModule;

const analystStateBuildDatasetPath = analystStateBuildResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const analystStateBuildArtifactPath = analystStateBuildResolve(
  "data/exports/evidence_artifact_library.json"
);
const analystStateBuildTaskPath = analystStateBuildResolve(
  "data/exports/validation_tasks.json"
);
const analystStateBuildTriagePath = analystStateBuildResolve(
  "data/exports/validation_triage.json"
);
const analystStateBuildCampaignPath = analystStateBuildResolve(
  "data/exports/validation_campaigns.json"
);
const analystStateBuildOutputPath = analystStateBuildResolve(
  "data/exports/analyst_state_template.json"
);

type AnalystStateBuildEntityType =
  | "artifact"
  | "validation_task"
  | "campaign"
  | "constraint";

type AnalystStateBuildRecord = {
  id: string;
  title: string;
  scores: {
    total_priority_score: number;
    validation_confidence_score: number;
  };
};

type AnalystStateBuildArtifact = {
  artifact_id: string;
  constraint_id: string;
  artifact_title: string;
  why_needed: string;
  collection_method: string;
  priority: number;
  related_task_ids: string[];
  gaps: string[];
};

type AnalystStateBuildTask = {
  task_id: string;
  constraint_id: string;
  task_title: string;
  task_summary: string;
  priority_score: number;
  status: "open" | "blocked" | "review_ready";
  recommended_action: string;
  blocking_reason: string;
};

type AnalystStateBuildTriage = {
  constraint_id: string;
};

type AnalystStateBuildCampaign = {
  campaign_id: string;
  title: string;
  why_this_campaign: string;
  expected_confidence_lift: {
    total_estimated_lift: number;
  };
  selected_constraints: Array<{ constraint_id: string }>;
};

type AnalystStateBuildState = {
  state_id: string;
  entity_type: AnalystStateBuildEntityType;
  entity_id: string;
  entity_title: string;
  status: string;
  priority: number;
  owner: "unassigned";
  last_reviewed_at: null;
  next_action: string;
  blocker_reason: string;
  notes: string[];
  source: "analyst_state_template";
  updated_at: null;
  related_constraint_ids: string[];
  related_artifact_ids: string[];
  related_validation_task_ids: string[];
  related_campaign_ids: string[];
};

function analystStateBuildMain() {
  const records = analystStateBuildReadJson<{ records: AnalystStateBuildRecord[] }>(
    analystStateBuildDatasetPath
  ).records;
  const artifacts = analystStateBuildReadJson<{
    artifacts: AnalystStateBuildArtifact[];
  }>(analystStateBuildArtifactPath).artifacts;
  const tasks = analystStateBuildReadJson<{ tasks: AnalystStateBuildTask[] }>(
    analystStateBuildTaskPath
  ).tasks;
  const triage = analystStateBuildReadJson<{
    topValidationQueue: AnalystStateBuildTriage[];
  }>(analystStateBuildTriagePath);
  const campaigns = analystStateBuildReadJson<{
    campaigns: AnalystStateBuildCampaign[];
  }>(analystStateBuildCampaignPath).campaigns;
  const taskByConstraint = analystStateBuildGroupTasks(tasks);
  const campaignIdsByConstraint = analystStateBuildCampaignIdsByConstraint(campaigns);
  const states = [
    ...artifacts.map((artifact) =>
      analystStateBuildArtifactState(artifact, campaignIdsByConstraint)
    ),
    ...tasks.map((task) =>
      analystStateBuildTaskState(task, campaignIdsByConstraint)
    ),
    ...campaigns.map(analystStateBuildCampaignState),
    ...records.map((record) =>
      analystStateBuildConstraintState(
        record,
        taskByConstraint.get(record.id) ?? [],
        campaignIdsByConstraint
      )
    )
  ].sort(
    (first, second) =>
      analystStateBuildEntityTypeOrder(first.entity_type) -
        analystStateBuildEntityTypeOrder(second.entity_type) ||
      second.priority - first.priority ||
      first.entity_title.localeCompare(second.entity_title) ||
      first.state_id.localeCompare(second.state_id)
  );
  const output = {
    generated_at: new Date().toISOString(),
    summary: analystStateBuildSummary({
      artifacts,
      campaigns,
      states,
      topTriageConstraintIds: triage.topValidationQueue.map((item) => item.constraint_id)
    }),
    states
  };

  analystStateBuildMkdirSync(analystStateBuildDirname(analystStateBuildOutputPath), {
    recursive: true
  });
  analystStateBuildWriteStableJson(analystStateBuildOutputPath, output);
  console.log(
    `Built ${states.length} analyst state template records at ${analystStateBuildOutputPath}.`
  );
}

function analystStateBuildArtifactState(
  artifact: AnalystStateBuildArtifact,
  campaignIdsByConstraint: Map<string, string[]>
): AnalystStateBuildState {
  return {
    state_id: `state:artifact:${artifact.artifact_id}`,
    entity_type: "artifact",
    entity_id: artifact.artifact_id,
    entity_title: artifact.artifact_title,
    status: "not_collected",
    priority: artifact.priority,
    owner: "unassigned",
    last_reviewed_at: null,
    next_action: artifact.collection_method,
    blocker_reason:
      artifact.gaps[0] ?? "Artifact has not been collected or reviewed yet.",
    notes: [
      "Template state only; no artifact has been collected.",
      artifact.why_needed
    ],
    source: "analyst_state_template",
    updated_at: null,
    related_constraint_ids: [artifact.constraint_id],
    related_artifact_ids: [artifact.artifact_id],
    related_validation_task_ids: artifact.related_task_ids,
    related_campaign_ids: campaignIdsByConstraint.get(artifact.constraint_id) ?? []
  };
}

function analystStateBuildTaskState(
  task: AnalystStateBuildTask,
  campaignIdsByConstraint: Map<string, string[]>
): AnalystStateBuildState {
  return {
    state_id: `state:validation_task:${task.task_id}`,
    entity_type: "validation_task",
    entity_id: task.task_id,
    entity_title: task.task_title,
    status: task.status,
    priority: task.priority_score,
    owner: "unassigned",
    last_reviewed_at: null,
    next_action: task.recommended_action,
    blocker_reason: task.blocking_reason,
    notes: [
      "Template state only; task has not been accepted, completed, or reviewed.",
      task.task_summary
    ],
    source: "analyst_state_template",
    updated_at: null,
    related_constraint_ids: [task.constraint_id],
    related_artifact_ids: [],
    related_validation_task_ids: [task.task_id],
    related_campaign_ids: campaignIdsByConstraint.get(task.constraint_id) ?? []
  };
}

function analystStateBuildCampaignState(
  campaign: AnalystStateBuildCampaign
): AnalystStateBuildState {
  return {
    state_id: `state:campaign:${campaign.campaign_id}`,
    entity_type: "campaign",
    entity_id: campaign.campaign_id,
    entity_title: campaign.title,
    status: "not_started",
    priority: campaign.expected_confidence_lift.total_estimated_lift,
    owner: "unassigned",
    last_reviewed_at: null,
    next_action: "Assign an analyst and review campaign artifact requirements.",
    blocker_reason: "Campaign has not been started.",
    notes: [
      "Template state only; campaign has no progress claim.",
      campaign.why_this_campaign
    ],
    source: "analyst_state_template",
    updated_at: null,
    related_constraint_ids: campaign.selected_constraints.map(
      (constraint) => constraint.constraint_id
    ),
    related_artifact_ids: [],
    related_validation_task_ids: [],
    related_campaign_ids: [campaign.campaign_id]
  };
}

function analystStateBuildConstraintState(
  record: AnalystStateBuildRecord,
  tasks: AnalystStateBuildTask[],
  campaignIdsByConstraint: Map<string, string[]>
): AnalystStateBuildState {
  const highestTask = tasks
    .slice()
    .sort((first, second) => second.priority_score - first.priority_score)[0];

  return {
    state_id: `state:constraint:${record.id}`,
    entity_type: "constraint",
    entity_id: record.id,
    entity_title: record.title,
    status: "unreviewed",
    priority: record.scores.total_priority_score,
    owner: "unassigned",
    last_reviewed_at: null,
    next_action:
      highestTask?.recommended_action ??
      "Review the constraint before changing its analyst state.",
    blocker_reason: "Constraint has not been reviewed by an analyst.",
    notes: [
      "Template state only; no analyst review has occurred.",
      `Generated validation confidence is ${record.scores.validation_confidence_score.toFixed(1)}.`
    ],
    source: "analyst_state_template",
    updated_at: null,
    related_constraint_ids: [record.id],
    related_artifact_ids: [],
    related_validation_task_ids: tasks.map((task) => task.task_id),
    related_campaign_ids: campaignIdsByConstraint.get(record.id) ?? []
  };
}

function analystStateBuildSummary({
  artifacts,
  campaigns,
  states,
  topTriageConstraintIds
}: {
  artifacts: AnalystStateBuildArtifact[];
  campaigns: AnalystStateBuildCampaign[];
  states: AnalystStateBuildState[];
  topTriageConstraintIds: string[];
}) {
  const stateArtifactIds = new Set(
    states
      .filter((state) => state.entity_type === "artifact")
      .map((state) => state.entity_id)
  );
  const stateConstraintIds = new Set(
    states
      .filter((state) => state.entity_type === "constraint")
      .map((state) => state.entity_id)
  );
  const campaignConstraintIds = new Set(
    campaigns.flatMap((campaign) =>
      campaign.selected_constraints.map((constraint) => constraint.constraint_id)
    )
  );
  const highPriorityArtifacts = artifacts.filter((artifact) => artifact.priority >= 8);

  return {
    total_state_records: states.length,
    artifact_state_records: states.filter((state) => state.entity_type === "artifact")
      .length,
    validation_task_state_records: states.filter(
      (state) => state.entity_type === "validation_task"
    ).length,
    campaign_state_records: states.filter((state) => state.entity_type === "campaign")
      .length,
    constraint_state_records: states.filter((state) => state.entity_type === "constraint")
      .length,
    unassigned_records: states.filter((state) => state.owner === "unassigned").length,
    records_with_review_timestamp: states.filter((state) => state.last_reviewed_at)
      .length,
    status_distribution: analystStateBuildDistribution(
      states.map((state) => state.status)
    ),
    entity_type_distribution: analystStateBuildDistribution(
      states.map((state) => state.entity_type)
    ),
    high_priority_artifact_coverage:
      highPriorityArtifacts.length === 0
        ? 100
        : analystStateBuildRound(
            (highPriorityArtifacts.filter((artifact) =>
              stateArtifactIds.has(artifact.artifact_id)
            ).length /
              highPriorityArtifacts.length) *
              100
          ),
    campaign_constraint_coverage:
      campaignConstraintIds.size === 0
        ? 100
        : analystStateBuildRound(
            (Array.from(campaignConstraintIds).filter((id) =>
              stateConstraintIds.has(id)
            ).length /
              campaignConstraintIds.size) *
              100
          ),
    top_triage_constraint_coverage:
      topTriageConstraintIds.length === 0
        ? 100
        : analystStateBuildRound(
            (topTriageConstraintIds.filter((id) => stateConstraintIds.has(id))
              .length /
              topTriageConstraintIds.length) *
              100
          )
  };
}

function analystStateBuildGroupTasks(tasks: AnalystStateBuildTask[]) {
  const groups = new Map<string, AnalystStateBuildTask[]>();

  tasks.forEach((task) => {
    groups.set(task.constraint_id, [...(groups.get(task.constraint_id) ?? []), task]);
  });

  return groups;
}

function analystStateBuildCampaignIdsByConstraint(
  campaigns: AnalystStateBuildCampaign[]
) {
  const map = new Map<string, string[]>();

  campaigns.forEach((campaign) => {
    campaign.selected_constraints.forEach((constraint) => {
      map.set(constraint.constraint_id, [
        ...(map.get(constraint.constraint_id) ?? []),
        campaign.campaign_id
      ]);
    });
  });

  return map;
}

function analystStateBuildReadJson<T>(path: string) {
  return JSON.parse(analystStateBuildReadFileSync(path, "utf8")) as T;
}

function analystStateBuildWriteStableJson(
  path: string,
  output: Record<string, unknown>
) {
  const stableOutput = analystStateBuildPreserveGeneratedAt(path, output);
  analystStateBuildWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function analystStateBuildPreserveGeneratedAt(
  path: string,
  output: Record<string, unknown>
) {
  if (!analystStateBuildExistsSync(path)) return output;
  const existing = JSON.parse(analystStateBuildReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const comparable = { ...existing, generated_at: output.generated_at };
  if (JSON.stringify(comparable) === JSON.stringify(output)) {
    return { ...output, generated_at: existing.generated_at };
  }
  return output;
}

function analystStateBuildEntityTypeOrder(entityType: AnalystStateBuildEntityType) {
  if (entityType === "campaign") return 0;
  if (entityType === "constraint") return 1;
  if (entityType === "artifact") return 2;
  return 3;
}

function analystStateBuildDistribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function analystStateBuildRound(value: number) {
  return Math.round(value * 10) / 10;
}

analystStateBuildMain();
