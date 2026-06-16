import { buildEvidencePackPortfolio } from "@/lib/evidencePacks";
import { buildInterventionStrategies } from "@/lib/interventionSimulator";
import { buildSourceRegistry, type SourceRecord } from "@/lib/sourceRegistry";
import type { ScoredConstraint } from "@/types/constraint";

export type ValidationTaskType =
  | "primary_document_needed"
  | "source_url_needed"
  | "local_observation_needed"
  | "evidence_gap_resolution"
  | "claim_support_needed"
  | "metric_definition_needed"
  | "validation_interview_needed"
  | "high_opportunity_weak_evidence"
  | "low_defensibility_review"
  | "intervention_validation_needed";

export type ValidationTaskSeverity = "Low" | "Moderate" | "High" | "Critical";

export type ValidationTaskStatus = "open" | "blocked" | "review_ready";

export type ValidationTask = {
  task_id: string;
  constraint_id: string;
  constraint_title: string;
  industry: string;
  task_type: ValidationTaskType;
  task_title: string;
  task_summary: string;
  priority_score: number;
  severity: ValidationTaskSeverity;
  status: ValidationTaskStatus;
  evidence_gap: string;
  source_gap: string;
  recommended_action: string;
  expected_artifact: string;
  blocking_reason: string;
  generated_from: string[];
  defensibility_score?: number;
  validation_confidence?: number;
  source_ids: string[];
  investigation_route: string;
  network_route: string;
};

export type ValidationTaskSummary = {
  total_tasks: number;
  open_tasks: number;
  blocked_tasks: number;
  review_ready_tasks: number;
  high_priority_tasks: number;
  primary_document_needed_tasks: number;
  source_url_needed_tasks: number;
  local_observation_needed_tasks: number;
  weakest_defensibility_tasks: ValidationTask[];
  task_type_distribution: Record<string, number>;
  tasks_by_industry: Record<string, number>;
  tasks_by_severity: Record<string, number>;
  top_validation_tasks: ValidationTask[];
  highest_priority_constraints_needing_validation: string[];
  high_opportunity_weak_evidence_tasks: ValidationTask[];
};

export type ValidationTaskPortfolio = {
  tasks: ValidationTask[];
  summary: ValidationTaskSummary;
};

export function buildValidationTaskPortfolio(
  constraints: ScoredConstraint[]
): ValidationTaskPortfolio {
  const sourceRegistry = buildSourceRegistry(constraints);
  const evidencePackPortfolio = buildEvidencePackPortfolio(constraints);
  const interventionStrategies = buildInterventionStrategies(constraints);
  const sourcesByConstraint = sourcesByConstraintId(sourceRegistry.sources);
  const packsByConstraint = new Map(
    evidencePackPortfolio.packs.map((pack) => [pack.constraint_id, pack])
  );
  const strategiesByConstraint = new Map(
    interventionStrategies.map((strategy) => [strategy.constraint_id, strategy])
  );
  const tasks = constraints.flatMap((constraint) => {
    const pack = packsByConstraint.get(constraint.id);
    const strategy = strategiesByConstraint.get(constraint.id);
    const sources = sourcesByConstraint.get(constraint.id) ?? [];

    return [
      ...sourceTasks(constraint, sources, pack?.defensibility_score),
      ...evidenceGapTasks(constraint, pack?.defensibility_score),
      ...claimSupportTasks(constraint, pack),
      ...defensibilityTasks(constraint, pack),
      ...interventionTasks(constraint, strategy, pack?.defensibility_score)
    ];
  });
  const uniqueTasks = dedupeTasks(tasks).sort(
    (first, second) =>
      second.priority_score - first.priority_score ||
      first.constraint_title.localeCompare(second.constraint_title) ||
      first.task_id.localeCompare(second.task_id)
  );

  return {
    tasks: uniqueTasks,
    summary: summarizeValidationTasks(uniqueTasks)
  };
}

