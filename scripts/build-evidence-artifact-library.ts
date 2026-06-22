type ArtifactBuildFsModule = typeof import("node:fs");
type ArtifactBuildPathModule = typeof import("node:path");

const {
  existsSync: artifactBuildExistsSync,
  mkdirSync: artifactBuildMkdirSync,
  readFileSync: artifactBuildReadFileSync,
  writeFileSync: artifactBuildWriteFileSync
} = process.getBuiltinModule("fs") as ArtifactBuildFsModule;
const {
  dirname: artifactBuildDirname,
  resolve: artifactBuildResolve
} = process.getBuiltinModule("path") as ArtifactBuildPathModule;

const artifactBuildEvidencePackPath = artifactBuildResolve(
  "data/exports/evidence_packs.json"
);
const artifactBuildTaskPath = artifactBuildResolve(
  "data/exports/validation_tasks.json"
);
const artifactBuildTriagePath = artifactBuildResolve(
  "data/exports/validation_triage.json"
);
const artifactBuildPacketPath = artifactBuildResolve(
  "data/exports/validation_evidence_packets.json"
);
const artifactBuildCampaignPath = artifactBuildResolve(
  "data/exports/validation_campaigns.json"
);
const artifactBuildOutputPath = artifactBuildResolve(
  "data/exports/evidence_artifact_library.json"
);

type ArtifactType =
  | "primary_document"
  | "source_url"
  | "local_observation"
  | "metric_definition"
  | "claim_support_memo"
  | "intervention_pilot_plan";

type ArtifactBuildTask = {
  task_id: string;
  constraint_id: string;
  constraint_title: string;
  industry: string;
  task_type: string;
  priority_score: number;
  evidence_gap: string;
  source_gap: string;
  expected_artifact: string;
  blocking_reason: string;
  source_ids: string[];
  investigation_route: string;
  network_route: string;
};

type ArtifactBuildTriage = {
  constraint_id: string;
  constraint_title: string;
  industry: string;
  validation_burden_score: number;
  recalibrated_severity: string;
  task_clusters: Array<{
    cluster_type: string;
    task_count: number;
    max_priority_score: number;
    blocked_tasks: number;
    representative_task_ids: string[];
    rationale: string;
  }>;
  next_best_action: {
    action_title: string;
    rationale: string;
    expected_artifact: string;
  };
  investigation_route: string;
  network_route: string;
};

type ArtifactBuildPacket = {
  packet_id: string;
  constraint_id: string;
  constraint_title: string;
  industry: string;
  request_category: string;
  cluster_type: string;
  task_type: string;
  evidence_needed: string;
  expected_artifact: string;
  expected_confidence_impact: {
    estimated_score_lift: number;
    explanation: string;
  };
  decision_use: string;
  analyst_note: string;
  source_task_ids: string[];
  investigation_route: string;
  network_route: string;
};

type ArtifactBuildPack = {
  constraint_id: string;
  constraint_title: string;
  evidence_gaps: string[];
  provenance_status: string;
  defensibility_score: number;
  recommended_source_upgrade: string;
  audit_flags: string[];
  source_records: Array<{
    source_id: string;
    title: string;
    publisher: string;
    provenance_level: string;
    citation_status: string;
    trust_weight: number;
    verification_need: string;
  }>;
};

type ArtifactBuildCampaign = {
  selected_constraints: Array<{ constraint_id: string }>;
};

function artifactBuildMain() {
  const packs = artifactBuildReadJson<{ packs: ArtifactBuildPack[] }>(
    artifactBuildEvidencePackPath
  ).packs;
  const tasks = artifactBuildReadJson<{ tasks: ArtifactBuildTask[] }>(
    artifactBuildTaskPath
  ).tasks;
  const triage = artifactBuildReadJson<{
    constraint_level_triage: ArtifactBuildTriage[];
    topValidationQueue: ArtifactBuildTriage[];
  }>(artifactBuildTriagePath);
  const packets = artifactBuildReadJson<{ packets: ArtifactBuildPacket[] }>(
    artifactBuildPacketPath
  ).packets;
  const campaigns = artifactBuildReadJson<{ campaigns: ArtifactBuildCampaign[] }>(
    artifactBuildCampaignPath
  ).campaigns;
  const packByConstraint = new Map(packs.map((pack) => [pack.constraint_id, pack]));
  const taskById = new Map(tasks.map((task) => [task.task_id, task]));
  const artifacts = [
    ...packets.map((packet) => artifactBuildPacketArtifact(packet, packByConstraint)),
    ...artifactBuildTriageArtifacts(
      triage.constraint_level_triage,
      taskById,
      packByConstraint
    ),
    ...artifactBuildSourceArtifacts(packs)
  ].sort(
    (first, second) =>
      second.priority - first.priority ||
      first.constraint_title.localeCompare(second.constraint_title) ||
      first.artifact_id.localeCompare(second.artifact_id)
  );
  const output = {
    generated_at: new Date().toISOString(),
    summary: artifactBuildSummary(artifacts, packets, triage.topValidationQueue, campaigns),
    artifacts
  };

  artifactBuildMkdirSync(artifactBuildDirname(artifactBuildOutputPath), {
    recursive: true
  });
  artifactBuildWriteStableJson(artifactBuildOutputPath, output);
  console.log(
    `Built ${artifacts.length} evidence artifact needs at ${artifactBuildOutputPath}.`
  );
}

