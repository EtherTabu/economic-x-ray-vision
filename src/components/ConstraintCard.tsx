"use client";

import { useState } from "react";
import { ConstraintScoreBadge } from "@/components/ConstraintScoreBadge";
import type { ScoredConstraint } from "@/types/constraint";

type ConstraintCardProps = {
  constraint: ScoredConstraint;
};

export function ConstraintCard({ constraint }: ConstraintCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="constraint-card">
      <div className="constraint-card__main">
        <div>
          <h2>{constraint.title}</h2>
          <div className="constraint-card__meta">
            <span className="pill">{constraint.subsector}</span>
            <span className="pill">{constraint.category}</span>
            <span className="pill">Confidence {constraint.confidence}/10</span>
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
          <DetailBlock title="Evidence" values={constraint.evidence} />
          <DetailBlock title="Affected Parties" values={constraint.affected_parties} />
          <DetailBlock title="Current Process" values={constraint.current_process} />
          <DetailBlock title="Waste Signals" values={constraint.resource_waste} />
          <DetailBlock title="Opportunity Cost" values={[constraint.opportunity_cost]} />
          <DetailBlock
            title="Impact"
            values={[
              constraint.estimated_annual_impact,
              `Growth trend: ${constraint.growth_trend}`
            ]}
          />
          <div className="detail-block">
            <h3>Scores</h3>
            <div className="score-grid">
              <Metric label="Severity" value={constraint.scores.severity_score} />
              <Metric label="Solvability" value={constraint.scores.solvability_score} />
              <Metric label="AI Readiness" value={constraint.scores.ai_readiness_score} />
              <Metric
                label="Overlooked"
                value={constraint.scores.overlooked_opportunity_score}
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
