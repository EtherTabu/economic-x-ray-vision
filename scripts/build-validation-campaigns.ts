type CampaignBuildFsModule = typeof import("node:fs");
type CampaignBuildPathModule = typeof import("node:path");

const {
  existsSync: campaignBuildExistsSync,
  mkdirSync: campaignBuildMkdirSync,
  readFileSync: campaignBuildReadFileSync,
  writeFileSync: campaignBuildWriteFileSync
} = process.getBuiltinModule("fs") as CampaignBuildFsModule;
const {
  dirname: campaignBuildDirname,
  resolve: campaignBuildResolve
} = process.getBuiltinModule("path") as CampaignBuildPathModule;

const campaignBuildDatasetPath = campaignBuildResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const campaignBuildTriagePath = campaignBuildResolve(
  "data/exports/validation_triage.json"
);
const campaignBuildPacketPath = campaignBuildResolve(
  "data/exports/validation_evidence_packets.json"
);
const campaignBuildEvidencePackPath = campaignBuildResolve(
  "data/exports/evidence_packs.json"
);
const campaignBuildOutputPath = campaignBuildResolve(
  "data/exports/validation_campaigns.json"
);

type CampaignBuildMode = "fast" | "standard" | "deep";

type CampaignBuildRecord = {
  id: string;
  title: string;
  industry: string;
  scores: {
    total_priority_score: number;
    total_strategic_score: number;
    validation_confidence_score: number;
  };
};

type CampaignBuildTriage = {
  constraint_id: string;
  constraint_title: string;
  industry: string;
  validation_burden_score: number;
  recalibrated_severity: string;
  next_best_action: {
    cluster_type: string;
    expected_artifact: string;
  };
  investigation_route: string;
  network_route: string;
};

type CampaignBuildPacket = {
  constraint_id: string;
  request_category: string;
  artifact_checklist: string[];
  expected_artifact: string;
  decision_use: string;
  expected_confidence_impact: {
    estimated_score_lift: number;
    impact_level: string;
  };
};

type CampaignBuildEvidencePack = {
  constraint_id: string;
  defensibility_score: number;
  recommended_source_upgrade: string;
  source_records: Array<{
    citation_status: string;
    trust_weight: number;
  }>;
};

type CampaignBuildCandidate = {
  record: CampaignBuildRecord;
  triage: CampaignBuildTriage;
  packet: CampaignBuildPacket | undefined;
  evidencePack: CampaignBuildEvidencePack | undefined;
};

function campaignBuildMain() {
  const dataset = campaignBuildReadJson<{
    records: CampaignBuildRecord[];
  }>(campaignBuildDatasetPath);
  const triageExport = campaignBuildReadJson<{
    constraint_level_triage: CampaignBuildTriage[];
  }>(campaignBuildTriagePath);
  const packetExport = campaignBuildReadJson<{
    packets: CampaignBuildPacket[];
  }>(campaignBuildPacketPath);
  const evidencePackExport = campaignBuildReadJson<{
    packs: CampaignBuildEvidencePack[];
  }>(campaignBuildEvidencePackPath);
  const candidates = campaignBuildCandidates(
    dataset.records,
    triageExport.constraint_level_triage,
    packetExport.packets,
    evidencePackExport.packs
  );
  const campaigns = [
    campaignBuildCampaign("fast", candidates.slice(0, 3)),
    campaignBuildCampaign("standard", candidates.slice(0, 6)),
    campaignBuildCampaign("deep", candidates.slice(0, 10))
  ];
  const output = {
    generated_at: new Date().toISOString(),
    summary: campaignBuildSummary(campaigns),
    campaigns
  };

  campaignBuildMkdirSync(campaignBuildDirname(campaignBuildOutputPath), {
    recursive: true
  });
  campaignBuildWriteStableJson(campaignBuildOutputPath, output);
  console.log(
    `Built ${campaigns.length} validation campaigns at ${campaignBuildOutputPath}.`
  );
}

function campaignBuildCandidates(
  records: CampaignBuildRecord[],
  triage: CampaignBuildTriage[],
  packets: CampaignBuildPacket[],
  evidencePacks: CampaignBuildEvidencePack[]
) {
  const recordsById = new Map(records.map((record) => [record.id, record]));
  const packetsById = new Map(packets.map((packet) => [packet.constraint_id, packet]));
  const packsById = new Map(evidencePacks.map((pack) => [pack.constraint_id, pack]));

  return triage
    .map((item) => {
      const record = recordsById.get(item.constraint_id);
      if (!record) return null;
      return {
        record,
        triage: item,
        packet: packetsById.get(item.constraint_id),
        evidencePack: packsById.get(item.constraint_id)
      };
    })
    .filter((candidate): candidate is CampaignBuildCandidate => Boolean(candidate))
    .sort(
      (first, second) =>
        campaignBuildCandidateScore(second) - campaignBuildCandidateScore(first) ||
        first.record.title.localeCompare(second.record.title)
    );
}

