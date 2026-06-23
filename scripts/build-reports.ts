type ReportBuildFsModule = typeof import("node:fs");
type ReportBuildPathModule = typeof import("node:path");

const {
  existsSync: reportBuildExistsSync,
  mkdirSync: reportBuildMkdirSync,
  readFileSync: reportBuildReadFileSync,
  readdirSync: reportBuildReaddirSync,
  unlinkSync: reportBuildUnlinkSync,
  writeFileSync: reportBuildWriteFileSync
} = process.getBuiltinModule("fs") as ReportBuildFsModule;
const {
  dirname: reportBuildDirname,
  extname: reportBuildExtname,
  join: reportBuildJoin,
  resolve: reportBuildResolve
} = process.getBuiltinModule("path") as ReportBuildPathModule;

const reportBuildDatasetPath = reportBuildResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const reportBuildTriagePath = reportBuildResolve("data/exports/validation_triage.json");
const reportBuildCampaignPath = reportBuildResolve(
  "data/exports/validation_campaigns.json"
);
const reportBuildPacketPath = reportBuildResolve(
  "data/exports/validation_evidence_packets.json"
);
const reportBuildArtifactPath = reportBuildResolve(
  "data/exports/evidence_artifact_library.json"
);
const reportBuildImportPath = reportBuildResolve(
  "data/exports/evidence_import_registry.json"
);
const reportBuildMatchPath = reportBuildResolve(
  "data/exports/evidence_artifact_matches.json"
);
const reportBuildAnalystStatePath = reportBuildResolve(
  "data/exports/analyst_state_template.json"
);
const reportBuildOutputDir = reportBuildResolve("data/exports/reports");
const reportBuildIndexPath = reportBuildJoin(reportBuildOutputDir, "report_index.json");

type ReportBuildRecord = {
  id: string;
  industry: string;
  title: string;
  description: string;
  evidence_gaps: string[];
  validation_status: string;
  confidence_reasoning: string;
  scores: {
    total_priority_score: number;
    total_strategic_score: number;
    validation_confidence_score: number;
  };
};

type ReportBuildTriage = {
  constraint_id: string;
  constraint_title: string;
  industry: string;
  validation_burden_score: number;
  recalibrated_severity: string;
  rationale: string;
  next_best_action: {
    action_title: string;
    action_summary: string;
    expected_artifact: string;
    rationale: string;
  };
  investigation_route: string;
  network_route: string;
};

type ReportBuildCampaign = {
  campaign_id: string;
  mode: string;
  title: string;
  objective: string;
  effort_level: string;
  analyst_timebox: string;
  selected_constraints: Array<{
    constraint_id: string;
    constraint_title: string;
    industry: string;
    validation_burden_score: number;
    expected_confidence_lift: number;
    required_artifacts: string[];
    source_upgrades_needed: string[];
    why_selected: string;
    decision_use: string;
  }>;
  required_artifacts: string[];
  source_upgrades_needed: string[];
  expected_confidence_lift: {
    total_estimated_lift: number;
    average_estimated_lift: number;
    explanation: string;
  };
  decision_use: string;
  why_this_campaign: string;
};

type ReportBuildPacket = {
  packet_id: string;
  constraint_id: string;
  constraint_title: string;
  triage_rank: number;
  evidence_needed: string;
  expected_artifact: string;
  pass_criteria: string[];
  fail_criteria: string[];
};

type ReportBuildArtifact = {
  artifact_id: string;
  constraint_id: string;
  constraint_title: string;
  artifact_type: string;
  artifact_title: string;
  why_needed: string;
  priority: number;
  status: string;
};

type ReportBuildImportSummary = {
  total_evidence_imports: number;
  artifact_needs_with_matching_imported_evidence: number;
  artifact_needs_still_uncovered: number;
};

type ReportBuildMatchExport = {
  summary: {
    evidence_import_count: number;
    artifact_need_count: number;
    matched_artifact_count: number;
    candidate_artifact_count: number;
    blocked_artifact_count: number;
    uncovered_artifact_count: number;
    review_ready_evidence_count: number;
    rejected_evidence_count: number;
    blocked_evidence_count: number;
  };
  top_validation_packet_coverage: Array<{
    packet_id: string;
    constraint_id: string;
    constraint_title: string;
    triage_rank: number;
    expected_artifact: string;
    uncovered_artifact_count: number;
    coverage_status: string;
    next_import_action: string;
  }>;
  top_uncovered_artifact_needs: Array<{
    artifact_id: string;
    constraint_id: string;
    constraint_title: string;
    artifact_type: string;
    artifact_title: string;
    priority: number;
    coverage_status: string;
    next_import_action: string;
  }>;
};

