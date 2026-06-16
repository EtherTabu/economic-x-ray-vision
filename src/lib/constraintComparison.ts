import { getArchetypeLabel } from "@/lib/archetypeAnalysis";
import { buildConstraintNetwork } from "@/lib/constraintNetwork";
import { buildEvidencePackPortfolio } from "@/lib/evidencePacks";
import {
  buildInterventionStrategies,
  type InterventionStrategy
} from "@/lib/interventionSimulator";
import { buildValidationTaskPortfolio } from "@/lib/validationTasks";
import { buildValidationTriagePortfolio } from "@/lib/validationTriage";
import type { ConstraintScores, ScoredConstraint } from "@/types/constraint";

export type ComparisonCandidate = {
  id: string;
  title: string;
  industry: string;
  category: string;
  priority_score: number;
};

export type ConstraintComparisonRecord = {
  id: string;
  title: string;
  industry: string;
  category: string;
  description: string;
  primary_archetype: string;
  secondary_archetypes: string[];
  priority_score: number;
  validation_confidence: number;
  strategic_score: number;
  evidence_score: number;
  evidence_defensibility: number;
  source_quality: number;
  average_source_trust: number;
  citation_weaknesses: string[];
  source_count: number;
  intervention_priority: number;
  action_confidence: number;
  intervention_type: string;
  validation_burden: number;
  recalibrated_validation_severity: string;
  network_degree: number;
  cross_industry_bridge_count: number;
  top_network_edge: string;
  scores: ConstraintScores;
  why_it_matters: string;
  validation_risk: string;
  source_risk: string;
  intervention_readiness: string;
  route: string;
  network_route: string;
};

export type ComparisonDimension = {
  key: string;
  label: string;
  higher_is_better: boolean;
  values: Record<string, number | string>;
};

export type PairwiseComparison = {
  leader_id: string;
  leader_title: string;
  compared_id: string;
  compared_title: string;
  priority_gap: number;
  explanation: string;
  tradeoff: string;
};

export type ConstraintComparison = {
  selected_ids: string[];
  records: ConstraintComparisonRecord[];
  ranking: ConstraintComparisonRecord[];
  dimensions: ComparisonDimension[];
  pairwise: PairwiseComparison[];
  summary: {
    selected_count: number;
    highest_priority: string;
    strongest_evidence: string;
    best_intervention_readiness: string;
    highest_validation_burden: string;
    closest_comparison: string;
  };
  unsupported_dimensions: string[];
};

export type ConstraintComparisonPortfolio = {
  candidates: ComparisonCandidate[];
  records: ConstraintComparisonRecord[];
  default_selected_ids: string[];
  unsupported_dimensions: string[];
};

export function buildConstraintComparisonPortfolio(
  constraints: ScoredConstraint[]
): ConstraintComparisonPortfolio {
  const evidencePortfolio = buildEvidencePackPortfolio(constraints);
  const evidenceByConstraint = new Map(
    evidencePortfolio.packs.map((pack) => [pack.constraint_id, pack])
  );
  const strategies = buildInterventionStrategies(constraints);
  const strategyByConstraint = new Map(
    strategies.map((strategy) => [strategy.constraint_id, strategy])
  );
  const taskPortfolio = buildValidationTaskPortfolio(constraints);
  const triagePortfolio = buildValidationTriagePortfolio(taskPortfolio.tasks);
  const triageByConstraint = new Map(
    triagePortfolio.constraint_triage.map((triage) => [triage.constraint_id, triage])
  );
  const network = buildConstraintNetwork(constraints);
  const networkContext = buildNetworkContext(network.edges);

  const records = constraints
    .map((constraint) => {
      const evidencePack = evidenceByConstraint.get(constraint.id);
      const strategy = strategyByConstraint.get(constraint.id);
      const triage = triageByConstraint.get(constraint.id);
      const context = networkContext.get(`constraint:${constraint.id}`) ?? {
        degree: 0,
        crossIndustryBridgeCount: 0,
        topEdge: "No network edge"
      };

      return buildComparisonRecord({
        constraint,
        evidencePack,
        strategy,
        triage,
        networkContext: context
      });
    })
    .sort(
      (first, second) =>
        second.priority_score - first.priority_score ||
        first.title.localeCompare(second.title)
    );

  return {
    candidates: records.map((record) => ({
      id: record.id,
      title: record.title,
      industry: record.industry,
      category: record.category,
      priority_score: record.priority_score
    })),
    records,
    default_selected_ids: records.slice(0, 3).map((record) => record.id),
    unsupported_dimensions: []
  };
}

