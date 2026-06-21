
### `.agents/skills/qa-release-checklist/SKILL.md`

```md
---
name: qa-release-checklist
description: Use this skill before merging or releasing changes to the offline PDF editor app. It validates PDF workflows, export correctness, security constraints, platform behavior, and packaging readiness.
---

# QA Release Checklist

## Functional checks

Verify:

- app launches;
- local PDF can be opened;
- first page renders;
- multi-page navigation works;
- text overlay can be added;
- signature overlay can be added;
- stamp overlay can be added;
- overlays can be dragged and resized;
- exported PDF opens in standard PDF readers;
- exported PDF keeps overlay positions correctly.

## Security checks

Verify:

- no PDF upload;
- no telemetry;
- no runtime CDN;
- no hidden signature storage;
- original PDF is not overwritten by default;
- Tauri permissions are minimal;
- dependency changes are reviewed.

## Build checks

Run:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm tauri build
