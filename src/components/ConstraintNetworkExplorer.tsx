import Link from "next/link";
import type {
  ConstraintNetwork,
  ConstraintNetworkCluster,
  ConstraintNetworkNode
} from "@/lib/constraintNetwork";

type ConstraintNetworkExplorerProps = {
  network: ConstraintNetwork;
};

export function ConstraintNetworkExplorer({ network }: ConstraintNetworkExplorerProps) {
  const bridgeConstraintIds = new Set(
    network.bridge_constraints.map((node) => node.id)
  );
  const visibleConstraintNodes = network.top_connected_constraints.slice(0, 6);
  const archetypeNodes = network.top_connected_archetypes.slice(0, 6);

  return (
    <main className="app-shell network-shell">
      <header className="network-header">
        <div className="network-header__inner">
          <Link className="back-link" href="/">
            Back to dashboard
          </Link>
          <p className="eyebrow">Constraint Network Map</p>
          <h1>Relationship map for bottlenecks, archetypes, and action paths</h1>
          <p className="lede">
            A deterministic graph view of constraint records, recurring
            archetypes, industries, cross-sector analogs, and intervention
            leverage.
          </p>
        </div>
      </header>

      <section className="network-main" aria-label="Constraint network explorer">
        <section className="network-summary-grid" aria-label="Network summary">
          <NetworkMetric label="Nodes" value={network.summary.total_nodes} />
          <NetworkMetric label="Edges" value={network.summary.total_edges} />
          <NetworkMetric
            label="Constraints"
            value={network.summary.constraint_node_count}
          />
          <NetworkMetric
            label="Archetypes"
            value={network.summary.archetype_node_count}
          />
          <NetworkMetric
            label="Industries"
            value={network.summary.industry_node_count}
          />
          <NetworkMetric
            label="Most Connected Constraint"
            value={network.summary.most_connected_constraint}
          />
        </section>

        <section className="network-section network-section--lead">
          <div>
            <p className="section-kicker">Network legend</p>
            <h2>How to read the relationship layer</h2>
            <p>
              Constraint nodes connect to archetypes, industries, intervention
              types, and cross-industry analogs. Strong bridges indicate similar
              bottleneck signatures appearing in different sectors.
            </p>
          </div>
          <div className="network-legend">
            <span className="legend-item legend-item--constraint">Constraint</span>
            <span className="legend-item legend-item--archetype">Archetype</span>
            <span className="legend-item legend-item--industry">Industry</span>
            <span className="legend-item legend-item--intervention">Intervention</span>
          </div>
        </section>

        <section className="network-map" aria-label="Visual cluster map">
          <div className="network-map__column">
            <h2>Bridge Constraints</h2>
            {visibleConstraintNodes.map((node) => (
              <NetworkNodeCard
                highlight={bridgeConstraintIds.has(node.id)}
                key={node.id}
                node={node}
              />
            ))}
          </div>

          <div className="network-map__spine" aria-hidden="true">
            <svg viewBox="0 0 220 500" role="img">
              <line x1="110" x2="110" y1="24" y2="476" />
              <path d="M110 80 C65 120 65 168 110 210" />
              <path d="M110 80 C155 120 155 168 110 210" />
              <path d="M110 260 C62 300 62 350 110 390" />
              <path d="M110 260 C158 300 158 350 110 390" />
              <circle cx="110" cy="80" r="12" />
              <circle cx="110" cy="210" r="12" />
              <circle cx="110" cy="390" r="12" />
            </svg>
          </div>

          <div className="network-map__column">
            <h2>Recurring Archetypes</h2>
            {archetypeNodes.map((node) => (
              <NetworkNodeCard key={node.id} node={node} />
            ))}
          </div>
        </section>

        <section className="network-grid">
          <NetworkList
            title="Top Bridge Constraints"
            nodes={network.bridge_constraints}
          />
          <NetworkClusterList
            title="Weak Evidence Clusters"
            clusters={network.weak_evidence_clusters}
            metric="Validation"
          />
          <NetworkClusterList
            title="High Intervention Leverage"
            clusters={network.high_intervention_clusters}
            metric="Intervention"
          />
          <NetworkClusterList
            title="Highest Priority Clusters"
            clusters={network.high_priority_clusters}
            metric="Priority"
          />
        </section>

        <section className="network-section">
          <p className="section-kicker">Strongest cross-industry bridge</p>
          <h2>{network.summary.strongest_cross_industry_bridge}</h2>
          <p>
            This edge is produced from shared archetypes, affected systems,
            intervention hints, and score proximity. It is a hypothesis for
            comparative learning, not proof that the domains are identical.
          </p>
        </section>
      </section>
    </main>
  );
}

function NetworkMetric({
  label,
  value
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="network-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function NetworkNodeCard({
  highlight = false,
  node
}: {
  highlight?: boolean;
  node: ConstraintNetworkNode;
}) {
  const content = (
    <>
      <span>{node.type}</span>
      <strong>{node.label}</strong>
      <small>
        {node.industry ?? node.archetype ?? "network node"}
        {node.priority_score ? ` | Priority ${node.priority_score.toFixed(1)}` : ""}
      </small>
    </>
  );

  if (node.route) {
    return (
      <Link
        className={`network-node-card${highlight ? " network-node-card--highlight" : ""}`}
        href={node.route}
      >
        {content}
      </Link>
    );
  }

  return (
    <article
      className={`network-node-card${highlight ? " network-node-card--highlight" : ""}`}
    >
      {content}
    </article>
  );
}

function NetworkList({
  nodes,
  title
}: {
  nodes: ConstraintNetworkNode[];
  title: string;
}) {
  return (
    <section className="network-section">
      <h2>{title}</h2>
      <div className="network-list">
        {nodes.map((node) => (
          <NetworkNodeCard highlight key={node.id} node={node} />
        ))}
      </div>
    </section>
  );
}

function NetworkClusterList({
  clusters,
  metric,
  title
}: {
  clusters: ConstraintNetworkCluster[];
  metric: "Validation" | "Intervention" | "Priority";
  title: string;
}) {
  return (
    <section className="network-section">
      <h2>{title}</h2>
      <div className="network-list">
        {clusters.map((cluster) => (
          <article className="network-cluster-card" key={`${cluster.type}:${cluster.id}`}>
            <span>{cluster.type} cluster</span>
            <strong>{cluster.label}</strong>
            <p>
              {cluster.record_count} records | {metric}{" "}
              {clusterMetric(cluster, metric).toFixed(1)}
            </p>
            <ul>
              {cluster.top_constraints.slice(0, 3).map((constraint) => (
                <li key={constraint}>{constraint}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function clusterMetric(
  cluster: ConstraintNetworkCluster,
  metric: "Validation" | "Intervention" | "Priority"
) {
  if (metric === "Validation") return cluster.average_validation_confidence;
  if (metric === "Intervention") return cluster.average_intervention_score;
  return cluster.average_priority_score;
}
