type SqliteParityFsModule = typeof import("node:fs");
type SqliteParityPathModule = typeof import("node:path");
type SqliteParityUrlModule = typeof import("node:url");
type SqliteParityReadModelModule = typeof import("../src/lib/sqliteReadModel");

export {};

const { readFileSync: sqliteParityReadFileSync } = process.getBuiltinModule(
  "fs"
) as SqliteParityFsModule;
const { resolve: sqliteParityResolve } = process.getBuiltinModule(
  "path"
) as SqliteParityPathModule;
const { pathToFileURL: sqliteParityPathToFileURL } = process.getBuiltinModule(
  "url"
) as SqliteParityUrlModule;

const sqliteParityDatasetPath = sqliteParityResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const sqliteParitySourceRegistryPath = sqliteParityResolve(
  "data/exports/source_registry.json"
);
const sqliteParityEvidencePackPath = sqliteParityResolve(
  "data/exports/evidence_packs.json"
);
const sqliteParityValidationTaskPath = sqliteParityResolve(
  "data/exports/validation_tasks.json"
);
const sqliteParityTriagePath = sqliteParityResolve(
  "data/exports/validation_triage.json"
);
const sqliteParityEvidencePacketPath = sqliteParityResolve(
  "data/exports/validation_evidence_packets.json"
);

type ParityDatasetRecord = {
  id: string;
  title: string;
  industry: string;
  category: string;
  sources: string[];
  scores: Record<string, number>;
};

type ParitySourceRecord = {
  source_id: string;
  title: string;
  referenced_by: string[];
  citation_status: string;
  provenance_level: string;
  trust_weight: number;
};

type ParityEvidencePack = {
  constraint_id: string;
  constraint_title: string;
  provenance_status: string;
  defensibility_score: number;
  recommended_source_upgrade: string;
};

type ParityValidationTask = {
  task_id: string;
  constraint_id: string;
  constraint_title: string;
  task_type: string;
  task_title: string;
  priority_score: number;
  severity: string;
};

const parityFailures: string[] = [];
const parityWarnings: string[] = [];
const dataset = sqliteParityReadJson<{
  record_count: number;
  records: ParityDatasetRecord[];
}>(sqliteParityDatasetPath);
const sourceRegistry = sqliteParityReadJson<{ sources: ParitySourceRecord[] }>(
  sqliteParitySourceRegistryPath
);
const evidencePacks = sqliteParityReadJson<{ packs: ParityEvidencePack[] }>(
  sqliteParityEvidencePackPath
);
const validationTasks = sqliteParityReadJson<{
  task_count: number;
  tasks: ParityValidationTask[];
}>(sqliteParityValidationTaskPath);
const triage = sqliteParityReadJson<{
  summary: { top_queue_count: number };
}>(sqliteParityTriagePath);
const evidencePackets = sqliteParityReadJson<{
  summary: { packet_count: number };
}>(sqliteParityEvidencePacketPath);
const { loadSqliteReadModel } = (await import(
  sqliteParityPathToFileURL(sqliteParityResolve("src/lib/sqliteReadModel.ts"))
    .href
)) as SqliteParityReadModelModule;
const sqliteReadModel = loadSqliteReadModel();

console.log("SQLite read-model parity audit");
console.log("- scope: JSON/static exports compared to local SQLite artifact");

checkEqual("constraint count", sqliteReadModel.counts.constraints, dataset.record_count);
checkEqual("score row count", sqliteReadModel.counts.scores, dataset.record_count);
checkEqual(
  "source record count",
  sqliteReadModel.counts.sources,
  sourceRegistry.sources.length
);
checkEqual(
  "evidence pack count",
  sqliteReadModel.counts.evidencePacks,
  evidencePacks.packs.length
);
checkEqual(
  "validation task count",
  sqliteReadModel.counts.validationTasks,
  validationTasks.task_count
);
checkEqual(
  "constraint-source link count",
  sqliteReadModel.counts.constraintSourceLinks,
  flattenSourceLinks(sourceRegistry.sources).length
);

