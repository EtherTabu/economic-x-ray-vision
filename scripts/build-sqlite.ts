type SqliteBuildCryptoModule = typeof import("node:crypto");
type SqliteBuildFsModule = typeof import("node:fs");
type SqliteBuildModuleModule = typeof import("node:module");
type SqliteBuildPathModule = typeof import("node:path");

type SqliteDatabase = {
  close: () => void;
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    all: (...parameters: unknown[]) => Record<string, unknown>[];
    get: (...parameters: unknown[]) => Record<string, unknown> | undefined;
    run: (...parameters: unknown[]) => unknown;
  };
};

type SqliteBuildSqliteModule = {
  DatabaseSync: new (path: string) => SqliteDatabase;
};

const {
  createHash: sqliteCreateHash
} = process.getBuiltinModule("crypto") as SqliteBuildCryptoModule;
const {
  existsSync: sqliteExistsSync,
  mkdirSync: sqliteMkdirSync,
  readFileSync: sqliteReadFileSync,
  renameSync: sqliteRenameSync,
  rmSync: sqliteRmSync
} = process.getBuiltinModule("fs") as SqliteBuildFsModule;
const { createRequire: sqliteCreateRequire } = process.getBuiltinModule(
  "module"
) as SqliteBuildModuleModule;
const {
  dirname: sqliteDirname,
  resolve: sqliteResolve
} = process.getBuiltinModule("path") as SqliteBuildPathModule;
const sqliteRequire = sqliteCreateRequire(__filename);
const { DatabaseSync } = sqliteRequire("node:sqlite") as SqliteBuildSqliteModule;

const sqliteOutputPath = sqliteResolve("data/exports/constraint_intelligence.sqlite");
const sqliteTempPath = sqliteResolve("data/exports/constraint_intelligence.tmp.sqlite");
const sqliteSchemaPath = sqliteResolve("db/schema.sql");
const sqliteDatasetPath = sqliteResolve("data/exports/constraint_dataset_snapshot.json");
const sqliteSourceRegistryPath = sqliteResolve("data/exports/source_registry.json");
const sqliteEvidencePackPath = sqliteResolve("data/exports/evidence_packs.json");
const sqliteValidationTaskPath = sqliteResolve("data/exports/validation_tasks.json");
const sqliteSchemaVersion = "v14-validation-task-workflow";

type SqliteRecord = Record<string, unknown> & {
  id: string;
  origin: "seed" | "intake";
  industry: string;
  subsector: string;
  title: string;
  category: string;
  description: string;
  evidence: string[];
  affected_parties: string[];
  current_process: string[];
  resource_waste: string[];
  time_waste: number;
  capital_waste: number;
  labor_waste: number;
  opportunity_cost: string;
  estimated_annual_impact: string;
  growth_trend: string;
  visibility_score: number;
  overlooked_score: number;
  digital_solution_potential: number;
  automation_potential: number;
  ai_potential: number;
  implementation_complexity: number;
  regulatory_complexity: number;
  adoption_complexity: number;
  confidence: number;
  sources: string[];
  evidence_strength: string;
  source_type: string;
  validation_status: string;
  source_quality: number;
  measurement_difficulty: number;
  data_availability: number;
  confidence_reasoning: string;
  validation_notes: string[];
  evidence_gaps: string[];
  upstream_constraints: string[];
  downstream_constraints: string[];
  related_processes: string[];
  affected_systems: string[];
  solution_hypotheses: string[];
  opportunity_type: string;
  primary_archetype: string;
  secondary_archetypes: string[];
  archetype_confidence: number;
  archetype_reasoning: string;
  scores: Record<string, number>;
};

