type FsModule = typeof import("node:fs");
type PathModule = typeof import("node:path");

const {
  existsSync,
  readdirSync,
  readFileSync
} = process.getBuiltinModule("fs") as FsModule;
const { join, resolve } = process.getBuiltinModule("path") as PathModule;

type IntakeSource = {
  title: string;
  publisher: string;
  source_type: string;
  url?: string;
  accessed?: string;
};

type IntakeRecordKey =
  | "id"
  | "industry"
  | "subsector"
  | "title"
  | "category"
  | "description"
  | "evidence"
  | "affected_parties"
  | "current_process"
  | "resource_waste"
  | "time_waste"
  | "capital_waste"
  | "labor_waste"
  | "opportunity_cost"
  | "estimated_annual_impact"
  | "growth_trend"
  | "visibility_score"
  | "overlooked_score"
  | "digital_solution_potential"
  | "automation_potential"
  | "ai_potential"
  | "implementation_complexity"
  | "regulatory_complexity"
  | "adoption_complexity"
  | "confidence"
  | "evidence_strength"
  | "source_type"
  | "validation_status"
  | "source_quality"
  | "measurement_difficulty"
  | "data_availability"
  | "confidence_reasoning"
  | "validation_notes"
  | "evidence_gaps"
  | "upstream_constraints"
  | "downstream_constraints"
  | "related_processes"
  | "affected_systems"
  | "solution_hypotheses"
  | "opportunity_type"
  | "primary_archetype"
  | "secondary_archetypes"
  | "archetype_confidence"
  | "archetype_reasoning"
  | "sources";

const intakePath = resolve("data/intake/sample_constraints.json");
const intakePackDir = resolve("data/intake/packs");
const schemaPath = resolve("schemas/constraint_intake.schema.json");

const categories = [
  "Administrative Delay",
  "Manual Verification",
  "Revenue Leakage",
  "Information Gap",
  "Process Handoff",
  "Duplicated Work",
  "Compliance Drag",
  "Idle Capacity",
  "Hidden Cost",
  "Market Mismatch"
];
const industries = [
  "Healthcare",
  "Data Centers / AI Infrastructure",
  "Energy / Grid / Interconnection",
  "Power Generation / Nuclear / SMR",
  "Infrastructure / Permitting / Construction",
  "Semiconductors / Advanced Manufacturing",
  "Metals / Mining / Critical Inputs",
  "Robotics / Automation Deployment",
  "Aerospace / Defense / Space Manufacturing",
  "Logistics / Supply Chain / Industrial Equipment",
  "Public-Sector Administration / Compliance"
];

const growthTrends = ["Decreasing", "Stable", "Increasing"];
const evidenceStrengths = ["Low", "Moderate", "High"];
const sourceTypes = [
  "Government",
  "Industry Benchmark",
  "Professional Association",
  "Mixed Secondary",
  "Operational Pattern"
];
const validationStatuses = [
  "Unverified",
  "Plausible",
  "Partially Validated",
  "Validated"
];
const opportunityTypes = [
  "Automation",
  "Workflow Redesign",
  "Data Quality",
  "Capacity Optimization",
  "Compliance Simplification"
];
const archetypeIds = [
  "queue_backlog",
  "manual_verification_drag",
  "documentation_chase",
  "handoff_leakage",
  "duplicated_work",
  "data_fragmentation",
  "idle_capacity",
  "capacity_mismatch",
  "equipment_lead_time",
  "permitting_delay",
  "regulatory_complexity",
  "inspection_delay",
  "vendor_qualification",
  "workforce_constraint",
  "infrastructure_siting",
  "interconnection_delay",
  "project_approval_friction",
  "supply_concentration",
  "processing_capacity",
  "measurement_blind_spot",
  "demand_forecast_mismatch",
  "hidden_cost_shift",
  "support_channel_overload"
];

const stringFields: IntakeRecordKey[] = [
  "id",
  "industry",
  "subsector",
  "title",
  "category",
  "description",
  "opportunity_cost",
  "estimated_annual_impact",
  "growth_trend",
  "evidence_strength",
  "source_type",
  "validation_status",
  "opportunity_type",
  "primary_archetype",
  "archetype_reasoning",
  "confidence_reasoning"
];

const arrayFields: IntakeRecordKey[] = [
  "evidence",
  "affected_parties",
  "current_process",
  "resource_waste",
  "validation_notes",
  "evidence_gaps",
  "upstream_constraints",
  "downstream_constraints",
  "related_processes",
  "affected_systems",
  "solution_hypotheses",
  "secondary_archetypes",
  "sources"
];

