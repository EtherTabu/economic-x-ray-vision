import type {
  ConstraintValidationTriage,
  ValidationTaskClusterType,
  ValidationTriagePortfolio
} from "@/lib/validationTriage";

export type EvidencePacketCategory = "source" | "claim" | "metric" | "intervention";

export type ValidationEvidencePacket = {
  packet_id: string;
  constraint_id: string;
  constraint_title: string;
  industry: string;
  triage_rank: number;
  triage_action: string;
  triage_action_summary: string;
  triage_rationale: string;
  validation_burden_score: number;
  recalibrated_severity: string;
  request_category: EvidencePacketCategory;
  cluster_type: ValidationTaskClusterType;
  task_type: string;
  evidence_needed: string;
  expected_artifact: string;
  artifact_checklist: string[];
  pass_criteria: string[];
  fail_criteria: string[];
  expected_confidence_impact: {
    impact_level: "Low" | "Moderate" | "High";
    estimated_score_lift: number;
    explanation: string;
  };
  decision_use: string;
  analyst_note: string;
  source_task_ids: string[];
  investigation_route: string;
  network_route: string;
};

export type ValidationEvidencePacketSummary = {
  packet_count: number;
  top_queue_coverage: number;
  category_distribution: Record<string, number>;
  high_impact_packets: number;
  critical_packets: number;
  average_expected_score_lift: number;
};

export type ValidationEvidencePacketPortfolio = {
  summary: ValidationEvidencePacketSummary;
  packets: ValidationEvidencePacket[];
};

export function buildValidationEvidencePacketPortfolio(
  triage: ValidationTriagePortfolio
): ValidationEvidencePacketPortfolio {
  const packets = triage.topValidationQueue.map((item, index) =>
    buildPacket(item, index + 1)
  );

  return {
    summary: summarizePackets(packets, triage.topValidationQueue.length),
    packets
  };
}

function buildPacket(
  item: ConstraintValidationTriage,
  rank: number
): ValidationEvidencePacket {
  const category = categoryForCluster(item.next_best_action.cluster_type);
  const lift = expectedScoreLift(item.validation_burden_score, category);

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
    evidence_needed: evidenceNeeded(item, category),
    expected_artifact: item.next_best_action.expected_artifact,
    artifact_checklist: artifactChecklist(item, category),
    pass_criteria: passCriteria(item, category),
    fail_criteria: failCriteria(item, category),
    expected_confidence_impact: {
      impact_level: lift >= 1.2 ? "High" : lift >= 0.8 ? "Moderate" : "Low",
      estimated_score_lift: lift,
      explanation: confidenceImpactExplanation(item, category, lift)
    },
    decision_use: decisionUse(category),
    analyst_note: analystNote(item, category),
    source_task_ids: item.top_task_ids,
    investigation_route: item.investigation_route,
    network_route: item.network_route
  };
}

function categoryForCluster(
  clusterType: ValidationTaskClusterType
): EvidencePacketCategory {
  if (clusterType === "source") return "source";
  if (clusterType === "metric") return "metric";
  if (clusterType === "intervention-blocking") return "intervention";
  return "claim";
}

function evidenceNeeded(
  item: ConstraintValidationTriage,
  category: EvidencePacketCategory
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

function artifactChecklist(
  item: ConstraintValidationTriage,
  category: EvidencePacketCategory
) {
  const common = [
    `Constraint ID and title: ${item.constraint_id} / ${item.constraint_title}`,
    `Linked triage task ID: ${item.next_best_action.task_id}`,
    `Analyst note explaining whether the artifact supports, narrows, or rejects the claim`
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

function passCriteria(
  item: ConstraintValidationTriage,
  category: EvidencePacketCategory
) {
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

function failCriteria(
  item: ConstraintValidationTriage,
  category: EvidencePacketCategory
) {
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

function expectedScoreLift(
  burden: number,
  category: EvidencePacketCategory
) {
  const categoryLift =
    category === "metric"
      ? 1.4
      : category === "source"
        ? 1.2
        : category === "intervention"
          ? 0.9
          : 1;
  return round(Math.min(2, Math.max(0.5, categoryLift + (burden - 8.5) * 0.12)));
}

function confidenceImpactExplanation(
  item: ConstraintValidationTriage,
  category: EvidencePacketCategory,
  lift: number
) {
  return `${category} evidence is expected to improve validation confidence by about ${lift.toFixed(1)} points if it passes because ${item.validation_burden_score.toFixed(1)} burden is being driven by ${item.next_best_action.cluster_type} blockers.`;
}

function decisionUse(category: EvidencePacketCategory) {
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

function analystNote(
  item: ConstraintValidationTriage,
  category: EvidencePacketCategory
) {
  return `Rank ${item.validation_burden_score.toFixed(1)} ${item.recalibrated_severity.toLowerCase()} item. Start with the ${category} packet before expanding into the remaining ${item.task_count - 1} generated tasks.`;
}

function summarizePackets(
  packets: ValidationEvidencePacket[],
  topQueueCount: number
): ValidationEvidencePacketSummary {
  return {
    packet_count: packets.length,
    top_queue_coverage:
      topQueueCount === 0 ? 0 : round((packets.length / topQueueCount) * 100),
    category_distribution: distribution(packets.map((packet) => packet.request_category)),
    high_impact_packets: packets.filter(
      (packet) => packet.expected_confidence_impact.impact_level === "High"
    ).length,
    critical_packets: packets.filter(
      (packet) => packet.recalibrated_severity === "Critical"
    ).length,
    average_expected_score_lift: round(
      packets.reduce(
        (sum, packet) => sum + packet.expected_confidence_impact.estimated_score_lift,
        0
      ) / Math.max(1, packets.length)
    )
  };
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
