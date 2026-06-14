import type {
  EvidenceDossier,
  EvidenceDossierSummary
} from "@/lib/evidenceDossier";

type EvidenceDossierPanelProps = {
  dossiers: EvidenceDossier[];
  summary: EvidenceDossierSummary;
  strongestUnderValidatedOpportunity: string;
};

export function EvidenceDossierPanel({
  dossiers,
  summary,
  strongestUnderValidatedOpportunity
}: EvidenceDossierPanelProps) {
  const topDossiers = dossiers.slice(0, 5);
  const preview = topDossiers[0];

  return (
    <section className="evidence-panel" aria-label="Evidence dossiers">
      <div className="evidence-panel__header">
        <div>
          <p className="section-kicker">Evidence dossier workflow</p>
          <h2>Hypothesis to validated intelligence</h2>
        </div>
        <p>
          Dossiers treat records as claims under validation. They show what is
          known, what is missing, what could disprove the claim, and whether the
          record is useful for decisions.
        </p>
      </div>

      <div className="evidence-panel__metrics">
        <Metric label="Total Dossiers" value={summary.total_dossiers} />
        <Metric label="Decision Ready" value={summary.decision_ready_records} />
        <Metric label="Needs Evidence" value={summary.needs_evidence_records} />
        <Metric
          label="High-Priority Validation"
          value={summary.high_priority_validation_records}
        />
        <Metric
          label="Under-Validated Opportunity"
          value={strongestUnderValidatedOpportunity}
        />
      </div>

      <div className="evidence-panel__body">
        <div className="validation-priority-list">
          <h3>Top Validation Priorities</h3>
          {topDossiers.map((dossier) => (
            <div className="validation-priority" key={dossier.constraint_id}>
              <span>{dossier.validation_priority_score.toFixed(1)}</span>
              <strong>{dossier.constraint_title}</strong>
              <p>{dossier.current_validation_status}</p>
            </div>
          ))}
        </div>

        {preview ? (
          <article className="dossier-preview">
            <span>Selected dossier preview</span>
            <h3>{preview.constraint_title}</h3>
            <p>{preview.core_claim}</p>
            <dl>
              <DossierRow label="Evidence Status" value={preview.current_validation_status} />
              <DossierRow label="Decision Usefulness" value={preview.decision_usefulness} />
              <DossierRow label="Evidence Gaps" value={preview.evidence_gaps.join("; ")} />
              <DossierRow
                label="Would Prove True"
                value={preview.what_would_prove_this_true.join("; ")}
              />
              <DossierRow
                label="Would Disprove"
                value={preview.what_would_disprove_this.join("; ")}
              />
              <DossierRow
                label="Validation Steps"
                value={preview.recommended_validation_steps.join("; ")}
              />
              <DossierRow
                label="Red-Team Questions"
                value={preview.red_team_questions.join("; ")}
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
    <div className="evidence-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DossierRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
