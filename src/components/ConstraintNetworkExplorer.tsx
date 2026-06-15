"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  ConstraintNetwork,
  ConstraintNetworkCluster,
  ConstraintNetworkNode
} from "@/lib/constraintNetwork";

type ConstraintNetworkExplorerProps = {
  network: ConstraintNetwork;
};

type RiskFilter = "All" | "Low" | "Moderate" | "High";

export function ConstraintNetworkExplorer({ network }: ConstraintNetworkExplorerProps) {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All");
  const [archetype, setArchetype] = useState("All");
  const [evidenceRisk, setEvidenceRisk] = useState<RiskFilter>("All");
  const [focusId, setFocusId] = useState("");
  const [urlReady, setUrlReady] = useState(false);

  const constraintNodes = useMemo(
    () => network.nodes.filter((node) => node.type === "constraint"),
    [network.nodes]
  );
  const nodeById = useMemo(
    () => new Map(network.nodes.map((node) => [node.id, node])),
    [network.nodes]
  );
  const focusNode = useMemo(
    () =>
      focusId
        ? constraintNodes.find((node) => node.constraint_id === focusId)
        : undefined,
    [constraintNodes, focusId]
  );
  const neighborhood = useMemo(
    () => (focusNode ? buildNeighborhood(focusNode, network, nodeById) : null),
    [focusNode, network, nodeById]
  );
  const filteredConstraints = useMemo(
    () =>
      constraintNodes.filter((node) =>
        matchesFilters(node, query, industry, archetype, evidenceRisk)
      ),
    [archetype, constraintNodes, evidenceRisk, industry, query]
  );
  const visibleConstraintNodes = useMemo(
    () => filteredConstraints.slice(0, 10),
    [filteredConstraints]
  );
  const visibleArchetypeNodes = useMemo(
    () =>
      archetype === "All"
        ? network.top_connected_archetypes.slice(0, 8)
        : network.nodes.filter(
            (node) => node.type === "archetype" && node.archetype === archetype
          ),
    [archetype, network.nodes, network.top_connected_archetypes]
  );

  const bridgeConstraintIds = new Set(
    network.bridge_constraints.map((node) => node.id)
  );
  const industryOptions = unique(
    constraintNodes.map((node) => node.industry).filter(Boolean) as string[]
  );
  const archetypeOptions = unique(
    constraintNodes.map((node) => node.archetype).filter(Boolean) as string[]
  );
  const focusNotFound = Boolean(focusId && !focusNode);

  useEffect(() => {
    const applyUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get("q") ?? "");
      setIndustry(params.get("industry") ?? "All");
      setArchetype(params.get("archetype") ?? "All");
      setEvidenceRisk((params.get("risk") as RiskFilter | null) ?? "All");
      setFocusId(params.get("focus") ?? "");
      setUrlReady(true);
    };

    applyUrl();
    window.addEventListener("popstate", applyUrl);
    return () => window.removeEventListener("popstate", applyUrl);
  }, []);

  useEffect(() => {
    if (!urlReady) return;

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (industry !== "All") params.set("industry", industry);
    if (archetype !== "All") params.set("archetype", archetype);
    if (evidenceRisk !== "All") params.set("risk", evidenceRisk);
    if (focusId) params.set("focus", focusId);

    const nextUrl = params.toString() ? `/network?${params.toString()}` : "/network";
    window.history.replaceState(null, "", nextUrl);
  }, [archetype, evidenceRisk, focusId, industry, query, urlReady]);

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
            Search, filter, and focus the deterministic graph of constraint
            records, recurring archetypes, industries, cross-sector analogs, and
            intervention leverage.
          </p>
        </div>
      </header>

      <section className="network-main" aria-label="Constraint network explorer">
        <section className="network-summary-grid" aria-label="Network summary">
          <NetworkMetric label="Nodes" value={network.summary.total_nodes} />
          <NetworkMetric label="Edges" value={network.summary.total_edges} />
          <NetworkMetric
            label="Visible Constraints"
            value={filteredConstraints.length}
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
            label="Most Connected"
            value={network.summary.most_connected_constraint}
          />
        </section>

        <section className="network-filter-panel" aria-label="Network filters">
          <div>
            <p className="section-kicker">Network controls</p>
            <h2>Search, filter, and focus the relationship map</h2>
          </div>
          <div className="network-filter-grid">
            <label>
              Search
              <input
                placeholder="Constraint, industry, archetype, or id"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              Industry
              <select
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
              >
                <option value="All">All industries</option>
                {industryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Archetype
              <select
                value={archetype}
                onChange={(event) => setArchetype(event.target.value)}
              >
                <option value="All">All archetypes</option>
                {archetypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {labelFromId(option)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Evidence Risk
              <select
                value={evidenceRisk}
                onChange={(event) => setEvidenceRisk(event.target.value as RiskFilter)}
              >
                <option value="All">All risk levels</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </label>
          </div>
          <div className="network-filter-actions">
            <button
              className="details-button"
              type="button"
              onClick={() => {
                setQuery("");
                setIndustry("All");
                setArchetype("All");
                setEvidenceRisk("All");
                setFocusId("");
              }}
            >
              Reset network view
            </button>
            {focusNode ? (
              <Link
                className="details-link"
                href={focusNode.route ?? `/constraints/${focusNode.constraint_id}`}
              >
                Open focused investigation
              </Link>
            ) : null}
          </div>
        </section>

        {focusNode || focusNotFound ? (
          <FocusPanel
            focusId={focusId}
            focusNode={focusNode}
            neighborhood={neighborhood}
            onClearFocus={() => setFocusId("")}
            onFocusConstraint={setFocusId}
          />
        ) : null}

        <section className="network-section network-section--lead">
          <div>
            <p className="section-kicker">Network legend</p>
            <h2>How to read the relationship layer</h2>
            <p>
              Constraint nodes connect to archetypes, industries, intervention
              types, and cross-industry analogs. Use focus mode to inspect one
              constraint&apos;s immediate neighborhood.
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
            <h2>Filtered Constraints</h2>
            {visibleConstraintNodes.map((node) => (
              <NetworkNodeCard
                highlight={bridgeConstraintIds.has(node.id) || node.id === focusNode?.id}
                key={node.id}
                node={node}
                onFocusConstraint={setFocusId}
              />
            ))}
            {visibleConstraintNodes.length === 0 ? (
              <div className="empty-state">No network nodes match this view.</div>
            ) : null}
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
            <h2>Relevant Archetypes</h2>
            {visibleArchetypeNodes.map((node) => (
              <NetworkNodeCard key={node.id} node={node} />
            ))}
          </div>
        </section>

        <section className="network-grid">
          <NetworkList
            title="Top Bridge Constraints"
            nodes={network.bridge_constraints}
            onFocusConstraint={setFocusId}
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

function FocusPanel({
  focusId,
  focusNode,
  neighborhood,
  onClearFocus,
  onFocusConstraint
}: {
  focusId: string;
  focusNode?: ConstraintNetworkNode;
  neighborhood: ReturnType<typeof buildNeighborhood> | null;
  onClearFocus: () => void;
  onFocusConstraint: (id: string) => void;
}) {
  if (!focusNode || !neighborhood) {
    return (
      <section className="network-focus-panel">
        <div>
          <p className="section-kicker">Focus mode</p>
          <h2>Focus target not found</h2>
          <p>No constraint node matches `{focusId}`.</p>
        </div>
        <button className="details-button" type="button" onClick={onClearFocus}>
          Clear focus
        </button>
      </section>
    );
  }

  return (
    <section className="network-focus-panel" aria-label="Focused neighborhood">
      <div>
        <p className="section-kicker">Focus mode</p>
        <h2>{focusNode.label}</h2>
        <p>
          Showing {neighborhood.neighborNodes.length} neighboring node
          {neighborhood.neighborNodes.length === 1 ? "" : "s"} and{" "}
          {neighborhood.edges.length} connected edge
          {neighborhood.edges.length === 1 ? "" : "s"} for `{focusNode.constraint_id}`.
        </p>
      </div>
      <div className="network-focus-actions">
        <Link
          className="details-link"
          href={focusNode.route ?? `/constraints/${focusNode.constraint_id}`}
        >
          Open investigation
        </Link>
        <button className="details-button" type="button" onClick={onClearFocus}>
          Clear focus
        </button>
      </div>
      <div className="network-neighborhood">
        {neighborhood.neighborNodes.slice(0, 12).map((node) => (
          <NetworkNodeCard
            key={node.id}
            node={node}
            onFocusConstraint={onFocusConstraint}
          />
        ))}
      </div>
      <div className="network-edge-list">
        {neighborhood.edges.slice(0, 8).map((edge) => (
          <article className="network-edge-card" key={edge.id}>
            <span>{edge.type.replaceAll("_", " ")}</span>
            <strong>{edge.label}</strong>
            <p>{edge.explanation}</p>
            <small>Strength {edge.strength.toFixed(1)}</small>
          </article>
        ))}
      </div>
    </section>
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
  node,
  onFocusConstraint
}: {
  highlight?: boolean;
  node: ConstraintNetworkNode;
  onFocusConstraint?: (id: string) => void;
}) {
  const focusHref = node.constraint_id ? `/network?focus=${node.constraint_id}` : null;

  return (
    <article
      className={`network-node-card${highlight ? " network-node-card--highlight" : ""}`}
    >
      <span>{node.type}</span>
      <strong>{node.label}</strong>
      <small>
        {node.industry ?? (node.archetype ? labelFromId(node.archetype) : "network node")}
        {node.evidence_risk ? ` | Evidence risk ${node.evidence_risk}` : ""}
        {node.priority_score ? ` | Priority ${node.priority_score.toFixed(1)}` : ""}
      </small>
      {node.route || focusHref ? (
        <div className="network-node-actions">
          {node.route ? <Link href={node.route}>Investigation</Link> : null}
          {focusHref ? (
            <a
              href={focusHref}
              onClick={(event) => {
                if (!node.constraint_id || !onFocusConstraint) return;
                event.preventDefault();
                onFocusConstraint(node.constraint_id);
              }}
            >
              Focus
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function NetworkList({
  nodes,
  onFocusConstraint,
  title
}: {
  nodes: ConstraintNetworkNode[];
  onFocusConstraint?: (id: string) => void;
  title: string;
}) {
  return (
    <section className="network-section">
      <h2>{title}</h2>
      <div className="network-list">
        {nodes.map((node) => (
          <NetworkNodeCard
            highlight
            key={node.id}
            node={node}
            onFocusConstraint={onFocusConstraint}
          />
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

function matchesFilters(
  node: ConstraintNetworkNode,
  query: string,
  industry: string,
  archetype: string,
  evidenceRisk: RiskFilter
) {
  const normalizedQuery = query.trim().toLowerCase();
  const text = [
    node.label,
    node.constraint_id,
    node.industry,
    node.archetype ? labelFromId(node.archetype) : "",
    node.evidence_risk
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    (normalizedQuery.length === 0 || text.includes(normalizedQuery)) &&
    (industry === "All" || node.industry === industry) &&
    (archetype === "All" || node.archetype === archetype) &&
    (evidenceRisk === "All" || node.evidence_risk === evidenceRisk)
  );
}

function buildNeighborhood(
  focusNode: ConstraintNetworkNode,
  network: ConstraintNetwork,
  nodeById: Map<string, ConstraintNetworkNode>
) {
  const edges = network.edges
    .filter((edge) => edge.source === focusNode.id || edge.target === focusNode.id)
    .sort((first, second) => second.strength - first.strength);
  const neighborNodes = edges
    .map((edge) => (edge.source === focusNode.id ? edge.target : edge.source))
    .map((nodeId) => nodeById.get(nodeId))
    .filter((node): node is ConstraintNetworkNode => Boolean(node));

  return {
    edges,
    neighborNodes: uniqueNodes(neighborNodes)
  };
}

function uniqueNodes(nodes: ConstraintNetworkNode[]) {
  const seen = new Set<string>();
  return nodes.filter((node) => {
    if (seen.has(node.id)) return false;
    seen.add(node.id);
    return true;
  });
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function labelFromId(value: string) {
  return value
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function clusterMetric(
  cluster: ConstraintNetworkCluster,
  metric: "Validation" | "Intervention" | "Priority"
) {
  if (metric === "Validation") return cluster.average_validation_confidence;
  if (metric === "Intervention") return cluster.average_intervention_score;
  return cluster.average_priority_score;
}