function artifactBuildPacketArtifact(
  packet: ArtifactBuildPacket,
  packByConstraint: Map<string, ArtifactBuildPack>
) {
  const pack = packByConstraint.get(packet.constraint_id);
  return {
    artifact_id: `artifact:packet:${artifactBuildSlug(packet.packet_id)}`,
    constraint_id: packet.constraint_id,
    constraint_title: packet.constraint_title,
    artifact_type: artifactBuildTypeForPacket(packet),
    artifact_title: packet.expected_artifact,
    why_needed: packet.evidence_needed,
    expected_source_owner: `${packet.industry} analyst or process owner`,
    source_category: packet.request_category,
    validation_question_answered: packet.decision_use,
    collection_method: artifactBuildCollectionMethod(packet.request_category),
    priority: artifactBuildRound(
      packet.expected_confidence_impact.estimated_score_lift * 2.2 + 5.4
    ),
    confidence_impact: packet.expected_confidence_impact.estimated_score_lift,
    related_task_ids: packet.source_task_ids,
    related_source_ids: pack?.source_records.map((source) => source.source_id) ?? [],
    related_packet_ids: [packet.packet_id],
    status: "not_collected",
    notes: [
      packet.analyst_note,
      packet.expected_confidence_impact.explanation,
      "Generated artifact request; no source has been collected yet."
    ],
    gaps: [packet.evidence_needed],
    investigation_route: packet.investigation_route,
    validation_route: `/validation?industry=${encodeURIComponent(packet.industry)}`,
    source_route: "/sources",
    network_route: packet.network_route
  };
}

function artifactBuildTriageArtifacts(
  triage: ArtifactBuildTriage[],
  taskById: Map<string, ArtifactBuildTask>,
  packByConstraint: Map<string, ArtifactBuildPack>
) {
  return triage.flatMap((item) =>
    item.task_clusters.map((cluster) => {
      const representative = cluster.representative_task_ids
        .map((taskId) => taskById.get(taskId))
        .find((task): task is ArtifactBuildTask => Boolean(task));
      const pack = packByConstraint.get(item.constraint_id);
      return {
        artifact_id: `artifact:cluster:${item.constraint_id}:${cluster.cluster_type}`,
        constraint_id: item.constraint_id,
        constraint_title: item.constraint_title,
        artifact_type: artifactBuildTypeForCluster(
          cluster.cluster_type,
          representative?.task_type
        ),
        artifact_title:
          representative?.expected_artifact ??
          `${cluster.cluster_type} artifact for ${item.constraint_title}`,
        why_needed: cluster.rationale,
        expected_source_owner: `${item.industry} analyst or process owner`,
        source_category: cluster.cluster_type,
        validation_question_answered: item.next_best_action.action_title,
        collection_method: artifactBuildCollectionMethod(cluster.cluster_type),
        priority: artifactBuildRound(
          cluster.max_priority_score * 0.58 + item.validation_burden_score * 0.34
        ),
        confidence_impact:
          cluster.cluster_type === "metric"
            ? 1.2
            : cluster.cluster_type === "source"
              ? 1
              : 0.9,
        related_task_ids: cluster.representative_task_ids,
        related_source_ids: pack?.source_records.map((source) => source.source_id) ?? [],
        related_packet_ids: [],
        status: "not_collected",
        notes: [item.next_best_action.rationale, item.recalibrated_severity],
        gaps: [
          representative?.evidence_gap,
          representative?.source_gap,
          representative?.blocking_reason
        ].filter((gap): gap is string => Boolean(gap)),
        investigation_route: item.investigation_route,
        validation_route: `/validation?industry=${encodeURIComponent(item.industry)}`,
        source_route: "/sources",
        network_route: item.network_route
      };
    })
  );
}

function artifactBuildSourceArtifacts(packs: ArtifactBuildPack[]) {
  return packs.flatMap((pack) =>
    pack.source_records.map((source) => ({
      artifact_id: `artifact:source:${pack.constraint_id}:${artifactBuildSlug(source.source_id)}`,
      constraint_id: pack.constraint_id,
      constraint_title: pack.constraint_title,
      artifact_type: artifactBuildTypeForCitation(source.citation_status),
      artifact_title: artifactBuildSourceTitle(source.title, source.citation_status),
      why_needed: pack.recommended_source_upgrade,
      expected_source_owner: source.publisher || "Source owner not identified",
      source_category: source.citation_status,
      validation_question_answered: `Does ${source.title} support ${pack.constraint_title}?`,
      collection_method: source.verification_need,
      priority: artifactBuildRound(
        Math.max(4, 10 - pack.defensibility_score) +
          Math.max(0, 8 - source.trust_weight) * 0.35
      ),
      confidence_impact: artifactBuildRound(Math.max(0.5, 1.4 - pack.defensibility_score * 0.08)),
      related_task_ids: [],
      related_source_ids: [source.source_id],
      related_packet_ids: [],
      status: "not_collected",
      notes: [
        `Provenance status: ${pack.provenance_status}.`,
        `Citation status: ${source.citation_status}.`
      ],
      gaps: [...pack.evidence_gaps, ...pack.audit_flags],
      investigation_route: `/constraints/${pack.constraint_id}`,
      validation_route: "/validation",
      source_route: "/sources",
      network_route: `/network?focus=${pack.constraint_id}`
    }))
  );
}

