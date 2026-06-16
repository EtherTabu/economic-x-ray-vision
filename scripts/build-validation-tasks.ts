type ValidationTaskBuildFsModule = typeof import("node:fs");
type ValidationTaskBuildPathModule = typeof import("node:path");

const {
  existsSync: taskBuildExistsSync,
  mkdirSync: taskBuildMkdirSync,
  readFileSync: taskBuildReadFileSync,
  writeFileSync: taskBuildWriteFileSync
} = process.getBuiltinModule("fs") as ValidationTaskBuildFsModule;
const {
  dirname: taskBuildDirname,
  resolve: taskBuildResolve
} = process.getBuiltinModule("path") as ValidationTaskBuildPathModule;

const taskBuildDatasetPath = taskBuildResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const taskBuildEvidencePackPath = taskBuildResolve(
  "data/exports/evidence_packs.json"
);
const taskBuildInterventionPath = taskBuildResolve(
  "data/exports/intervention_strategies.json"
);
const taskBuildOutputPath = taskBuildResolve("data/exports/validation_tasks.json");

type TaskBuildRecord = {
  id: string;
  title: string;
  industry: string;
  evidence_gaps: string[];
  measurement_difficulty: number;
  affected_systems: string[];
  scores: Record<string, number>;
};

type TaskBuildSourceRecord = {
  source_id: string;
  title: string;
  citation_status: string;
  verification_need: string;
};

type TaskBuildPack = {
  constraint_id: string;
  constraint_title: string;
  source_records: TaskBuildSourceRecord[];
  claim_support: Array<{
    claim: string;
    support_level: string;
    supporting_source_ids: string[];
    unresolved_gap: string;
  }>;
  defensibility_score: number;
  audit_flags: string[];
};

type TaskBuildStrategy = {
  constraint_id: string;
  action_confidence: number;
  intervention_priority_score: number;
  required_evidence: string[];
};

