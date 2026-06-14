import type {
  ConstraintIntelligenceObject,
  ConstraintScores
} from "@/types/constraint";

const round = (value: number) => Math.round(value * 10) / 10;

const invertComplexity = (...values: number[]) => {
  const average = values.reduce((total, value) => total + value, 0) / values.length;
  return 11 - average;
};

export function scoreConstraint(
  constraint: ConstraintIntelligenceObject
): ConstraintScores {
  const severity_score = round(
    constraint.time_waste * 0.3 +
      constraint.capital_waste * 0.3 +
      constraint.labor_waste * 0.3 +
      trendBoost(constraint.growth_trend)
  );

  const solvability_score = round(
    constraint.digital_solution_potential * 0.35 +
      constraint.automation_potential * 0.25 +
      invertComplexity(
        constraint.implementation_complexity,
        constraint.regulatory_complexity,
        constraint.adoption_complexity
      ) *
        0.4
  );

  const ai_readiness_score = round(
    constraint.ai_potential * 0.45 +
      constraint.digital_solution_potential * 0.25 +
      constraint.confidence * 0.15 +
      invertComplexity(constraint.regulatory_complexity) * 0.15
  );

  const overlooked_opportunity_score = round(
    constraint.overlooked_score * 0.45 +
      (11 - constraint.visibility_score) * 0.25 +
      severity_score * 0.2 +
      solvability_score * 0.1
  );

  const total_priority_score = round(
    severity_score * 0.35 +
      solvability_score * 0.25 +
      ai_readiness_score * 0.15 +
      overlooked_opportunity_score * 0.25
  );

  return {
    severity_score: clampScore(severity_score),
    solvability_score: clampScore(solvability_score),
    ai_readiness_score: clampScore(ai_readiness_score),
    overlooked_opportunity_score: clampScore(overlooked_opportunity_score),
    total_priority_score: clampScore(total_priority_score)
  };
}

function trendBoost(trend: ConstraintIntelligenceObject["growth_trend"]) {
  if (trend === "Increasing") {
    return 0.9;
  }

  if (trend === "Stable") {
    return 0.5;
  }

  return 0.1;
}

function clampScore(score: number) {
  return Math.max(1, Math.min(10, score));
}
