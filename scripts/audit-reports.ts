type ReportAuditFsModule = typeof import("node:fs");
type ReportAuditPathModule = typeof import("node:path");

const {
  existsSync: reportAuditExistsSync,
  readFileSync: reportAuditReadFileSync
} = process.getBuiltinModule("fs") as ReportAuditFsModule;
const { resolve: reportAuditResolve } = process.getBuiltinModule(
  "path"
) as ReportAuditPathModule;

const reportAuditIndexPath = reportAuditResolve(
  "data/exports/reports/report_index.json"
);
const reportAuditDatasetPath = reportAuditResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const reportAuditCampaignPath = reportAuditResolve(
  "data/exports/validation_campaigns.json"
);
const reportAuditArtifactPath = reportAuditResolve(
  "data/exports/evidence_artifact_library.json"
);
const reportAuditImportPath = reportAuditResolve(
  "data/exports/evidence_import_registry.json"
);
const reportAuditAnalystStatePath = reportAuditResolve(
  "data/exports/analyst_state_template.json"
);

type ReportAuditIndex = {
  report_count: number;
  summary: {
    evidence_import_count: number;
    uncovered_artifact_count: number;
    analyst_state_status_distribution: Record<string, number>;
  };
  reports: Array<{
    report_id: string;
    report_type: string;
    title: string;
    markdown_path: string;
    json_path: string;
    referenced_constraint_ids: string[];
    referenced_campaign_ids: string[];
    referenced_artifact_ids: string[];
  }>;
};

const reportAuditFailures: string[] = [];

if (!reportAuditExistsSync(reportAuditIndexPath)) {
  reportAuditFailures.push("report index does not exist");
}

const reportAuditIndex = reportAuditReadJson<ReportAuditIndex>(reportAuditIndexPath);
const reportAuditDataset = reportAuditReadJson<{ records: Array<{ id: string }> }>(
  reportAuditDatasetPath
);
const reportAuditCampaigns = reportAuditReadJson<{
  campaigns: Array<{ campaign_id: string }>;
}>(reportAuditCampaignPath);
const reportAuditArtifacts = reportAuditReadJson<{
  artifacts: Array<{ artifact_id: string; status: string }>;
}>(reportAuditArtifactPath);
const reportAuditImports = reportAuditReadJson<{
  import_count: number;
}>(reportAuditImportPath);
const reportAuditAnalystState = reportAuditReadJson<{
  states: Array<{ status: string }>;
}>(reportAuditAnalystStatePath);

const reportAuditConstraintIds = new Set(
  reportAuditDataset.records.map((record) => record.id)
);
const reportAuditCampaignIds = new Set(
  reportAuditCampaigns.campaigns.map((campaign) => campaign.campaign_id)
);
const reportAuditArtifactIds = new Set(
  reportAuditArtifacts.artifacts.map((artifact) => artifact.artifact_id)
);
const reportAuditReportIds = new Set<string>();
const reportAuditDuplicateIds = reportAuditIndex.reports.filter((report) => {
  if (reportAuditReportIds.has(report.report_id)) return true;
  reportAuditReportIds.add(report.report_id);
  return false;
});
const reportAuditMissingFiles = reportAuditIndex.reports.filter(
  (report) =>
    !reportAuditExistsSync(reportAuditResolve(report.markdown_path)) ||
    !reportAuditExistsSync(reportAuditResolve(report.json_path))
);
const reportAuditAllMarkdown = reportAuditIndex.reports
  .map((report) => reportAuditReadFileSync(reportAuditResolve(report.markdown_path), "utf8"))
  .join("\n");
const reportAuditAllJson = reportAuditIndex.reports
  .map((report) => reportAuditReadFileSync(reportAuditResolve(report.json_path), "utf8"))
  .join("\n");
