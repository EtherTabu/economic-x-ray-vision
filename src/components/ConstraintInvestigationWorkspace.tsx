import Link from "next/link";
import type { ReactNode } from "react";
import type { ConstraintInvestigation } from "@/lib/constraintInvestigation";

type ConstraintInvestigationWorkspaceProps = {
  investigation: ConstraintInvestigation;
};

export function ConstraintInvestigationWorkspace({
  investigation
}: ConstraintInvestigationWorkspaceProps) {
  const {
    analogs,
    constraint,
    evidenceDossier,
    evidencePack,
    executiveSummary,
    explanation,
    interventionStrategy,
    primaryArchetype,
    secondaryArchetypes,
    summaryText,
    validationTasks,
    validationWorkflow
  } = investigation;

  return (
    <main className="app-shell investigation-shell">
      <header className="investigation-header">
        <div className="investigation-header__inner">
          <div className="investigation-header__links">
            <Link className="back-link" href="/">
              Back to dashboard
            </Link>
            <Link className="back-link" href={`/network?focus=${constraint.id}`}>
              View this constraint in the network
            </Link>
          </div>
          <p className="eyebrow">Constraint Investigation Workspace</p>
          <h1>{constraint.title}</h1>
          <div className="constraint-card__meta">
            <span className="pill">{constraint.id}</span>
            <span className="pill">{constraint.industry}</span>
            <span className="pill">{constraint.category}</span>
            <span className="pill">{primaryArchetype.display_name}</span>
            <span className="pill">{constraint.origin} record</span>
            <span className="pill">{validationWorkflow.state}</span>
          </div>
        </div>
      </header>

      <section className="investigation-main" aria-label="Constraint investigation">
        <section className="investigation-section investigation-section--lead">
          <div>
            <p className="section-kicker">Executive investigation summary</p>
            <h2>From constraint hypothesis to validation-aware action.</h2>
            <p>{executiveSummary.what_it_is}</p>
            <p>{executiveSummary.why_it_matters}</p>
          </div>
          <div className="investigation-callout">
            <span>Recommended next move</span>
            <strong>{executiveSummary.recommended_next_move}</strong>
          </div>
        </section>

        <section className="investigation-metric-grid" aria-label="Score breakdown">
          <InvestigationMetric
            label="Priority"
            value={constraint.scores.total_priority_score}
          />
          <InvestigationMetric
            label="Evidence"
            value={constraint.scores.evidence_score}
          />
          <InvestigationMetric
            label="Validation confidence"
            value={constraint.scores.validation_confidence_score}
          />
          <InvestigationMetric
            label="Strategic opportunity"
            value={constraint.scores.total_strategic_score}
          />
          <InvestigationMetric
            label="Intervention priority"
            value={interventionStrategy.intervention_priority_score}
          />
          <InvestigationMetric
            label="Action confidence"
            value={interventionStrategy.action_confidence}
          />
          <InvestigationMetric
            label="Archetype confidence"
            value={constraint.archetype_confidence}
          />
          <InvestigationMetric
            label="Similarity signal"
            value={constraint.scores.cross_industry_similarity_score}
          />
        </section>

        <section className="investigation-grid">
          <InvestigationSection title="Evidence Dossier">
            <p>{evidenceDossier.core_claim}</p>
            <DefinitionList
              items={[
                ["Current evidence state", evidenceDossier.current_validation_status],
                ["Evidence risk", evidenceDossier.evidence_risk_level],
                ["Evidence summary", evidenceDossier.evidence_summary],
                ["Decision usefulness", evidenceDossier.decision_usefulness]
              ]}
            />
            <ListBlock title="Known evidence" values={evidenceDossier.known_evidence} />
            <ListBlock title="Evidence gaps" values={evidenceDossier.evidence_gaps} />
            <ListBlock
              title="What would prove this true"
              values={evidenceDossier.what_would_prove_this_true}
            />
            <ListBlock
              title="What would disprove it"
              values={evidenceDossier.what_would_disprove_this}
            />
            <ListBlock
              title="Recommended validation steps"
              values={evidenceDossier.recommended_validation_steps}
            />
            <ListBlock
              title="Red-team questions"
              values={evidenceDossier.red_team_questions}
            />
          </InvestigationSection>

          <InvestigationSection title="Source Registry + Evidence Pack">
            <p>{evidencePack.core_claim}</p>
            <DefinitionList
              items={[
                ["Provenance status", evidencePack.provenance_status],
                [
                  "Defensibility score",
                  `${evidencePack.defensibility_score.toFixed(1)}/10`
                ],
                [
                  "Source coverage",
                  `${evidencePack.source_coverage_score.toFixed(1)}/10`
                ],
                [
                  "Recommended source upgrade",
                  evidencePack.recommended_source_upgrade
                ]
              ]}
            />
            <ListBlock
              title="Source records"
              values={evidencePack.source_records.map(
                (source) =>
                  `${source.title} (${source.provenance_level}; ${source.citation_status})`
              )}
            />
            <ListBlock
              title="Claim support"
              values={evidencePack.claim_support.map(
                (claim) => `${claim.support_level}: ${claim.claim}`
              )}
            />
            <ListBlock
              title="Provenance notes"
              values={evidencePack.provenance_notes}
            />
            <ListBlock title="Audit flags" values={evidencePack.audit_flags} />
          </InvestigationSection>

          <InvestigationSection title="Validation Workflow">
            <DefinitionList
              items={[
                ["Current state", validationWorkflow.state],
                ["Decision readiness", validationWorkflow.decision_ready ? "Decision-ready" : "Not decision-ready"],
                ["Decision usefulness", validationWorkflow.decision_usefulness],
                ["Next validation step", validationWorkflow.analyst_next_action]
              ]}
            />
            <ListBlock title="Missing inputs" values={validationWorkflow.missing} />
            <ListBlock
              title="Confidence upgrade path"
              values={validationWorkflow.confidence_upgrade_path}
            />
            <ListBlock
              title="Confidence downgrade triggers"
              values={validationWorkflow.confidence_downgrade_triggers}
            />
          </InvestigationSection>

          <InvestigationSection title="Validation Tasks">
            <div className="investigation-task-header">
              <p>
                Generated task queue for this constraint. Status is deterministic
                and not user-editable in this phase.
              </p>
              <Link className="details-link" href="/validation">
                View all validation tasks
              </Link>
            </div>
            {validationTasks.length > 0 ? (
              <div className="investigation-task-list">
                {validationTasks.slice(0, 6).map((task) => (
                  <article className="investigation-task-card" key={task.task_id}>
                    <div className="validation-task-card__topline">
                      <span
                        className={`severity-chip severity-chip--${task.severity.toLowerCase()}`}
                      >
                        {task.severity}
                      </span>
                      <span className={`status-chip status-chip--${task.status}`}>
                        {task.status.replaceAll("_", " ")}
                      </span>
                      <strong>{task.priority_score.toFixed(1)}</strong>
                    </div>
                    <h3>{task.task_type.replaceAll("_", " ")}</h3>
                    <p>{task.recommended_action}</p>
                    <DefinitionList
                      items={[
                        ["Expected artifact", task.expected_artifact],
                        ["Blocking reason", task.blocking_reason],
                        ["Evidence gap", task.evidence_gap],
                        ["Source gap", task.source_gap]
                      ]}
                    />
                  </article>
                ))}
              </div>
            ) : (
              <p>No validation tasks are generated for this constraint.</p>
            )}
          </InvestigationSection>

          <InvestigationSection title="Archetype Reasoning">
            <p>{constraint.archetype_reasoning}</p>
            <DefinitionList
              items={[
                ["Primary archetype", primaryArchetype.display_name],
                ["Definition", primaryArchetype.plain_english_definition],
                ["Confidence", `${constraint.archetype_confidence.toFixed(1)}/10`],
                [
                  "Secondary archetypes",
                  secondaryArchetypes
                    .map((archetype) => archetype.display_name)
                    .join(", ")
                ]
              ]}
            />
            <ListBlock
              title="Common evidence needed"
              values={primaryArchetype.common_evidence_needed}
            />
            <ListBlock
              title="Related archetype examples"
              values={primaryArchetype.example_constraints}
            />
            <ListBlock
              title="Why this pattern appears here"
              values={explanation.top_score_drivers}
            />
          </InvestigationSection>

          <InvestigationSection title="Intervention Strategy">
            <p>{interventionStrategy.intervention_thesis}</p>
            <DefinitionList
              items={[
                [
                  "Recommended type",
                  interventionStrategy.intervention_type.replaceAll("_", " ")
                ],
                ["Why this fits", interventionStrategy.why_this_fits],
                ["Expected unlock", interventionStrategy.expected_unlock],
                ["Operational risk", interventionStrategy.operational_risk],
                ["Recommended next step", interventionStrategy.recommended_next_step]
              ]}
            />
            <ListBlock
              title="First experiment"
              values={[interventionStrategy.first_experiment]}
            />
            <ListBlock
              title="Success metrics"
              values={interventionStrategy.success_metrics}
            />
            <ListBlock
              title="Key assumptions"
              values={interventionStrategy.key_assumptions}
            />
            <ListBlock title="Failure modes" values={interventionStrategy.failure_modes} />
          </InvestigationSection>
        </section>

        <InvestigationSection title="Cross-Industry Analogs" wide>
          {analogs.length > 0 ? (
            <div className="investigation-analog-grid">
              {analogs.map((analog) => (
                <article className="investigation-analog" key={analog.analog_constraint_id}>
                  <span>{analog.analog_industry}</span>
                  <h3>{analog.analog_constraint_title}</h3>
                  <p>{analog.why_the_analog_matters}</p>
                  <DefinitionList
                    items={[
                      ["Similarity", `${analog.similarity_score.toFixed(1)}/10`],
                      [
                        "Shared archetypes",
                        analog.shared_archetypes
                          .map((archetype) => archetype.replaceAll("_", " "))
                          .join(", ")
                      ],
                      ["What can be learned", analog.what_can_be_learned],
                      ["Validation risk", analog.validation_risk]
                    ]}
                  />
                </article>
              ))}
            </div>
          ) : (
            <p>No strong cross-industry analogs are available for this record yet.</p>
          )}
        </InvestigationSection>

        <InvestigationSection title="Copyable Investigation Summary" wide>
          <pre className="investigation-summary-text">{summaryText}</pre>
        </InvestigationSection>
      </section>
    </main>
  );
}

function InvestigationSection({
  children,
  title,
  wide = false
}: {
  children: ReactNode;
  title: string;
  wide?: boolean;
}) {
  return (
    <section className={`investigation-section${wide ? " investigation-section--wide" : ""}`}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function InvestigationMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="investigation-metric">
      <span>{label}</span>
      <strong>{value.toFixed(1)}</strong>
    </div>
  );
}

function DefinitionList({ items }: { items: [string, string][] }) {
  return (
    <dl className="investigation-definition-list">
      {items.map(([term, detail]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{detail || "Not specified"}</dd>
        </div>
      ))}
    </dl>
  );
}

function ListBlock({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="investigation-list-block">
      <h3>{title}</h3>
      {values.length > 0 ? (
        <ul>
          {values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : (
        <p>Not specified.</p>
      )}
    </div>
  );
}
