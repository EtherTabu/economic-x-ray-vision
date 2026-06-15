type FsModule = typeof import("node:fs");
type PathModule = typeof import("node:path");

const { readFileSync } = process.getBuiltinModule("fs") as FsModule;
const { resolve } = process.getBuiltinModule("path") as PathModule;

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
  "Energy / Grid / Interconnection",
  "Infrastructure / Permitting / Construction",
  "Semiconductors / Advanced Manufacturing",
  "Metals / Mining / Critical Inputs",
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
  const intake = readJsonFile(intakePath);

  if (!isObject(schema) || schema.title !== "Constraint Intake Contract") {
    errors.push("Schema file is missing the expected contract title.");
  }

  if (!isObject(intake)) {
    errors.push("Intake file must be a JSON object.");
    report(errors);
    return;
  }

  if (intake.contract_version !== "1.0") {
    errors.push("contract_version must be 1.0.");
  }

  if (!Array.isArray(intake.records) || intake.records.length === 0) {
    errors.push("records must be a non-empty array.");
    report(errors);
    return;
  }

  const ids = new Set<string>();

  intake.records.forEach((record, index) => {
    if (!isObject(record)) {
      errors.push(`records[${index}] must be an object.`);
      return;
    }

    validateRecord(record, index, errors);

    if (typeof record.id === "string") {
      if (ids.has(record.id)) {
        errors.push(`records[${index}].id is duplicated: ${record.id}`);
      }
      ids.add(record.id);
    }
  });

  if (errors.length === 0) {
    console.log(
      `Validated ${intake.records.length} intake records from ${intakePath}.`
    );
    return;
  }

  report(errors);
}

function validateRecord(
  record: Record<string, unknown>,
  index: number,
  errors: string[]
) {
  stringFields.forEach((field) => {
    if (typeof record[field] !== "string" || record[field].trim().length === 0) {
      errors.push(`records[${index}].${field} must be a non-empty string.`);
    }
  });

  arrayFields.forEach((field) => {
    if (!Array.isArray(record[field]) || record[field].length === 0) {
      errors.push(`records[${index}].${field} must be a non-empty array.`);
    }
  });

  scoreFields.forEach((field) => {
    if (!isScore(record[field])) {
      errors.push(`records[${index}].${field} must be an integer from 1 to 10.`);
    }
  });

  validateKnownValue(record.industry, industries, `records[${index}].industry`, errors);

  validateKnownValue(record.category, categories, `records[${index}].category`, errors);
  validateKnownValue(
    record.growth_trend,
    growthTrends,
    `records[${index}].growth_trend`,
    errors
  );
  validateKnownValue(
    record.evidence_strength,
    evidenceStrengths,
    `records[${index}].evidence_strength`,
    errors
  );
  validateKnownValue(
    record.source_type,
    sourceTypes,
    `records[${index}].source_type`,
    errors
  );
  validateKnownValue(
    record.validation_status,
    validationStatuses,
    `records[${index}].validation_status`,
    errors
  );
  validateKnownValue(
    record.opportunity_type,
    opportunityTypes,
    `records[${index}].opportunity_type`,
    errors
  );
  validateKnownValue(
    record.primary_archetype,
    archetypeIds,
    `records[${index}].primary_archetype`,
    errors
  );

  if (Array.isArray(record.secondary_archetypes)) {
    record.secondary_archetypes.forEach((archetype, archetypeIndex) =>
      validateKnownValue(
        archetype,
        archetypeIds,
        `records[${index}].secondary_archetypes[${archetypeIndex}]`,
        errors
      )
    );
  }

  if (Array.isArray(record.sources)) {
    record.sources.forEach((source, sourceIndex) =>
      validateSource(source, index, sourceIndex, record.source_type, errors)
    );
  }
}

function validateSource(
  source: unknown,
  recordIndex: number,
  sourceIndex: number,
  expectedSourceType: unknown,
  errors: string[]
) {
  if (!isObject(source)) {
    errors.push(`records[${recordIndex}].sources[${sourceIndex}] must be an object.`);
    return;
  }

  const sourceRecord = source as Partial<IntakeSource>;
  const prefix = `records[${recordIndex}].sources[${sourceIndex}]`;

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

function report(errors: string[]) {
  console.error("Intake validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
}

main();
