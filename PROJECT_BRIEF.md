# Project Brief: Economic X-Ray Vision / Constraint Intelligence Engine

## Mission

Build a local-first intelligence product that helps identify, structure, score, filter, and rank hidden inefficiencies, frictions, leakages, duplicated work, administrative drag, underused capacity, market mismatches, hidden costs, and resource drains.

The objective is not to build another generic dashboard. The objective is to create a structured intelligence system for finding where value is being wasted, delayed, trapped, duplicated, misallocated, or underutilized before those problems clearly show up in traditional outcome metrics.

## Core Idea

Most systems measure outcomes after the fact, such as revenue, productivity, inflation, financial performance, customer complaints, or broad economic indicators.

This project measures friction and constraint earlier:

- Delay
- Duplicated work
- Hidden labor waste
- Manual verification
- Unnecessary approvals
- Compliance drag
- Idle capacity
- Information gaps
- Process handoffs
- Legacy system dependence
- Supply and demand mismatches

## V1 Scope

V1 focuses on one industry only: healthcare administration.

V1 should include:

- A clean Next.js app structure
- TypeScript types for constraint intelligence objects
- Static local seed data with 10-20 healthcare administration friction examples
- Deterministic scoring logic
- A simple UI for browsing constraint intelligence objects
- Filtering or sorting by score/category
- A detail view or expanded card for each object
- SQLite-ready schema documentation
- README, `.gitignore`, `package.json`, and a GitHub-ready structure

V1 may use static TypeScript seed data for the UI first. `db/schema.sql` is a planned SQLite-ready schema and should not be described as a live SQLite implementation unless the app is actually wired to SQLite.

## V1.1 Direction

V1.1 should make the prototype feel more like an intelligence product while keeping the same small local-first architecture. Prioritize clear dashboard hierarchy, highest-priority constraint visibility, expanded inspection details, a full score breakdown, and a short deterministic scoring explanation in the UI.

## V1.2 Direction

V1.2 adds an evidence and validation layer so each constraint can be inspected for defensibility. Constraint records should track evidence strength, source type, validation status, source quality, measurement difficulty, data availability, confidence reasoning, validation notes, and evidence gaps. Deterministic scoring should include evidence, measurability, and validation confidence scores without adding scrapers, AI APIs, or SQLite wiring.

## V1.3 Direction

V1.3 introduces a structured local JSON intake contract before any scraper, AI extraction, Python worker, or SQLite integration is added. Intake records live outside the app seed data, validate required fields and score ranges locally, and can be converted into the internal TypeScript constraint object shape when the ingestion path is ready.

## V1.4 Direction

V1.4 turns the intake contract into a local dashboard pipeline. Validated JSON intake records are converted into generated TypeScript data, combined with static seed records in a constraint registry, and labeled with record origin metadata so filtering, scoring, and inspection can distinguish seed records from intake records.

## V2.0 Direction

V2.0 adds a lightweight constraint graph and opportunity ranking layer. Records track upstream and downstream constraints, related processes, affected systems, solution hypotheses, and opportunity type. Deterministic scoring adds constraint density, downstream impact, opportunity, and total strategic scores while preserving priority, evidence, validation, and intake scoring.

## V3.0 Direction

V3.0 adds an intelligence analyst workbench. Deterministic explainability derives score drivers, strategic interpretation, weak assumptions, evidence risks, validation next steps, intervention paths, AI/automation angles, and analyst takeaways from existing records and scores. Portfolio opportunity analysis identifies strongest, most AI-solvable, under-validated, under-measured, most connected, and low-complexity/high-impact opportunities without external facts or APIs.

## V4.0 Direction

V4.0 adds local dataset operations before SQLite runtime wiring. The current registry can be built into a JSON dataset snapshot, audited for quality and completeness, and exported as a machine-readable artifact. SQLite remains the next persistence target after JSON snapshot operations stabilize; do not add native SQLite dependencies yet.

## V5.0 Direction

V5.0 adds evidence dossiers and a validation workflow so records are treated as hypotheses until evidence improves. Dossiers derive core claims, evidence gaps, proof/disproof conditions, red-team questions, source recommendations, confidence upgrade paths, decision usefulness, and validation priority from existing fields and scores. Most records should remain needs-evidence or partially-supported unless the local evidence and validation confidence justify decision-ready status.

## V6.0 Direction

V6.0 adds deterministic intervention simulation and action strategy. Strategies recommend bounded first experiments, success metrics, assumptions, failure modes, action confidence, and next steps from existing scores, graph position, evidence confidence, and complexity. Low validation should produce measurement-first recommendations rather than rollout claims. The system must avoid fake ROI, invented citations, and unsupported savings claims.

