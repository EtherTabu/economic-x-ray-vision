type CoverageFsModule = typeof import("node:fs");
type CoveragePathModule = typeof import("node:path");

const {
  existsSync: coverageExistsSync,
  mkdirSync: coverageMkdirSync,
  readFileSync: coverageReadFileSync,
  writeFileSync: coverageWriteFileSync
} = process.getBuiltinModule("fs") as CoverageFsModule;
const {
  dirname: coverageDirname,
  resolve: coverageResolve
} = process.getBuiltinModule("path") as CoveragePathModule;

const coverageBaseline = {
  record_count: 52,
  validation_task_count: 316,
  evidence_artifact_count: 276,
  analyst_state_record_count: 647
};

const coverageDatasetPath = coverageResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const coverageTaskPath = coverageResolve("data/exports/validation_tasks.json");
const coverageArtifactPath = coverageResolve(
  "data/exports/evidence_artifact_library.json"
);
const coverageAnalystStatePath = coverageResolve(
  "data/exports/analyst_state_template.json"
);
const coverageOutputPath = coverageResolve(
  "data/exports/coverage_density_report.json"
);

type CoverageRecord = {
  id: string;
  industry: string;
  subsector: string;
  title: string;
  evidence_strength: string;
  primary_archetype: string;
  validation_status: string;
  scores: {
    opportunity_score: number;
    evidence_score: number;
  };
};

type CoverageTask = {
  constraint_id: string;
  industry: string;
};

type CoverageArtifact = {
  constraint_id: string;
  artifact_type: string;
  priority: number;
};

type CoverageState = {
  entity_type: string;
  status: string;
};

const frontierDomains = [
  "Data centers / AI infrastructure",
  "Power generation / nuclear / SMR",
  "Grid interconnection / transmission",
  "Semiconductors / advanced manufacturing",
  "Critical minerals / refining",
  "Robotics / automation deployment",
  "Aerospace / defense / space manufacturing",
  "Industrial logistics / field operations"
];

function coverageMain() {
  const dataset = coverageReadJson<{
    record_count: number;
    records: CoverageRecord[];
    quality_summary: {
      duplicate_ids: string[];
      high_opportunity_weak_evidence_records: string[];
    };
  }>(coverageDatasetPath);
  const tasks = coverageReadJson<{ task_count: number; tasks: CoverageTask[] }>(
    coverageTaskPath
  );
  const artifacts = coverageReadJson<{
    summary: { artifact_count: number; high_priority_artifact_count: number };
    artifacts: CoverageArtifact[];
  }>(coverageArtifactPath);
  const analystState = coverageReadJson<{
    summary: { total_state_records: number; status_distribution: Record<string, number> };
    states: CoverageState[];
  }>(coverageAnalystStatePath);

  const records = dataset.records;
  const domainCoverage = coverageDomainDistribution(records);
  const report = {
    generated_at: new Date().toISOString(),
    baseline: coverageBaseline,
    current: {
      record_count: dataset.record_count,
      records_added_since_baseline: dataset.record_count - coverageBaseline.record_count,
      validation_task_count: tasks.task_count,
      evidence_artifact_count: artifacts.summary.artifact_count,
      analyst_state_record_count: analystState.summary.total_state_records
    },
    growth: {
      validation_task_growth:
        tasks.task_count - coverageBaseline.validation_task_count,
      evidence_artifact_growth:
        artifacts.summary.artifact_count - coverageBaseline.evidence_artifact_count,
      analyst_state_growth:
        analystState.summary.total_state_records -
        coverageBaseline.analyst_state_record_count
    },
    coverage_summary: {
      frontier_infrastructure_coverage_count: records.filter((record) =>
        coverageClassifyDomain(record)
      ).length,
      records_by_frontier_domain: domainCoverage,
      under_covered_domains_remaining: frontierDomains.filter(
        (domain) => (domainCoverage[domain] ?? 0) < 3
      ),
      records_by_industry: coverageDistribution(
        records.map((record) => record.industry)
      ),
      records_by_archetype: coverageDistribution(
        records.map((record) => record.primary_archetype)
      ),
      records_by_evidence_strength: coverageDistribution(
        records.map((record) => record.evidence_strength)
      ),
      records_by_validation_status: coverageDistribution(
        records.map((record) => record.validation_status)
      )
    },
    quality_signals: {
      duplicate_ids: dataset.quality_summary.duplicate_ids,
      high_opportunity_weak_evidence_records:
        dataset.quality_summary.high_opportunity_weak_evidence_records,
      high_opportunity_weak_evidence_count:
        dataset.quality_summary.high_opportunity_weak_evidence_records.length,
      high_priority_artifacts: artifacts.summary.high_priority_artifact_count,
      analyst_state_status_distribution: analystState.summary.status_distribution
    }
  };

  coverageMkdirSync(coverageDirname(coverageOutputPath), { recursive: true });
  coverageWriteStableJson(coverageOutputPath, report);
  coveragePrint(report);

  if (
    report.current.record_count < 80 ||
    report.current.record_count > 90 ||
    report.coverage_summary.under_covered_domains_remaining.length > 0 ||
    report.quality_signals.duplicate_ids.length > 0
  ) {
    process.exitCode = 1;
  }
}

