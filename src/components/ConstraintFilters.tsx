import type {
  ConstraintArchetypeId,
  ConstraintCategory,
  ConstraintIndustry,
  OpportunityType,
  RecordOrigin,
  SortOption
} from "@/types/constraint";
import type { DecisionFilter } from "@/lib/constraints";

type ConstraintFiltersProps = {
  archetype: ConstraintArchetypeId | "All";
  archetypes: ConstraintArchetypeId[];
  categories: ConstraintCategory[];
  category: ConstraintCategory | "All";
  industries: ConstraintIndustry[];
  industry: ConstraintIndustry | "All";
  opportunityTypes: OpportunityType[];
  opportunityType: OpportunityType | "All";
  decisionFilter: DecisionFilter;
  origin: RecordOrigin | "All";
  resultCount: number;
  sortBy: SortOption;
  onArchetypeChange: (archetype: ConstraintArchetypeId | "All") => void;
  onCategoryChange: (category: ConstraintCategory | "All") => void;
  onIndustryChange: (industry: ConstraintIndustry | "All") => void;
  onOpportunityTypeChange: (opportunityType: OpportunityType | "All") => void;
  onDecisionFilterChange: (decisionFilter: DecisionFilter) => void;
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
  total_strategic_score: "Strategic score",
  archetype_spread_score: "Archetype spread",
  cross_industry_similarity_score: "Cross-industry similarity"
};

export function ConstraintFilters({
  archetype,
  archetypes,
  categories,
  category,
  industries,
  industry,
  opportunityTypes,
  opportunityType,
  decisionFilter,
  origin,
  resultCount,
  sortBy,
  onArchetypeChange,
  onCategoryChange,
  onIndustryChange,
  onOpportunityTypeChange,
  onDecisionFilterChange,
  onOriginChange,
  onSortChange
}: ConstraintFiltersProps) {
  return (
    <div className="toolbar">
      <div className="control-row">
        <div className="control-group">
          <label htmlFor="industry">Industry</label>
          <select
            id="industry"
            onChange={(event) =>
              onIndustryChange(event.target.value as ConstraintIndustry | "All")
            }
            value={industry}
          >
            <option value="All">All industries</option>
            {industries.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

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
          <label htmlFor="archetype">Archetype</label>
          <select
            id="archetype"
            onChange={(event) =>
              onArchetypeChange(event.target.value as ConstraintArchetypeId | "All")
            }
            value={archetype}
          >
            <option value="All">All archetypes</option>
            {archetypes.map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ")}
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
          <label htmlFor="decision-filter">Decision filter</label>
          <select
            id="decision-filter"
            onChange={(event) =>
              onDecisionFilterChange(event.target.value as DecisionFilter)
            }
            value={decisionFilter}
          >
            <option value="All">All candidates</option>
            <option value="AI-solvable">AI-solvable</option>
            <option value="Low-complexity / high-impact">
              Low-complexity / high-impact
            </option>
            <option value="Under-validated">Under-validated</option>
            <option value="Under-measured">Under-measured</option>
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
