# Economic X-Ray Vision

Economic X-Ray Vision is a local-first constraint intelligence prototype for spotting administrative friction before it becomes obvious in lagging outcome metrics.

V1 focuses only on healthcare administration. It uses static TypeScript seed data, deterministic scoring logic, and a simple Next.js interface for browsing, filtering, sorting, and inspecting constraint intelligence objects.

## V1 Scope

- Healthcare administration only
- Static local seed data
- Deterministic scoring
- Constraint cards with expanded details
- Filtering by category and sorting by score
- SQLite-ready schema documentation in `db/schema.sql`

This version is not wired to SQLite yet. The schema is included so the data model can move cleanly into a local database later.

## Tech Direction

- TypeScript
- Next.js App Router
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

## Project Structure

```text
src/app                 Next.js app shell and main page
src/components          UI components for cards, filters, and score badges
src/data                Static healthcare administration seed dataset
src/lib                 Scoring, sorting, and filtering helpers
src/types               Constraint intelligence TypeScript types
db/schema.sql           Planned SQLite schema for a future local data layer
```

## Not Included In V1

- Scrapers
- AI API calls
- Authentication
- Cloud services
- Python ingestion workers
- Large datasets
- Multi-industry expansion