type ReportBuildState = {
  entity_type: string;
  entity_id: string;
  status: string;
  next_action: string;
};

type ReportBuildEntry = {
  report_id: string;
  report_type:
    | "validation_priority"
    | "evidence_coverage"
    | "campaign"
    | "constraint";
  title: string;
  markdown_path: string;
  json_path: string;
  referenced_constraint_ids: string[];
  referenced_campaign_ids: string[];
  referenced_artifact_ids: string[];
};

type ReportBuildOutput = {
  report_id: string;
  report_type: ReportBuildEntry["report_type"];
  title: string;
  summary: string;
  referenced_constraint_ids: string[];
  referenced_campaign_ids: string[];
  referenced_artifact_ids: string[];
  sections: Array<{
    heading: string;
    lines: string[];
  }>;
  markdown: string;
};

function reportBuildMain() {
  reportBuildMkdirSync(reportBuildOutputDir, { recursive: true });
  reportBuildCleanOutputDir();

  const dataset = reportBuildReadJson<{ records: ReportBuildRecord[] }>(
    reportBuildDatasetPath
  );
  const triage = reportBuildReadJson<{
    summary: Record<string, unknown>;
    topValidationQueue: ReportBuildTriage[];
  }>(reportBuildTriagePath);
  const campaigns = reportBuildReadJson<{
    campaigns: ReportBuildCampaign[];
  }>(reportBuildCampaignPath).campaigns;
  const packets = reportBuildReadJson<{ packets: ReportBuildPacket[] }>(
    reportBuildPacketPath
  ).packets;
  const artifacts = reportBuildReadJson<{
    summary: Record<string, unknown>;
    artifacts: ReportBuildArtifact[];
  }>(reportBuildArtifactPath);
  const importSummary = reportBuildReadJson<{
    summary: ReportBuildImportSummary;
  }>(reportBuildImportPath).summary;
  const matches = reportBuildReadJson<ReportBuildMatchExport>(reportBuildMatchPath);
  const analystState = reportBuildReadJson<{
    summary: { status_distribution: Record<string, number> };
    states: ReportBuildState[];
  }>(reportBuildAnalystStatePath);

  const recordsById = new Map(dataset.records.map((record) => [record.id, record]));
  const packetsByConstraint = new Map(
    packets.map((packet) => [packet.constraint_id, packet])
  );
  const artifactsByConstraint = reportBuildGroupBy(
    artifacts.artifacts,
    (artifact) => artifact.constraint_id
  );
  const statesByConstraint = reportBuildGroupBy(
    analystState.states.filter((state) => state.entity_type === "constraint"),
    (state) => state.entity_id
  );

  const reports = [
    reportBuildValidationPriorityReport(triage.topValidationQueue, recordsById),
    reportBuildEvidenceCoverageReport(importSummary, matches, artifacts),
    ...campaigns.map((campaign) =>
      reportBuildCampaignReport(campaign, recordsById, artifactsByConstraint)
    ),
    ...triage.topValidationQueue.slice(0, 10).map((item) =>
      reportBuildConstraintReport(
        item,
        recordsById,
        packetsByConstraint,
        artifactsByConstraint,
        statesByConstraint
      )
    )
  ];

  const entries = reports.map(reportBuildWriteReport);
  const index = {
    generated_at: new Date().toISOString(),
    report_count: entries.length,
    summary: {
      validation_priority_reports: entries.filter(
        (entry) => entry.report_type === "validation_priority"
      ).length,
      evidence_coverage_reports: entries.filter(
        (entry) => entry.report_type === "evidence_coverage"
      ).length,
      campaign_reports: entries.filter((entry) => entry.report_type === "campaign")
        .length,
      constraint_reports: entries.filter((entry) => entry.report_type === "constraint")
        .length,
      evidence_import_count: matches.summary.evidence_import_count,
      uncovered_artifact_count: matches.summary.uncovered_artifact_count,
      analyst_state_status_distribution: analystState.summary.status_distribution
    },
    reports: entries
  };
  reportBuildWriteStableJson(reportBuildIndexPath, index);

  console.log(
    `Built ${entries.length} analyst report(s) at ${reportBuildOutputDir}.`
  );
}

