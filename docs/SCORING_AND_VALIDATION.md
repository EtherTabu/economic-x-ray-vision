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

