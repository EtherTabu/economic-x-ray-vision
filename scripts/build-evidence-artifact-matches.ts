type EvidenceMatchFsModule = typeof import("node:fs");
type EvidenceMatchPathModule = typeof import("node:path");

const {
  existsSync: evidenceMatchExistsSync,
  mkdirSync: evidenceMatchMkdirSync,
  readFileSync: evidenceMatchReadFileSync,
  writeFileSync: evidenceMatchWriteFileSync
} = process.getBuiltinModule("fs") as EvidenceMatchFsModule;
const {
  dirname: evidenceMatchDirname,
  resolve: evidenceMatchResolve
} = process.getBuiltinModule("path") as EvidenceMatchPathModule;

const evidenceMatchArtifactPath = evidenceMatchResolve(
  "data/exports/evidence_artifact_library.json"
);
const evidenceMatchImportPath = evidenceMatchResolve(
  "data/exports/evidence_import_registry.json"
);
const evidenceMatchPacketPath = evidenceMatchResolve(
  "data/exports/validation_evidence_packets.json"
);
const evidenceMatchOutputPath = evidenceMatchResolve(
  "data/exports/evidence_artifact_matches.json"
);

type EvidenceMatchArtifact = {
  artifact_id: string;
  constraint_id: string;
  constraint_title: string;
  artifact_type: string;
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
  status: string;
  gaps: string[];
  investigation_route: string;
  validation_route: string;
  source_route: string;
  network_route: string;
};

type EvidenceMatchImport = {
  evidence_id: string;
  title: string;
  artifact_id: string | null;
  related_artifact_ids: string[];
  constraint_id: string | null;
  related_constraint_ids: string[];
  source_record_id: string | null;
  artifact_type: string;
  evidence_type: string;
  provenance_status: string;
  collection_status: string;
  review_status: string;
  source_url: string | null;
  local_file_reference: string | null;
  claim_support_summary: string;
  validation_metric_supported: string;
  notes: string;
  tags: string[];
  import_file: string;
  linked_artifact_ids: string[];
  linked_constraint_ids: string[];
  linked_source_ids: string[];
  validation_errors: string[];
};

type EvidenceMatchPacket = {
  packet_id: string;
  constraint_id: string;
  constraint_title: string;
  triage_rank: number;
  expected_artifact: string;
};

type EvidenceMatchRecord = {
  match_id: string;
  artifact_id: string;
  artifact_title: string;
  constraint_id: string;
  constraint_title: string;
  evidence_id: string;
  evidence_title: string;
  match_type: "explicit_artifact" | "constraint_candidate" | "source_candidate";
  match_strength: "direct" | "candidate";
  coverage_status:
    | "matched"
    | "candidate"
    | "blocked"
    | "rejected_no_coverage";
  coverage_rationale: string;
  collection_status: string;
  review_status: string;
  provenance_status: string;
  source_url_present: boolean;
  local_file_reference_present: boolean;
};

function evidenceMatchMain() {
  const artifactExport = evidenceMatchReadJson<{
    summary: { artifact_count: number; artifact_type_distribution: Record<string, number> };
    artifacts: EvidenceMatchArtifact[];
  }>(evidenceMatchArtifactPath);
  const importExport = evidenceMatchReadJson<{
    import_count: number;
    imports: EvidenceMatchImport[];
  }>(evidenceMatchImportPath);
  const packetExport = evidenceMatchReadJson<{ packets: EvidenceMatchPacket[] }>(
    evidenceMatchPacketPath
  );

  const artifacts = artifactExport.artifacts;
  const imports = importExport.imports;
  const matches = evidenceMatchBuildMatches(artifacts, imports).sort(
    (first, second) =>
      first.artifact_id.localeCompare(second.artifact_id) ||
      first.evidence_id.localeCompare(second.evidence_id)
  );
  const artifactCoverage = evidenceMatchBuildArtifactCoverage(artifacts, matches);
  const topPacketCoverage = evidenceMatchBuildPacketCoverage(
    packetExport.packets,
    artifactCoverage
  );
  const output = {
    generated_at: new Date().toISOString(),
    summary: evidenceMatchSummary(
      imports,
      artifacts,
      matches,
      artifactCoverage,
      topPacketCoverage
    ),
    next_import_actions: evidenceMatchNextImportActions(artifactCoverage, topPacketCoverage),
    top_validation_packet_coverage: topPacketCoverage,
    top_uncovered_artifact_needs: artifactCoverage
      .filter((artifact) => artifact.coverage_status === "uncovered")
      .slice()
      .sort(
        (first, second) =>
          second.priority - first.priority ||
          first.constraint_title.localeCompare(second.constraint_title)
      )
      .slice(0, 12),
    matches,
    artifact_coverage: artifactCoverage
  };

  evidenceMatchMkdirSync(evidenceMatchDirname(evidenceMatchOutputPath), {
    recursive: true
  });
  evidenceMatchWriteStableJson(evidenceMatchOutputPath, output);
  console.log(
    `Built evidence artifact matching workspace for ${artifacts.length} artifact need(s) and ${imports.length} import(s).`
  );
}

