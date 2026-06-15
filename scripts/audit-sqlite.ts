type SqliteAuditFsModule = typeof import("node:fs");
type SqliteAuditModuleModule = typeof import("node:module");
type SqliteAuditPathModule = typeof import("node:path");

type SqliteAuditDatabase = {
  close: () => void;
  prepare: (sql: string) => {
    all: (...parameters: unknown[]) => Record<string, unknown>[];
    get: (...parameters: unknown[]) => Record<string, unknown> | undefined;
  };
};

type SqliteAuditSqliteModule = {
  DatabaseSync: new (path: string) => SqliteAuditDatabase;
};

const { existsSync: sqliteAuditExistsSync } = process.getBuiltinModule(
  "fs"
) as SqliteAuditFsModule;
const { createRequire: sqliteAuditCreateRequire } = process.getBuiltinModule(
  "module"
) as SqliteAuditModuleModule;
const { resolve: sqliteAuditResolve } = process.getBuiltinModule(
  "path"
) as SqliteAuditPathModule;
const sqliteAuditRequire = sqliteAuditCreateRequire(__filename);
const { DatabaseSync: AuditDatabaseSync } = sqliteAuditRequire(
  "node:sqlite"
) as SqliteAuditSqliteModule;

const sqliteAuditPath = sqliteAuditResolve(
  "data/exports/constraint_intelligence.sqlite"
);

if (!sqliteAuditExistsSync(sqliteAuditPath)) {
  console.error(`SQLite artifact is missing at ${sqliteAuditPath}.`);
  process.exit(1);
}

const sqliteAuditDb = new AuditDatabaseSync(sqliteAuditPath);

try {
  const counts = {
    constraints: count("constraints"),
    scores: count("constraint_scores"),
    sources: count("source_records"),
    constraintSources: count("constraint_sources"),
    evidencePacks: count("evidence_packs")
  };
  const originDistribution = rows(
    "SELECT origin AS label, COUNT(*) AS count FROM constraints GROUP BY origin ORDER BY origin"
  );
  const industryDistribution = rows(
    "SELECT industry AS label, COUNT(*) AS count FROM constraints GROUP BY industry ORDER BY count DESC, industry"
  );
  const scoreRanges = rows(`
    SELECT
      MIN(total_priority_score) AS min_priority,
      MAX(total_priority_score) AS max_priority,
      ROUND(AVG(total_priority_score), 1) AS avg_priority,
      MIN(validation_confidence_score) AS min_validation,
      MAX(validation_confidence_score) AS max_validation,
      ROUND(AVG(validation_confidence_score), 1) AS avg_validation
    FROM constraint_scores
  `)[0];
  const thinEvidencePacks = scalar(
    "SELECT COUNT(*) AS value FROM evidence_packs WHERE provenance_status = 'thin'"
  );
  const sourcesNeedingPrimary = scalar(
    "SELECT COUNT(*) AS value FROM source_records WHERE citation_status = 'needs-primary-document'"
  );
  const orphanScores = scalar(`
    SELECT COUNT(*) AS value
    FROM constraint_scores scores
    LEFT JOIN constraints constraints ON constraints.id = scores.constraint_id
    WHERE constraints.id IS NULL
  `);
  const orphanEvidencePacks = scalar(`
    SELECT COUNT(*) AS value
    FROM evidence_packs packs
    LEFT JOIN constraints constraints ON constraints.id = packs.constraint_id
    WHERE constraints.id IS NULL
  `);
  const build = rows("SELECT * FROM database_builds WHERE id = 'current'")[0];

  if (!build) {
    console.error("SQLite build metadata is missing.");
    process.exit(1);
  }

  console.log("SQLite persistence audit");
  console.log(`- database: ${sqliteAuditPath}`);
  console.log(`- constraints: ${counts.constraints}`);
  console.log(`- scores: ${counts.scores}`);
  console.log(`- source records: ${counts.sources}`);
  console.log(`- constraint-source links: ${counts.constraintSources}`);
  console.log(`- evidence packs: ${counts.evidencePacks}`);
  console.log(
    `- origin distribution: ${sqliteAuditFormatDistribution(originDistribution)}`
  );
  console.log(`- industries: ${industryDistribution.length}`);
  console.log(
    `- priority score range: ${scoreRanges.min_priority}-${scoreRanges.max_priority}, average ${scoreRanges.avg_priority}`
  );
  console.log(
    `- validation score range: ${scoreRanges.min_validation}-${scoreRanges.max_validation}, average ${scoreRanges.avg_validation}`
  );
  console.log(`- thin evidence packs: ${thinEvidencePacks}`);
  console.log(`- sources needing primary documents: ${sourcesNeedingPrimary}`);
  console.log(`- orphan scores: ${orphanScores}`);
  console.log(`- orphan evidence packs: ${orphanEvidencePacks}`);
  console.log(`- schema version: ${build.schema_version}`);

  if (
    counts.constraints !== 52 ||
    counts.scores !== counts.constraints ||
    counts.evidencePacks !== counts.constraints ||
    counts.sources === 0 ||
    orphanScores !== 0 ||
    orphanEvidencePacks !== 0
  ) {
    process.exitCode = 1;
  }
} finally {
  sqliteAuditDb.close();
}

function count(table: string) {
  return scalar(`SELECT COUNT(*) AS value FROM ${table}`);
}

function scalar(sql: string) {
  const row = sqliteAuditDb.prepare(sql).get();
  return Number(row?.value ?? 0);
}

function rows(sql: string) {
  return sqliteAuditDb.prepare(sql).all();
}

function sqliteAuditFormatDistribution(values: Record<string, unknown>[]) {
  return values
    .map((value) => `${value.label} (${value.count})`)
    .join(", ");
}