function reportBuildValidationPriorityReport(
  queue: ReportBuildTriage[],
  recordsById: Map<string, ReportBuildRecord>
): ReportBuildOutput {
  const referencedConstraintIds = queue.map((item) => item.constraint_id);
  return reportBuildOutput({
    report_id: "validation-priority",
    report_type: "validation_priority",
    title: "Validation Priority Report",
    summary:
      "A deterministic summary of the top validation queue, including hypothesis posture, validation burden, evidence gaps, and next actions.",
    referenced_constraint_ids: referencedConstraintIds,
    referenced_campaign_ids: [],
    referenced_artifact_ids: [],
    sections: [
      {
        heading: "Scope",
        lines: [
          `Top validation queue constraints: ${queue.length}`,
          "Report posture: prioritization aid, not a validation decision.",
          "Evidence state: no imported evidence is treated as collected unless the evidence import registry says so."
        ]
      },
      {
        heading: "Top Validation Queue",
        lines: queue.map((item, index) => {
          const record = recordsById.get(item.constraint_id);
          return `${index + 1}. ${item.constraint_title} (${item.industry}) - burden ${item.validation_burden_score.toFixed(1)}, ${item.recalibrated_severity}. Hypothesis: ${record?.description ?? "Constraint hypothesis unavailable."} Next action: ${item.next_best_action.action_title}. Evidence gap: ${record?.evidence_gaps[0] ?? "Evidence gap unavailable."}`;
        })
      },
      {
        heading: "Limitations",
        lines: [
          "This report ranks generated validation needs only.",
          "It does not claim that any requested artifact has been collected.",
          "It does not replace source review, local measurement, or operational validation."
        ]
      }
    ]
  });
}

function reportBuildEvidenceCoverageReport(
  importSummary: ReportBuildImportSummary,
  matches: ReportBuildMatchExport,
  artifacts: { artifacts: ReportBuildArtifact[] }
): ReportBuildOutput {
  return reportBuildOutput({
    report_id: "evidence-coverage",
    report_type: "evidence_coverage",
    title: "Evidence Coverage Report",
    summary:
      "A deterministic coverage report connecting imported evidence metadata to generated artifact needs.",
    referenced_constraint_ids: Array.from(
      new Set(matches.top_uncovered_artifact_needs.map((artifact) => artifact.constraint_id))
    ),
    referenced_campaign_ids: [],
    referenced_artifact_ids: matches.top_uncovered_artifact_needs.map(
      (artifact) => artifact.artifact_id
    ),
    sections: [
      {
        heading: "Coverage Summary",
        lines: [
          `Imported evidence records: ${matches.summary.evidence_import_count}`,
          `Artifact needs: ${matches.summary.artifact_need_count}`,
          `Matched artifact needs: ${matches.summary.matched_artifact_count}`,
          `Candidate artifact coverage: ${matches.summary.candidate_artifact_count}`,
          `Blocked evidence records: ${matches.summary.blocked_evidence_count}`,
          `Review-ready evidence records: ${matches.summary.review_ready_evidence_count}`,
          `Uncovered artifact needs: ${matches.summary.uncovered_artifact_count}`,
          `Import registry uncovered artifact count: ${importSummary.artifact_needs_still_uncovered}`
        ]
      },
      {
        heading: "Top Validation Packet Coverage",
        lines: matches.top_validation_packet_coverage.map(
          (packet) =>
            `Queue #${packet.triage_rank}: ${packet.constraint_title} - ${packet.coverage_status}, uncovered artifacts ${packet.uncovered_artifact_count}. Next import action: ${packet.next_import_action}`
        )
      },
      {
        heading: "Top Uncovered Artifact Needs",
        lines: matches.top_uncovered_artifact_needs.slice(0, 10).map(
          (artifact) =>
            `${artifact.constraint_title}: ${artifact.artifact_title} (${artifact.artifact_type}, priority ${artifact.priority.toFixed(1)}). Next action: ${artifact.next_import_action}`
        )
      },
      {
        heading: "Limitations",
        lines: [
          "Artifact statuses remain generated and unchanged.",
          `Current generated artifact count: ${artifacts.artifacts.length}`,
          "Zero imported evidence means this report should be read as an uncovered-needs map, not as proof of absence."
        ]
      }
    ]
  });
}

