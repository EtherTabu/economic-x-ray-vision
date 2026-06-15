import { getArchetypeLabel } from "@/lib/archetypeAnalysis";
import { findCrossIndustryAnalogs } from "@/lib/crossIndustryAnalogs";
import { buildEvidenceDossier } from "@/lib/evidenceDossier";
import { buildInterventionStrategies } from "@/lib/interventionSimulator";
import type { ConstraintArchetypeId, ScoredConstraint } from "@/types/constraint";

export type ConstraintNetworkNodeType =
  | "constraint"
  | "archetype"
  | "industry"
  | "intervention";

export type ConstraintNetworkEdgeType =
  | "primary_archetype"
  | "secondary_archetype"
  | "industry_membership"
  | "cross_industry_analog"
  | "constraint_relationship"
  | "intervention_type"
  | "archetype_industry";

export type ConstraintNetworkNode = {
  id: string;
  label: string;
  type: ConstraintNetworkNodeType;
  industry?: string;
  archetype?: string;
  priority_score?: number;
  validation_confidence?: number;
  strategic_score?: number;
  intervention_score?: number;
  action_confidence?: number;
  evidence_risk?: string;
  route?: string;
};

export type ConstraintNetworkEdge = {
  id: string;
  source: string;
  target: string;
  type: ConstraintNetworkEdgeType;
  label: string;
  strength: number;
  explanation: string;
};

export type ConstraintNetworkCluster = {
  id: string;
  label: string;
  type: "archetype" | "industry";
  record_count: number;
  average_priority_score: number;
  average_validation_confidence: number;
  average_intervention_score: number;
  top_constraints: string[];
};

export type ConstraintNetworkSummary = {
  total_nodes: number;
  total_edges: number;
  constraint_node_count: number;
  archetype_node_count: number;
  industry_node_count: number;
  most_connected_constraint: string;
  most_connected_archetype: string;
  strongest_cross_industry_bridge: string;
  weakest_evidence_cluster: string;
  highest_intervention_cluster: string;
  highest_priority_cluster: string;
};

export type ConstraintNetwork = {
  nodes: ConstraintNetworkNode[];
  edges: ConstraintNetworkEdge[];
  summary: ConstraintNetworkSummary;
  top_connected_constraints: ConstraintNetworkNode[];
  top_connected_archetypes: ConstraintNetworkNode[];
  bridge_constraints: ConstraintNetworkNode[];
  weak_evidence_clusters: ConstraintNetworkCluster[];
  high_intervention_clusters: ConstraintNetworkCluster[];
  high_priority_clusters: ConstraintNetworkCluster[];
};

