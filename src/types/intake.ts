import type {
  ConstraintArchetypeId,
  ConstraintCategory,
  ConstraintIndustry,
  EvidenceStrength,
  GrowthTrend,
  OpportunityType,
  SourceType,
  ValidationStatus
} from "@/types/constraint";

export type ConstraintIntakeSource = {
  title: string;
  publisher: string;
  source_type: SourceType;
  url?: string;
  accessed?: string;
};

export type ConstraintIntakeRecord = {
  id: string;
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
  sources: ConstraintIntakeSource[];
};

export type ConstraintIntakeFile = {
  contract_version: "1.0";
  records: ConstraintIntakeRecord[];
};
