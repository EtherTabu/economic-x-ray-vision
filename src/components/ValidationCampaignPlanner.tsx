import Link from "next/link";
import type {
  ValidationCampaign,
  ValidationCampaignConstraint,
  ValidationCampaignPortfolio
} from "@/lib/validationCampaigns";

type ValidationCampaignPlannerProps = {
  portfolio: ValidationCampaignPortfolio;
};

export function ValidationCampaignPlanner({
  portfolio
}: ValidationCampaignPlannerProps) {
  return (
    <main className="app-shell campaign-shell">
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
            <Link className="back-link" href="/compare">
              Compare constraints
            </Link>
            <Link className="back-link" href="/network">
              Network map
            </Link>
          </div>
          <p className="eyebrow">Validation Campaign Planner</p>
          <h1>Turn validation debt into analyst-ready campaign plans</h1>
          <p className="lede">
            Deterministic campaign modes translate top validation actions,
            evidence packets, source upgrades, and comparison signals into
            concrete artifact collection plans.
          </p>
        </div>
      </header>

      <section className="campaign-main" aria-label="Validation campaign planner">
        <section className="campaign-summary-grid">
          <CampaignMetric
            label="Campaigns"
            value={portfolio.summary.campaign_count}
          />
          <CampaignMetric
            label="Selected Checks"
            value={portfolio.summary.total_selected_constraints}
          />
          <CampaignMetric
            label="Unique Coverage"
            value={portfolio.summary.unique_constraint_coverage}
          />
          <CampaignMetric
            label="Avg Lift"
            value={`+${portfolio.summary.average_expected_confidence_lift.toFixed(1)}`}
          />
          <CampaignMetric
            label="Highest Lift"
            value={portfolio.summary.highest_lift_campaign}
          />
        </section>

        <section className="campaign-intro">
          <div>
            <p className="section-kicker">Planner logic</p>
            <h2>Fast, standard, and deep validation modes</h2>
          </div>
          <p>
            Campaigns are generated from the existing top validation queue,
            evidence packets, source/evidence pack defensibility, score burden,
            and comparison risk. They do not introduce new claims or external
            sources; they only organize what the local intelligence layer already
            says needs validation.
          </p>
        </section>

        <div className="campaign-list">
          {portfolio.campaigns.map((campaign) => (
            <CampaignCard campaign={campaign} key={campaign.campaign_id} />
          ))}
        </div>
      </section>
    </main>
  );
}

function CampaignCard({ campaign }: { campaign: ValidationCampaign }) {
  return (
    <article className="campaign-card">
      <div className="campaign-card__header">
        <div>
          <p className="section-kicker">{campaign.mode} mode</p>
          <h2>{campaign.title}</h2>
          <p>{campaign.objective}</p>
        </div>
        <div className="campaign-card__score">
          <span>{campaign.effort_level} effort</span>
          <strong>
            +{campaign.expected_confidence_lift.total_estimated_lift.toFixed(1)}
          </strong>
          <small>Total expected lift</small>
        </div>
      </div>

      <Link
        className="details-link campaign-detail-link"
        href={`/campaigns/${encodeURIComponent(campaign.campaign_id)}`}
      >
        Open campaign workspace
      </Link>

      <div className="campaign-card__brief">
        <Brief label="Timebox" value={campaign.analyst_timebox} />
        <Brief
          label="Average Lift"
          value={`+${campaign.expected_confidence_lift.average_estimated_lift.toFixed(1)}`}
        />
        <Brief
          label="Selected Constraints"
          value={campaign.selected_constraints.length}
        />
        <Brief label="Decision Use" value={campaign.decision_use} />
      </div>

      <section className="campaign-card__section">
        <h3>Why this campaign</h3>
        <p>{campaign.why_this_campaign}</p>
        <p>{campaign.expected_confidence_lift.explanation}</p>
      </section>

      <section className="campaign-card__section">
        <h3>Required artifact set</h3>
        <ul>
          {campaign.required_artifacts.slice(0, 8).map((artifact) => (
            <li key={artifact}>{artifact}</li>
          ))}
        </ul>
      </section>

      <section className="campaign-card__section">
        <h3>Selected constraints</h3>
        <div className="campaign-constraint-grid">
          {campaign.selected_constraints.map((constraint) => (
            <CampaignConstraintCard
              constraint={constraint}
              key={`${campaign.campaign_id}:${constraint.constraint_id}`}
            />
          ))}
        </div>
      </section>
    </article>
  );
}

function CampaignConstraintCard({
  constraint
}: {
  constraint: ValidationCampaignConstraint;
}) {
  return (
    <article className="campaign-constraint-card">
      <span>{constraint.industry}</span>
      <h4>{constraint.constraint_title}</h4>
      <p>{constraint.why_selected}</p>
      <div className="campaign-chip-row">
        <span>Priority {constraint.priority_score.toFixed(1)}</span>
        <span>Burden {constraint.validation_burden_score.toFixed(1)}</span>
        <span>Lift +{constraint.expected_confidence_lift.toFixed(1)}</span>
      </div>
      <dl>
        <div>
          <dt>Artifact</dt>
          <dd>{constraint.required_artifacts[0]}</dd>
        </div>
        <div>
          <dt>Source upgrade</dt>
          <dd>{constraint.source_upgrades_needed[0]}</dd>
        </div>
        <div>
          <dt>Decision use</dt>
          <dd>{constraint.decision_use}</dd>
        </div>
      </dl>
      <div className="validation-task-card__links">
        <Link href={constraint.investigation_route}>Investigation</Link>
        <Link href={constraint.validation_route}>Validation</Link>
        <Link href={constraint.source_route}>Sources</Link>
        <Link href={constraint.comparison_route}>Compare</Link>
        <Link href={constraint.network_route}>Network</Link>
      </div>
    </article>
  );
}

function CampaignMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="campaign-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Brief({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="campaign-brief-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