export function buildConstraintNetwork(
  constraints: ScoredConstraint[]
): ConstraintNetwork {
  const strategies = buildInterventionStrategies(constraints);
  const strategyByConstraint = new Map(
    strategies.map((strategy) => [strategy.constraint_id, strategy])
  );
  const nodes = new Map<string, ConstraintNetworkNode>();
  const edges = new Map<string, ConstraintNetworkEdge>();

  constraints.forEach((constraint) => {
    const strategy = strategyByConstraint.get(constraint.id);
    const dossier = buildEvidenceDossier(constraint);

    nodes.set(constraintNodeId(constraint.id), {
      id: constraintNodeId(constraint.id),
      label: constraint.title,
      type: "constraint",
      industry: constraint.industry,
      archetype: constraint.primary_archetype,
      priority_score: constraint.scores.total_priority_score,
      validation_confidence: constraint.scores.validation_confidence_score,
      strategic_score: constraint.scores.total_strategic_score,
      intervention_score: strategy?.intervention_priority_score,
      action_confidence: strategy?.action_confidence,
      evidence_risk: dossier.evidence_risk_level,
      route: `/constraints/${constraint.id}`
    });

    nodes.set(archetypeNodeId(constraint.primary_archetype), {
      id: archetypeNodeId(constraint.primary_archetype),
      label: getArchetypeLabel(constraint.primary_archetype),
      type: "archetype",
      archetype: constraint.primary_archetype
    });
    addEdge(edges, {
      source: constraintNodeId(constraint.id),
      target: archetypeNodeId(constraint.primary_archetype),
      type: "primary_archetype",
      label: "Primary archetype",
      strength: constraint.archetype_confidence,
      explanation: `${constraint.title} primarily expresses ${getArchetypeLabel(
        constraint.primary_archetype
      )}.`
    });

    constraint.secondary_archetypes.forEach((archetype) => {
      nodes.set(archetypeNodeId(archetype), {
        id: archetypeNodeId(archetype),
        label: getArchetypeLabel(archetype),
        type: "archetype",
        archetype
      });
      addEdge(edges, {
        source: constraintNodeId(constraint.id),
        target: archetypeNodeId(archetype),
        type: "secondary_archetype",
        label: "Secondary archetype",
        strength: round(constraint.archetype_confidence * 0.72),
        explanation: `${constraint.title} also shares the ${getArchetypeLabel(
          archetype
        )} pattern.`
      });
    });

    nodes.set(industryNodeId(constraint.industry), {
      id: industryNodeId(constraint.industry),
      label: constraint.industry,
      type: "industry",
      industry: constraint.industry
    });
    addEdge(edges, {
      source: constraintNodeId(constraint.id),
      target: industryNodeId(constraint.industry),
      type: "industry_membership",
      label: "Industry",
      strength: 6,
      explanation: `${constraint.title} belongs to ${constraint.industry}.`
    });

    if (strategy) {
      const interventionId = interventionNodeId(strategy.intervention_type);
      nodes.set(interventionId, {
        id: interventionId,
        label: strategy.intervention_type.replaceAll("_", " "),
        type: "intervention",
        intervention_score: strategy.intervention_priority_score,
        action_confidence: strategy.action_confidence
      });
      addEdge(edges, {
        source: constraintNodeId(constraint.id),
        target: interventionId,
        type: "intervention_type",
        label: "Intervention",
        strength: strategy.intervention_priority_score,
        explanation: `${constraint.title} maps to ${strategy.intervention_type.replaceAll(
          "_",
          " "
        )} as the recommended action type.`
      });
    }
  });

  addResolvedRelationshipEdges(constraints, edges);
  addAnalogEdges(constraints, edges);
  addArchetypeIndustryEdges(constraints, edges, nodes);

  const nodeList = Array.from(nodes.values()).sort((first, second) =>
    first.id.localeCompare(second.id)
  );
  const edgeList = Array.from(edges.values()).sort((first, second) =>
    first.id.localeCompare(second.id)
  );
  const degree = degreeMap(edgeList);
  const archetypeClusters = buildArchetypeClusters(constraints, strategyByConstraint);
  const industryClusters = buildIndustryClusters(constraints, strategyByConstraint);
  const clusters = [...archetypeClusters, ...industryClusters];
  const topConnectedConstraints = topNodes(nodeList, degree, "constraint", 6);
  const topConnectedArchetypes = topNodes(nodeList, degree, "archetype", 6);
  const bridgeConstraints = bridgeNodes(nodeList, edgeList, degree);
  const strongestBridge = edgeList
    .filter((edge) => edge.type === "cross_industry_analog")
    .sort((first, second) => second.strength - first.strength)[0];

  return {
    nodes: nodeList,
    edges: edgeList,
    summary: {
      total_nodes: nodeList.length,
      total_edges: edgeList.length,
      constraint_node_count: nodeList.filter((node) => node.type === "constraint")
        .length,
      archetype_node_count: nodeList.filter((node) => node.type === "archetype")
        .length,
      industry_node_count: nodeList.filter((node) => node.type === "industry")
        .length,
      most_connected_constraint: topConnectedConstraints[0]?.label ?? "None",
      most_connected_archetype: topConnectedArchetypes[0]?.label ?? "None",
      strongest_cross_industry_bridge: strongestBridge
        ? strongestBridge.label
        : "None",
      weakest_evidence_cluster:
        clusters
          .slice()
          .sort(
            (first, second) =>
              first.average_validation_confidence -
              second.average_validation_confidence
          )[0]?.label ?? "None",
      highest_intervention_cluster:
        clusters
          .slice()
          .sort(
            (first, second) =>
              second.average_intervention_score - first.average_intervention_score
          )[0]?.label ?? "None",
      highest_priority_cluster:
        clusters
          .slice()
          .sort(
            (first, second) =>
              second.average_priority_score - first.average_priority_score
          )[0]?.label ?? "None"
    },
    top_connected_constraints: topConnectedConstraints,
    top_connected_archetypes: topConnectedArchetypes,
    bridge_constraints: bridgeConstraints,
    weak_evidence_clusters: clusters
      .slice()
      .sort(
        (first, second) =>
          first.average_validation_confidence - second.average_validation_confidence
      )
      .slice(0, 5),
    high_intervention_clusters: clusters
      .slice()
      .sort(
        (first, second) =>
          second.average_intervention_score - first.average_intervention_score
      )
      .slice(0, 5),
    high_priority_clusters: clusters
      .slice()
      .sort(
        (first, second) =>
          second.average_priority_score - first.average_priority_score
      )
      .slice(0, 5)
  };
}

