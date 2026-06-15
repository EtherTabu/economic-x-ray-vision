type ArchetypeAuditFsModule = typeof import("node:fs");
type ArchetypeAuditPathModule = typeof import("node:path");

const { readFileSync: archetypeAuditReadFileSync } = process.getBuiltinModule(
  "fs"
) as ArchetypeAuditFsModule;
const { resolve: archetypeAuditResolve } = process.getBuiltinModule(
  "path"
) as ArchetypeAuditPathModule;

type ArchetypeAuditExport = {
  record_count: number;
  archetype_count: number;
  archetype_summary: {
    most_widespread_archetype: string;
    highest_priority_archetype: string;
    most_under_validated_archetype: string;
    highest_intervention_opportunity_archetype: string;
    cross_industry_analog_count: number;
    archetype_distribution: Record<string, number>;
    industry_distribution: Record<string, number>;
  };
  archetype_summaries: Array<{
    display_name: string;
    record_count: number;
    affected_industries: string[];
    average_priority_score: number;
    average_validation_confidence: number;
  }>;
  cross_industry_analogs: Array<{
    source_constraint_title: string;
    source_industry: string;
    analog_constraint_title: string;
    analog_industry: string;
    shared_archetypes: string[];
    similarity_score: number;
  }>;
};

const archetypeAuditPath = archetypeAuditResolve(
  "data/exports/archetype_analysis.json"
);
const archetypeAuditExport = JSON.parse(
  archetypeAuditReadFileSync(archetypeAuditPath, "utf8")
) as ArchetypeAuditExport;

console.log("Archetype audit");
console.log(`- total records: ${archetypeAuditExport.record_count}`);
console.log(`- archetypes detected: ${archetypeAuditExport.archetype_count}`);
console.log(
  `- most widespread archetype: ${archetypeAuditExport.archetype_summary.most_widespread_archetype}`
);
console.log(
  `- highest priority archetype: ${archetypeAuditExport.archetype_summary.highest_priority_archetype}`
);
console.log(
  `- most under-validated archetype: ${archetypeAuditExport.archetype_summary.most_under_validated_archetype}`
);
console.log(
  `- strongest intervention archetype: ${archetypeAuditExport.archetype_summary.highest_intervention_opportunity_archetype}`
);
console.log(
  `- cross-industry analog pairs: ${archetypeAuditExport.archetype_summary.cross_industry_analog_count}`
);
console.log(
  `- industries: ${Object.entries(
    archetypeAuditExport.archetype_summary.industry_distribution
  )
    .map(([industry, count]) => `${industry} (${count})`)
    .join(", ")}`
);
console.log("- top archetypes:");
archetypeAuditExport.archetype_summaries.slice(0, 5).forEach((summary) => {
  console.log(
    `  - ${summary.display_name}: ${summary.record_count} records, ${summary.affected_industries.length} industries, priority ${summary.average_priority_score}`
  );
});
console.log("- top analogs:");
archetypeAuditExport.cross_industry_analogs.slice(0, 5).forEach((analog) => {
  console.log(
    `  - ${analog.source_constraint_title} / ${analog.analog_constraint_title}: ${analog.similarity_score} (${analog.shared_archetypes.join(", ")})`
  );
});

if (archetypeAuditExport.archetype_summary.cross_industry_analog_count === 0) {
  process.exitCode = 1;
}
