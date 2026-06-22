import { buildEvidencePackPortfolio, type EvidencePack } from "@/lib/evidencePacks";
import {
  buildValidationEvidencePacketPortfolio,
  type ValidationEvidencePacket
} from "@/lib/validationEvidencePackets";
import {
  buildValidationTaskPortfolio,
  type ValidationTask,
  type ValidationTaskType
} from "@/lib/validationTasks";
import {
  buildValidationTriagePortfolio,
  type ConstraintValidationTriage,
  type ValidationTaskClusterType
} from "@/lib/validationTriage";
import type { ScoredConstraint } from "@/types/constraint";

export type EvidenceArtifactType =
  | "primary_document"
  | "source_url"
  | "local_observation"
  | "metric_definition"
  | "operating_metric"
  | "process_log"
  | "screenshot"
  | "public_record"
  | "dataset_extract"
  | "claim_support_memo"
  | "intervention_pilot_plan";

export type EvidenceArtifactStatus = "needed" | "not_collected";

export type EvidenceArtifactNeed = {
  artifact_id: string;
  constraint_id: string;
  constraint_title: string;
  artifact_type: EvidenceArtifactType;
  artifact_title: string;
  why_needed: string;
  expected_source_owner: string;
  source_category: string;
  validation_question_answered: string;
  collection_method: string;
  priority: number;
  confidence_impact: number;
  related_task_ids: string[];
  related_source_ids: string[];
  related_packet_ids: string[];
  status: EvidenceArtifactStatus;
  notes: string[];
  gaps: string[];
  investigation_route: string;
  validation_route: string;
  source_route: string;
  network_route: string;
};

export type EvidenceArtifactLibrarySummary = {
  artifact_count: number;
  constraints_with_artifacts: number;
  top_packet_coverage: number;
  campaign_constraint_coverage: number;
  primary_evidence_needed_count: number;
  constraints_blocked_by_missing_artifacts: number;
  high_priority_artifact_count: number;
  artifact_type_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
};

export type EvidenceArtifactLibrary = {
  summary: EvidenceArtifactLibrarySummary;
  artifacts: EvidenceArtifactNeed[];
};

export function buildEvidenceArtifactLibrary(
  constraints: ScoredConstraint[]
): EvidenceArtifactLibrary {
  const taskPortfolio = buildValidationTaskPortfolio(constraints);
  const triagePortfolio = buildValidationTriagePortfolio(taskPortfolio.tasks);
  const packetPortfolio = buildValidationEvidencePacketPortfolio(triagePortfolio);
  const evidencePackPortfolio = buildEvidencePackPortfolio(constraints);
  const taskById = new Map(taskPortfolio.tasks.map((task) => [task.task_id, task]));
  const packByConstraint = new Map(
    evidencePackPortfolio.packs.map((pack) => [pack.constraint_id, pack])
  );
  const artifacts = [
    ...packetArtifacts(packetPortfolio.packets, packByConstraint),
    ...triageClusterArtifacts(triagePortfolio.constraint_triage, taskById, packByConstraint),
    ...sourceArtifacts(evidencePackPortfolio.packs)
  ]
    .sort(
      (first, second) =>
        second.priority - first.priority ||
        first.constraint_title.localeCompare(second.constraint_title) ||
        first.artifact_id.localeCompare(second.artifact_id)
    );

  return {
    summary: summarizeArtifacts(
      artifacts,
      packetPortfolio.packets,
      triagePortfolio.topValidationQueue
    ),
    artifacts
  };
}

export function artifactNeedsForConstraint(
  library: EvidenceArtifactLibrary,
  constraintId: string
) {
  return library.artifacts.filter((artifact) => artifact.constraint_id === constraintId);
}

export function artifactNeedsForPacket(
  library: EvidenceArtifactLibrary,
  packetId: string
) {
  return library.artifacts.filter((artifact) =>
    artifact.related_packet_ids.includes(packetId)
  );
}

function packetArtifacts(
  packets: ValidationEvidencePacket[],
  packByConstraint: Map<string, EvidencePack>
) {
  return packets.map((packet) => {
    const pack = packByConstraint.get(packet.constraint_id);
    return {
      artifact_id: `artifact:packet:${slug(packet.packet_id)}`,
      constraint_id: packet.constraint_id,
      constraint_title: packet.constraint_title,
      artifact_type: artifactTypeForPacket(packet),
      artifact_title: packet.expected_artifact,
      why_needed: packet.evidence_needed,
      expected_source_owner: expectedOwner(packet.industry, packet.request_category),
      source_category: packet.request_category,
      validation_question_answered: packet.triage_action,
      collection_method: collectionMethodForPacket(packet),
      priority: round(
        packet.validation_burden_score * 0.55 +
          packet.expected_confidence_impact.estimated_score_lift * 2.2
      ),
      confidence_impact: packet.expected_confidence_impact.estimated_score_lift,
      related_task_ids: packet.source_task_ids,
      related_source_ids: pack?.source_records.map((source) => source.source_id) ?? [],
      related_packet_ids: [packet.packet_id],
      status: "not_collected" as const,
      notes: [
        packet.analyst_note,
        packet.expected_confidence_impact.explanation,
        packet.decision_use
      ],
      gaps: [...packet.fail_criteria],
      investigation_route: packet.investigation_route,
      validation_route: `/validation?industry=${encodeURIComponent(packet.industry)}`,
      source_route: "/sources",
      network_route: packet.network_route
    } satisfies EvidenceArtifactNeed;
  });
}

