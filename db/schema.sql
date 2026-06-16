-- Planned SQLite schema for a future local data layer.
-- V1 currently renders static TypeScript seed data from src/data.

CREATE TABLE IF NOT EXISTS constraints (
  id TEXT PRIMARY KEY,
  origin TEXT NOT NULL CHECK (origin IN ('seed', 'intake')),
  industry TEXT NOT NULL,
  subsector TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  affected_parties_json TEXT NOT NULL,
  current_process_json TEXT NOT NULL,
  resource_waste_json TEXT NOT NULL,
  time_waste INTEGER NOT NULL CHECK (time_waste BETWEEN 1 AND 10),
  capital_waste INTEGER NOT NULL CHECK (capital_waste BETWEEN 1 AND 10),
  labor_waste INTEGER NOT NULL CHECK (labor_waste BETWEEN 1 AND 10),
  opportunity_cost TEXT NOT NULL,
  estimated_annual_impact TEXT NOT NULL,
  growth_trend TEXT NOT NULL CHECK (growth_trend IN ('Decreasing', 'Stable', 'Increasing')),
  visibility_score INTEGER NOT NULL CHECK (visibility_score BETWEEN 1 AND 10),
  overlooked_score INTEGER NOT NULL CHECK (overlooked_score BETWEEN 1 AND 10),
  digital_solution_potential INTEGER NOT NULL CHECK (digital_solution_potential BETWEEN 1 AND 10),
  automation_potential INTEGER NOT NULL CHECK (automation_potential BETWEEN 1 AND 10),
  ai_potential INTEGER NOT NULL CHECK (ai_potential BETWEEN 1 AND 10),
  implementation_complexity INTEGER NOT NULL CHECK (implementation_complexity BETWEEN 1 AND 10),
  regulatory_complexity INTEGER NOT NULL CHECK (regulatory_complexity BETWEEN 1 AND 10),
  adoption_complexity INTEGER NOT NULL CHECK (adoption_complexity BETWEEN 1 AND 10),
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 1 AND 10),
  sources_json TEXT NOT NULL,
  evidence_strength TEXT NOT NULL CHECK (evidence_strength IN ('Low', 'Moderate', 'High')),
  source_type TEXT NOT NULL CHECK (
    source_type IN (
      'Government',
      'Industry Benchmark',
      'Professional Association',
      'Mixed Secondary',
      'Operational Pattern'
    )
  ),
  validation_status TEXT NOT NULL CHECK (
    validation_status IN (
      'Unverified',
      'Plausible',
      'Partially Validated',
      'Validated'
    )
  ),
  source_quality INTEGER NOT NULL CHECK (source_quality BETWEEN 1 AND 10),
  measurement_difficulty INTEGER NOT NULL CHECK (measurement_difficulty BETWEEN 1 AND 10),
  data_availability INTEGER NOT NULL CHECK (data_availability BETWEEN 1 AND 10),
  confidence_reasoning TEXT NOT NULL,
  validation_notes_json TEXT NOT NULL,
  evidence_gaps_json TEXT NOT NULL,
  upstream_constraints_json TEXT NOT NULL,
  downstream_constraints_json TEXT NOT NULL,
  related_processes_json TEXT NOT NULL,
  affected_systems_json TEXT NOT NULL,
  solution_hypotheses_json TEXT NOT NULL,
  opportunity_type TEXT NOT NULL CHECK (
    opportunity_type IN (
      'Automation',
      'Workflow Redesign',
      'Data Quality',
      'Capacity Optimization',
      'Compliance Simplification'
    )
  ),
  primary_archetype TEXT NOT NULL,
  secondary_archetypes_json TEXT NOT NULL,
  archetype_confidence INTEGER NOT NULL CHECK (archetype_confidence BETWEEN 1 AND 10),
  archetype_reasoning TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS constraint_scores (
  constraint_id TEXT PRIMARY KEY,
  severity_score REAL NOT NULL,
  solvability_score REAL NOT NULL,
  ai_readiness_score REAL NOT NULL,
  overlooked_opportunity_score REAL NOT NULL,
  evidence_score REAL NOT NULL,
  measurability_score REAL NOT NULL,
  validation_confidence_score REAL NOT NULL,
  constraint_density_score REAL NOT NULL,
  downstream_impact_score REAL NOT NULL,
  opportunity_score REAL NOT NULL,
  total_strategic_score REAL NOT NULL,
  archetype_spread_score REAL NOT NULL,
  cross_industry_similarity_score REAL NOT NULL,
  total_priority_score REAL NOT NULL,
  scored_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (constraint_id) REFERENCES constraints(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source_records (
  source_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  publisher TEXT NOT NULL,
  referenced_by_json TEXT NOT NULL,
  provenance_level TEXT NOT NULL,
  citation_status TEXT NOT NULL,
  trust_weight REAL NOT NULL CHECK (trust_weight BETWEEN 1 AND 10),
  verification_need TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS constraint_sources (
  constraint_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  PRIMARY KEY (constraint_id, source_id),
  FOREIGN KEY (constraint_id) REFERENCES constraints(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES source_records(source_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evidence_packs (
  constraint_id TEXT PRIMARY KEY,
  constraint_title TEXT NOT NULL,
  core_claim TEXT NOT NULL,
  source_records_json TEXT NOT NULL,
  claim_support_json TEXT NOT NULL,
  evidence_gaps_json TEXT NOT NULL,
  provenance_notes_json TEXT NOT NULL,
  provenance_status TEXT NOT NULL CHECK (provenance_status IN ('thin', 'workable', 'strong')),
  source_coverage_score REAL NOT NULL CHECK (source_coverage_score BETWEEN 1 AND 10),
  claim_support_score REAL NOT NULL CHECK (claim_support_score BETWEEN 1 AND 10),
  provenance_score REAL NOT NULL CHECK (provenance_score BETWEEN 1 AND 10),
  defensibility_score REAL NOT NULL CHECK (defensibility_score BETWEEN 1 AND 10),
  recommended_source_upgrade TEXT NOT NULL,
  audit_flags_json TEXT NOT NULL,
  FOREIGN KEY (constraint_id) REFERENCES constraints(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS validation_tasks (
  task_id TEXT PRIMARY KEY,
  constraint_id TEXT NOT NULL,
  constraint_title TEXT NOT NULL,
  industry TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (
    task_type IN (
      'primary_document_needed',
      'source_url_needed',
      'local_observation_needed',
      'evidence_gap_resolution',
      'claim_support_needed',
      'metric_definition_needed',
      'validation_interview_needed',
      'high_opportunity_weak_evidence',
      'low_defensibility_review',
      'intervention_validation_needed'
    )
  ),
  task_title TEXT NOT NULL,
  task_summary TEXT NOT NULL,
  priority_score REAL NOT NULL CHECK (priority_score BETWEEN 1 AND 10),
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Moderate', 'High', 'Critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'blocked', 'review_ready')),
  evidence_gap TEXT NOT NULL,
  source_gap TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  expected_artifact TEXT NOT NULL,
  blocking_reason TEXT NOT NULL,
  generated_from_json TEXT NOT NULL,
  defensibility_score REAL,
  validation_confidence REAL,
  source_ids_json TEXT NOT NULL,
  investigation_route TEXT NOT NULL,
  network_route TEXT NOT NULL,
  FOREIGN KEY (constraint_id) REFERENCES constraints(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS database_builds (
  id TEXT PRIMARY KEY,
  built_at TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  source_count INTEGER NOT NULL,
  evidence_pack_count INTEGER NOT NULL,
  validation_task_count INTEGER NOT NULL,
  schema_version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_constraints_category ON constraints(category);
CREATE INDEX IF NOT EXISTS idx_constraints_industry ON constraints(industry);
CREATE INDEX IF NOT EXISTS idx_constraints_subsector ON constraints(subsector);
CREATE INDEX IF NOT EXISTS idx_constraints_primary_archetype
  ON constraints(primary_archetype);
CREATE INDEX IF NOT EXISTS idx_constraints_validation_status
  ON constraints(validation_status);
CREATE INDEX IF NOT EXISTS idx_constraints_opportunity_type
  ON constraints(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_constraint_scores_priority
  ON constraint_scores(total_priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_constraint_scores_strategic
  ON constraint_scores(total_strategic_score DESC);
CREATE INDEX IF NOT EXISTS idx_constraint_scores_validation
  ON constraint_scores(validation_confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_source_records_citation_status
  ON source_records(citation_status);
CREATE INDEX IF NOT EXISTS idx_source_records_provenance_level
  ON source_records(provenance_level);
CREATE INDEX IF NOT EXISTS idx_evidence_packs_defensibility
  ON evidence_packs(defensibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_packs_provenance_status
  ON evidence_packs(provenance_status);
CREATE INDEX IF NOT EXISTS idx_validation_tasks_constraint
  ON validation_tasks(constraint_id);
CREATE INDEX IF NOT EXISTS idx_validation_tasks_priority
  ON validation_tasks(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_validation_tasks_type
  ON validation_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_validation_tasks_status
  ON validation_tasks(status);