function evidenceMatchBuildMatches(
  artifacts: EvidenceMatchArtifact[],
  imports: EvidenceMatchImport[]
): EvidenceMatchRecord[] {
  const artifactById = new Map(
    artifacts.map((artifact) => [artifact.artifact_id, artifact])
  );
  const artifactsByConstraint = evidenceMatchGroupBy(
    artifacts,
    (artifact) => artifact.constraint_id
  );
  const artifactsBySource = new Map<string, EvidenceMatchArtifact[]>();
  artifacts.forEach((artifact) => {
    artifact.related_source_ids.forEach((sourceId) => {
      artifactsBySource.set(sourceId, [
        ...(artifactsBySource.get(sourceId) ?? []),
        artifact
      ]);
    });
  });

  return imports.flatMap((evidence) => {
    const explicitArtifactIds = Array.from(
      new Set([
        evidence.artifact_id,
        ...evidence.related_artifact_ids,
        ...evidence.linked_artifact_ids
      ].filter(evidenceMatchIsString))
    );
    const explicitArtifacts = explicitArtifactIds
      .map((artifactId) => artifactById.get(artifactId))
      .filter((artifact): artifact is EvidenceMatchArtifact => Boolean(artifact));

    if (explicitArtifacts.length > 0) {
      return explicitArtifacts.map((artifact) =>
        evidenceMatchRecord(evidence, artifact, "explicit_artifact", "direct")
      );
    }

    const constraintArtifacts = Array.from(
      new Set(
        [
          evidence.constraint_id,
          ...evidence.related_constraint_ids,
          ...evidence.linked_constraint_ids
        ]
          .filter(evidenceMatchIsString)
          .flatMap((constraintId) => artifactsByConstraint.get(constraintId) ?? [])
      )
    );
    if (constraintArtifacts.length > 0) {
      return constraintArtifacts.map((artifact) =>
        evidenceMatchRecord(evidence, artifact, "constraint_candidate", "candidate")
      );
    }

    const sourceArtifacts = evidence.linked_source_ids.flatMap(
      (sourceId) => artifactsBySource.get(sourceId) ?? []
    );
    return Array.from(new Set(sourceArtifacts)).map((artifact) =>
      evidenceMatchRecord(evidence, artifact, "source_candidate", "candidate")
    );
  });
}

function evidenceMatchRecord(
  evidence: EvidenceMatchImport,
  artifact: EvidenceMatchArtifact,
  matchType: EvidenceMatchRecord["match_type"],
  matchStrength: EvidenceMatchRecord["match_strength"]
): EvidenceMatchRecord {
  const coverageStatus = evidenceMatchCoverageStatus(evidence, matchType);
  return {
    match_id: `match:${artifact.artifact_id}:${evidence.evidence_id}`.replace(
      /[^a-zA-Z0-9:_-]+/g,
      "-"
    ),
    artifact_id: artifact.artifact_id,
    artifact_title: artifact.artifact_title,
    constraint_id: artifact.constraint_id,
    constraint_title: artifact.constraint_title,
    evidence_id: evidence.evidence_id,
    evidence_title: evidence.title,
    match_type: matchType,
    match_strength: matchStrength,
    coverage_status: coverageStatus,
    coverage_rationale: evidenceMatchRationale(evidence, matchType, coverageStatus),
    collection_status: evidence.collection_status,
    review_status: evidence.review_status,
    provenance_status: evidence.provenance_status,
    source_url_present: Boolean(evidence.source_url),
    local_file_reference_present: Boolean(evidence.local_file_reference)
  };
}

