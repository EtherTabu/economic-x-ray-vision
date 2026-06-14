export type ConstraintCategory =
  | "Administrative Delay"
  | "Manual Verification"
  | "Revenue Leakage"
  | "Information Gap"
  | "Process Handoff"
  | "Duplicated Work"
  | "Compliance Drag"
  | "Idle Capacity"
  | "Hidden Cost"
  | "Market Mismatch";

export type GrowthTrend = "Decreasing" | "Stable" | "Increasing";

export type ConstraintIntelligenceObject = {
  id: string;
  industry: "Healthcare";
  subsector: string;
  title: string;
  category: ConstraintCategory;
  description: string;
  evidence: string[];
  affected_parties: string[];
  current_process: string[];
  resource_waste: string[];
  time_waste: number;
  capital_waste: number;
  labor_waste: number;
  opportunity_cost: string;
  estimated_annual_impact: string;
  growth_trend: GrowthTrend;
  visibility_score: number;
  overlooked_score: number;
  digital_solution_potential: number;
  automation_potential: number;
  ai_potential: number;
  implementation_complexity: number;
  regulatory_complexity: number;
  adoption_complexity: number;
  confidence: number;
  sources: string[];
};

export type ConstraintScores = {
  severity_score: number;
  solvability_score: number;
  ai_readiness_score: number;
  overlooked_opportunity_score: number;
  total_priority_score: number;
};

export type ScoredConstraint = ConstraintIntelligenceObject & {
  scores: ConstraintScores;
};

export type SortOption = keyof ConstraintScores;
