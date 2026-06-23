type EvidenceImportFsModule = typeof import("node:fs");
type EvidenceImportPathModule = typeof import("node:path");

const {
  existsSync: evidenceImportExistsSync,
  mkdirSync: evidenceImportMkdirSync,
  readFileSync: evidenceImportReadFileSync,
  readdirSync: evidenceImportReaddirSync,
  statSync: evidenceImportStatSync,
  writeFileSync: evidenceImportWriteFileSync
} = process.getBuiltinModule("fs") as EvidenceImportFsModule;
const {
  dirname: evidenceImportDirname,
  join: evidenceImportJoin,
  resolve: evidenceImportResolve
} = process.getBuiltinModule("path") as EvidenceImportPathModule;

const evidenceImportInputDir = evidenceImportResolve("data/evidence/imports");
const evidenceImportArtifactPath = evidenceImportResolve(
  "data/exports/evidence_artifact_library.json"
);
const evidenceImportDatasetPath = evidenceImportResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const evidenceImportSourcePath = evidenceImportResolve(
  "data/exports/source_registry.json"
);
const evidenceImportPacketPath = evidenceImportResolve(
  "data/exports/validation_evidence_packets.json"
);
const evidenceImportRegistryPath = evidenceImportResolve(
  "data/exports/evidence_import_registry.json"
);

const evidenceImportCollectionStatuses = [
  "not_collected",
  "metadata_only",
  "collected",
  "needs_review",
  "rejected",
  "blocked"
] as const;
const evidenceImportReviewStatuses = [
  "unreviewed",
  "review_ready",
  "reviewed",
  "accepted",
  "rejected",
  "needs_followup"
] as const;
const evidenceImportProvenanceStatuses = [
  "unknown",
  "source_title_only",
  "operational_pattern",
  "secondary_reference",
  "primary_document",
  "local_observation",
  "verified_primary"
] as const;
const evidenceImportArtifactTypes = [
  "primary_document",
  "source_url",
  "local_observation",
  "metric_definition",
  "claim_support_memo",
  "intervention_pilot_plan",
  "dataset_extract",
  "system_export",
  "screenshot",
  "interview_note",
  "operating_log"
] as const;
const evidenceImportEvidenceTypes = [
  "metadata_stub",
  "primary_document",
  "secondary_reference",
  "local_observation",
  "system_export",
  "metric_definition",
  "interview_note",
  "screenshot",
  "dataset_extract",
  "operating_log",
  "claim_support"
] as const;

type EvidenceImportCollectionStatus =
  (typeof evidenceImportCollectionStatuses)[number];
type EvidenceImportReviewStatus = (typeof evidenceImportReviewStatuses)[number];
type EvidenceImportProvenanceStatus =
  (typeof evidenceImportProvenanceStatuses)[number];

type EvidenceImportRawRecord = {
  evidence_id?: unknown;
  artifact_id?: unknown;
  related_artifact_ids?: unknown;
  constraint_id?: unknown;
  related_constraint_ids?: unknown;
  source_record_id?: unknown;
  title?: unknown;
  artifact_type?: unknown;
  evidence_type?: unknown;
  provenance_status?: unknown;
  collection_status?: unknown;
  review_status?: unknown;
  source_url?: unknown;
  local_file_reference?: unknown;
  publisher_or_owner?: unknown;
  publication_date?: unknown;
  collected_at?: unknown;
  reviewed_at?: unknown;
  claim_support_summary?: unknown;
  validation_metric_supported?: unknown;
  notes?: unknown;
  tags?: unknown;
};

type EvidenceImportPack = {
  contract_version?: unknown;
  imports?: unknown;
};

type EvidenceImportArtifact = {
  artifact_id: string;
  constraint_id: string;
  related_packet_ids: string[];
};

type EvidenceImportPacket = {
  packet_id: string;
  constraint_id: string;
  triage_rank: number;
};

type EvidenceImportNormalizedRecord = {
  evidence_id: string;
  artifact_id: string | null;
  related_artifact_ids: string[];
  constraint_id: string | null;
  related_constraint_ids: string[];
  source_record_id: string | null;
  title: string;
  artifact_type: string;
  evidence_type: string;
  provenance_status: EvidenceImportProvenanceStatus;
  collection_status: EvidenceImportCollectionStatus;
  review_status: EvidenceImportReviewStatus;
  source_url: string | null;
  local_file_reference: string | null;
  publisher_or_owner: string | null;
  publication_date: string | null;
  collected_at: string | null;
  reviewed_at: string | null;
  claim_support_summary: string;
  validation_metric_supported: string;
  notes: string;
  tags: string[];
  import_file: string;
  linked_artifact_ids: string[];
  linked_constraint_ids: string[];
  linked_source_ids: string[];
  candidate_artifact_matches: string[];
  validation_errors: string[];
  investigation_routes: string[];
  source_route: string;
  validation_route: string;
};

