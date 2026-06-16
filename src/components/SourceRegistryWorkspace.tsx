"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  SourceWorkspace,
  SourceWorkspaceRecord
} from "@/lib/sourceWorkspace";

type SourceRegistryWorkspaceProps = {
  workspace: SourceWorkspace;
};

type FilterValue = "All";
type PrimaryFilter = "All" | "Primary document needed";
type ProvenanceFilter = "All" | "Thin dependencies" | "Workable or better";

export function SourceRegistryWorkspace({
  workspace
}: SourceRegistryWorkspaceProps) {
  const [citationStatus, setCitationStatus] = useState<string | FilterValue>("All");
  const [provenance, setProvenance] = useState<ProvenanceFilter>("All");
  const [primaryNeed, setPrimaryNeed] = useState<PrimaryFilter>("All");
  const [focusedSourceId, setFocusedSourceId] = useState(
    workspace.records[0]?.source_id ?? ""
  );
  const [urlReady, setUrlReady] = useState(false);
  const citationStatuses = useMemo(
    () => unique(workspace.records.map((source) => source.citation_status)),
    [workspace.records]
  );
  const filteredSources = useMemo(
    () =>
      workspace.records.filter(
        (source) =>
          (citationStatus === "All" ||
            source.citation_status === citationStatus) &&
          (provenance === "All" ||
            (provenance === "Thin dependencies" &&
              source.weakest_provenance_status === "thin") ||
            (provenance === "Workable or better" &&
              source.weakest_provenance_status !== "thin")) &&
          (primaryNeed === "All" || source.primary_document_needed)
      ),
    [citationStatus, primaryNeed, provenance, workspace.records]
  );
  const focusedSource =
    workspace.records.find((source) => source.source_id === focusedSourceId) ??
    filteredSources[0] ??
    workspace.records[0];

  useEffect(() => {
    const applyUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setCitationStatus(params.get("citation") ?? "All");
      setProvenance((params.get("provenance") as ProvenanceFilter | null) ?? "All");
      setPrimaryNeed((params.get("primary") as PrimaryFilter | null) ?? "All");
      setFocusedSourceId(params.get("source") ?? workspace.records[0]?.source_id ?? "");
      setUrlReady(true);
    };

    applyUrl();
    window.addEventListener("popstate", applyUrl);
    return () => window.removeEventListener("popstate", applyUrl);
  }, [workspace.records]);

  useEffect(() => {
    if (!urlReady) return;

    const params = new URLSearchParams();
    if (citationStatus !== "All") params.set("citation", citationStatus);
    if (provenance !== "All") params.set("provenance", provenance);
    if (primaryNeed !== "All") params.set("primary", primaryNeed);
    if (focusedSourceId) params.set("source", focusedSourceId);

    const nextUrl = params.toString() ? `/sources?${params.toString()}` : "/sources";
    window.history.replaceState(null, "", nextUrl);
  }, [citationStatus, focusedSourceId, primaryNeed, provenance, urlReady]);

  return (
    <main className="app-shell source-workspace-shell">
      <header className="validation-header">
        <div className="validation-header__inner">
          <Link className="back-link" href="/">
            Back to dashboard
          </Link>
          <p className="eyebrow">Source Registry Workspace</p>
          <h1>Inspect source quality, provenance gaps, and constraint dependencies</h1>
          <p className="lede">
            A local-first evidence workspace for identifying weak sources,
            primary-document needs, missing URLs, and the constraints that depend
            on each source locator.
          </p>
        </div>
      </header>

      <section className="source-workspace-main" aria-label="Source workspace">
        <section className="source-workspace-summary">
          <Metric label="Sources" value={workspace.summary.source_count} />
          <Metric label="Weak Sources" value={workspace.summary.weak_source_count} />
          <Metric
            label="Need Primary Docs"
            value={workspace.summary.primary_document_needed_count}
          />
          <Metric label="Need URLs" value={workspace.summary.needs_url_count} />
          <Metric
            label="Local Observation"
            value={workspace.summary.local_observation_needed_count}
          />
          <Metric
            label="Average Trust"
            value={workspace.summary.average_trust_weight.toFixed(1)}
          />
        </section>

        <section className="source-workspace-lead">
          <div>
            <p className="section-kicker">Registry health</p>
            <h2>Weakest source</h2>
            <p>{workspace.summary.weakest_source}</p>
          </div>
          <div>
            <p className="section-kicker">Most reused source</p>
            <h2>{workspace.summary.most_reused_source}</h2>
            <p>
              Average dependency count{" "}
              {workspace.summary.average_dependency_count.toFixed(1)} per source.
            </p>
          </div>
        </section>

        <section className="source-workspace-controls" aria-label="Source filters">
          <Select
            label="Citation Status"
            value={citationStatus}
            values={citationStatuses}
            onChange={setCitationStatus}
          />
          <Select
            label="Provenance Weakness"
            value={provenance}
            values={["Thin dependencies", "Workable or better"]}
            onChange={(value) => setProvenance(value as ProvenanceFilter)}
          />
          <Select
            label="Primary Documents"
            value={primaryNeed}
            values={["Primary document needed"]}
            onChange={(value) => setPrimaryNeed(value as PrimaryFilter)}
          />
          <button
            className="details-button"
            type="button"
            onClick={() => {
              setCitationStatus("All");
              setProvenance("All");
              setPrimaryNeed("All");
            }}
          >
            Reset source view
          </button>
        </section>

        <section className="source-workspace-grid">
          <div className="source-registry-list">
            <div className="source-registry-list__header">
              <h2>Source records</h2>
              <span>{filteredSources.length} visible</span>
            </div>
            {filteredSources.map((source) => (
              <button
                className={
                  source.source_id === focusedSource?.source_id
                    ? "source-registry-item source-registry-item--active"
                    : "source-registry-item"
                }
                key={source.source_id}
                type="button"
                onClick={() => setFocusedSourceId(source.source_id)}
              >
                <span>{source.citation_status.replaceAll("-", " ")}</span>
                <strong>{source.title}</strong>
                <small>
                  Trust {source.trust_weight.toFixed(1)} |{" "}
                  {source.dependency_count} constraint
                  {source.dependency_count === 1 ? "" : "s"} | weakest{" "}
                  {source.weakest_defensibility_score.toFixed(1)}
                </small>
              </button>
            ))}
          </div>

          {focusedSource ? <SourceDetail source={focusedSource} /> : null}
        </section>
      </section>
    </main>
  );
}

