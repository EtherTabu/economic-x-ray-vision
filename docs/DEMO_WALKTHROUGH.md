# Demo Walkthrough

Use this walkthrough to review Economic X-Ray Vision as a local portfolio project.

## 1. Start With The Overview

Open the app and read the hero section. It frames the project as a constraint intelligence workbench, not a conventional dashboard.

Look for the summary metrics:

- Total visible records
- Seed and intake split
- Average priority
- Average validation
- Top overlooked area

## 2. Review Dataset Health

The Dataset Health panel shows whether the registry is complete enough to inspect:

- Total records
- Seed/intake split
- Data quality score
- Validation coverage
- Evidence completeness
- Relationship completeness
- Records needing validation

## 3. Review Evidence Dossier Workflow

The Evidence Dossier panel treats records as claims under validation. It highlights:

- Decision-ready count
- Needs-evidence count
- High-priority validation records
- Evidence gaps
- What would prove or disprove a claim
- Red-team questions

## 4. Review Intervention Simulator

The Intervention Simulator shows bounded action hypotheses:

- Highest priority intervention
- Top fast win
- Top AI leverage candidate
- Validation-dependent action
- First experiment
- Success metrics
- Failure modes

## 5. Review Archetype Intelligence

The Archetype Intelligence panel shows recurring bottleneck patterns across industries:

- Total archetypes detected
- Most widespread archetype
- Highest priority archetype
- Most under-validated archetype
- Cross-industry analog pair
- Archetype distribution

## 6. Use Filters

Use the filters to compare:

- Industry
- Category
- Archetype
- Opportunity type
- Origin
- Decision filter
- Sort order

Example: filter to `Energy / Grid / Interconnection`, then filter by `documentation_chase` or `queue_backlog`.

## 7. Inspect A Constraint Card

Open a constraint card and inspect:

- Score drivers
- Evidence profile
- Evidence dossier summary
- Action strategy
- Graph position
- Archetype pattern
- Complexity
- Score breakdown
- Sources

## 8. Run Locally

```bash
npm install
npm run dev
npm run check
```

The full check validates intake, rebuilds generated data, refreshes exports, audits all layers, lints, and builds the Next.js app.

