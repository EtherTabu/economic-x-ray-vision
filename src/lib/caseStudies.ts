export type CaseStudySourceRequest = {
  source_request_id: string;
  constraint_id: string;
  constraint_title: string;
  artifact_ids: string[];
  source_quality_tier: string;
  request_title: string;
  reason: string;
  preferred_source_owner: string;
  expected_artifact_type: string;
};

export type CaseStudyConstraint = {
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
};

export type CaseStudy = {
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
  source_requests: CaseStudySourceRequest[];
  risk_limitation_statement: string;
  recommended_next_validation_actions: string[];
  recommended_first_campaign: {
    title: string;
    objective: string;
    ordered_constraint_ids: string[];
    reason: string;
  };
  decision_support_later: string[];
  constraints: CaseStudyConstraint[];
  report_path: string;
};

export type CaseStudyExport = {
  generated_at: string;
  summary: {
    case_study_count: number;
    included_constraint_count: number;
    evidence_import_count: number;
    source_request_count: number;
    artifact_need_count: number;
    uncovered_artifact_count: number;
    status_distribution: Record<string, number>;
  };
  case_studies: CaseStudy[];
};
