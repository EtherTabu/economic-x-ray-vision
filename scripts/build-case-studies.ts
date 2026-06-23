type CaseStudyBuildFsModule = typeof import("node:fs");
type CaseStudyBuildPathModule = typeof import("node:path");

const {
  existsSync: caseStudyBuildExistsSync,
  mkdirSync: caseStudyBuildMkdirSync,
  readFileSync: caseStudyBuildReadFileSync,
  readdirSync: caseStudyBuildReaddirSync,
  unlinkSync: caseStudyBuildUnlinkSync,
  writeFileSync: caseStudyBuildWriteFileSync
} = process.getBuiltinModule("fs") as CaseStudyBuildFsModule;
const {
  dirname: caseStudyBuildDirname,
  extname: caseStudyBuildExtname,
  join: caseStudyBuildJoin,
  resolve: caseStudyBuildResolve
} = process.getBuiltinModule("path") as CaseStudyBuildPathModule;

const caseStudyBuildDatasetPath = caseStudyBuildResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const caseStudyBuildArtifactPath = caseStudyBuildResolve(
  "data/exports/evidence_artifact_library.json"
);
const caseStudyBuildImportPath = caseStudyBuildResolve(
  "data/exports/evidence_import_registry.json"
);
const caseStudyBuildMatchPath = caseStudyBuildResolve(
  "data/exports/evidence_artifact_matches.json"
);
const caseStudyBuildCampaignPath = caseStudyBuildResolve(
  "data/exports/validation_campaigns.json"
);
const caseStudyBuildOutputPath = caseStudyBuildResolve(
  "data/exports/case_studies.json"
);
const caseStudyBuildReportDir = caseStudyBuildResolve(
  "data/exports/case_study_reports"
);

const caseStudyBuildPrimaryCaseStudyId =
  "case-study:ai-data-center-power-grid-interconnection";
const caseStudyBuildPrimaryReportPath =
  "data/exports/case_study_reports/ai-data-center-power-grid-interconnection-bottlenecks.md";
const caseStudyBuildConstraintIds = [
  "strategic-037",
  "strategic-038",
  "strategic-039",
  "strategic-040",
  "strategic-041",
  "strategic-001",
  "strategic-002",
  "strategic-048"
];

type CaseStudyBuildRecord = {
  id: string;
  title: string;
  industry: string;
  description: string;
  primary_archetype: string;
  evidence_gaps: string[];
  affected_systems: string[];
  related_processes: string[];
  scores: {
    total_priority_score: number;
    total_strategic_score: number;
    validation_confidence_score: number;
  };
};

type CaseStudyBuildArtifact = {
  artifact_id: string;
  constraint_id: string;
  constraint_title: string;
  artifact_type: string;
  artifact_title: string;
  why_needed: string;
  expected_source_owner: string;
  priority: number;
  status: string;
};

type CaseStudyBuildImport = {
  evidence_id: string;
  constraint_id?: string;
  related_constraint_ids?: string[];
  artifact_id?: string;
  related_artifact_ids?: string[];
  collection_status: string;
  review_status: string;
};

type CaseStudyBuildCampaign = {
  campaign_id: string;
  title: string;
  selected_constraints: Array<{ constraint_id: string }>;
};

type CaseStudyBuildCaseStudy = {
  case_study_id: string;
  title: string;
  status: "evidence-request-backed" | "evidence-backed";
  thesis: string;
  scope: string;
  included_constraint_ids: string[];
  system_layers_affected: string[];
  bottleneck_mechanisms: string[];
  validation_questions: string[];
  evidence_artifacts_needed: Array<{
    artifact_id: string;
    constraint_id: string;
    artifact_type: string;
    artifact_title: string;
    priority: number;
    status: string;
  }>;
  imported_evidence_ids: string[];
  source_requests: Array<{
    source_request_id: string;
    constraint_id: string;
    constraint_title: string;
    artifact_ids: string[];
    source_quality_tier: string;
    request_title: string;
    reason: string;
    preferred_source_owner: string;
    expected_artifact_type: string;
  }>;
  risk_limitation_statement: string;
  recommended_next_validation_actions: string[];
  recommended_first_campaign: {
    title: string;
    objective: string;
    ordered_constraint_ids: string[];
    reason: string;
  };
  decision_support_later: string[];
  constraints: Array<{
    constraint_id: string;
    title: string;
    industry: string;
    priority_score: number;
    strategic_score: number;
    validation_confidence: number;
    primary_archetype: string;
    mechanism: string;
    evidence_gaps: string[];
    artifact_ids: string[];
    route: string;
    network_route: string;
  }>;
  report_path: string;
};

