# Scoring And Validation

Scores in Economic X-Ray Vision are deterministic heuristics, not model predictions. They support inspection and prioritization; they do not replace expert judgment or local operational validation.

## Core Scores

- `severity_score`: combines time waste, capital waste, labor waste, and growth trend.
- `solvability_score`: combines digital potential, automation potential, and inverse complexity.
- `ai_readiness_score`: estimates whether structured data and complexity make AI-assisted support plausible.
- `overlooked_opportunity_score`: highlights high-friction issues that may be under-visible.
- `total_priority_score`: combines severity, solvability, AI readiness, overlooked opportunity, and validation confidence.

## Validation Scores

- `evidence_score`: combines evidence strength, source quality, validation status, and confidence.
- `measurability_score`: combines data availability, measurement difficulty, and source quality.
- `validation_confidence_score`: summarizes how defensible a record currently is.

## Strategic Scores

- `constraint_density_score`: reflects upstream links, downstream links, related processes, and affected systems.
- `downstream_impact_score`: estimates how much a constraint can affect later processes.
- `opportunity_score`: combines solvability, AI readiness, digital potential, automation potential, and validation.
- `total_strategic_score`: combines downstream impact, density, opportunity, and priority.
- `archetype_spread_score`: reflects how strongly the record participates in reusable bottleneck patterns.
- `cross_industry_similarity_score`: estimates whether a constraint has useful analogs in other sectors.

## Dataset And Action Scores

- `data_quality_score`: summarizes evidence completeness, relationship completeness, validation coverage, and metadata validity.
- `intervention_priority_score`: ranks candidate interventions using unlock potential, pilotability, AI leverage, time to impact, complexity, and risk.
- `action_confidence`: lowers confidence when evidence or validation is weak.
- `archetype_confidence`: record-level confidence that the assigned archetype describes the underlying bottleneck.

## Evidence Humility

Many records are intentionally treated as hypotheses. A high strategic opportunity score does not mean a claim is proven. Weak evidence should trigger measurement-first validation, not rollout recommendations.

## Validation Tasks

Validation tasks are deterministic workflow objects generated from existing local evidence signals. They are not user-entered todos and do not persist editable status.

The task engine considers source citation gaps, evidence gaps, claim support level, defensibility score, validation confidence, intervention action confidence, and opportunity score. The result is a prioritized analyst queue with task type, severity, status, recommended action, expected artifact, and links back to the constraint investigation and network focus view.

Current task statuses are generated as `open`, `blocked`, or `review_ready`. Blocked usually means a source artifact is missing, such as a primary document, URL, or local observation record.

## Validation Triage

The triage layer reduces analyst overload by grouping raw validation tasks at the constraint level. It clusters task types into source, evidence, metric, and intervention-blocking groups, computes a validation burden score, recalibrates severity, and selects one next-best validation action per constraint.

Critical severity after triage is intentionally exceptional. The raw task queue may contain many critical items, but the triage layer highlights the constraints where validation debt most blocks decision usefulness.

## Evidence Request Packets

Evidence packets translate top triage actions into concrete artifact requests. Each packet identifies the constraint, evidence needed, request category, artifact checklist, pass criteria, fail criteria, and expected confidence impact.

The packet score is still a heuristic. It represents expected improvement if the requested artifact is collected and passes validation; it is not proof that the evidence exists.

## Validation Campaigns

Validation campaigns group top triage actions and evidence packets into fast, standard, and deep validation plans. Campaigns explain which constraints to validate first, why those records matter, what artifacts to collect, which source upgrades are required, and what confidence lift is expected.

Campaign plans are generated analyst guidance, not persisted project management state. They do not claim real-world savings, do not fetch sources, and do not replace expert validation.
