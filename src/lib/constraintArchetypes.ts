import type { ConstraintArchetypeId, ConstraintIndustry } from "@/types/constraint";

export type ConstraintArchetype = {
  archetype_id: ConstraintArchetypeId;
  display_name: string;
  plain_english_definition: string;
  common_industries: ConstraintIndustry[];
  common_signals: string[];
  common_evidence_needed: string[];
  common_interventions: string[];
  validation_risks: string[];
  example_constraints: string[];
};

const broadIndustries: ConstraintIndustry[] = [
  "Healthcare",
  "Energy / Grid / Interconnection",
  "Infrastructure / Permitting / Construction",
  "Semiconductors / Advanced Manufacturing",
  "Metals / Mining / Critical Inputs",
  "Logistics / Supply Chain / Industrial Equipment",
  "Public-Sector Administration / Compliance"
];

export const constraintArchetypes: ConstraintArchetype[] = [
  archetype("queue_backlog", "Queue backlog", "Demand waits in a review, service, or approval queue faster than the system can clear it.", broadIndustries, ["Aging work items", "Escalations", "Repeated status checks"], ["Queue age by step", "Arrival and completion rates", "Backlog by owner"], ["Queue triage", "Capacity smoothing", "Measurement instrumentation"], ["Backlog may be temporary", "Queue age may hide priority differences"], ["Prior authorization rework loops", "Grid interconnection queue delay"]),
  archetype("manual_verification_drag", "Manual verification drag", "People repeatedly check facts, eligibility, compliance, or completeness because systems do not resolve trust automatically.", broadIndustries, ["Portal checking", "Spreadsheet reconciliation", "Human sign-off loops"], ["Manual touch counts", "Exception rates", "Verification cycle time"], ["Data integration", "Automation assist", "Standardized checklists"], ["Manual work may be policy-required", "Verification effort can be misclassified"], ["Insurance eligibility verification", "Procurement vendor onboarding delay"]),
  archetype("documentation_chase", "Documentation chase", "Work stalls while teams assemble, correct, resubmit, or reformat evidence packages.", broadIndustries, ["Missing attachments", "Resubmissions", "Reviewer clarification requests"], ["Missing document logs", "Resubmission frequency", "Review comments"], ["Document standardization", "Pre-submission validation", "Workflow redesign"], ["Documentation may be a symptom of unclear policy", "Local templates may not generalize"], ["Medical necessity documentation chase", "Environmental review documentation chase"]),
  archetype("handoff_leakage", "Handoff leakage", "Value is lost when responsibility moves between teams, systems, vendors, or agencies.", broadIndustries, ["Dropped referrals", "Unowned tasks", "Repeated re-routing"], ["Handoff logs", "Lost work item counts", "Owner transition timestamps"], ["Workflow redesign", "Shared queues", "Accountability rules"], ["Leakage can be hidden by informal recovery work"], ["Referral leakage from manual handoffs", "Utility upgrade review backlog"]),
  archetype("duplicated_work", "Duplicated work", "Multiple teams perform the same collection, review, entry, or verification step.", broadIndustries, ["Re-entry", "Duplicate forms", "Parallel reviews"], ["Field duplication audit", "Staff time samples", "System-of-record mapping"], ["Standardization", "Data integration", "Policy simplification"], ["Duplicate work may support separate compliance needs"], ["Provider credentialing packet duplication", "Compliance reporting duplication"]),
  archetype("data_fragmentation", "Data fragmentation", "Useful information exists, but it is split across systems, formats, owners, or jurisdictions.", broadIndustries, ["Mismatched identifiers", "Manual joins", "Incomplete system views"], ["System inventory", "Record match rates", "Exception logs"], ["Data integration", "Master data cleanup", "Measurement instrumentation"], ["Integration feasibility may be overstated"], ["Patient statement confusion", "Port/rail movement bottleneck"]),
  archetype("idle_capacity", "Idle capacity", "Useful capacity exists but cannot be matched to demand at the right time, place, or ruleset.", broadIndustries, ["Unused slots", "Late cancellations", "Underloaded assets"], ["Utilization logs", "Demand forecasts", "No-show or cancellation data"], ["Queue triage", "Marketplace matching", "Capacity optimization"], ["Reported capacity may not be truly available"], ["Appointment call queue overflow", "Advanced packaging capacity bottleneck"]),
  archetype("capacity_mismatch", "Capacity mismatch", "Demand and available processing, labor, equipment, or infrastructure capacity are misaligned.", broadIndustries, ["Peak overloads", "Constraint step saturation", "Workaround demand"], ["Capacity by step", "Demand variance", "Bottleneck utilization"], ["Capacity smoothing", "Staffing capacity", "Workflow redesign"], ["Average capacity can hide peak constraints"], ["Post-discharge follow-up gaps", "Refining capacity bottleneck"]),
  archetype("equipment_lead_time", "Equipment lead time", "Critical work is delayed by long-cycle equipment, tools, parts, or replacement assets.", ["Energy / Grid / Interconnection", "Semiconductors / Advanced Manufacturing", "Logistics / Supply Chain / Industrial Equipment", "Metals / Mining / Critical Inputs"], ["Long procurement lead times", "Queued installation", "Dependency on scarce parts"], ["Lead-time history", "Supplier quotes", "Install readiness"], ["Supplier diversification", "Pre-order triggers", "Inventory strategy"], ["Lead time anecdotes can be stale", "Procurement records may omit substitutes"], ["Transformer lead-time bottleneck", "Chip equipment lead-time coordination"]),
  archetype("permitting_delay", "Permitting delay", "Projects wait for permit review, completeness checks, public-process milestones, or agency decisions.", ["Energy / Grid / Interconnection", "Infrastructure / Permitting / Construction", "Metals / Mining / Critical Inputs", "Public-Sector Administration / Compliance"], ["Permit aging", "Completeness letters", "Sequential agency reviews"], ["Permit timestamps", "Review step ownership", "Completeness defect data"], ["Permit pre-checks", "Parallel review", "Documentation redesign"], ["Delay may reflect project quality issues", "Public-process requirements can be irreducible"], ["Construction permit review delay", "Copper mine permitting delay"]),
  archetype("regulatory_complexity", "Regulatory complexity", "Rules, compliance interpretations, or overlapping authorities create avoidable drag.", broadIndustries, ["Ambiguous requirements", "Multiple regulators", "Policy interpretation loops"], ["Requirement map", "Review comments", "Escalation history"], ["Policy simplification", "Guidance templates", "Compliance workflow redesign"], ["Complexity may be necessary risk control"], ["Manual quality measure abstraction", "Compliance reporting duplication"]),
  archetype("inspection_delay", "Inspection delay", "Progress waits for scarce inspection appointments, field verification, or compliance sign-off.", ["Infrastructure / Permitting / Construction", "Energy / Grid / Interconnection", "Public-Sector Administration / Compliance", "Metals / Mining / Critical Inputs"], ["Inspection appointment backlog", "Failed first inspections", "Reinspection loops"], ["Inspection wait times", "Pass/fail data", "Inspector capacity"], ["Scheduling triage", "Pre-inspection checklists", "Remote evidence capture"], ["Inspection delay may reflect poor readiness"], ["Inspection scheduling bottleneck", "Transmission permitting documentation drag"]),
  archetype("vendor_qualification", "Vendor qualification", "Work stalls while suppliers, contractors, providers, or counterparties are reviewed and approved.", broadIndustries, ["Onboarding queues", "Repeated credential packets", "Approved-vendor gaps"], ["Qualification cycle time", "Missing packet fields", "Approved supplier counts"], ["Standardized packets", "Risk-tiered review", "Data reuse"], ["Qualification exists to manage real risk"], ["Provider credentialing packet duplication", "Contractor qualification friction"]),
  archetype("workforce_constraint", "Workforce constraint", "A scarce skill, reviewer group, crew, or specialist role becomes the binding constraint.", broadIndustries, ["Specialist backlog", "Overtime", "Limited reviewer capacity"], ["Role-level capacity", "Vacancy data", "Work item assignment"], ["Staffing capacity", "Work redesign", "Automation assist"], ["Headcount may not be the root cause"], ["Post-discharge follow-up gaps", "Yield learning cycle delay"]),
  archetype("infrastructure_siting", "Infrastructure siting", "Physical location, land, right-of-way, utility access, or community constraints slow deployment.", ["Energy / Grid / Interconnection", "Infrastructure / Permitting / Construction", "Metals / Mining / Critical Inputs", "Logistics / Supply Chain / Industrial Equipment"], ["Site readiness gaps", "Right-of-way issues", "Utility access limits"], ["Site due diligence", "Right-of-way status", "Utility readiness"], ["Early siting screen", "Stakeholder sequencing", "Parallel readiness tracking"], ["Siting concerns may be substantive"], ["Semiconductor fab utility readiness", "Transmission permitting documentation drag"]),
  archetype("interconnection_delay", "Interconnection delay", "Projects wait to connect to shared infrastructure, network capacity, or system operators.", ["Energy / Grid / Interconnection", "Infrastructure / Permitting / Construction", "Semiconductors / Advanced Manufacturing"], ["Study queues", "Upgrade requirements", "Connection dependency"], ["Interconnection milestones", "Upgrade scope", "Queue withdrawal history"], ["Study triage", "Readiness scoring", "Upgrade coordination"], ["Queue data may not reveal project viability"], ["Grid interconnection queue delay", "Utility upgrade review backlog"]),
  archetype("project_approval_friction", "Project approval friction", "Capital, governance, or multi-party approvals delay otherwise viable work.", broadIndustries, ["Sequential committees", "Capital gates", "Delayed authorization"], ["Approval timestamps", "Decision criteria", "Resubmission notes"], ["Decision templates", "Parallel approval routing", "Risk-tiered governance"], ["Approvals may uncover real project flaws"], ["Gold project approval/capital sequencing friction", "Public infrastructure grant review backlog"]),
  archetype("supply_concentration", "Supply concentration", "A narrow supplier, byproduct, geography, or input source creates hidden fragility.", ["Metals / Mining / Critical Inputs", "Semiconductors / Advanced Manufacturing", "Energy / Grid / Interconnection", "Logistics / Supply Chain / Industrial Equipment"], ["Few qualified suppliers", "Byproduct dependence", "Long substitution cycles"], ["Supplier count", "Input dependency map", "Substitution qualification data"], ["Supplier diversification", "Qualification pipeline", "Demand forecasting"], ["Concentration risk can be overstated without volume data"], ["Silver byproduct supply dependency", "Critical mineral processing qualification delay"]),
  archetype("processing_capacity", "Processing capacity", "A downstream physical or administrative processing step cannot keep up with upstream demand.", broadIndustries, ["Bottleneck utilization", "WIP accumulation", "Expedite requests"], ["Throughput by step", "Queue length", "Cycle time"], ["Capacity expansion", "Workflow redesign", "Queue triage"], ["The bottleneck can move after intervention"], ["Claim denial triage", "Refining/smelting capacity bottleneck"]),
  archetype("measurement_blind_spot", "Measurement blind spot", "A system cannot see the friction clearly enough to manage it before outcomes degrade.", broadIndustries, ["No baseline", "Untracked rework", "Anecdotal escalation"], ["New instrumentation", "Operational definitions", "Sampling plan"], ["Measurement instrumentation", "Evidence collection", "Dashboarding"], ["Measurement can create false precision"], ["Preference card mismatch", "Heavy equipment availability constraint"]),
  archetype("demand_forecast_mismatch", "Demand forecast mismatch", "Planning assumptions diverge from actual demand timing, location, mix, or complexity.", broadIndustries, ["Forecast misses", "Stockouts and excess", "Unexpected peak loads"], ["Forecast error", "Demand by segment", "Capacity plan variance"], ["Forecast review", "Scenario planning", "Capacity buffers"], ["Forecast errors can be external shocks"], ["Preference card mismatch", "Transformer lead-time bottleneck"]),
  archetype("hidden_cost_shift", "Hidden cost shift", "Costs are displaced to another party, process, budget, or time period rather than eliminated.", broadIndustries, ["Support calls", "Uncompensated labor", "Downstream rework"], ["Cost ownership map", "Rework logs", "Support volume"], ["Policy simplification", "Cost visibility", "Workflow redesign"], ["Costs may be hard to allocate cleanly"], ["Patient statement confusion", "Environmental review documentation chase"]),
  archetype("support_channel_overload", "Support channel overload", "Phone, email, help desk, counter, or casework channels absorb unresolved upstream friction.", broadIndustries, ["High call volume", "Repeated inquiries", "Status requests"], ["Contact reason data", "Handle time", "Repeat contact rate"], ["Self-service status", "Queue triage", "Root-cause fixes"], ["Support volume can reflect poor communication rather than core constraint"], ["Appointment call queue overflow", "Public infrastructure grant review backlog"])
];

export const archetypeById = Object.fromEntries(
  constraintArchetypes.map((archetypeItem) => [
    archetypeItem.archetype_id,
    archetypeItem
  ])
) as Record<ConstraintArchetypeId, ConstraintArchetype>;

function archetype(
  archetype_id: ConstraintArchetypeId,
  display_name: string,
  plain_english_definition: string,
  common_industries: ConstraintIndustry[],
  common_signals: string[],
  common_evidence_needed: string[],
  common_interventions: string[],
  validation_risks: string[],
  example_constraints: string[]
): ConstraintArchetype {
  return {
    archetype_id,
    display_name,
    plain_english_definition,
    common_industries,
    common_signals,
    common_evidence_needed,
    common_interventions,
    validation_risks,
    example_constraints
  };
}
