import { archetypeById, type ConstraintArchetype } from "@/lib/constraintArchetypes";
import {
  findAnalogsForConstraint,
  type CrossIndustryAnalog
} from "@/lib/crossIndustryAnalogs";
import { buildEvidenceDossier, type EvidenceDossier } from "@/lib/evidenceDossier";
import { explainConstraint, type ConstraintExplanation } from "@/lib/explainability";
import {
  buildInterventionStrategy,
  type InterventionStrategy
} from "@/lib/interventionSimulator";
import {
  assessValidationWorkflow,
  type ValidationWorkflowAssessment
} from "@/lib/validationWorkflow";
import type { ScoredConstraint } from "@/types/constraint";

export type ConstraintInvestigation = {
  constraint: ScoredConstraint;
  explanation: ConstraintExplanation;
  evidenceDossier: EvidenceDossier;
  validationWorkflow: ValidationWorkflowAssessment;
  interventionStrategy: InterventionStrategy;
  primaryArchetype: ConstraintArchetype;
  secondaryArchetypes: ConstraintArchetype[];
  analogs: CrossIndustryAnalog[];
  executiveSummary: {
    what_it_is: string;
    why_it_matters: string;
    recommended_next_move: string;
  };
  summaryText: string;
};

export function buildConstraintInvestigation(
  constraint: ScoredConstraint,
  allConstraints: ScoredConstraint[]
): ConstraintInvestigation {
  const explanation = explainConstraint(constraint);
  const evidenceDossier = buildEvidenceDossier(constraint);
  const validationWorkflow = assessValidationWorkflow(constraint);
  const interventionStrategy = buildInterventionStrategy(constraint);
  const primaryArchetype = archetypeById[constraint.primary_archetype];
  const secondaryArchetypes = constraint.secondary_archetypes.map(
    (archetypeId) => archetypeById[archetypeId]
  );
  const analogs = findAnalogsForConstraint(constraint, allConstraints, 5);
  const executiveSummary = {
    what_it_is: constraint.description,
    why_it_matters: explanation.strategic_interpretation,
    recommended_next_move: interventionStrategy.recommended_next_step
  };

  return {
    constraint,
    explanation,
    evidenceDossier,
    validationWorkflow,
    interventionStrategy,
    primaryArchetype,
    secondaryArchetypes,
    analogs,
    executiveSummary,
    summaryText: buildSummaryText({
      constraint,
      evidenceDossier,
      validationWorkflow,
      interventionStrategy,
      primaryArchetype,
      analogs
    })
  };
}

function buildSummaryText({
  constraint,
  evidenceDossier,
  validationWorkflow,
  interventionStrategy,
  primaryArchetype,
  analogs
}: {
  constraint: ScoredConstraint;
  evidenceDossier: EvidenceDossier;
  validationWorkflow: ValidationWorkflowAssessment;
  interventionStrategy: InterventionStrategy;
  primaryArchetype: ConstraintArchetype;
  analogs: CrossIndustryAnalog[];
}) {
  const analogLine =
    analogs.length > 0
      ? `${analogs[0].analog_constraint_title} (${analogs[0].analog_industry})`
      : "No strong cross-industry analog identified yet";

  return [
    `Constraint: ${constraint.title}`,
    `ID: ${constraint.id}`,
    `Industry: ${constraint.industry}`,
    `Primary archetype: ${primaryArchetype.display_name}`,
    `Priority score: ${constraint.scores.total_priority_score.toFixed(1)}/10`,
    `Strategic opportunity score: ${constraint.scores.total_strategic_score.toFixed(1)}/10`,
    `Validation state: ${validationWorkflow.state}`,
    `Validation confidence: ${constraint.scores.validation_confidence_score.toFixed(1)}/10`,
    `Core claim: ${evidenceDossier.core_claim}`,
    `Evidence risk: ${evidenceDossier.evidence_risk_level}`,
    `Top analog: ${analogLine}`,
    `Recommended intervention: ${interventionStrategy.intervention_name}`,
    `First experiment: ${interventionStrategy.first_experiment}`,
    `Recommended next step: ${interventionStrategy.recommended_next_step}`
  ].join("\n");
}
