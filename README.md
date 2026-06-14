# Economic X-Ray Vision

Economic X-Ray Vision is a local-first constraint intelligence prototype for finding where value is being wasted, delayed, duplicated, trapped, or underused before those problems show up in traditional outcome metrics.

The first version focuses on healthcare administration. It is intentionally small: static TypeScript seed data, deterministic scoring logic, and a Next.js interface for browsing, filtering, sorting, and inspecting constraint intelligence objects.

## Thesis

Most dashboards measure outcomes after the fact: revenue, productivity, complaints, claim performance, or utilization. Economic X-Ray Vision models earlier signals of constraint and waste, such as manual verification, repeated handoffs, delayed approvals, duplicated work, compliance drag, idle capacity, and information gaps.

The product idea is not to replace operational systems. It is to create an explainable intelligence layer that helps prioritize where hidden friction deserves closer investigation.

## Current Status

V1.1 is a working local prototype. The UI is powered by static seed data in `src/data/healthcareConstraints.ts`; SQLite is not wired into the app yet. `db/schema.sql` documents the planned local database shape for a future phase.

## V1.1 Capabilities

- Healthcare administration only
- 12 structured healthcare administration constraint objects
- Deterministic priority scoring
- Dashboard summary of analyzed objects and highest-priority friction
- Category filtering and score-based sorting
- Expanded card inspection for evidence, affected parties, process, waste, opportunity cost, complexity, confidence, and sources
- Score breakdown for severity, solvability, AI readiness, overlooked opportunity, and total priority
- SQLite-ready schema documentation in `db/schema.sql`

## Scoring Model

Scoring is local, deterministic, and explainable. No AI API is used for ranking.

- Severity combines time waste, capital waste, labor waste, and growth trend.
- Solvability combines digital solution potential, automation potential, and the inverse of implementation, regulatory, and adoption complexity.
- AI readiness combines AI potential, digital solution potential, confidence, and regulatory complexity.
- Overlooked opportunity combines overlooked score, low visibility, severity, and solvability.
- Total priority combines the four derived scores into one ranking signal.

Scores are intended to help compare friction objects, not to claim financial precision.

## Tech Direction

- TypeScript
- Next.js App Router
- Static local seed data for the current UI
- Local-first architecture
- Planned SQLite data layer

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Useful Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Non-Goals

V1.1 does not include:

- Scrapers
- AI API calls
- Authentication
- Cloud services
- Python ingestion workers
- Paid dependencies
- Large datasets
- Multi-industry expansion
- A live SQLite-backed application layer

## Project Structure

```text
src/app                 Next.js app shell and main page
src/components          UI components for cards, filters, and score badges
src/data                Static healthcare administration seed dataset
src/lib                 Scoring, sorting, and filtering helpers
src/types               Constraint intelligence TypeScript types
db/schema.sql           Planned SQLite schema for a future local data layer
```

## Roadmap

- Add richer score explanations per object
- Add search and more precise filtering
- Wire the static model into SQLite when the interaction model stabilizes
- Add import/export for local datasets
- Later, add ingestion workers for document parsing, extraction, and research workflows
