type EvidenceAuditFsModule = typeof import("node:fs");
type EvidenceAuditPathModule = typeof import("node:path");

const { readFileSync: evidenceAuditReadFileSync } = process.getBuiltinModule(
  "fs"
) as EvidenceAuditFsModule;
const { resolve: evidenceAuditResolve } = process.getBuiltinModule(
  "path"
) as EvidenceAuditPathModule;

type EvidenceAuditDossier = {
  constraint_id: string;
  constraint_title: string;
  current_validation_status: string;
  evidence_strength: string;
  evidence_risk_level: string;
  validation_priority_score: number;
};

const evidenceAuditPath = evidenceAuditResolve("data/exports/evidence_dossiers.json");
const evidenceAuditExport = JSON.parse(
  evidenceAuditReadFileSync(evidenceAuditPath, "utf8")
) as {
  validation_summary: {
    total_dossiers: number;
    decision_ready_records: number;
    needs_evidence_records: number;
    high_opportunity_weak_evidence_records: number;
  };
  dossiers: EvidenceAuditDossier[];
};

const evidenceAuditDossiers = evidenceAuditExport.dossiers;
const evidenceAuditPartiallySupported = evidenceAuditDossiers.filter(
  (dossier) => dossier.current_validation_status === "partially_supported"
);
const evidenceAuditTopPriorities = evidenceAuditDossiers.slice(0, 5);
const evidenceAuditWeakEvidence = evidenceAuditDossiers.filter(
  (dossier) => dossier.evidence_risk_level !== "Low"
);

console.log("Evidence audit");
console.log(`- total dossiers: ${evidenceAuditExport.validation_summary.total_dossiers}`);
console.log(
  `- records needing evidence: ${evidenceAuditExport.validation_summary.needs_evidence_records}`
);
console.log(`- records partially supported: ${evidenceAuditPartiallySupported.length}`);
console.log(
  `- records decision-ready: ${evidenceAuditExport.validation_summary.decision_ready_records}`
);
console.log("- top 5 validation priorities:");
evidenceAuditTopPriorities.forEach((dossier) => {
  console.log(
    `  - ${dossier.constraint_id}: ${dossier.validation_priority_score} ${dossier.constraint_title}`
  );
});
console.log(
  `- high opportunity / weak evidence records: ${evidenceAuditExport.validation_summary.high_opportunity_weak_evidence_records}`
);
console.log(
  `- weakest evidence categories: ${evidenceAuditCategoryList(evidenceAuditWeakEvidence)}`
);
console.log(
  `- strongest evidence categories: ${evidenceAuditCategoryList(
    evidenceAuditDossiers.filter((dossier) => dossier.evidence_risk_level === "Low")
  )}`
);

function evidenceAuditCategoryList(dossiers: EvidenceAuditDossier[]) {
  const counts = dossiers.reduce<Record<string, number>>((currentCounts, dossier) => {
    currentCounts[dossier.evidence_strength] =
      (currentCounts[dossier.evidence_strength] ?? 0) + 1;
    return currentCounts;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => `${label} (${count})`)
    .join(", ") || "none";
}
