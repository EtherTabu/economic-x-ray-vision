import Link from "next/link";
import type { CampaignAnalystState } from "@/lib/analystState";
import type {
  CampaignDetailConstraint,
  ValidationCampaignDetail
} from "@/lib/validationCampaignDetails";

type ValidationCampaignDetailWorkspaceProps = {
  detail: ValidationCampaignDetail;
  analystState: CampaignAnalystState;
};

export function ValidationCampaignDetailWorkspace({
  analystState,
  detail
}: ValidationCampaignDetailWorkspaceProps) {
  const { campaign, summary } = detail;

  return (
    <main className="app-shell campaign-detail-shell">
      <header className="network-header">
        <div className="network-header__inner">
          <div className="investigation-header__links">
            <Link className="back-link" href="/campaigns">
              Back to campaigns
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
          <p className="eyebrow">Validation campaign workspace</p>
          <h1>{campaign.title}</h1>
          <p className="lede">{campaign.objective}</p>
        </div>
      </header>

      <section className="campaign-main" aria-label={`${campaign.title} details`}>
        <section className="campaign-summary-grid">
          <Metric label="Mode" value={campaign.mode} />
          <Metric label="Effort" value={campaign.effort_level} />
          <Metric label="Timebox" value={campaign.analyst_timebox} />
          <Metric label="Constraints" value={summary.selected_constraints} />
          <Metric
            label="Expected Lift"
            value={`+${summary.expected_total_lift.toFixed(1)}`}
          />
          <Metric label="Source Records" value={summary.source_records} />
          <Metric label="Artifact Types" value={summary.required_artifacts} />
          <Metric label="Join Gaps" value={summary.relationship_gap_count} />
        </section>

        <section className="campaign-detail-brief">
          <div>
            <p className="section-kicker">Execution brief</p>
            <h2>What this campaign should prove</h2>
          </div>
          <p>{campaign.why_this_campaign}</p>
          <p>{campaign.expected_confidence_lift.explanation}</p>
          <p>
            <strong>Decision use:</strong> {campaign.decision_use}
          </p>
        </section>

        <section className="campaign-progress-panel">
          <div>
            <p className="section-kicker">Analyst state placeholder</p>
            <h2>Campaign progress starts unassigned and not started.</h2>
            <p>
              This is local state scaffolding only. It does not claim artifacts
              have been collected, tasks accepted, or constraints reviewed.
            </p>
          </div>
          <div className="campaign-progress-grid">
            <Metric
              label="Campaign Status"
              value={String(analystState.summary.campaign_status).replaceAll("_", " ")}
            />
            <Metric
              label="Tracked Artifacts"
              value={analystState.summary.tracked_artifacts}
            />
            <Metric label="Tracked Tasks" value={analystState.summary.tracked_tasks} />
            <Metric
              label="Unassigned"
              value={analystState.summary.unassigned_records}
            />
          </div>
        </section>

        <section className="campaign-detail-brief">
          <div>
            <p className="section-kicker">Campaign artifact set</p>
            <h2>Required evidence before confidence improves</h2>
          </div>
          <div className="campaign-detail-columns">
            <Checklist title="Required artifacts" items={campaign.required_artifacts} />
            <Checklist
              title="Source upgrades"
              items={campaign.source_upgrades_needed}
            />
          </div>
        </section>

        <section className="campaign-detail-sequence">
          <div>
            <p className="section-kicker">Validation sequence</p>
            <h2>Validate these constraints in order</h2>
          </div>
          <div className="campaign-detail-list">
            {detail.constraints.map((constraint) => (
              <CampaignConstraintDetail
                constraint={constraint}
                key={`${campaign.campaign_id}:${constraint.campaign_constraint.constraint_id}`}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function CampaignConstraintDetail({
  constraint
}: {
  constraint: CampaignDetailConstraint;
}) {
  const selected = constraint.campaign_constraint;

  return (
    <article className="campaign-detail-card">
      <div className="campaign-detail-card__header">
        <div>
          <p className="section-kicker">
            #{constraint.rank} | {selected.industry}
          </p>
          <h3>{selected.constraint_title}</h3>
          <p>{selected.why_selected}</p>
        </div>
        <div className="campaign-card__score">
          <span>{constraint.triage?.recalibrated_severity ?? "Unrated"}</span>
          <strong>+{selected.expected_confidence_lift.toFixed(1)}</strong>
          <small>Expected lift</small>
        </div>
      </div>

      <div className="campaign-chip-row">
        <span>Priority {selected.priority_score.toFixed(1)}</span>
        <span>Strategic {selected.strategic_score.toFixed(1)}</span>
        <span>Burden {selected.validation_burden_score.toFixed(1)}</span>
        <span>Validation {selected.validation_confidence.toFixed(1)}</span>
        <span>Defensibility {selected.evidence_defensibility.toFixed(1)}</span>
      </div>

      <section className="campaign-detail-card__section">
        <h4>Next validation action</h4>
        <p>
          {constraint.triage?.next_best_action.action_title ??
            "No triage action is linked."}
        </p>
        <p>
          {constraint.triage?.next_best_action.rationale ??
            "The campaign can still show selected artifacts, but triage context is missing."}
        </p>
      </section>

      <section className="campaign-detail-grid">
        <div>
          <h4>Evidence packet</h4>
          <dl>
            <Row
              label="Category"
              value={constraint.packet?.request_category ?? "Missing packet"}
            />
            <Row
              label="Evidence needed"
              value={constraint.packet?.evidence_needed ?? selected.decision_use}
            />
            <Row
              label="Expected artifact"
              value={
                constraint.packet?.expected_artifact ??
                selected.required_artifacts[0] ??
                "Not specified"
              }
            />
            <Row
              label="Confidence impact"
              value={
                constraint.packet
                  ? constraint.packet.expected_confidence_impact.explanation
                  : `Campaign estimate is +${selected.expected_confidence_lift.toFixed(1)} if requested artifacts pass.`
              }
            />
          </dl>
        </div>
        <div>
          <h4>Source and provenance</h4>
          <dl>
            <Row
              label="Source upgrade"
              value={constraint.source_upgrades_needed[0] ?? "No source upgrade linked."}
            />
            <Row
              label="Provenance"
              value={constraint.evidence_pack?.provenance_status ?? "Missing pack"}
            />
            <Row
              label="Audit flags"
              value={
                constraint.evidence_pack?.audit_flags.join("; ") ??
                "No evidence pack audit flags available."
              }
            />
          </dl>
        </div>
      </section>

      <section className="campaign-artifact-needs">
        <h4>Artifact needs</h4>
        {constraint.artifact_needs.length > 0 ? (
          <div className="artifact-need-list artifact-need-list--campaign">
            {constraint.artifact_needs.slice(0, 4).map((artifact) => (
              <div className="artifact-need-row" key={artifact.artifact_id}>
                <span>{artifact.artifact_type.replaceAll("_", " ")}</span>
                <strong>{artifact.artifact_title}</strong>
                <small>
                  Priority {artifact.priority.toFixed(1)} | impact +
                  {artifact.confidence_impact.toFixed(1)} |{" "}
                  {artifact.status.replaceAll("_", " ")}
                </small>
                <p>{artifact.validation_question_answered}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No artifact needs are linked for this campaign constraint.</p>
        )}
      </section>

      <section className="campaign-detail-columns">
        <Checklist title="Required artifacts" items={constraint.required_artifacts} />
        <Checklist title="Success criteria" items={constraint.success_criteria} />
        <Checklist title="Failure criteria" items={constraint.failure_criteria} />
      </section>

      <section className="campaign-detail-grid">
        <div>
          <h4>Source records</h4>
          {constraint.evidence_pack?.source_records.length ? (
            <ul>
              {constraint.evidence_pack.source_records.map((source) => (
                <li key={source.source_id}>
                  <strong>{source.title}</strong>: {source.citation_status},{" "}
                  {source.provenance_level}, trust {source.trust_weight.toFixed(1)}
                </li>
              ))}
            </ul>
          ) : (
            <p>No source records are linked through this evidence pack.</p>
          )}
        </div>
        <div>
          <h4>Network and comparison context</h4>
          <dl>
            <Row
              label="Comparison risk"
              value={constraint.comparison?.validation_risk ?? "Missing comparison"}
            />
            <Row
              label="Intervention readiness"
              value={
                constraint.comparison?.intervention_readiness ??
                "No comparison readiness signal available."
              }
            />
            <Row
              label="Top network edge"
              value={constraint.network_edges[0]?.label ?? "No network edge"}
            />
          </dl>
        </div>
      </section>

      {constraint.relationship_gaps.length > 0 ? (
        <section className="campaign-gap-box">
          <h4>Relationship gaps</h4>
          <ul>
            {constraint.relationship_gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="validation-task-card__links">
        <Link href={selected.investigation_route}>Investigation</Link>
        <Link href={selected.validation_route}>Validation</Link>
        <Link href={selected.source_route}>Sources</Link>
        <Link href={selected.comparison_route}>Compare</Link>
        <Link href={selected.network_route}>Network</Link>
      </div>
    </article>
  );
}

function Checklist({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="campaign-checklist">
      <h4>{title}</h4>
      {items.length > 0 ? (
        <ul>
          {items.slice(0, 8).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>No items linked.</p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="campaign-metric">
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