export function summarizeValidationTasks(
  tasks: ValidationTask[]
): ValidationTaskSummary {
  return {
    total_tasks: tasks.length,
    open_tasks: tasks.filter((task) => task.status === "open").length,
    blocked_tasks: tasks.filter((task) => task.status === "blocked").length,
    review_ready_tasks: tasks.filter((task) => task.status === "review_ready").length,
    high_priority_tasks: tasks.filter((task) => task.priority_score >= 8).length,
    primary_document_needed_tasks: tasks.filter(
      (task) => task.task_type === "primary_document_needed"
    ).length,
    source_url_needed_tasks: tasks.filter(
      (task) => task.task_type === "source_url_needed"
    ).length,
    local_observation_needed_tasks: tasks.filter(
      (task) => task.task_type === "local_observation_needed"
    ).length,
    weakest_defensibility_tasks: tasks
      .filter((task) => typeof task.defensibility_score === "number")
      .slice()
      .sort(
        (first, second) =>
          (first.defensibility_score ?? 10) - (second.defensibility_score ?? 10)
      )
      .slice(0, 5),
    task_type_distribution: distribution(tasks.map((task) => task.task_type)),
    tasks_by_industry: distribution(tasks.map((task) => task.industry)),
    tasks_by_severity: distribution(tasks.map((task) => task.severity)),
    top_validation_tasks: tasks.slice(0, 8),
    highest_priority_constraints_needing_validation: Array.from(
      new Set(tasks.slice(0, 8).map((task) => task.constraint_title))
    ),
    high_opportunity_weak_evidence_tasks: tasks
      .filter((task) => task.task_type === "high_opportunity_weak_evidence")
      .slice(0, 8)
  };
}

export function tasksForConstraint(
  tasks: ValidationTask[],
  constraintId: string
) {
  return tasks.filter((task) => task.constraint_id === constraintId);
}

function sourceTasks(
  constraint: ScoredConstraint,
  sources: SourceRecord[],
  defensibilityScore?: number
): ValidationTask[] {
  return sources.map((source) => {
    const taskType = sourceTaskType(source);
    const sourceGap =
      source.citation_status === "needs-primary-document"
        ? "Specific primary document is not attached."
        : source.citation_status === "needs-url"
          ? "Source URL, publication date, and scope notes are missing."
          : "Local observation evidence is not attached.";

    return createTask({
      constraint,
      defensibilityScore,
      evidenceGap: "",
      generatedFrom: ["source_registry", "evidence_pack"],
      priorityBase: sourcePriorityBase(source, constraint),
      recommendedAction: source.verification_need,
      sourceGap,
      sourceIds: [source.source_id],
      taskSummary: `${source.title} is referenced, but its citation status is ${source.citation_status}.`,
      taskTitle:
        source.citation_status === "needs-primary-document"
          ? `Attach primary document for ${source.title}`
          : source.citation_status === "needs-url"
            ? `Attach URL and scope notes for ${source.title}`
            : `Collect local observation evidence for ${constraint.title}`,
      taskType,
      expectedArtifact:
        source.citation_status === "needs-primary-document"
          ? "Primary document reference with title, publisher, date, and scope."
          : source.citation_status === "needs-url"
            ? "Source URL with publication date and applicability note."
            : "Local observation note, queue log, interview note, or operational extract."
    });
  });
}

function evidenceGapTasks(
  constraint: ScoredConstraint,
  defensibilityScore?: number
): ValidationTask[] {
  const gapTasks = constraint.evidence_gaps.slice(0, 2).map((gap, index) =>
    createTask({
      constraint,
      defensibilityScore,
      evidenceGap: gap,
      generatedFrom: ["evidence_dossier", "validation_workflow"],
      priorityBase:
        constraint.scores.total_strategic_score +
        (11 - constraint.scores.validation_confidence_score) * 0.35 -
        index * 0.3,
      recommendedAction: `Resolve whether this gap is visible in ${constraint.affected_systems[0]}.`,
      sourceGap: "",
      sourceIds: [],
      taskSummary: `Unresolved evidence gap limits confidence in ${constraint.title}.`,
      taskTitle: `Resolve evidence gap: ${gap}`,
      taskType:
        constraint.measurement_difficulty >= 7
          ? "metric_definition_needed"
          : "evidence_gap_resolution",
      expectedArtifact:
        constraint.measurement_difficulty >= 7
          ? "Metric definition with owner, data source, sampling window, and baseline."
          : "Evidence note showing whether the gap is confirmed, reduced, or disproven."
    })
  );

  if (constraint.scores.opportunity_score >= 7 && constraint.scores.evidence_score < 7) {
    gapTasks.push(
      createTask({
        constraint,
        defensibilityScore,
        evidenceGap: constraint.evidence_gaps[0] ?? "Weak evidence for high opportunity.",
        generatedFrom: ["opportunity_score", "evidence_score"],
        priorityBase:
          constraint.scores.opportunity_score +
          (11 - constraint.scores.evidence_score) * 0.45,
        recommendedAction: "Validate the opportunity signal before using it to rank action priorities.",
        sourceGap: "",
        sourceIds: [],
        taskSummary:
          "This record has attractive opportunity signals, but evidence confidence is not strong enough for action.",
        taskTitle: "Validate high-opportunity weak-evidence record",
        taskType: "high_opportunity_weak_evidence",
        expectedArtifact: "Short validation memo connecting evidence, measured gap, and opportunity thesis."
      })
    );
  }

  return gapTasks;
}

