import Link from "next/link";
import type { CaseStudy, CaseStudyExport } from "@/lib/caseStudies";

export function CaseStudyWorkspace({ exportData }: { exportData: CaseStudyExport }) {
  const caseStudy = exportData.case_studies[0];
  const artifactDistribution = distribution(
    caseStudy.evidence_artifacts_needed.map((artifact) => artifact.artifact_type)
  );

  return (
    <main className="app-shell case-study-shell">
      <header className="network-header">
        <div className="network-header__inner">
          <div className="investigation-header__links">
            <Link className="back-link" href="/">
              Back to dashboard
            </Link>
            <Link className="back-link" href="/reports">
              Reports
            </Link>
            <Link className="back-link" href="/evidence">
              Evidence matching
            </Link>
            <Link className="back-link" href="/sources">
              Sources
            </Link>
          </div>
          <p className="eyebrow">Case Study Workspace</p>
          <h1>Focused evidence-request-backed case study</h1>
          <p className="lede">
            This workspace groups existing constraints, artifact needs, source
            requests, and limitations into one defensible mini case study
            without creating evidence imports or changing generated status.
          </p>
        </div>
      </header>

      <section className="case-study-main">
        <section className="report-summary-grid">
          <Metric label="Case Studies" value={exportData.summary.case_study_count} />
          <Metric
            label="Constraints"
            value={exportData.summary.included_constraint_count}
          />
          <Metric label="Evidence Imports" value={exportData.summary.evidence_import_count} />
          <Metric label="Source Requests" value={exportData.summary.source_request_count} />
          <Metric label="Artifact Needs" value={exportData.summary.artifact_need_count} />
          <Metric label="Uncovered" value={exportData.summary.uncovered_artifact_count} />
        </section>

        <CaseStudyOverview caseStudy={caseStudy} />

        <section className="case-study-grid">
          <section className="case-study-panel">
            <div className="report-section__header">
              <h2>Constraint Cluster</h2>
              <span>{caseStudy.constraints.length} records</span>
            </div>
            <div className="case-study-list">
              {caseStudy.constraints.map((constraint) => (
                <article className="case-study-constraint" key={constraint.constraint_id}>
                  <span>{constraint.industry}</span>
                  <h3>{constraint.title}</h3>
                  <p>{constraint.mechanism}</p>
                  <div className="case-study-score-row">
                    <strong>Priority {constraint.priority_score.toFixed(1)}</strong>
                    <strong>Strategic {constraint.strategic_score.toFixed(1)}</strong>
                    <strong>Validation {constraint.validation_confidence.toFixed(1)}</strong>
                  </div>
                  <div className="validation-task-card__links">
                    <Link href={constraint.route}>Investigation</Link>
                    <Link href={constraint.network_route}>Network focus</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="case-study-panel">
            <div className="report-section__header">
              <h2>Evidence Requests</h2>
              <span>{caseStudy.source_requests.length} requests</span>
            </div>
            <div className="case-study-list">
              {caseStudy.source_requests.map((request) => (
                <article className="case-study-request" key={request.source_request_id}>
                  <span>{request.source_quality_tier}</span>
                  <h3>{request.request_title}</h3>
                  <p>{request.reason}</p>
                  <dl>
                    <Row label="Expected artifact" value={request.expected_artifact_type} />
                    <Row label="Owner" value={request.preferred_source_owner} />
                    <Row label="Linked artifacts" value={request.artifact_ids.length.toString()} />
                  </dl>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="case-study-panel">
          <div className="report-section__header">
            <h2>Artifact Coverage</h2>
            <span>{caseStudy.evidence_artifacts_needed.length} needs</span>
          </div>
          <div className="case-study-distribution">
            {Object.entries(artifactDistribution).map(([type, count]) => (
              <div key={type}>
                <span>{type.replaceAll("_", " ")}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
          <div className="case-study-artifact-list">
            {caseStudy.evidence_artifacts_needed.slice(0, 14).map((artifact) => (
              <article key={artifact.artifact_id}>
                <span>{artifact.artifact_type.replaceAll("_", " ")}</span>
                <strong>{artifact.artifact_title}</strong>
                <p>
                  {artifact.constraint_id} · {artifact.status} · priority{" "}
                  {artifact.priority.toFixed(1)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="case-study-grid">
          <section className="case-study-panel">
            <h2>Validation Questions</h2>
            <ul>
              {caseStudy.validation_questions.slice(0, 8).map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </section>

          <section className="case-study-panel">
            <h2>Recommended First Campaign</h2>
            <p>{caseStudy.recommended_first_campaign.objective}</p>
            <p>{caseStudy.recommended_first_campaign.reason}</p>
            <div className="validation-task-card__links">
              <Link href="/validation">Validation queue</Link>
              <Link href="/campaigns">Campaign planner</Link>
              <Link href="/reports">Report builder</Link>
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function CaseStudyOverview({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <section className="case-study-overview">
      <div>
        <p className="section-kicker">{caseStudy.case_study_id}</p>
        <h2>{caseStudy.title}</h2>
        <span>{caseStudy.status}</span>
      </div>
      <p>{caseStudy.thesis}</p>
      <p>{caseStudy.scope}</p>
      <p className="case-study-warning">{caseStudy.risk_limitation_statement}</p>
      <div className="case-study-layer-list">
        {caseStudy.system_layers_affected.map((layer) => (
          <span key={layer}>{layer}</span>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="report-metric">
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

function distribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}
