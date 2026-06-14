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
