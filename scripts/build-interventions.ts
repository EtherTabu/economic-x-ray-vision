type InterventionBuildFsModule = typeof import("node:fs");
type InterventionBuildPathModule = typeof import("node:path");

const {
  mkdirSync: interventionBuildMkdirSync,
  readFileSync: interventionBuildReadFileSync,
  writeFileSync: interventionBuildWriteFileSync
} = process.getBuiltinModule("fs") as InterventionBuildFsModule;
const {
  dirname: interventionBuildDirname,
  resolve: interventionBuildResolve
} = process.getBuiltinModule("path") as InterventionBuildPathModule;

type InterventionBuildRecord = {
  id: string;
  title: string;
  category: string;
  opportunity_type: string;
  evidence_strength: string;
  evidence_gaps: string[];
  related_processes: string[];
  affected_systems: string[];
  downstream_constraints: string[];
  solution_hypotheses: string[];
  time_waste: number;
  capital_waste: number;
  labor_waste: number;
  implementation_complexity: number;
  regulatory_complexity: number;
  adoption_complexity: number;
  ai_potential: number;
  scores: Record<string, number>;
};

type InterventionBuildStrategy = {
  constraint_id: string;
  constraint_title: string;
  intervention_type: string;
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

const interventionBuildDatasetPath = interventionBuildResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const interventionBuildOutputPath = interventionBuildResolve(
  "data/exports/intervention_strategies.json"
);

function interventionBuildExport() {
  const dataset = JSON.parse(
    interventionBuildReadFileSync(interventionBuildDatasetPath, "utf8")
  ) as { records: InterventionBuildRecord[] };
  const strategies = dataset.records
    .map(interventionBuildStrategy)
    .sort(
      (first, second) =>
        second.intervention_priority_score - first.intervention_priority_score
    );
  const output = {
    generated_at: new Date().toISOString(),
    strategy_count: strategies.length,
    record_count: dataset.records.length,
    intervention_summary: interventionBuildSummarizeStrategies(strategies),
    strategies
  };

  interventionBuildMkdirSync(interventionBuildDirname(interventionBuildOutputPath), {
    recursive: true
  });
  interventionBuildWriteFileSync(
    interventionBuildOutputPath,
    `${JSON.stringify(output, null, 2)}\n`
  );
  console.log(
    `Built ${strategies.length} intervention strategies at ${interventionBuildOutputPath}.`
  );
  return output;
}

function interventionBuildStrategy(record: InterventionBuildRecord): InterventionBuildStrategy {
  const type = interventionBuildChooseType(record);
  const implementationComplexityScore = 11 - record.implementation_complexity;
  const operationalRiskScore = interventionBuildRound(
    11 -
      (record.regulatory_complexity * 0.45 +
        record.adoption_complexity * 0.35 +
        record.implementation_complexity * 0.2)
  );
  const validationReadinessScore = interventionBuildRound(
    record.scores.validation_confidence_score * 0.7 +
      record.scores.evidence_score * 0.3
  );
  const aiLeverageScore = interventionBuildRound(
    record.scores.ai_readiness_score * 0.65 +
      record.ai_potential * 0.2 +
      (type === "automation_assist" ? 1 : 0)
  );
  const pilotabilityScore = interventionBuildRound(
    implementationComplexityScore * 0.4 +
      operationalRiskScore * 0.3 +
      record.scores.measurability_score * 0.3
  );
  const expectedUnlockScore = interventionBuildRound(
    record.scores.downstream_impact_score * 0.35 +
      record.scores.total_strategic_score * 0.35 +
      record.scores.opportunity_score * 0.3
  );
  const evidenceDependencyScore = interventionBuildRound(11 - validationReadinessScore);
  const timeToImpactScore = interventionBuildRound(
    pilotabilityScore * 0.6 + implementationComplexityScore * 0.4
  );
  const totalInterventionScore = interventionBuildRound(
    expectedUnlockScore * 0.3 +
      pilotabilityScore * 0.22 +
      aiLeverageScore * 0.16 +
      timeToImpactScore * 0.12 +
      implementationComplexityScore * 0.1 +
      operationalRiskScore * 0.1
  );
  const actionConfidence = interventionBuildRound(
    totalInterventionScore * 0.45 +
      validationReadinessScore * 0.35 +
      record.scores.evidence_score * 0.2
  );

  return {
    constraint_id: record.id,
    constraint_title: record.title,
    intervention_type: type,
    intervention_name: `${interventionBuildLabel(type)} for ${record.related_processes[0]}`,
    intervention_thesis: `${interventionBuildLabel(type)} could reduce ${record.category.toLowerCase()} in ${record.related_processes[0]} without assuming unproven financial ROI.`,
    why_this_fits: `${interventionBuildLabel(type)} fits because the record shows ${record.category.toLowerCase()}, ${record.opportunity_type.toLowerCase()} potential, and downstream impact in ${record.downstream_constraints[0]}.`,
    expected_unlock: `Relative unlock: improve ${record.downstream_constraints[0]} by reducing friction across ${record.related_processes[0]} and ${record.affected_systems[0]}.`,
    affected_processes: record.related_processes,
    affected_systems: record.affected_systems,
    required_evidence: [
      `Measure ${record.related_processes[0]} using local operational logs.`,
      `Validate whether ${record.evidence_gaps[0]} materially changes the opportunity score.`
    ],
    key_assumptions: [
      `Operational data confirms recurring ${record.category.toLowerCase()} in ${record.related_processes[0]}.`,
      `Staff can test changes in ${record.related_processes[0]} without broad rollout.`,
      "Affected systems can produce before/after measurements."
    ],
    first_experiment:
      actionConfidence < 7
        ? `Run a measurement-first test: instrument ${record.related_processes[0]} before changing workflow.`
        : `Pilot ${interventionBuildLabel(type).toLowerCase()} on one bounded ${record.related_processes[0]} workflow.`,
    success_metrics: [
      `Reduced manual touches in ${record.related_processes[0]}`,
      `Shorter delay before ${record.downstream_constraints[0]}`,
      `Fewer exceptions in ${record.affected_systems[0]}`
    ],
    failure_modes: [
      `Local records show little recurring ${record.category.toLowerCase()} friction.`,
      "Measured waste is materially lower than current assumptions.",
      `Systems do not contain enough data to verify ${record.related_processes[0]}.`
    ],
    operational_risk:
      operationalRiskScore >= 7 ? "Low" : operationalRiskScore >= 5 ? "Moderate" : "High",
    implementation_complexity: record.implementation_complexity,
    time_to_impact:
      timeToImpactScore >= 7.5 ? "Short" : timeToImpactScore >= 5.5 ? "Medium" : "Long",
    ai_leverage_score: interventionBuildClampScore(aiLeverageScore),
    pilotability_score: interventionBuildClampScore(pilotabilityScore),
    evidence_dependency_score: interventionBuildClampScore(evidenceDependencyScore),
    expected_unlock_score: interventionBuildClampScore(expectedUnlockScore),
    time_to_impact_score: interventionBuildClampScore(timeToImpactScore),
    implementation_complexity_score: interventionBuildClampScore(implementationComplexityScore),
    operational_risk_score: interventionBuildClampScore(operationalRiskScore),
    validation_readiness_score: interventionBuildClampScore(validationReadinessScore),
    total_intervention_score: interventionBuildClampScore(totalInterventionScore),
    intervention_priority_score: interventionBuildClampScore(
      totalInterventionScore * 0.75 + (actionConfidence >= 7 ? validationReadinessScore * 0.25 : pilotabilityScore * 0.1)
    ),
    action_confidence: interventionBuildClampScore(actionConfidence),
    recommended_next_step:
      actionConfidence < 7
        ? `Validate ${record.evidence_gaps[0]} before rollout; use the intervention as a measurement experiment.`
        : `Run a narrow pilot using: ${record.solution_hypotheses[0]}`
  };
}

function interventionBuildSummarizeStrategies(strategies: InterventionBuildStrategy[]) {
  return {
    total_strategies: strategies.length,
    top_fast_wins: interventionBuildTopBy(
      strategies,
      (strategy) => strategy.pilotability_score + strategy.time_to_impact_score
    ),
    top_ai_leverage: interventionBuildTopBy(strategies, (strategy) => strategy.ai_leverage_score),
    high_upside_high_friction: interventionBuildTopBy(
      strategies,
      (strategy) => strategy.expected_unlock_score + strategy.intervention_priority_score
    ),
    validation_required_before_action: strategies
      .filter((strategy) => strategy.action_confidence < 7)
      .slice(0, 5)
      .map((strategy) => strategy.constraint_title),
    intervention_type_distribution: interventionBuildDistribution(
      strategies.map((strategy) => strategy.intervention_type)
    ),
    average_action_confidence: interventionBuildRound(
      strategies.reduce((total, strategy) => total + strategy.action_confidence, 0) /
        strategies.length
    ),
    highest_priority_intervention: strategies[0]?.intervention_name ?? "None"
  };
}

function interventionBuildChooseType(record: InterventionBuildRecord) {
  if (record.scores.validation_confidence_score < 6.8) return "evidence_collection";
  if (record.category === "Manual Verification") return "data_integration";
  if (record.category === "Duplicated Work") return "standardization";
  if (record.category === "Idle Capacity") return "queue_triage";
  if (record.category === "Compliance Drag") return "policy_simplification";
  if (record.category === "Market Mismatch") return "marketplace_matching";
  if (record.opportunity_type === "Automation" || record.scores.ai_readiness_score >= 7.5) {
    return "automation_assist";
  }
  if (record.opportunity_type === "Capacity Optimization") return "staffing_capacity";
  if (record.opportunity_type === "Data Quality") return "data_integration";
  return "workflow_redesign";
}

function interventionBuildLabel(type: string) {
  return type
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function interventionBuildTopBy(
  strategies: InterventionBuildStrategy[],
  selector: (strategy: InterventionBuildStrategy) => number
) {
  return [...strategies]
    .sort((first, second) => selector(second) - selector(first))
    .slice(0, 5)
    .map((strategy) => strategy.constraint_title);
}

function interventionBuildDistribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function interventionBuildClampScore(score: number) {
  return Math.max(1, Math.min(10, interventionBuildRound(score)));
}

function interventionBuildRound(value: number) {
  return Math.round(value * 10) / 10;
}

interventionBuildExport();
