import {
  buildEvidenceArtifactLibrary,
  type EvidenceArtifactNeed
} from "@/lib/evidenceArtifacts";
import {
  buildValidationCampaignPortfolio,
  type ValidationCampaign
} from "@/lib/validationCampaigns";
import {
  buildValidationTaskPortfolio,
  type ValidationTask
} from "@/lib/validationTasks";
import { buildValidationTriagePortfolio } from "@/lib/validationTriage";
import type { ScoredConstraint } from "@/types/constraint";

export type AnalystStateEntityType =
  | "artifact"
  | "validation_task"
  | "campaign"
  | "constraint";

export type AnalystArtifactStatus =
  | "not_collected"
  | "identified"
  | "collected"
  | "needs_review"
  | "rejected"
  | "blocked";

export type AnalystValidationTaskStatus =
  | "open"
  | "in_progress"
  | "blocked"
  | "review_ready"
  | "accepted"
  | "deferred";

export type AnalystCampaignStatus =
  | "not_started"
  | "planning"
  | "active"
  | "blocked"
  | "complete";

export type AnalystConstraintReviewStatus =
  | "unreviewed"
  | "reviewed"
  | "needs_evidence"
  | "decision_ready"
  | "deferred";

export type AnalystStateStatus =
  | AnalystArtifactStatus
  | AnalystValidationTaskStatus
  | AnalystCampaignStatus
  | AnalystConstraintReviewStatus;

