"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ValidationEvidencePacketPanel } from "@/components/ValidationEvidencePacketPanel";
import { ValidationTriagePanel } from "@/components/ValidationTriagePanel";
import type { ValidationEvidencePacketPortfolio } from "@/lib/validationEvidencePackets";
import type {
  ValidationTask,
  ValidationTaskPortfolio,
  ValidationTaskSeverity,
  ValidationTaskStatus,
  ValidationTaskType
} from "@/lib/validationTasks";
import type { ValidationTriagePortfolio } from "@/lib/validationTriage";

type ValidationWorkbenchProps = {
  portfolio: ValidationTaskPortfolio;
  triage: ValidationTriagePortfolio;
  evidencePackets: ValidationEvidencePacketPortfolio;
};

type FilterValue = "All";

export function ValidationWorkbench({
  evidencePackets,
  portfolio,
  triage
}: ValidationWorkbenchProps) {
  const [taskType, setTaskType] = useState<ValidationTaskType | FilterValue>("All");
  const [industry, setIndustry] = useState<string | FilterValue>("All");
  const [severity, setSeverity] = useState<ValidationTaskSeverity | FilterValue>(
    "All"
  );
  const [status, setStatus] = useState<ValidationTaskStatus | FilterValue>("All");
  const [urlReady, setUrlReady] = useState(false);

  const taskTypes = useMemo(
    () => unique(portfolio.tasks.map((task) => task.task_type)),
    [portfolio.tasks]
  );
  const industries = useMemo(
    () => unique(portfolio.tasks.map((task) => task.industry)),
    [portfolio.tasks]
  );
  const filteredTasks = useMemo(
    () =>
      portfolio.tasks.filter(
        (task) =>
          (taskType === "All" || task.task_type === taskType) &&
          (industry === "All" || task.industry === industry) &&
          (severity === "All" || task.severity === severity) &&
          (status === "All" || task.status === status)
      ),
    [industry, portfolio.tasks, severity, status, taskType]
  );
  const sourceUpgradeTasks = filteredTasks.filter((task) =>
    [
      "primary_document_needed",
      "source_url_needed",
      "local_observation_needed"
    ].includes(task.task_type)
  );
  const primaryDocumentTasks = filteredTasks.filter(
    (task) => task.task_type === "primary_document_needed"
  );
  const localObservationTasks = filteredTasks.filter(
    (task) => task.task_type === "local_observation_needed"
  );
  const highOpportunityWeakEvidenceTasks = filteredTasks.filter(
    (task) => task.task_type === "high_opportunity_weak_evidence"
  );

  useEffect(() => {
    const applyUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setTaskType((params.get("type") as ValidationTaskType | null) ?? "All");
      setIndustry(params.get("industry") ?? "All");
      setSeverity((params.get("severity") as ValidationTaskSeverity | null) ?? "All");
      setStatus((params.get("status") as ValidationTaskStatus | null) ?? "All");
      setUrlReady(true);
    };

    applyUrl();
    window.addEventListener("popstate", applyUrl);
    return () => window.removeEventListener("popstate", applyUrl);
  }, []);

  useEffect(() => {
    if (!urlReady) return;

    const params = new URLSearchParams();
    if (taskType !== "All") params.set("type", taskType);
    if (industry !== "All") params.set("industry", industry);
    if (severity !== "All") params.set("severity", severity);
    if (status !== "All") params.set("status", status);

    const nextUrl = params.toString()
      ? `/validation?${params.toString()}`
      : "/validation";
    window.history.replaceState(null, "", nextUrl);
  }, [industry, severity, status, taskType, urlReady]);

  return (
    <main className="app-shell validation-shell">
      <header className="validation-header">
        <div className="validation-header__inner">
          <Link className="back-link" href="/">
            Back to dashboard
          </Link>
          <p className="eyebrow">Validation Task Workflow</p>
          <h1>Analyst queue for evidence gaps, source upgrades, and validation blockers</h1>
          <p className="lede">
            A generated local workbench that turns thin provenance, weak claim
            support, evidence gaps, and validation-dependent interventions into
            a prioritized analyst queue.
          </p>
        </div>
      </header>

      <section className="validation-main" aria-label="Validation workbench">
        <ValidationTriagePanel triage={triage} />
        <ValidationEvidencePacketPanel portfolio={evidencePackets} />

        <section className="validation-summary-grid">
          <Metric label="Tasks" value={portfolio.summary.total_tasks} />
          <Metric label="Open" value={portfolio.summary.open_tasks} />
          <Metric label="Blocked" value={portfolio.summary.blocked_tasks} />
          <Metric label="Review-Ready" value={portfolio.summary.review_ready_tasks} />
          <Metric label="Visible" value={filteredTasks.length} />
          <Metric label="High Priority" value={portfolio.summary.high_priority_tasks} />
        </section>

        <section className="validation-filter-panel" aria-label="Validation filters">
          <div>
            <p className="section-kicker">Queue controls</p>
            <h2>Filter generated tasks by validation need.</h2>
          </div>
          <div className="validation-filter-grid">
            <Select
              label="Task Type"
              value={taskType}
              values={taskTypes}
              onChange={(value) => setTaskType(value as ValidationTaskType | "All")}
            />
            <Select
              label="Industry"
              value={industry}
              values={industries}
              onChange={setIndustry}
            />
            <Select
              label="Severity"
              value={severity}
              values={["Critical", "High", "Moderate", "Low"]}
              onChange={(value) =>
                setSeverity(value as ValidationTaskSeverity | "All")
              }
            />
            <Select
              label="Status"
              value={status}
              values={["open", "blocked", "review_ready"]}
              onChange={(value) => setStatus(value as ValidationTaskStatus | "All")}
            />
          </div>
          <button
            className="details-button"
            type="button"
            onClick={() => {
              setTaskType("All");
              setIndustry("All");
              setSeverity("All");
              setStatus("All");
            }}
          >
            Reset validation view
          </button>
        </section>

        <TaskSection
          tasks={filteredTasks.slice(0, 10)}
          title="Top Priority Validation Tasks"
        />
        <TaskSection tasks={sourceUpgradeTasks.slice(0, 8)} title="Source Upgrade Tasks" />
        <TaskSection
          tasks={primaryDocumentTasks.slice(0, 8)}
          title="Primary Document Tasks"
        />
        <TaskSection
          tasks={localObservationTasks.slice(0, 8)}
          title="Local Observation Tasks"
        />
        <TaskSection
          tasks={highOpportunityWeakEvidenceTasks.slice(0, 8)}
          title="High-Opportunity Weak-Evidence Tasks"
        />
      </section>
    </main>
  );
}