type SourceRecord = {
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

type EvidencePack = {
  constraint_id: string;
  constraint_title: string;
  core_claim: string;
  source_records: SourceRecord[];
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

type SqliteValidationTask = {
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
  defensibility_score?: number;
  validation_confidence?: number;
  source_ids: string[];
  investigation_route: string;
  network_route: string;
};

function buildSqliteArtifact() {
  const dataset = readJson<{ record_count: number; records: SqliteRecord[] }>(
    sqliteDatasetPath
  );
  const sourceRegistry = readJson<{ sources: SourceRecord[] }>(
    sqliteSourceRegistryPath
  );
  const evidencePacks = readJson<{ packs: EvidencePack[] }>(sqliteEvidencePackPath);
  const validationTasks = readJson<{ tasks: SqliteValidationTask[] }>(
    sqliteValidationTaskPath
  );
  const contentHash = hashInputs({
    records: dataset.records,
    sources: sourceRegistry.sources,
    packs: evidencePacks.packs,
    validation_tasks: validationTasks.tasks,
    schema: sqliteReadFileSync(sqliteSchemaPath, "utf8")
  });

  if (sqliteExistsSync(sqliteOutputPath)) {
    const existingHash = readExistingHash(sqliteOutputPath);
    if (existingHash === contentHash) {
      console.log(`SQLite artifact is current at ${sqliteOutputPath}.`);
      return;
    }
  }

  sqliteMkdirSync(sqliteDirname(sqliteOutputPath), { recursive: true });
  sqliteRmSync(sqliteTempPath, { force: true });
  const db = new DatabaseSync(sqliteTempPath);

  try {
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec(sqliteReadFileSync(sqliteSchemaPath, "utf8"));
    db.exec("BEGIN;");
    insertConstraints(db, dataset.records);
    insertScores(db, dataset.records);
    insertSources(db, sourceRegistry.sources);
    insertConstraintSources(db, sourceRegistry.sources);
    insertEvidencePacks(db, evidencePacks.packs);
    insertValidationTasks(db, validationTasks.tasks);
    insertBuildMetadata(db, {
      contentHash,
      evidencePackCount: evidencePacks.packs.length,
      recordCount: dataset.records.length,
      sourceCount: sourceRegistry.sources.length,
      validationTaskCount: validationTasks.tasks.length
    });
    db.exec("COMMIT;");
  } catch (error) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // The original SQLite error is more useful than a failed rollback.
    }
    throw error;
  } finally {
    db.close();
  }

  sqliteRmSync(sqliteOutputPath, { force: true });
  sqliteRenameSync(sqliteTempPath, sqliteOutputPath);
  console.log(
    `Built SQLite artifact with ${dataset.records.length} constraints, ${sourceRegistry.sources.length} sources, ${evidencePacks.packs.length} evidence packs, and ${validationTasks.tasks.length} validation tasks at ${sqliteOutputPath}.`
  );
}

function insertConstraints(db: SqliteDatabase, records: SqliteRecord[]) {
  const statement = db.prepare(`
    INSERT INTO constraints (
      id, origin, industry, subsector, title, category, description,
      evidence_json, affected_parties_json, current_process_json,
      resource_waste_json, time_waste, capital_waste, labor_waste,
      opportunity_cost, estimated_annual_impact, growth_trend,
      visibility_score, overlooked_score, digital_solution_potential,
      automation_potential, ai_potential, implementation_complexity,
      regulatory_complexity, adoption_complexity, confidence, sources_json,
      evidence_strength, source_type, validation_status, source_quality,
      measurement_difficulty, data_availability, confidence_reasoning,
      validation_notes_json, evidence_gaps_json, upstream_constraints_json,
      downstream_constraints_json, related_processes_json, affected_systems_json,
      solution_hypotheses_json, opportunity_type, primary_archetype,
      secondary_archetypes_json, archetype_confidence, archetype_reasoning,
      created_at, updated_at
    ) VALUES (
      $id, $origin, $industry, $subsector, $title, $category, $description,
      $evidence_json, $affected_parties_json, $current_process_json,
      $resource_waste_json, $time_waste, $capital_waste, $labor_waste,
      $opportunity_cost, $estimated_annual_impact, $growth_trend,
      $visibility_score, $overlooked_score, $digital_solution_potential,
      $automation_potential, $ai_potential, $implementation_complexity,
      $regulatory_complexity, $adoption_complexity, $confidence, $sources_json,
      $evidence_strength, $source_type, $validation_status, $source_quality,
      $measurement_difficulty, $data_availability, $confidence_reasoning,
      $validation_notes_json, $evidence_gaps_json, $upstream_constraints_json,
      $downstream_constraints_json, $related_processes_json, $affected_systems_json,
      $solution_hypotheses_json, $opportunity_type, $primary_archetype,
      $secondary_archetypes_json, $archetype_confidence, $archetype_reasoning,
      $created_at, $updated_at
    )
  `);
  const timestamp = "1970-01-01T00:00:00.000Z";

  records.forEach((record) => {
    statement.run({
      $id: record.id,
      $origin: record.origin,
      $industry: record.industry,
      $subsector: record.subsector,
      $title: record.title,
      $category: record.category,
      $description: record.description,
      $evidence_json: json(record.evidence),
      $affected_parties_json: json(record.affected_parties),
      $current_process_json: json(record.current_process),
      $resource_waste_json: json(record.resource_waste),
      $time_waste: record.time_waste,
      $capital_waste: record.capital_waste,
      $labor_waste: record.labor_waste,
      $opportunity_cost: record.opportunity_cost,
      $estimated_annual_impact: record.estimated_annual_impact,
      $growth_trend: record.growth_trend,
      $visibility_score: record.visibility_score,
      $overlooked_score: record.overlooked_score,
      $digital_solution_potential: record.digital_solution_potential,
      $automation_potential: record.automation_potential,
      $ai_potential: record.ai_potential,
      $implementation_complexity: record.implementation_complexity,
      $regulatory_complexity: record.regulatory_complexity,
      $adoption_complexity: record.adoption_complexity,
      $confidence: record.confidence,
      $sources_json: json(record.sources),
      $evidence_strength: record.evidence_strength,
      $source_type: record.source_type,
      $validation_status: record.validation_status,
      $source_quality: record.source_quality,
      $measurement_difficulty: record.measurement_difficulty,
      $data_availability: record.data_availability,
      $confidence_reasoning: record.confidence_reasoning,
      $validation_notes_json: json(record.validation_notes),
      $evidence_gaps_json: json(record.evidence_gaps),
      $upstream_constraints_json: json(record.upstream_constraints),
      $downstream_constraints_json: json(record.downstream_constraints),
      $related_processes_json: json(record.related_processes),
      $affected_systems_json: json(record.affected_systems),
      $solution_hypotheses_json: json(record.solution_hypotheses),
      $opportunity_type: record.opportunity_type,
      $primary_archetype: record.primary_archetype,
      $secondary_archetypes_json: json(record.secondary_archetypes),
      $archetype_confidence: record.archetype_confidence,
      $archetype_reasoning: record.archetype_reasoning,
      $created_at: timestamp,
      $updated_at: timestamp
    });
  });
}

