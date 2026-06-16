import Link from "next/link";
import type { ValidationTriagePortfolio } from "@/lib/validationTriage";

type ValidationTriagePanelProps = {
  triage: ValidationTriagePortfolio;
};

export function ValidationTriagePanel({ triage }: ValidationTriagePanelProps) {
  return (
    <section className="validation-triage-panel" aria-label="Validation triage">
      <div className="validation-triage-panel__header">
        <div>
          <p className="section-kicker">Validation triage</p>
          <h2>Top validation actions after clustering raw tasks.</h2>
          <p>
            The triage layer compresses generated tasks by constraint, clusters
            related blockers, and picks one next-best validation action per
            constraint.
          </p>
        </div>
        <div className="validation-triage-metrics">
          <Metric label="Raw Tasks" value={triage.summary.total_tasks_compressed} />
          <Metric label="Constraints" value={triage.summary.constraints_with_tasks} />
          <Metric label="Top Queue" value={triage.summary.top_queue_count} />
          <Metric
            label="Critical After Triage"
            value={triage.summary.recalibrated_critical_count}
          />
        </div>
      </div>

      <div className="validation-triage-panel__body">
        <div className="validation-triage-queue">
          <h3>Top 10 validation queue</h3>
          {triage.topValidationQueue.map((item, index) => (
            <article className="validation-triage-card" key={item.constraint_id}>
              <div className="validation-triage-card__rank">
                <span>{index + 1}</span>
                <strong>{item.validation_burden_score.toFixed(1)}</strong>
              </div>
              <div>
                <div className="validation-task-card__topline">
                  <span
                    className={`severity-chip severity-chip--${item.recalibrated_severity.toLowerCase()}`}
                  >
                    {item.recalibrated_severity}
                  </span>
                  <span className="status-chip status-chip--open">
                    {item.next_best_action.cluster_type}
                  </span>
                </div>
                <h4>{item.next_best_action.action_title}</h4>
                <p>{item.next_best_action.rationale}</p>
                <small>
                  {item.constraint_title} | {item.industry} | {item.task_count} raw tasks
                </small>
                <div className="validation-task-card__links">
                  <Link href={item.investigation_route}>Investigation</Link>
                  <Link href={item.network_route}>Network focus</Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="validation-triage-explain">
          <h3>What changed</h3>
          <dl>
            <Row
              label="Original critical tasks"
              value={String(triage.summary.original_critical_tasks)}
            />
            <Row
              label="Recalibrated critical constraints"
              value={String(triage.summary.recalibrated_critical_count)}
            />
            <Row
              label="Average burden"
              value={triage.summary.average_validation_burden_score.toFixed(1)}
            />
            <Row
              label="Highest burden"
              value={triage.summary.highest_burden_constraint}
            />
          </dl>
          <h3>Cluster mix</h3>
          <div className="validation-triage-clusters">
            {Object.entries(triage.summary.cluster_distribution).map(
              ([cluster, count]) => (
                <div key={cluster}>
                  <span>{cluster}</span>
                  <strong>{count}</strong>
                </div>
              )
            )}
          </div>
        </aside>
      </div>
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