function caseStudyBuildMain() {
  const dataset = caseStudyBuildReadJson<{ records: CaseStudyBuildRecord[] }>(
    caseStudyBuildDatasetPath
  );
  const artifacts = caseStudyBuildReadJson<{ artifacts: CaseStudyBuildArtifact[] }>(
    caseStudyBuildArtifactPath
  ).artifacts;
  const imports = caseStudyBuildReadJson<{
    import_count: number;
    imports: CaseStudyBuildImport[];
  }>(caseStudyBuildImportPath);
  const matches = caseStudyBuildReadJson<{
    summary: { uncovered_artifact_count: number };
  }>(caseStudyBuildMatchPath);
  const campaigns = caseStudyBuildReadJson<{
    campaigns: CaseStudyBuildCampaign[];
  }>(caseStudyBuildCampaignPath).campaigns;

  const recordsById = new Map(dataset.records.map((record) => [record.id, record]));
  const selectedRecords = caseStudyBuildConstraintIds.map((id) => {
    const record = recordsById.get(id);
    if (!record) {
      throw new Error(`Missing case study constraint: ${id}`);
    }
    return record;
  });
  const selectedArtifacts = artifacts
    .filter((artifact) => caseStudyBuildConstraintIds.includes(artifact.constraint_id))
    .sort(
      (first, second) =>
        caseStudyBuildConstraintIds.indexOf(first.constraint_id) -
          caseStudyBuildConstraintIds.indexOf(second.constraint_id) ||
        second.priority - first.priority ||
        first.artifact_id.localeCompare(second.artifact_id)
    );
  const selectedArtifactIds = new Set(
    selectedArtifacts.map((artifact) => artifact.artifact_id)
  );
  const importedEvidenceIds = imports.imports
    .filter((item) => {
      const constraintIds = [
        item.constraint_id,
        ...(item.related_constraint_ids ?? [])
      ].filter(caseStudyBuildIsString);
      const artifactIds = [item.artifact_id, ...(item.related_artifact_ids ?? [])].filter(
        caseStudyBuildIsString
      );
      return (
        constraintIds.some((id) => caseStudyBuildConstraintIds.includes(id)) ||
        artifactIds.some((id) => selectedArtifactIds.has(id))
      );
    })
    .map((item) => item.evidence_id)
    .sort();

  const caseStudy = caseStudyBuildCreateCaseStudy(
    selectedRecords,
    selectedArtifacts,
    importedEvidenceIds,
    campaigns
  );
  caseStudyBuildMkdirSync(caseStudyBuildReportDir, { recursive: true });
  caseStudyBuildCleanReportDir();
  caseStudyBuildWriteFileSync(
    caseStudyBuildResolve(caseStudy.report_path),
    caseStudyBuildMarkdown(caseStudy)
  );

  const output = {
    generated_at: new Date().toISOString(),
    summary: {
      case_study_count: 1,
      included_constraint_count: caseStudy.included_constraint_ids.length,
      evidence_import_count: importedEvidenceIds.length,
      source_request_count: caseStudy.source_requests.length,
      artifact_need_count: caseStudy.evidence_artifacts_needed.length,
      uncovered_artifact_count: caseStudy.evidence_artifacts_needed.filter(
        (artifact) => artifact.status === "not_collected"
      ).length,
      total_workspace_uncovered_artifact_count: matches.summary.uncovered_artifact_count,
      status_distribution: {
        [caseStudy.status]: 1
      }
    },
    case_studies: [caseStudy]
  };

  caseStudyBuildWriteStableJson(caseStudyBuildOutputPath, output);
  console.log(
    `Built ${output.summary.case_study_count} case study with ${output.summary.included_constraint_count} constraints at ${caseStudyBuildOutputPath}.`
  );
}

