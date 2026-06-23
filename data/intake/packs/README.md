# Intake Packs

Place future real constraint intake packs in this folder as `*.json` files.

The local pipeline processes:

- `data/intake/sample_constraints.json`
- every `data/intake/packs/*.json` file in deterministic filename order

The local pipeline does not process:

- this `README.md`
- files under `data/intake/templates/`
- draft notes, markdown files, or non-JSON files

Each pack must use the same contract as `schemas/constraint_intake.schema.json`:

```json
{
  "contract_version": "1.0",
  "records": []
}
```

Capture rules:

- Use stable, unique IDs. Prefer a prefix that identifies the pack or domain.
- Keep records as hypotheses unless defensible evidence already exists.
- Do not add fake URLs, fake source titles, fake primary documents, or fake validation claims.
- Put draft examples in `data/intake/templates/`, not this folder.
- Run `npm run validate:intake` before building generated data.
- Run `npm run check` before committing a real pack.

