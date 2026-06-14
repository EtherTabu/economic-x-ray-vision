import type {
  ConstraintCategory,
  RecordOrigin,
  SortOption
} from "@/types/constraint";

type ConstraintFiltersProps = {
  categories: ConstraintCategory[];
  category: ConstraintCategory | "All";
  origin: RecordOrigin | "All";
  resultCount: number;
  sortBy: SortOption;
  onCategoryChange: (category: ConstraintCategory | "All") => void;
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
  validation_confidence_score: "Validation confidence"
};

export function ConstraintFilters({
  categories,
  category,
  origin,
  resultCount,
  sortBy,
  onCategoryChange,
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
