"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildConstraintComparison,
  type ConstraintComparison,
  type ConstraintComparisonPortfolio,
  type ConstraintComparisonRecord
} from "@/lib/constraintComparison";

type ConstraintComparisonWorkspaceProps = {
  portfolio: ConstraintComparisonPortfolio;
};

export function ConstraintComparisonWorkspace({
  portfolio
}: ConstraintComparisonWorkspaceProps) {
  const [selectedIds, setSelectedIds] = useState(portfolio.default_selected_ids);
  const [urlReady, setUrlReady] = useState(false);
  const comparison = useMemo(
    () => buildConstraintComparison(portfolio, selectedIds),
    [portfolio, selectedIds]
  );

  useEffect(() => {
    const applyUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const ids = (params.get("ids") ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      setSelectedIds(ids.length >= 2 ? ids.slice(0, 4) : portfolio.default_selected_ids);
      setUrlReady(true);
    };

    applyUrl();
    window.addEventListener("popstate", applyUrl);
    return () => window.removeEventListener("popstate", applyUrl);
  }, [portfolio.default_selected_ids]);

  useEffect(() => {
    if (!urlReady) return;
    const params = new URLSearchParams();
    params.set("ids", comparison.selected_ids.join(","));
    window.history.replaceState(null, "", `/compare?${params.toString()}`);
  }, [comparison.selected_ids, urlReady]);

  return (
    <main className="app-shell comparison-shell">
      <header className="network-header">
        <div className="network-header__inner">
          <div className="investigation-header__links">
            <Link className="back-link" href="/">
              Back to dashboard
            </Link>
            <Link className="back-link" href="/validation">
              Validation queue
            </Link>
            <Link className="back-link" href="/sources">
              Source registry
            </Link>
            <Link className="back-link" href="/network">
              Network map
            </Link>
          </div>
          <p className="eyebrow">Constraint Comparison Workspace</p>
          <h1>Compare constraints by rank, evidence, action readiness, and network context</h1>
          <p className="lede">
            Select 2-4 records to inspect why one constraint outranks another,
            where the evidence is weaker, and which comparison should drive the
            next validation or intervention decision.
          </p>
        </div>
      </header>

      <section className="comparison-main" aria-label="Constraint comparison workspace">
        <ComparisonControls
          portfolio={portfolio}
          selectedIds={comparison.selected_ids}
          onSelectedIdsChange={setSelectedIds}
        />

        <ComparisonSummary comparison={comparison} />

        <section className="comparison-grid" aria-label="Selected constraints">
          {comparison.records.map((record) => (
            <ComparisonRecordCard key={record.id} record={record} />
          ))}
        </section>

        <section className="comparison-section">
          <div>
            <p className="section-kicker">Ranking explanation</p>
            <h2>Why the top record outranks the others</h2>
          </div>
          <div className="comparison-pairwise-list">
            {comparison.pairwise.map((pairwise) => (
              <article
                className="comparison-explanation-card"
                key={`${pairwise.leader_id}:${pairwise.compared_id}`}
              >
                <span>
                  {pairwise.leader_title} vs {pairwise.compared_title}
                </span>
                <strong>Priority gap {pairwise.priority_gap.toFixed(1)}</strong>
                <p>{pairwise.explanation}</p>
                <p>{pairwise.tradeoff}</p>
              </article>
            ))}
          </div>
        </section>

        <ComparisonMatrix comparison={comparison} />

        <section className="comparison-section comparison-section--split">
          <div>
            <p className="section-kicker">Evidence vs opportunity</p>
            <h2>Find attractive but fragile records</h2>
            <p>
              The comparison is intentionally not just a score race. A high
              priority constraint with low defensibility or high validation
              burden should be routed toward evidence packets and source
              upgrades before full intervention planning.
            </p>
          </div>
          <div className="comparison-insight-list">
            {comparison.ranking.map((record) => (
              <article className="comparison-insight" key={record.id}>
                <span>{record.validation_risk} validation risk</span>
                <strong>{record.title}</strong>
                <p>
                  Priority {record.priority_score.toFixed(1)} | defensibility{" "}
                  {record.evidence_defensibility.toFixed(1)} | burden{" "}
                  {record.validation_burden.toFixed(1)}
                </p>
              </article>
            ))}
          </div>
        </section>

        {comparison.unsupported_dimensions.length > 0 ? (
          <section className="comparison-section">
            <p className="section-kicker">Unsupported dimensions</p>
            <ul>
              {comparison.unsupported_dimensions.map((dimension) => (
                <li key={dimension}>{dimension}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function ComparisonControls({
  onSelectedIdsChange,
  portfolio,
  selectedIds
}: {
  onSelectedIdsChange: (ids: string[]) => void;
  portfolio: ConstraintComparisonPortfolio;
  selectedIds: string[];
}) {
  const slots = Array.from({ length: 4 }, (_, index) => selectedIds[index] ?? "");

  return (
    <section className="comparison-controls" aria-label="Comparison selectors">
      <div>
        <p className="section-kicker">Compare records</p>
        <h2>Select 2-4 constraints</h2>
      </div>
      <div className="comparison-selector-grid">
        {slots.map((selectedId, index) => (
          <label key={`slot-${index + 1}`}>
            Constraint {index + 1}
            <select
              value={selectedId}
              onChange={(event) => {
                const next = [...slots];
                next[index] = event.target.value;
                onSelectedIdsChange(unique(next.filter(Boolean)).slice(0, 4));
              }}
            >
              {index >= 2 ? <option value="">None</option> : null}
              {portfolio.candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.title} ({candidate.priority_score.toFixed(1)})
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="network-filter-actions">
        <button
          className="details-button"
          type="button"
          onClick={() => onSelectedIdsChange(portfolio.default_selected_ids)}
        >
          Reset comparison
        </button>
      </div>
    </section>
  );
}

function ComparisonSummary({ comparison }: { comparison: ConstraintComparison }) {
  return (
    <section className="comparison-summary-grid" aria-label="Comparison summary">
      <Metric label="Selected" value={comparison.summary.selected_count} />
      <Metric label="Highest Priority" value={comparison.summary.highest_priority} />
      <Metric label="Strongest Evidence" value={comparison.summary.strongest_evidence} />
      <Metric
        label="Best Action Readiness"
        value={comparison.summary.best_intervention_readiness}
      />
      <Metric
        label="Highest Validation Burden"
        value={comparison.summary.highest_validation_burden}
      />
      <Metric label="Closest Comparison" value={comparison.summary.closest_comparison} />
    </section>
  );
}

function ComparisonRecordCard({ record }: { record: ConstraintComparisonRecord }) {
  return (
    <article className="comparison-record-card">
      <div>
        <span>{record.industry}</span>
        <h2>{record.title}</h2>
        <p>{record.description}</p>
      </div>
      <div className="comparison-record-card__scores">
        <Score label="Priority" value={record.priority_score} />
        <Score label="Validation" value={record.validation_confidence} />
        <Score label="Defensibility" value={record.evidence_defensibility} />
        <Score label="Action Confidence" value={record.action_confidence} />
      </div>
      <dl className="comparison-detail-list">
        <Row label="Primary archetype" value={record.primary_archetype} />
        <Row label="Intervention type" value={record.intervention_type} />
        <Row label="Validation burden" value={record.validation_burden.toFixed(1)} />
        <Row
          label="Recalibrated severity"
          value={record.recalibrated_validation_severity}
        />
        <Row label="Network degree" value={String(record.network_degree)} />
        <Row
          label="Cross-industry bridges"
          value={String(record.cross_industry_bridge_count)}
        />
      </dl>
      <div className="comparison-note-grid">
        <div>
          <h3>Why it matters</h3>
          <p>{record.why_it_matters}</p>
        </div>
        <div>
          <h3>Source risk</h3>
          <p>{record.source_risk}</p>
        </div>
        <div>
          <h3>Intervention readiness</h3>
          <p>{record.intervention_readiness}</p>
        </div>
        <div>
          <h3>Network context</h3>
          <p>{record.top_network_edge}</p>
        </div>
      </div>
      <div className="validation-task-card__links">
        <Link href={record.route}>Investigation</Link>
        <Link href={record.network_route}>Network focus</Link>
        <Link href={`/validation?industry=${encodeURIComponent(record.industry)}`}>
          Validation
        </Link>
        <Link href="/sources">Sources</Link>
      </div>
    </article>
  );
}

function ComparisonMatrix({ comparison }: { comparison: ConstraintComparison }) {
  return (
    <section className="comparison-section">
      <div>
        <p className="section-kicker">Side-by-side dimensions</p>
        <h2>Score and context matrix</h2>
      </div>
      <div className="comparison-matrix" role="table" aria-label="Comparison matrix">
        <div className="comparison-matrix__row comparison-matrix__row--header" role="row">
          <div role="columnheader">Dimension</div>
          {comparison.records.map((record) => (
            <div key={record.id} role="columnheader">
              {record.title}
            </div>
          ))}
        </div>
        {comparison.dimensions.map((dimension) => (
          <div className="comparison-matrix__row" key={dimension.key} role="row">
            <div role="cell">
              <strong>{dimension.label}</strong>
              <span>{dimension.higher_is_better ? "Higher is stronger" : "Context"}</span>
            </div>
            {comparison.records.map((record) => (
              <div key={`${dimension.key}:${record.id}`} role="cell">
                {formatValue(dimension.values[record.id])}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="comparison-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="comparison-score">
      <span>{label}</span>
      <strong>{value.toFixed(1)}</strong>
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

function formatValue(value: number | string) {
  return typeof value === "number" ? value.toFixed(1) : value;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
