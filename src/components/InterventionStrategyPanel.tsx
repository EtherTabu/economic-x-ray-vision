import type {
  InterventionStrategy,
  InterventionSummary
} from "@/lib/interventionSimulator";

type InterventionStrategyPanelProps = {
  strategies: InterventionStrategy[];
  summary: InterventionSummary;
};

export function InterventionStrategyPanel({
  strategies,
  summary
}: InterventionStrategyPanelProps) {
  const topStrategy = strategies[0];
  const fastWin = strategies
    .slice()
    .sort(
      (first, second) =>
        second.pilotability_score +
        second.time_to_impact_score -
        (first.pilotability_score + first.time_to_impact_score)
    )[0];
  const aiCandidate = strategies
    .slice()
    .sort((first, second) => second.ai_leverage_score - first.ai_leverage_score)[0];
  const validationDependent = strategies.find(
    (strategy) => strategy.action_confidence < 7
  );

  return (
    <section className="intervention-panel" aria-label="Intervention strategy">
      <div className="intervention-panel__header">
        <div>
          <p className="section-kicker">V6.0 action strategy</p>
          <h2>Intervention simulator</h2>
        </div>
        <p>
          Strategies are deterministic and relative. They identify bounded
          experiments, assumptions, metrics, and failure modes without claiming
          dollar ROI.
        </p>
      </div>

      <div className="intervention-panel__metrics">
        <Metric label="Total Strategies" value={summary.total_strategies} />
        <Metric
          label="Highest Priority"
          value={topStrategy?.intervention_name ?? "None"}
        />
        <Metric label="Top Fast Win" value={fastWin?.constraint_title ?? "None"} />
        <Metric
          label="Top AI Leverage"
          value={aiCandidate?.constraint_title ?? "None"}
        />
        <Metric
          label="Validation-Dependent"
          value={validationDependent?.constraint_title ?? "None"}
        />
        <Metric
          label="Avg Action Confidence"
          value={summary.average_action_confidence.toFixed(1)}
        />
      </div>

      <div className="intervention-panel__body">
        <div className="intervention-type-box">
          <h3>Type Distribution</h3>
          {Object.entries(summary.intervention_type_distribution).map(
            ([type, count]) => (
              <div className="type-row" key={type}>
                <span>{type.replaceAll("_", " ")}</span>
                <strong>{count}</strong>
              </div>
            )
          )}
        </div>

        {topStrategy ? (
          <article className="strategy-preview">
            <span>Selected strategy preview</span>
            <h3>{topStrategy.intervention_name}</h3>
            <p>{topStrategy.intervention_thesis}</p>
            <dl>
              <Row label="Why This Fits" value={topStrategy.why_this_fits} />
              <Row label="Expected Unlock" value={topStrategy.expected_unlock} />
              <Row label="First Experiment" value={topStrategy.first_experiment} />
              <Row
                label="Success Metrics"
                value={topStrategy.success_metrics.join("; ")}
              />
              <Row
                label="Assumptions"
                value={topStrategy.key_assumptions.join("; ")}
              />
              <Row
                label="Failure Modes"
                value={topStrategy.failure_modes.join("; ")}
              />
              <Row
                label="Recommended Next Step"
                value={topStrategy.recommended_next_step}
              />
            </dl>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="intervention-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
