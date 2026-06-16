import {
  buildConstraintComparisonPortfolio,
  type ConstraintComparisonRecord
} from "@/lib/constraintComparison";
import { buildEvidencePackPortfolio, type EvidencePack } from "@/lib/evidencePacks";
import {
  buildValidationEvidencePacketPortfolio,
  type ValidationEvidencePacket
} from "@/lib/validationEvidencePackets";
import {
  buildValidationTaskPortfolio,
  type ValidationTask
} from "@/lib/validationTasks";
import {
  buildValidationTriagePortfolio,
  type ConstraintValidationTriage
} from "@/lib/validationTriage";
import type { ScoredConstraint } from "@/types/constraint";

export type ValidationCampaignMode = "fast" | "standard" | "deep";

export type ValidationCampaignConstraint = {
  constraint_id: string;
  constraint_title: string;
  industry: string;
  priority_score: number;
  strategic_score: number;
  validation_confidence: number;
  validation_burden_score: number;
  evidence_defensibility: number;
  action_confidence: number;
  expected_confidence_lift: number;
  why_selected: string;
  required_artifacts: string[];
  source_upgrades_needed: string[];
  decision_use: string;
  investigation_route: string;
  validation_route: string;
  source_route: string;
  comparison_route: string;
  network_route: string;
};

export type ValidationCampaign = {
  campaign_id: string;
  mode: ValidationCampaignMode;
  title: string;
  objective: string;
  effort_level: "Low" | "Medium" | "High";
  analyst_timebox: string;
  selected_constraints: ValidationCampaignConstraint[];
  required_artifacts: string[];
  source_upgrades_needed: string[];
  expected_confidence_lift: {
    total_estimated_lift: number;
    average_estimated_lift: number;
    explanation: string;
  };
  decision_use: string;
  why_this_campaign: string;
};

export type ValidationCampaignSummary = {
  campaign_count: number;
  total_selected_constraints: number;
  unique_constraint_coverage: number;
  average_expected_confidence_lift: number;
  mode_distribution: Record<string, number>;
  highest_lift_campaign: string;
};

export type ValidationCampaignPortfolio = {
  summary: ValidationCampaignSummary;
  campaigns: ValidationCampaign[];
};

type CampaignCandidate = {
  constraint: ScoredConstraint;
  triage: ConstraintValidationTriage;
  packet: ValidationEvidencePacket | undefined;
  evidencePack: EvidencePack | undefined;
  comparison: ConstraintComparisonRecord | undefined;
};

export function buildValidationCampaignPortfolio(
  constraints: ScoredConstraint[]
): ValidationCampaignPortfolio {
  const taskPortfolio = buildValidationTaskPortfolio(constraints);
  const triagePortfolio = buildValidationTriagePortfolio(taskPortfolio.tasks);
  const evidencePacketPortfolio = buildValidationEvidencePacketPortfolio(triagePortfolio);
  const evidencePackPortfolio = buildEvidencePackPortfolio(constraints);
  const comparisonPortfolio = buildConstraintComparisonPortfolio(constraints);
  const candidates = buildCandidates({
    constraints,
    evidencePacks: evidencePackPortfolio.packs,
    packets: evidencePacketPortfolio.packets,
    triage: triagePortfolio.constraint_triage,
    tasks: taskPortfolio.tasks,
    comparisonRecords: comparisonPortfolio.records
  });
  const campaigns = [
    buildCampaign("fast", candidates.slice(0, 3)),
    buildCampaign("standard", candidates.slice(0, 6)),
    buildCampaign("deep", candidates.slice(0, 10))
  ];

  return {
    summary: summarizeCampaigns(campaigns),
    campaigns
  };
}

function buildCandidates({
  comparisonRecords,
  constraints,
  evidencePacks,
  packets,
  tasks,
  triage
}: {
  comparisonRecords: ConstraintComparisonRecord[];
  constraints: ScoredConstraint[];
  evidencePacks: EvidencePack[];
  packets: ValidationEvidencePacket[];
  tasks: ValidationTask[];
  triage: ConstraintValidationTriage[];
}): Array<CampaignCandidate & { taskCount: number }> {
  const constraintsById = new Map(
    constraints.map((constraint) => [constraint.id, constraint])
  );
  const packetsByConstraint = new Map(
    packets.map((packet) => [packet.constraint_id, packet])
  );
  const packsByConstraint = new Map(
    evidencePacks.map((pack) => [pack.constraint_id, pack])
  );
  const comparisonByConstraint = new Map(
    comparisonRecords.map((record) => [record.id, record])
  );
  const taskCountsByConstraint = tasks.reduce<Record<string, number>>((counts, task) => {
    counts[task.constraint_id] = (counts[task.constraint_id] ?? 0) + 1;
    return counts;
  }, {});

  return triage
    .map((item) => {
      const constraint = constraintsById.get(item.constraint_id);
      if (!constraint) return null;

      return {
        constraint,
        triage: item,
        packet: packetsByConstraint.get(item.constraint_id),
        evidencePack: packsByConstraint.get(item.constraint_id),
        comparison: comparisonByConstraint.get(item.constraint_id),
        taskCount: taskCountsByConstraint[item.constraint_id] ?? item.task_count
      };
    })
    .filter((candidate): candidate is CampaignCandidate & { taskCount: number } =>
      Boolean(candidate)
    )
    .sort(
      (first, second) =>
        candidateScore(second) - candidateScore(first) ||
        first.constraint.title.localeCompare(second.constraint.title)
    );
}