const scoreFields: IntakeRecordKey[] = [
  "time_waste",
  "capital_waste",
  "labor_waste",
  "visibility_score",
  "overlooked_score",
  "digital_solution_potential",
  "automation_potential",
  "ai_potential",
  "implementation_complexity",
  "regulatory_complexity",
  "adoption_complexity",
  "confidence",
  "source_quality",
  "measurement_difficulty",
  "data_availability",
  "archetype_confidence"
];

function main() {
  const errors: string[] = [];
  const schema = readJsonFile(schemaPath);
  const intakeFiles = findIntakeFiles();
  let recordCount = 0;

  if (!isObject(schema) || schema.title !== "Constraint Intake Contract") {
    errors.push("Schema file is missing the expected contract title.");
  }

  const ids = new Set<string>();

  intakeFiles.forEach((path) => {
    const intake = readJsonFile(path);
    if (!isObject(intake)) {
      errors.push(`${path}: intake file must be a JSON object.`);
      return;
    }

    if (intake.contract_version !== "1.0") {
      errors.push(`${path}: contract_version must be 1.0.`);
    }

    if (!Array.isArray(intake.records) || intake.records.length === 0) {
      errors.push(`${path}: records must be a non-empty array.`);
      return;
    }

    recordCount += intake.records.length;

    intake.records.forEach((record, index) => {
      if (!isObject(record)) {
        errors.push(`${path}: records[${index}] must be an object.`);
        return;
      }

      validateRecord(record, index, path, errors);

      if (typeof record.id === "string") {
        if (ids.has(record.id)) {
          errors.push(`${path}: records[${index}].id is duplicated: ${record.id}`);
        }
        ids.add(record.id);
      }
    });
  });

  if (errors.length === 0) {
    console.log(
      `Validated ${recordCount} intake records from ${intakeFiles.length} intake file(s).`
    );
    return;
  }

  report(errors);
}

function validateRecord(
  record: Record<string, unknown>,
  index: number,
  path: string,
  errors: string[]
) {
  const prefix = `${path}: records[${index}]`;

  stringFields.forEach((field) => {
    if (typeof record[field] !== "string" || record[field].trim().length === 0) {
      errors.push(`${prefix}.${field} must be a non-empty string.`);
    }
  });

  arrayFields.forEach((field) => {
    if (!Array.isArray(record[field]) || record[field].length === 0) {
      errors.push(`${prefix}.${field} must be a non-empty array.`);
    }
  });

  scoreFields.forEach((field) => {
    if (!isScore(record[field])) {
      errors.push(`${prefix}.${field} must be an integer from 1 to 10.`);
    }
  });

  validateKnownValue(record.industry, industries, `${prefix}.industry`, errors);

  validateKnownValue(record.category, categories, `${prefix}.category`, errors);
  validateKnownValue(
    record.growth_trend,
    growthTrends,
    `${prefix}.growth_trend`,
    errors
  );
  validateKnownValue(
    record.evidence_strength,
    evidenceStrengths,
    `${prefix}.evidence_strength`,
    errors
  );
  validateKnownValue(
    record.source_type,
    sourceTypes,
    `${prefix}.source_type`,
    errors
  );
  validateKnownValue(
    record.validation_status,
    validationStatuses,
    `${prefix}.validation_status`,
    errors
  );
  validateKnownValue(
    record.opportunity_type,
    opportunityTypes,
    `${prefix}.opportunity_type`,
    errors
  );
  validateKnownValue(
    record.primary_archetype,
    archetypeIds,
    `${prefix}.primary_archetype`,
    errors
  );

  if (Array.isArray(record.secondary_archetypes)) {
    record.secondary_archetypes.forEach((archetype, archetypeIndex) =>
      validateKnownValue(
        archetype,
        archetypeIds,
        `${prefix}.secondary_archetypes[${archetypeIndex}]`,
        errors
      )
    );
  }

  if (Array.isArray(record.sources)) {
    record.sources.forEach((source, sourceIndex) =>
      validateSource(source, index, sourceIndex, path, record.source_type, errors)
    );
  }

  validateCaptureQuality(record, prefix, errors);
}