function evidenceImportMain() {
  const artifactExport = evidenceImportReadJson<{
    summary: { artifact_count: number };
    artifacts: EvidenceImportArtifact[];
  }>(evidenceImportArtifactPath);
  const dataset = evidenceImportReadJson<{
    records: Array<{ id: string; title: string }>;
  }>(evidenceImportDatasetPath);
  const sources = evidenceImportReadJson<{
    sources: Array<{ source_id: string; title: string }>;
  }>(evidenceImportSourcePath);
  const packets = evidenceImportReadJson<{ packets: EvidenceImportPacket[] }>(
    evidenceImportPacketPath
  ).packets;

  const artifactIds = new Set(
    artifactExport.artifacts.map((artifact) => artifact.artifact_id)
  );
  const constraintIds = new Set(dataset.records.map((record) => record.id));
  const sourceIds = new Set(sources.sources.map((source) => source.source_id));
  const artifactById = new Map(
    artifactExport.artifacts.map((artifact) => [artifact.artifact_id, artifact])
  );

  const importFiles = evidenceImportFindImportFiles();
  const importResults = importFiles.flatMap((filePath) =>
    evidenceImportReadPack(filePath).imports.map((rawImport) =>
      evidenceImportNormalizeRecord(
        rawImport,
        filePath,
        artifactIds,
        constraintIds,
        sourceIds,
        artifactById
      )
    )
  );
  const imports = importResults.sort((first, second) =>
    first.evidence_id.localeCompare(second.evidence_id)
  );
  const output = {
    generated_at: new Date().toISOString(),
    import_file_count: importFiles.length,
    import_count: imports.length,
    summary: evidenceImportSummary(imports, artifactExport.artifacts, packets),
    imports
  };

  evidenceImportMkdirSync(evidenceImportDirname(evidenceImportRegistryPath), {
    recursive: true
  });
  evidenceImportWriteStableJson(evidenceImportRegistryPath, output);

  const errorCount = imports.reduce(
    (total, evidence) => total + evidence.validation_errors.length,
    0
  );
  console.log(
    `Built evidence import registry with ${imports.length} import(s) from ${importFiles.length} file(s).`
  );
  if (errorCount > 0) {
    console.error(`- evidence import validation errors: ${errorCount}`);
    process.exitCode = 1;
  }
}

function evidenceImportReadPack(filePath: string) {
  const parsed = evidenceImportReadJson<EvidenceImportPack>(filePath);
  const errors: string[] = [];

  if (parsed.contract_version !== "1.0") {
    errors.push("contract_version must be 1.0");
  }
  if (!Array.isArray(parsed.imports)) {
    errors.push("imports must be an array");
  }
  if (errors.length > 0) {
    throw new Error(`${filePath}: ${errors.join("; ")}`);
  }

  return { imports: parsed.imports as EvidenceImportRawRecord[] };
}

