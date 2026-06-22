import Link from "next/link";
import type { EvidenceArtifactLibrary } from "@/lib/evidenceArtifacts";
import type { ValidationEvidencePacketPortfolio } from "@/lib/validationEvidencePackets";

type ValidationEvidencePacketPanelProps = {
  portfolio: ValidationEvidencePacketPortfolio;
  artifactLibrary?: EvidenceArtifactLibrary;
};

export function ValidationEvidencePacketPanel({
  artifactLibrary,
  portfolio
}: ValidationEvidencePacketPanelProps) {
  return (
    <section
      className="validation-packet-panel"
      aria-label="Validation evidence packets"
    >
      <div className="validation-packet-panel__header">
        <div>
          <p className="section-kicker">Evidence request packets</p>
          <h2>What an analyst should collect for the top validation actions.</h2>
          <p>
            Each packet turns one triaged action into a concrete artifact request
            with pass/fail criteria and an expected confidence impact.
          </p>
        </div>
        <div className="validation-triage-metrics">
          <Metric label="Packets" value={portfolio.summary.packet_count} />
          <Metric
            label="Top Queue Coverage"
            value={`${portfolio.summary.top_queue_coverage}%`}
          />
          <Metric
            label="High Impact"
            value={portfolio.summary.high_impact_packets}
          />
          <Metric
            label="Avg Lift"
            value={`+${portfolio.summary.average_expected_score_lift.toFixed(1)}`}
          />
        </div>
      </div>

      <div className="validation-packet-grid">
        {portfolio.packets.map((packet) => {
          const artifactNeeds =
            artifactLibrary?.artifacts
              .filter((artifact) =>
                artifact.related_packet_ids.includes(packet.packet_id)
              )
              .slice(0, 2) ?? [];

          return (
            <article className="validation-packet-card" key={packet.packet_id}>
              <div className="validation-packet-card__topline">
                <span>#{packet.triage_rank}</span>
                <span className="status-chip status-chip--open">
                  {packet.request_category}
                </span>
                <strong>
                  +{packet.expected_confidence_impact.estimated_score_lift.toFixed(1)}
                </strong>
              </div>
              <h3>{packet.constraint_title}</h3>
              <p>{packet.evidence_needed}</p>
              <dl>
                <Row label="Artifact" value={packet.expected_artifact} />
                <Row label="Decision use" value={packet.decision_use} />
              </dl>
              <div className="validation-packet-checks">
                <Checklist title="Artifact checklist" items={packet.artifact_checklist} />
                <Checklist title="Pass criteria" items={packet.pass_criteria} />
                <Checklist title="Fail criteria" items={packet.fail_criteria} />
              </div>
              {artifactNeeds.length > 0 ? (
                <div className="artifact-need-list">
                  <h4>Artifact needs</h4>
                  {artifactNeeds.map((artifact) => (
                    <div className="artifact-need-row" key={artifact.artifact_id}>
                      <span>{artifact.artifact_type.replaceAll("_", " ")}</span>
                      <strong>{artifact.artifact_title}</strong>
                      <small>
                        Priority {artifact.priority.toFixed(1)} |{" "}
                        {artifact.status.replaceAll("_", " ")}
                      </small>
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="validation-packet-note">
                {packet.expected_confidence_impact.explanation}
              </p>
              <div className="validation-task-card__links">
                <Link href={packet.investigation_route}>Investigation</Link>
                <Link href={packet.network_route}>Network focus</Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Checklist({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <h4>{title}</h4>
      <ul>
        {items.slice(0, 3).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Metric({ label, value }: { label: number | string; value: number | string }) {
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
