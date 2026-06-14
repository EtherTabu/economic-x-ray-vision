import { buildEvidenceDossier } from "@/lib/evidenceDossier";
import { assessValidationWorkflow } from "@/lib/validationWorkflow";
import type { ScoredConstraint } from "@/types/constraint";

export type InterventionType =
  | "automation_assist"
  | "workflow_redesign"
  | "data_integration"
  | "measurement_instrumentation"
  | "staffing_capacity"
  | "policy_simplification"
  | "marketplace_matching"
  | "evidence_collection"
  | "queue_triage"
  | "standardization";

export type InterventionStrategy = {
  constraint_id: string;
  constraint_title: string;
  intervention_type: InterventionType;
  intervention_name: string;
  intervention_thesis: string;
  why_this_fits: string;
  expected_unlock: string;
  affected_processes: string[];
  affected_systems: string[];
  required_evidence: string[];
  key_assumptions: string[];
  first_experiment: string;
  success_metrics: string[];
  failure_modes: string[];
  operational_risk: string;
  implementation_complexity: number;
  time_to_impact: string;
  ai_leverage_score: number;
  pilotability_score: number;
  evidence_dependency_score: number;
  expected_unlock_score: number;
  time_to_impact_score: number;
  implementation_complexity_score: number;
  operational_risk_score: number;
  validation_readiness_score: number;
  total_intervention_score: number;
  intervention_priority_score: number;
  action_confidence: number;
  recommended_next_step: string;
};

export type InterventionSummary = {
  total_strategies: number;
  top_fast_wins: string[];
  top_ai_leverage: string[];
  high_upside_high_friction: string[];
  validation_required_before_action: string[];
  intervention_type_distribution: Record<string, number>;
  average_action_confidence: number;
  highest_priority_intervention: string;
};

export function buildInterventionStrategy(
  constraint: ScoredConstraint
): InterventionStrategy {
  const dossier = buildEvidenceDossier(constraint);
  const workflow = assessValidationWorkflow(constraint);
  const interventionType = chooseInterventionType(constraint);
  const implementationComplexityScore = 11 - constraint.implementation_complexity;
  const operationalRiskScore = round(
    11 -
      (constraint.regulatory_complexity * 0.45 +
        constraint.adoption_complexity * 0.35 +
        constraint.implementation_complexity * 0.2)
  );
  const validationReadinessScore = round(
    constraint.scores.validation_confidence_score * 0.7 +
      constraint.scores.evidence_score * 0.3
  );
  const aiLeverageScore = round(
    constraint.scores.ai_readiness_score * 0.65 +
      constraint.ai_potential * 0.2 +
      (interventionType === "automation_assist" ? 1 : 0)
  );
  const pilotabilityScore = round(
    implementationComplexityScore * 0.4 +
      operationalRiskScore * 0.3 +
      constraint.scores.measurability_score * 0.3
  );
  const expectedUnlockScore = round(
    constraint.scores.downstream_impact_score * 0.35 +
      constraint.scores.total_strategic_score * 0.35 +
      constraint.scores.opportunity_score * 0.3
  );
  const evidenceDependencyScore = round(11 - validationReadinessScore);
  const timeToImpactScore = round(
    pilotabilityScore * 0.6 + implementationComplexityScore * 0.4
  );
  const totalInterventionScore = round(
    expectedUnlockScore * 0.3 +
      pilotabilityScore * 0.22 +
      aiLeverageScore * 0.16 +
      timeToImpactScore * 0.12 +
      implementationComplexityScore * 0.1 +
      operationalRiskScore * 0.1
  );
  const actionConfidence = round(
    totalInterventionScore * 0.45 +
      validationReadinessScore * 0.35 +
      constraint.scores.evidence_score * 0.2
  );
  const interventionPriority = round(
    totalInterventionScore * 0.75 +
      (workflow.decision_ready ? validationReadinessScore * 0.25 : pilotabilityScore * 0.1)
  );

  return {
    constraint_id: constraint.id,
    constraint_title: constraint.title,
    intervention_type: interventionType,
    intervention_name: interventionName(interventionType, constraint),
    intervention_thesis: `${interventionLabel(interventionType)} could reduce ${constraint.category.toLowerCase()} in ${constraint.related_processes[0]} without assuming unproven financial ROI.`,
    why_this_fits: whyThisFits(interventionType, constraint),
    expected_unlock: `Relative unlock: improve ${constraint.downstream_constraints[0]} by reducing friction across ${constraint.related_processes[0]} and ${constraint.affected_systems[0]}.`,
    affected_processes: constraint.related_processes,
    affected_systems: constraint.affected_systems,
    required_evidence: dossier.recommended_validation_steps,
    key_assumptions: [
      dossier.what_would_prove_this_true[0],
      `Staff can test changes in ${constraint.related_processes[0]} without broad rollout.`,
      `The affected systems can produce enough measurement for before/after comparison.`
    ],
    first_experiment: firstExperiment(interventionType, constraint, workflow.decision_ready),
    success_metrics: successMetrics(constraint),
    failure_modes: dossier.what_would_disprove_this,
    operational_risk: operationalRisk(operationalRiskScore),
    implementation_complexity: constraint.implementation_complexity,
    time_to_impact: timeToImpact(timeToImpactScore),
    ai_leverage_score: clampScore(aiLeverageScore),
    pilotability_score: clampScore(pilotabilityScore),
    evidence_dependency_score: clampScore(evidenceDependencyScore),
    expected_unlock_score: clampScore(expectedUnlockScore),
    time_to_impact_score: clampScore(timeToImpactScore),
    implementation_complexity_score: clampScore(implementationComplexityScore),
    operational_risk_score: clampScore(operationalRiskScore),
    validation_readiness_score: clampScore(validationReadinessScore),
    total_intervention_score: clampScore(totalInterventionScore),
    intervention_priority_score: clampScore(interventionPriority),
    action_confidence: clampScore(actionConfidence),
    recommended_next_step: recommendedNextStep(constraint, workflow.decision_ready)
  };
}