function evidenceImportNormalizeRecord(
  rawImport: EvidenceImportRawRecord,
  filePath: string,
  artifactIds: Set<string>,
  constraintIds: Set<string>,
  sourceIds: Set<string>,
  artifactById: Map<string, EvidenceImportArtifact>
): EvidenceImportNormalizedRecord {
  const validationErrors: string[] = [];
  const evidenceId = evidenceImportString(rawImport.evidence_id);
  const artifactId = evidenceImportNullableString(rawImport.artifact_id);
  const relatedArtifactIds = evidenceImportStringArray(rawImport.related_artifact_ids);
  const constraintId = evidenceImportNullableString(rawImport.constraint_id);
  const relatedConstraintIds = evidenceImportStringArray(
    rawImport.related_constraint_ids
  );
  const sourceRecordId = evidenceImportNullableString(rawImport.source_record_id);
  const title = evidenceImportString(rawImport.title);
  const artifactType = evidenceImportString(rawImport.artifact_type);
  const evidenceType = evidenceImportString(rawImport.evidence_type);
  const provenanceStatus = evidenceImportString(rawImport.provenance_status);
  const collectionStatus = evidenceImportString(rawImport.collection_status);
  const reviewStatus = evidenceImportString(rawImport.review_status);
  const sourceUrl = evidenceImportNullableString(rawImport.source_url);
  const localFileReference = evidenceImportNullableString(rawImport.local_file_reference);
  const publisherOrOwner = evidenceImportNullableString(rawImport.publisher_or_owner);
  const publicationDate = evidenceImportNullableString(rawImport.publication_date);
  const collectedAt = evidenceImportNullableString(rawImport.collected_at);
  const reviewedAt = evidenceImportNullableString(rawImport.reviewed_at);
  const claimSupportSummary = evidenceImportString(rawImport.claim_support_summary);
  const validationMetricSupported = evidenceImportString(
    rawImport.validation_metric_supported
  );
  const notes = evidenceImportString(rawImport.notes);
  const tags = evidenceImportStringArray(rawImport.tags);

  const allArtifactIds = Array.from(
    new Set([artifactId, ...relatedArtifactIds].filter(evidenceImportIsString))
  );
  const allConstraintIds = Array.from(
    new Set([constraintId, ...relatedConstraintIds].filter(evidenceImportIsString))
  );

  evidenceImportRequire(evidenceId, "evidence_id", validationErrors);
  evidenceImportRequire(title, "title", validationErrors);
  evidenceImportRequire(claimSupportSummary, "claim_support_summary", validationErrors);
  evidenceImportRequire(
    validationMetricSupported,
    "validation_metric_supported",
    validationErrors
  );
  evidenceImportRequire(notes, "notes", validationErrors);
  if (tags.length === 0) validationErrors.push("tags must include at least one value");

  evidenceImportValidateEnum(
    artifactType,
    evidenceImportArtifactTypes,
    "artifact_type",
    validationErrors
  );
  evidenceImportValidateEnum(
    evidenceType,
    evidenceImportEvidenceTypes,
    "evidence_type",
    validationErrors
  );
  evidenceImportValidateEnum(
    provenanceStatus,
    evidenceImportProvenanceStatuses,
    "provenance_status",
    validationErrors
  );
  evidenceImportValidateEnum(
    collectionStatus,
    evidenceImportCollectionStatuses,
    "collection_status",
    validationErrors
  );
  evidenceImportValidateEnum(
    reviewStatus,
    evidenceImportReviewStatuses,
    "review_status",
    validationErrors
  );

  const linkedArtifactIds = allArtifactIds.filter((id) => artifactIds.has(id));
  const linkedConstraintIds = allConstraintIds.filter((id) => constraintIds.has(id));
  const linkedSourceIds =
    sourceRecordId && sourceIds.has(sourceRecordId) ? [sourceRecordId] : [];

  allArtifactIds
    .filter((id) => !artifactIds.has(id))
    .forEach((id) => validationErrors.push(`unknown artifact_id: ${id}`));
  allConstraintIds
    .filter((id) => !constraintIds.has(id))
    .forEach((id) => validationErrors.push(`unknown constraint_id: ${id}`));
  if (sourceRecordId && !sourceIds.has(sourceRecordId)) {
    validationErrors.push(`unknown source_record_id: ${sourceRecordId}`);
  }
  if (sourceUrl && !evidenceImportLooksLikeUrl(sourceUrl)) {
    validationErrors.push("source_url must start with http:// or https://");
  }
  if (sourceUrl && evidenceImportLooksPlaceholder(sourceUrl)) {
    validationErrors.push("source_url appears to be a placeholder");
  }

  evidenceImportValidateStatusEvidence(
    {
      collectionStatus,
      reviewStatus,
      provenanceStatus,
      sourceUrl,
      localFileReference,
      publisherOrOwner,
      collectedAt,
      reviewedAt
    },
    validationErrors
  );

  const candidateArtifactMatches = linkedConstraintIds.flatMap((id) =>
    Array.from(artifactById.values())
      .filter((artifact) => artifact.constraint_id === id)
      .map((artifact) => artifact.artifact_id)
  );

  return {
    evidence_id: evidenceId,
    artifact_id: artifactId,
    related_artifact_ids: relatedArtifactIds,
    constraint_id: constraintId,
    related_constraint_ids: relatedConstraintIds,
    source_record_id: sourceRecordId,
    title,
    artifact_type: artifactType,
    evidence_type: evidenceType,
    provenance_status: provenanceStatus as EvidenceImportProvenanceStatus,
    collection_status: collectionStatus as EvidenceImportCollectionStatus,
    review_status: reviewStatus as EvidenceImportReviewStatus,
    source_url: sourceUrl,
    local_file_reference: localFileReference,
    publisher_or_owner: publisherOrOwner,
    publication_date: publicationDate,
    collected_at: collectedAt,
    reviewed_at: reviewedAt,
    claim_support_summary: claimSupportSummary,
    validation_metric_supported: validationMetricSupported,
    notes,
    tags,
    import_file: evidenceImportDisplayPath(filePath),
    linked_artifact_ids: Array.from(new Set(linkedArtifactIds)).sort(),
    linked_constraint_ids: Array.from(new Set(linkedConstraintIds)).sort(),
    linked_source_ids: linkedSourceIds,
    candidate_artifact_matches: Array.from(new Set(candidateArtifactMatches)).sort(),
    validation_errors: validationErrors,
    investigation_routes: linkedConstraintIds.map((id) => `/constraints/${id}`),
    source_route: "/sources",
    validation_route: "/validation"
  };
}

