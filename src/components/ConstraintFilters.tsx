import type {
  ConstraintCategory,
  OpportunityType,
  RecordOrigin,
  SortOption
} from "@/types/constraint";

type ConstraintFiltersProps = {
  categories: ConstraintCategory[];
  category: ConstraintCategory | "All";
  opportunityTypes: OpportunityType[];
  opportunityType: OpportunityType | "All";
  origin: RecordOrigin | "All";
  resultCount: number;
  sortBy: SortOption;
  onCategoryChange: (category: ConstraintCategory | "All") => void;
  onOpportunityTypeChange: (opportunityType: OpportunityType | "All") => void;
  onOriginChange: (origin: RecordOrigin | "All") => void;
  onSortChange: (sortBy: SortOption) => void;
};

const sortLabels: Record<SortOption, string> = {
  total_priority_score: "Priority score",
  severity_score: "Severity score",
  solvability_score: "Solvability score",
  ai_readiness_score: "AI readiness",
  overlooked_opportunity_score: "Overlooked opportunity",
  evidence_score: "Evidence strength",
  measurability_score: "Measurability",
  validation_confidence_score: "Validation confidence",
  constraint_density_score: "Constraint density",
  downstream_impact_score: "Downstream impact",
  opportunity_score: "Opportunity score",
  total_strategic_score: "Strategic score"
};

export function ConstraintFilters({
  categories,
  category,
  opportunityTypes,
  opportunityType,
  origin,
  resultCount,
  sortBy,
  onCategoryChange,
  onOpportunityTypeChange,
  onOriginChange,
  onSortChange
}: ConstraintFiltersProps) {
  return (
    <div className="toolbar">
      <div className="control-row">
        <div className="control-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            onChange={(event) =>
              onCategoryChange(event.target.value as ConstraintCategory | "All")
            }
            value={category}
          >
            <option value="All">All categories</option>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="opportunity-type">Opportunity type</label>
          <select
            id="opportunity-type"
            onChange={(event) =>
              onOpportunityTypeChange(event.target.value as OpportunityType | "All")
            }
            value={opportunityType}
          >
            <option value="All">All opportunity types</option>
            {opportunityTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="origin">Origin</label>
          <select
            id="origin"
            onChange={(event) =>
              onOriginChange(event.target.value as RecordOrigin | "All")
            }
            value={origin}
          >
            <option value="All">All records</option>
            <option value="seed">Seed records</option>
            <option value="intake">Intake records</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="sort">Sort by</label>
          <select
            id="sort"
            onChange={(event) => onSortChange(event.target.value as SortOption)}
            value={sortBy}
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="results-count">{resultCount} visible objects</div>
    </div>
  );
}