export function buildInterventionStrategies(
  constraints: ScoredConstraint[]
): InterventionStrategy[] {
  return constraints
    .map(buildInterventionStrategy)
    .sort(
      (first, second) =>
        second.intervention_priority_score - first.intervention_priority_score
    );
}

export function summarizeInterventions(
  strategies: InterventionStrategy[]
): InterventionSummary {
  return {
    total_strategies: strategies.length,
    top_fast_wins: topBy(
      strategies,
      (strategy) => strategy.pilotability_score + strategy.time_to_impact_score
    ),
    top_ai_leverage: topBy(strategies, (strategy) => strategy.ai_leverage_score),
    high_upside_high_friction: topBy(
      strategies,
      (strategy) => strategy.expected_unlock_score + strategy.intervention_priority_score
    ),
    validation_required_before_action: strategies
      .filter((strategy) => strategy.action_confidence < 7)
      .slice(0, 5)
      .map((strategy) => strategy.constraint_title),
    intervention_type_distribution: distribution(
      strategies.map((strategy) => strategy.intervention_type)
    ),
    average_action_confidence: round(
      strategies.reduce((total, strategy) => total + strategy.action_confidence, 0) /
        strategies.length
    ),
    highest_priority_intervention: strategies[0]?.intervention_name ?? "None"
  };
}

function chooseInterventionType(constraint: ScoredConstraint): InterventionType {
  if (constraint.scores.validation_confidence_score < 6.8) {
    return "evidence_collection";
  }

  if (constraint.category === "Manual Verification") return "data_integration";
  if (constraint.category === "Duplicated Work") return "standardization";
  if (constraint.category === "Idle Capacity") return "queue_triage";
  if (constraint.category === "Compliance Drag") return "policy_simplification";
  if (constraint.category === "Market Mismatch") return "marketplace_matching";
  if (constraint.opportunity_type === "Automation" || constraint.scores.ai_readiness_score >= 7.5) {
    return "automation_assist";
  }
  if (constraint.opportunity_type === "Capacity Optimization") return "staffing_capacity";
  if (constraint.opportunity_type === "Data Quality") return "data_integration";
  return "workflow_redesign";
}

function interventionName(type: InterventionType, constraint: ScoredConstraint) {
  return `${interventionLabel(type)} for ${constraint.related_processes[0]}`;
}

function interventionLabel(type: InterventionType) {
  return type
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function whyThisFits(type: InterventionType, constraint: ScoredConstraint) {
  return `${interventionLabel(type)} fits because the record shows ${constraint.category.toLowerCase()}, ${constraint.opportunity_type.toLowerCase()} potential, and downstream impact in ${constraint.downstream_constraints[0]}.`;
}

function firstExperiment(
  type: InterventionType,
  constraint: ScoredConstraint,
  decisionReady: boolean
) {
  if (!decisionReady) {
    return `Run a measurement-first test: instrument ${constraint.related_processes[0]} for one queue or team before changing workflow.`;
  }

  return `Pilot ${interventionLabel(type).toLowerCase()} on one bounded ${constraint.related_processes[0]} workflow and compare before/after metrics.`;
}

function successMetrics(constraint: ScoredConstraint) {
  return [
    `Reduced manual touches in ${constraint.related_processes[0]}`,
    `Shorter delay before ${constraint.downstream_constraints[0]}`,
    `Higher completion rate or fewer exceptions in ${constraint.affected_systems[0]}`
  ];
}

function recommendedNextStep(constraint: ScoredConstraint, decisionReady: boolean) {
  if (!decisionReady) {
    return `Validate ${constraint.evidence_gaps[0]} before rollout; use the intervention as a measurement experiment.`;
  }

  return `Run a narrow pilot using: ${constraint.solution_hypotheses[0]}`;
}

function operationalRisk(score: number) {
  if (score >= 7) return "Low";
  if (score >= 5) return "Moderate";
  return "High";
}

function timeToImpact(score: number) {
  if (score >= 7.5) return "Short";
  if (score >= 5.5) return "Medium";
  return "Long";
}

function topBy(
  strategies: InterventionStrategy[],
  selector: (strategy: InterventionStrategy) => number
) {
  return [...strategies]
    .sort((first, second) => selector(second) - selector(first))
    .slice(0, 5)
    .map((strategy) => strategy.constraint_title);
}

function distribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function clampScore(score: number) {
  return Math.max(1, Math.min(10, score));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
