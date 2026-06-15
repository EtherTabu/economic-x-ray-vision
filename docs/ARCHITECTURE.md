# Architecture

Economic X-Ray Vision is a local-first constraint intelligence engine. It structures constraint hypotheses, scores them deterministically, evaluates evidence quality, separates source provenance from claim support, proposes validation and intervention paths, identifies recurring bottleneck archetypes across industries, and maps relationships between constraints.

The current system is a Next.js app backed by TypeScript data modules, local JSON intake records, generated TypeScript data, and JSON export artifacts. It does not use external APIs, cloud services, authentication, scraping, or SQLite runtime wiring.

## System Shape

```mermaid
flowchart TD
  A["Static Seed Records"] --> C["Constraint Registry"]
  B["JSON Intake Contract"] --> D["Generated Intake Data"]
  D --> C
  E["Strategic Cross-Sector Seeds"] --> C
  C --> F["Scoring Engine"]
  F --> G["Dashboard UI"]
  F --> H["Dataset Snapshot"]
  H --> I["Evidence Dossiers"]
  I --> O["Source Registry + Evidence Packs"]
  O --> J["Intervention Strategies"]
  J --> K["Archetype Analysis"]
  K --> M["Constraint Network Map"]
  H --> L["Local JSON Exports"]
  I --> L
  O --> L
  J --> L
  K --> L
  M --> L
  F --> N["Investigation Routes"]
  M --> N
```

## Major Modules

- `src/data/healthcareConstraints.ts`: original healthcare administration baseline records.
- `data/intake/sample_constraints.json`: structured JSON intake examples.
- `src/data/generated/intakeConstraints.ts`: generated app-consumable intake records.
- `src/data/strategicConstraintSeeds.ts`: cross-sector strategic constraint hypotheses.
- `src/data/constraintRegistry.ts`: combined registry used by the app.
- `src/lib/scoring.ts`: deterministic score calculations.
- `src/lib/evidenceDossier.ts`: evidence dossier generation.
- `src/lib/sourceRegistry.ts`: source locator registry and provenance metadata.
- `src/lib/evidencePacks.ts`: claim support, source coverage, provenance, and defensibility pack generation.
- `src/lib/interventionSimulator.ts`: intervention strategy generation.
- `src/lib/constraintArchetypes.ts`: reusable bottleneck taxonomy.
- `src/lib/archetypeAnalysis.ts`: archetype distribution and portfolio analysis.
- `src/lib/crossIndustryAnalogs.ts`: cross-industry similarity detection.
- `src/lib/constraintNetwork.ts`: graph builder for constraint, archetype, industry, analog, and intervention relationships.
- `scripts/`: local validation, build, audit, and export operations.

## Network Layer

The constraint network map is built locally from the existing registry and deterministic engines. It creates constraint, archetype, industry, and intervention nodes, then connects them with edges for archetype membership, industry membership, intervention type, and cross-industry analogs.

The `/network` route renders the static graph into an interactive local explorer. It supports text search, industry filtering, archetype filtering, evidence-risk filtering, and focus links such as `/network?focus=hc-admin-001`. Focus mode shows the immediate neighborhood around one constraint without fetching external data.

The network export is written to `data/exports/constraint_network.json`. It uses stable generated metadata so repeated checks do not create meaningless timestamp diffs when the graph content has not changed.

## Evidence Packs

V11 adds a source registry and evidence pack layer. Source records preserve the current source names as local source locators and label whether each source needs a URL, a primary document, or local observation. Evidence packs connect those sources to specific claim-support statements, unresolved gaps, provenance notes, audit flags, and a defensibility score.

This does not invent citations or fetch external documents. It makes the current evidence status more inspectable and gives future ingestion work a cleaner target.

## Why Deterministic Logic Matters

The project is meant to be inspectable. Scores and explanations are derived from structured fields, not hidden model calls. This makes every ranking debuggable, repeatable, and suitable for local portfolio review.

Deterministic logic also keeps the system honest: weak evidence lowers confidence, high complexity lowers near-term action priority, and under-validated records produce measurement-first recommendations instead of rollout claims.
