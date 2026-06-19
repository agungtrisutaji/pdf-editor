
### `.agents/skills/secure-offline-app-review/SKILL.md`

```md
---
name: secure-offline-app-review
description: Use this skill to review security, privacy, and offline-first requirements for the PDF editor app. Trigger when code touches file access, PDF loading, PDF export, signature storage, Tauri permissions, local persistence, dependencies, or networking.
---

# Secure Offline App Review

## Security objective

PDF files and signatures are sensitive. The app must process documents locally and avoid accidental data exfiltration.

## Review checklist

Check for:

- external network requests;
- CDN-loaded scripts, workers, fonts, images, or styles;
- telemetry, analytics, crash reporting, or tracking;
- unnecessary Tauri permissions;
- unsafe file system access;
- hidden signature persistence;
- overwriting original PDFs without explicit confirmation;
- dependencies with broad or unclear behavior;
- secrets or tokens committed to the repo;
- logging of document content or file paths.

## Required output format

When reviewing, report:

1. confirmed issues;
2. risky patterns;
3. recommended fixes;
4. tests or checks to verify the fix.

## Rules

- Prefer local-only processing.
- Do not add upload, sync, or account features.
- Do not store signatures unless the user explicitly opts in.
- Keep Tauri permissions minimal.
- If a network-capable dependency is introduced, explain why it is required.