function evidenceMatchCoverageStatus(
  evidence: EvidenceMatchImport,
  matchType: EvidenceMatchRecord["match_type"]
): EvidenceMatchRecord["coverage_status"] {
  if (
    evidence.collection_status === "rejected" ||
    evidence.review_status === "rejected"
  ) {
    return "rejected_no_coverage";
  }
  if (evidence.collection_status === "blocked") return "blocked";
  if (
    matchType !== "explicit_artifact" ||
    ["metadata_only", "not_collected"].includes(evidence.collection_status)
  ) {
    return "candidate";
  }
  if (
    ["collected", "needs_review"].includes(evidence.collection_status) &&
    ["unreviewed", "review_ready", "reviewed", "needs_followup", "accepted"].includes(
      evidence.review_status
    )
  ) {
    return "matched";
  }
  return "candidate";
}

function evidenceMatchRationale(
  evidence: EvidenceMatchImport,
  matchType: EvidenceMatchRecord["match_type"],
  status: EvidenceMatchRecord["coverage_status"]
) {
  if (status === "rejected_no_coverage") {
    return "Rejected evidence is visible for review history but does not count as coverage.";
  }
  if (status === "blocked") {
    return "Blocked evidence is linked but cannot advance artifact coverage yet.";
  }
  if (matchType !== "explicit_artifact") {
    return "Constraint or source linkage is treated as candidate coverage until an explicit artifact ID is attached.";
  }
  if (["metadata_only", "not_collected"].includes(evidence.collection_status)) {
    return "Metadata-only evidence is a candidate match, not collected proof.";
  }
  return "Explicit artifact linkage exists and evidence is collected or ready for review; no artifact status is mutated.";
}

function evidenceMatchBuildArtifactCoverage(
  artifacts: EvidenceMatchArtifact[],
  matches: EvidenceMatchRecord[]
) {
  const matchesByArtifact = evidenceMatchGroupBy(matches, (match) => match.artifact_id);

  return artifacts
    .map((artifact) => {
      const artifactMatches = matchesByArtifact.get(artifact.artifact_id) ?? [];
      const effectiveMatches = artifactMatches.filter(
        (match) => match.coverage_status !== "rejected_no_coverage"
      );
      const coverageStatus = evidenceMatchArtifactCoverageStatus(effectiveMatches);
      return {
        artifact_id: artifact.artifact_id,
        constraint_id: artifact.constraint_id,
        constraint_title: artifact.constraint_title,
        artifact_type: artifact.artifact_type,
        artifact_title: artifact.artifact_title,
        why_needed: artifact.why_needed,
        priority: artifact.priority,
        confidence_impact: artifact.confidence_impact,
        related_packet_ids: artifact.related_packet_ids,
        related_source_ids: artifact.related_source_ids,
        generated_artifact_status: artifact.status,
        coverage_status: coverageStatus,
        match_count: effectiveMatches.length,
        candidate_match_count: effectiveMatches.filter(
          (match) => match.coverage_status === "candidate"
        ).length,
        blocked_match_count: effectiveMatches.filter(
          (match) => match.coverage_status === "blocked"
        ).length,
        review_ready_match_count: effectiveMatches.filter(
          (match) => match.coverage_status === "matched"
        ).length,
        rejected_match_count: artifactMatches.filter(
          (match) => match.coverage_status === "rejected_no_coverage"
        ).length,
        match_ids: effectiveMatches.map((match) => match.match_id).sort(),
        next_import_action: evidenceMatchNextAction(artifact, coverageStatus),
        investigation_route: artifact.investigation_route,
        validation_route: artifact.validation_route,
        source_route: artifact.source_route,
        network_route: artifact.network_route
      };
    })
    .sort(
      (first, second) =>
        evidenceMatchCoverageRank(first.coverage_status) -
          evidenceMatchCoverageRank(second.coverage_status) ||
        second.priority - first.priority ||
        first.constraint_title.localeCompare(second.constraint_title)
    );
}

