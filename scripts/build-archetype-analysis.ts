type ArchetypeBuildFsModule = typeof import("node:fs");
type ArchetypeBuildPathModule = typeof import("node:path");

const {
  existsSync: archetypeBuildExistsSync,
  mkdirSync: archetypeBuildMkdirSync,
  readFileSync: archetypeBuildReadFileSync,
  writeFileSync: archetypeBuildWriteFileSync
} = process.getBuiltinModule("fs") as ArchetypeBuildFsModule;
const {
  dirname: archetypeBuildDirname,
  resolve: archetypeBuildResolve
} = process.getBuiltinModule("path") as ArchetypeBuildPathModule;

type ArchetypeBuildRecord = {
  id: string;
  title: string;
  industry: string;
  category: string;
  opportunity_type: string;
  primary_archetype: string;
  secondary_archetypes: string[];
  affected_systems: string[];
  related_processes: string[];
  scores: Record<string, number>;
};

type ArchetypeBuildStrategy = {
  constraint_id: string;
  intervention_priority_score: number;
};

const archetypeBuildDatasetPath = archetypeBuildResolve(
  "data/exports/constraint_dataset_snapshot.json"
);
const archetypeBuildInterventionPath = archetypeBuildResolve(
  "data/exports/intervention_strategies.json"
);
const archetypeBuildOutputPath = archetypeBuildResolve(
  "data/exports/archetype_analysis.json"
);

function archetypeBuildMain() {
  const dataset = JSON.parse(
    archetypeBuildReadFileSync(archetypeBuildDatasetPath, "utf8")
  ) as { records: ArchetypeBuildRecord[] };
  const strategies = archetypeBuildLoadStrategies();
  const strategyByConstraint = new Map(
    strategies.map((strategy) => [strategy.constraint_id, strategy])
  );
  const summaries = archetypeBuildSummaries(dataset.records, strategyByConstraint);
  const analogs = archetypeBuildAnalogs(dataset.records);
  const output = {
    generated_at: new Date().toISOString(),
    record_count: dataset.records.length,
    archetype_count: summaries.length,
    archetype_summary: {
      total_archetypes_detected: summaries.length,
      most_widespread_archetype: summaries[0]?.display_name ?? "None",
      highest_priority_archetype:
        archetypeBuildTopBy(summaries, "average_priority_score")?.display_name ??
        "None",
      most_under_validated_archetype:
        summaries
          .slice()
          .sort(
            (first, second) =>
              first.average_validation_confidence -
              second.average_validation_confidence
          )[0]?.display_name ?? "None",
      highest_intervention_opportunity_archetype:
        archetypeBuildTopBy(summaries, "average_intervention_priority")
          ?.display_name ?? "None",
      cross_industry_analog_count: analogs.length,
      archetype_distribution: archetypeBuildDistribution(
        dataset.records.map((record) => record.primary_archetype)
      ),
      industry_distribution: archetypeBuildDistribution(
        dataset.records.map((record) => record.industry)
      )
    },
    archetype_summaries: summaries,
    cross_industry_analogs: analogs
  };

  archetypeBuildMkdirSync(archetypeBuildDirname(archetypeBuildOutputPath), {
    recursive: true
  });
  archetypeBuildWriteStableJson(archetypeBuildOutputPath, output);
  console.log(
    `Built archetype analysis for ${dataset.records.length} records at ${archetypeBuildOutputPath}.`
  );
}

function archetypeBuildLoadStrategies() {
  if (!archetypeBuildExistsSync(archetypeBuildInterventionPath)) {
    return [] as ArchetypeBuildStrategy[];
  }

  const exportFile = JSON.parse(
    archetypeBuildReadFileSync(archetypeBuildInterventionPath, "utf8")
  ) as { strategies: ArchetypeBuildStrategy[] };

  return exportFile.strategies;
}