checkBuildMetadata();
checkKeyConstraints();
checkSourceRegistryParity();
checkEvidencePackParity();
checkValidationTaskParity();
checkConstraintSourceLinkParity();
checkUnsupportedLayerGaps();

console.log("- parity checks:");
console.log(`  constraints: ${sqliteReadModel.counts.constraints}`);
console.log(`  scores: ${sqliteReadModel.counts.scores}`);
console.log(`  source records: ${sqliteReadModel.counts.sources}`);
console.log(`  constraint-source links: ${sqliteReadModel.counts.constraintSourceLinks}`);
console.log(`  evidence packs: ${sqliteReadModel.counts.evidencePacks}`);
console.log(`  validation tasks: ${sqliteReadModel.counts.validationTasks}`);
console.log("- schema gaps:");
parityWarnings.forEach((warning) => console.log(`  - ${warning}`));

if (parityFailures.length > 0) {
  console.error("- parity failures:");
  parityFailures.forEach((failure) => console.error(`  - ${failure}`));
  process.exitCode = 1;
} else {
  console.log("- result: PASS");
}

function checkBuildMetadata() {
  const build = sqliteReadModel.build;
  if (!build) {
    parityFailures.push("database build metadata is missing");
    return;
  }

  checkEqual("build record_count", build.record_count, dataset.record_count);
  checkEqual("build source_count", build.source_count, sourceRegistry.sources.length);
  checkEqual(
    "build evidence_pack_count",
    build.evidence_pack_count,
    evidencePacks.packs.length
  );
  checkEqual(
    "build validation_task_count",
    build.validation_task_count,
    validationTasks.task_count
  );
  checkEqual(
    "schema version",
    build.schema_version,
    "v14-validation-task-workflow"
  );
}

function checkKeyConstraints() {
  const sqliteById = new Map(sqliteReadModel.constraints.map((record) => [record.id, record]));
  const jsonById = new Map(dataset.records.map((record) => [record.id, record]));
  const keyIds = ["hc-admin-001", "strategic-020", "strategic-005"];

  keyIds.forEach((id) => {
    const jsonRecord = jsonById.get(id);
    const sqliteRecord = sqliteById.get(id);
    if (!jsonRecord || !sqliteRecord) {
      parityFailures.push(`missing key constraint ${id}`);
      return;
    }

    checkEqual(`${id} title`, sqliteRecord.title, jsonRecord.title);
    checkEqual(`${id} industry`, sqliteRecord.industry, jsonRecord.industry);
    checkEqual(`${id} source count`, sqliteRecord.sources.length, jsonRecord.sources.length);
    checkNumber(
      `${id} total_priority_score`,
      sqliteRecord.scores.total_priority_score,
      jsonRecord.scores.total_priority_score
    );
    checkNumber(
      `${id} validation_confidence_score`,
      sqliteRecord.scores.validation_confidence_score,
      jsonRecord.scores.validation_confidence_score
    );
  });
}

function checkSourceRegistryParity() {
  const sqliteById = new Map(sqliteReadModel.sources.map((source) => [source.source_id, source]));
  const jsonById = new Map(sourceRegistry.sources.map((source) => [source.source_id, source]));
  const keyIds = [
    "source:structured-hypothesis-local-operational-evidence-required",
    "source:metals-mining-critical-inputs-process-pattern-review"
  ];

  keyIds.forEach((id) => {
    const jsonSource = jsonById.get(id);
    const sqliteSource = sqliteById.get(id);
    if (!jsonSource || !sqliteSource) {
      parityFailures.push(`missing key source ${id}`);
      return;
    }

    checkEqual(`${id} title`, sqliteSource.title, jsonSource.title);
    checkEqual(`${id} citation status`, sqliteSource.citation_status, jsonSource.citation_status);
    checkEqual(
      `${id} referenced_by count`,
      sqliteSource.referenced_by.length,
      jsonSource.referenced_by.length
    );
    checkNumber(`${id} trust weight`, sqliteSource.trust_weight, jsonSource.trust_weight);
  });
}

