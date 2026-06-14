import type { ConstraintIntelligenceObject } from "@/types/constraint";

export const healthcareConstraints: ConstraintIntelligenceObject[] = [
  {
    id: "hc-admin-001",
    industry: "Healthcare",
    subsector: "Revenue Cycle",
    title: "Prior authorization rework loops",
    category: "Administrative Delay",
    description:
      "Clinics repeat documentation, payer portal checks, calls, and status follow-ups before treatment can proceed.",
    evidence: [
      "Repeated payer-specific forms",
      "Manual status calls after portal submission",
      "Treatment scheduling delayed while approvals are pending"
    ],
    affected_parties: ["Patients", "Providers", "Billing teams", "Payers"],
    current_process: [
      "Staff collect clinical notes",
      "Authorization is submitted through payer-specific portals",
      "Teams check status manually until approval or denial"
    ],
    resource_waste: ["Staff time", "Delayed appointments", "Duplicate data entry"],
    time_waste: 9,
    capital_waste: 6,
    labor_waste: 9,
    opportunity_cost:
      "Clinical capacity sits idle while staff spend time proving eligibility and medical necessity.",
    estimated_annual_impact: "High across specialty practices and imaging centers",
    growth_trend: "Increasing",
    visibility_score: 7,
    overlooked_score: 8,
    digital_solution_potential: 8,
    automation_potential: 8,
    ai_potential: 7,
    implementation_complexity: 6,
    regulatory_complexity: 7,
    adoption_complexity: 6,
    confidence: 9,
    sources: ["CMS administrative simplification guidance", "AMA prior authorization surveys"]
  },
  {
    id: "hc-admin-002",
    industry: "Healthcare",
    subsector: "Patient Access",
    title: "Insurance eligibility verification before each visit",
    category: "Manual Verification",
    description:
      "Front desk teams repeatedly verify coverage, copays, deductibles, and plan changes using payer portals and calls.",
    evidence: [
      "Eligibility checks occur even for returning patients",
      "Coverage can change between booking and visit",
      "Portal data often needs staff interpretation"
    ],
    affected_parties: ["Patients", "Front desk staff", "Billing teams"],
    current_process: [
      "Staff open payer portals",
      "Coverage details are checked manually",
      "Information is copied into scheduling or billing systems"
    ],
    resource_waste: ["Manual lookup time", "Claim rejections", "Patient billing confusion"],
    time_waste: 7,
    capital_waste: 5,
    labor_waste: 8,
    opportunity_cost:
      "Administrative staff lose time that could be used for patient intake and scheduling throughput.",
    estimated_annual_impact: "Moderate to high in multi-payer outpatient settings",
    growth_trend: "Stable",
    visibility_score: 6,
    overlooked_score: 7,
    digital_solution_potential: 8,
    automation_potential: 8,
    ai_potential: 5,
    implementation_complexity: 5,
    regulatory_complexity: 5,
    adoption_complexity: 5,
    confidence: 8,
    sources: ["Healthcare Financial Management Association", "CAQH administrative index"]
  },
  {
    id: "hc-admin-003",
    industry: "Healthcare",
    subsector: "Claims",
    title: "Claim denial triage and resubmission",
    category: "Revenue Leakage",
    description:
      "Denied claims are reviewed, corrected, appealed, and resubmitted through fragmented workflows.",
    evidence: [
      "Denial codes require manual interpretation",
      "Missing documentation is gathered after the fact",
      "Resubmission deadlines create avoidable write-offs"
    ],
    affected_parties: ["Billing teams", "Providers", "Patients", "Payers"],
    current_process: [
      "Denials arrive in batches",
      "Staff sort by payer and denial reason",
      "Corrections or appeals are filed manually"
    ],
    resource_waste: ["Rework", "Delayed cash collection", "Avoidable write-offs"],
    time_waste: 8,
    capital_waste: 9,
    labor_waste: 8,
    opportunity_cost:
      "Revenue is delayed or lost while teams spend labor on preventable correction cycles.",
    estimated_annual_impact: "High for hospitals, physician groups, and ambulatory networks",
    growth_trend: "Increasing",
    visibility_score: 8,
    overlooked_score: 6,
    digital_solution_potential: 8,
    automation_potential: 7,
    ai_potential: 8,
    implementation_complexity: 6,
    regulatory_complexity: 6,
    adoption_complexity: 6,
    confidence: 9,
    sources: ["MGMA revenue cycle benchmarks", "HFMA denial management resources"]
  },
  {
    id: "hc-admin-004",
    industry: "Healthcare",
    subsector: "Scheduling",
    title: "Referral leakage from manual handoffs",
    category: "Information Gap",
    description:
      "Specialty referrals are delayed or lost when faxed forms, call queues, and incomplete records interrupt the handoff.",
    evidence: [
      "Referrals depend on fax or phone follow-up",
      "Missing records delay appointment creation",
      "Patients often become the coordination layer"
    ],
    affected_parties: ["Patients", "Primary care teams", "Specialists", "Schedulers"],
    current_process: [
      "Primary care sends referral packet",
      "Specialist office reviews documents",
      "Scheduler contacts patient after eligibility and records checks"
    ],
    resource_waste: ["Lost referrals", "Duplicate outreach", "Idle specialist slots"],
    time_waste: 8,
    capital_waste: 7,
    labor_waste: 7,
    opportunity_cost:
      "Care is delayed and specialist capacity may go unused because handoffs lack reliable status visibility.",
    estimated_annual_impact: "High in specialty networks with heavy referral volume",
    growth_trend: "Stable",
    visibility_score: 5,
    overlooked_score: 8,
    digital_solution_potential: 8,
    automation_potential: 6,
    ai_potential: 6,
    implementation_complexity: 6,
    regulatory_complexity: 5,
    adoption_complexity: 7,
    confidence: 8,
    sources: ["ONC interoperability resources", "Medical Group Management Association"]
  },
  {
    id: "hc-admin-005",
    industry: "Healthcare",
    subsector: "Care Coordination",
    title: "Post-discharge follow-up gaps",
    category: "Process Handoff",
    description:
      "Hospitals and clinics struggle to confirm whether patients complete follow-up steps after discharge.",
    evidence: [
      "Discharge instructions are not always closed-loop",
      "Primary care follow-up may be scheduled separately",
      "Medication and home care coordination require repeated calls"
    ],
    affected_parties: ["Patients", "Care coordinators", "Primary care teams", "Hospitals"],
    current_process: [
      "Discharge instructions are generated",
      "Care teams call patients manually",
      "Follow-up completion is tracked unevenly"
    ],
    resource_waste: ["Readmission risk", "Care manager time", "Missed follow-up appointments"],
    time_waste: 7,
    capital_waste: 8,
    labor_waste: 7,
    opportunity_cost:
      "Preventable escalations can occur when handoffs are not verified early.",
    estimated_annual_impact: "High for hospitals with complex discharge populations",
    growth_trend: "Increasing",
    visibility_score: 6,
    overlooked_score: 7,
    digital_solution_potential: 7,
    automation_potential: 6,
    ai_potential: 7,
    implementation_complexity: 6,
    regulatory_complexity: 6,
    adoption_complexity: 6,
    confidence: 8,
    sources: ["AHRQ care transitions resources", "CMS readmissions reduction program"]
  },
  {
    id: "hc-admin-006",
    industry: "Healthcare",
    subsector: "Credentialing",
    title: "Provider credentialing packet duplication",
    category: "Duplicated Work",
    description:
      "Provider credentialing teams repeatedly collect the same licenses, attestations, insurance documents, and work history.",
    evidence: [
      "Multiple payers request similar credentialing materials",
      "Manual expiration tracking creates renewal work",
      "Provider onboarding waits on document completion"
    ],
    affected_parties: ["Providers", "Credentialing teams", "Payers", "Provider groups"],
    current_process: [
      "Credentialing packet is assembled",
      "Documents are submitted payer by payer",
      "Renewal dates are tracked manually or semi-manually"
    ],
    resource_waste: ["Duplicate document collection", "Delayed provider enrollment", "Staff follow-up"],
    time_waste: 8,
    capital_waste: 6,
    labor_waste: 8,
    opportunity_cost:
      "Providers may be unable to bill or see covered patients while enrollment work repeats across payers.",
    estimated_annual_impact: "Moderate to high for growing provider groups",
    growth_trend: "Stable",
    visibility_score: 5,
    overlooked_score: 8,
    digital_solution_potential: 8,
    automation_potential: 7,
    ai_potential: 5,
    implementation_complexity: 5,
    regulatory_complexity: 7,
    adoption_complexity: 6,
    confidence: 8,
    sources: ["CAQH provider data resources", "NCQA credentialing standards"]
  },
  {
    id: "hc-admin-007",
    industry: "Healthcare",
    subsector: "Pharmacy Administration",
    title: "Medication prior authorization exceptions",
    category: "Administrative Delay",
    description:
      "Medication approvals require payer-specific exception forms, clinical justification, and back-and-forth between pharmacy and prescriber.",
    evidence: [
      "Patients wait while exceptions are reviewed",
      "Pharmacies contact prescribers for alternatives",
      "Staff repeat similar justification language"
    ],
    affected_parties: ["Patients", "Prescribers", "Pharmacies", "Payers"],
    current_process: [
      "Prescription is rejected or flagged",
      "Pharmacy contacts prescriber",
      "Clinical documentation is submitted for payer review"
    ],
    resource_waste: ["Prescription delays", "Staff messages", "Therapy abandonment risk"],
    time_waste: 8,
    capital_waste: 5,
    labor_waste: 7,
    opportunity_cost:
      "Patients may delay or abandon therapy while staff coordinate exception approval.",
    estimated_annual_impact: "High in chronic disease and specialty medication workflows",
    growth_trend: "Increasing",
    visibility_score: 7,
    overlooked_score: 7,
    digital_solution_potential: 7,
    automation_potential: 7,
    ai_potential: 7,
    implementation_complexity: 6,
    regulatory_complexity: 7,
    adoption_complexity: 6,
    confidence: 8,
    sources: ["AMA prior authorization research", "NCPDP electronic prior authorization resources"]
  },
  {
    id: "hc-admin-008",
    industry: "Healthcare",
    subsector: "Medical Records",
    title: "Release of information request backlog",
    category: "Compliance Drag",
    description:
      "Records teams process patient, legal, insurer, and provider requests with identity checks and format-specific delivery requirements.",
    evidence: [
      "Requests arrive through multiple channels",
      "Identity and authorization checks remain manual",
      "Records must be redacted, packaged, or transmitted securely"
    ],
    affected_parties: ["Patients", "Records teams", "Legal teams", "External providers"],
    current_process: [
      "Request is received and validated",
      "Relevant records are located",
      "Staff prepare and transmit records"
    ],
    resource_waste: ["Backlog management", "Manual validation", "Repeated status requests"],
    time_waste: 7,
    capital_waste: 5,
    labor_waste: 8,
    opportunity_cost:
      "Administrative queues delay downstream care, claims, legal review, or patient access.",
    estimated_annual_impact: "Moderate in hospitals and large clinics",
    growth_trend: "Stable",
    visibility_score: 5,
    overlooked_score: 8,
    digital_solution_potential: 7,
    automation_potential: 6,
    ai_potential: 6,
    implementation_complexity: 6,
    regulatory_complexity: 8,
    adoption_complexity: 5,
    confidence: 7,
    sources: ["HHS HIPAA right of access guidance", "AHIMA release of information resources"]
  },
  {
    id: "hc-admin-009",
    industry: "Healthcare",
    subsector: "Call Center",
    title: "Appointment call queue overflow",
    category: "Idle Capacity",
    description:
      "Patients call for scheduling, rescheduling, price questions, portal help, and follow-up instructions that could be routed more precisely.",
    evidence: [
      "High inbound volume mixes urgent and routine needs",
      "Schedulers answer repeated availability questions",
      "Missed calls become abandoned demand"
    ],
    affected_parties: ["Patients", "Schedulers", "Clinic managers"],
    current_process: [
      "Patient calls central or local scheduling line",
      "Staff identify request type",
      "Caller is scheduled, transferred, or asked to wait"
    ],
    resource_waste: ["Hold time", "Abandoned calls", "Underused appointment slots"],
    time_waste: 7,
    capital_waste: 6,
    labor_waste: 7,
    opportunity_cost:
      "Demand is delayed or lost while appointment capacity is unevenly exposed to patients.",
    estimated_annual_impact: "Moderate to high in multi-location outpatient networks",
    growth_trend: "Increasing",
    visibility_score: 6,
    overlooked_score: 7,
    digital_solution_potential: 8,
    automation_potential: 7,
    ai_potential: 7,
    implementation_complexity: 5,
    regulatory_complexity: 4,
    adoption_complexity: 6,
    confidence: 7,
    sources: ["MGMA access benchmarks", "Patient access operations case studies"]
  },
  {
    id: "hc-admin-010",
    industry: "Healthcare",
    subsector: "Quality Reporting",
    title: "Manual quality measure abstraction",
    category: "Compliance Drag",
    description:
      "Teams extract, validate, and submit quality reporting data from clinical notes, registries, and EHR fields.",
    evidence: [
      "Measure definitions change over time",
      "Structured fields may not capture the required context",
      "Manual chart review fills reporting gaps"
    ],
    affected_parties: ["Quality teams", "Clinicians", "Administrators", "Regulators"],
    current_process: [
      "Reports identify missing measure data",
      "Staff review charts",
      "Results are corrected and submitted"
    ],
    resource_waste: ["Chart review labor", "Reporting corrections", "Clinician follow-up"],
    time_waste: 8,
    capital_waste: 6,
    labor_waste: 8,
    opportunity_cost:
      "Quality teams spend time proving performance instead of improving workflows that drive performance.",
    estimated_annual_impact: "High for hospitals and value-based care groups",
    growth_trend: "Increasing",
    visibility_score: 7,
    overlooked_score: 7,
    digital_solution_potential: 7,
    automation_potential: 6,
    ai_potential: 8,
    implementation_complexity: 7,
    regulatory_complexity: 8,
    adoption_complexity: 6,
    confidence: 8,
    sources: ["CMS quality reporting programs", "NCQA HEDIS resources"]
  },
  {
    id: "hc-admin-011",
    industry: "Healthcare",
    subsector: "Patient Billing",
    title: "Patient statement confusion and support calls",
    category: "Hidden Cost",
    description:
      "Patients receive statements that are hard to connect to insurance explanations, visit details, and payment options.",
    evidence: [
      "Patients call to clarify balances",
      "Insurance adjustments are difficult to interpret",
      "Multiple statements can arrive for one episode of care"
    ],
    affected_parties: ["Patients", "Billing support teams", "Providers"],
    current_process: [
      "Claim is adjudicated",
      "Patient balance is generated",
      "Support staff explain charges after statements go out"
    ],
    resource_waste: ["Support call volume", "Delayed collections", "Patient frustration"],
    time_waste: 6,
    capital_waste: 7,
    labor_waste: 7,
    opportunity_cost:
      "Confusing bills delay payment and consume staff time that could be spent resolving higher-risk accounts.",
    estimated_annual_impact: "Moderate across outpatient and hospital billing operations",
    growth_trend: "Stable",
    visibility_score: 6,
    overlooked_score: 7,
    digital_solution_potential: 7,
    automation_potential: 6,
    ai_potential: 6,
    implementation_complexity: 5,
    regulatory_complexity: 5,
    adoption_complexity: 5,
    confidence: 7,
    sources: ["Consumer Financial Protection Bureau medical billing research", "HFMA patient financial communications"]
  },
  {
    id: "hc-admin-012",
    industry: "Healthcare",
    subsector: "Supply Administration",
    title: "Preference card mismatch in procedural supply planning",
    category: "Market Mismatch",
    description:
      "Procedure supply lists drift from actual usage, causing over-picking, missing items, returns, and rushed substitutions.",
    evidence: [
      "Preference cards are updated inconsistently",
      "Actual usage varies by clinician and site",
      "Unused supplies are returned or wasted after setup"
    ],
    affected_parties: ["Operating room teams", "Supply chain teams", "Clinicians", "Patients"],
    current_process: [
      "Supplies are picked from preference cards",
      "Teams adjust during the procedure",
      "Returns and substitutions are reconciled after the fact"
    ],
    resource_waste: ["Unused supplies", "Case delays", "Inventory mismatch"],
    time_waste: 6,
    capital_waste: 8,
    labor_waste: 6,
    opportunity_cost:
      "Capital is tied up in excess inventory while procedural teams still face shortage risk.",
    estimated_annual_impact: "High in procedural departments and surgical centers",
    growth_trend: "Stable",
    visibility_score: 5,
    overlooked_score: 8,
    digital_solution_potential: 7,
    automation_potential: 6,
    ai_potential: 7,
    implementation_complexity: 6,
    regulatory_complexity: 4,
    adoption_complexity: 7,
    confidence: 7,
    sources: ["AHRMM supply chain resources", "Healthcare supply chain operations reports"]
  }
];
