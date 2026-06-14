"use client";

import { useState } from "react";
import { ConstraintScoreBadge } from "@/components/ConstraintScoreBadge";
import { buildEvidenceDossier } from "@/lib/evidenceDossier";
import { explainConstraint } from "@/lib/explainability";
import type { ScoredConstraint } from "@/types/constraint";

type ConstraintCardProps = {
  constraint: ScoredConstraint;
};

export function ConstraintCard({ constraint }: ConstraintCardProps) {
  const [expanded, setExpanded] = useState(false);
  const explanation = explainConstraint(constraint);
  const dossier = buildEvidenceDossier(constraint);

  return (
    <article className="constraint-card">
      <div className="constraint-card__main">
        <div>
          <h2>{constraint.title}</h2>
          <div className="constraint-card__meta">
            <span className="pill">{constraint.subsector}</span>
            <span className="pill">{constraint.category}</span>
            <span className="pill">{constraint.opportunity_type}</span>
            <span className="pill">{constraint.origin} record</span>
            <span className="pill">Confidence {constraint.confidence}/10</span>
            <span className="pill">{constraint.validation_status}</span>
          </div>
          <p>{constraint.description}</p>
        </div>

        <div className="score-column">
          <ConstraintScoreBadge
            label="Priority"
            score={constraint.scores.total_priority_score}
          />
          <button
            aria-expanded={expanded}
            className="details-button"
            onClick={() => setExpanded((current) => !current)}
            type="button"
          >
            {expanded ? "Hide details" : "Inspect"}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="constraint-card__details">
          <DetailBlock
            title="Score Drivers"
            values={explanation.top_score_drivers}
          />
          <DetailBlock
            title="Strategic Interpretation"
            values={[explanation.strategic_interpretation]}
          />
          <DetailBlock
            title="Analyst Takeaway"
            values={[explanation.analyst_takeaway]}
          />
          <DetailBlock
            title="Why It Ranks High"
            values={[explanation.why_it_ranks_high]}
          />
          <DetailBlock title="Evidence" values={constraint.evidence} />
          <DetailBlock
            title="Evidence Profile"
            values={[
              `Evidence strength: ${constraint.evidence_strength}`,
              `Source type: ${constraint.source_type}`,
              `Validation status: ${constraint.validation_status}`
            ]}
          />
          <DetailBlock
            title="Evidence / Validation Dossier"
            values={[
              `Current state: ${dossier.current_validation_status}`,
              `Evidence risk: ${dossier.evidence_risk_level}`,
              `Next step: ${dossier.recommended_validation_steps[0]}`,
              `Would prove true: ${dossier.what_would_prove_this_true[0]}`,
              `Would disprove: ${dossier.what_would_disprove_this[0]}`,
              `Decision readiness: ${dossier.decision_usefulness}`
            ]}
          />
          <DetailBlock title="Affected Parties" values={constraint.affected_parties} />
          <DetailBlock title="Current Process" values={constraint.current_process} />
          <DetailBlock title="Resource Waste" values={constraint.resource_waste} />
          <div className="detail-block">
            <h3>Waste Intensity</h3>
            <div className="score-grid">
              <Metric label="Time waste" value={constraint.time_waste} />
              <Metric label="Capital waste" value={constraint.capital_waste} />
              <Metric label="Labor waste" value={constraint.labor_waste} />
              <Metric label="Confidence" value={constraint.confidence} />
            </div>
          </div>
          <DetailBlock title="Opportunity Cost" values={[constraint.opportunity_cost]} />
          <DetailBlock
            title="Impact"
            values={[
              constraint.estimated_annual_impact,
              `Growth trend: ${constraint.growth_trend}`
            ]}
          />
          <div className="detail-block">
            <h3>Validation Inputs</h3>
            <div className="score-grid">
              <Metric label="Source quality" value={constraint.source_quality} />
              <Metric
                label="Measurement difficulty"
                value={constraint.measurement_difficulty}
              />
              <Metric
                label="Data availability"
                value={constraint.data_availability}
              />
            </div>
          </div>
          <DetailBlock
            title="Confidence Reasoning"
            values={[constraint.confidence_reasoning]}
          />
          <DetailBlock title="Validation Notes" values={constraint.validation_notes} />
          <DetailBlock
            title="Validation Next Steps"
            values={explanation.validation_next_steps}
          />
          <DetailBlock title="Evidence Gaps" values={constraint.evidence_gaps} />
          <DetailBlock title="Evidence Risks" values={explanation.evidence_risks} />
          <DetailBlock
            title="Graph Position"
            values={[
              `Opportunity type: ${constraint.opportunity_type}`,
              `Upstream links: ${constraint.upstream_constraints.length}`,
              `Downstream links: ${constraint.downstream_constraints.length}`
            ]}
          />
          <DetailBlock
            title="Upstream Constraints"
            values={constraint.upstream_constraints}
          />
          <DetailBlock
            title="Downstream Constraints"
            values={constraint.downstream_constraints}
          />
          <DetailBlock
            title="Related Processes"
            values={constraint.related_processes}
          />
          <DetailBlock title="Affected Systems" values={constraint.affected_systems} />
          <DetailBlock
            title="Solution Hypotheses"
            values={constraint.solution_hypotheses}
          />
          <DetailBlock
            title="Likely Intervention Paths"
            values={explanation.likely_intervention_paths}
          />
          <DetailBlock
            title="AI / Automation Angle"
            values={[explanation.automation_or_ai_angle]}
          />
          <DetailBlock
            title="Implementation Watchouts"
            values={explanation.implementation_watchouts}
          />
          <div className="detail-block">
            <h3>Complexity</h3>
            <div className="score-grid">
              <Metric
                label="Implementation"
                value={constraint.implementation_complexity}
              />
              <Metric label="Regulatory" value={constraint.regulatory_complexity} />
              <Metric label="Adoption" value={constraint.adoption_complexity} />
            </div>
          </div>
          <div className="detail-block detail-block--wide">
            <h3>Score Breakdown</h3>
            <div className="score-grid">
              <Metric label="Severity" value={constraint.scores.severity_score} />
              <Metric label="Solvability" value={constraint.scores.solvability_score} />
              <Metric label="AI Readiness" value={constraint.scores.ai_readiness_score} />
              <Metric
                label="Overlooked"
                value={constraint.scores.overlooked_opportunity_score}
              />
              <Metric
                label="Total priority"
                value={constraint.scores.total_priority_score}
              />
              <Metric label="Evidence" value={constraint.scores.evidence_score} />
              <Metric
                label="Measurability"
                value={constraint.scores.measurability_score}
              />
              <Metric
                label="Validation confidence"
                value={constraint.scores.validation_confidence_score}
              />
              <Metric
                label="Constraint density"
                value={constraint.scores.constraint_density_score}
              />
              <Metric
                label="Downstream impact"
                value={constraint.scores.downstream_impact_score}
              />
              <Metric
                label="Opportunity"
                value={constraint.scores.opportunity_score}
              />
              <Metric
                label="Strategic"
                value={constraint.scores.total_strategic_score}
              />
            </div>
          </div>
          <DetailBlock title="Sources" values={constraint.sources} />
        </div>
      ) : null}
    </article>
  );
}

function DetailBlock({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="detail-block">
      <h3>{title}</h3>
      <ul>
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value.toFixed(1)}</strong>
    </div>
  );
}