function reportBuildCampaignReport(
  campaign: ReportBuildCampaign,
  recordsById: Map<string, ReportBuildRecord>,
  artifactsByConstraint: Map<string, ReportBuildArtifact[]>
): ReportBuildOutput {
  const referencedConstraintIds = campaign.selected_constraints.map(
    (constraint) => constraint.constraint_id
  );
  const referencedArtifactIds = referencedConstraintIds.flatMap(
    (constraintId) =>
      artifactsByConstraint.get(constraintId)?.slice(0, 3).map((artifact) => artifact.artifact_id) ??
      []
  );
  return reportBuildOutput({
    report_id: `campaign-${reportBuildSlug(campaign.campaign_id)}`,
    report_type: "campaign",
    title: `${campaign.title} Report`,
    summary: campaign.objective,
    referenced_constraint_ids: referencedConstraintIds,
    referenced_campaign_ids: [campaign.campaign_id],
    referenced_artifact_ids: referencedArtifactIds,
    sections: [
      {
        heading: "Campaign Objective",
        lines: [
          `Mode: ${campaign.mode}`,
          `Effort level: ${campaign.effort_level}`,
          `Timebox: ${campaign.analyst_timebox}`,
          `Decision use: ${campaign.decision_use}`,
          `Expected confidence lift: +${campaign.expected_confidence_lift.total_estimated_lift.toFixed(1)} total / +${campaign.expected_confidence_lift.average_estimated_lift.toFixed(1)} average`,
          campaign.why_this_campaign
        ]
      },
      {
        heading: "Selected Constraints",
        lines: campaign.selected_constraints.map((constraint) => {
          const record = recordsById.get(constraint.constraint_id);
          return `${constraint.constraint_title} (${constraint.industry}) - burden ${constraint.validation_burden_score.toFixed(1)}, lift +${constraint.expected_confidence_lift.toFixed(1)}. Hypothesis: ${record?.description ?? "Constraint hypothesis unavailable."} Next artifact: ${constraint.required_artifacts[0] ?? "Artifact requirement unavailable."}`;
        })
      },
      {
        heading: "Required Artifacts And Source Upgrades",
        lines: [
          ...campaign.required_artifacts.slice(0, 12).map((artifact) => `Artifact need: ${artifact}`),
          ...campaign.source_upgrades_needed
            .slice(0, 8)
            .map((upgrade) => `Source upgrade: ${upgrade}`)
        ]
      },
      {
        heading: "Limitations",
        lines: [
          "Campaigns are plans generated from local evidence and validation signals.",
          "The report does not assert that the artifacts exist or that confidence has actually improved.",
          "Analyst state remains not_started unless a future human workflow changes it."
        ]
      }
    ]
  });
}

function reportBuildConstraintReport(
  triage: ReportBuildTriage,
  recordsById: Map<string, ReportBuildRecord>,
  packetsByConstraint: Map<string, ReportBuildPacket>,
  artifactsByConstraint: Map<string, ReportBuildArtifact[]>,
  statesByConstraint: Map<string, ReportBuildState[]>
): ReportBuildOutput {
  const record = recordsById.get(triage.constraint_id);
  const packet = packetsByConstraint.get(triage.constraint_id);
  const artifacts = artifactsByConstraint.get(triage.constraint_id) ?? [];
  const state = statesByConstraint.get(triage.constraint_id)?.[0];
  const artifactNeedLines = artifacts
    .slice()
    .sort((first, second) => second.priority - first.priority)
    .slice(0, 6)
    .map(
      (artifact) =>
        `${artifact.artifact_title} (${artifact.artifact_type}, status ${artifact.status}, priority ${artifact.priority.toFixed(1)}). Why needed: ${artifact.why_needed}`
    );

  return reportBuildOutput({
    report_id: `constraint-${triage.constraint_id}`,
    report_type: "constraint",
    title: `${triage.constraint_title} Constraint Report`,
    summary:
      record?.description ??
      "Constraint hypothesis generated from the local validation queue.",
    referenced_constraint_ids: [triage.constraint_id],
    referenced_campaign_ids: [],
    referenced_artifact_ids: artifacts.map((artifact) => artifact.artifact_id),
    sections: [
      {
        heading: "Hypothesis",
        lines: [
          record?.description ?? "Constraint hypothesis unavailable.",
          `Industry: ${triage.industry}`,
          `Validation status: ${record?.validation_status ?? "Unknown"}`,
          `Validation confidence: ${record?.scores.validation_confidence_score.toFixed(1) ?? "Unknown"}`,
          `Priority score: ${record?.scores.total_priority_score.toFixed(1) ?? "Unknown"}`,
          `Strategic score: ${record?.scores.total_strategic_score.toFixed(1) ?? "Unknown"}`
        ]
      },
      {
        heading: "Evidence Gap And Validation Burden",
        lines: [
          `Validation burden: ${triage.validation_burden_score.toFixed(1)} (${triage.recalibrated_severity})`,
          triage.rationale,
          ...(record?.evidence_gaps.map((gap) => `Evidence gap: ${gap}`) ?? [
            "Evidence gap unavailable."
          ])
        ]
      },
      {
        heading: "Next Validation Action",
        lines: [
          triage.next_best_action.action_title,
          triage.next_best_action.action_summary,
          `Expected artifact: ${triage.next_best_action.expected_artifact}`,
          `Rationale: ${triage.next_best_action.rationale}`
        ]
      },
      {
        heading: "Evidence Packet Criteria",
        lines: packet
          ? [
              `Evidence needed: ${packet.evidence_needed}`,
              ...packet.pass_criteria.map((criterion) => `Pass: ${criterion}`),
              ...packet.fail_criteria.map((criterion) => `Fail: ${criterion}`)
            ]
          : ["No top evidence packet is currently attached to this constraint."]
      },
      {
        heading: "Artifact Needs",
        lines:
          artifactNeedLines.length > 0
            ? artifactNeedLines
            : ["No generated artifact needs are attached."]
      },
      {
        heading: "Analyst State",
        lines: [
          `Constraint state: ${state?.status ?? "unreviewed"}`,
          `Next action: ${state?.next_action ?? "Review the generated validation packet and artifact needs."}`,
          "This report does not claim human review, evidence collection, or decision readiness."
        ]
      },
      {
        heading: "Limitations",
        lines: [
          "This is a generated local analyst note.",
          "It uses existing exports only and does not introduce external facts.",
          "Uncovered evidence means a validation artifact is still needed."
        ]
      }
    ]
  });
}

