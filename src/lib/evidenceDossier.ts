import { explainConstraint } from "@/lib/explainability";
import {
  assessValidationWorkflow,
  type ValidationWorkflowState
} from "@/lib/validationWorkflow";
import type { ScoredConstraint } from "@/types/constraint";

export type EvidenceDossier = {
  constraint_id: string;
  constraint_title: string;
  core_claim: string;
  current_validation_status: ValidationWorkflowState;
  current_validation_confidence: number;
  evidence_strength: string;
  evidence_risk_level: "Low" | "Moderate" | "High";
  evidence_summary: string;
  known_evidence: string[];
  evidence_gaps: string[];
  what_would_prove_this_true: string[];
  what_would_disprove_this: string[];
  recommended_validation_steps: string[];
  recommended_source_types: string[];
  red_team_questions: string[];
  confidence_upgrade_path: string[];
  decision_usefulness: string;
  decision_ready: boolean;
  validation_priority_score: number;
};

export type EvidenceDossierSummary = {
  total_dossiers: number;
  decision_ready_records: number;
  needs_evidence_records: number;
  high_priority_validation_records: number;
  high_opportunity_weak_evidence_records: number;
  validation_status_distribution: Record<string, number>;
  average_validation_priority_score: number;
};

export function buildEvidenceDossier(
  constraint: ScoredConstraint
): EvidenceDossier {
  const explanation = explainConstraint(constraint);
  const workflow = assessValidationWorkflow(constraint);
  const validationPriority = validationPriorityScore(constraint, workflow.state);

  return {
    constraint_id: constraint.id,
    constraint_title: constraint.title,
    core_claim: `${constraint.title} creates ${constraint.category.toLowerCase()} through ${constraint.related_processes[0]}, affecting ${constraint.affected_parties
      .slice(0, 2)
      .join(" and ")}.`,
    current_validation_status: workflow.state,
    current_validation_confidence:
      constraint.scores.validation_confidence_score,
    evidence_strength: constraint.evidence_strength,
    evidence_risk_level: explanation.evidence_risk_level,
    evidence_summary: `${constraint.evidence_strength} evidence based on ${constraint.source_type.toLowerCase()} inputs with ${constraint.sources.length} listed source signal(s).`,
    known_evidence: constraint.evidence,
    evidence_gaps: constraint.evidence_gaps,
    what_would_prove_this_true: [
      `Operational data confirms recurring ${constraint.category.toLowerCase()} in ${constraint.related_processes[0]}.`,
      `Measured waste aligns with time ${constraint.time_waste}/10, labor ${constraint.labor_waste}/10, or capital ${constraint.capital_waste}/10 assumptions.`,
      `Downstream effects appear in ${constraint.downstream_constraints[0]}.`
    ],
    what_would_disprove_this: workflow.confidence_downgrade_triggers,
    recommended_validation_steps: workflow.confidence_upgrade_path,
    recommended_source_types: recommendedSourceTypes(constraint),
    red_team_questions: redTeamQuestions(constraint),
    confidence_upgrade_path: workflow.confidence_upgrade_path,
    decision_usefulness: workflow.decision_usefulness,
    decision_ready: workflow.decision_ready,
    validation_priority_score: validationPriority
  };
}

export function buildEvidenceDossiers(
  constraints: ScoredConstraint[]
): EvidenceDossier[] {
  return constraints
    .map(buildEvidenceDossier)
    .sort(
      (first, second) =>
        second.validation_priority_score - first.validation_priority_score
    );
}

export function summarizeEvidenceDossiers(
  dossiers: EvidenceDossier[]
): EvidenceDossierSummary {
  const priorityRecords = dossiers.filter(
    (dossier) => dossier.validation_priority_score >= 7.5
  );
  const weakEvidence = dossiers.filter(
    (dossier) =>
      dossier.evidence_risk_level !== "Low" &&
      dossier.validation_priority_score >= 7
  );

  return {
    total_dossiers: dossiers.length,
    decision_ready_records: dossiers.filter((dossier) => dossier.decision_ready)
      .length,
    needs_evidence_records: dossiers.filter(
      (dossier) =>
        dossier.current_validation_status === "needs_evidence" ||
        dossier.current_validation_status === "unvalidated"
    ).length,
    high_priority_validation_records: priorityRecords.length,
    high_opportunity_weak_evidence_records: weakEvidence.length,
    validation_status_distribution: distribution(
      dossiers.map((dossier) => dossier.current_validation_status)
    ),
    average_validation_priority_score: round(
      dossiers.reduce(
        (total, dossier) => total + dossier.validation_priority_score,
        0
      ) / dossiers.length
    )
  };
}

function validationPriorityScore(
  constraint: ScoredConstraint,
  state: ValidationWorkflowState
) {
  const evidenceGapWeight = state === "needs_evidence" || state === "unvalidated" ? 1 : 0.4;
  return round(
    Math.min(
      10,
      constraint.scores.total_strategic_score * 0.35 +
        constraint.scores.opportunity_score * 0.25 +
        (11 - constraint.scores.validation_confidence_score) * 0.25 +
        (11 - constraint.scores.evidence_score) * 0.15 +
        evidenceGapWeight
    )
  );
}

function recommendedSourceTypes(constraint: ScoredConstraint) {
  return [
    `Local ${constraint.affected_systems[0]} logs`,
    `${constraint.related_processes[0]} timestamps or queues`,
    `${constraint.source_type} benchmark comparison`
  ];
}

function redTeamQuestions(constraint: ScoredConstraint) {
  return [
    `Is ${constraint.title} frequent enough locally to matter?`,
    `Could the observed waste be caused by an upstream issue instead?`,
    `Would fixing ${constraint.related_processes[0]} actually improve ${constraint.downstream_constraints[0]}?`
  ];
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
