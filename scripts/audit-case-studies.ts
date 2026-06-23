type CaseStudyAuditFsModule = typeof import("node:fs");
type CaseStudyAuditPathModule = typeof import("node:path");

const {
  existsSync: caseStudyAuditExistsSync,
  readFileSync: caseStudyAuditReadFileSync
} = process.getBuiltinModule("fs") as CaseStudyAuditFsModule;
const { resolve: caseStudyAuditResolve } = process.getBuiltinModule(
  "path"
) as CaseStudyAuditPathModule;

const caseStudyAuditOutputPath = caseStudyAuditResolve(
  "data/exports/case_studies.json"
);
const caseStudyAuditDatasetPath = caseStudyAuditResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const caseStudyAuditArtifactPath = caseStudyAuditResolve(
  "data/exports/evidence_artifact_library.json"
);
const caseStudyAuditImportPath = caseStudyAuditResolve(
  "data/exports/evidence_import_registry.json"
);

type CaseStudyAuditExport = {
  summary: {
    case_study_count: number;
    included_constraint_count: number;
    evidence_import_count: number;
    source_request_count: number;
    artifact_need_count: number;
    uncovered_artifact_count: number;
  };
  case_studies: Array<{
    case_study_id: string;
    title: string;
    status: string;
    included_constraint_ids: string[];
    evidence_artifacts_needed: Array<{
      artifact_id: string;
      constraint_id: string;
      status: string;
    }>;
    imported_evidence_ids: string[];
    source_requests: Array<{
      source_request_id: string;
      constraint_id: string;
      artifact_ids: string[];
      source_quality_tier: string;
    }>;
    report_path: string;
  }>;
};

type CaseStudyAuditImport = {
  evidence_id: string;
  collection_status: string;
  review_status: string;
};

