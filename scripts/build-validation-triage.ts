type ValidationTriageBuildFsModule = typeof import("node:fs");
type ValidationTriageBuildPathModule = typeof import("node:path");

const {
  existsSync: triageBuildExistsSync,
  mkdirSync: triageBuildMkdirSync,
  readFileSync: triageBuildReadFileSync,
  writeFileSync: triageBuildWriteFileSync
} = process.getBuiltinModule("fs") as ValidationTriageBuildFsModule;
const {
  dirname: triageBuildDirname,
  resolve: triageBuildResolve
} = process.getBuiltinModule("path") as ValidationTriageBuildPathModule;

const triageBuildTaskPath = triageBuildResolve("data/exports/validation_tasks.json");
const triageBuildOutputPath = triageBuildResolve(
  "data/exports/validation_triage.json"
);

type TriageBuildTask = {
  task_id: string;
  constraint_id: string;
  constraint_title: string;
  industry: string;
  task_type: string;
  task_title: string;
  task_summary: string;
  priority_score: number;
  severity: string;
  status: string;
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

type TriageBuildClusterType =
  | "source"
  | "evidence"
  | "metric"
  | "intervention-blocking";

type TriageBuildCluster = {
  cluster_type: TriageBuildClusterType;
  task_count: number;
  max_priority_score: number;
  blocked_tasks: number;
  representative_task_ids: string[];
  rationale: string;
};

type TriageBuildConstraint = {
  constraint_id: string;
  constraint_title: string;
  industry: string;
  task_count: number;
  open_tasks: number;
  blocked_tasks: number;
  review_ready_tasks: number;
  cluster_count: number;
  task_clusters: TriageBuildCluster[];
  next_best_action: {
    action_title: string;
    action_summary: string;
    task_type: string;
    cluster_type: TriageBuildClusterType;
    priority_score: number;
    expected_artifact: string;
    rationale: string;
    task_id: string;
  };
  validation_burden_score: number;
  recalibrated_severity: string;
  top_task_ids: string[];
  rationale: string;
  investigation_route: string;
  network_route: string;
};

function triageBuildMain() {
  const taskExport = triageBuildReadJson<{ tasks: TriageBuildTask[] }>(
    triageBuildTaskPath
  );
  const constraintTriage = Array.from(
    triageBuildGroupTasks(taskExport.tasks).values()
  )
    .map(triageBuildConstraintTriage)
    .sort(
      (first, second) =>
        second.validation_burden_score - first.validation_burden_score ||
        second.next_best_action.priority_score -
          first.next_best_action.priority_score ||
        first.constraint_title.localeCompare(second.constraint_title)
    );
  const topValidationQueue = constraintTriage.slice(0, 10);
  const output = {
    generated_at: new Date().toISOString(),
    summary: triageBuildSummary(
      taskExport.tasks,
      constraintTriage,
      topValidationQueue
    ),
    constraint_level_triage: constraintTriage,
    task_clusters: triageBuildPortfolioClusters(constraintTriage),
    next_best_actions: constraintTriage.map((triage) => ({
      constraint_id: triage.constraint_id,
      constraint_title: triage.constraint_title,
      ...triage.next_best_action,
      validation_burden_score: triage.validation_burden_score,
      recalibrated_severity: triage.recalibrated_severity,
      investigation_route: triage.investigation_route,
      network_route: triage.network_route
    })),
    topValidationQueue
  };

  triageBuildMkdirSync(triageBuildDirname(triageBuildOutputPath), {
    recursive: true
  });
  triageBuildWriteStableJson(triageBuildOutputPath, output);
  console.log(
    `Built validation triage for ${constraintTriage.length} constraints and ${topValidationQueue.length} top actions at ${triageBuildOutputPath}.`
  );
}

function triageBuildConstraintTriage(
  tasks: TriageBuildTask[]
): TriageBuildConstraint {
  const sortedTasks = tasks
    .slice()
    .sort(
      (first, second) =>
        triageBuildActionPriority(second) - triageBuildActionPriority(first) ||
        first.task_title.localeCompare(second.task_title)
    );
  const representative = sortedTasks[0];
  const taskClusters = triageBuildClusters(sortedTasks);
  const burden = triageBuildBurden(sortedTasks, taskClusters);
  const severity = triageBuildSeverity(burden, taskClusters, sortedTasks);
  const clusterType = triageBuildClusterType(representative);

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
    next_best_action: {
      action_title: triageBuildActionTitle(representative, clusterType),
      action_summary: representative.recommended_action,
      task_type: representative.task_type,
      cluster_type: clusterType,
      priority_score: triageBuildActionPriority(representative),
      expected_artifact: representative.expected_artifact,
      rationale: triageBuildActionRationale(representative, sortedTasks, taskClusters),
      task_id: representative.task_id
    },
    validation_burden_score: burden,
    recalibrated_severity: severity,
    top_task_ids: sortedTasks.slice(0, 5).map((task) => task.task_id),
    rationale: triageBuildRationale(sortedTasks, taskClusters, burden, severity),
    investigation_route: representative.investigation_route,
    network_route: representative.network_route
  };
}

