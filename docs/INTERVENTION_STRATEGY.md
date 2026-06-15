# Intervention Strategy

The intervention simulator turns scored constraints into bounded action hypotheses. It does not claim dollar ROI or real-world savings. It recommends what to test, why the test fits, what would unlock, and what could fail.

## Intervention Types

Current intervention types include:

- `automation_assist`
- `workflow_redesign`
- `data_integration`
- `measurement_instrumentation`
- `staffing_capacity`
- `policy_simplification`
- `marketplace_matching`
- `evidence_collection`
- `queue_triage`
- `standardization`

## First Experiment Logic

Each strategy includes:

- Intervention thesis
- Why the intervention fits
- Expected relative unlock
- Affected processes and systems
- Required evidence
- Key assumptions
- First experiment
- Success metrics
- Failure modes
- Operational risk
- Action confidence
- Recommended next step

## Weak Evidence Behavior

Low validation confidence does not block all action. It changes the action type. When evidence is weak, the simulator recommends measurement-first experiments, such as instrumenting a queue, sampling rework, comparing before/after cycle time, or validating an evidence gap.

This keeps the system from pretending that a hypothesis is ready for full rollout.

## Why No Fake ROI

The current data model contains relative impact and score fields, not verified financial outcomes. The simulator therefore uses relative opportunity language and local measurement recommendations. It avoids unsupported dollar claims, invented savings, and citations that do not exist in the project data.