export type AnalystStateRecord = {
  state_id: string;
  entity_type: AnalystStateEntityType;
  entity_id: string;
  entity_title: string;
  status: AnalystStateStatus;
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

export type AnalystStateSummary = {
  total_state_records: number;
  artifact_state_records: number;
  validation_task_state_records: number;
  campaign_state_records: number;
  constraint_state_records: number;
  unassigned_records: number;
  records_with_review_timestamp: number;
  status_distribution: Record<string, number>;
  entity_type_distribution: Record<string, number>;
  high_priority_artifact_coverage: number;
  campaign_constraint_coverage: number;
  top_triage_constraint_coverage: number;
};

export type AnalystStateTemplate = {
  summary: AnalystStateSummary;
  states: AnalystStateRecord[];
};

export function buildAnalystStateTemplate(
  constraints: ScoredConstraint[]
): AnalystStateTemplate {
  const artifactLibrary = buildEvidenceArtifactLibrary(constraints);
  const taskPortfolio = buildValidationTaskPortfolio(constraints);
  const triagePortfolio = buildValidationTriagePortfolio(taskPortfolio.tasks);
  const campaignPortfolio = buildValidationCampaignPortfolio(constraints);
  const campaignIdsByConstraint = campaignIdsByConstraintId(
    campaignPortfolio.campaigns
  );
  const states = [
    ...artifactLibrary.artifacts.map((artifact) =>
      artifactState(artifact, campaignIdsByConstraint)
    ),
    ...taskPortfolio.tasks.map((task) =>
      validationTaskState(task, campaignIdsByConstraint)
    ),
    ...campaignPortfolio.campaigns.map(campaignState),
    ...constraints.map((constraint) =>
      constraintState(constraint, taskPortfolio.tasks, campaignIdsByConstraint)
    )
  ].sort(
    (first, second) =>
      entityTypeOrder(first.entity_type) - entityTypeOrder(second.entity_type) ||
      second.priority - first.priority ||
      first.entity_title.localeCompare(second.entity_title) ||
      first.state_id.localeCompare(second.state_id)
  );

  return {
    summary: summarizeAnalystState({
      artifacts: artifactLibrary.artifacts,
      campaigns: campaignPortfolio.campaigns,
      states,
      topTriageConstraintIds: triagePortfolio.topValidationQueue.map(
        (item) => item.constraint_id
      )
    }),
    states
  };
}

export function analystStatesForCampaign(
  template: AnalystStateTemplate,
  campaignId: string
) {
  const campaignStateRecord = template.states.find(
    (state) => state.entity_type === "campaign" && state.entity_id === campaignId
  );
  const constraintStates = template.states.filter(
    (state) =>
      state.entity_type === "constraint" &&
      state.related_campaign_ids.includes(campaignId)
  );
  const artifactStates = template.states.filter(
    (state) =>
      state.entity_type === "artifact" &&
      state.related_campaign_ids.includes(campaignId)
  );
  const taskStates = template.states.filter(
    (state) =>
      state.entity_type === "validation_task" &&
      state.related_campaign_ids.includes(campaignId)
  );

  return {
    campaignStateRecord,
    constraintStates,
    artifactStates,
    taskStates,
    summary: {
      campaign_status: campaignStateRecord?.status ?? "not_started",
      selected_constraints: constraintStates.length,
      tracked_artifacts: artifactStates.length,
      tracked_tasks: taskStates.length,
      unassigned_records:
        [campaignStateRecord, ...constraintStates, ...artifactStates, ...taskStates]
          .filter((state): state is AnalystStateRecord => Boolean(state))
          .filter((state) => state.owner === "unassigned").length
    }
  };
}

export type CampaignAnalystState = ReturnType<typeof analystStatesForCampaign>;

function artifactState(
  artifact: EvidenceArtifactNeed,
  campaignIdsByConstraint: Map<string, string[]>
): AnalystStateRecord {
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

function validationTaskState(
  task: ValidationTask,
  campaignIdsByConstraint: Map<string, string[]>
): AnalystStateRecord {
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

function campaignState(campaign: ValidationCampaign): AnalystStateRecord {
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

function constraintState(
  constraint: ScoredConstraint,
  tasks: ValidationTask[],
  campaignIdsByConstraint: Map<string, string[]>
): AnalystStateRecord {
  const constraintTasks = tasks.filter((task) => task.constraint_id === constraint.id);
  const highestTask = constraintTasks
    .slice()
    .sort((first, second) => second.priority_score - first.priority_score)[0];

  return {
    state_id: `state:constraint:${constraint.id}`,
    entity_type: "constraint",
    entity_id: constraint.id,
    entity_title: constraint.title,
    status: "unreviewed",
    priority: constraint.scores.total_priority_score,
    owner: "unassigned",
    last_reviewed_at: null,
    next_action:
      highestTask?.recommended_action ??
      "Review the constraint before changing its analyst state.",
    blocker_reason: "Constraint has not been reviewed by an analyst.",
    notes: [
      "Template state only; no analyst review has occurred.",
      `Generated validation confidence is ${constraint.scores.validation_confidence_score.toFixed(1)}.`
    ],
    source: "analyst_state_template",
    updated_at: null,
    related_constraint_ids: [constraint.id],
    related_artifact_ids: [],
    related_validation_task_ids: constraintTasks.map((task) => task.task_id),
    related_campaign_ids: campaignIdsByConstraint.get(constraint.id) ?? []
  };
}

function summarizeAnalystState({
  artifacts,
  campaigns,
  states,
  topTriageConstraintIds
}: {
  artifacts: EvidenceArtifactNeed[];
  campaigns: ValidationCampaign[];
  states: AnalystStateRecord[];
  topTriageConstraintIds: string[];
}): AnalystStateSummary {
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
    status_distribution: distribution(states.map((state) => state.status)),
    entity_type_distribution: distribution(states.map((state) => state.entity_type)),
    high_priority_artifact_coverage:
      highPriorityArtifacts.length === 0
        ? 100
        : round(
            (highPriorityArtifacts.filter((artifact) =>
              stateArtifactIds.has(artifact.artifact_id)
            ).length /
              highPriorityArtifacts.length) *
              100
          ),
    campaign_constraint_coverage:
      campaignConstraintIds.size === 0
        ? 100
        : round(
            (Array.from(campaignConstraintIds).filter((id) =>
              stateConstraintIds.has(id)
            ).length /
              campaignConstraintIds.size) *
              100
          ),
    top_triage_constraint_coverage:
      topTriageConstraintIds.length === 0
        ? 100
        : round(
            (topTriageConstraintIds.filter((id) => stateConstraintIds.has(id)).length /
              topTriageConstraintIds.length) *
              100
          )
  };
}

function entityTypeOrder(entityType: AnalystStateEntityType) {
  if (entityType === "campaign") return 0;
  if (entityType === "constraint") return 1;
  if (entityType === "artifact") return 2;
  return 3;
}

function campaignIdsByConstraintId(campaigns: ValidationCampaign[]) {
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

function distribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
