# Constraint Capture Template

Use this guide when adding future constraint records or expansion packs.

The goal is to capture concrete operating constraints, not broad sector commentary. A good record should let a future analyst ask: what would I measure, where would I look, what artifact would prove or disprove this, and what intervention might be tested?

## Where Records Go

Use one of these paths:

- `data/intake/packs/*.json` for future structured intake packs.
- `src/data/strategicConstraintSeeds.ts` only for curated TypeScript seed packs that need code-level review.
- `data/intake/templates/constraint_capture_template.json` as a copy source only.

Do not put real records in `data/intake/templates/`. The build pipeline does not process template files.

## Required Capture Standard

Each record must include:

- Specific constraint mechanism: what waits, bounces, gets manually verified, gets misallocated, or fails to hand off.
- Affected workflow/system layer: queue, tracker, portal, repository, telemetry layer, commissioning plan, qualification workflow, or operating system.
- Industry/domain and subsector.
- Primary bottleneck archetype and secondary archetypes.
- Measurable validation metric or proxy.
- Evidence gap or artifact need.
- Plausible intervention path.
- Honest evidence status.

Default posture for unsourced frontier records:

- `evidence_strength`: `Low`
- `source_type`: `Operational Pattern`
- `validation_status`: `Unverified`
- `confidence`: usually `4` or `5`
- `sources`: `Structured hypothesis; local operational evidence required`

Do not claim `Validated` or `Partially Validated` from operational-pattern evidence alone.

## Validation Metrics And Proxies

Use measurable language in `validation_notes` and `evidence_gaps`.

Good examples:

- Cycle time from intake to release.
- Queue age by owner and blocker reason.
- Exception rate by workflow step.
- Rework count per record, lot, work order, or request.
- Asset idle time before commissioning, service, production, or release.
- Throughput lost to readiness, qualification, or scheduling constraints.
- Frequency of missing documents, source gaps, or manual verification loops.

Weak examples:

- "This seems inefficient."
- "The industry has delays."
- "AI infrastructure is hard."
- "Manufacturing bottlenecks exist."

## Frontier Domain Capture Guidance

Data centers / AI infrastructure:

- Capture power delivery sequencing, cooling validation, fiber/network readiness, workload scheduling, commissioning, backup generation, and facility telemetry constraints.
- Useful artifacts: commissioning logs, queue age reports, change tickets, facilities telemetry extracts, acceptance checklists.

Power generation / nuclear / SMR:

- Capture licensing evidence packages, outage readiness, QA traceability, protection settings review, work package release, and regulated approval loops.
- Useful artifacts: review dockets, outage readiness plans, QA hold logs, relay review queues, work package status histories.

Grid interconnection / transmission:

- Capture interconnection study queues, large load studies, transformer energization, outage coordination, permitting documentation, and capacity release constraints.
- Useful artifacts: study queue records, outage requests, commissioning plans, transformer procurement and energization timelines.

Semiconductors / advanced manufacturing:

- Capture tool install qualification, substrate qualification, specialty material readiness, cleanroom capacity allocation, yield learning, quality exceptions, and package/test bottlenecks.
- Useful artifacts: tool qualification trackers, lot hold reports, material readiness plans, metrology queues, quality exception logs.

Critical minerals / refining:

- Capture assay-to-offtake qualification, reagent supply readiness, tailings monitoring evidence, refinery lot release, processing bottlenecks, and permit documentation.
- Useful artifacts: assay packages, chain-of-custody records, lab release queues, environmental monitoring repositories, buyer qualification checklists.

Robotics / automation deployment:

- Capture safety validation, site mapping rework, end effector programming, machine vision exceptions, operator acceptance, and controls handoffs.
- Useful artifacts: safety checklists, map update histories, change request queues, false reject logs, operator intervention records.

Aerospace / defense / space manufacturing:

- Capture supplier nonconformance closure, configuration traceability, first article inspection, test stand scheduling, flight hardware release, and customer evidence gates.
- Useful artifacts: nonconformance records, configuration baselines, inspection packages, test schedules, corrective action logs.

Industrial logistics / field operations:

- Capture field parts readiness, depot repair triage, telematics fault classification, remote mobilization, access permits, technician dispatch, and asset return-to-service constraints.
- Useful artifacts: work order histories, service parts availability, dispatch logs, telematics extracts, repair queue status, access approval records.

## Quality Checklist

Before adding a record, confirm:

- The title names a concrete bottleneck, not a broad domain.
- The description explains the mechanism in one or two operational sentences.
- `current_process` names the intake, review/verification, and downstream release step.
- `affected_systems` names the system layer where the constraint can be observed.
- `validation_notes` includes a metric or measurable proxy.
- `evidence_gaps` names what is missing.
- `solution_hypotheses` suggests a bounded intervention or instrumentation path.
- No fake URLs, fake documents, fake citations, fake ROI, or fake validation claims are included.

