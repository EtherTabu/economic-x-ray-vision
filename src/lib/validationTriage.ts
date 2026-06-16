import type { ValidationTask, ValidationTaskSeverity } from "@/lib/validationTasks";

export type ValidationTaskClusterType =
  | "source"
  | "evidence"
  | "metric"
  | "intervention-blocking";

export type ValidationTriageSeverity = ValidationTaskSeverity;

export type ValidationTaskCluster = {
  cluster_type: ValidationTaskClusterType;
  task_count: number;
  max_priority_score: number;
  blocked_tasks: number;
  representative_task_ids: string[];
  rationale: string;
};

export type NextBestValidationAction = {
  action_title: string;
  action_summary: string;
  task_type: string;
  cluster_type: ValidationTaskClusterType;
  priority_score: number;
  expected_artifact: string;
  rationale: string;
  task_id: string;
};

export type ConstraintValidationTriage = {
  constraint_id: string;
  constraint_title: string;
  industry: string;
  task_count: number;
  open_tasks: number;
  blocked_tasks: number;
  review_ready_tasks: number;
  cluster_count: number;
  task_clusters: ValidationTaskCluster[];
  next_best_action: NextBestValidationAction;
  validation_burden_score: number;
  recalibrated_severity: ValidationTriageSeverity;
  top_task_ids: string[];
  rationale: string;
  investigation_route: string;
  network_route: string;
};

export type ValidationTriageSummary = {
  constraints_with_tasks: number;
  total_tasks_compressed: number;
  top_queue_count: number;
  original_critical_tasks: number;
  recalibrated_critical_count: number;
  recalibrated_severity_distribution: Record<string, number>;
  cluster_distribution: Record<string, number>;
  average_validation_burden_score: number;
  highest_burden_constraint: string;
};

export type ValidationTriagePortfolio = {
  summary: ValidationTriageSummary;
  constraint_triage: ConstraintValidationTriage[];
  topValidationQueue: ConstraintValidationTriage[];
};

export function buildValidationTriagePortfolio(
  tasks: ValidationTask[]
): ValidationTriagePortfolio {
  const constraintTriage = Array.from(groupTasksByConstraint(tasks).values())
    .map(buildConstraintTriage)
    .sort(
      (first, second) =>
        second.validation_burden_score - first.validation_burden_score ||
        second.next_best_action.priority_score - first.next_best_action.priority_score ||
        first.constraint_title.localeCompare(second.constraint_title)
    );
  const topValidationQueue = constraintTriage.slice(0, 10);

  return {
    summary: summarizeTriage(tasks, constraintTriage, topValidationQueue),
    constraint_triage: constraintTriage,
    topValidationQueue
  };
}

export function clusterTypeForTask(task: Pick<ValidationTask, "task_type">) {
  if (
    task.task_type === "primary_document_needed" ||
    task.task_type === "source_url_needed" ||
    task.task_type === "local_observation_needed"
  ) {
    return "source";
  }

  if (task.task_type === "metric_definition_needed") return "metric";
  if (task.task_type === "intervention_validation_needed") {
    return "intervention-blocking";
  }

  return "evidence";
}

function buildConstraintTriage(tasks: ValidationTask[]): ConstraintValidationTriage {
  const sortedTasks = tasks
    .slice()
    .sort(
      (first, second) =>
        actionPriority(second) - actionPriority(first) ||
        first.task_title.localeCompare(second.task_title)
    );
  const representative = sortedTasks[0];
  const taskClusters = buildTaskClusters(sortedTasks);
  const burden = validationBurdenScore(sortedTasks, taskClusters);
  const severity = recalibratedSeverity(burden, taskClusters, sortedTasks);
  const nextBestAction = nextBestActionFor(representative, sortedTasks, taskClusters);

  return {
    constraint_id: representative.constraint_id,
    constraint_title: representative.constraint_title,
    industry: representative.industry,
    task_count: sortedTasks.length,
    open_tasks: sortedTasks.filter((task) => task.status === "open").length,
    blocked_tasks: sortedTasks.filter((task) => task.status === "blocked").length,
    review_ready_tasks: sortedTasks.filter((task) => task.status === "review_ready")
      .length,
    cluster_count: taskClusters.length,
    task_clusters: taskClusters,
    next_best_action: nextBestAction,
    validation_burden_score: burden,
    recalibrated_severity: severity,
    top_task_ids: sortedTasks.slice(0, 5).map((task) => task.task_id),
    rationale: triageRationale(sortedTasks, taskClusters, burden, severity),
    investigation_route: representative.investigation_route,
    network_route: representative.network_route
  };
}