function checkEvidencePackParity() {
  const sqliteById = new Map(
    sqliteReadModel.evidencePacks.map((pack) => [pack.constraint_id, pack])
  );
  const jsonById = new Map(evidencePacks.packs.map((pack) => [pack.constraint_id, pack]));
  const keyIds = ["strategic-017", "strategic-020", "hc-admin-001"];

  keyIds.forEach((id) => {
    const jsonPack = jsonById.get(id);
    const sqlitePack = sqliteById.get(id);
    if (!jsonPack || !sqlitePack) {
      parityFailures.push(`missing key evidence pack ${id}`);
      return;
    }

    checkEqual(`${id} evidence pack title`, sqlitePack.constraint_title, jsonPack.constraint_title);
    checkEqual(
      `${id} provenance status`,
      sqlitePack.provenance_status,
      jsonPack.provenance_status
    );
    checkNumber(
      `${id} defensibility score`,
      sqlitePack.defensibility_score,
      jsonPack.defensibility_score
    );
    checkEqual(
      `${id} recommended source upgrade`,
      sqlitePack.recommended_source_upgrade,
      jsonPack.recommended_source_upgrade
    );
  });
}

function checkValidationTaskParity() {
  const sqliteById = new Map(
    sqliteReadModel.validationTasks.map((task) => [task.task_id, task])
  );
  const sortedJsonTasks = validationTasks.tasks
    .slice()
    .sort(
      (first, second) =>
        second.priority_score - first.priority_score ||
        first.constraint_title.localeCompare(second.constraint_title) ||
        first.task_id.localeCompare(second.task_id)
    );

  sortedJsonTasks.slice(0, 5).forEach((jsonTask) => {
    const sqliteTask = sqliteById.get(jsonTask.task_id);
    if (!sqliteTask) {
      parityFailures.push(`missing key validation task ${jsonTask.task_id}`);
      return;
    }

    checkEqual(`${jsonTask.task_id} title`, sqliteTask.task_title, jsonTask.task_title);
    checkEqual(`${jsonTask.task_id} type`, sqliteTask.task_type, jsonTask.task_type);
    checkEqual(`${jsonTask.task_id} severity`, sqliteTask.severity, jsonTask.severity);
    checkNumber(
      `${jsonTask.task_id} priority`,
      sqliteTask.priority_score,
      jsonTask.priority_score
    );
  });
}

function checkConstraintSourceLinkParity() {
  const sqliteLinks = new Set(
    sqliteReadModel.constraintSourceLinks.map(
      (link) => `${link.constraint_id}::${link.source_id}`
    )
  );
  const jsonLinks = new Set(flattenSourceLinks(sourceRegistry.sources));

  checkEqual("constraint-source unique link count", sqliteLinks.size, jsonLinks.size);
  Array.from(jsonLinks)
    .slice(0, 20)
    .forEach((link) => {
      if (!sqliteLinks.has(link)) {
        parityFailures.push(`missing constraint-source link ${link}`);
      }
    });
}

function checkUnsupportedLayerGaps() {
  parityWarnings.push(
    `validation triage is exported as JSON with ${triage.summary.top_queue_count} top queue records but has no SQLite table yet`
  );
  parityWarnings.push(
    `validation evidence packets are exported as JSON with ${evidencePackets.summary.packet_count} packets but have no SQLite table yet`
  );
  parityWarnings.push(
    "source workspace is computed from source_records, evidence_packs, and validation evidence packets; no dedicated SQLite read-model table exists yet"
  );
}

function checkEqual(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    parityFailures.push(`${label}: expected ${expected}, got ${actual}`);
  }
}

function checkNumber(label: string, actual: number, expected: number) {
  if (Math.abs(actual - expected) > 0.001) {
    parityFailures.push(`${label}: expected ${expected}, got ${actual}`);
  }
}

function flattenSourceLinks(sources: ParitySourceRecord[]) {
  return sources.flatMap((source) =>
    source.referenced_by.map((constraintId) => `${constraintId}::${source.source_id}`)
  );
}

function sqliteParityReadJson<T>(path: string) {
  return JSON.parse(sqliteParityReadFileSync(path, "utf8")) as T;
}