function triageBuildClusters(tasks: TriageBuildTask[]) {
  const clusters = new Map<TriageBuildClusterType, TriageBuildTask[]>();
  tasks.forEach((task) => {
    const clusterType = triageBuildClusterType(task);
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
        max_priority_score: triageBuildRound(
          Math.max(...clusterTasks.map((task) => task.priority_score))
        ),
        blocked_tasks: clusterTasks.filter((task) => task.status === "blocked")
          .length,
        representative_task_ids: sortedTasks.slice(0, 3).map((task) => task.task_id),
        rationale: triageBuildClusterRationale(clusterType, clusterTasks)
      };
    })
    .sort(
      (first, second) =>
        second.max_priority_score - first.max_priority_score ||
        second.task_count - first.task_count
    );
}

function triageBuildSummary(
  tasks: TriageBuildTask[],
  constraintTriage: TriageBuildConstraint[],
  topValidationQueue: TriageBuildConstraint[]
) {
  return {
    constraints_with_tasks: constraintTriage.length,
    total_tasks_compressed: tasks.length,
    top_queue_count: topValidationQueue.length,
    original_critical_tasks: tasks.filter((task) => task.severity === "Critical")
      .length,
    recalibrated_critical_count: constraintTriage.filter(
      (triage) => triage.recalibrated_severity === "Critical"
    ).length,
    recalibrated_severity_distribution: triageBuildDistribution(
      constraintTriage.map((triage) => triage.recalibrated_severity)
    ),
    cluster_distribution: triageBuildDistribution(
      constraintTriage.flatMap((triage) =>
        triage.task_clusters.flatMap((cluster) =>
          Array.from({ length: cluster.task_count }, () => cluster.cluster_type)
        )
      )
    ),
    average_validation_burden_score: triageBuildRound(
      constraintTriage.reduce(
        (sum, triage) => sum + triage.validation_burden_score,
        0
      ) / constraintTriage.length
    ),
    highest_burden_constraint: constraintTriage[0]?.constraint_title ?? "None"
  };
}

function triageBuildPortfolioClusters(triage: TriageBuildConstraint[]) {
  return Object.entries(
    triageBuildDistribution(
      triage.flatMap((item) =>
        item.task_clusters.flatMap((cluster) =>
          Array.from({ length: cluster.task_count }, () => cluster.cluster_type)
        )
      )
    )
  ).map(([cluster_type, task_count]) => ({
    cluster_type,
    task_count
  }));
}