function insertScores(db: SqliteDatabase, records: SqliteRecord[]) {
  const statement = db.prepare(`
    INSERT INTO constraint_scores (
      constraint_id, severity_score, solvability_score, ai_readiness_score,
      overlooked_opportunity_score, evidence_score, measurability_score,
      validation_confidence_score, constraint_density_score,
      downstream_impact_score, opportunity_score, total_strategic_score,
      archetype_spread_score, cross_industry_similarity_score,
      total_priority_score, scored_at
    ) VALUES (
      $constraint_id, $severity_score, $solvability_score, $ai_readiness_score,
      $overlooked_opportunity_score, $evidence_score, $measurability_score,
      $validation_confidence_score, $constraint_density_score,
      $downstream_impact_score, $opportunity_score, $total_strategic_score,
      $archetype_spread_score, $cross_industry_similarity_score,
      $total_priority_score, $scored_at
    )
  `);

  records.forEach((record) => {
    statement.run({
      $constraint_id: record.id,
      $severity_score: record.scores.severity_score,
      $solvability_score: record.scores.solvability_score,
      $ai_readiness_score: record.scores.ai_readiness_score,
      $overlooked_opportunity_score: record.scores.overlooked_opportunity_score,
      $evidence_score: record.scores.evidence_score,
      $measurability_score: record.scores.measurability_score,
      $validation_confidence_score: record.scores.validation_confidence_score,
      $constraint_density_score: record.scores.constraint_density_score,
      $downstream_impact_score: record.scores.downstream_impact_score,
      $opportunity_score: record.scores.opportunity_score,
      $total_strategic_score: record.scores.total_strategic_score,
      $archetype_spread_score: record.scores.archetype_spread_score,
      $cross_industry_similarity_score:
        record.scores.cross_industry_similarity_score,
      $total_priority_score: record.scores.total_priority_score,
      $scored_at: "1970-01-01T00:00:00.000Z"
    });
  });
}

function insertSources(db: SqliteDatabase, sources: SourceRecord[]) {
  const statement = db.prepare(`
    INSERT INTO source_records (
      source_id, title, source_type, publisher, referenced_by_json,
      provenance_level, citation_status, trust_weight, verification_need
    ) VALUES (
      $source_id, $title, $source_type, $publisher, $referenced_by_json,
      $provenance_level, $citation_status, $trust_weight, $verification_need
    )
  `);

  sources.forEach((source) => {
    statement.run({
      $source_id: source.source_id,
      $title: source.title,
      $source_type: source.source_type,
      $publisher: source.publisher,
      $referenced_by_json: json(source.referenced_by),
      $provenance_level: source.provenance_level,
      $citation_status: source.citation_status,
      $trust_weight: source.trust_weight,
      $verification_need: source.verification_need
    });
  });
}

function insertConstraintSources(db: SqliteDatabase, sources: SourceRecord[]) {
  const statement = db.prepare(`
    INSERT INTO constraint_sources (constraint_id, source_id)
    VALUES ($constraint_id, $source_id)
  `);

  sources.forEach((source) => {
    source.referenced_by.forEach((constraintId) => {
      statement.run({
        $constraint_id: constraintId,
        $source_id: source.source_id
      });
    });
  });
}