function buildCampaign(
  mode: ValidationCampaignMode,
  candidates: CampaignCandidate[]
): ValidationCampaign {
  const selected = candidates.map((candidate) => campaignConstraint(candidate));
  const totalLift = round(
    selected.reduce((sum, constraint) => sum + constraint.expected_confidence_lift, 0)
  );
  const averageLift = round(totalLift / Math.max(1, selected.length));

  return {
    campaign_id: `validation-campaign:${mode}`,
    mode,
    title: campaignTitle(mode),
    objective: campaignObjective(mode),
    effort_level: campaignEffort(mode),
    analyst_timebox: campaignTimebox(mode),
    selected_constraints: selected,
    required_artifacts: unique(selected.flatMap((constraint) => constraint.required_artifacts)),
    source_upgrades_needed: unique(
      selected.flatMap((constraint) => constraint.source_upgrades_needed)
    ),
    expected_confidence_lift: {
      total_estimated_lift: totalLift,
      average_estimated_lift: averageLift,
      explanation: `${campaignTitle(mode)} targets ${selected.length} constraint${selected.length === 1 ? "" : "s"} with estimated average validation confidence lift of ${averageLift.toFixed(1)} points if artifacts pass.`
    },
    decision_use: campaignDecisionUse(mode),
    why_this_campaign: campaignRationale(mode, selected)
  };
}

function campaignConstraint(
  candidate: CampaignCandidate
): ValidationCampaignConstraint {
  const { constraint, evidencePack, packet, triage } = candidate;
  const lift =
    packet?.expected_confidence_impact.estimated_score_lift ??
    fallbackConfidenceLift(triage.validation_burden_score, evidencePack?.defensibility_score);
  const comparisonIds = comparisonIdsFor(triage.constraint_id, triage.constraint_title);

  return {
    constraint_id: constraint.id,
    constraint_title: constraint.title,
    industry: constraint.industry,
    priority_score: constraint.scores.total_priority_score,
    strategic_score: constraint.scores.total_strategic_score,
    validation_confidence: constraint.scores.validation_confidence_score,
    validation_burden_score: triage.validation_burden_score,
    evidence_defensibility:
      evidencePack?.defensibility_score ?? constraint.scores.evidence_score,
    action_confidence: candidate.comparison?.action_confidence ?? 0,
    expected_confidence_lift: lift,
    why_selected: whySelected(candidate),
    required_artifacts:
      packet?.artifact_checklist.slice(0, 5) ??
      [
        triage.next_best_action.expected_artifact,
        "Analyst note describing whether the artifact supports or rejects the claim"
      ],
    source_upgrades_needed: sourceUpgrades(candidate),
    decision_use: packet?.decision_use ?? campaignConstraintDecisionUse(triage),
    investigation_route: `/constraints/${constraint.id}`,
    validation_route: `/validation?industry=${encodeURIComponent(constraint.industry)}`,
    source_route: "/sources",
    comparison_route: `/compare?ids=${comparisonIds.join(",")}`,
    network_route: `/network?focus=${constraint.id}`
  };
}

function candidateScore(candidate: CampaignCandidate & { taskCount?: number }) {
  const packetLift =
    candidate.packet?.expected_confidence_impact.estimated_score_lift ?? 1;
  const defensibility = candidate.evidencePack?.defensibility_score ?? 6;
  const comparisonRiskBoost = candidate.comparison?.validation_risk === "High" ? 0.5 : 0;

  return (
    candidate.triage.validation_burden_score * 0.32 +
    candidate.constraint.scores.total_priority_score * 0.18 +
    candidate.constraint.scores.total_strategic_score * 0.16 +
    packetLift * 0.7 +
    Math.max(0, 6 - defensibility) * 0.22 +
    Math.min(10, candidate.taskCount ?? candidate.triage.task_count) * 0.08 +
    comparisonRiskBoost
  );
}

