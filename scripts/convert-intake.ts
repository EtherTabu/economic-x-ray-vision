type ConvertIntakeSource = {
  title: string;
};

type ConvertIntakeRecord = {
  id: string;
  industry: string;
  subsector: string;
  title: string;
  category: string;
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
  growth_trend: string;
  visibility_score: number;
  overlooked_score: number;
  digital_solution_potential: number;
  automation_potential: number;
  ai_potential: number;
  implementation_complexity: number;
  regulatory_complexity: number;
  adoption_complexity: number;
  confidence: number;
  evidence_strength: string;
  source_type: string;
  validation_status: string;
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
  opportunity_type: string;
  primary_archetype: string;
  secondary_archetypes: string[];
  archetype_confidence: number;
  archetype_reasoning: string;
  sources: ConvertIntakeSource[];
};

type ConvertIntakeFile = {
  contract_version: "1.0";
  records: ConvertIntakeRecord[];
};

function convertIntakeRecord(record: ConvertIntakeRecord) {
  return {
    id: record.id,
    origin: "intake",
    industry: record.industry,
    subsector: record.subsector,
    title: record.title,
    category: record.category,
    description: record.description,
    evidence: record.evidence,
    affected_parties: record.affected_parties,
    current_process: record.current_process,
    resource_waste: record.resource_waste,
    time_waste: record.time_waste,
    capital_waste: record.capital_waste,
    labor_waste: record.labor_waste,
    opportunity_cost: record.opportunity_cost,
    estimated_annual_impact: record.estimated_annual_impact,
    growth_trend: record.growth_trend,
    visibility_score: record.visibility_score,
    overlooked_score: record.overlooked_score,
    digital_solution_potential: record.digital_solution_potential,
    automation_potential: record.automation_potential,
    ai_potential: record.ai_potential,
    implementation_complexity: record.implementation_complexity,
    regulatory_complexity: record.regulatory_complexity,
    adoption_complexity: record.adoption_complexity,
    confidence: record.confidence,
    sources: record.sources.map((source) => source.title),
    evidence_strength: record.evidence_strength,
    source_type: record.source_type,
    validation_status: record.validation_status,
    source_quality: record.source_quality,
    measurement_difficulty: record.measurement_difficulty,
    data_availability: record.data_availability,
    confidence_reasoning: record.confidence_reasoning,
    validation_notes: record.validation_notes,
    evidence_gaps: record.evidence_gaps,
    upstream_constraints: record.upstream_constraints,
    downstream_constraints: record.downstream_constraints,
    related_processes: record.related_processes,
    affected_systems: record.affected_systems,
    solution_hypotheses: record.solution_hypotheses,
    opportunity_type: record.opportunity_type,
    primary_archetype: record.primary_archetype,
    secondary_archetypes: record.secondary_archetypes,
    archetype_confidence: record.archetype_confidence,
    archetype_reasoning: record.archetype_reasoning
  };
}

function convertIntakeFile(intakeFile: ConvertIntakeFile) {
  return intakeFile.records.map(convertIntakeRecord);
}

module.exports = {
  convertIntakeFile,
  convertIntakeRecord
};