function artifactBuildSummary(
  artifacts: Array<ReturnType<typeof artifactBuildPacketArtifact>>,
  packets: ArtifactBuildPacket[],
  topQueue: ArtifactBuildTriage[],
  campaigns: ArtifactBuildCampaign[]
) {
  const artifactConstraints = new Set(artifacts.map((artifact) => artifact.constraint_id));
  const packetIds = new Set(artifacts.flatMap((artifact) => artifact.related_packet_ids));
  const campaignConstraintIds = new Set(
    campaigns.flatMap((campaign) =>
      campaign.selected_constraints.map((constraint) => constraint.constraint_id)
    )
  );

  return {
    artifact_count: artifacts.length,
    constraints_with_artifacts: artifactConstraints.size,
    top_packet_coverage:
      packets.length === 0
        ? 0
        : artifactBuildRound(
            (packets.filter((packet) => packetIds.has(packet.packet_id)).length /
              packets.length) *
              100
          ),
    campaign_constraint_coverage:
      campaignConstraintIds.size === 0
        ? 0
        : artifactBuildRound(
            (Array.from(campaignConstraintIds).filter((id) =>
              artifactConstraints.has(id)
            ).length /
              campaignConstraintIds.size) *
              100
          ),
    top_queue_constraint_coverage:
      topQueue.length === 0
        ? 0
        : artifactBuildRound(
            (topQueue.filter((item) => artifactConstraints.has(item.constraint_id))
              .length /
              topQueue.length) *
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
    artifact_type_distribution: artifactBuildDistribution(
      artifacts.map((artifact) => artifact.artifact_type)
    ),
    status_distribution: artifactBuildDistribution(
      artifacts.map((artifact) => artifact.status)
    )
  };
}

function artifactBuildTypeForPacket(packet: ArtifactBuildPacket): ArtifactType {
  if (packet.request_category === "metric") return "metric_definition";
  if (packet.request_category === "intervention") return "intervention_pilot_plan";
  if (packet.request_category === "source") {
    if (packet.task_type === "source_url_needed") return "source_url";
    if (packet.task_type === "local_observation_needed") return "local_observation";
    return "primary_document";
  }
  return "claim_support_memo";
}

function artifactBuildTypeForCluster(
  clusterType: string,
  taskType?: string
): ArtifactType {
  if (clusterType === "metric") return "metric_definition";
  if (clusterType === "intervention-blocking") return "intervention_pilot_plan";
  if (clusterType === "source") {
    if (taskType === "source_url_needed") return "source_url";
    if (taskType === "local_observation_needed") return "local_observation";
    return "primary_document";
  }
  return "claim_support_memo";
}

function artifactBuildTypeForCitation(status: string): ArtifactType {
  if (status === "needs-primary-document") return "primary_document";
  if (status === "local-observation-needed") return "local_observation";
  return "source_url";
}

function artifactBuildSourceTitle(title: string, status: string) {
  if (status === "needs-primary-document") return `Primary document for ${title}`;
  if (status === "local-observation-needed") {
    return `Local observation record for ${title}`;
  }
  return `Source URL and scope note for ${title}`;
}

function artifactBuildCollectionMethod(category: string) {
  if (category === "metric") return "Define metric owner, source, baseline, and collection window.";
  if (category === "source") return "Attach the source artifact and provenance note.";
  if (category === "intervention-blocking") return "Draft measurement-first pilot evidence.";
  return "Write a claim support memo tied to source evidence.";
}

function artifactBuildReadJson<T>(path: string) {
  return JSON.parse(artifactBuildReadFileSync(path, "utf8")) as T;
}

function artifactBuildWriteStableJson(path: string, output: Record<string, unknown>) {
  const stableOutput = artifactBuildPreserveGeneratedAt(path, output);
  artifactBuildWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function artifactBuildPreserveGeneratedAt(
  path: string,
  output: Record<string, unknown>
) {
  if (!artifactBuildExistsSync(path)) return output;
  const existing = JSON.parse(artifactBuildReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const comparable = { ...existing, generated_at: output.generated_at };
  if (JSON.stringify(comparable) === JSON.stringify(output)) {
    return { ...output, generated_at: existing.generated_at };
  }
  return output;
}

function artifactBuildDistribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function artifactBuildSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function artifactBuildRound(value: number) {
  return Math.round(value * 10) / 10;
}

artifactBuildMain();
