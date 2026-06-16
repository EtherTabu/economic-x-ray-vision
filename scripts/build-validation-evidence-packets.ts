type ValidationPacketBuildFsModule = typeof import("node:fs");
type ValidationPacketBuildPathModule = typeof import("node:path");

const {
  existsSync: packetBuildExistsSync,
  mkdirSync: packetBuildMkdirSync,
  readFileSync: packetBuildReadFileSync,
  writeFileSync: packetBuildWriteFileSync
} = process.getBuiltinModule("fs") as ValidationPacketBuildFsModule;
const {
  dirname: packetBuildDirname,
  resolve: packetBuildResolve
} = process.getBuiltinModule("path") as ValidationPacketBuildPathModule;

const packetBuildTriagePath = packetBuildResolve("data/exports/validation_triage.json");
const packetBuildOutputPath = packetBuildResolve(
  "data/exports/validation_evidence_packets.json"
);

type PacketBuildClusterType =
  | "source"
  | "evidence"
  | "metric"
  | "intervention-blocking";

type PacketBuildCategory = "source" | "claim" | "metric" | "intervention";

type PacketBuildTriage = {
  constraint_id: string;
  constraint_title: string;
  industry: string;
  task_count: number;
  validation_burden_score: number;
  recalibrated_severity: string;
  top_task_ids: string[];
  investigation_route: string;
  network_route: string;
  next_best_action: {
    action_title: string;
    action_summary: string;
    task_type: string;
    cluster_type: PacketBuildClusterType;
    priority_score: number;
    expected_artifact: string;
    rationale: string;
    task_id: string;
  };
};

type PacketBuildPacket = ReturnType<typeof packetBuildPacket>;

function packetBuildMain() {
  const triageExport = packetBuildReadJson<{
    summary: { top_queue_count: number };
    topValidationQueue: PacketBuildTriage[];
  }>(packetBuildTriagePath);
  const packets = triageExport.topValidationQueue.map((item, index) =>
    packetBuildPacket(item, index + 1)
  );
  const output = {
    generated_at: new Date().toISOString(),
    summary: packetBuildSummary(packets, triageExport.summary.top_queue_count),
    packets
  };

  packetBuildMkdirSync(packetBuildDirname(packetBuildOutputPath), {
    recursive: true
  });
  packetBuildWriteStableJson(packetBuildOutputPath, output);
  console.log(
    `Built ${packets.length} validation evidence packets at ${packetBuildOutputPath}.`
  );
}

function packetBuildPacket(item: PacketBuildTriage, rank: number) {
  const category = packetBuildCategory(item.next_best_action.cluster_type);
  const lift = packetBuildExpectedScoreLift(item.validation_burden_score, category);

  return {
    packet_id: `packet:${item.constraint_id}:${item.next_best_action.task_id}`,
    constraint_id: item.constraint_id,
    constraint_title: item.constraint_title,
    industry: item.industry,
    triage_rank: rank,
    triage_action: item.next_best_action.action_title,
    triage_action_summary: item.next_best_action.action_summary,
    triage_rationale: item.next_best_action.rationale,
    validation_burden_score: item.validation_burden_score,
    recalibrated_severity: item.recalibrated_severity,
    request_category: category,
    cluster_type: item.next_best_action.cluster_type,
    task_type: item.next_best_action.task_type,
    evidence_needed: packetBuildEvidenceNeeded(item, category),
    expected_artifact: item.next_best_action.expected_artifact,
    artifact_checklist: packetBuildArtifactChecklist(item, category),
    pass_criteria: packetBuildPassCriteria(category),
    fail_criteria: packetBuildFailCriteria(category),
    expected_confidence_impact: {
      impact_level: lift >= 1.2 ? "High" : lift >= 0.8 ? "Moderate" : "Low",
      estimated_score_lift: lift,
      explanation: `${category} evidence is expected to improve validation confidence by about ${lift.toFixed(1)} points if it passes because ${item.validation_burden_score.toFixed(1)} burden is being driven by ${item.next_best_action.cluster_type} blockers.`
    },
    decision_use: packetBuildDecisionUse(category),
    analyst_note: `Rank ${item.validation_burden_score.toFixed(1)} ${item.recalibrated_severity.toLowerCase()} item. Start with the ${category} packet before expanding into the remaining ${item.task_count - 1} generated tasks.`,
    source_task_ids: item.top_task_ids,
    investigation_route: item.investigation_route,
    network_route: item.network_route
  };
}

function packetBuildSummary(
  packets: PacketBuildPacket[],
  topQueueCount: number
) {
  return {
    packet_count: packets.length,
    top_queue_coverage:
      topQueueCount === 0
        ? 0
        : packetBuildRound((packets.length / topQueueCount) * 100),
    category_distribution: packetBuildDistribution(
      packets.map((packet) => packet.request_category)
    ),
    high_impact_packets: packets.filter(
      (packet) => packet.expected_confidence_impact.impact_level === "High"
    ).length,
    critical_packets: packets.filter(
      (packet) => packet.recalibrated_severity === "Critical"
    ).length,
    average_expected_score_lift: packetBuildRound(
      packets.reduce(
        (sum, packet) => sum + packet.expected_confidence_impact.estimated_score_lift,
        0
      ) / Math.max(1, packets.length)
    )
  };
}

function packetBuildCategory(clusterType: PacketBuildClusterType): PacketBuildCategory {
  if (clusterType === "source") return "source";
  if (clusterType === "metric") return "metric";
  if (clusterType === "intervention-blocking") return "intervention";
  return "claim";
}