function whySelected(candidate: CampaignCandidate) {
  const packet = candidate.packet;
  const evidencePack = candidate.evidencePack;
  const risk = candidate.comparison?.validation_risk ?? "Unknown";

  return [
    `${candidate.constraint.title} has validation burden ${candidate.triage.validation_burden_score.toFixed(1)} and priority ${candidate.constraint.scores.total_priority_score.toFixed(1)}.`,
    packet
      ? `The next evidence packet is ${packet.request_category} with expected lift ${packet.expected_confidence_impact.estimated_score_lift.toFixed(1)}.`
      : "No top-queue packet exists, so the campaign uses the triage next-best action.",
    `Evidence defensibility is ${(evidencePack?.defensibility_score ?? candidate.constraint.scores.evidence_score).toFixed(1)} and comparison risk is ${risk}.`
  ].join(" ");
}

function sourceUpgrades(candidate: CampaignCandidate) {
  const upgrades = [
    candidate.evidencePack?.recommended_source_upgrade,
    ...(candidate.packet?.request_category === "source"
      ? [candidate.packet.expected_artifact]
      : [])
  ].filter((upgrade): upgrade is string => Boolean(upgrade));

  return upgrades.length > 0 ? unique(upgrades) : ["No source-specific upgrade identified."];
}

function campaignTitle(mode: ValidationCampaignMode) {
  if (mode === "fast") return "Fast validation sprint";
  if (mode === "standard") return "Standard validation campaign";
  return "Deep defensibility campaign";
}

function campaignObjective(mode: ValidationCampaignMode) {
  if (mode === "fast") {
    return "Validate the smallest high-leverage set of constraints that can quickly improve confidence in the top queue.";
  }
  if (mode === "standard") {
    return "Cover the highest validation-burden constraints across multiple industries with enough artifacts for analyst review.";
  }
  return "Build a deeper evidence base for the full top validation queue before major intervention decisions.";
}

function campaignEffort(mode: ValidationCampaignMode): ValidationCampaign["effort_level"] {
  if (mode === "fast") return "Low";
  if (mode === "standard") return "Medium";
  return "High";
}

function campaignTimebox(mode: ValidationCampaignMode) {
  if (mode === "fast") return "1-2 analyst days";
  if (mode === "standard") return "1 analyst week";
  return "2-3 analyst weeks";
}

function campaignDecisionUse(mode: ValidationCampaignMode) {
  if (mode === "fast") {
    return "Decide which top constraints deserve deeper evidence packets or can be deprioritized quickly.";
  }
  if (mode === "standard") {
    return "Decide which constraints are strong enough for comparison, source upgrade, and measurement-first intervention planning.";
  }
  return "Decide which top opportunities can move from hypothesis to defensible intelligence before intervention sequencing.";
}

function campaignRationale(
  mode: ValidationCampaignMode,
  selected: ValidationCampaignConstraint[]
) {
  const industries = unique(selected.map((constraint) => constraint.industry));
  const highestBurden = selected
    .slice()
    .sort(
      (first, second) =>
        second.validation_burden_score - first.validation_burden_score
    )[0];

  return `${campaignTitle(mode)} covers ${selected.length} constraint${selected.length === 1 ? "" : "s"} across ${industries.length} industr${industries.length === 1 ? "y" : "ies"}. The highest burden record is ${highestBurden?.constraint_title ?? "none"}, so the campaign starts where validation debt is most likely to block action.`;
}

function fallbackConfidenceLift(burden: number, defensibility = 6) {
  return round(Math.min(1.6, Math.max(0.6, 0.8 + (burden - 8) * 0.12 + Math.max(0, 6 - defensibility) * 0.08)));
}

function campaignConstraintDecisionUse(triage: ConstraintValidationTriage) {
  if (triage.next_best_action.cluster_type === "metric") {
    return "Defines the measurement basis for the constraint claim.";
  }
  if (triage.next_best_action.cluster_type === "source") {
    return "Improves provenance before the record is used for decision support.";
  }
  if (triage.next_best_action.cluster_type === "intervention-blocking") {
    return "Determines whether action can advance beyond measurement-first planning.";
  }
  return "Tests whether the constraint claim is strong enough to remain prioritized.";
}

function comparisonIdsFor(constraintId: string, constraintTitle: string) {
  const anchors = ["hc-admin-001", "strategic-020", "strategic-014"].filter(
    (id) => id !== constraintId
  );
  return [constraintId, ...anchors].slice(0, constraintTitle ? 3 : 2);
}

function summarizeCampaigns(
  campaigns: ValidationCampaign[]
): ValidationCampaignSummary {
  const selected = campaigns.flatMap((campaign) => campaign.selected_constraints);
  const uniqueConstraints = unique(selected.map((constraint) => constraint.constraint_id));
  const averageLift = round(
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
    unique_constraint_coverage: uniqueConstraints.length,
    average_expected_confidence_lift: averageLift,
    mode_distribution: distribution(campaigns.map((campaign) => campaign.mode)),
    highest_lift_campaign: highestLiftCampaign?.title ?? "None"
  };
}

function distribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