function evidenceImportSummary(
  imports: EvidenceImportNormalizedRecord[],
  artifacts: EvidenceImportArtifact[],
  packets: EvidenceImportPacket[]
) {
  const coveredArtifactIds = new Set(
    imports.flatMap((evidence) => evidence.linked_artifact_ids)
  );
  const linkedConstraints = new Set(
    imports.flatMap((evidence) => evidence.linked_constraint_ids)
  );
  const linkedArtifacts = new Set(
    imports.flatMap((evidence) => evidence.linked_artifact_ids)
  );
  const packetArtifactIds = new Set(
    artifacts
      .filter((artifact) => artifact.related_packet_ids.length > 0)
      .map((artifact) => artifact.artifact_id)
  );
  const coveredPacketArtifactIds = new Set(
    Array.from(packetArtifactIds).filter((artifactId) =>
      coveredArtifactIds.has(artifactId)
    )
  );
  const topPacketCoverage = packets
    .sort((first, second) => first.triage_rank - second.triage_rank)
    .map((packet) => {
      const matchingArtifacts = artifacts.filter((artifact) =>
        artifact.related_packet_ids.includes(packet.packet_id)
      );
      const coveredArtifacts = matchingArtifacts.filter((artifact) =>
        coveredArtifactIds.has(artifact.artifact_id)
      );
      return {
        packet_id: packet.packet_id,
        constraint_id: packet.constraint_id,
        triage_rank: packet.triage_rank,
        matching_artifact_count: matchingArtifacts.length,
        imported_evidence_match_count: coveredArtifacts.length,
        coverage_status:
          coveredArtifacts.length > 0 ? "candidate_import_present" : "uncovered"
      };
    });

  return {
    total_evidence_imports: imports.length,
    imports_by_collection_status: evidenceImportDistributionWithDefaults(
      evidenceImportCollectionStatuses,
      imports.map((evidence) => evidence.collection_status)
    ),
    imports_by_review_status: evidenceImportDistributionWithDefaults(
      evidenceImportReviewStatuses,
      imports.map((evidence) => evidence.review_status)
    ),
    imports_by_provenance_status: evidenceImportDistributionWithDefaults(
      evidenceImportProvenanceStatuses,
      imports.map((evidence) => evidence.provenance_status)
    ),
    linked_constraints: linkedConstraints.size,
    linked_artifacts: linkedArtifacts.size,
    orphan_imports: imports.filter(
      (evidence) =>
        evidence.linked_artifact_ids.length === 0 &&
        evidence.linked_constraint_ids.length === 0 &&
        evidence.linked_source_ids.length === 0
    ).length,
    imports_with_missing_required_metadata: imports.filter(
      (evidence) => evidence.validation_errors.length > 0
    ).length,
    artifact_needs_with_matching_imported_evidence: coveredArtifactIds.size,
    artifact_needs_still_uncovered: artifacts.length - coveredArtifactIds.size,
    top_validation_packets_with_imported_evidence_coverage: topPacketCoverage,
    packet_artifact_needs_with_imported_evidence: coveredPacketArtifactIds.size,
    packet_artifact_needs_still_uncovered:
      packetArtifactIds.size - coveredPacketArtifactIds.size
  };
}