function coverageClassifyDomain(record: CoverageRecord) {
  const text = `${record.industry} ${record.subsector} ${record.title}`.toLowerCase();

  if (record.industry === "Data Centers / AI Infrastructure") {
    return "Data centers / AI infrastructure";
  }
  if (record.industry === "Power Generation / Nuclear / SMR") {
    return "Power generation / nuclear / SMR";
  }
  if (
    record.industry === "Energy / Grid / Interconnection" &&
    /grid|transmission|substation|interconnection|large load/.test(text)
  ) {
    return "Grid interconnection / transmission";
  }
  if (record.industry === "Semiconductors / Advanced Manufacturing") {
    return "Semiconductors / advanced manufacturing";
  }
  if (record.industry === "Metals / Mining / Critical Inputs") {
    return "Critical minerals / refining";
  }
  if (record.industry === "Robotics / Automation Deployment") {
    return "Robotics / automation deployment";
  }
  if (record.industry === "Aerospace / Defense / Space Manufacturing") {
    return "Aerospace / defense / space manufacturing";
  }
  if (record.industry === "Logistics / Supply Chain / Industrial Equipment") {
    return "Industrial logistics / field operations";
  }

  return "";
}

function coverageDomainDistribution(records: CoverageRecord[]) {
  const counts = Object.fromEntries(frontierDomains.map((domain) => [domain, 0]));

  records.forEach((record) => {
    const domain = coverageClassifyDomain(record);
    if (domain) {
      counts[domain] += 1;
    }
  });

  return counts;
}

function coveragePrint(report: {
  current: {
    record_count: number;
    records_added_since_baseline: number;
    validation_task_count: number;
    evidence_artifact_count: number;
    analyst_state_record_count: number;
  };
  growth: {
    validation_task_growth: number;
    evidence_artifact_growth: number;
    analyst_state_growth: number;
  };
  coverage_summary: {
    frontier_infrastructure_coverage_count: number;
    records_by_frontier_domain: Record<string, number>;
    under_covered_domains_remaining: string[];
  };
  quality_signals: {
    duplicate_ids: string[];
    high_opportunity_weak_evidence_count: number;
  };
}) {
  console.log("Coverage density audit");
  console.log(`- old record count: ${coverageBaseline.record_count}`);
  console.log(`- new record count: ${report.current.record_count}`);
  console.log(`- records added: ${report.current.records_added_since_baseline}`);
  console.log(
    `- frontier infrastructure records: ${report.coverage_summary.frontier_infrastructure_coverage_count}`
  );
  console.log(
    `- validation tasks: ${report.current.validation_task_count} (${coverageSigned(report.growth.validation_task_growth)})`
  );
  console.log(
    `- evidence artifacts: ${report.current.evidence_artifact_count} (${coverageSigned(report.growth.evidence_artifact_growth)})`
  );
  console.log(
    `- analyst state records: ${report.current.analyst_state_record_count} (${coverageSigned(report.growth.analyst_state_growth)})`
  );
  console.log(
    `- high opportunity / weak evidence: ${report.quality_signals.high_opportunity_weak_evidence_count}`
  );
  console.log(`- duplicate ids: ${report.quality_signals.duplicate_ids.length}`);
  console.log(
    `- under-covered domains: ${report.coverage_summary.under_covered_domains_remaining.length === 0 ? "none" : report.coverage_summary.under_covered_domains_remaining.join(", ")}`
  );
  console.log("- frontier domain distribution:");
  Object.entries(report.coverage_summary.records_by_frontier_domain).forEach(
    ([domain, count]) => {
      console.log(`  - ${domain}: ${count}`);
    }
  );
  console.log(`- report: ${coverageOutputPath}`);
}

function coverageReadJson<T>(path: string) {
  return JSON.parse(coverageReadFileSync(path, "utf8")) as T;
}

function coverageWriteStableJson(path: string, output: Record<string, unknown>) {
  const stableOutput = coveragePreserveGeneratedAt(path, output);
  coverageWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function coveragePreserveGeneratedAt(
  path: string,
  output: Record<string, unknown>
) {
  if (!coverageExistsSync(path)) return output;

  const existing = JSON.parse(coverageReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const comparable = { ...existing, generated_at: output.generated_at };

  if (JSON.stringify(comparable) === JSON.stringify(output)) {
    return { ...output, generated_at: existing.generated_at };
  }

  return output;
}

function coverageDistribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function coverageSigned(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

coverageMain();