function caseStudyBuildCreateCaseStudy(
  selectedRecords: CaseStudyBuildRecord[],
  selectedArtifacts: CaseStudyBuildArtifact[],
  importedEvidenceIds: string[],
  campaigns: CaseStudyBuildCampaign[]
): CaseStudyBuildCaseStudy {
  const selectedArtifactRows = selectedArtifacts.map((artifact) => ({
    artifact_id: artifact.artifact_id,
    constraint_id: artifact.constraint_id,
    artifact_type: artifact.artifact_type,
    artifact_title: caseStudyBuildEvidenceLanguage(artifact.artifact_title),
    priority: artifact.priority,
    status: artifact.status
  }));
  const sourceRequests = selectedRecords.map((record) => {
    const artifactsForRecord = selectedArtifacts
      .filter((artifact) => artifact.constraint_id === record.id)
      .slice(0, 4);
    return {
      source_request_id: `source-request:${record.id}:case-study`,
      constraint_id: record.id,
      constraint_title: record.title,
      artifact_ids: artifactsForRecord.map((artifact) => artifact.artifact_id),
      source_quality_tier: caseStudyBuildSourceQualityTier(record),
      request_title: `Collect primary or operational evidence for ${record.title}`,
      reason: caseStudyBuildEvidenceLanguage(
        `Current case-study evidence is not imported. The request targets ${record.evidence_gaps[0] ?? "the leading evidence gap"} without changing generated artifact status.`
      ),
      preferred_source_owner: caseStudyBuildPreferredOwner(record),
      expected_artifact_type:
        artifactsForRecord.find((artifact) => artifact.artifact_type === "primary_document")
          ?.artifact_type ??
        artifactsForRecord[0]?.artifact_type ??
        "local_observation"
    };
  });
  const firstRelevantCampaign = campaigns.find((campaign) =>
    campaign.selected_constraints.some((item) =>
      selectedRecords.some((record) => record.id === item.constraint_id)
    )
  );

  return {
    case_study_id: caseStudyBuildPrimaryCaseStudyId,
    title: "AI Data Center Power / Grid Interconnection Bottlenecks",
    status:
      importedEvidenceIds.length > 0 ? "evidence-backed" : "evidence-request-backed",
    thesis:
      "AI infrastructure deployment can be delayed when compute commissioning, utility load studies, transformer availability, cooling validation, network readiness, and backup generation permits are sequenced in separate queues.",
    scope:
      "One focused mini case study connecting existing data center and grid interconnection constraint hypotheses. It is designed to show the evidence workflow, not to prove a real-world claim.",
    included_constraint_ids: selectedRecords.map((record) => record.id),
    system_layers_affected: [
      "Large-load interconnection and utility study queue",
      "Substation, transformer, switchgear, and energization readiness",
      "GPU cluster power delivery and commissioning acceptance",
      "Liquid cooling validation and thermal operating envelope",
      "Fiber cross-connect and network provisioning",
      "Backup generation permitting and resilience commissioning",
      "Training workload scheduling against physical capacity limits"
    ],
    bottleneck_mechanisms: Array.from(
      new Set(
        selectedRecords.flatMap((record) => [
          caseStudyBuildArchetypeLabel(record.primary_archetype),
          ...record.related_processes.slice(0, 2)
        ])
      )
    ),
    validation_questions: [
      "Which queue or owner most often blocks the first production workload after equipment is physically installed?",
      "How often do load studies, transformer readiness, switchgear, cooling validation, network provisioning, or permit readiness create critical-path delay?",
      "What metric can compare requested energization date, actual energization date, commissioning acceptance, and production cluster burn-in?",
      "Which artifact would disprove the thesis by showing that these queues are not materially linked or not on the critical path?",
      ...selectedRecords.map(
        (record) =>
          `${record.title}: ${record.evidence_gaps[0] ?? "What is the step-level baseline?"}`
      )
    ],
    evidence_artifacts_needed: selectedArtifactRows,
    imported_evidence_ids: importedEvidenceIds,
    source_requests: sourceRequests,
    risk_limitation_statement:
      "This case study is evidence-request-backed. It uses existing constraint hypotheses and generated artifact needs, but no imported evidence record currently supports or completes the case.",
    recommended_next_validation_actions: [
      "Collect a timestamped large-load or interconnection study queue extract for the grid-side constraints.",
      "Collect a commissioning readiness tracker or acceptance checklist showing power, cooling, network, and backup generation dependencies for the data-center-side constraints.",
      "Define a shared metric for request date, study completion, energization commitment, commissioning acceptance, and first production workload.",
      "Map each artifact to a source owner before changing any artifact or analyst state status.",
      "Use the evidence import contract for metadata only until a real artifact is collected and review-ready."
    ],
    recommended_first_campaign: {
      title: firstRelevantCampaign?.title ?? "Case-study evidence request campaign",
      objective:
        "Start with source requests for load study timing and GPU cluster commissioning sequencing before attempting intervention claims.",
      ordered_constraint_ids: [
        "strategic-048",
        "strategic-037",
        "strategic-001",
        "strategic-002",
        "strategic-040",
        "strategic-038",
        "strategic-039",
        "strategic-041"
      ],
      reason:
        "This order starts with grid-side service commitment timing, then follows the dependency chain into site commissioning and workload execution."
    },
    decision_support_later: [
      "Prioritize which queue to instrument first in a local validation sprint.",
      "Decide whether the main near-term blocker is grid study timing, equipment readiness, facility acceptance, or workload scheduling.",
      "Define an evidence threshold before proposing workflow automation, queue triage, or capacity planning changes."
    ],
    constraints: selectedRecords.map((record) => ({
      constraint_id: record.id,
      title: record.title,
      industry: record.industry,
      priority_score: record.scores.total_priority_score,
      strategic_score: record.scores.total_strategic_score,
      validation_confidence: record.scores.validation_confidence_score,
      primary_archetype: record.primary_archetype,
      mechanism: record.description,
      evidence_gaps: record.evidence_gaps,
      artifact_ids: selectedArtifacts
        .filter((artifact) => artifact.constraint_id === record.id)
        .map((artifact) => artifact.artifact_id),
      route: `/constraints/${record.id}`,
      network_route: `/network?focus=${record.id}`
    })),
    report_path: caseStudyBuildPrimaryReportPath
  };
}