function validateSource(
  source: unknown,
  recordIndex: number,
  sourceIndex: number,
  path: string,
  expectedSourceType: unknown,
  errors: string[]
) {
  if (!isObject(source)) {
    errors.push(
      `${path}: records[${recordIndex}].sources[${sourceIndex}] must be an object.`
    );
    return;
  }

  const sourceRecord = source as Partial<IntakeSource>;
  const prefix = `${path}: records[${recordIndex}].sources[${sourceIndex}]`;

  ["title", "publisher", "source_type"].forEach((field) => {
    const value = sourceRecord[field as keyof IntakeSource];
    if (typeof value !== "string" || value.trim().length === 0) {
      errors.push(`${prefix}.${field} must be a non-empty string.`);
    }
  });

  validateKnownValue(sourceRecord.source_type, sourceTypes, `${prefix}.source_type`, errors);

  if (
    typeof sourceRecord.source_type === "string" &&
    sourceRecord.source_type !== expectedSourceType
  ) {
    errors.push(`${prefix}.source_type must match the record source_type.`);
  }

  if (typeof sourceRecord.url === "string" && !isRealisticUrl(sourceRecord.url)) {
    errors.push(`${prefix}.url must be a real non-placeholder http(s) URL if provided.`);
  }
}

function validateCaptureQuality(
  record: Record<string, unknown>,
  prefix: string,
  errors: string[]
) {
  const description = stringValue(record.description);
  const validationText = [
    ...arrayValue(record.validation_notes),
    ...arrayValue(record.evidence_gaps)
  ].join(" ");
  const workflowText = [
    ...arrayValue(record.current_process),
    ...arrayValue(record.related_processes),
    ...arrayValue(record.affected_systems)
  ].join(" ");

  if (description.length < 80) {
    errors.push(
      `${prefix}.description must describe a specific constraint mechanism, not a generic domain problem.`
    );
  }

  if (arrayValue(record.current_process).length < 2) {
    errors.push(
      `${prefix}.current_process must identify the affected workflow or process layer.`
    );
  }

  if (arrayValue(record.affected_systems).length === 0) {
    errors.push(`${prefix}.affected_systems must identify the affected system layer.`);
  }

  if (!hasOperationalNoun(workflowText)) {
    errors.push(
      `${prefix} must identify an operational system, queue, workflow, tracker, portal, repository, or planning layer.`
    );
  }

  if (!hasMeasurementLanguage(validationText)) {
    errors.push(
      `${prefix} must include a measurable validation metric or proxy in validation_notes or evidence_gaps.`
    );
  }

  if (arrayValue(record.evidence_gaps).length === 0) {
    errors.push(`${prefix}.evidence_gaps must name the missing proof or artifact need.`);
  }

  if (arrayValue(record.solution_hypotheses).length === 0) {
    errors.push(`${prefix}.solution_hypotheses must include a plausible intervention path.`);
  }

  if (
    record.source_type === "Operational Pattern" &&
    (record.validation_status === "Partially Validated" ||
      record.validation_status === "Validated")
  ) {
    errors.push(
      `${prefix}.validation_status cannot claim validation from Operational Pattern evidence alone.`
    );
  }

  if (record.source_type === "Operational Pattern" && record.evidence_strength === "High") {
    errors.push(
      `${prefix}.evidence_strength cannot be High when source_type is Operational Pattern.`
    );
  }

  if (record.validation_status === "Validated" && record.evidence_strength !== "High") {
    errors.push(
      `${prefix}.validation_status can be Validated only when evidence_strength is High.`
    );
  }
}

function findIntakeFiles() {
  const files = [intakePath];

  if (existsSync(intakePackDir)) {
    readdirSync(intakePackDir)
      .filter((file) => file.endsWith(".json"))
      .sort((first, second) => first.localeCompare(second))
      .forEach((file) => files.push(join(intakePackDir, file)));
  }

  return files;
}

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function validateKnownValue(
  value: unknown,
  allowedValues: string[],
  label: string,
  errors: string[]
) {
  if (typeof value !== "string" || !allowedValues.includes(value)) {
    errors.push(`${label} has an unknown value.`);
  }
}

function isScore(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 10;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function arrayValue(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function hasMeasurementLanguage(value: string) {
  return /\b(measure|metric|baseline|cycle time|time|rate|count|frequency|share|minutes|days|volume|queue|delay|mismatch|rejection|contacts|completion|throughput|utilization|artifact|sample)\b/i.test(
    value
  );
}

function hasOperationalNoun(value: string) {
  return /\b(system|workflow|process|queue|tracker|portal|repository|plan|planning|schedule|calendar|docket|platform|database|records|log|logs|tool|telemetry|checklist|inbox|intake|review|clearinghouse)\b/i.test(
    value
  );
}

function isRealisticUrl(value: string) {
  if (!/^https?:\/\/[^/]+\.[^/]+/i.test(value)) return false;
  return !/(example\.com|placeholder|todo|localhost|127\.0\.0\.1)/i.test(value);
}

function report(errors: string[]) {
  console.error("Intake validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
}

main();