## Data Model Direction

Each constraint intelligence object should eventually support fields like:

- `id`
- `industry`
- `subsector`
- `title`
- `category`
- `description`
- `evidence`
- `affected_parties`
- `current_process`
- `resource_waste`
- `time_waste`
- `capital_waste`
- `labor_waste`
- `opportunity_cost`
- `estimated_annual_impact`
- `growth_trend`
- `visibility_score`
- `overlooked_score`
- `digital_solution_potential`
- `automation_potential`
- `ai_potential`
- `implementation_complexity`
- `regulatory_complexity`
- `adoption_complexity`
- `confidence`
- `sources`

## Scoring Concepts

The scoring module should account for:

- `severity_score`
- `solvability_score`
- `ai_readiness_score`
- `overlooked_opportunity_score`
- `total_priority_score`

## Technology Direction

- TypeScript
- Next.js
- Static local seed data for the initial UI
- SQLite-ready schema for the future local data layer
- Local-first architecture
- GitHub-ready project structure

Future versions may add Python ingestion workers for scraping, AI extraction, NLP, document parsing, and research pipelines. Do not add those in V1.

## Hard Rules

- Do not add scrapers in V1
- Do not add AI API calls in V1
- Do not add authentication in V1
- Do not add cloud services in V1
- Do not add Python files in V1
- Do not create large data files in V1
- Do not overengineer
- Do not build the full grand vision
- Keep V1 small, clean, understandable, and portfolio-ready

## Roadmap

Near-term:

- Improve filtering and sorting
- Add richer score explanations
- Wire static objects into SQLite when useful
- Add import/export once the object model stabilizes

Later:

- Python ingestion workers
- Document parsing
- Research pipelines
- AI-assisted extraction
- Multi-source evidence management
- Multi-industry expansion

## V7.0 Technical Note

V7.0 shifts the project from a healthcare-only constraint dashboard toward a generalized constraint archetype engine. The system now models recurring bottleneck patterns such as queue backlogs, documentation chase, handoff leakage, permitting delay, equipment lead time, data fragmentation, regulatory complexity, inspection delay, vendor qualification, measurement blind spots, and support channel overload.

The dataset keeps healthcare administration as the baseline and adds strategic seed hypotheses across energy/grid interconnection, infrastructure/permitting/construction, semiconductors/advanced manufacturing, metals/mining/critical inputs, logistics/supply chain/industrial equipment, and public-sector administration/compliance. These records are intentionally framed as hypotheses until evidence improves.

Each record now carries `primary_archetype`, `secondary_archetypes`, `archetype_confidence`, and `archetype_reasoning`. The archetype analysis layer computes distribution, spread, under-validation, intervention opportunity, and cross-industry analogs so the product can show when different sectors share the same underlying constraint pattern.

Export hygiene was improved so generated JSON exports preserve existing `generated_at` values when semantic content is unchanged. This keeps repeated local checks from creating meaningless Git diffs after the committed snapshots are current.

## V8.0 Technical Note

V8.0 focuses on repository presentation and architecture hardening rather than product feature expansion. The README and docs now explain the project narrative, current system metrics, local-first architecture, deterministic data pipeline, scoring and validation approach, intervention strategy logic, constraint archetype engine, cross-industry analog detection, and portfolio positioning.

This phase is meant to help a GitHub visitor, recruiter, reviewer, mentor, or fellowship evaluator understand the project within 30-90 seconds while still providing deeper technical documentation for follow-up review. Screenshot documentation uses placeholders and capture guidance only; no broken image links or fake screenshots should be added.

The system should continue to avoid fake production claims, fake badges, invented citations, unsupported ROI claims, hidden external services, scraping, AI API calls, authentication, cloud services, and SQLite runtime wiring until those capabilities are actually implemented.

## V13.0 Technical Note

V13.0 adds local SQLite persistence as a build artifact, not as a runtime dependency for the dashboard. The stable app still reads from the TypeScript/generated registry, while local scripts can build `data/exports/constraint_intelligence.sqlite` from the current JSON dataset, source registry, and evidence packs.

The SQLite layer is intentionally scoped to database credibility and inspection: schema alignment, constraint and score tables, source registry tables, evidence pack tables, build metadata, audit reporting, and inspection queries. Repeated builds compare a content hash before rewriting the database artifact so ordinary checks do not create meaningless database churn.

The next persistence step can move selected runtime reads to SQLite only after the artifact, schema, and audit workflow remain stable.

## V14.0 Technical Note

V14.0 adds a deterministic validation task workflow. The system now generates an analyst queue from source registry gaps, evidence packs, evidence dossier gaps, validation confidence, defensibility scores, and validation-dependent interventions. Tasks are generated artifacts, not user-authored todos, and task status is deterministic rather than editable.