function buildTaskClusters(tasks: ValidationTask[]) {
  const clusters = new Map<ValidationTaskClusterType, ValidationTask[]>();

  tasks.forEach((task) => {
    const clusterType = clusterTypeForTask(task);
    clusters.set(clusterType, [...(clusters.get(clusterType) ?? []), task]);
  });

  return Array.from(clusters.entries())
    .map(([clusterType, clusterTasks]) => {
      const sortedTasks = clusterTasks
        .slice()
        .sort((first, second) => second.priority_score - first.priority_score);

      return {
        cluster_type: clusterType,
        task_count: clusterTasks.length,
        max_priority_score: round(
          Math.max(...clusterTasks.map((task) => task.priority_score))
        ),
        blocked_tasks: clusterTasks.filter((task) => task.status === "blocked")
          .length,
        representative_task_ids: sortedTasks.slice(0, 3).map((task) => task.task_id),
        rationale: clusterRationale(clusterType, clusterTasks)
      };
    })
    .sort(
      (first, second) =>
        second.max_priority_score - first.max_priority_score ||
        second.task_count - first.task_count
    );
}

function nextBestActionFor(
  representative: ValidationTask,
  tasks: ValidationTask[],
  clusters: ValidationTaskCluster[]
): NextBestValidationAction {
  const clusterType = clusterTypeForTask(representative);

  return {
    action_title: actionTitle(representative, clusterType),
    action_summary: representative.recommended_action,
    task_type: representative.task_type,
    cluster_type: clusterType,
    priority_score: actionPriority(representative),
    expected_artifact: representative.expected_artifact,
    rationale: actionRationale(representative, tasks, clusters),
    task_id: representative.task_id
  };
}

function validationBurdenScore(
  tasks: ValidationTask[],
  clusters: ValidationTaskCluster[]
) {
  const maxPriority = Math.max(...tasks.map((task) => task.priority_score));
  const averagePriority =
    tasks.reduce((sum, task) => sum + task.priority_score, 0) / tasks.length;
  const blockedCount = tasks.filter((task) => task.status === "blocked").length;
  const highPriorityCount = tasks.filter((task) => task.priority_score >= 8).length;
  const defensibilityValues = tasks
    .map((task) => task.defensibility_score)
    .filter((score): score is number => typeof score === "number");
  const weakestDefensibility =
    defensibilityValues.length > 0 ? Math.min(...defensibilityValues) : 7;

  return clamp(
    round(
      maxPriority * 0.3 +
        averagePriority * 0.18 +
        Math.min(10, tasks.length) * 0.24 +
        Math.min(5, highPriorityCount) * 0.28 +
        clusters.length * 0.45 +
        Math.min(4, blockedCount) * 0.22 +
        Math.max(0, 6 - weakestDefensibility) * 0.35
    )
  );
}

function recalibratedSeverity(
  burden: number,
  clusters: ValidationTaskCluster[],
  tasks: ValidationTask[]
): ValidationTriageSeverity {
  const hasInterventionBlock = clusters.some(
    (cluster) => cluster.cluster_type === "intervention-blocking"
  );
  const hasSourceBlock = clusters.some(
    (cluster) => cluster.cluster_type === "source" && cluster.blocked_tasks > 0
  );
  const maxPriority = Math.max(...tasks.map((task) => task.priority_score));

  if (
    burden >= 9.6 &&
    maxPriority >= 9.7 &&
    clusters.length >= 3 &&
    hasInterventionBlock &&
    hasSourceBlock
  ) {
    return "Critical";
  }
  if (burden >= 8.1) return "High";
  if (burden >= 6.4) return "Moderate";
  return "Low";
}