function SourceDetail({ source }: { source: SourceWorkspaceRecord }) {
  return (
    <article className="source-detail-panel">
      <div className="source-detail-panel__header">
        <span>{source.source_id}</span>
        <h2>{source.title}</h2>
        <p>{source.verification_need}</p>
      </div>

      <div className="source-detail-metrics">
        <Metric label="Trust" value={source.trust_weight.toFixed(1)} />
        <Metric
          label="Weakest Defensibility"
          value={source.weakest_defensibility_score.toFixed(1)}
        />
        <Metric label="Dependencies" value={source.dependency_count} />
        <Metric label="Weak Dependencies" value={source.weak_dependency_count} />
      </div>

      <dl className="source-detail-list">
        <Row label="Publisher" value={source.publisher} />
        <Row label="Source Type" value={source.source_type} />
        <Row label="Citation Status" value={source.citation_status} />
        <Row label="Provenance Level" value={source.provenance_level} />
        <Row
          label="Weakest Dependent Provenance"
          value={source.weakest_provenance_status}
        />
      </dl>

      <section className="source-detail-section">
        <h3>Dependent constraints</h3>
        <div className="source-dependency-list">
          {source.constraint_dependencies.map((dependency) => (
            <div className="source-dependency-card" key={dependency.constraint_id}>
              <div>
                <span>{dependency.industry}</span>
                <strong>{dependency.constraint_title}</strong>
                <p>{dependency.recommended_source_upgrade}</p>
              </div>
              <div className="source-dependency-card__scores">
                <span>Def {dependency.defensibility_score.toFixed(1)}</span>
                <span>Val {dependency.validation_confidence.toFixed(1)}</span>
                <span>{dependency.provenance_status}</span>
              </div>
              <div className="validation-task-card__links">
                <Link href={dependency.investigation_route}>Investigation</Link>
                <Link href={dependency.network_route}>Network focus</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="source-detail-section">
        <h3>Linked evidence packets</h3>
        {source.evidence_packet_links.length > 0 ? (
          <div className="source-packet-list">
            {source.evidence_packet_links.map((packet) => (
              <div className="source-packet-card" key={packet.packet_id}>
                <span>Queue #{packet.triage_rank}</span>
                <strong>{packet.constraint_title}</strong>
                <p>
                  {packet.request_category} packet | {packet.expected_artifact}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="source-empty-note">
            No top-queue evidence packet currently depends on this source.
          </p>
        )}
      </section>
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
            {option.replaceAll("-", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="source-workspace-metric">
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