function archetypeBuildSummaries(
  records: ArchetypeBuildRecord[],
  strategyByConstraint: Map<string, ArchetypeBuildStrategy>
) {
  const archetypeIds = Array.from(
    new Set(records.flatMap((record) => archetypeBuildSignature(record)))
  ).sort();

  return archetypeIds
    .map((archetypeId) => {
      const matching = records.filter((record) =>
        archetypeBuildSignature(record).includes(archetypeId)
      );

      return {
        archetype_id: archetypeId,
        display_name: archetypeBuildLabel(archetypeId),
        record_count: matching.length,
        affected_industries: Array.from(
          new Set(matching.map((record) => record.industry))
        ).sort(),
        top_constraints: matching
          .slice()
          .sort(
            (first, second) =>
              second.scores.total_priority_score - first.scores.total_priority_score
          )
          .slice(0, 5)
          .map((record) => record.title),
        average_priority_score: archetypeBuildAverage(
          matching.map((record) => record.scores.total_priority_score)
        ),
        average_validation_confidence: archetypeBuildAverage(
          matching.map((record) => record.scores.validation_confidence_score)
        ),
        average_intervention_priority: archetypeBuildAverage(
          matching.map(
            (record) =>
              strategyByConstraint.get(record.id)?.intervention_priority_score ?? 0
          )
        )
      };
    })
    .sort((first, second) => second.record_count - first.record_count);
}

function archetypeBuildAnalogs(records: ArchetypeBuildRecord[]) {
  const analogs = [];

  for (let firstIndex = 0; firstIndex < records.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < records.length; secondIndex += 1) {
      const first = records[firstIndex];
      const second = records[secondIndex];

      if (first.industry === second.industry) {
        continue;
      }

      const sharedArchetypes = archetypeBuildIntersection(
        archetypeBuildSignature(first),
        archetypeBuildSignature(second)
      );

      if (sharedArchetypes.length === 0) {
        continue;
      }

      const sharedSystems = archetypeBuildIntersection(
        archetypeBuildNormalize(first.affected_systems),
        archetypeBuildNormalize(second.affected_systems)
      );
      const similarity = archetypeBuildRound(
        Math.min(
          10,
          sharedArchetypes.length * 2.8 +
            sharedSystems.length * 0.8 +
            (first.category === second.category ? 0.8 : 0) +
            (first.opportunity_type === second.opportunity_type ? 0.7 : 0) +
            1.2
        )
      );

      if (similarity >= 4.5) {
        analogs.push({
          source_constraint_title: first.title,
          source_industry: first.industry,
          analog_constraint_title: second.title,
          analog_industry: second.industry,
          shared_archetypes: sharedArchetypes,
          shared_affected_systems: sharedSystems,
          similarity_score: similarity,
          why_the_analog_matters: `${first.title} and ${second.title} share ${sharedArchetypes[0].replaceAll("_", " ")} across different industries.`
        });
      }
    }
  }

  return analogs
    .sort((first, second) => second.similarity_score - first.similarity_score)
    .slice(0, 20);
}

function archetypeBuildSignature(record: ArchetypeBuildRecord) {
  return [record.primary_archetype, ...record.secondary_archetypes];
}

function archetypeBuildNormalize(values: string[]) {
  return values.map((value) => value.toLowerCase().replace(/\bsystem\b/g, "").trim());
}

function archetypeBuildIntersection(first: string[], second: string[]) {
  const secondSet = new Set(second);
  return Array.from(new Set(first.filter((value) => secondSet.has(value))));
}

function archetypeBuildTopBy<T extends Record<string, unknown>>(
  values: T[],
  key: keyof T
) {
  return values
    .slice()
    .sort((first, second) => Number(second[key]) - Number(first[key]))[0];
}

function archetypeBuildDistribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function archetypeBuildAverage(values: number[]) {
  return archetypeBuildRound(
    values.reduce((total, value) => total + value, 0) / values.length
  );
}

function archetypeBuildLabel(value: string) {
  return value
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function archetypeBuildWriteStableJson(
  path: string,
  output: Record<string, unknown>
) {
  const stableOutput = archetypeBuildPreserveGeneratedAt(path, output);
  archetypeBuildWriteFileSync(path, `${JSON.stringify(stableOutput, null, 2)}\n`);
}

function archetypeBuildPreserveGeneratedAt(
  path: string,
  output: Record<string, unknown>
) {
  if (!archetypeBuildExistsSync(path)) {
    return output;
  }

  const existing = JSON.parse(archetypeBuildReadFileSync(path, "utf8")) as Record<
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

function archetypeBuildRound(value: number) {
  return Math.round(value * 10) / 10;
}

archetypeBuildMain();
