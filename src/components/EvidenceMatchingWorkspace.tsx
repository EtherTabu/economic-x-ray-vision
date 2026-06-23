import Link from "next/link";

export type EvidenceArtifactCoverageStatus =
  | "matched"
  | "candidate"
  | "blocked"
  | "uncovered";

export type EvidenceArtifactCoverageRecord = {
  artifact_id: string;
  constraint_id: string;
  constraint_title: string;
  artifact_type: string;
  artifact_title: string;
  why_needed: string;
  priority: number;
  confidence_impact: number;
  related_packet_ids: string[];
  related_source_ids: string[];
  generated_artifact_status: string;
  coverage_status: EvidenceArtifactCoverageStatus;
  match_count: number;
  candidate_match_count: number;
  blocked_match_count: number;
  review_ready_match_count: number;
  rejected_match_count: number;
  match_ids: string[];
  next_import_action: string;
  investigation_route: string;
  validation_route: string;
  source_route: string;
  network_route: string;
};

export type EvidencePacketCoverageRecord = {
  packet_id: string;
  constraint_id: string;
  constraint_title: string;
  triage_rank: number;
  expected_artifact: string;
  artifact_need_count: number;
  matched_artifact_count: number;
  candidate_artifact_count: number;
  blocked_artifact_count: number;
  uncovered_artifact_count: number;
  coverage_status: string;
  next_import_action: string;
};

export type EvidenceArtifactMatchWorkspace = {
  summary: {
    evidence_import_count: number;
    artifact_need_count: number;
    match_count: number;
    direct_match_count: number;
    indirect_candidate_match_count: number;
    matched_artifact_count: number;
    candidate_artifact_count: number;
    blocked_artifact_count: number;
    uncovered_artifact_count: number;
    review_ready_evidence_count: number;
    rejected_evidence_count: number;
    blocked_evidence_count: number;
    coverage_by_artifact_type: Record<
      string,
      {
        total: number;
        matched: number;
        candidate: number;
        blocked: number;
        uncovered: number;
      }
    >;
    top_validation_packet_artifact_needs: number;
    top_validation_packet_uncovered_artifacts: number;
  };
  next_import_actions: string[];
  top_validation_packet_coverage: EvidencePacketCoverageRecord[];
  top_uncovered_artifact_needs: EvidenceArtifactCoverageRecord[];
  artifact_coverage: EvidenceArtifactCoverageRecord[];
};