function insertEvidencePacks(db: SqliteDatabase, packs: EvidencePack[]) {
  const statement = db.prepare(`
    INSERT INTO evidence_packs (
      constraint_id, constraint_title, core_claim, source_records_json,
      claim_support_json, evidence_gaps_json, provenance_notes_json,
      provenance_status, source_coverage_score, claim_support_score,
      provenance_score, defensibility_score, recommended_source_upgrade,
      audit_flags_json
    ) VALUES (
      $constraint_id, $constraint_title, $core_claim, $source_records_json,
      $claim_support_json, $evidence_gaps_json, $provenance_notes_json,
      $provenance_status, $source_coverage_score, $claim_support_score,
      $provenance_score, $defensibility_score, $recommended_source_upgrade,
      $audit_flags_json
    )
  `);

  packs.forEach((pack) => {
    statement.run({
      $constraint_id: pack.constraint_id,
      $constraint_title: pack.constraint_title,
      $core_claim: pack.core_claim,
      $source_records_json: json(pack.source_records),
      $claim_support_json: json(pack.claim_support),
      $evidence_gaps_json: json(pack.evidence_gaps),
      $provenance_notes_json: json(pack.provenance_notes),
      $provenance_status: pack.provenance_status,
      $source_coverage_score: pack.source_coverage_score,
      $claim_support_score: pack.claim_support_score,
      $provenance_score: pack.provenance_score,
      $defensibility_score: pack.defensibility_score,
      $recommended_source_upgrade: pack.recommended_source_upgrade,
      $audit_flags_json: json(pack.audit_flags)
    });
  });
}

function insertValidationTasks(
  db: SqliteDatabase,
  tasks: SqliteValidationTask[]
) {
  const statement = db.prepare(`
    INSERT INTO validation_tasks (
      task_id, constraint_id, constraint_title, industry, task_type,
      task_title, task_summary, priority_score, severity, status,
      evidence_gap, source_gap, recommended_action, expected_artifact,
      blocking_reason, generated_from_json, defensibility_score,
      validation_confidence, source_ids_json, investigation_route, network_route
    ) VALUES (
      $task_id, $constraint_id, $constraint_title, $industry, $task_type,
      $task_title, $task_summary, $priority_score, $severity, $status,
      $evidence_gap, $source_gap, $recommended_action, $expected_artifact,
      $blocking_reason, $generated_from_json, $defensibility_score,
      $validation_confidence, $source_ids_json, $investigation_route, $network_route
    )
  `);

  tasks.forEach((task) => {
    statement.run({
      $task_id: task.task_id,
      $constraint_id: task.constraint_id,
      $constraint_title: task.constraint_title,
      $industry: task.industry,
      $task_type: task.task_type,
      $task_title: task.task_title,
      $task_summary: task.task_summary,
      $priority_score: task.priority_score,
      $severity: task.severity,
      $status: task.status,
      $evidence_gap: task.evidence_gap,
      $source_gap: task.source_gap,
      $recommended_action: task.recommended_action,
      $expected_artifact: task.expected_artifact,
      $blocking_reason: task.blocking_reason,
      $generated_from_json: json(task.generated_from),
      $defensibility_score: task.defensibility_score ?? null,
      $validation_confidence: task.validation_confidence ?? null,
      $source_ids_json: json(task.source_ids),
      $investigation_route: task.investigation_route,
      $network_route: task.network_route
    });
  });
}

function insertBuildMetadata(
  db: SqliteDatabase,
  metadata: {
    contentHash: string;
    evidencePackCount: number;
    recordCount: number;
    sourceCount: number;
    validationTaskCount: number;
  }
) {
  db.prepare(`
    INSERT INTO database_builds (
      id, built_at, content_hash, record_count, source_count,
      evidence_pack_count, validation_task_count, schema_version
    ) VALUES (
      'current', $built_at, $content_hash, $record_count, $source_count,
      $evidence_pack_count, $validation_task_count, $schema_version
    )
  `).run({
    $built_at: new Date().toISOString(),
    $content_hash: metadata.contentHash,
    $record_count: metadata.recordCount,
    $source_count: metadata.sourceCount,
    $evidence_pack_count: metadata.evidencePackCount,
    $validation_task_count: metadata.validationTaskCount,
    $schema_version: sqliteSchemaVersion
  });
}

function readExistingHash(path: string) {
  const db = new DatabaseSync(path);
  try {
    const row = db
      .prepare("SELECT content_hash FROM database_builds WHERE id = 'current'")
      .get();
    return typeof row?.content_hash === "string" ? row.content_hash : null;
  } catch {
    return null;
  } finally {
    db.close();
  }
}

function readJson<T>(path: string) {
  return JSON.parse(sqliteReadFileSync(path, "utf8")) as T;
}

function hashInputs(input: Record<string, unknown>) {
  return sqliteCreateHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
}

function json(value: unknown) {
  return JSON.stringify(value);
}

buildSqliteArtifact();
