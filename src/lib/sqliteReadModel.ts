type SqliteReadModelModuleModule = typeof import("node:module");
type SqliteReadModelPathModule = typeof import("node:path");

type SqliteReadModelDatabase = {
  close: () => void;
  prepare: (sql: string) => {
    all: (...parameters: unknown[]) => Record<string, unknown>[];
    get: (...parameters: unknown[]) => Record<string, unknown> | undefined;
  };
};

type SqliteReadModelSqliteModule = {
  DatabaseSync: new (path: string) => SqliteReadModelDatabase;
};

const { createRequire: sqliteReadModelCreateRequire } =
  process.getBuiltinModule("module") as SqliteReadModelModuleModule;
const { resolve: sqliteReadModelResolve } = process.getBuiltinModule(
  "path"
) as SqliteReadModelPathModule;
const sqliteReadModelRequire = sqliteReadModelCreateRequire(
  sqliteReadModelResolve("package.json")
);
const { DatabaseSync: SqliteReadModelDatabaseSync } = sqliteReadModelRequire(
  "node:sqlite"
) as SqliteReadModelSqliteModule;

export type SqliteReadModelConstraint = {
  id: string;
  origin: string;
  industry: string;
  subsector: string;
  title: string;
  category: string;
  description: string;
  evidence: string[];
  affected_parties: string[];
  current_process: string[];
  resource_waste: string[];
  sources: string[];
  evidence_gaps: string[];
  upstream_constraints: string[];
  downstream_constraints: string[];
  related_processes: string[];
  affected_systems: string[];
  solution_hypotheses: string[];
  secondary_archetypes: string[];
  scores: Record<string, number>;
};

export type SqliteReadModelSource = {
  source_id: string;
  title: string;
  source_type: string;
  publisher: string;
  referenced_by: string[];
  provenance_level: string;
  citation_status: string;
  trust_weight: number;
  verification_need: string;
};

export type SqliteReadModelEvidencePack = {
  constraint_id: string;
  constraint_title: string;
  core_claim: string;
  source_records: SqliteReadModelSource[];
  claim_support: Array<Record<string, unknown>>;
  evidence_gaps: string[];
  provenance_notes: string[];
  provenance_status: string;
  source_coverage_score: number;
  claim_support_score: number;
  provenance_score: number;
  defensibility_score: number;
  recommended_source_upgrade: string;
  audit_flags: string[];
};

export type SqliteReadModelValidationTask = {
  task_id: string;
  constraint_id: string;
  constraint_title: string;
  industry: string;
  task_type: string;
  task_title: string;
  task_summary: string;
  priority_score: number;
  severity: string;
  status: string;
  evidence_gap: string;
  source_gap: string;
  recommended_action: string;
  expected_artifact: string;
  blocking_reason: string;
  generated_from: string[];
  defensibility_score: number | null;
  validation_confidence: number | null;
  source_ids: string[];
  investigation_route: string;
  network_route: string;
};

export type SqliteReadModelConstraintSourceLink = {
  constraint_id: string;
  source_id: string;
};

export type SqliteReadModelBuildMetadata = {
  id: string;
  built_at: string;
  content_hash: string;
  record_count: number;
  source_count: number;
  evidence_pack_count: number;
  validation_task_count: number;
  schema_version: string;
};

export type SqliteReadModelSnapshot = {
  build: SqliteReadModelBuildMetadata | null;
  counts: Record<string, number>;
  constraints: SqliteReadModelConstraint[];
  sources: SqliteReadModelSource[];
  constraintSourceLinks: SqliteReadModelConstraintSourceLink[];
  evidencePacks: SqliteReadModelEvidencePack[];
  validationTasks: SqliteReadModelValidationTask[];
};

export function loadSqliteReadModel(
  sqlitePath = sqliteReadModelResolve("data/exports/constraint_intelligence.sqlite")
): SqliteReadModelSnapshot {
  const db = new SqliteReadModelDatabaseSync(sqlitePath);

  try {
    return {
      build: readBuildMetadata(db),
      counts: {
        constraints: countRows(db, "constraints"),
        scores: countRows(db, "constraint_scores"),
        sources: countRows(db, "source_records"),
        constraintSourceLinks: countRows(db, "constraint_sources"),
        evidencePacks: countRows(db, "evidence_packs"),
        validationTasks: countRows(db, "validation_tasks")
      },
      constraints: readConstraints(db),
      sources: readSources(db),
      constraintSourceLinks: readConstraintSourceLinks(db),
      evidencePacks: readEvidencePacks(db),
      validationTasks: readValidationTasks(db)
    };
  } finally {
    db.close();
  }
}

function readBuildMetadata(db: SqliteReadModelDatabase) {
  const row = db
    .prepare("SELECT * FROM database_builds WHERE id = 'current'")
    .get();
  return row ? (row as SqliteReadModelBuildMetadata) : null;
}