function claimSupportTasks(
  constraint: ScoredConstraint,
  pack:
    | {
        claim_support: Array<{
          claim: string;
          support_level: string;
          supporting_source_ids: string[];
          unresolved_gap: string;
        }>;
        defensibility_score: number;
      }
    | undefined
): ValidationTask[] {
  if (!pack) return [];

  return pack.claim_support
    .slice(0, 2)
    .filter((claim) => claim.support_level !== "strong")
    .map((claim) =>
      createTask({
        constraint,
        defensibilityScore: pack.defensibility_score,
        evidenceGap: claim.unresolved_gap,
        generatedFrom: ["claim_support", "evidence_pack"],
        priorityBase:
          constraint.scores.total_strategic_score +
          (claim.support_level === "weak" ? 1.1 : 0.4),
        recommendedAction: `Attach evidence that directly supports or rejects: ${claim.claim}`,
        sourceGap: claim.supporting_source_ids.length === 0 ? "No supporting source IDs attached." : "",
        sourceIds: claim.supporting_source_ids,
        taskSummary: `${claim.support_level} claim support limits defensibility.`,
        taskTitle: `Strengthen claim support for ${constraint.title}`,
        taskType: "claim_support_needed",
        expectedArtifact: "Claim support note with source IDs, quoted finding summary, and unresolved caveat."
      })
    );
}

function defensibilityTasks(
  constraint: ScoredConstraint,
  pack: { defensibility_score: number; audit_flags: string[] } | undefined
): ValidationTask[] {
  if (!pack || pack.defensibility_score >= 6) return [];

  return [
    createTask({
      constraint,
      defensibilityScore: pack.defensibility_score,
      evidenceGap: constraint.evidence_gaps[0] ?? "",
      generatedFrom: ["evidence_pack", "source_registry"],
      priorityBase:
        constraint.scores.total_strategic_score + (6 - pack.defensibility_score),
      recommendedAction:
        "Review source coverage, claim support, and provenance gaps before using this record as validated intelligence.",
      sourceGap: pack.audit_flags.join("; "),
      sourceIds: [],
      taskSummary: `Evidence pack defensibility is ${pack.defensibility_score.toFixed(1)}/10.`,
      taskTitle: "Review low-defensibility evidence pack",
      taskType: "low_defensibility_review",
      expectedArtifact: "Defensibility review note with source upgrades and claim support decisions."
    })
  ];
}

function interventionTasks(
  constraint: ScoredConstraint,
  strategy:
    | {
        action_confidence: number;
        intervention_priority_score: number;
        required_evidence: string[];
      }
    | undefined,
  defensibilityScore?: number
): ValidationTask[] {
  if (!strategy || strategy.action_confidence >= 7) return [];

  return [
    createTask({
      constraint,
      defensibilityScore,
      evidenceGap: strategy.required_evidence[0] ?? constraint.evidence_gaps[0] ?? "",
      generatedFrom: ["intervention_strategy", "validation_workflow"],
      priorityBase:
        strategy.intervention_priority_score +
        (11 - strategy.action_confidence) * 0.45,
      recommendedAction:
        "Treat the intervention as a validation experiment until action confidence improves.",
      sourceGap: "",
      sourceIds: [],
      taskSummary:
        "The intervention is validation-dependent; evidence should improve before broader rollout.",
      taskTitle: "Validate intervention before action",
      taskType: "intervention_validation_needed",
      expectedArtifact: "Experiment plan with baseline metric, success threshold, and stop condition."
    })
  ];
}