function addAnalogEdges(
  constraints: ScoredConstraint[],
  edges: Map<string, ConstraintNetworkEdge>
) {
  findCrossIndustryAnalogs(constraints, 20).forEach((analog) => {
    addEdge(edges, {
      source: constraintNodeId(analog.source_constraint_id),
      target: constraintNodeId(analog.analog_constraint_id),
      type: "cross_industry_analog",
      label: `${analog.source_constraint_title} / ${analog.analog_constraint_title}`,
      strength: analog.similarity_score,
      explanation: analog.why_the_analog_matters
    });
  });
}

function addResolvedRelationshipEdges(
  constraints: ScoredConstraint[],
  edges: Map<string, ConstraintNetworkEdge>
) {
  const byTitle = new Map(
    constraints.map((constraint) => [constraint.title.toLowerCase(), constraint])
  );
  const byId = new Map(constraints.map((constraint) => [constraint.id, constraint]));

  constraints.forEach((constraint) => {
    [
      ...constraint.upstream_constraints.map((value) => ({
        value,
        label: "Upstream",
        type: "constraint_relationship" as const
      })),
      ...constraint.downstream_constraints.map((value) => ({
        value,
        label: "Downstream",
        type: "constraint_relationship" as const
      }))
    ].forEach((relationship) => {
      const target =
        byId.get(relationship.value) ?? byTitle.get(relationship.value.toLowerCase());

      if (!target) return;

      addEdge(edges, {
        source: constraintNodeId(constraint.id),
        target: constraintNodeId(target.id),
        type: relationship.type,
        label: relationship.label,
        strength: 6.5,
        explanation: `${constraint.title} is marked as ${relationship.label.toLowerCase()} relative to ${target.title}.`
      });
    });
  });
}

function addArchetypeIndustryEdges(
  constraints: ScoredConstraint[],
  edges: Map<string, ConstraintNetworkEdge>,
  nodes: Map<string, ConstraintNetworkNode>
) {
  const pairs = new Map<string, { archetype: ConstraintArchetypeId; industry: string; count: number }>();

  constraints.forEach((constraint) => {
    [constraint.primary_archetype, ...constraint.secondary_archetypes].forEach(
      (archetype) => {
        const key = `${archetype}::${constraint.industry}`;
        const current = pairs.get(key) ?? {
          archetype,
          industry: constraint.industry,
          count: 0
        };
        current.count += 1;
        pairs.set(key, current);
      }
    );
  });

  Array.from(pairs.values()).forEach((pair) => {
    nodes.set(archetypeNodeId(pair.archetype), {
      id: archetypeNodeId(pair.archetype),
      label: getArchetypeLabel(pair.archetype),
      type: "archetype",
      archetype: pair.archetype
    });
    nodes.set(industryNodeId(pair.industry), {
      id: industryNodeId(pair.industry),
      label: pair.industry,
      type: "industry",
      industry: pair.industry
    });
    addEdge(edges, {
      source: archetypeNodeId(pair.archetype),
      target: industryNodeId(pair.industry),
      type: "archetype_industry",
      label: "Appears in industry",
      strength: Math.min(10, 3 + pair.count),
      explanation: `${getArchetypeLabel(pair.archetype)} appears in ${
        pair.industry
      } across ${pair.count} record${pair.count === 1 ? "" : "s"}.`
    });
  });
}