The dashboard includes a compact validation task panel, `/validation` provides a static validation workbench with local filters, and each constraint investigation shows tasks for that specific record. The export `data/exports/validation_tasks.json` and the SQLite `validation_tasks` table preserve the queue for local audit and inspection without making the app runtime depend on SQLite.

## V15.0 Technical Note

V15.0 adds validation triage to reduce analyst overload. The raw validation task engine can generate hundreds of tasks, so triage clusters tasks by constraint and blocker type, recalibrates severity so critical is exceptional, calculates validation burden, and selects one next-best validation action per constraint. The export `data/exports/validation_triage.json` preserves the top validation queue and constraint-level triage without adding editable task persistence.

## V16.0 Technical Note

V16.0 adds validation evidence packets. Evidence packets translate the top triage actions into specific artifact requests with evidence needed, source or metric category, artifact checklist, pass/fail criteria, and expected confidence impact. The packet layer remains deterministic and local-first; it does not fetch sources, invent citations, or claim that requested artifacts already exist.

## V17.0 Technical Note

V17.0 adds a source registry workspace at `/sources`. The workspace makes source trust, citation status, provenance weakness, primary-document needs, and source-to-constraint dependencies inspectable from the UI. It builds on source records and evidence packs while preserving the app's generated-data architecture.

## V18.0 Technical Note

V18.0 adds SQLite read-model parity auditing. The app still does not read from SQLite at runtime, but `scripts/audit-sqlite-parity.ts` verifies that the local SQLite artifact can reconstruct core counts and key records from the JSON/static export pipeline. Current parity covers constraints, scores, source records, source links, evidence packs, and validation tasks. Triage, evidence packets, campaigns, and comparison remain JSON/computed layers until the schema is extended.

## V19.0 Technical Note

V19.0 adds a constraint comparison workspace at `/compare`. Analysts can compare 2-4 constraints across priority, validation confidence, evidence defensibility, source quality, intervention readiness, validation burden, archetypes, and network context. The comparison layer explains why one constraint outranks another using deterministic local signals rather than new claims or external data.

## V20.0 Technical Note

V20.0 adds a validation campaign planner at `/campaigns`. Campaigns group top triage actions and evidence packets into fast, standard, and deep validation plans. Each campaign explains selected constraints, required artifacts, source upgrades, expected confidence lift, effort level, and decision use. Campaign output is exported to `data/exports/validation_campaigns.json` and remains deterministic, generated, and non-editable.

## V23.0 Technical Note

V23.0 adds an evidence artifact contract and generated artifact library. The artifact layer translates evidence packets, source records, evidence packs, and triage gaps into specific needed artifacts such as primary documents, source URLs, local observations, metric definitions, claim-support memos, and intervention pilot plans. The export `data/exports/evidence_artifact_library.json` is a deterministic planning contract for future collection; it does not fetch, upload, scrape, or invent evidence.

## V21.0 Direction

V21.0 is a project memory and navigation hardening phase. The goal is to align README, architecture docs, route maps, data pipeline maps, app copy, and project brief content with the real V20 product state so a reviewer or future contributor can understand the system without reconstructing the history from commits.

## Current Route Map

- `/`: portfolio dashboard, summary panels, filters, expanded cards, and links into workspaces.
- `/validation`: validation workbench with triage, evidence packets, and raw generated tasks.
- `/campaigns`: validation campaign planner with fast, standard, and deep plans.
- `/compare`: constraint comparison workspace.
- `/sources`: source registry and evidence pack workspace.
- `/network`: constraint network explorer with search, filters, and focused neighborhoods.
- `/constraints/[id]`: record-level investigation workspace.

## Current Data Pipeline

The current pipeline is:

1. Seed, intake, and strategic records enter the constraint registry.
2. Deterministic scoring produces priority, validation, graph, strategic, and archetype scores.
3. Dataset exports create the local dataset snapshot.
4. Evidence dossiers derive proof/disproof conditions, evidence gaps, and validation priority.
5. Source registry and evidence packs separate source metadata, claim support, gaps, and provenance.
6. Validation tasks convert weak evidence and source gaps into generated analyst tasks.
7. Validation triage compresses task volume into next-best actions.
8. Evidence packets turn top actions into concrete artifact requests.
9. The evidence artifact library defines the specific documents, observations, metrics, or source artifacts still needed.
10. Campaigns group top validation work into fast, standard, and deep plans.
11. Intervention, archetype, network, comparison, and SQLite parity layers provide action, pattern, relationship, relative-ranking, and persistence credibility.
