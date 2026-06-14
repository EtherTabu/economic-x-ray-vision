import type { ScoredConstraint } from "@/types/constraint";

export type ValidationWorkflowState =
  | "unvalidated"
  | "needs_evidence"
  | "partially_supported"
  | "evidence_backed"
  | "validated"
  | "disputed"
  | "rejected";

export type ValidationWorkflowAssessment = {
  state: ValidationWorkflowState;
  missing: string[];
  confidence_upgrade_path: string[];
  confidence_downgrade_triggers: string[];
  analyst_next_action: string;
  decision_ready: boolean;
  decision_usefulness: string;
};

export function assessValidationWorkflow(
  constraint: ScoredConstraint
): ValidationWorkflowAssessment {
  const missing = missingValidationInputs(constraint);
  const state = validationState(constraint, missing);
  const decisionReady =
    state === "validated" ||
    (state === "evidence_backed" &&
      constraint.scores.validation_confidence_score >= 7.5 &&
      constraint.evidence_gaps.length <= 2);

  return {
    state,
    missing,
    confidence_upgrade_path: confidenceUpgradePath(constraint, missing),
    confidence_downgrade_triggers: confidenceDowngradeTriggers(constraint),
    analyst_next_action: analystNextAction(constraint, state, missing),
    decision_ready: decisionReady,
    decision_usefulness: decisionUsefulness(constraint, state, decisionReady)
  };
}

function validationState(
  constraint: ScoredConstraint,
  missing: string[]
): ValidationWorkflowState {
  if (constraint.validation_status === "Validated") {
    return "validated";
  }

  if (constraint.validation_status === "Unverified") {
    return "unvalidated";
  }

  if (missing.length > 0 || constraint.scores.evidence_score < 6) {
    return "needs_evidence";
  }

  if (
    constraint.validation_status === "Partially Validated" &&
    constraint.scores.validation_confidence_score >= 7
  ) {
    return "evidence_backed";
  }

  return "partially_supported";
}

function missingValidationInputs(constraint: ScoredConstraint) {
  const missing: string[] = [];

  if (constraint.evidence.length === 0) missing.push("known evidence");
  if (constraint.sources.length === 0) missing.push("source list");
  if (constraint.evidence_gaps.length === 0) missing.push("evidence gaps");
  if (constraint.validation_notes.length === 0) missing.push("validation notes");
  if (constraint.data_availability < 7) missing.push("local data availability");
  if (constraint.measurement_difficulty >= 7) missing.push("measurement plan");

  return missing;
}

function confidenceUpgradePath(
  constraint: ScoredConstraint,
  missing: string[]
) {
  const path = [
    `Measure ${constraint.related_processes[0]} using local operational logs.`,
    `Validate whether ${constraint.evidence_gaps[0]} materially changes the opportunity score.`,
    `Compare outcomes before and after a small ${constraint.opportunity_type.toLowerCase()} intervention.`
  ];

  if (missing.length > 0) {
    path.unshift(`Close missing validation input: ${missing[0]}.`);
  }

  return path;
}

function confidenceDowngradeTriggers(constraint: ScoredConstraint) {
  return [
    `Local records show little or no recurring ${constraint.category.toLowerCase()} friction.`,
    `Measured labor, time, or capital waste is materially lower than the current score assumptions.`,
    `The affected systems do not contain enough data to verify ${constraint.related_processes[0]}.`
  ];
}

function analystNextAction(
  constraint: ScoredConstraint,
  state: ValidationWorkflowState,
  missing: string[]
) {
  if (state === "validated" || state === "evidence_backed") {
    return `Prepare a small intervention test around ${constraint.solution_hypotheses[0]}.`;
  }

  if (missing.length > 0) {
    return `Collect evidence for ${missing[0]} before using this record for prioritization.`;
  }

  return `Run a focused validation pass on ${constraint.evidence_gaps[0]}.`;
}

function decisionUsefulness(
  constraint: ScoredConstraint,
  state: ValidationWorkflowState,
  decisionReady: boolean
) {
  if (decisionReady) {
    return "Decision-ready for prioritizing a scoped validation or pilot.";
  }

  if (constraint.scores.total_strategic_score >= 8) {
    return "Useful as a high-priority hypothesis, not yet as a validated claim.";
  }

  if (state === "needs_evidence" || state === "unvalidated") {
    return "Useful for research queueing and evidence collection.";
  }

  return "Useful for comparison, but confidence should improve before action.";
}