function evidenceMatchArtifactCoverageStatus(
  matches: EvidenceMatchRecord[]
): "matched" | "candidate" | "blocked" | "uncovered" {
  if (matches.some((match) => match.coverage_status === "matched")) {
    return "matched";
  }
  if (matches.some((match) => match.coverage_status === "candidate")) {
    return "candidate";
  }
  if (matches.some((match) => match.coverage_status === "blocked")) {
    return "blocked";
  }
  return "uncovered";
}

function evidenceMatchBuildPacketCoverage(
  packets: EvidenceMatchPacket[],
  artifactCoverage: ReturnType<typeof evidenceMatchBuildArtifactCoverage>
) {
  return packets
    .slice()
    .sort((first, second) => first.triage_rank - second.triage_rank)
    .map((packet) => {
      const packetArtifacts = artifactCoverage.filter((artifact) =>
        artifact.related_packet_ids.includes(packet.packet_id)
      );
      const statusDistribution = evidenceMatchDistribution(
        packetArtifacts.map((artifact) => artifact.coverage_status)
      );
      const uncoveredArtifacts = packetArtifacts.filter(
        (artifact) => artifact.coverage_status === "uncovered"
      );
      return {
        packet_id: packet.packet_id,
        constraint_id: packet.constraint_id,
        constraint_title: packet.constraint_title,
        triage_rank: packet.triage_rank,
        expected_artifact: packet.expected_artifact,
        artifact_need_count: packetArtifacts.length,
        matched_artifact_count: packetArtifacts.filter(
          (artifact) => artifact.coverage_status === "matched"
        ).length,
        candidate_artifact_count: packetArtifacts.filter(
          (artifact) => artifact.coverage_status === "candidate"
        ).length,
        blocked_artifact_count: packetArtifacts.filter(
          (artifact) => artifact.coverage_status === "blocked"
        ).length,
        uncovered_artifact_count: uncoveredArtifacts.length,
        status_distribution: statusDistribution,
        coverage_status:
          packetArtifacts.length === 0
            ? "no_artifact_need"
            : uncoveredArtifacts.length === packetArtifacts.length
              ? "uncovered"
              : "partial_candidate_coverage",
        next_import_action:
          uncoveredArtifacts[0]?.next_import_action ??
          "Review candidate imported evidence before changing any artifact status."
      };
    });
}

function evidenceMatchSummary(
  imports: EvidenceMatchImport[],
  artifacts: EvidenceMatchArtifact[],
  matches: EvidenceMatchRecord[],
  artifactCoverage: ReturnType<typeof evidenceMatchBuildArtifactCoverage>,
  topPacketCoverage: ReturnType<typeof evidenceMatchBuildPacketCoverage>
) {
  const directMatches = matches.filter(
    (match) => match.match_type === "explicit_artifact"
  );
  const reviewReadyEvidence = imports.filter(
    (evidence) =>
      evidence.collection_status === "collected" &&
      ["unreviewed", "review_ready", "needs_followup"].includes(evidence.review_status)
  );

  return {
    evidence_import_count: imports.length,
    artifact_need_count: artifacts.length,
    match_count: matches.length,
    direct_match_count: directMatches.length,
    indirect_candidate_match_count: matches.length - directMatches.length,
    matched_artifact_count: artifactCoverage.filter(
      (artifact) => artifact.coverage_status === "matched"
    ).length,
    candidate_artifact_count: artifactCoverage.filter(
      (artifact) => artifact.coverage_status === "candidate"
    ).length,
    blocked_artifact_count: artifactCoverage.filter(
      (artifact) => artifact.coverage_status === "blocked"
    ).length,
    uncovered_artifact_count: artifactCoverage.filter(
      (artifact) => artifact.coverage_status === "uncovered"
    ).length,
    review_ready_evidence_count: reviewReadyEvidence.length,
    rejected_evidence_count: imports.filter(
      (evidence) =>
        evidence.collection_status === "rejected" ||
        evidence.review_status === "rejected"
    ).length,
    blocked_evidence_count: imports.filter(
      (evidence) => evidence.collection_status === "blocked"
    ).length,
    coverage_by_artifact_type: evidenceMatchCoverageByType(artifactCoverage),
    artifact_coverage_distribution: evidenceMatchDistribution(
      artifactCoverage.map((artifact) => artifact.coverage_status)
    ),
    top_validation_packet_artifact_needs: topPacketCoverage.reduce(
      (total, packet) => total + packet.artifact_need_count,
      0
    ),
    top_validation_packet_uncovered_artifacts: topPacketCoverage.reduce(
      (total, packet) => total + packet.uncovered_artifact_count,
      0
    )
  };
}