function createTask({
  constraint,
  defensibilityScore,
  evidenceGap,
  expectedArtifact,
  generatedFrom,
  priorityBase,
  recommendedAction,
  sourceGap,
  sourceIds,
  taskSummary,
  taskTitle,
  taskType
}: {
  constraint: ScoredConstraint;
  defensibilityScore?: number;
  evidenceGap: string;
  expectedArtifact: string;
  generatedFrom: string[];
  priorityBase: number;
  recommendedAction: string;
  sourceGap: string;
  sourceIds: string[];
  taskSummary: string;
  taskTitle: string;
  taskType: ValidationTaskType;
}) {
  const priorityScore = clamp(round(priorityBase));
  const severity = severityFor(priorityScore, defensibilityScore);

  return {
    task_id: taskId(constraint.id, taskType, taskTitle),
    constraint_id: constraint.id,
    constraint_title: constraint.title,
    industry: constraint.industry,
    task_type: taskType,
    task_title: taskTitle,
    task_summary: taskSummary,
    priority_score: priorityScore,
    severity,
    status: statusFor(taskType, sourceGap, evidenceGap, priorityScore),
    evidence_gap: evidenceGap,
    source_gap: sourceGap,
    recommended_action: recommendedAction,
    expected_artifact: expectedArtifact,
    blocking_reason: blockingReason(taskType, sourceGap, evidenceGap),
    generated_from: generatedFrom,
    defensibility_score: defensibilityScore,
    validation_confidence: constraint.scores.validation_confidence_score,
    source_ids: sourceIds,
    investigation_route: `/constraints/${constraint.id}`,
    network_route: `/network?focus=${constraint.id}`
  } satisfies ValidationTask;
}

function sourceTaskType(source: SourceRecord): ValidationTaskType {
  if (source.citation_status === "needs-primary-document") {
    return "primary_document_needed";
  }
  if (source.citation_status === "local-observation-needed") {
    return "local_observation_needed";
  }
  return "source_url_needed";
}

function sourcePriorityBase(source: SourceRecord, constraint: ScoredConstraint) {
  const citationBoost =
    source.citation_status === "needs-primary-document"
      ? 1.1
      : source.citation_status === "local-observation-needed"
        ? 0.8
        : 0.5;

  return (
    constraint.scores.total_strategic_score * 0.65 +
    (11 - constraint.scores.validation_confidence_score) * 0.25 +
    citationBoost
  );
}

function statusFor(
  taskType: ValidationTaskType,
  sourceGap: string,
  evidenceGap: string,
  priorityScore: number
): ValidationTaskStatus {
  if (
    taskType === "primary_document_needed" ||
    taskType === "source_url_needed" ||
    taskType === "local_observation_needed"
  ) {
    return "blocked";
  }
  if (!sourceGap && !evidenceGap && priorityScore < 6.2) return "review_ready";
  return "open";
}

function severityFor(
  priorityScore: number,
  defensibilityScore: number | undefined
): ValidationTaskSeverity {
  if (priorityScore >= 8.5 || (defensibilityScore ?? 10) < 5) return "Critical";
  if (priorityScore >= 7.4 || (defensibilityScore ?? 10) < 5.8) return "High";
  if (priorityScore >= 6.2) return "Moderate";
  return "Low";
}

function blockingReason(
  taskType: ValidationTaskType,
  sourceGap: string,
  evidenceGap: string
) {
  if (sourceGap) return sourceGap;
  if (taskType === "intervention_validation_needed") {
    return "Action confidence depends on validation evidence.";
  }
  if (evidenceGap) return `Evidence gap remains unresolved: ${evidenceGap}`;
  return "No hard blocker; ready for analyst review.";
}

function sourcesByConstraintId(sources: SourceRecord[]) {
  const map = new Map<string, SourceRecord[]>();
  sources.forEach((source) => {
    source.referenced_by.forEach((constraintId) => {
      map.set(constraintId, [...(map.get(constraintId) ?? []), source]);
    });
  });
  return map;
}

function dedupeTasks(tasks: ValidationTask[]) {
  return Array.from(new Map(tasks.map((task) => [task.task_id, task])).values());
}

function taskId(
  constraintId: string,
  type: ValidationTaskType,
  title: string
) {
  return `task:${constraintId}:${type}:${slug(title)}`;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function distribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function clamp(value: number) {
  return Math.max(1, Math.min(10, value));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