function caseStudyAuditMain() {
  const errors: string[] = [];
  if (!caseStudyAuditExistsSync(caseStudyAuditOutputPath)) {
    errors.push("case_studies.json does not exist.");
    caseStudyAuditFail(errors);
    return;
  }

  const output = caseStudyAuditReadJson<CaseStudyAuditExport>(
    caseStudyAuditOutputPath
  );
  const dataset = caseStudyAuditReadJson<{
    records: Array<{ id: string }>;
  }>(caseStudyAuditDatasetPath);
  const artifacts = caseStudyAuditReadJson<{
    artifacts: Array<{ artifact_id: string }>;
  }>(caseStudyAuditArtifactPath);
  const imports = caseStudyAuditReadJson<{
    import_count: number;
    imports: CaseStudyAuditImport[];
  }>(caseStudyAuditImportPath);

  const constraintIds = new Set(dataset.records.map((record) => record.id));
  const artifactIds = new Set(artifacts.artifacts.map((artifact) => artifact.artifact_id));
  const importIds = new Set(imports.imports.map((item) => item.evidence_id));
  const serialized = JSON.stringify(output);

  if (output.summary.case_study_count !== output.case_studies.length) {
    errors.push("Case study count does not match case_studies length.");
  }
  if (output.summary.case_study_count !== 1) {
    errors.push("V29 should contain exactly one focused case study.");
  }
  if (/undefined|NaN/.test(serialized)) {
    errors.push("Case study output contains undefined or NaN.");
  }
  if (/\b(proven|confirmed)\b/i.test(serialized)) {
    errors.push("Case study output uses proof language without imported evidence.");
  }
  if (/\b(validated claim|validated finding|validated evidence)\b/i.test(serialized)) {
    errors.push("Case study output uses validation-completion language.");
  }

  output.case_studies.forEach((caseStudy) => {
    if (caseStudy.included_constraint_ids.length < 5 || caseStudy.included_constraint_ids.length > 8) {
      errors.push(`${caseStudy.case_study_id} should include 5-8 constraints.`);
    }
    caseStudy.included_constraint_ids.forEach((constraintId) => {
      if (!constraintIds.has(constraintId)) {
        errors.push(`${caseStudy.case_study_id} references missing constraint ${constraintId}.`);
      }
    });
    caseStudy.evidence_artifacts_needed.forEach((artifact) => {
      if (!artifactIds.has(artifact.artifact_id)) {
        errors.push(`${caseStudy.case_study_id} references missing artifact ${artifact.artifact_id}.`);
      }
      if (!caseStudy.included_constraint_ids.includes(artifact.constraint_id)) {
        errors.push(`${artifact.artifact_id} is outside the case-study constraint cluster.`);
      }
      if (artifact.status !== "not_collected") {
        errors.push(`${artifact.artifact_id} has non-template artifact status ${artifact.status}.`);
      }
    });
    caseStudy.imported_evidence_ids.forEach((evidenceId) => {
      if (!importIds.has(evidenceId)) {
        errors.push(`${caseStudy.case_study_id} references missing evidence import ${evidenceId}.`);
      }
    });
    caseStudy.source_requests.forEach((request) => {
      if (!constraintIds.has(request.constraint_id)) {
        errors.push(`${request.source_request_id} references missing constraint ${request.constraint_id}.`);
      }
      if (!caseStudy.included_constraint_ids.includes(request.constraint_id)) {
        errors.push(`${request.source_request_id} is outside the case-study constraint cluster.`);
      }
      if (!request.source_quality_tier) {
        errors.push(`${request.source_request_id} is missing a source quality tier.`);
      }
      request.artifact_ids.forEach((artifactId) => {
        if (!artifactIds.has(artifactId)) {
          errors.push(`${request.source_request_id} references missing artifact ${artifactId}.`);
        }
      });
    });
    if (!caseStudy.report_path || !caseStudyAuditExistsSync(caseStudyAuditResolve(caseStudy.report_path))) {
      errors.push(`${caseStudy.case_study_id} report file is missing.`);
    }
    if (imports.import_count === 0 && caseStudy.imported_evidence_ids.length !== 0) {
      errors.push(`${caseStudy.case_study_id} links imported evidence while registry has zero imports.`);
    }
    if (imports.import_count === 0 && caseStudy.status !== "evidence-request-backed") {
      errors.push(`${caseStudy.case_study_id} must be evidence-request-backed while imports are zero.`);
    }
  });

  const reportText = output.case_studies
    .map((caseStudy) =>
      caseStudyAuditExistsSync(caseStudyAuditResolve(caseStudy.report_path))
        ? caseStudyAuditReadFileSync(caseStudyAuditResolve(caseStudy.report_path), "utf8")
        : ""
    )
    .join("\n");
  if (/undefined|NaN/.test(reportText)) {
    errors.push("Case study report contains undefined or NaN.");
  }
  if (imports.import_count === 0 && /\bcollected evidence|reviewed evidence|accepted evidence\b/i.test(reportText)) {
    errors.push("Case study report claims collected/reviewed/accepted evidence while imports are zero.");
  }
  if (/\bcomplete\b/i.test(reportText)) {
    errors.push("Case study report uses completion language.");
  }

  if (errors.length > 0) {
    caseStudyAuditFail(errors);
    return;
  }

  console.log("Case study audit");
  console.log(`- case studies: ${output.summary.case_study_count}`);
  console.log(`- included constraints: ${output.summary.included_constraint_count}`);
  console.log(`- evidence imports: ${output.summary.evidence_import_count}`);
  console.log(`- source requests: ${output.summary.source_request_count}`);
  console.log(`- artifact needs: ${output.summary.artifact_need_count}`);
  console.log(`- uncovered artifacts: ${output.summary.uncovered_artifact_count}`);
  console.log("- result: PASS");
}

function caseStudyAuditReadJson<T>(path: string) {
  return JSON.parse(caseStudyAuditReadFileSync(path, "utf8")) as T;
}

function caseStudyAuditFail(errors: string[]) {
  console.error("Case study audit failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

caseStudyAuditMain();
