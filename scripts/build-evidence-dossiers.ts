type EvidenceBuildFsModule = typeof import("node:fs");
type EvidenceBuildPathModule = typeof import("node:path");

const {
  existsSync: evidenceBuildExistsSync,
  mkdirSync: evidenceBuildMkdirSync,
  readFileSync: evidenceBuildReadFileSync,
  writeFileSync: evidenceBuildWriteFileSync
} = process.getBuiltinModule("fs") as EvidenceBuildFsModule;
const {
  dirname: evidenceBuildDirname,
  resolve: evidenceBuildResolve
} = process.getBuiltinModule("path") as EvidenceBuildPathModule;

type EvidenceBuildRecord = {
  id: string;
  title: string;
  category: string;
  source_type: string;
  validation_status: string;
  evidence_strength: string;
  evidence: string[];
  evidence_gaps: string[];
  sources: string[];
  validation_notes: string[];
  affected_parties: string[];
  related_processes: string[];
  affected_systems: string[];
  downstream_constraints: string[];
  solution_hypotheses: string[];
  time_waste: number;
  capital_waste: number;
  labor_waste: number;
  data_availability: number;
  measurement_difficulty: number;
  scores: Record<string, number>;
};

type EvidenceBuildDossier = {
  constraint_id: string;
  constraint_title: string;
  core_claim: string;
  current_validation_status: string;
  current_validation_confidence: number;
  evidence_strength: string;
  evidence_risk_level: string;
  evidence_summary: string;
  known_evidence: string[];
  evidence_gaps: string[];
  what_would_prove_this_true: string[];
  what_would_disprove_this: string[];
  recommended_validation_steps: string[];
  recommended_source_types: string[];
  red_team_questions: string[];
  confidence_upgrade_path: string[];
  decision_usefulness: string;
  decision_ready: boolean;
  validation_priority_score: number;
};

const evidenceBuildDatasetPath = evidenceBuildResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const evidenceBuildOutputPath = evidenceBuildResolve(
  "data/exports/evidence_dossiers.json"
);

function buildEvidenceDossierExport() {
  const dataset = JSON.parse(
    evidenceBuildReadFileSync(evidenceBuildDatasetPath, "utf8")
  ) as { records: EvidenceBuildRecord[] };
  const dossiers = dataset.records
    .map(buildDossier)
    .sort(
      (first, second) =>
        second.validation_priority_score - first.validation_priority_score
    );

  const output = {
    generated_at: new Date().toISOString(),
    dossier_count: dossiers.length,
    validation_summary: validationSummary(dossiers),
    dossiers
  };

  evidenceBuildMkdirSync(evidenceBuildDirname(evidenceBuildOutputPath), {
    recursive: true
  });
  evidenceBuildWriteStableJson(evidenceBuildOutputPath, output);
  console.log(
    `Built ${dossiers.length} evidence dossiers at ${evidenceBuildOutputPath}.`
  );
  return output;
}

