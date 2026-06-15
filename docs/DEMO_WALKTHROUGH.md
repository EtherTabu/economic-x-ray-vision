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

## 4. Review Source Registry + Evidence Packs

The Source Registry panel separates source metadata from claim support. It highlights:

- Source record count
- Average source trust
- Average defensibility
- Thin provenance records
- Recommended source upgrades

## 5. Review Intervention Simulator

The Intervention Simulator shows bounded action hypotheses:

- Highest priority intervention
- Top fast win
- Top AI leverage candidate
- Validation-dependent action
- First experiment
- Success metrics
- Failure modes

## 6. Review Archetype Intelligence

The Archetype Intelligence panel shows recurring bottleneck patterns across industries:

- Total archetypes detected
- Most widespread archetype
- Highest priority archetype
- Most under-validated archetype
- Cross-industry analog pair
- Archetype distribution

## 7. Explore The Constraint Network

Use `Open Constraint Network` from the dashboard to inspect the relationship map. The network page shows:

- Constraint, archetype, industry, and intervention nodes.
- Search by title, id, industry, or archetype.
- Filters for industry, archetype, and evidence risk.
- Focus mode via direct links such as `/network?focus=hc-admin-001`.
- Bridge constraints that connect across sectors.
- Neighborhood edges around the focused constraint.
- Weak evidence clusters.
- High intervention leverage clusters.
- Clickable constraint nodes that open `/constraints/[id]` investigation pages.

## 8. Use Filters

Use the filters to compare:

- Industry
- Category
- Archetype
- Opportunity type
- Origin
- Decision filter
- Sort order

Example: filter to `Energy / Grid / Interconnection`, then filter by `documentation_chase` or `queue_backlog`.

## 9. Inspect A Constraint Card

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

Then use `Open investigation` to move from the dashboard card into the dedicated constraint workspace. The workspace follows the record through overview, score signals, evidence dossier, validation workflow, archetype reasoning, cross-industry analogs, intervention strategy, and a copyable investigation summary.

## 10. Review A Constraint Investigation

In the investigation workspace, check:

- Whether the record is decision-ready or still a hypothesis.
- What evidence would prove or disprove the core claim.
- Which source records support the claim and what provenance gaps remain.
- Which cross-industry analogs share the same bottleneck pattern.
- Which first experiment is recommended before broader rollout.
- Whether action confidence is limited by validation gaps.
- The link back to the network map for relationship exploration.

## 11. Run Locally

```bash
npm install
npm run dev
npm run check
```

The full check validates intake, rebuilds generated data, refreshes exports, audits all layers, lints, and builds the Next.js app.
