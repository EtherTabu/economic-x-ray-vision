# GitHub Visual Identity Notes

This repository uses a dark/glass intelligence style with NVDA green as the primary accent.

## Core Style

- Primary accent: `#76B900`
- Background: deep charcoal or near-black, such as `#070B0F`
- Surface: dark glass panels with subtle borders
- Supporting text: cool gray
- Tone: serious, technical, portfolio-safe

## Banner Pattern

Use a local SVG banner when possible:

```markdown
![<Project Name> banner](docs/assets/<project-banner>.svg)
```

Recommended banner text:

```text
<Project Name>
<Short system category>
<Local-first / evidence-aware / validation / artifact / graph language as applicable>
```

For Economic X-Ray Vision, the banner uses:

```text
Economic X-Ray Vision
Constraint Intelligence Engine
Local-first • Evidence-aware • Validation campaigns • Artifact library
```

## Badge Pattern

Use the existing NVDA-green support badge only in lower sections:

```markdown
[![Support Development](https://img.shields.io/badge/Support-Development-76B900?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/EtherTabu)
```

## Cross-Repo Consistency

Keep these consistent:

- Overall README structure
- Concise hero mission
- Current status section
- Architecture/data-flow section
- Checks and run commands
- Support Development section near the bottom

Let these vary by repo:

- Project voice
- Problem statement
- Screenshots
- Capabilities
- Roadmap
- Technical depth

## Claims Discipline

- Do not invent links, employers, sponsors, users, or metrics.
- Do not use production language for prototypes.
- Do not add screenshot links before files exist.
- Do not imply scraping, AI APIs, cloud services, or live databases unless they are actually implemented.
- Prefer "working prototype," "local-first system," or "portfolio system" when that is the accurate status.
