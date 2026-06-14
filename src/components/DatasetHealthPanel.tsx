import type { DatasetQualitySummary } from "@/lib/dataQuality";

type DatasetHealthPanelProps = {
  summary: DatasetQualitySummary;
};

export function DatasetHealthPanel({ summary }: DatasetHealthPanelProps) {
  return (
    <section className="dataset-health" aria-label="Dataset health">
      <div className="dataset-health__header">
        <div>
          <p className="section-kicker">Dataset operations</p>
          <h2>Local dataset health</h2>
        </div>
        <p>
          Snapshot and audit metrics are computed from the same scored registry
          used by the dashboard.
        </p>
      </div>

      <div className="dataset-health__grid">
        <HealthMetric label="Total Records" value={summary.total_records} />
        <HealthMetric
          label="Seed / Intake"
          value={`${summary.seed_records} / ${summary.intake_records}`}
        />
        <HealthMetric
          label="Data Quality"
          value={summary.data_quality_score.toFixed(1)}
        />
        <HealthMetric
          label="Validation Coverage"
          value={summary.validation_coverage_score.toFixed(1)}
        />
        <HealthMetric
          label="Evidence Completeness"
          value={summary.evidence_completeness_score.toFixed(1)}
        />
        <HealthMetric
          label="Relationship Completeness"
          value={summary.relationship_completeness_score.toFixed(1)}
        />
        <HealthMetric
          label="Needs Validation"
          value={summary.records_needing_validation.length}
        />
        <HealthMetric
          label="Strongest Under-Validated"
          value={summary.strongest_under_validated_opportunity}
        />
      </div>
    </section>
  );
}

function HealthMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="health-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