function readConstraints(db: SqliteReadModelDatabase): SqliteReadModelConstraint[] {
  const rows = db.prepare(`
    SELECT constraints.*, scores.*
    FROM constraints
    JOIN constraint_scores scores ON scores.constraint_id = constraints.id
    ORDER BY constraints.id
  `).all();

  return rows.map((row) => ({
    id: stringValue(row.id),
    origin: stringValue(row.origin),
    industry: stringValue(row.industry),
    subsector: stringValue(row.subsector),
    title: stringValue(row.title),
    category: stringValue(row.category),
    description: stringValue(row.description),
    evidence: parseJsonArray(row.evidence_json),
    affected_parties: parseJsonArray(row.affected_parties_json),
    current_process: parseJsonArray(row.current_process_json),
    resource_waste: parseJsonArray(row.resource_waste_json),
    sources: parseJsonArray(row.sources_json),
    evidence_gaps: parseJsonArray(row.evidence_gaps_json),
    upstream_constraints: parseJsonArray(row.upstream_constraints_json),
    downstream_constraints: parseJsonArray(row.downstream_constraints_json),
    related_processes: parseJsonArray(row.related_processes_json),
    affected_systems: parseJsonArray(row.affected_systems_json),
    solution_hypotheses: parseJsonArray(row.solution_hypotheses_json),
    secondary_archetypes: parseJsonArray(row.secondary_archetypes_json),
    scores: {
      severity_score: numberValue(row.severity_score),
      solvability_score: numberValue(row.solvability_score),
      ai_readiness_score: numberValue(row.ai_readiness_score),
      overlooked_opportunity_score: numberValue(row.overlooked_opportunity_score),
      evidence_score: numberValue(row.evidence_score),
      measurability_score: numberValue(row.measurability_score),
      validation_confidence_score: numberValue(row.validation_confidence_score),
      constraint_density_score: numberValue(row.constraint_density_score),
      downstream_impact_score: numberValue(row.downstream_impact_score),
      opportunity_score: numberValue(row.opportunity_score),
      total_strategic_score: numberValue(row.total_strategic_score),
      archetype_spread_score: numberValue(row.archetype_spread_score),
      cross_industry_similarity_score: numberValue(
        row.cross_industry_similarity_score
      ),
      total_priority_score: numberValue(row.total_priority_score)
    }
  }));
}

function readSources(db: SqliteReadModelDatabase): SqliteReadModelSource[] {
  return db
    .prepare("SELECT * FROM source_records ORDER BY source_id")
    .all()
    .map((row) => ({
      source_id: stringValue(row.source_id),
      title: stringValue(row.title),
      source_type: stringValue(row.source_type),
      publisher: stringValue(row.publisher),
      referenced_by: parseJsonArray(row.referenced_by_json),
      provenance_level: stringValue(row.provenance_level),
      citation_status: stringValue(row.citation_status),
      trust_weight: numberValue(row.trust_weight),
      verification_need: stringValue(row.verification_need)
    }));
}

function readConstraintSourceLinks(
  db: SqliteReadModelDatabase
): SqliteReadModelConstraintSourceLink[] {
  return db
    .prepare(
      "SELECT constraint_id, source_id FROM constraint_sources ORDER BY constraint_id, source_id"
    )
    .all()
    .map((row) => ({
      constraint_id: stringValue(row.constraint_id),
      source_id: stringValue(row.source_id)
    }));
}

function readEvidencePacks(
  db: SqliteReadModelDatabase
): SqliteReadModelEvidencePack[] {
  return db
    .prepare("SELECT * FROM evidence_packs ORDER BY constraint_id")
    .all()
    .map((row) => ({
      constraint_id: stringValue(row.constraint_id),
      constraint_title: stringValue(row.constraint_title),
      core_claim: stringValue(row.core_claim),
      source_records: parseJsonArray<SqliteReadModelSource>(row.source_records_json),
      claim_support: parseJsonArray<Record<string, unknown>>(row.claim_support_json),
      evidence_gaps: parseJsonArray(row.evidence_gaps_json),
      provenance_notes: parseJsonArray(row.provenance_notes_json),
      provenance_status: stringValue(row.provenance_status),
      source_coverage_score: numberValue(row.source_coverage_score),
      claim_support_score: numberValue(row.claim_support_score),
      provenance_score: numberValue(row.provenance_score),
      defensibility_score: numberValue(row.defensibility_score),
      recommended_source_upgrade: stringValue(row.recommended_source_upgrade),
      audit_flags: parseJsonArray(row.audit_flags_json)
    }));
}

function readValidationTasks(
  db: SqliteReadModelDatabase
): SqliteReadModelValidationTask[] {
  return db
    .prepare("SELECT * FROM validation_tasks ORDER BY task_id")
    .all()
    .map((row) => ({
      task_id: stringValue(row.task_id),
      constraint_id: stringValue(row.constraint_id),
      constraint_title: stringValue(row.constraint_title),
      industry: stringValue(row.industry),
      task_type: stringValue(row.task_type),
      task_title: stringValue(row.task_title),
      task_summary: stringValue(row.task_summary),
      priority_score: numberValue(row.priority_score),
      severity: stringValue(row.severity),
      status: stringValue(row.status),
      evidence_gap: stringValue(row.evidence_gap),
      source_gap: stringValue(row.source_gap),
      recommended_action: stringValue(row.recommended_action),
      expected_artifact: stringValue(row.expected_artifact),
      blocking_reason: stringValue(row.blocking_reason),
      generated_from: parseJsonArray(row.generated_from_json),
      defensibility_score:
        row.defensibility_score === null ? null : numberValue(row.defensibility_score),
      validation_confidence:
        row.validation_confidence === null ? null : numberValue(row.validation_confidence),
      source_ids: parseJsonArray(row.source_ids_json),
      investigation_route: stringValue(row.investigation_route),
      network_route: stringValue(row.network_route)
    }));
}

function countRows(db: SqliteReadModelDatabase, table: string) {
  const row = db.prepare(`SELECT COUNT(*) AS value FROM ${table}`).get();
  return numberValue(row?.value);
}

function parseJsonArray<T = string>(value: unknown): T[] {
  if (typeof value !== "string") return [];
  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : String(value ?? "");
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}