type TaskBuildValidationTask = {
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

function taskBuildMain() {
  const dataset = taskBuildReadJson<{ records: TaskBuildRecord[] }>(
    taskBuildDatasetPath
  );
  const evidencePacks = taskBuildReadJson<{ packs: TaskBuildPack[] }>(
    taskBuildEvidencePackPath
  );
  const interventions = taskBuildReadJson<{ strategies: TaskBuildStrategy[] }>(
    taskBuildInterventionPath
  );
  const packById = new Map(
    evidencePacks.packs.map((pack) => [pack.constraint_id, pack])
  );
  const strategyById = new Map(
    interventions.strategies.map((strategy) => [strategy.constraint_id, strategy])
  );
  const tasks = taskBuildDedupe(
    dataset.records.flatMap((record) =>
      taskBuildTasksForRecord(
        record,
        packById.get(record.id),
        strategyById.get(record.id)
      )
    )
  ).sort(
    (first, second) =>
      second.priority_score - first.priority_score ||
      first.constraint_title.localeCompare(second.constraint_title) ||
      first.task_id.localeCompare(second.task_id)
  );
  const output = {
    generated_at: new Date().toISOString(),
    task_count: tasks.length,
    task_summary: taskBuildSummary(tasks),
    tasks
  };

  taskBuildMkdirSync(taskBuildDirname(taskBuildOutputPath), { recursive: true });
  taskBuildWriteStableJson(taskBuildOutputPath, output);
  console.log(
    `Built ${tasks.length} validation tasks at ${taskBuildOutputPath}.`
  );
}

function taskBuildTasksForRecord(
  record: TaskBuildRecord,
  pack: TaskBuildPack | undefined,
  strategy: TaskBuildStrategy | undefined
) {
  const tasks: TaskBuildValidationTask[] = [];

  pack?.source_records.forEach((source) => {
    const sourceGap =
      source.citation_status === "needs-primary-document"
        ? "Specific primary document is not attached."
        : source.citation_status === "needs-url"
          ? "Source URL, publication date, and scope notes are missing."
          : "Local observation evidence is not attached.";
    const taskType =
      source.citation_status === "needs-primary-document"
        ? "primary_document_needed"
        : source.citation_status === "local-observation-needed"
          ? "local_observation_needed"
          : "source_url_needed";

    tasks.push(
      taskBuildTask({
        defensibilityScore: pack.defensibility_score,
        evidenceGap: "",
        expectedArtifact:
          taskType === "primary_document_needed"
            ? "Primary document reference with title, publisher, date, and scope."
            : taskType === "source_url_needed"
              ? "Source URL with publication date and applicability note."
              : "Local observation note, queue log, interview note, or operational extract.",
        generatedFrom: ["source_registry", "evidence_pack"],
        priorityBase:
          record.scores.total_strategic_score * 0.65 +
          (11 - record.scores.validation_confidence_score) * 0.25 +
          (taskType === "primary_document_needed" ? 1.1 : taskType === "local_observation_needed" ? 0.8 : 0.5),
        recommendedAction: source.verification_need,
        record,
        sourceGap,
        sourceIds: [source.source_id],
        taskSummary: `${source.title} is referenced, but its citation status is ${source.citation_status}.`,
        taskTitle:
          taskType === "primary_document_needed"
            ? `Attach primary document for ${source.title}`
            : taskType === "source_url_needed"
              ? `Attach URL and scope notes for ${source.title}`
              : `Collect local observation evidence for ${record.title}`,
        taskType
      })
    );
  });

  record.evidence_gaps.slice(0, 2).forEach((gap, index) => {
    tasks.push(
      taskBuildTask({
        defensibilityScore: pack?.defensibility_score,
        evidenceGap: gap,
        expectedArtifact:
          record.measurement_difficulty >= 7
            ? "Metric definition with owner, data source, sampling window, and baseline."
            : "Evidence note showing whether the gap is confirmed, reduced, or disproven.",
        generatedFrom: ["evidence_dossier", "validation_workflow"],
        priorityBase:
          record.scores.total_strategic_score +
          (11 - record.scores.validation_confidence_score) * 0.35 -
          index * 0.3,
        recommendedAction: `Resolve whether this gap is visible in ${record.affected_systems[0]}.`,
        record,
        sourceGap: "",
        sourceIds: [],
        taskSummary: `Unresolved evidence gap limits confidence in ${record.title}.`,
        taskTitle: `Resolve evidence gap: ${gap}`,
        taskType:
          record.measurement_difficulty >= 7
            ? "metric_definition_needed"
            : "evidence_gap_resolution"
      })
    );
  });

  if (record.scores.opportunity_score >= 7 && record.scores.evidence_score < 7) {
    tasks.push(
      taskBuildTask({
        defensibilityScore: pack?.defensibility_score,
        evidenceGap: record.evidence_gaps[0] ?? "Weak evidence for high opportunity.",
        expectedArtifact:
          "Short validation memo connecting evidence, measured gap, and opportunity thesis.",
        generatedFrom: ["opportunity_score", "evidence_score"],
        priorityBase:
          record.scores.opportunity_score +
          (11 - record.scores.evidence_score) * 0.45,
        recommendedAction:
          "Validate the opportunity signal before using it to rank action priorities.",
        record,
        sourceGap: "",
        sourceIds: [],
        taskSummary:
          "This record has attractive opportunity signals, but evidence confidence is not strong enough for action.",
        taskTitle: "Validate high-opportunity weak-evidence record",
        taskType: "high_opportunity_weak_evidence"
      })
    );
  }

  pack?.claim_support
    .filter((claim) => claim.support_level !== "strong")
    .slice(0, 2)
    .forEach((claim) => {
      tasks.push(
        taskBuildTask({
          defensibilityScore: pack.defensibility_score,
          evidenceGap: claim.unresolved_gap,
          expectedArtifact:
            "Claim support note with source IDs, quoted finding summary, and unresolved caveat.",
          generatedFrom: ["claim_support", "evidence_pack"],
          priorityBase:
            record.scores.total_strategic_score +
            (claim.support_level === "weak" ? 1.1 : 0.4),
          recommendedAction: `Attach evidence that directly supports or rejects: ${claim.claim}`,
          record,
          sourceGap:
            claim.supporting_source_ids.length === 0
              ? "No supporting source IDs attached."
              : "",
          sourceIds: claim.supporting_source_ids,
          taskSummary: `${claim.support_level} claim support limits defensibility.`,
          taskTitle: `Strengthen claim support for ${record.title}`,
          taskType: "claim_support_needed"
        })
      );
    });

  if (pack && pack.defensibility_score < 6) {
    tasks.push(
      taskBuildTask({
        defensibilityScore: pack.defensibility_score,
        evidenceGap: record.evidence_gaps[0] ?? "",
        expectedArtifact:
          "Defensibility review note with source upgrades and claim support decisions.",
        generatedFrom: ["evidence_pack", "source_registry"],
        priorityBase:
          record.scores.total_strategic_score + (6 - pack.defensibility_score),
        recommendedAction:
          "Review source coverage, claim support, and provenance gaps before using this record as validated intelligence.",
        record,
        sourceGap: pack.audit_flags.join("; "),
        sourceIds: [],
        taskSummary: `Evidence pack defensibility is ${pack.defensibility_score.toFixed(1)}/10.`,
        taskTitle: "Review low-defensibility evidence pack",
        taskType: "low_defensibility_review"
      })
    );
  }

  if (strategy && strategy.action_confidence < 7) {
    tasks.push(
      taskBuildTask({
        defensibilityScore: pack?.defensibility_score,
        evidenceGap: strategy.required_evidence[0] ?? record.evidence_gaps[0] ?? "",
        expectedArtifact:
          "Experiment plan with baseline metric, success threshold, and stop condition.",
        generatedFrom: ["intervention_strategy", "validation_workflow"],
        priorityBase:
          strategy.intervention_priority_score +
          (11 - strategy.action_confidence) * 0.45,
        recommendedAction:
          "Treat the intervention as a validation experiment until action confidence improves.",
        record,
        sourceGap: "",
        sourceIds: [],
        taskSummary:
          "The intervention is validation-dependent; evidence should improve before broader rollout.",
        taskTitle: "Validate intervention before action",
        taskType: "intervention_validation_needed"
      })
    );
  }

  return tasks;
}

function taskBuildTask({
  defensibilityScore,
  evidenceGap,
  expectedArtifact,
  generatedFrom,
  priorityBase,
  recommendedAction,
  record,
  sourceGap,
  sourceIds,
  taskSummary,
  taskTitle,
  taskType
}: {
  defensibilityScore?: number;
  evidenceGap: string;
  expectedArtifact: string;
  generatedFrom: string[];
  priorityBase: number;
  recommendedAction: string;
  record: TaskBuildRecord;
  sourceGap: string;
  sourceIds: string[];
  taskSummary: string;
  taskTitle: string;
  taskType: string;
}): TaskBuildValidationTask {
  const priorityScore = taskBuildClamp(taskBuildRound(priorityBase));
  const severity = taskBuildSeverity(priorityScore, defensibilityScore);

  return {
    task_id: `task:${record.id}:${taskType}:${taskBuildSlug(taskTitle)}`,
    constraint_id: record.id,
    constraint_title: record.title,
    industry: record.industry,
    task_type: taskType,
    task_title: taskTitle,
    task_summary: taskSummary,
    priority_score: priorityScore,
    severity,
    status: taskBuildStatus(taskType, sourceGap, evidenceGap, priorityScore),
    evidence_gap: evidenceGap,
    source_gap: sourceGap,
    recommended_action: recommendedAction,
    expected_artifact: expectedArtifact,
    blocking_reason: taskBuildBlockingReason(taskType, sourceGap, evidenceGap),
    generated_from: generatedFrom,
    defensibility_score: defensibilityScore,
    validation_confidence: record.scores.validation_confidence_score,
    source_ids: sourceIds,
    investigation_route: `/constraints/${record.id}`,
    network_route: `/network?focus=${record.id}`
  };
}

function taskBuildSummary(tasks: TaskBuildValidationTask[]) {
  return {
    total_tasks: tasks.length,
    open_tasks: tasks.filter((task) => task.status === "open").length,
    blocked_tasks: tasks.filter((task) => task.status === "blocked").length,
    review_ready_tasks: tasks.filter((task) => task.status === "review_ready")
      .length,
    high_priority_tasks: tasks.filter((task) => task.priority_score >= 8).length,
    task_type_distribution: taskBuildDistribution(
      tasks.map((task) => task.task_type)
    ),
    tasks_by_industry: taskBuildDistribution(tasks.map((task) => task.industry)),
    tasks_by_severity: taskBuildDistribution(tasks.map((task) => task.severity)),
    top_validation_tasks: tasks.slice(0, 8).map((task) => task.task_title),
    highest_priority_constraints_needing_validation: Array.from(
      new Set(tasks.slice(0, 8).map((task) => task.constraint_title))
    ),
    high_opportunity_weak_evidence_tasks: tasks.filter(
      (task) => task.task_type === "high_opportunity_weak_evidence"
    ).length,
    primary_document_needed_tasks: tasks.filter(
      (task) => task.task_type === "primary_document_needed"
    ).length,
    source_url_needed_tasks: tasks.filter(
      (task) => task.task_type === "source_url_needed"
    ).length,
    local_observation_needed_tasks: tasks.filter(
      (task) => task.task_type === "local_observation_needed"
    ).length
  };
}

function taskBuildStatus(
  taskType: string,
  sourceGap: string,
  evidenceGap: string,
  priorityScore: number
) {
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

function taskBuildSeverity(priorityScore: number, defensibilityScore?: number) {
  if (priorityScore >= 8.5 || (defensibilityScore ?? 10) < 5) return "Critical";
  if (priorityScore >= 7.4 || (defensibilityScore ?? 10) < 5.8) return "High";
  if (priorityScore >= 6.2) return "Moderate";
  return "Low";
}

function taskBuildBlockingReason(
  taskType: string,
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

function taskBuildDedupe(tasks: TaskBuildValidationTask[]) {
  return Array.from(new Map(tasks.map((task) => [task.task_id, task])).values());
}

function taskBuildDistribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function taskBuildReadJson<T>(path: string) {
  return JSON.parse(taskBuildReadFileSync(path, "utf8")) as T;
}

function taskBuildWriteStableJson(path: string, output: Record<string, unknown>) {
  const stableOutput = taskBuildPreserveGeneratedAt(path, output);
  taskBuildWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function taskBuildPreserveGeneratedAt(
  path: string,
  output: Record<string, unknown>
) {
  if (!taskBuildExistsSync(path)) return output;
  const existing = JSON.parse(taskBuildReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const comparable = { ...existing, generated_at: output.generated_at };
  if (JSON.stringify(comparable) === JSON.stringify(output)) {
    return { ...output, generated_at: existing.generated_at };
  }
  return output;
}

function taskBuildSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function taskBuildClamp(value: number) {
  return Math.max(1, Math.min(10, value));
}

function taskBuildRound(value: number) {
  return Math.round(value * 10) / 10;
}

taskBuildMain();