export function buildConstraintComparison(
  portfolio: ConstraintComparisonPortfolio,
  selectedIds: string[]
): ConstraintComparison {
  const normalizedIds = normalizeSelectedIds(
    selectedIds,
    portfolio.default_selected_ids
  );
  const selectedRecords = normalizedIds
    .map((id) => portfolio.records.find((record) => record.id === id))
    .filter((record): record is ConstraintComparisonRecord => Boolean(record));
  const records =
    selectedRecords.length >= 2
      ? selectedRecords
      : portfolio.default_selected_ids
          .map((id) => portfolio.records.find((record) => record.id === id))
          .filter((record): record is ConstraintComparisonRecord => Boolean(record));
  const ranking = records
    .slice()
    .sort(
      (first, second) =>
        second.priority_score - first.priority_score ||
        second.strategic_score - first.strategic_score
    );

  return {
    selected_ids: records.map((record) => record.id),
    records,
    ranking,
    dimensions: buildDimensions(records),
    pairwise: buildPairwiseComparisons(ranking),
    summary: buildSummary(records, ranking),
    unsupported_dimensions: portfolio.unsupported_dimensions
  };
}

function buildComparisonRecord({
  constraint,
  evidencePack,
  networkContext,
  strategy,
  triage
}: {
  constraint: ScoredConstraint;
  evidencePack?: {
    defensibility_score: number;
    source_records: Array<{
      trust_weight: number;
      citation_status: string;
    }>;
    recommended_source_upgrade: string;
    provenance_status: string;
  };
  strategy?: InterventionStrategy;
  triage?: {
    validation_burden_score: number;
    recalibrated_severity: string;
  };
  networkContext: {
    degree: number;
    crossIndustryBridgeCount: number;
    topEdge: string;
  };
}): ConstraintComparisonRecord {
  const sourceRecords = evidencePack?.source_records ?? [];
  const citationWeaknesses = Array.from(
    new Set(
      sourceRecords
        .map((source) => source.citation_status)
        .filter((status) => status !== "complete")
    )
  );
  const averageSourceTrust =
    sourceRecords.length > 0
      ? round(
          sourceRecords.reduce((sum, source) => sum + source.trust_weight, 0) /
            sourceRecords.length
        )
      : constraint.source_quality;
  const defensibility = evidencePack?.defensibility_score ?? constraint.scores.evidence_score;
  const actionConfidence = strategy?.action_confidence ?? 0;

  return {
    id: constraint.id,
    title: constraint.title,
    industry: constraint.industry,
    category: constraint.category,
    description: constraint.description,
    primary_archetype: getArchetypeLabel(constraint.primary_archetype),
    secondary_archetypes: constraint.secondary_archetypes.map(getArchetypeLabel),
    priority_score: constraint.scores.total_priority_score,
    validation_confidence: constraint.scores.validation_confidence_score,
    strategic_score: constraint.scores.total_strategic_score,
    evidence_score: constraint.scores.evidence_score,
    evidence_defensibility: defensibility,
    source_quality: constraint.source_quality,
    average_source_trust: averageSourceTrust,
    citation_weaknesses: citationWeaknesses,
    source_count: sourceRecords.length,
    intervention_priority: strategy?.intervention_priority_score ?? 0,
    action_confidence: actionConfidence,
    intervention_type: strategy?.intervention_type.replaceAll("_", " ") ?? "unknown",
    validation_burden: triage?.validation_burden_score ?? 0,
    recalibrated_validation_severity: triage?.recalibrated_severity ?? "None",
    network_degree: networkContext.degree,
    cross_industry_bridge_count: networkContext.crossIndustryBridgeCount,
    top_network_edge: networkContext.topEdge,
    scores: constraint.scores,
    why_it_matters: `${constraint.category} in ${constraint.related_processes[0]} affects ${constraint.downstream_constraints[0]}.`,
    validation_risk: validationRisk(constraint.scores.validation_confidence_score, defensibility),
    source_risk:
      citationWeaknesses.length > 0
        ? `${citationWeaknesses.join(", ")}; ${evidencePack?.recommended_source_upgrade ?? "source upgrade needed"}`
        : "No major citation weakness flagged by the local evidence pack.",
    intervention_readiness: interventionReadiness(actionConfidence),
    route: `/constraints/${constraint.id}`,
    network_route: `/network?focus=${constraint.id}`
  };
}