function TaskSection({ tasks, title }: { tasks: ValidationTask[]; title: string }) {
  return (
    <section className="validation-section">
      <h2>{title}</h2>
      {tasks.length > 0 ? (
        <div className="validation-workbench-grid">
          {tasks.map((task) => (
            <TaskCard key={task.task_id} task={task} />
          ))}
        </div>
      ) : (
        <div className="empty-state">No tasks match this section.</div>
      )}
    </section>
  );
}

function TaskCard({ task }: { task: ValidationTask }) {
  return (
    <article className="validation-task-card">
      <div className="validation-task-card__topline">
        <span className={`severity-chip severity-chip--${task.severity.toLowerCase()}`}>
          {task.severity}
        </span>
        <span className={`status-chip status-chip--${task.status}`}>
          {task.status.replaceAll("_", " ")}
        </span>
        <strong>{task.priority_score.toFixed(1)}</strong>
      </div>
      <h3>{task.task_title}</h3>
      <p>{task.task_summary}</p>
      <dl>
        <Row label="Constraint" value={task.constraint_title} />
        <Row label="Industry" value={task.industry} />
        <Row label="Recommended action" value={task.recommended_action} />
        <Row label="Expected artifact" value={task.expected_artifact} />
        <Row label="Blocking reason" value={task.blocking_reason} />
      </dl>
      <div className="validation-task-card__links">
        <Link href={task.investigation_route}>Investigation</Link>
        <Link href={task.network_route}>Network focus</Link>
      </div>
    </article>
  );
}

function Select({
  label,
  onChange,
  value,
  values
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  values: string[];
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="All">All</option>
        {values.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
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

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}
