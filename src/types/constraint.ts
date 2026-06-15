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

export type EvidenceStrength = "Low" | "Moderate" | "High";

export type SourceType =
  | "Government"
  | "Industry Benchmark"
  | "Professional Association"
  | "Mixed Secondary"
  | "Operational Pattern";

export type ValidationStatus =
  | "Unverified"
  | "Plausible"
  | "Partially Validated"
  | "Validated";

export type RecordOrigin = "seed" | "intake";

export type ConstraintIndustry =
  | "Healthcare"
  | "Energy / Grid / Interconnection"
  | "Infrastructure / Permitting / Construction"
  | "Semiconductors / Advanced Manufacturing"
  | "Metals / Mining / Critical Inputs"
  | "Logistics / Supply Chain / Industrial Equipment"
  | "Public-Sector Administration / Compliance";

export type OpportunityType =
  | "Automation"
  | "Workflow Redesign"
  | "Data Quality"
  | "Capacity Optimization"
  | "Compliance Simplification";

export type ConstraintArchetypeId =
  | "queue_backlog"
  | "manual_verification_drag"
  | "documentation_chase"
  | "handoff_leakage"
  | "duplicated_work"
  | "data_fragmentation"
  | "idle_capacity"
  | "capacity_mismatch"
  | "equipment_lead_time"
  | "permitting_delay"
  | "regulatory_complexity"
  | "inspection_delay"
  | "vendor_qualification"
  | "workforce_constraint"
  | "infrastructure_siting"
  | "interconnection_delay"
  | "project_approval_friction"
  | "supply_concentration"
  | "processing_capacity"
  | "measurement_blind_spot"
  | "demand_forecast_mismatch"
  | "hidden_cost_shift"
  | "support_channel_overload";

export type ConstraintIntelligenceObject = {
  id: string;
  origin: RecordOrigin;
  industry: ConstraintIndustry;
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
  evidence_strength: EvidenceStrength;
  source_type: SourceType;
  validation_status: ValidationStatus;
  source_quality: number;
  measurement_difficulty: number;
  data_availability: number;
  confidence_reasoning: string;
  validation_notes: string[];
  evidence_gaps: string[];
  upstream_constraints: string[];
  downstream_constraints: string[];
  related_processes: string[];
  affected_systems: string[];
  solution_hypotheses: string[];
  opportunity_type: OpportunityType;
  primary_archetype: ConstraintArchetypeId;
  secondary_archetypes: ConstraintArchetypeId[];
  archetype_confidence: number;
  archetype_reasoning: string;
};

export type ConstraintScores = {
  severity_score: number;
  solvability_score: number;
  ai_readiness_score: number;
  overlooked_opportunity_score: number;
  evidence_score: number;
  measurability_score: number;
  validation_confidence_score: number;
  constraint_density_score: number;
  downstream_impact_score: number;
  opportunity_score: number;
  total_strategic_score: number;
  archetype_spread_score: number;
  cross_industry_similarity_score: number;
  total_priority_score: number;
};

export type ScoredConstraint = ConstraintIntelligenceObject & {
  scores: ConstraintScores;
};

export type SortOption = keyof ConstraintScores;