function buildDimensions(records: ConstraintComparisonRecord[]) {
  return [
    scoreDimension("priority", "Priority score", true, records, "priority_score"),
    scoreDimension(
      "validation",
      "Validation confidence",
      true,
      records,
      "validation_confidence"
    ),
    scoreDimension(
      "defensibility",
      "Evidence defensibility",
      true,
      records,
      "evidence_defensibility"
    ),
    scoreDimension("sourceTrust", "Average source trust", true, records, "average_source_trust"),
    scoreDimension(
      "intervention",
      "Intervention readiness",
      true,
      records,
      "action_confidence"
    ),
    scoreDimension("burden", "Validation burden", false, records, "validation_burden"),
    scoreDimension("network", "Network degree", true, records, "network_degree"),
    {
      key: "archetype",
      label: "Primary archetype",
      higher_is_better: false,
      values: Object.fromEntries(
        records.map((record) => [record.id, record.primary_archetype])
      )
    }
  ];
}

function buildPairwiseComparisons(records: ConstraintComparisonRecord[]) {
  const leader = records[0];
  if (!leader) return [];

  return records.slice(1).map((record) => {
    const priorityGap = round(leader.priority_score - record.priority_score);
    return {
      leader_id: leader.id,
      leader_title: leader.title,
      compared_id: record.id,
      compared_title: record.title,
      priority_gap: priorityGap,
      explanation: explainPriorityGap(leader, record, priorityGap),
      tradeoff: explainTradeoff(leader, record)
    };
  });
}

function explainPriorityGap(
  leader: ConstraintComparisonRecord,
  compared: ConstraintComparisonRecord,
  priorityGap: number
) {
  const drivers = [
    scoreGap("severity", leader.scores.severity_score, compared.scores.severity_score),
    scoreGap("solvability", leader.scores.solvability_score, compared.scores.solvability_score),
    scoreGap("AI readiness", leader.scores.ai_readiness_score, compared.scores.ai_readiness_score),
    scoreGap(
      "overlooked opportunity",
      leader.scores.overlooked_opportunity_score,
      compared.scores.overlooked_opportunity_score
    ),
    scoreGap(
      "validation confidence",
      leader.validation_confidence,
      compared.validation_confidence
    )
  ]
    .filter((driver) => driver.gap > 0)
    .sort((first, second) => second.gap - first.gap)
    .slice(0, 3);

  if (priorityGap <= 0) {
    return `${leader.title} does not outrank ${compared.title} on priority; the two records should be compared by validation risk and action readiness instead.`;
  }

  if (drivers.length === 0) {
    return `${leader.title} outranks ${compared.title} by ${priorityGap.toFixed(1)} priority points through small combined advantages across the scoring model.`;
  }

  return `${leader.title} outranks ${compared.title} by ${priorityGap.toFixed(1)} priority points, mainly through ${drivers
    .map((driver) => `${driver.label} (+${driver.gap.toFixed(1)})`)
    .join(", ")}.`;
}

function explainTradeoff(
  leader: ConstraintComparisonRecord,
  compared: ConstraintComparisonRecord
) {
  const tradeoffs = [
    scoreGap(
      "validation confidence",
      compared.validation_confidence,
      leader.validation_confidence
    ),
    scoreGap(
      "evidence defensibility",
      compared.evidence_defensibility,
      leader.evidence_defensibility
    ),
    scoreGap("action confidence", compared.action_confidence, leader.action_confidence),
    scoreGap("source trust", compared.average_source_trust, leader.average_source_trust)
  ]
    .filter((tradeoff) => tradeoff.gap >= 0.4)
    .sort((first, second) => second.gap - first.gap);

  if (tradeoffs.length === 0) {
    return `${leader.title} does not carry an obvious defensibility penalty relative to ${compared.title} in the current local evidence layer.`;
  }

  const top = tradeoffs[0];
  return `${compared.title} is stronger on ${top.label} (+${top.gap.toFixed(1)}), so the higher-ranked record should still be treated as a hypothesis until that gap is closed.`;
}