function campaignBuildCampaign(
  mode: CampaignBuildMode,
  candidates: CampaignBuildCandidate[]
) {
  const selected = candidates.map((candidate) =>
    campaignBuildConstraint(candidate)
  );
  const totalLift = campaignBuildRound(
    selected.reduce(
      (sum, constraint) => sum + constraint.expected_confidence_lift,
      0
    )
  );
  const averageLift = campaignBuildRound(totalLift / Math.max(1, selected.length));

  return {
    campaign_id: `validation-campaign:${mode}`,
    mode,
    title: campaignBuildTitle(mode),
    objective: campaignBuildObjective(mode),
    effort_level:
      mode === "fast" ? "Low" : mode === "standard" ? "Medium" : "High",
    analyst_timebox:
      mode === "fast"
        ? "1-2 analyst days"
        : mode === "standard"
          ? "1 analyst week"
          : "2-3 analyst weeks",
    selected_constraints: selected,
    required_artifacts: campaignBuildUnique(
      selected.flatMap((constraint) => constraint.required_artifacts)
    ),
    source_upgrades_needed: campaignBuildUnique(
      selected.flatMap((constraint) => constraint.source_upgrades_needed)
    ),
    expected_confidence_lift: {
      total_estimated_lift: totalLift,
      average_estimated_lift: averageLift,
      explanation: `${campaignBuildTitle(mode)} targets ${selected.length} constraint${selected.length === 1 ? "" : "s"} with estimated average validation confidence lift of ${averageLift.toFixed(1)} points if artifacts pass.`
    },
    decision_use: campaignBuildDecisionUse(mode),
    why_this_campaign: campaignBuildRationale(mode, selected)
  };
}

function campaignBuildConstraint(candidate: CampaignBuildCandidate) {
  const lift =
    candidate.packet?.expected_confidence_impact.estimated_score_lift ??
    campaignBuildFallbackLift(
      candidate.triage.validation_burden_score,
      candidate.evidencePack?.defensibility_score
    );
  const sourceUpgrades = [
    candidate.evidencePack?.recommended_source_upgrade,
    candidate.packet?.request_category === "source"
      ? candidate.packet.expected_artifact
      : undefined
  ].filter((value): value is string => Boolean(value));
  const comparisonIds = campaignBuildComparisonIds(candidate.record.id);

  return {
    constraint_id: candidate.record.id,
    constraint_title: candidate.record.title,
    industry: candidate.record.industry,
    priority_score: candidate.record.scores.total_priority_score,
    strategic_score: candidate.record.scores.total_strategic_score,
    validation_confidence: candidate.record.scores.validation_confidence_score,
    validation_burden_score: candidate.triage.validation_burden_score,
    evidence_defensibility:
      candidate.evidencePack?.defensibility_score ??
      candidate.record.scores.validation_confidence_score,
    expected_confidence_lift: lift,
    why_selected: `${candidate.record.title} was selected because validation burden is ${candidate.triage.validation_burden_score.toFixed(1)}, priority is ${candidate.record.scores.total_priority_score.toFixed(1)}, and the next artifact is ${candidate.packet?.request_category ?? candidate.triage.next_best_action.cluster_type}.`,
    required_artifacts:
      candidate.packet?.artifact_checklist.slice(0, 5) ?? [
        candidate.triage.next_best_action.expected_artifact
      ],
    source_upgrades_needed:
      sourceUpgrades.length > 0
        ? campaignBuildUnique(sourceUpgrades)
        : ["No source-specific upgrade identified."],
    decision_use:
      candidate.packet?.decision_use ??
      "Determines whether the constraint remains prioritized for analyst review.",
    investigation_route: candidate.triage.investigation_route,
    validation_route: `/validation?industry=${encodeURIComponent(candidate.record.industry)}`,
    source_route: "/sources",
    comparison_route: `/compare?ids=${comparisonIds.join(",")}`,
    network_route: candidate.triage.network_route
  };
}

function campaignBuildCandidateScore(candidate: CampaignBuildCandidate) {
  const packetLift =
    candidate.packet?.expected_confidence_impact.estimated_score_lift ?? 1;
  const defensibility = candidate.evidencePack?.defensibility_score ?? 6;
  const sourceWeakness =
    candidate.evidencePack?.source_records.filter(
      (source) => source.citation_status !== "complete"
    ).length ?? 0;

  return (
    candidate.triage.validation_burden_score * 0.34 +
    candidate.record.scores.total_priority_score * 0.22 +
    candidate.record.scores.total_strategic_score * 0.16 +
    packetLift * 0.8 +
    Math.max(0, 6 - defensibility) * 0.25 +
    Math.min(4, sourceWeakness) * 0.12
  );
}