function reportBuildOutput({
  referenced_artifact_ids,
  referenced_campaign_ids,
  referenced_constraint_ids,
  report_id,
  report_type,
  sections,
  summary,
  title
}: Omit<ReportBuildOutput, "markdown">): ReportBuildOutput {
  const markdown = reportBuildMarkdown(title, summary, sections);
  return {
    report_id,
    report_type,
    title,
    summary,
    referenced_constraint_ids,
    referenced_campaign_ids,
    referenced_artifact_ids,
    sections,
    markdown
  };
}

function reportBuildMarkdown(
  title: string,
  summary: string,
  sections: ReportBuildOutput["sections"]
) {
  return [
    `# ${title}`,
    "",
    summary,
    "",
    "> Deterministic local report. No external sources were fetched and no evidence status was changed.",
    "",
    ...sections.flatMap((section) => [
      `## ${section.heading}`,
      "",
      ...section.lines.map((line) => `- ${reportBuildCleanLine(line)}`),
      ""
    ])
  ].join("\n");
}

function reportBuildWriteReport(report: ReportBuildOutput): ReportBuildEntry {
  const markdownFile = `${report.report_id}.md`;
  const jsonFile = `${report.report_id}.json`;
  reportBuildWriteFileSync(reportBuildJoin(reportBuildOutputDir, markdownFile), report.markdown);
  reportBuildWriteFileSync(
    reportBuildJoin(reportBuildOutputDir, jsonFile),
    `${JSON.stringify({ ...report, markdown: undefined }, null, 2)}\n`
  );
  return {
    report_id: report.report_id,
    report_type: report.report_type,
    title: report.title,
    markdown_path: `data/exports/reports/${markdownFile}`,
    json_path: `data/exports/reports/${jsonFile}`,
    referenced_constraint_ids: report.referenced_constraint_ids,
    referenced_campaign_ids: report.referenced_campaign_ids,
    referenced_artifact_ids: report.referenced_artifact_ids
  };
}

function reportBuildCleanOutputDir() {
  if (!reportBuildExistsSync(reportBuildOutputDir)) return;
  reportBuildReaddirSync(reportBuildOutputDir)
    .filter((entry) => [".md", ".json"].includes(reportBuildExtname(entry)))
    .forEach((entry) => reportBuildUnlinkSync(reportBuildJoin(reportBuildOutputDir, entry)));
}

function reportBuildReadJson<T>(path: string) {
  return JSON.parse(reportBuildReadFileSync(path, "utf8")) as T;
}

function reportBuildWriteStableJson(path: string, output: Record<string, unknown>) {
  const stableOutput = reportBuildPreserveGeneratedAt(path, output);
  reportBuildMkdirSync(reportBuildDirname(path), { recursive: true });
  reportBuildWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function reportBuildPreserveGeneratedAt(path: string, output: Record<string, unknown>) {
  if (!reportBuildExistsSync(path)) return output;
  const existing = JSON.parse(reportBuildReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const comparable = { ...existing, generated_at: output.generated_at };
  if (JSON.stringify(comparable) === JSON.stringify(output)) {
    return { ...output, generated_at: existing.generated_at };
  }
  return output;
}

function reportBuildGroupBy<T>(items: T[], keyFor: (item: T) => string) {
  return items.reduce<Map<string, T[]>>((groups, item) => {
    const key = keyFor(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
    return groups;
  }, new Map());
}

function reportBuildSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function reportBuildCleanLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

reportBuildMain();