function actionPriority(task: ValidationTask) {
  const clusterType = clusterTypeForTask(task);
  const clusterBoost =
    clusterType === "source"
      ? task.task_type === "primary_document_needed"
        ? 0.8
        : 0.45
      : clusterType === "metric"
        ? 0.7
        : clusterType === "intervention-blocking"
          ? 0.65
          : 0.5;
  const blockerBoost = task.status === "blocked" ? 0.3 : 0;
  const weakEvidenceBoost =
    typeof task.defensibility_score === "number"
      ? Math.max(0, 6 - task.defensibility_score) * 0.2
      : 0;

  return clamp(round(task.priority_score + clusterBoost + blockerBoost + weakEvidenceBoost));
}

function summarizeTriage(
  tasks: ValidationTask[],
  constraintTriage: ConstraintValidationTriage[],
  topValidationQueue: ConstraintValidationTriage[]
): ValidationTriageSummary {
  return {
    constraints_with_tasks: constraintTriage.length,
    total_tasks_compressed: tasks.length,
    top_queue_count: topValidationQueue.length,
    original_critical_tasks: tasks.filter((task) => task.severity === "Critical")
      .length,
    recalibrated_critical_count: constraintTriage.filter(
      (triage) => triage.recalibrated_severity === "Critical"
    ).length,
    recalibrated_severity_distribution: distribution(
      constraintTriage.map((triage) => triage.recalibrated_severity)
    ),
    cluster_distribution: distribution(
      constraintTriage.flatMap((triage) =>
        triage.task_clusters.flatMap((cluster) =>
          Array.from({ length: cluster.task_count }, () => cluster.cluster_type)
        )
      )
    ),
    average_validation_burden_score: round(
      constraintTriage.reduce(
        (sum, triage) => sum + triage.validation_burden_score,
        0
      ) / constraintTriage.length
    ),
    highest_burden_constraint: constraintTriage[0]?.constraint_title ?? "None"
  };
}

function groupTasksByConstraint(tasks: ValidationTask[]) {
  const groups = new Map<string, ValidationTask[]>();

  tasks.forEach((task) => {
    groups.set(task.constraint_id, [...(groups.get(task.constraint_id) ?? []), task]);
  });

  return groups;
}

function actionTitle(task: ValidationTask, clusterType: ValidationTaskClusterType) {
  if (clusterType === "source") return `Upgrade source evidence: ${task.constraint_title}`;
  if (clusterType === "metric") return `Define validation metric: ${task.constraint_title}`;
  if (clusterType === "intervention-blocking") {
    return `Unblock intervention validation: ${task.constraint_title}`;
  }
  return `Resolve evidence blocker: ${task.constraint_title}`;
}

function actionRationale(
  task: ValidationTask,
  tasks: ValidationTask[],
  clusters: ValidationTaskCluster[]
) {
  return [
    `${tasks.length} generated task${tasks.length === 1 ? "" : "s"} compress into ${clusters.length} validation cluster${clusters.length === 1 ? "" : "s"}.`,
    `${clusterLabel(clusterTypeForTask(task))} is the highest-leverage next action because it carries priority ${task.priority_score.toFixed(1)} and blocks confidence in the constraint.`,
    task.blocking_reason
  ].join(" ");
}

function triageRationale(
  tasks: ValidationTask[],
  clusters: ValidationTaskCluster[],
  burden: number,
  severity: ValidationTriageSeverity
) {
  const clusterLabels = clusters
    .map((cluster) => `${clusterLabel(cluster.cluster_type)} (${cluster.task_count})`)
    .join(", ");

  return `Validation burden ${burden.toFixed(1)} is ${severity.toLowerCase()} after compressing ${tasks.length} raw tasks into ${clusters.length} cluster${clusters.length === 1 ? "" : "s"}: ${clusterLabels}.`;
}

function clusterRationale(
  clusterType: ValidationTaskClusterType,
  tasks: ValidationTask[]
) {
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const maxPriority = Math.max(...tasks.map((task) => task.priority_score));

  return `${clusterLabel(clusterType)} cluster contains ${tasks.length} task${tasks.length === 1 ? "" : "s"} with max priority ${maxPriority.toFixed(1)}${blocked > 0 ? ` and ${blocked} blocked task${blocked === 1 ? "" : "s"}` : ""}.`;
}

function clusterLabel(clusterType: ValidationTaskClusterType) {
  if (clusterType === "intervention-blocking") return "intervention-blocking";
  return clusterType;
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