function campaignBuildSummary(campaigns: ReturnType<typeof campaignBuildCampaign>[]) {
  const selected = campaigns.flatMap((campaign) => campaign.selected_constraints);
  const uniqueCoverage = campaignBuildUnique(
    selected.map((constraint) => constraint.constraint_id)
  ).length;
  const averageLift = campaignBuildRound(
    campaigns.reduce(
      (sum, campaign) =>
        sum + campaign.expected_confidence_lift.average_estimated_lift,
      0
    ) / Math.max(1, campaigns.length)
  );
  const highestLiftCampaign = campaigns
    .slice()
    .sort(
      (first, second) =>
        second.expected_confidence_lift.total_estimated_lift -
        first.expected_confidence_lift.total_estimated_lift
    )[0];

  return {
    campaign_count: campaigns.length,
    total_selected_constraints: selected.length,
    unique_constraint_coverage: uniqueCoverage,
    average_expected_confidence_lift: averageLift,
    mode_distribution: campaignBuildDistribution(campaigns.map((campaign) => campaign.mode)),
    highest_lift_campaign: highestLiftCampaign?.title ?? "None"
  };
}

function campaignBuildTitle(mode: CampaignBuildMode) {
  if (mode === "fast") return "Fast validation sprint";
  if (mode === "standard") return "Standard validation campaign";
  return "Deep defensibility campaign";
}

function campaignBuildObjective(mode: CampaignBuildMode) {
  if (mode === "fast") {
    return "Validate the smallest high-leverage set of constraints that can quickly improve confidence in the top queue.";
  }
  if (mode === "standard") {
    return "Cover the highest validation-burden constraints across multiple industries with enough artifacts for analyst review.";
  }
  return "Build a deeper evidence base for the full top validation queue before major intervention decisions.";
}

function campaignBuildDecisionUse(mode: CampaignBuildMode) {
  if (mode === "fast") {
    return "Decide which top constraints deserve deeper evidence packets or can be deprioritized quickly.";
  }
  if (mode === "standard") {
    return "Decide which constraints are strong enough for comparison, source upgrade, and measurement-first intervention planning.";
  }
  return "Decide which top opportunities can move from hypothesis to defensible intelligence before intervention sequencing.";
}

function campaignBuildRationale(
  mode: CampaignBuildMode,
  selected: ReturnType<typeof campaignBuildConstraint>[]
) {
  const industries = campaignBuildUnique(
    selected.map((constraint) => constraint.industry)
  );
  const highestBurden = selected
    .slice()
    .sort(
      (first, second) =>
        second.validation_burden_score - first.validation_burden_score
    )[0];

  return `${campaignBuildTitle(mode)} covers ${selected.length} constraint${selected.length === 1 ? "" : "s"} across ${industries.length} industr${industries.length === 1 ? "y" : "ies"}. The highest burden record is ${highestBurden?.constraint_title ?? "none"}.`;
}

function campaignBuildFallbackLift(burden: number, defensibility = 6) {
  return campaignBuildRound(
    Math.min(
      1.6,
      Math.max(0.6, 0.8 + (burden - 8) * 0.12 + Math.max(0, 6 - defensibility) * 0.08)
    )
  );
}

function campaignBuildComparisonIds(constraintId: string) {
  return [constraintId, "hc-admin-001", "strategic-020", "strategic-014"]
    .filter((id, index, ids) => ids.indexOf(id) === index)
    .slice(0, 3);
}

function campaignBuildReadJson<T>(path: string) {
  return JSON.parse(campaignBuildReadFileSync(path, "utf8")) as T;
}

function campaignBuildWriteStableJson(path: string, output: Record<string, unknown>) {
  const stableOutput = campaignBuildPreserveGeneratedAt(path, output);
  campaignBuildWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function campaignBuildPreserveGeneratedAt(
  path: string,
  output: Record<string, unknown>
) {
  if (!campaignBuildExistsSync(path)) return output;
  const existing = JSON.parse(campaignBuildReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const comparable = { ...existing, generated_at: output.generated_at };
  if (JSON.stringify(comparable) === JSON.stringify(output)) {
    return { ...output, generated_at: existing.generated_at };
  }
  return output;
}

function campaignBuildDistribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function campaignBuildUnique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function campaignBuildRound(value: number) {
  return Math.round(value * 10) / 10;
}

campaignBuildMain();