function buildArchetypeClusters(
  constraints: ScoredConstraint[],
  strategyByConstraint: Map<string, { intervention_priority_score: number }>
) {
  const archetypes = Array.from(
    new Set(
      constraints.flatMap((constraint) => [
        constraint.primary_archetype,
        ...constraint.secondary_archetypes
      ])
    )
  );

  return archetypes.map((archetype) => {
    const records = constraints.filter((constraint) =>
      [constraint.primary_archetype, ...constraint.secondary_archetypes].includes(
        archetype
      )
    );

    return clusterFromRecords(
      archetype,
      getArchetypeLabel(archetype),
      "archetype",
      records,
      strategyByConstraint
    );
  });
}

function buildIndustryClusters(
  constraints: ScoredConstraint[],
  strategyByConstraint: Map<string, { intervention_priority_score: number }>
) {
  return Array.from(new Set(constraints.map((constraint) => constraint.industry))).map(
    (industry) => {
      const records = constraints.filter((constraint) => constraint.industry === industry);
      return clusterFromRecords(
        industryNodeId(industry),
        industry,
        "industry",
        records,
        strategyByConstraint
      );
    }
  );
}

function clusterFromRecords(
  id: string,
  label: string,
  type: "archetype" | "industry",
  records: ScoredConstraint[],
  strategyByConstraint: Map<string, { intervention_priority_score: number }>
): ConstraintNetworkCluster {
  return {
    id,
    label,
    type,
    record_count: records.length,
    average_priority_score: average(
      records.map((record) => record.scores.total_priority_score)
    ),
    average_validation_confidence: average(
      records.map((record) => record.scores.validation_confidence_score)
    ),
    average_intervention_score: average(
      records.map(
        (record) =>
          strategyByConstraint.get(record.id)?.intervention_priority_score ?? 0
      )
    ),
    top_constraints: records
      .slice()
      .sort(
        (first, second) =>
          second.scores.total_priority_score - first.scores.total_priority_score
      )
      .slice(0, 4)
      .map((record) => record.title)
  };
}

function addEdge(
  edges: Map<string, ConstraintNetworkEdge>,
  edge: Omit<ConstraintNetworkEdge, "id">
) {
  const id = `${edge.type}:${edge.source}->${edge.target}`;
  edges.set(id, {
    ...edge,
    id,
    strength: round(Math.max(1, Math.min(10, edge.strength)))
  });
}

function degreeMap(edges: ConstraintNetworkEdge[]) {
  return edges.reduce<Record<string, number>>((counts, edge) => {
    counts[edge.source] = (counts[edge.source] ?? 0) + 1;
    counts[edge.target] = (counts[edge.target] ?? 0) + 1;
    return counts;
  }, {});
}

function topNodes(
  nodes: ConstraintNetworkNode[],
  degree: Record<string, number>,
  type: ConstraintNetworkNodeType,
  limit: number
) {
  return nodes
    .filter((node) => node.type === type)
    .sort((first, second) => (degree[second.id] ?? 0) - (degree[first.id] ?? 0))
    .slice(0, limit);
}

function bridgeNodes(
  nodes: ConstraintNetworkNode[],
  edges: ConstraintNetworkEdge[],
  degree: Record<string, number>
) {
  const bridgeIds = new Set(
    edges
      .filter((edge) => edge.type === "cross_industry_analog")
      .flatMap((edge) => [edge.source, edge.target])
  );

  return nodes
    .filter((node) => node.type === "constraint" && bridgeIds.has(node.id))
    .sort((first, second) => (degree[second.id] ?? 0) - (degree[first.id] ?? 0))
    .slice(0, 6);
}

function constraintNodeId(id: string) {
  return `constraint:${id}`;
}

function archetypeNodeId(archetype: string) {
  return `archetype:${archetype}`;
}

function industryNodeId(industry: string) {
  return `industry:${slug(industry)}`;
}

function interventionNodeId(type: string) {
  return `intervention:${type}`;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function average(values: number[]) {
  return round(values.reduce((total, value) => total + value, 0) / values.length);
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
