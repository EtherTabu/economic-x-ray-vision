import Link from "next/link";

export type ReportIndexEntry = {
  report_id: string;
  report_type:
    | "validation_priority"
    | "evidence_coverage"
    | "campaign"
    | "constraint";
  title: string;
  markdown_path: string;
  json_path: string;
  referenced_constraint_ids: string[];
  referenced_campaign_ids: string[];
  referenced_artifact_ids: string[];
};

export type ReportIndex = {
  report_count: number;
  summary: {
    validation_priority_reports: number;
    evidence_coverage_reports: number;
    campaign_reports: number;
    constraint_reports: number;
    evidence_import_count: number;
    uncovered_artifact_count: number;
    analyst_state_status_distribution: Record<string, number>;
  };
  reports: ReportIndexEntry[];
};

export function ReportIndexWorkspace({ index }: { index: ReportIndex }) {
  const featuredReports = index.reports.filter((report) =>
    ["validation_priority", "evidence_coverage"].includes(report.report_type)
  );
  const campaignReports = index.reports.filter(
    (report) => report.report_type === "campaign"
  );
  const constraintReports = index.reports.filter(
    (report) => report.report_type === "constraint"
  );

  return (
    <main className="app-shell report-shell">
      <header className="network-header">
        <div className="network-header__inner">
          <div className="investigation-header__links">
            <Link className="back-link" href="/">
              Back to dashboard
            </Link>
            <Link className="back-link" href="/validation">
              Validation queue
            </Link>
            <Link className="back-link" href="/evidence">
              Evidence matching
            </Link>
            <Link className="back-link" href="/campaigns">
              Campaigns
            </Link>
          </div>
          <p className="eyebrow">Report Builder</p>
          <h1>Deterministic Markdown and JSON analyst reports</h1>
          <p className="lede">
            Local reports summarize validation priorities, evidence coverage,
            campaigns, and top constraints without PDF generation, external
            sources, or false evidence claims.
          </p>
        </div>
      </header>

      <section className="report-main" aria-label="Report index">
        <section className="report-summary-grid">
          <ReportMetric label="Reports" value={index.report_count} />
          <ReportMetric
            label="Campaign Reports"
            value={index.summary.campaign_reports}
          />
          <ReportMetric
            label="Constraint Reports"
            value={index.summary.constraint_reports}
          />
          <ReportMetric
            label="Imported Evidence"
            value={index.summary.evidence_import_count}
          />
          <ReportMetric
            label="Uncovered Artifacts"
            value={index.summary.uncovered_artifact_count}
          />
          <ReportMetric
            label="Open State Records"
            value={index.summary.analyst_state_status_distribution.open ?? 0}
          />
        </section>

        <section className="report-intro">
          <div>
            <p className="section-kicker">Export posture</p>
            <h2>Reports are generated artifacts, not decisions.</h2>
          </div>
          <p>
            Each report clearly labels hypotheses, evidence gaps, artifact
            needs, validation burden, analyst state, uncovered evidence, next
            validation actions, and limitations. Markdown and JSON files live in
            `data/exports/reports/` for local review.
          </p>
        </section>

        <ReportSection reports={featuredReports} title="Portfolio Reports" />
        <ReportSection reports={campaignReports} title="Campaign Reports" />
        <ReportSection reports={constraintReports} title="Top Constraint Reports" />
      </section>
    </main>
  );
}

function ReportSection({
  reports,
  title
}: {
  reports: ReportIndexEntry[];
  title: string;
}) {
  return (
    <section className="report-section">
      <div className="report-section__header">
        <h2>{title}</h2>
        <span>{reports.length} report{reports.length === 1 ? "" : "s"}</span>
      </div>
      <div className="report-grid">
        {reports.map((report) => (
          <ReportCard key={report.report_id} report={report} />
        ))}
      </div>
    </section>
  );
}

function ReportCard({ report }: { report: ReportIndexEntry }) {
  const firstConstraint = report.referenced_constraint_ids[0];
  return (
    <article className="report-card">
      <span>{report.report_type.replaceAll("_", " ")}</span>
      <h3>{report.title}</h3>
      <dl>
        <Row label="Markdown" value={report.markdown_path} />
        <Row label="JSON" value={report.json_path} />
        <Row
          label="Constraints"
          value={report.referenced_constraint_ids.length.toString()}
        />
        <Row label="Artifacts" value={report.referenced_artifact_ids.length.toString()} />
      </dl>
      <div className="validation-task-card__links">
        {firstConstraint ? (
          <Link href={`/constraints/${firstConstraint}`}>First constraint</Link>
        ) : null}
        {firstConstraint ? (
          <Link href={`/network?focus=${firstConstraint}`}>Network focus</Link>
        ) : null}
        <Link href="/validation">Validation</Link>
        <Link href="/evidence">Evidence</Link>
      </div>
    </article>
  );
}

function ReportMetric({ label, value }: { label: string; value: number | string }) {
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