function caseStudyBuildSourceQualityTier(record: CaseStudyBuildRecord) {
  if (record.industry === "Energy / Grid / Interconnection") {
    return "Primary public document / regulator / utility / official docket / official filing";
  }
  if (record.title.toLowerCase().includes("permit")) {
    return "Primary public document / regulator / utility / official docket / official filing";
  }
  return "Company filing or official technical report";
}

function caseStudyBuildPreferredOwner(record: CaseStudyBuildRecord) {
  if (record.industry === "Energy / Grid / Interconnection") {
    return "Utility interconnection, load study, asset planning, or grid planning owner";
  }
  if (record.title.toLowerCase().includes("cooling")) {
    return "Facilities commissioning, thermal engineering, or data center operations owner";
  }
  if (record.title.toLowerCase().includes("fiber")) {
    return "Network provisioning or data center operations owner";
  }
  if (record.title.toLowerCase().includes("backup")) {
    return "Environmental permitting, resilience, or facilities commissioning owner";
  }
  return "Data center commissioning, capacity planning, or operations owner";
}

function caseStudyBuildArchetypeLabel(archetype: string) {
  return archetype.replaceAll("_", " ");
}

function caseStudyBuildIsString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function caseStudyBuildEvidenceLanguage(value: string) {
  return value
    .replace(/\bconfirmed\b/gi, "supported")
    .replace(/\bdisproven\b/gi, "reduced or refuted");
}

