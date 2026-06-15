type NetworkBuildFsModule = typeof import("node:fs");
type NetworkBuildPathModule = typeof import("node:path");

const {
  existsSync: networkBuildExistsSync,
  mkdirSync: networkBuildMkdirSync,
  readFileSync: networkBuildReadFileSync,
  writeFileSync: networkBuildWriteFileSync
} = process.getBuiltinModule("fs") as NetworkBuildFsModule;
const {
  dirname: networkBuildDirname,
  resolve: networkBuildResolve
} = process.getBuiltinModule("path") as NetworkBuildPathModule;

type NetworkBuildRecord = {
  id: string;
  title: string;
  industry: string;
  primary_archetype: string;
  secondary_archetypes: string[];
  validation_status: string;
  upstream_constraints: string[];
  downstream_constraints: string[];
  scores: Record<string, number>;
};

type NetworkBuildStrategy = {
  constraint_id: string;
  intervention_type: string;
  intervention_priority_score: number;
  action_confidence: number;
};

type NetworkBuildDossier = {
  constraint_id: string;
  evidence_risk_level: string;
};

type NetworkBuildAnalog = {
  source_constraint_title: string;
  source_industry: string;
  analog_constraint_title: string;
  analog_industry: string;
  shared_archetypes: string[];
  similarity_score: number;
  why_the_analog_matters: string;
};

type NetworkBuildNode = {
  id: string;
  label: string;
  type: "constraint" | "archetype" | "industry" | "intervention";
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

type NetworkBuildEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
  strength: number;
  explanation: string;
};

const networkBuildDatasetPath = networkBuildResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const networkBuildEvidencePath = networkBuildResolve(
  "data/exports/evidence_dossiers.json"
);
const networkBuildInterventionPath = networkBuildResolve(
  "data/exports/intervention_strategies.json"
);
const networkBuildArchetypePath = networkBuildResolve(
  "data/exports/archetype_analysis.json"
);
const networkBuildOutputPath = networkBuildResolve(
  "data/exports/constraint_network.json"
);

function networkBuildMain() {
  const dataset = JSON.parse(
    networkBuildReadFileSync(networkBuildDatasetPath, "utf8")
  ) as { records: NetworkBuildRecord[] };
  const dossiers = networkBuildLoadOptional<{ dossiers: NetworkBuildDossier[] }>(
    networkBuildEvidencePath,
    { dossiers: [] }
  ).dossiers;
  const strategies = networkBuildLoadOptional<{ strategies: NetworkBuildStrategy[] }>(
    networkBuildInterventionPath,
    { strategies: [] }
  ).strategies;
  const analogs = networkBuildLoadOptional<{
    cross_industry_analogs: NetworkBuildAnalog[];
  }>(networkBuildArchetypePath, { cross_industry_analogs: [] })
    .cross_industry_analogs;
  const graph = networkBuildGraph(dataset.records, dossiers, strategies, analogs);
  const output = {
    generated_at: new Date().toISOString(),
    record_count: dataset.records.length,
    ...graph
  };

  networkBuildMkdirSync(networkBuildDirname(networkBuildOutputPath), {
    recursive: true
  });
  networkBuildWriteStableJson(networkBuildOutputPath, output);
  console.log(
    `Built constraint network with ${graph.summary.total_nodes} nodes and ${graph.summary.total_edges} edges at ${networkBuildOutputPath}.`
  );
}

function networkBuildLoadOptional<T>(path: string, fallback: T) {
  if (!networkBuildExistsSync(path)) return fallback;
  return JSON.parse(networkBuildReadFileSync(path, "utf8")) as T;
}