function evidenceMatchCoverageByType(
  artifactCoverage: ReturnType<typeof evidenceMatchBuildArtifactCoverage>
) {
  const types = Array.from(
    new Set(artifactCoverage.map((artifact) => artifact.artifact_type))
  ).sort();
  return types.reduce<
    Record<
      string,
      {
        total: number;
        matched: number;
        candidate: number;
        blocked: number;
        uncovered: number;
      }
    >
  >((coverage, type) => {
    const artifacts = artifactCoverage.filter((artifact) => artifact.artifact_type === type);
    coverage[type] = {
      total: artifacts.length,
      matched: artifacts.filter((artifact) => artifact.coverage_status === "matched")
        .length,
      candidate: artifacts.filter(
        (artifact) => artifact.coverage_status === "candidate"
      ).length,
      blocked: artifacts.filter((artifact) => artifact.coverage_status === "blocked")
        .length,
      uncovered: artifacts.filter(
        (artifact) => artifact.coverage_status === "uncovered"
      ).length
    };
    return coverage;
  }, {});
}

function evidenceMatchNextImportActions(
  artifactCoverage: ReturnType<typeof evidenceMatchBuildArtifactCoverage>,
  topPacketCoverage: ReturnType<typeof evidenceMatchBuildPacketCoverage>
) {
  const topPacketActions = topPacketCoverage
    .filter((packet) => packet.uncovered_artifact_count > 0)
    .slice(0, 5)
    .map(
      (packet) =>
        `Attach evidence metadata for queue #${packet.triage_rank}: ${packet.expected_artifact}`
    );
  const highPriorityActions = artifactCoverage
    .filter((artifact) => artifact.coverage_status === "uncovered")
    .slice(0, 5)
    .map(
      (artifact) =>
        `Create an import record for ${artifact.constraint_title}: ${artifact.artifact_title}`
    );
  return Array.from(new Set([...topPacketActions, ...highPriorityActions])).slice(0, 8);
}

function evidenceMatchNextAction(
  artifact: EvidenceMatchArtifact,
  coverageStatus: "matched" | "candidate" | "blocked" | "uncovered"
) {
  if (coverageStatus === "matched") {
    return "Review imported evidence before deciding whether this artifact need is satisfied.";
  }
  if (coverageStatus === "candidate") {
    return "Add an explicit artifact ID or review the candidate linkage.";
  }
  if (coverageStatus === "blocked") {
    return "Resolve the blocked evidence reason before treating this as coverage.";
  }
  return `Add an evidence import record for ${artifact.artifact_title}.`;
}

function evidenceMatchCoverageRank(status: string) {
  return { uncovered: 0, blocked: 1, candidate: 2, matched: 3 }[status] ?? 4;
}

function evidenceMatchReadJson<T>(path: string) {
  return JSON.parse(evidenceMatchReadFileSync(path, "utf8")) as T;
}

function evidenceMatchWriteStableJson(path: string, output: Record<string, unknown>) {
  const stableOutput = evidenceMatchPreserveGeneratedAt(path, output);
  evidenceMatchWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function evidenceMatchPreserveGeneratedAt(
  path: string,
  output: Record<string, unknown>
) {
  if (!evidenceMatchExistsSync(path)) return output;
  const existing = JSON.parse(evidenceMatchReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const comparable = { ...existing, generated_at: output.generated_at };
  if (JSON.stringify(comparable) === JSON.stringify(output)) {
    return { ...output, generated_at: existing.generated_at };
  }
  return output;
}

function evidenceMatchGroupBy<T>(items: T[], keyFor: (item: T) => string) {
  return items.reduce<Map<string, T[]>>((groups, item) => {
    const key = keyFor(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
    return groups;
  }, new Map());
}

function evidenceMatchDistribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function evidenceMatchIsString(value: string | null): value is string {
  return typeof value === "string" && value.length > 0;
}

evidenceMatchMain();
