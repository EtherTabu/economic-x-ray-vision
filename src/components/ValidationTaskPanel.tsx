import Link from "next/link";
import type { ValidationTaskPortfolio } from "@/lib/validationTasks";

type ValidationTaskPanelProps = {
  portfolio: ValidationTaskPortfolio;
};

export function ValidationTaskPanel({ portfolio }: ValidationTaskPanelProps) {
  const { summary, tasks } = portfolio;
  const topTasks = summary.top_validation_tasks.slice(0, 5);

  return (
    <section className="validation-panel" aria-label="Validation task workflow">
      <div className="validation-panel__header">
        <div>
          <p className="section-kicker">V14.0 validation task workflow</p>
          <h2>Generated analyst queue for weak evidence and source gaps.</h2>
        </div>
        <div className="validation-panel__actions">
          <Link className="details-link" href="/validation">
            Open Validation Queue
          </Link>
        </div>
      </div>

      <div className="validation-panel__metrics">
        <Metric label="Total Tasks" value={summary.total_tasks} />
        <Metric label="Open" value={summary.open_tasks} />
        <Metric label="Blocked" value={summary.blocked_tasks} />
        <Metric label="Review-Ready" value={summary.review_ready_tasks} />
        <Metric label="High Priority" value={summary.high_priority_tasks} />
        <Metric
          label="Primary Docs"
          value={summary.primary_document_needed_tasks}
        />
        <Metric label="Source URLs" value={summary.source_url_needed_tasks} />
        <Metric
          label="Local Observations"
          value={summary.local_observation_needed_tasks}
        />
      </div>

      <div className="validation-panel__body">
        <div className="validation-task-list">
          <h3>Top validation tasks</h3>
          {topTasks.map((task) => (
            <article className="validation-task-card" key={task.task_id}>
              <div className="validation-task-card__topline">
                <span className={`severity-chip severity-chip--${task.severity.toLowerCase()}`}>
                  {task.severity}
                </span>
                <span className={`status-chip status-chip--${task.status}`}>
                  {task.status.replaceAll("_", " ")}
                </span>
                <strong>{task.priority_score.toFixed(1)}</strong>
              </div>
              <h4>{task.task_title}</h4>
              <p>{task.constraint_title}</p>
              <small>{task.industry}</small>
              <p>{task.recommended_action}</p>
              <div className="validation-task-card__links">
                <Link href={task.investigation_route}>Investigation</Link>
                <Link href={task.network_route}>Network focus</Link>
              </div>
            </article>
          ))}
        </div>

        <article className="validation-task-preview">
          <span>Weakest defensibility target</span>
          {summary.weakest_defensibility_tasks[0] ? (
            <>
              <h3>{summary.weakest_defensibility_tasks[0].constraint_title}</h3>
              <p>{summary.weakest_defensibility_tasks[0].task_summary}</p>
              <dl>
                <Row
                  label="Defensibility"
                  value={`${summary.weakest_defensibility_tasks[0].defensibility_score?.toFixed(1) ?? "n/a"}/10`}
                />
                <Row
                  label="Expected artifact"
                  value={summary.weakest_defensibility_tasks[0].expected_artifact}
                />
                <Row
                  label="Blocking reason"
                  value={summary.weakest_defensibility_tasks[0].blocking_reason}
                />
              </dl>
            </>
          ) : (
            <p>No weak-defensibility tasks are currently generated.</p>
          )}
        </article>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">No validation tasks generated.</div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="validation-metric">
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
