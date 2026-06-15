import type { ScoredConstraint, SourceType } from "@/types/constraint";

export type SourceRecord = {
  source_id: string;
  title: string;
  source_type: SourceType;
  publisher: string;
  referenced_by: string[];
  provenance_level: "source-title-only" | "secondary-reference" | "operational-pattern";
  citation_status: "needs-url" | "needs-primary-document" | "local-observation-needed";
  trust_weight: number;
  verification_need: string;
};

export type SourceRegistrySummary = {
  source_count: number;
  constraint_coverage_count: number;
  average_trust_weight: number;
  provenance_distribution: Record<string, number>;
  citation_status_distribution: Record<string, number>;
  sources_needing_primary_documents: number;
};

export type SourceRegistry = {
  sources: SourceRecord[];
  summary: SourceRegistrySummary;
};

export function buildSourceRegistry(
  constraints: ScoredConstraint[]
): SourceRegistry {
  const sourceMap = new Map<string, SourceRecord>();

  constraints.forEach((constraint) => {
    constraint.sources.forEach((sourceTitle) => {
      const sourceId = sourceIdFor(sourceTitle);
      const existing = sourceMap.get(sourceId);
      const record =
        existing ??
        ({
          source_id: sourceId,
          title: sourceTitle,
          source_type: constraint.source_type,
          publisher: publisherFromTitle(sourceTitle),
          referenced_by: [],
          provenance_level: provenanceLevel(constraint.source_type),
          citation_status: citationStatus(constraint.source_type),
          trust_weight: trustWeight(constraint.source_type, constraint.source_quality),
          verification_need: verificationNeed(constraint.source_type)
        } satisfies SourceRecord);

      record.referenced_by = Array.from(
        new Set([...record.referenced_by, constraint.id])
      ).sort();
      record.trust_weight = round(
        (record.trust_weight + trustWeight(constraint.source_type, constraint.source_quality)) /
          2
      );
      sourceMap.set(sourceId, record);
    });
  });

  const sources = Array.from(sourceMap.values()).sort((first, second) =>
    first.title.localeCompare(second.title)
  );

  return {
    sources,
    summary: {
      source_count: sources.length,
      constraint_coverage_count: constraints.filter(
        (constraint) => constraint.sources.length > 0
      ).length,
      average_trust_weight: round(
        sources.reduce((total, source) => total + source.trust_weight, 0) /
          sources.length
      ),
      provenance_distribution: distribution(
        sources.map((source) => source.provenance_level)
      ),
      citation_status_distribution: distribution(
        sources.map((source) => source.citation_status)
      ),
      sources_needing_primary_documents: sources.filter(
        (source) => source.citation_status === "needs-primary-document"
      ).length
    }
  };
}

export function sourceIdFor(title: string) {
  return `source:${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function publisherFromTitle(title: string) {
  return title.split(/ guidance| surveys| resources| benchmarks| research| reports| index| standards| programs| case studies/i)[0].trim();
}

function provenanceLevel(sourceType: SourceType): SourceRecord["provenance_level"] {
  if (sourceType === "Operational Pattern") return "operational-pattern";
  if (sourceType === "Mixed Secondary") return "secondary-reference";
  return "source-title-only";
}

function citationStatus(sourceType: SourceType): SourceRecord["citation_status"] {
  if (sourceType === "Operational Pattern") return "local-observation-needed";
  if (sourceType === "Government" || sourceType === "Professional Association") {
    return "needs-primary-document";
  }
  return "needs-url";
}

function trustWeight(sourceType: SourceType, sourceQuality: number) {
  const typeBoost =
    sourceType === "Government"
      ? 1
      : sourceType === "Professional Association"
        ? 0.7
        : sourceType === "Industry Benchmark"
          ? 0.5
          : sourceType === "Mixed Secondary"
            ? 0.2
            : -0.2;

  return clamp(round(sourceQuality + typeBoost));
}

function verificationNeed(sourceType: SourceType) {
  if (sourceType === "Operational Pattern") {
    return "Attach local observation notes, logs, or interview records.";
  }

  if (sourceType === "Government") {
    return "Attach specific agency document, program page, or dataset reference.";
  }

  if (sourceType === "Professional Association") {
    return "Attach report title, publication date, and methodology where available.";
  }

  return "Attach source URL, publication date, and scope notes before treating as validated.";
}

function distribution(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function clamp(score: number) {
  return Math.max(1, Math.min(10, score));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