export function EvidenceMatchingWorkspace({
  workspace
}: {
  workspace: EvidenceArtifactMatchWorkspace;
}) {
  const summary = workspace.summary;
  const hasImports = summary.evidence_import_count > 0;

  return (
    <main className="app-shell evidence-workspace-shell">
      <header className="validation-header">
        <div className="validation-header__inner">
          <Link className="back-link" href="/">
            Back to dashboard
          </Link>
          <p className="eyebrow">Evidence Matching Workspace</p>
          <h1>Match imported evidence metadata to generated artifact needs</h1>
          <p className="lede">
            A read-only local workspace for seeing which artifact needs have
            explicit evidence matches, candidate coverage, blockers, or no
            imported evidence yet.
          </p>
        </div>
      </header>

      <section className="evidence-workspace-main" aria-label="Evidence matching workspace">
        <section className="evidence-workspace-summary">
          <Metric label="Imported Evidence" value={summary.evidence_import_count} />
          <Metric label="Artifact Needs" value={summary.artifact_need_count} />
          <Metric label="Matched Artifacts" value={summary.matched_artifact_count} />
          <Metric
            label="Candidate Coverage"
            value={summary.candidate_artifact_count}
          />
          <Metric label="Blocked Evidence" value={summary.blocked_evidence_count} />
          <Metric
            label="Review-Ready Evidence"
            value={summary.review_ready_evidence_count}
          />
          <Metric label="Rejected Evidence" value={summary.rejected_evidence_count} />
          <Metric
            label="Uncovered Artifacts"
            value={summary.uncovered_artifact_count}
          />
        </section>

        <section className="evidence-zero-state">
          <div>
            <p className="section-kicker">
              {hasImports ? "Coverage posture" : "Zero-import state"}
            </p>
            <h2>
              {hasImports
                ? "Imported evidence is visible, but artifact statuses remain generated."
                : "No evidence imports exist yet. All artifact needs remain uncovered."}
            </h2>
            <p>
              Matching is deterministic: explicit artifact IDs come first, then
              weaker constraint or source candidate links. Rejected evidence
              never counts as coverage, and no generated artifact status is
              changed by this workspace.
            </p>
          </div>
          <div className="evidence-zero-state__actions">
            <Link className="details-button" href="/validation">
              Open validation queue
            </Link>
            <Link className="details-button" href="/sources">
              Open source registry
            </Link>
            <Link className="details-button" href="/campaigns">
              Open campaigns
            </Link>
          </div>
        </section>

        <section className="evidence-workspace-section">
          <div>
            <p className="section-kicker">Next import actions</p>
            <h2>What should be attached first</h2>
          </div>
          <div className="evidence-action-list">
            {workspace.next_import_actions.map((action) => (
              <div className="evidence-action-card" key={action}>
                <span>Next action</span>
                <strong>{action}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="evidence-workspace-section">
          <div>
            <p className="section-kicker">Top validation packets</p>
            <h2>Packet artifact coverage</h2>
          </div>
          <div className="evidence-packet-coverage-grid">
            {workspace.top_validation_packet_coverage.map((packet) => (
              <article className="evidence-packet-coverage-card" key={packet.packet_id}>
                <span>Queue #{packet.triage_rank}</span>
                <h3>{packet.constraint_title}</h3>
                <p>{packet.expected_artifact}</p>
                <div className="evidence-chip-row">
                  <Chip label="Matched" value={packet.matched_artifact_count} />
                  <Chip label="Candidate" value={packet.candidate_artifact_count} />
                  <Chip label="Blocked" value={packet.blocked_artifact_count} />
                  <Chip label="Uncovered" value={packet.uncovered_artifact_count} />
                </div>
                <p>{packet.next_import_action}</p>
                <div className="validation-task-card__links">
                  <Link href={`/constraints/${packet.constraint_id}`}>Investigation</Link>
                  <Link href={`/network?focus=${packet.constraint_id}`}>Network focus</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="evidence-workspace-section">
          <div>
            <p className="section-kicker">Coverage by artifact type</p>
            <h2>Where evidence is still missing</h2>
          </div>
          <div className="evidence-type-grid">
            {Object.entries(summary.coverage_by_artifact_type).map(([type, coverage]) => (
              <article className="evidence-type-card" key={type}>
                <span>{type.replaceAll("_", " ")}</span>
                <strong>{coverage.total}</strong>
                <div className="evidence-chip-row">
                  <Chip label="Matched" value={coverage.matched} />
                  <Chip label="Candidate" value={coverage.candidate} />
                  <Chip label="Blocked" value={coverage.blocked} />
                  <Chip label="Uncovered" value={coverage.uncovered} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="evidence-workspace-section">
          <div>
            <p className="section-kicker">Highest-priority uncovered needs</p>
            <h2>Artifacts still waiting on imported evidence</h2>
          </div>
          <div className="evidence-uncovered-grid">
            {workspace.top_uncovered_artifact_needs.map((artifact) => (
              <ArtifactNeedCard artifact={artifact} key={artifact.artifact_id} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function ArtifactNeedCard({
  artifact
}: {
  artifact: EvidenceArtifactCoverageRecord;
}) {
  return (
    <article className="evidence-uncovered-card">
      <div className="evidence-uncovered-card__header">
        <span>{artifact.artifact_type.replaceAll("_", " ")}</span>
        <strong>{artifact.priority.toFixed(1)}</strong>
      </div>
      <h3>{artifact.constraint_title}</h3>
      <p>{artifact.artifact_title}</p>
      <dl>
        <Row label="Why needed" value={artifact.why_needed} />
        <Row label="Status" value={artifact.coverage_status} />
        <Row label="Next action" value={artifact.next_import_action} />
      </dl>
      <div className="validation-task-card__links">
        <Link href={artifact.investigation_route}>Investigation</Link>
        <Link href={artifact.validation_route}>Validation</Link>
        <Link href={artifact.source_route}>Sources</Link>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="evidence-workspace-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <span>
      {label}: {value}
    </span>
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
