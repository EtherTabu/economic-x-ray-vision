import { explainConstraint } from "@/lib/explainability";
import type { ScoredConstraint } from "@/types/constraint";

export type OpportunityThesis = {
  label: string;
  constraint: ScoredConstraint;
  score: number;
  why_it_matters: string;
  risk: string;
  confidence_improver: string;
  intervention_path: string;
};

export type OpportunityPortfolio = {
  bestOverall: OpportunityThesis;
  bestAiSolvable: OpportunityThesis;
  bestLowComplexityHighImpact: OpportunityThesis;
  highestUpsideWeakestEvidence: OpportunityThesis;
  bestValidationTarget: OpportunityThesis;
  mostConnected: OpportunityThesis;
  highestDownstreamImpact: OpportunityThesis;
  mostUnderMeasured: OpportunityThesis;
};

export function analyzeOpportunities(
  constraints: ScoredConstraint[]
): OpportunityPortfolio {
  return {
    bestOverall: makeThesis(
      "Best Overall Opportunity",
      maxBy(constraints, (item) => item.scores.total_strategic_score),
      (item) => item.scores.total_strategic_score
    ),
    bestAiSolvable: makeThesis(
      "Best AI-Solvable Opportunity",
      maxBy(
        constraints,
        (item) => item.scores.ai_readiness_score + item.scores.opportunity_score
      ),
      (item) => item.scores.ai_readiness_score
    ),
    bestLowComplexityHighImpact: makeThesis(
      "Low-Complexity / High-Impact",
      maxBy(
        constraints,
        (item) =>
          item.scores.downstream_impact_score +
          (11 - item.implementation_complexity) +
          (11 - item.adoption_complexity)
      ),
      (item) => item.scores.downstream_impact_score
    ),
    highestUpsideWeakestEvidence: makeThesis(
      "High Upside / Weak Evidence",
      maxBy(
        constraints,
        (item) =>
          item.scores.total_strategic_score + (11 - item.scores.evidence_score)
      ),
      (item) => item.scores.total_strategic_score
    ),
    bestValidationTarget: makeThesis(
      "Best Validation Target",
      maxBy(
        constraints,
        (item) =>
          item.scores.total_strategic_score +
          (11 - item.scores.validation_confidence_score)
      ),
      (item) => item.scores.validation_confidence_score
    ),
    mostConnected: makeThesis(
      "Most Connected Constraint",
      maxBy(constraints, (item) => item.scores.constraint_density_score),
      (item) => item.scores.constraint_density_score
    ),
    highestDownstreamImpact: makeThesis(
      "Highest Downstream Impact",
      maxBy(constraints, (item) => item.scores.downstream_impact_score),
      (item) => item.scores.downstream_impact_score
    ),
    mostUnderMeasured: makeThesis(
      "Most Under-Measured",
      maxBy(
        constraints,
        (item) =>
          item.scores.total_strategic_score +
          item.measurement_difficulty +
          (11 - item.data_availability)
      ),
      (item) => item.measurement_difficulty
    )
  };
}

export function portfolioTheses(portfolio: OpportunityPortfolio) {
  return [
    portfolio.bestOverall,
    portfolio.bestAiSolvable,
    portfolio.bestLowComplexityHighImpact,
    portfolio.highestUpsideWeakestEvidence,
    portfolio.bestValidationTarget,
    portfolio.mostConnected,
    portfolio.highestDownstreamImpact,
    portfolio.mostUnderMeasured
  ];
}

function makeThesis(
  label: string,
  constraint: ScoredConstraint,
  scoreSelector: (constraint: ScoredConstraint) => number
): OpportunityThesis {
  const explanation = explainConstraint(constraint);

  return {
    label,
    constraint,
    score: scoreSelector(constraint),
    why_it_matters: explanation.strategic_interpretation,
    risk: explanation.evidence_risks[0],
    confidence_improver: explanation.validation_next_steps[0],
    intervention_path: explanation.likely_intervention_paths[0]
  };
}

function maxBy(
  constraints: ScoredConstraint[],
  selector: (constraint: ScoredConstraint) => number
) {
  return constraints.reduce((top, item) => (selector(item) > selector(top) ? item : top));
}
