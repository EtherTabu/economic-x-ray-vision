import { portfolioTheses } from "@/lib/opportunityAnalysis";
import type { OpportunityPortfolio } from "@/lib/opportunityAnalysis";

type AnalysisWorkbenchProps = {
  portfolio: OpportunityPortfolio;
};

export function AnalysisWorkbench({ portfolio }: AnalysisWorkbenchProps) {
  const theses = portfolioTheses(portfolio);

  return (
    <section className="workbench" aria-label="Intelligence analyst workbench">
      <div className="workbench__header">
        <div>
          <p className="section-kicker">V3.0 analyst workbench</p>
          <h2>Opportunity theses from the constraint map</h2>
        </div>
        <p>
          Deterministic analysis compares scores, evidence strength, complexity,
          measurability, and graph position to explain which constraints deserve
          attention and what would improve confidence.
        </p>
      </div>

      <div className="workbench__brief">
        <BriefItem
          label="Strongest opportunity"
          text={portfolio.bestOverall.constraint.title}
        />
        <BriefItem
          label="Attractive but under-validated"
          text={portfolio.highestUpsideWeakestEvidence.constraint.title}
        />
        <BriefItem
          label="Validate next"
          text={portfolio.bestValidationTarget.constraint.title}
        />
        <BriefItem
          label="Small intervention / large unlock"
          text={portfolio.bestLowComplexityHighImpact.constraint.title}
        />
      </div>

      <div className="thesis-grid">
        {theses.map((thesis) => (
          <article className="thesis-card" key={thesis.label}>
            <div className="thesis-card__top">
              <span>{thesis.label}</span>
              <strong>{thesis.score.toFixed(1)}</strong>
            </div>
            <h3>{thesis.constraint.title}</h3>
            <p>{thesis.why_it_matters}</p>
            <dl>
              <div>
                <dt>Risk</dt>
                <dd>{thesis.risk}</dd>
              </div>
              <div>
                <dt>Confidence Improver</dt>
                <dd>{thesis.confidence_improver}</dd>
              </div>
              <div>
                <dt>Intervention Path</dt>
                <dd>{thesis.intervention_path}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function BriefItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="brief-item">
      <span>{label}</span>
      <strong>{text}</strong>
    </div>
  );
}