function caseStudyBuildMarkdown(caseStudy: CaseStudyBuildCaseStudy) {
  const artifactTypeDistribution = caseStudy.evidence_artifacts_needed.reduce<
    Record<string, number>
  >((distribution, artifact) => {
    distribution[artifact.artifact_type] =
      (distribution[artifact.artifact_type] ?? 0) + 1;
    return distribution;
  }, {});

  return [
    `# ${caseStudy.title}`,
    "",
    `Case study ID: ${caseStudy.case_study_id}`,
    `Status: ${caseStudy.status}`,
    "",
    "> Deterministic local case-study report. No external sources were fetched, no evidence imports were created, and no artifact status was changed.",
    "",
    "## Thesis",
    "",
    `- ${caseStudy.thesis}`,
    `- Scope: ${caseStudy.scope}`,
    `- Limitation: ${caseStudy.risk_limitation_statement}`,
    "",
    "## Constraint Cluster",
    "",
    ...caseStudy.constraints.map(
      (constraint) =>
        `- ${constraint.title} (${constraint.constraint_id}, ${constraint.industry}) - priority ${constraint.priority_score.toFixed(1)}, strategic ${constraint.strategic_score.toFixed(1)}, validation confidence ${constraint.validation_confidence.toFixed(1)}.`
    ),
    "",
    "## System Layers Affected",
    "",
    ...caseStudy.system_layers_affected.map((layer) => `- ${layer}`),
    "",
    "## Bottleneck Mechanisms",
    "",
    ...caseStudy.bottleneck_mechanisms.map((mechanism) => `- ${mechanism}`),
    "",
    "## Validation Questions",
    "",
    ...caseStudy.validation_questions.map((question) => `- ${question}`),
    "",
    "## Evidence Artifacts Needed",
    "",
    `- Artifact needs linked: ${caseStudy.evidence_artifacts_needed.length}`,
    `- Imported evidence records linked: ${caseStudy.imported_evidence_ids.length}`,
    `- Artifact type distribution: ${Object.entries(artifactTypeDistribution)
      .map(([type, count]) => `${type} (${count})`)
      .join(", ")}`,
    ...caseStudy.evidence_artifacts_needed.slice(0, 16).map(
      (artifact) =>
        `- ${artifact.artifact_id}: ${artifact.artifact_title} (${artifact.artifact_type}, status ${artifact.status}, priority ${artifact.priority.toFixed(1)})`
    ),
    "",
    "## Source Requests",
    "",
    ...caseStudy.source_requests.map(
      (request) =>
        `- ${request.request_title}: ${request.source_quality_tier}. Expected artifact type: ${request.expected_artifact_type}. Reason: ${request.reason}`
    ),
    "",
    "## Recommended First Campaign",
    "",
    `- ${caseStudy.recommended_first_campaign.title}: ${caseStudy.recommended_first_campaign.objective}`,
    `- Order: ${caseStudy.recommended_first_campaign.ordered_constraint_ids.join(" -> ")}`,
    `- Reason: ${caseStudy.recommended_first_campaign.reason}`,
    "",
    "## Next Validation Actions",
    "",
    ...caseStudy.recommended_next_validation_actions.map((action) => `- ${action}`),
    "",
    "## Future Decision Support",
    "",
    ...caseStudy.decision_support_later.map((decision) => `- ${decision}`),
    "",
    "## Limitations",
    "",
    "- This case study is not a proof claim.",
    "- Source requests are not evidence imports.",
    "- Artifact needs remain uncovered until a real import record is added and reviewed through the evidence import contract.",
    "- No PDF, scraper, external API, or AI extraction step was used."
  ].join("\n");
}

function caseStudyBuildCleanReportDir() {
  if (!caseStudyBuildExistsSync(caseStudyBuildReportDir)) return;
  caseStudyBuildReaddirSync(caseStudyBuildReportDir)
    .filter((entry) => [".md", ".json"].includes(caseStudyBuildExtname(entry)))
    .forEach((entry) =>
      caseStudyBuildUnlinkSync(caseStudyBuildJoin(caseStudyBuildReportDir, entry))
    );
}

function caseStudyBuildReadJson<T>(path: string) {
  return JSON.parse(caseStudyBuildReadFileSync(path, "utf8")) as T;
}

function caseStudyBuildWriteStableJson(path: string, output: Record<string, unknown>) {
  const stableOutput = caseStudyBuildPreserveGeneratedAt(path, output);
  caseStudyBuildMkdirSync(caseStudyBuildDirname(path), { recursive: true });
  caseStudyBuildWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function caseStudyBuildPreserveGeneratedAt(path: string, output: Record<string, unknown>) {
  if (!caseStudyBuildExistsSync(path)) return output;
  const existing = JSON.parse(caseStudyBuildReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const comparable = { ...existing, generated_at: output.generated_at };
  if (JSON.stringify(comparable) === JSON.stringify(output)) {
    return { ...output, generated_at: existing.generated_at };
  }
  return output;
}

caseStudyBuildMain();