function buildSummary(
  records: ConstraintComparisonRecord[],
  ranking: ConstraintComparisonRecord[]
): ConstraintComparison["summary"] {
  const strongestEvidence = topBy(records, (record) => record.evidence_defensibility);
  const bestReadiness = topBy(records, (record) => record.action_confidence);
  const highestBurden = topBy(records, (record) => record.validation_burden);

  return {
    selected_count: records.length,
    highest_priority: ranking[0]?.title ?? "None",
    strongest_evidence: strongestEvidence?.title ?? "None",
    best_intervention_readiness: bestReadiness?.title ?? "None",
    highest_validation_burden: highestBurden?.title ?? "None",
    closest_comparison: closestComparison(records)
  };
}

function buildNetworkContext(
  edges: Array<{ source: string; target: string; type: string; strength: number; label: string }>
) {
  const context = new Map<
    string,
    { degree: number; crossIndustryBridgeCount: number; topEdge: string }
  >();

  edges.forEach((edge) => {
    [edge.source, edge.target].forEach((nodeId) => {
      if (!nodeId.startsWith("constraint:")) return;
      const current = context.get(nodeId) ?? {
        degree: 0,
        crossIndustryBridgeCount: 0,
        topEdge: "No network edge"
      };
      const currentTop = edges.find((candidate) => candidate.label === current.topEdge);
      const topEdge =
        !currentTop || edge.strength > currentTop.strength ? edge.label : current.topEdge;

      context.set(nodeId, {
        degree: current.degree + 1,
        crossIndustryBridgeCount:
          current.crossIndustryBridgeCount +
          (edge.type === "cross_industry_analog" ? 1 : 0),
        topEdge
      });
    });
  });

  return context;
}

function scoreDimension(
  key: string,
  label: string,
  higherIsBetter: boolean,
  records: ConstraintComparisonRecord[],
  field: keyof Pick<
    ConstraintComparisonRecord,
    | "priority_score"
    | "validation_confidence"
    | "evidence_defensibility"
    | "average_source_trust"
    | "action_confidence"
    | "validation_burden"
    | "network_degree"
  >
): ComparisonDimension {
  return {
    key,
    label,
    higher_is_better: higherIsBetter,
    values: Object.fromEntries(records.map((record) => [record.id, record[field]]))
  };
}

function normalizeSelectedIds(selectedIds: string[], defaults: string[]) {
  const uniqueIds = Array.from(new Set(selectedIds.filter(Boolean)));
  const normalized = uniqueIds.length >= 2 ? uniqueIds : defaults;
  return normalized.slice(0, 4);
}

function validationRisk(validationConfidence: number, defensibility: number) {
  if (validationConfidence < 5.5 || defensibility < 5.5) return "High";
  if (validationConfidence < 7 || defensibility < 6.5) return "Moderate";
  return "Low";
}

function interventionReadiness(actionConfidence: number) {
  if (actionConfidence >= 7) return "Ready for narrow pilot";
  if (actionConfidence >= 5.5) return "Measurement-first pilot";
  return "Evidence needed before action";
}

function scoreGap(label: string, first: number, second: number) {
  return {
    label,
    gap: round(first - second)
  };
}

function topBy(
  records: ConstraintComparisonRecord[],
  selector: (record: ConstraintComparisonRecord) => number
) {
  return records.slice().sort((first, second) => selector(second) - selector(first))[0];
}

function closestComparison(records: ConstraintComparisonRecord[]) {
  if (records.length < 2) return "Not enough records selected";
  const pairs = records.flatMap((first, index) =>
    records.slice(index + 1).map((second) => ({
      label: `${first.title} vs ${second.title}`,
      gap: Math.abs(first.priority_score - second.priority_score)
    }))
  );
  return pairs.sort((first, second) => first.gap - second.gap)[0]?.label ?? "None";
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
