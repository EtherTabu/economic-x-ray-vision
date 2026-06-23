# Evidence Import Packs

Place future human-authored evidence import packs in this folder as `*.json` files.

The import builder reads only JSON files in this directory. It does not read `data/evidence/templates/`, does not fetch URLs, does not open local files, and does not mutate generated artifact needs.

Current state is allowed to be empty. An empty folder should produce a valid registry with `0 evidence imports`.

## Expected Pack Shape

```json
{
  "contract_version": "1.0",
  "imports": []
}
```

Each import should identify the artifact need, constraint, or source record it relates to when known. If a record claims `collected`, `review_ready`, `reviewed`, or `accepted`, it must include enough metadata to justify that status.

Do not add placeholder URLs, invented documents, or vague titles as real imports.