function evidenceImportValidateStatusEvidence(
  values: {
    collectionStatus: string;
    reviewStatus: string;
    provenanceStatus: string;
    sourceUrl: string | null;
    localFileReference: string | null;
    publisherOrOwner: string | null;
    collectedAt: string | null;
    reviewedAt: string | null;
  },
  validationErrors: string[]
) {
  const hasLocator = Boolean(values.sourceUrl || values.localFileReference);
  if (["collected", "needs_review"].includes(values.collectionStatus)) {
    if (!hasLocator) {
      validationErrors.push(
        "collected or needs_review imports require source_url or local_file_reference"
      );
    }
    if (!values.publisherOrOwner) {
      validationErrors.push(
        "collected or needs_review imports require publisher_or_owner"
      );
    }
    if (!values.collectedAt) {
      validationErrors.push("collected or needs_review imports require collected_at");
    }
    if (["unknown", "source_title_only"].includes(values.provenanceStatus)) {
      validationErrors.push(
        "collected or needs_review imports require stronger provenance_status"
      );
    }
  }

  if (["reviewed", "accepted", "rejected", "needs_followup"].includes(values.reviewStatus)) {
    if (!values.reviewedAt) {
      validationErrors.push("reviewed/accepted/rejected imports require reviewed_at");
    }
    if (!hasLocator) {
      validationErrors.push(
        "reviewed/accepted/rejected imports require source_url or local_file_reference"
      );
    }
  }

  if (
    values.reviewStatus === "accepted" &&
    !["collected", "needs_review"].includes(values.collectionStatus)
  ) {
    validationErrors.push("accepted imports require collected or needs_review status");
  }
}

function evidenceImportFindImportFiles() {
  if (!evidenceImportExistsSync(evidenceImportInputDir)) return [];
  return evidenceImportReaddirSync(evidenceImportInputDir)
    .map((entry) => evidenceImportJoin(evidenceImportInputDir, entry))
    .filter(
      (path) =>
        evidenceImportStatSync(path).isFile() &&
        path.toLowerCase().endsWith(".json")
    )
    .sort((first, second) => first.localeCompare(second));
}

function evidenceImportReadJson<T>(path: string) {
  return JSON.parse(evidenceImportReadFileSync(path, "utf8")) as T;
}

function evidenceImportWriteStableJson(path: string, output: Record<string, unknown>) {
  const stableOutput = evidenceImportPreserveGeneratedAt(path, output);
  evidenceImportWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function evidenceImportPreserveGeneratedAt(
  path: string,
  output: Record<string, unknown>
) {
  if (!evidenceImportExistsSync(path)) return output;
  const existing = JSON.parse(evidenceImportReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const comparable = { ...existing, generated_at: output.generated_at };
  if (JSON.stringify(comparable) === JSON.stringify(output)) {
    return { ...output, generated_at: existing.generated_at };
  }
  return output;
}

function evidenceImportString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function evidenceImportNullableString(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = evidenceImportString(value);
  return text.length > 0 ? text : null;
}

function evidenceImportStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => evidenceImportString(entry))
    .filter((entry) => entry.length > 0);
}

function evidenceImportRequire(
  value: string,
  fieldName: string,
  validationErrors: string[]
) {
  if (!value) validationErrors.push(`${fieldName} is required`);
}

function evidenceImportValidateEnum<T extends readonly string[]>(
  value: string,
  allowed: T,
  fieldName: string,
  validationErrors: string[]
) {
  if (!allowed.includes(value)) {
    validationErrors.push(`${fieldName} has invalid value: ${value || "<empty>"}`);
  }
}

function evidenceImportDistributionWithDefaults<T extends readonly string[]>(
  allowed: T,
  values: string[]
) {
  return allowed.reduce<Record<string, number>>((counts, value) => {
    counts[value] = values.filter((item) => item === value).length;
    return counts;
  }, {});
}

function evidenceImportLooksLikeUrl(value: string) {
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(value);
}

function evidenceImportLooksPlaceholder(value: string) {
  return /example\.com|replace|placeholder|todo/i.test(value);
}

function evidenceImportIsString(value: string | null): value is string {
  return typeof value === "string" && value.length > 0;
}

function evidenceImportDisplayPath(path: string) {
  return path.replace(evidenceImportResolve("."), "").replace(/^\\/, "");
}

evidenceImportMain();