const reportAuditBadTokens = /\b(undefined|NaN)\b/.test(
  `${JSON.stringify(reportAuditIndex)}\n${reportAuditAllMarkdown}\n${reportAuditAllJson}`
);
const reportAuditInvalidConstraints = reportAuditIndex.reports.flatMap((report) =>
  report.referenced_constraint_ids.filter(
    (constraintId) => !reportAuditConstraintIds.has(constraintId)
  )
);
const reportAuditInvalidCampaigns = reportAuditIndex.reports.flatMap((report) =>
  report.referenced_campaign_ids.filter(
    (campaignId) => !reportAuditCampaignIds.has(campaignId)
  )
);
const reportAuditInvalidArtifacts = reportAuditIndex.reports.flatMap((report) =>
  report.referenced_artifact_ids.filter(
    (artifactId) => !reportAuditArtifactIds.has(artifactId)
  )
);
const reportAuditCompletionClaims = /\b(completed|complete|accepted|decision-ready|collected evidence)\b/i.test(
  reportAuditAllMarkdown
);

console.log("Report builder audit");
console.log(`- report count: ${reportAuditIndex.report_count}`);
console.log(
  `- evidence imports represented: ${reportAuditIndex.summary.evidence_import_count}`
);
console.log(
  `- uncovered artifacts represented: ${reportAuditIndex.summary.uncovered_artifact_count}`
);
console.log(
  `- report types: ${reportAuditFormatDistribution(
    reportAuditIndex.reports.map((report) => report.report_type)
  )}`
);

if (reportAuditIndex.report_count !== reportAuditIndex.reports.length) {
  reportAuditFailures.push("report index count does not match report entries");
}
if (reportAuditIndex.report_count < 6 || reportAuditIndex.report_count > 20) {
  reportAuditFailures.push("report count should be useful but not bloated");
}
if (reportAuditDuplicateIds.length > 0) {
  reportAuditFailures.push("duplicate report IDs found");
}
if (reportAuditMissingFiles.length > 0) {
  reportAuditFailures.push("one or more indexed report files is missing");
}
if (reportAuditBadTokens) {
  reportAuditFailures.push("one or more reports contains undefined or NaN");
}
if (reportAuditInvalidConstraints.length > 0) {
  reportAuditFailures.push("one or more reports references an unknown constraint");
}
if (reportAuditInvalidCampaigns.length > 0) {
  reportAuditFailures.push("one or more reports references an unknown campaign");
}
if (reportAuditInvalidArtifacts.length > 0) {
  reportAuditFailures.push("one or more reports references an unknown artifact");
}
if (
  reportAuditImports.import_count === 0 &&
  reportAuditIndex.summary.evidence_import_count !== 0
) {
  reportAuditFailures.push("zero-import state is not represented honestly");
}
if (reportAuditImports.import_count === 0 && /imported evidence records: [1-9]/i.test(reportAuditAllMarkdown)) {
  reportAuditFailures.push("report claims imported evidence exists when import count is zero");
}
if (reportAuditCompletionClaims) {
  reportAuditFailures.push("reports contain completion or acceptance claims");
}
if (
  reportAuditAnalystState.states.some((state) =>
    ["complete", "accepted", "reviewed"].includes(state.status)
  )
) {
  reportAuditFailures.push("analyst state contains completed/reviewed statuses");
}
if (
  reportAuditArtifacts.artifacts.some((artifact) => artifact.status !== "not_collected")
) {
  reportAuditFailures.push("artifact library contains changed collection status");
}

if (reportAuditFailures.length > 0) {
  console.error("- report audit failures:");
  reportAuditFailures.forEach((failure) => console.error(`  - ${failure}`));
  process.exitCode = 1;
} else {
  console.log("- result: PASS");
}

function reportAuditReadJson<T>(path: string) {
  return JSON.parse(reportAuditReadFileSync(path, "utf8")) as T;
}

function reportAuditFormatDistribution(values: string[]) {
  const counts = values.reduce<Record<string, number>>((distribution, value) => {
    distribution[value] = (distribution[value] ?? 0) + 1;
    return distribution;
  }, {});
  return Object.entries(counts)
    .map(([label, count]) => `${label} (${count})`)
    .join(", ");
}