function networkBuildGraph(
  records: NetworkBuildRecord[],
  dossiers: NetworkBuildDossier[],
  strategies: NetworkBuildStrategy[],
  analogs: NetworkBuildAnalog[]
) {
  const nodes = new Map<string, NetworkBuildNode>();
  const edges = new Map<string, NetworkBuildEdge>();
  const dossierById = new Map(
    dossiers.map((dossier) => [dossier.constraint_id, dossier])
  );
  const strategyById = new Map(
    strategies.map((strategy) => [strategy.constraint_id, strategy])
  );
  const titleToRecord = new Map(
    records.map((record) => [record.title.toLowerCase(), record])
  );

  records.forEach((record) => {
    const strategy = strategyById.get(record.id);
    const dossier = dossierById.get(record.id);

    nodes.set(networkConstraintNodeId(record.id), {
      id: networkConstraintNodeId(record.id),
      label: record.title,
      type: "constraint",
      industry: record.industry,
      archetype: record.primary_archetype,
      priority_score: record.scores.total_priority_score,
      validation_confidence: record.scores.validation_confidence_score,
      strategic_score: record.scores.total_strategic_score,
      intervention_score: strategy?.intervention_priority_score,
      action_confidence: strategy?.action_confidence,
      evidence_risk: dossier?.evidence_risk_level ?? record.validation_status,
      route: `/constraints/${record.id}`
    });
    networkEnsureArchetype(nodes, record.primary_archetype);
    networkAddEdge(edges, {
      source: networkConstraintNodeId(record.id),
      target: networkArchetypeNodeId(record.primary_archetype),
      type: "primary_archetype",
      label: "Primary archetype",
      strength: 8,
      explanation: `${record.title} primarily maps to ${networkLabel(
        record.primary_archetype
      )}.`
    });
    record.secondary_archetypes.forEach((archetype) => {
      networkEnsureArchetype(nodes, archetype);
      networkAddEdge(edges, {
        source: networkConstraintNodeId(record.id),
        target: networkArchetypeNodeId(archetype),
        type: "secondary_archetype",
        label: "Secondary archetype",
        strength: 5.8,
        explanation: `${record.title} also shares ${networkLabel(archetype)}.`
      });
    });
    nodes.set(networkIndustryNodeId(record.industry), {
      id: networkIndustryNodeId(record.industry),
      label: record.industry,
      type: "industry",
      industry: record.industry
    });
    networkAddEdge(edges, {
      source: networkConstraintNodeId(record.id),
      target: networkIndustryNodeId(record.industry),
      type: "industry_membership",
      label: "Industry",
      strength: 6,
      explanation: `${record.title} is part of ${record.industry}.`
    });

    if (strategy) {
      nodes.set(networkInterventionNodeId(strategy.intervention_type), {
        id: networkInterventionNodeId(strategy.intervention_type),
        label: strategy.intervention_type.replaceAll("_", " "),
        type: "intervention",
        intervention_score: strategy.intervention_priority_score,
        action_confidence: strategy.action_confidence
      });
      networkAddEdge(edges, {
        source: networkConstraintNodeId(record.id),
        target: networkInterventionNodeId(strategy.intervention_type),
        type: "intervention_type",
        label: "Intervention",
        strength: strategy.intervention_priority_score,
        explanation: `${record.title} maps to ${strategy.intervention_type.replaceAll(
          "_",
          " "
        )}.`
      });
    }
  });

  records.forEach((record) => {
    [...record.upstream_constraints, ...record.downstream_constraints].forEach(
      (value) => {
        const target = titleToRecord.get(value.toLowerCase());
        if (!target) return;
        networkAddEdge(edges, {
          source: networkConstraintNodeId(record.id),
          target: networkConstraintNodeId(target.id),
          type: "constraint_relationship",
          label: "Related constraint",
          strength: 6.5,
          explanation: `${record.title} has a recorded relationship to ${target.title}.`
        });
      }
    );
  });

  analogs.forEach((analog) => {
    const source = titleToRecord.get(analog.source_constraint_title.toLowerCase());
    const target = titleToRecord.get(analog.analog_constraint_title.toLowerCase());
    if (!source || !target) return;
    networkAddEdge(edges, {
      source: networkConstraintNodeId(source.id),
      target: networkConstraintNodeId(target.id),
      type: "cross_industry_analog",
      label: `${source.title} / ${target.title}`,
      strength: analog.similarity_score,
      explanation: analog.why_the_analog_matters
    });
  });

  networkAddArchetypeIndustryEdges(records, nodes, edges);

  const nodeList = Array.from(nodes.values()).sort((first, second) =>
    first.id.localeCompare(second.id)
  );
  const edgeList = Array.from(edges.values()).sort((first, second) =>
    first.id.localeCompare(second.id)
  );
  const degree = networkDegree(edgeList);
  const clusters = networkClusters(records, strategyById);
  const topConstraints = networkTopNodes(nodeList, degree, "constraint", 6);
  const topArchetypes = networkTopNodes(nodeList, degree, "archetype", 6);
  const bridgeConstraints = networkBridgeNodes(nodeList, edgeList, degree);

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
      most_connected_constraint: topConstraints[0]?.label ?? "None",
      most_connected_archetype: topArchetypes[0]?.label ?? "None",
      strongest_cross_industry_bridge:
        edgeList
          .filter((edge) => edge.type === "cross_industry_analog")
          .sort((first, second) => second.strength - first.strength)[0]?.label ??
        "None",
      weakest_evidence_cluster: networkWeakestCluster(clusters).label,
      highest_intervention_cluster: networkTopCluster(
        clusters,
        "average_intervention_score"
      ).label,
      highest_priority_cluster: networkTopCluster(
        clusters,
        "average_priority_score"
      ).label
    },
    top_connected_constraints: topConstraints,
    top_connected_archetypes: topArchetypes,
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

function networkAddArchetypeIndustryEdges(
  records: NetworkBuildRecord[],
  nodes: Map<string, NetworkBuildNode>,
  edges: Map<string, NetworkBuildEdge>
) {
  const pairs = new Map<string, { archetype: string; industry: string; count: number }>();
  records.forEach((record) => {
    [record.primary_archetype, ...record.secondary_archetypes].forEach(
      (archetype) => {
        const key = `${archetype}::${record.industry}`;
        const pair = pairs.get(key) ?? { archetype, industry: record.industry, count: 0 };
        pair.count += 1;
        pairs.set(key, pair);
      }
    );
  });

  Array.from(pairs.values()).forEach((pair) => {
    networkEnsureArchetype(nodes, pair.archetype);
    nodes.set(networkIndustryNodeId(pair.industry), {
      id: networkIndustryNodeId(pair.industry),
      label: pair.industry,
      type: "industry",
      industry: pair.industry
    });
    networkAddEdge(edges, {
      source: networkArchetypeNodeId(pair.archetype),
      target: networkIndustryNodeId(pair.industry),
      type: "archetype_industry",
      label: "Appears in industry",
      strength: Math.min(10, 3 + pair.count),
      explanation: `${networkLabel(pair.archetype)} appears in ${pair.industry}.`
    });
  });
}