function evidenceBuildWriteStableJson(
  path: string,
  output: Record<string, unknown>
) {
  const stableOutput = evidenceBuildPreserveGeneratedAt(path, output);
  evidenceBuildWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function evidenceBuildPreserveGeneratedAt(
  path: string,
  output: Record<string, unknown>
) {
  if (!evidenceBuildExistsSync(path)) {
    return output;
  }

  const existing = JSON.parse(evidenceBuildReadFileSync(path, "utf8")) as Record<
    string,
    unknown
  >;
  const existingComparable = { ...existing, generated_at: output.generated_at };

  if (JSON.stringify(existingComparable) === JSON.stringify(output)) {
    return {
      ...output,
      generated_at: existing.generated_at
    };
  }

  return output;
}

function buildDossier(record: EvidenceBuildRecord): EvidenceBuildDossier {
  const state = evidenceBuildValidationState(record);
  const riskLevel = evidenceBuildRiskLevel(record);
  const validationPriority = evidenceBuildPriorityScore(record, state);
  const proofSteps = [
    `Operational data confirms recurring ${record.category.toLowerCase()} in ${record.related_processes[0]}.`,
    `Measured waste aligns with time ${record.time_waste}/10, labor ${record.labor_waste}/10, or capital ${record.capital_waste}/10 assumptions.`,
    `Downstream effects appear in ${record.downstream_constraints[0]}.`
  ];
  const disproofSteps = [
    `Local records show little or no recurring ${record.category.toLowerCase()} friction.`,
    "Measured labor, time, or capital waste is materially lower than current assumptions.",
    `The affected systems do not contain enough data to verify ${record.related_processes[0]}.`
  ];
  const validationSteps = [
    `Measure ${record.related_processes[0]} using local operational logs.`,
    `Validate whether ${record.evidence_gaps[0]} materially changes the opportunity score.`,
    `Compare outcomes before and after a small intervention using ${record.solution_hypotheses[0]}.`
  ];

  return {
    constraint_id: record.id,
    constraint_title: record.title,
    core_claim: `${record.title} creates ${record.category.toLowerCase()} through ${record.related_processes[0]}.`,
    current_validation_status: state,
    current_validation_confidence: record.scores.validation_confidence_score,
    evidence_strength: record.evidence_strength,
    evidence_risk_level: riskLevel,
    evidence_summary: `${record.evidence_strength} evidence based on ${record.source_type.toLowerCase()} inputs with ${record.sources.length} listed source signal(s).`,
    known_evidence: record.evidence,
    evidence_gaps: record.evidence_gaps,
    what_would_prove_this_true: proofSteps,
    what_would_disprove_this: disproofSteps,
    recommended_validation_steps: validationSteps,
    recommended_source_types: [
      `Local ${record.affected_systems[0]} logs`,
      `${record.related_processes[0]} timestamps or queues`,
      `${record.source_type} benchmark comparison`
    ],
    red_team_questions: [
      `Is ${record.title} frequent enough locally to matter?`,
      "Could the observed waste be caused by an upstream issue instead?",
      `Would fixing ${record.related_processes[0]} improve ${record.downstream_constraints[0]}?`
    ],
    confidence_upgrade_path: validationSteps,
    decision_usefulness: decisionUsefulness(record, state),
    decision_ready:
      state === "validated" ||
      (state === "evidence_backed" &&
        record.scores.validation_confidence_score >= 7.5),
    validation_priority_score: validationPriority
  };
}

function validationSummary(dossiers: EvidenceBuildDossier[]) {
  return {
    total_dossiers: dossiers.length,
    decision_ready_records: dossiers.filter((dossier) => dossier.decision_ready)
      .length,
    needs_evidence_records: dossiers.filter(
      (dossier) =>
        dossier.current_validation_status === "needs_evidence" ||
        dossier.current_validation_status === "unvalidated"
    ).length,
    high_priority_validation_records: dossiers.filter(
      (dossier) => dossier.validation_priority_score >= 7.5
    ).length,
    high_opportunity_weak_evidence_records: dossiers.filter(
      (dossier) =>
        dossier.validation_priority_score >= 7 &&
        dossier.evidence_risk_level !== "Low"
    ).length,
    validation_status_distribution: evidenceBuildDistribution(
      dossiers.map((dossier) => dossier.current_validation_status)
    ),
    average_validation_priority_score: evidenceBuildRound(
      dossiers.reduce(
        (total, dossier) => total + dossier.validation_priority_score,
        0
      ) / dossiers.length
    )
  };
}

function evidenceBuildValidationState(record: EvidenceBuildRecord) {
  if (record.validation_status === "Validated") return "validated";
  if (record.validation_status === "Unverified") return "unvalidated";
  if (record.scores.evidence_score < 6 || record.data_availability < 7) {
    return "needs_evidence";
  }
  if (
    record.validation_status === "Partially Validated" &&
    record.scores.validation_confidence_score >= 7
  ) {
    return "evidence_backed";
  }
  return "partially_supported";
}

function evidenceBuildRiskLevel(record: EvidenceBuildRecord) {
  if (record.scores.evidence_score < 6 || record.data_availability < 6) return "High";
  if (record.scores.validation_confidence_score < 7) return "Moderate";
  return "Low";
}

function evidenceBuildPriorityScore(record: EvidenceBuildRecord, state: string) {
  const evidenceGapWeight =
    state === "needs_evidence" || state === "unvalidated" ? 1 : 0.4;
  return evidenceBuildRound(
    Math.min(
      10,
      record.scores.total_strategic_score * 0.35 +
        record.scores.opportunity_score * 0.25 +
        (11 - record.scores.validation_confidence_score) * 0.25 +
        (11 - record.scores.evidence_score) * 0.15 +
        evidenceGapWeight
    )
  );
}

function decisionUsefulness(record: EvidenceBuildRecord, state: string) {
  if (state === "validated" || state === "evidence_backed") {
    return "Decision-ready for prioritizing a scoped validation or pilot.";
  }
  if (record.scores.total_strategic_score >= 8) {
    return "Useful as a high-priority hypothesis, not yet as a validated claim.";
  }
  return "Useful for research queueing and evidence collection.";
}

function evidenceBuildDistribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function evidenceBuildRound(value: number) {
  return Math.round(value * 10) / 10;
}

buildEvidenceDossierExport();
