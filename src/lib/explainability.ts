import type { ScoredConstraint } from "@/types/constraint";

export type ConstraintExplanation = {
  top_score_drivers: string[];
  why_it_ranks_high: string;
  strategic_interpretation: string;
  weak_assumptions: string[];
  evidence_risks: string[];
  validation_next_steps: string[];
  likely_intervention_paths: string[];
  automation_or_ai_angle: string;
  implementation_watchouts: string[];
  opportunity_summary: string;
  analyst_takeaway: string;
  evidence_risk_level: "Low" | "Moderate" | "High";
};

type ScoreDriver = {
  label: string;
  value: number;
};

export function explainConstraint(
  constraint: ScoredConstraint
): ConstraintExplanation {
  const drivers = topDrivers([
    { label: "Strategic score", value: constraint.scores.total_strategic_score },
    { label: "Priority score", value: constraint.scores.total_priority_score },
    { label: "Downstream impact", value: constraint.scores.downstream_impact_score },
    { label: "Constraint density", value: constraint.scores.constraint_density_score },
    { label: "Opportunity score", value: constraint.scores.opportunity_score },
    { label: "Validation confidence", value: constraint.scores.validation_confidence_score },
    { label: "AI readiness", value: constraint.scores.ai_readiness_score },
    { label: "Evidence score", value: constraint.scores.evidence_score }
  ]);

  const weakAssumptions = [
    ...constraint.evidence_gaps.slice(0, 2),
    `Impact estimate remains qualitative: ${constraint.estimated_annual_impact}`
  ];

  if (constraint.measurement_difficulty >= 7) {
    weakAssumptions.push("Measurement is difficult enough to require proxy metrics.");
  }

  const evidenceRisks = buildEvidenceRisks(constraint);
  const validationNextSteps = [
    ...constraint.validation_notes.slice(0, 2),
    `Measure ${constraint.related_processes[0]} handoffs across ${constraint.affected_systems[0]}.`
  ];

  return {
    top_score_drivers: drivers.map(
      (driver) => `${driver.label}: ${driver.value.toFixed(1)}`
    ),
    why_it_ranks_high: `${constraint.title} ranks highly because it combines ${drivers[0].label.toLowerCase()} with ${drivers[1].label.toLowerCase()} in a ${constraint.category.toLowerCase()} workflow.`,
    strategic_interpretation: `This is strategically interesting because it sits between ${joinShort(
      constraint.upstream_constraints
    )} and ${joinShort(constraint.downstream_constraints)}, which means local fixes may affect more than one administrative process.`,
    weak_assumptions: weakAssumptions,
    evidence_risks: evidenceRisks,
    validation_next_steps: validationNextSteps,
    likely_intervention_paths: constraint.solution_hypotheses,
    automation_or_ai_angle: automationAngle(constraint),
    implementation_watchouts: [
      `Implementation complexity is ${constraint.implementation_complexity}/10.`,
      `Regulatory complexity is ${constraint.regulatory_complexity}/10.`,
      `Adoption complexity is ${constraint.adoption_complexity}/10.`
    ],
    opportunity_summary: `${constraint.opportunity_type} opportunity with strategic score ${constraint.scores.total_strategic_score.toFixed(
      1
    )} and validation confidence ${constraint.scores.validation_confidence_score.toFixed(1)}.`,
    analyst_takeaway: analystTakeaway(constraint),
    evidence_risk_level: evidenceRiskLevel(constraint)
  };
}

function topDrivers(drivers: ScoreDriver[]) {
  return [...drivers].sort((first, second) => second.value - first.value).slice(0, 3);
}

function buildEvidenceRisks(constraint: ScoredConstraint) {
  const risks: string[] = [];

  if (constraint.scores.evidence_score < 7) {
    risks.push(`Evidence score is ${constraint.scores.evidence_score.toFixed(1)}.`);
  }

  if (constraint.data_availability < 7) {
    risks.push(`Data availability is ${constraint.data_availability}/10.`);
  }

  if (constraint.validation_status !== "Validated") {
    risks.push(`Validation status is ${constraint.validation_status}.`);
  }

  if (risks.length === 0) {
    risks.push("Main risk is translating broad evidence into local operational measurement.");
  }

  return risks;
}

function automationAngle(constraint: ScoredConstraint) {
  if (constraint.scores.ai_readiness_score >= 7.5) {
    return `High AI-readiness: use structured extraction, routing, or exception detection around ${constraint.related_processes[0]}.`;
  }

  if (constraint.automation_potential >= 7) {
    return `Automation angle: standardize handoffs and reduce manual review in ${constraint.related_processes[0]}.`;
  }

  return `AI is secondary here; the stronger path is workflow simplification around ${constraint.related_processes[0]}.`;
}

function analystTakeaway(constraint: ScoredConstraint) {
  if (
    constraint.scores.total_strategic_score >= 8 &&
    constraint.scores.validation_confidence_score < 7
  ) {
    return "High upside, but validate before treating it as a priority initiative.";
  }

  if (constraint.implementation_complexity <= 5 && constraint.scores.downstream_impact_score >= 7) {
    return "Strong candidate for a focused operational pilot.";
  }

  return "Worth tracking as part of the constraint map and comparing against local process evidence.";
}

function evidenceRiskLevel(constraint: ScoredConstraint) {
  if (constraint.scores.evidence_score < 6 || constraint.data_availability < 6) {
    return "High";
  }

  if (constraint.scores.validation_confidence_score < 7) {
    return "Moderate";
  }

  return "Low";
}

function joinShort(values: string[]) {
  return values.slice(0, 2).join(" and ");
}