function triageBuildClusterType(task: Pick<TriageBuildTask, "task_type">) {
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

function triageBuildBurden(
  tasks: TriageBuildTask[],
  clusters: TriageBuildCluster[]
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

  return triageBuildClamp(
    triageBuildRound(
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

function triageBuildSeverity(
  burden: number,
  clusters: TriageBuildCluster[],
  tasks: TriageBuildTask[]
) {
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

function triageBuildActionPriority(task: TriageBuildTask) {
  const clusterType = triageBuildClusterType(task);
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

  return triageBuildClamp(
    triageBuildRound(task.priority_score + clusterBoost + blockerBoost + weakEvidenceBoost)
  );
}

function triageBuildActionTitle(
  task: TriageBuildTask,
  clusterType: TriageBuildClusterType
) {
  if (clusterType === "source") return `Upgrade source evidence: ${task.constraint_title}`;
  if (clusterType === "metric") return `Define validation metric: ${task.constraint_title}`;
  if (clusterType === "intervention-blocking") {
    return `Unblock intervention validation: ${task.constraint_title}`;
  }
  return `Resolve evidence blocker: ${task.constraint_title}`;
}

function triageBuildActionRationale(
  task: TriageBuildTask,
  tasks: TriageBuildTask[],
  clusters: TriageBuildCluster[]
) {
  return [
    `${tasks.length} generated task${tasks.length === 1 ? "" : "s"} compress into ${clusters.length} validation cluster${clusters.length === 1 ? "" : "s"}.`,
    `${triageBuildClusterLabel(triageBuildClusterType(task))} is the highest-leverage next action because it carries priority ${task.priority_score.toFixed(1)} and blocks confidence in the constraint.`,
    task.blocking_reason
  ].join(" ");
}

function triageBuildRationale(
  tasks: TriageBuildTask[],
  clusters: TriageBuildCluster[],
  burden: number,
  severity: string
) {
  const clusterLabels = clusters
    .map((cluster) => `${triageBuildClusterLabel(cluster.cluster_type)} (${cluster.task_count})`)
    .join(", ");

  return `Validation burden ${burden.toFixed(1)} is ${severity.toLowerCase()} after compressing ${tasks.length} raw tasks into ${clusters.length} cluster${clusters.length === 1 ? "" : "s"}: ${clusterLabels}.`;
}

function triageBuildClusterRationale(
  clusterType: TriageBuildClusterType,
  tasks: TriageBuildTask[]
) {
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const maxPriority = Math.max(...tasks.map((task) => task.priority_score));

  return `${triageBuildClusterLabel(clusterType)} cluster contains ${tasks.length} task${tasks.length === 1 ? "" : "s"} with max priority ${maxPriority.toFixed(1)}${blocked > 0 ? ` and ${blocked} blocked task${blocked === 1 ? "" : "s"}` : ""}.`;
}

function triageBuildClusterLabel(clusterType: TriageBuildClusterType) {
  return clusterType;
}

function triageBuildGroupTasks(tasks: TriageBuildTask[]) {
  const groups = new Map<string, TriageBuildTask[]>();
  tasks.forEach((task) => {
    groups.set(task.constraint_id, [...(groups.get(task.constraint_id) ?? []), task]);
  });
  return groups;
}

function triageBuildReadJson<T>(path: string) {
  return JSON.parse(triageBuildReadFileSync(path, "utf8")) as T;
}

function triageBuildWriteStableJson(
  path: string,
  output: Record<string, unknown>
) {
  const stableOutput = triageBuildPreserveGeneratedAt(path, output);
  triageBuildWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function triageBuildPreserveGeneratedAt(
  path: string,
  output: Record<string, unknown>
) {
  if (!triageBuildExistsSync(path)) return output;
  const existing = JSON.parse(triageBuildReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const comparable = { ...existing, generated_at: output.generated_at };
  if (JSON.stringify(comparable) === JSON.stringify(output)) {
    return { ...output, generated_at: existing.generated_at };
  }
  return output;
}

function triageBuildDistribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function triageBuildClamp(value: number) {
  return Math.max(1, Math.min(10, value));
}

function triageBuildRound(value: number) {
  return Math.round(value * 10) / 10;
}

triageBuildMain();
