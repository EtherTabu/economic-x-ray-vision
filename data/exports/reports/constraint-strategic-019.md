# Refining and smelting capacity bottleneck Constraint Report

Upstream mined material may wait for constrained processing, refining, or smelting capacity before becoming usable input.

> Deterministic local report. No external sources were fetched and no evidence status was changed.

## Hypothesis

- Upstream mined material may wait for constrained processing, refining, or smelting capacity before becoming usable input.
- Industry: Metals / Mining / Critical Inputs
- Validation status: Unverified
- Validation confidence: 3.8
- Priority score: 5.8
- Strategic score: 7.3

## Evidence Gap And Validation Burden

- Validation burden: 9.9 (Critical)
- Validation burden 9.9 is critical after compressing 7 raw tasks into 4 clusters: metric (2), evidence (2), source (2), intervention-blocking (1).
- Evidence gap: Step-level baseline for Mineral processing allocation
- Evidence gap: Observed frequency and owner of delay before Qualified refined input

## Next Validation Action

- Define validation metric: Refining and smelting capacity bottleneck
- Resolve whether this gap is visible in Processing capacity plan.
- Expected artifact: Metric definition with owner, data source, sampling window, and baseline.
- Rationale: 7 generated tasks compress into 4 validation clusters. metric is the highest-leverage next action because it carries priority 9.5 and blocks confidence in the constraint. Evidence gap remains unresolved: Observed frequency and owner of delay before Qualified refined input

## Evidence Packet Criteria

- Evidence needed: Define the measured signal for Refining and smelting capacity bottleneck: owner, data source, sampling window, baseline, and pass/fail threshold.
- Pass: Metric can be collected from a named system, owner, or repeatable observation.
- Pass: Baseline and sampling window are clear enough for a follow-up validation pass.
- Pass: Metric tests the bottleneck described by the triage action rather than a generic outcome.
- Fail: No owner, system, or repeatable observation can produce the metric.
- Fail: The proposed measure captures downstream outcomes only after the friction has already occurred.
- Fail: The baseline cannot be recreated or compared across a later validation cycle.

## Artifact Needs

- Metric definition with owner, data source, sampling window, and baseline. (metric_definition, status not_collected, priority 9.1). Why needed: metric cluster contains 2 tasks with max priority 9.8.
- Metric definition with owner, data source, sampling window, and baseline. (metric_definition, status not_collected, priority 8.9). Why needed: Define the measured signal for Refining and smelting capacity bottleneck: owner, data source, sampling window, baseline, and pass/fail threshold.
- Defensibility review note with source upgrades and claim support decisions. (claim_support_memo, status not_collected, priority 8.4). Why needed: evidence cluster contains 2 tasks with max priority 8.6.
- Primary document reference with title, publisher, date, and scope. (primary_document, status not_collected, priority 7.8). Why needed: source cluster contains 2 tasks with max priority 7.6 and 2 blocked tasks.
- Experiment plan with baseline metric, success threshold, and stop condition. (intervention_pilot_plan, status not_collected, priority 7.4). Why needed: intervention-blocking cluster contains 1 task with max priority 7.0.
- Primary document for Metals / Mining / Critical Inputs process pattern review (primary_document, status not_collected, priority 6.4). Why needed: Attach the specific primary document for Metals / Mining / Critical Inputs process pattern review.

## Analyst State

- Constraint state: unreviewed
- Next action: Resolve whether this gap is visible in Processing capacity plan.
- This report does not claim human review, evidence collection, or decision readiness.

## Limitations

- This is a generated local analyst note.
- It uses existing exports only and does not introduce external facts.
- Uncovered evidence means a validation artifact is still needed.
