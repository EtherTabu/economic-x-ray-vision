import type { ArchetypePortfolio } from "@/lib/archetypeAnalysis";

type ArchetypeIntelligencePanelProps = {
  portfolio: ArchetypePortfolio;
};

export function ArchetypeIntelligencePanel({
  portfolio
}: ArchetypeIntelligencePanelProps) {
  const selected = portfolio.most_widespread_archetype;
  const topAnalog = portfolio.cross_industry_analogs[0];

  return (
    <section className="archetype-panel" aria-label="Archetype intelligence">
      <div className="archetype-panel__header">
        <div>
          <p className="section-kicker">Archetype intelligence</p>
          <h2>Recurring bottleneck patterns across sectors</h2>
        </div>
        <p>
          Archetypes group records by underlying constraint pattern so the
          workbench can compare similar bottlenecks across different industries.
        </p>
      </div>

      <div className="archetype-panel__metrics">
        <Metric
          label="Archetypes Detected"
          value={portfolio.total_archetypes_detected}
        />
        <Metric
          label="Most Widespread"
          value={portfolio.most_widespread_archetype.display_name}
        />
        <Metric
          label="Highest Priority"
          value={portfolio.highest_priority_archetype.display_name}
        />
        <Metric
          label="Most Under-Validated"
          value={portfolio.most_under_validated_archetype.display_name}
        />
        <Metric
          label="Strongest Intervention"
          value={portfolio.highest_intervention_opportunity_archetype.display_name}
        />
        <Metric
          label="Analog Pairs"
          value={portfolio.cross_industry_analogs.length}
        />
      </div>

      <div className="archetype-panel__body">
        <div className="archetype-distribution">
          <h3>Archetype Distribution</h3>
          {Object.entries(portfolio.archetype_distribution)
            .sort((first, second) => second[1] - first[1])
            .slice(0, 8)
            .map(([archetype, count]) => (
              <div className="type-row" key={archetype}>
                <span>{archetype.replaceAll("_", " ")}</span>
                <strong>{count}</strong>
              </div>
            ))}
        </div>

        <article className="archetype-preview">
          <span>Selected archetype preview</span>
          <h3>{selected.display_name}</h3>
          <p>{selected.definition}</p>
          <dl>
            <Row
              label="Affected Industries"
              value={selected.affected_industries.join("; ")}
            />
            <Row label="Top Constraints" value={selected.top_constraints.join("; ")} />
            <Row
              label="Common Evidence Needed"
              value={selected.common_evidence_needed.join("; ")}
            />
            <Row
              label="Common Interventions"
              value={selected.common_interventions.join("; ")}
            />
            <Row
              label="Validation Risks"
              value={selected.validation_risks.join("; ")}
            />
            <Row label="Why It Matters" value={selected.why_the_pattern_matters} />
          </dl>
        </article>
      </div>

      {topAnalog ? (
        <div className="analog-section">
          <div>
            <p className="section-kicker">Cross-industry analog</p>
            <h3>
              {topAnalog.source_constraint_title} {" -> "}{" "}
              {topAnalog.analog_constraint_title}
            </h3>
          </div>
          <div className="analog-grid">
            <AnalogMetric
              label="Industries"
              value={`${topAnalog.source_industry} / ${topAnalog.analog_industry}`}
            />
            <AnalogMetric
              label="Shared Archetype"
              value={topAnalog.shared_archetypes[0]?.replaceAll("_", " ") ?? "None"}
            />
            <AnalogMetric
              label="Similarity"
              value={topAnalog.similarity_score.toFixed(1)}
            />
          </div>
          <p>{topAnalog.why_the_analog_matters}</p>
          <p>{topAnalog.what_can_be_learned}</p>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="archetype-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AnalogMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="analog-metric">
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