function triageClusterArtifacts(
  triageRecords: ConstraintValidationTriage[],
  taskById: Map<string, ValidationTask>,
  packByConstraint: Map<string, EvidencePack>
) {
  return triageRecords.flatMap((triage) =>
    triage.task_clusters.map((cluster) => {
      const representativeTask = cluster.representative_task_ids
        .map((id) => taskById.get(id))
        .find((task): task is ValidationTask => Boolean(task));
      const pack = packByConstraint.get(triage.constraint_id);
      const artifactType = artifactTypeForCluster(
        cluster.cluster_type,
        representativeTask?.task_type
      );

      return {
        artifact_id: `artifact:cluster:${triage.constraint_id}:${cluster.cluster_type}`,
        constraint_id: triage.constraint_id,
        constraint_title: triage.constraint_title,
        artifact_type: artifactType,
        artifact_title:
          representativeTask?.expected_artifact ??
          `${clusterLabel(cluster.cluster_type)} artifact for ${triage.constraint_title}`,
        why_needed: cluster.rationale,
        expected_source_owner: expectedOwner(triage.industry, cluster.cluster_type),
        source_category: cluster.cluster_type,
        validation_question_answered: triage.next_best_action.action_title,
        collection_method: collectionMethodForCluster(cluster.cluster_type),
        priority: round(
          cluster.max_priority_score * 0.55 +
            triage.validation_burden_score * 0.35 +
            Math.min(2, cluster.task_count * 0.12)
        ),
        confidence_impact: confidenceImpactForCluster(cluster.cluster_type),
        related_task_ids: cluster.representative_task_ids,
        related_source_ids: pack?.source_records.map((source) => source.source_id) ?? [],
        related_packet_ids: [],
        status: "not_collected" as const,
        notes: [triage.rationale, triage.next_best_action.rationale],
        gaps: [
          representativeTask?.evidence_gap,
          representativeTask?.source_gap,
          representativeTask?.blocking_reason
        ].filter((gap): gap is string => Boolean(gap)),
        investigation_route: triage.investigation_route,
        validation_route: `/validation?industry=${encodeURIComponent(triage.industry)}`,
        source_route: "/sources",
        network_route: triage.network_route
      } satisfies EvidenceArtifactNeed;
    })
  );
}

function sourceArtifacts(packs: EvidencePack[]) {
  return packs.flatMap((pack) =>
    pack.source_records.map((source) => {
      const artifactType = artifactTypeForCitationStatus(source.citation_status);
      return {
        artifact_id: `artifact:source:${pack.constraint_id}:${slug(source.source_id)}`,
        constraint_id: pack.constraint_id,
        constraint_title: pack.constraint_title,
        artifact_type: artifactType,
        artifact_title: sourceArtifactTitle(source.title, artifactType),
        why_needed: pack.recommended_source_upgrade,
        expected_source_owner: source.publisher || "Source owner not identified",
        source_category: source.citation_status,
        validation_question_answered: `Does ${source.title} directly support ${pack.constraint_title}?`,
        collection_method: source.verification_need,
        priority: round(
          Math.max(4, 10 - pack.defensibility_score) +
            Math.max(0, 8 - source.trust_weight) * 0.35
        ),
        confidence_impact: round(Math.max(0.5, 1.4 - pack.defensibility_score * 0.08)),
        related_task_ids: [],
        related_source_ids: [source.source_id],
        related_packet_ids: [],
        status: "not_collected" as const,
        notes: [
          `Current provenance status: ${pack.provenance_status}.`,
          `Current citation status: ${source.citation_status}.`,
          `Trust weight: ${source.trust_weight.toFixed(1)}.`
        ],
        gaps: [...pack.evidence_gaps, ...pack.audit_flags],
        investigation_route: `/constraints/${pack.constraint_id}`,
        validation_route: "/validation",
        source_route: "/sources",
        network_route: `/network?focus=${pack.constraint_id}`
      } satisfies EvidenceArtifactNeed;
    })
  );
}