function packetBuildEvidenceNeeded(
  item: PacketBuildTriage,
  category: PacketBuildCategory
) {
  if (category === "source") {
    return `Attach provenance for ${item.constraint_title}: primary document, source URL, or local observation that resolves the source gap behind the top triage action.`;
  }
  if (category === "metric") {
    return `Define the measured signal for ${item.constraint_title}: owner, data source, sampling window, baseline, and pass/fail threshold.`;
  }
  if (category === "intervention") {
    return `Create a validation experiment for ${item.constraint_title} before treating the intervention as ready for rollout.`;
  }
  return `Attach claim-level support for ${item.constraint_title} that confirms, narrows, or rejects the unresolved evidence gap.`;
}

function packetBuildArtifactChecklist(
  item: PacketBuildTriage,
  category: PacketBuildCategory
) {
  const common = [
    `Constraint ID and title: ${item.constraint_id} / ${item.constraint_title}`,
    `Linked triage task ID: ${item.next_best_action.task_id}`,
    "Analyst note explaining whether the artifact supports, narrows, or rejects the claim"
  ];

  if (category === "source") {
    return [
      ...common,
      "Source title, publisher or system owner, date, and scope",
      "Stable URL, document reference, or local observation note",
      "Applicability note explaining which part of the constraint the source supports"
    ];
  }
  if (category === "metric") {
    return [
      ...common,
      "Metric definition with numerator, denominator, and unit",
      "Data owner, source system, collection window, and refresh cadence",
      "Baseline value or method for establishing the first baseline"
    ];
  }
  if (category === "intervention") {
    return [
      ...common,
      "Pilot hypothesis, test population, and minimum viable experiment",
      "Success metric, stop condition, and operational risk note",
      "Evidence required before moving from measurement to rollout"
    ];
  }
  return [
    ...common,
    "Claim being tested and the exact gap being resolved",
    "Supporting or contradicting evidence note with source IDs where available",
    "Residual uncertainty note if the claim remains only partially supported"
  ];
}

function packetBuildPassCriteria(category: PacketBuildCategory) {
  if (category === "source") {
    return [
      "Source can be traced to a named document, owner, system, or observation.",
      "Source scope directly matches the process or system named in the triage action.",
      "Artifact is specific enough to reduce the source gap without inventing external facts."
    ];
  }
  if (category === "metric") {
    return [
      "Metric can be collected from a named system, owner, or repeatable observation.",
      "Baseline and sampling window are clear enough for a follow-up validation pass.",
      "Metric tests the bottleneck described by the triage action rather than a generic outcome."
    ];
  }
  if (category === "intervention") {
    return [
      "Pilot has a measurable success threshold and a stop condition.",
      "Required evidence is available before recommending broad rollout.",
      "Experiment tests the constraint mechanism, not only downstream performance."
    ];
  }
  return [
    "Evidence directly supports or rejects the core claim behind the triage action.",
    "Known caveats are recorded rather than hidden.",
    "The artifact makes the constraint more defensible for analyst review."
  ];
}

function packetBuildFailCriteria(category: PacketBuildCategory) {
  if (category === "source") {
    return [
      "Only a vague source title is available with no owner, date, URL, or document trail.",
      "The source describes a broad industry pattern but not the affected process.",
      "The artifact cannot be linked back to the constraint claim."
    ];
  }
  if (category === "metric") {
    return [
      "No owner, system, or repeatable observation can produce the metric.",
      "The proposed measure captures downstream outcomes only after the friction has already occurred.",
      "The baseline cannot be recreated or compared across a later validation cycle."
    ];
  }
  if (category === "intervention") {
    return [
      "The action plan assumes the constraint is true without validating it.",
      "No success metric or stop condition is defined.",
      "Operational risk is too high for a measurement-first pilot."
    ];
  }
  return [
    "Evidence is anecdotal and cannot be tied to the stated claim.",
    "The artifact contradicts the constraint hypothesis without updating the record.",
    "The claim remains too broad to validate."
  ];
}

function packetBuildExpectedScoreLift(
  burden: number,
  category: PacketBuildCategory
) {
  const categoryLift =
    category === "metric"
      ? 1.4
      : category === "source"
        ? 1.2
        : category === "intervention"
          ? 0.9
          : 1;
  return packetBuildRound(Math.min(2, Math.max(0.5, categoryLift + (burden - 8.5) * 0.12)));
}

function packetBuildDecisionUse(category: PacketBuildCategory) {
  if (category === "source") {
    return "Determines whether the record has enough provenance to remain in the analyst queue.";
  }
  if (category === "metric") {
    return "Defines the measurement basis for deciding whether the constraint is real and repeatable.";
  }
  if (category === "intervention") {
    return "Determines whether action should remain measurement-first or advance toward a pilot.";
  }
  return "Determines whether the constraint claim is supported, narrowed, or rejected.";
}

function packetBuildReadJson<T>(path: string) {
  return JSON.parse(packetBuildReadFileSync(path, "utf8")) as T;
}

function packetBuildWriteStableJson(
  path: string,
  output: Record<string, unknown>
) {
  const stableOutput = packetBuildPreserveGeneratedAt(path, output);
  packetBuildWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function packetBuildPreserveGeneratedAt(
  path: string,
  output: Record<string, unknown>
) {
  if (!packetBuildExistsSync(path)) return output;
  const existing = JSON.parse(packetBuildReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const comparable = { ...existing, generated_at: output.generated_at };
  if (JSON.stringify(comparable) === JSON.stringify(output)) {
    return { ...output, generated_at: existing.generated_at };
  }
  return output;
}

function packetBuildDistribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function packetBuildRound(value: number) {
  return Math.round(value * 10) / 10;
}

packetBuildMain();
