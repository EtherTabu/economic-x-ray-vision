import type { EvidencePackPortfolio } from "@/lib/evidencePacks";

type SourceEvidencePanelProps = {
  portfolio: EvidencePackPortfolio;
};

export function SourceEvidencePanel({ portfolio }: SourceEvidencePanelProps) {
  const weakestPacks = portfolio.packs.slice(0, 5);
  const preview = weakestPacks[0];

  return (
    <section className="source-panel" aria-label="Source registry and evidence packs">
      <div className="source-panel__header">
        <div>
          <p className="section-kicker">V11.0 source registry</p>
          <h2>Evidence packs separate sources, claims, gaps, and provenance.</h2>
        </div>
        <p>
          Source packs preserve current source locators, expose citation gaps,
          and score defensibility without pretending that every record is fully
          validated.
        </p>
      </div>

      <div className="source-panel__metrics">
        <Metric label="Source Records" value={portfolio.source_summary.source_count} />
        <Metric
          label="Average Trust"
          value={portfolio.source_summary.average_trust_weight.toFixed(1)}
        />
        <Metric
          label="Avg Defensibility"
          value={portfolio.evidence_pack_summary.average_defensibility_score.toFixed(1)}
        />
        <Metric
          label="Thin Provenance"
          value={portfolio.evidence_pack_summary.thin_provenance_records}
        />
        <Metric
          label="Need Primary Docs"
          value={portfolio.source_summary.sources_needing_primary_documents}
        />
      </div>

      <div className="source-panel__body">
        <div className="source-priority-list">
          <h3>Source Upgrade Targets</h3>
          {weakestPacks.map((pack) => (
            <div className="source-priority" key={pack.constraint_id}>
              <span>{pack.defensibility_score.toFixed(1)}</span>
              <strong>{pack.constraint_title}</strong>
              <p>{pack.recommended_source_upgrade}</p>
            </div>
          ))}
        </div>

        {preview ? (
          <article className="source-preview">
            <span>Selected evidence pack</span>
            <h3>{preview.constraint_title}</h3>
            <p>{preview.core_claim}</p>
            <dl>
              <Row label="Provenance Status" value={preview.provenance_status} />
              <Row
                label="Source Records"
                value={preview.source_records.map((source) => source.title).join("; ")}
              />
              <Row
                label="Claim Support"
                value={preview.claim_support
                  .map((claim) => `${claim.support_level}: ${claim.claim}`)
                  .join("; ")}
              />
              <Row label="Audit Flags" value={preview.audit_flags.join("; ")} />
            </dl>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="source-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "Not specified"}</dd>
    </div>
  );
}