function artifactTypeForPacket(packet: ValidationEvidencePacket): EvidenceArtifactType {
  if (packet.request_category === "metric") return "metric_definition";
  if (packet.request_category === "intervention") return "intervention_pilot_plan";
  if (packet.request_category === "source") {
    if (packet.task_type === "local_observation_needed") return "local_observation";
    if (packet.task_type === "source_url_needed") return "source_url";
    return "primary_document";
  }
  return "claim_support_memo";
}

function artifactTypeForCluster(
  clusterType: ValidationTaskClusterType,
  taskType?: ValidationTaskType
): EvidenceArtifactType {
  if (clusterType === "metric") return "metric_definition";
  if (clusterType === "intervention-blocking") return "intervention_pilot_plan";
  if (clusterType === "source") {
    if (taskType === "source_url_needed") return "source_url";
    if (taskType === "local_observation_needed") return "local_observation";
    return "primary_document";
  }
  return "claim_support_memo";
}

function artifactTypeForCitationStatus(status: string): EvidenceArtifactType {
  if (status === "needs-primary-document") return "primary_document";
  if (status === "local-observation-needed") return "local_observation";
  return "source_url";
}

function sourceArtifactTitle(sourceTitle: string, artifactType: EvidenceArtifactType) {
  if (artifactType === "primary_document") return `Primary document for ${sourceTitle}`;
  if (artifactType === "local_observation") {
    return `Local observation record for ${sourceTitle}`;
  }
  return `Source URL and scope note for ${sourceTitle}`;
}

function collectionMethodForPacket(packet: ValidationEvidencePacket) {
  if (packet.request_category === "metric") {
    return "Define metric owner, data source, baseline window, and repeatable collection method.";
  }
  if (packet.request_category === "source") {
    return "Attach the named source artifact, provenance note, and applicability note.";
  }
  if (packet.request_category === "intervention") {
    return "Draft a bounded pilot artifact with success metric and stop condition.";
  }
  return "Write a claim support memo tying source evidence to the unresolved claim.";
}

function collectionMethodForCluster(clusterType: ValidationTaskClusterType) {
  if (clusterType === "metric") {
    return "Create a metric definition and baseline collection plan.";
  }
  if (clusterType === "source") {
    return "Collect or identify the missing source artifact and provenance trail.";
  }
  if (clusterType === "intervention-blocking") {
    return "Create a measurement-first intervention validation plan.";
  }
  return "Collect claim-level support or contradiction evidence.";
}

function expectedOwner(industry: string, category: string) {
  if (category === "metric") return `${industry} metric owner or process analyst`;
  if (category === "source") return `${industry} source owner or records custodian`;
  if (category === "intervention-blocking") {
    return `${industry} operations owner or pilot lead`;
  }
  return `${industry} analyst or process owner`;
}

function confidenceImpactForCluster(clusterType: ValidationTaskClusterType) {
  if (clusterType === "metric") return 1.2;
  if (clusterType === "source") return 1;
  if (clusterType === "intervention-blocking") return 0.8;
  return 0.9;
}

function summarizeArtifacts(
  artifacts: EvidenceArtifactNeed[],
  packets: ValidationEvidencePacket[],
  topQueue: ConstraintValidationTriage[]
): EvidenceArtifactLibrarySummary {
  const packetIdsWithArtifacts = new Set(
    artifacts.flatMap((artifact) => artifact.related_packet_ids)
  );
  const campaignConstraintIds = new Set(
    topQueue.slice(0, 10).map((item) => item.constraint_id)
  );
  const artifactConstraintIds = new Set(
    artifacts.map((artifact) => artifact.constraint_id)
  );

  return {
    artifact_count: artifacts.length,
    constraints_with_artifacts: artifactConstraintIds.size,
    top_packet_coverage:
      packets.length === 0
        ? 0
        : round((packets.filter((packet) => packetIdsWithArtifacts.has(packet.packet_id)).length /
            packets.length) *
            100),
    campaign_constraint_coverage:
      campaignConstraintIds.size === 0
        ? 0
        : round(
            (Array.from(campaignConstraintIds).filter((id) =>
              artifactConstraintIds.has(id)
            ).length /
              campaignConstraintIds.size) *
              100
          ),
    primary_evidence_needed_count: artifacts.filter(
      (artifact) => artifact.artifact_type === "primary_document"
    ).length,
    constraints_blocked_by_missing_artifacts: new Set(
      artifacts
        .filter((artifact) => artifact.priority >= 8 || artifact.gaps.length > 0)
        .map((artifact) => artifact.constraint_id)
    ).size,
    high_priority_artifact_count: artifacts.filter((artifact) => artifact.priority >= 8)
      .length,
    artifact_type_distribution: distribution(
      artifacts.map((artifact) => artifact.artifact_type)
    ),
    status_distribution: distribution(artifacts.map((artifact) => artifact.status))
  };
}

function clusterLabel(clusterType: ValidationTaskClusterType) {
  if (clusterType === "intervention-blocking") return "intervention validation";
  return clusterType;
}

function distribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
