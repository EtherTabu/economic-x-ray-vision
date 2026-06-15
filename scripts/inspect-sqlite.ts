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
    .prepare("SELECT record_count, source_count, evidence_pack_count FROM database_builds WHERE id = 'current'")
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

  console.log("SQLite inspection report");
  console.log(`- database: ${sqliteInspectPath}`);
  console.log(`- file size: ${Math.round(sqliteInspectStatSync(sqliteInspectPath).size / 1024)} KB`);
  console.log(
    `- build contents: ${build.record_count} constraints, ${build.source_count} sources, ${build.evidence_pack_count} evidence packs`
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
} finally {
  sqliteInspectDb.close();
}

function sqliteInspectFormatDistribution(values: Record<string, unknown>[]) {
  return values
    .map((value) => `${value.label} (${value.count})`)
    .join(", ");
}