function networkClusters(
  records: NetworkBuildRecord[],
  strategyById: Map<string, NetworkBuildStrategy>
) {
  const archetypes = Array.from(
    new Set(
      records.flatMap((record) => [
        record.primary_archetype,
        ...record.secondary_archetypes
      ])
    )
  );

  return archetypes.map((archetype) => {
    const matching = records.filter((record) =>
      [record.primary_archetype, ...record.secondary_archetypes].includes(archetype)
    );
    return {
      id: archetype,
      label: networkLabel(archetype),
      type: "archetype",
      record_count: matching.length,
      average_priority_score: networkAverage(
        matching.map((record) => record.scores.total_priority_score)
      ),
      average_validation_confidence: networkAverage(
        matching.map((record) => record.scores.validation_confidence_score)
      ),
      average_intervention_score: networkAverage(
        matching.map(
          (record) => strategyById.get(record.id)?.intervention_priority_score ?? 0
        )
      ),
      top_constraints: matching
        .slice()
        .sort(
          (first, second) =>
            second.scores.total_priority_score - first.scores.total_priority_score
        )
        .slice(0, 4)
        .map((record) => record.title)
    };
  });
}

function networkEnsureArchetype(
  nodes: Map<string, NetworkBuildNode>,
  archetype: string
) {
  nodes.set(networkArchetypeNodeId(archetype), {
    id: networkArchetypeNodeId(archetype),
    label: networkLabel(archetype),
    type: "archetype",
    archetype
  });
}

function networkAddEdge(
  edges: Map<string, NetworkBuildEdge>,
  edge: Omit<NetworkBuildEdge, "id">
) {
  const id = `${edge.type}:${edge.source}->${edge.target}`;
  edges.set(id, {
    ...edge,
    id,
    strength: networkRound(Math.max(1, Math.min(10, edge.strength)))
  });
}

function networkDegree(edges: NetworkBuildEdge[]) {
  return edges.reduce<Record<string, number>>((counts, edge) => {
    counts[edge.source] = (counts[edge.source] ?? 0) + 1;
    counts[edge.target] = (counts[edge.target] ?? 0) + 1;
    return counts;
  }, {});
}

function networkTopNodes(
  nodes: NetworkBuildNode[],
  degree: Record<string, number>,
  type: NetworkBuildNode["type"],
  limit: number
) {
  return nodes
    .filter((node) => node.type === type)
    .sort((first, second) => (degree[second.id] ?? 0) - (degree[first.id] ?? 0))
    .slice(0, limit);
}

function networkBridgeNodes(
  nodes: NetworkBuildNode[],
  edges: NetworkBuildEdge[],
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

function networkTopCluster(
  clusters: Array<{
    label: string;
    average_intervention_score: number;
    average_priority_score: number;
  }>,
  key: "average_intervention_score" | "average_priority_score"
) {
  return clusters
    .slice()
    .sort((first, second) => second[key] - first[key])[0];
}

function networkWeakestCluster(clusters: Array<{ label: string; average_validation_confidence: number }>) {
  return clusters
    .slice()
    .sort(
      (first, second) =>
        first.average_validation_confidence - second.average_validation_confidence
    )[0];
}

function networkConstraintNodeId(id: string) {
  return `constraint:${id}`;
}

function networkArchetypeNodeId(archetype: string) {
  return `archetype:${archetype}`;
}

function networkIndustryNodeId(industry: string) {
  return `industry:${networkSlug(industry)}`;
}

function networkInterventionNodeId(type: string) {
  return `intervention:${type}`;
}

function networkSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function networkLabel(value: string) {
  return value
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function networkAverage(values: number[]) {
  return networkRound(values.reduce((total, value) => total + value, 0) / values.length);
}

function networkRound(value: number) {
  return Math.round(value * 10) / 10;
}

function networkBuildWriteStableJson(path: string, output: Record<string, unknown>) {
  const stableOutput = networkBuildPreserveGeneratedAt(path, output);
  networkBuildWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function networkBuildPreserveGeneratedAt(
  path: string,
  output: Record<string, unknown>
) {
  if (!networkBuildExistsSync(path)) return output;
  const existing = JSON.parse(networkBuildReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const comparable = { ...existing, generated_at: output.generated_at };

  if (JSON.stringify(comparable) === JSON.stringify(output)) {
    return {
      ...output,
      generated_at: existing.generated_at
    };
  }

  return output;
}

networkBuildMain();
