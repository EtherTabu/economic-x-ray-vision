type SqliteInspectFsModule = typeof import("node:fs");
type SqliteInspectModuleModule = typeof import("node:module");
type SqliteInspectPathModule = typeof import("node:path");

type SqliteInspectDatabase = {
  close: () => void;
  prepare: (sql: string) => {
    all: (...parameters: unknown[]) => Record<string, unknown>[];
    get: (...parameters: unknown[]) => Record<string, unknown> | undefined;
  };
};

type SqliteInspectSqliteModule = {
  DatabaseSync: new (path: string) => SqliteInspectDatabase;
};

const {
  existsSync: sqliteInspectExistsSync,
  statSync: sqliteInspectStatSync
} = process.getBuiltinModule("fs") as SqliteInspectFsModule;
const { createRequire: sqliteInspectCreateRequire } = process.getBuiltinModule(
  "module"
) as SqliteInspectModuleModule;
const { resolve: sqliteInspectResolve } = process.getBuiltinModule(
  "path"
) as SqliteInspectPathModule;
const sqliteInspectRequire = sqliteInspectCreateRequire(__filename);
const { DatabaseSync: InspectDatabaseSync } = sqliteInspectRequire(
  "node:sqlite"
) as SqliteInspectSqliteModule;

const sqliteInspectPath = sqliteInspectResolve(
  "data/exports/constraint_intelligence.sqlite"
);

if (!sqliteInspectExistsSync(sqliteInspectPath)) {
  console.error(`SQLite artifact is missing at ${sqliteInspectPath}.`);
  process.exit(1);
}

const sqliteInspectDb = new InspectDatabaseSync(sqliteInspectPath);

try {
  const build = sqliteInspectDb
    .prepare("SELECT record_count, source_count, evidence_pack_count, validation_task_count FROM database_builds WHERE id = 'current'")
    .get();
  if (!build) {
    console.error("SQLite build metadata is missing.");
    process.exit(1);
  }
  const topPriority = sqliteInspectDb.prepare(`
    SELECT constraints.id, constraints.title, constraints.industry,
      ROUND(scores.total_priority_score, 1) AS priority,
      ROUND(scores.total_strategic_score, 1) AS strategic
    FROM constraints
    JOIN constraint_scores scores ON scores.constraint_id = constraints.id
    ORDER BY scores.total_priority_score DESC, constraints.id
    LIMIT 5
  `).all();
  const defensibilityTargets = sqliteInspectDb.prepare(`
    SELECT constraints.id, constraints.title,
      evidence_packs.provenance_status,
      ROUND(evidence_packs.defensibility_score, 1) AS defensibility,
      evidence_packs.recommended_source_upgrade
    FROM evidence_packs
    JOIN constraints ON constraints.id = evidence_packs.constraint_id
    ORDER BY evidence_packs.defensibility_score ASC, constraints.id
    LIMIT 5
  `).all();
  const citationDistribution = sqliteInspectDb.prepare(`
    SELECT citation_status AS label, COUNT(*) AS count
    FROM source_records
    GROUP BY citation_status
    ORDER BY count DESC, citation_status
  `).all();
  const topValidationTasks = sqliteInspectDb.prepare(`
    SELECT constraint_title, task_title, task_type, severity, priority_score
    FROM validation_tasks
    ORDER BY priority_score DESC, constraint_title
    LIMIT 5
  `).all();
  const primaryDocumentNeeds = sqliteInspectDb.prepare(`
    SELECT constraint_title, task_title, priority_score
    FROM validation_tasks
    WHERE task_type = 'primary_document_needed'
    ORDER BY priority_score DESC, constraint_title
    LIMIT 5
  `).all();
  const weakestDefensibilityTaskRecords = sqliteInspectDb.prepare(`
    SELECT constraint_title, task_type, defensibility_score, priority_score
    FROM validation_tasks
    WHERE defensibility_score IS NOT NULL
    ORDER BY defensibility_score ASC, priority_score DESC
    LIMIT 5
  `).all();

  console.log("SQLite inspection report");
  console.log(`- database: ${sqliteInspectPath}`);
  console.log(`- file size: ${Math.round(sqliteInspectStatSync(sqliteInspectPath).size / 1024)} KB`);
  console.log(
    `- build contents: ${build.record_count} constraints, ${build.source_count} sources, ${build.evidence_pack_count} evidence packs, ${build.validation_task_count} validation tasks`
  );
  console.log("- top priority constraints:");
  topPriority.forEach((record) => {
    console.log(
      `  - ${record.title} (${record.id}) priority ${record.priority}, strategic ${record.strategic}`
    );
  });
  console.log("- lowest defensibility records:");
  defensibilityTargets.forEach((record) => {
    console.log(
      `  - ${record.title} (${record.id}) ${record.provenance_status}, defensibility ${record.defensibility}`
    );
  });
  console.log(
    `- source citation distribution: ${sqliteInspectFormatDistribution(
      citationDistribution
    )}`
  );
  console.log("- top validation tasks:");
  topValidationTasks.forEach((task) => {
    console.log(
      `  - ${task.constraint_title}: ${task.priority_score} ${task.task_title} (${task.severity})`
    );
  });
  console.log("- primary document needs:");
  primaryDocumentNeeds.forEach((task) => {
    console.log(
      `  - ${task.constraint_title}: ${task.priority_score} ${task.task_title}`
    );
  });
  console.log("- weakest defensibility task records:");
  weakestDefensibilityTaskRecords.forEach((task) => {
    console.log(
      `  - ${task.constraint_title}: defensibility ${task.defensibility_score}, priority ${task.priority_score}`
    );
  });
} finally {
  sqliteInspectDb.close();
}

function sqliteInspectFormatDistribution(values: Record<string, unknown>[]) {
  return values
    .map((value) => `${value.label} (${value.count})`)
    .join(", ");
}
