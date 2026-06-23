# Evidence Import Contract

The evidence import contract is the first manual-first rail for moving from `evidence needed` to `evidence collected / attached / reviewed` without scraping, AI extraction, uploads, or false completion claims.

## Purpose

Economic X-Ray Vision already generates artifact needs from validation tasks, triage, source gaps, evidence packets, and campaigns. Those artifact needs say what should be collected.

Evidence imports are different. They describe evidence metadata that a human has identified or collected later.

The import layer does not mutate:

- `data/exports/evidence_artifact_library.json`
- `data/exports/validation_tasks.json`
- `data/exports/validation_campaigns.json`
- constraint records
- source records

Instead, it writes a separate registry and audit report.

## Files

- `schemas/evidence_import.schema.json`: JSON contract for future import packs.
- `data/evidence/templates/evidence_import_template.json`: copy-only template; never processed as live data.
- `data/evidence/imports/*.json`: future human-authored import packs.
- `data/exports/evidence_import_registry.json`: generated import registry and coverage report.
- `data/exports/evidence_import_audit.json`: generated audit result.
- `data/exports/evidence_artifact_matches.json`: generated evidence-to-artifact matching report.

## How To Add Evidence Metadata Later

1. Copy `data/evidence/templates/evidence_import_template.json`.
2. Save the copy in `data/evidence/imports/` with a descriptive filename.
3. Replace every placeholder with real metadata.
4. Link to existing `artifact_id`, `constraint_id`, or `source_record_id` values when known.
5. Run `npm run evidence-imports`.
6. Run `npm run evidence-matches`.
7. Run `npm run check`.

The builder validates links against existing generated artifacts, constraints, and source records. If a link cannot be resolved, the import is reported as an orphan or validation error.

## Artifact Need vs Imported Evidence

An artifact need is a generated request, such as:

- metric definition
- primary document
- local observation
- source URL
- claim-support memo
- intervention pilot plan

An imported evidence record is metadata about something that may satisfy, partially satisfy, or fail to satisfy that need.

The artifact need remains `not_collected` until a future human-state or review workflow explicitly decides otherwise. V26 only reports candidate coverage.

V27 adds a matching report that classifies artifact needs as `matched`, `candidate`, `blocked`, or `uncovered`. Candidate and matched reports are still read-only. They do not mutate the artifact library or analyst state.

## Status Rules

Allowed collection statuses:

- `not_collected`
- `metadata_only`
- `collected`
- `needs_review`
- `rejected`
- `blocked`

Allowed review statuses:

- `unreviewed`
- `review_ready`
- `reviewed`
- `accepted`
- `rejected`
- `needs_followup`

Allowed provenance statuses:

- `unknown`
- `source_title_only`
- `operational_pattern`
- `secondary_reference`
- `primary_document`
- `local_observation`
- `verified_primary`

If an import claims collected or reviewed status, it must include stronger metadata such as publisher or owner, collection/review dates, and a source URL or local file reference. URLs are checked only for shape; the system does not fetch them. Local file references are metadata only; the scripts do not read files.

## What Not To Do

- Do not add fake URLs.
- Do not invent primary documents.
- Do not use vague titles like `evidence file`.
- Do not mark evidence as accepted unless a real review has happened.
- Do not use this folder for raw document uploads.
- Do not edit generated exports manually.

## Future Automation

Future scraping, AI extraction, or document ingestion can populate this same contract later. The point of V26 is to define the rail first, so automation must produce structured metadata, provenance, links, and review posture instead of dumping unverified text into generated intelligence.
