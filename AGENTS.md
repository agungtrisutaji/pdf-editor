# AGENTS.md

## Project

This repository contains a secure offline desktop PDF editor focused on signing, stamping, lightweight text overlays, and exporting a new PDF.

The app is not intended to be a full Acrobat-style PDF content editor. The initial product model is overlay-based annotation: render a PDF, place visual elements on top of pages, then export a new PDF with those overlays embedded.

## Product goals

The app must allow users to:

- open local PDF files;
- preview PDF pages;
- add a signature image;
- draw a signature;
- add text overlays;
- add stamp overlays;
- drag and resize overlays;
- export a new PDF file.

## Non-negotiable security and privacy requirements

- Do not upload PDF files anywhere.
- Do not send document content to external services.
- Do not add telemetry, analytics, crash reporting, or tracking.
- Do not load runtime assets from CDN.
- Do not store signature images unless the user explicitly chooses to save them.
- Do not overwrite the original PDF unless the user explicitly confirms it.
- Prefer local-only processing.
- Keep Tauri permissions minimal.
- Treat PDFs as sensitive personal documents.
- Avoid adding dependencies that introduce networking, cloud sync, telemetry, or opaque binary behavior.

## Preferred stack

- Tauri for the desktop shell.
- React with TypeScript for the UI.
- PDF.js for PDF preview rendering.
- pdf-lib for PDF export/writing.
- Vite for frontend build tooling.
- Playwright/Vitest later for tests.

## Architecture rules

Keep the app modular. Separate these concerns:

- PDF viewer/rendering
- page navigation
- overlay state
- coordinate mapping
- signature pad
- stamp tools
- text tools
- PDF export engine
- local settings/storage
- Tauri permissions/security

Do not mix PDF rendering, UI state, and export logic in one large component.

## Development workflow

Before implementing a task:

1. Explain the implementation plan.
2. List the files that will be changed.
3. Keep changes small and reviewable.

After implementing a task:

1. Run typecheck.
2. Run tests if available.
3. Run build if relevant.
4. Summarize what changed.
5. Mention known limitations.

## MVP milestone order

### Milestone 1: PDF viewer

- scaffold Tauri + React + TypeScript app;
- open a local PDF file;
- render the first page;
- support basic page navigation;
- keep all processing local.

### Milestone 2: Overlay editor

- add overlay state model;
- add text overlay;
- add signature image overlay;
- drag and resize overlays;
- persist overlays in memory per page.

### Milestone 3: Export

- map screen coordinates to PDF page coordinates;
- export a new PDF with overlays embedded;
- verify position consistency between preview and export.

### Milestone 4: Security hardening

- restrict Tauri permissions;
- remove unused capabilities;
- verify no network calls;
- review dependencies;
- document privacy model.

## Testing focus

Always test:

- single-page PDF;
- multi-page PDF;
- portrait pages;
- landscape pages;
- different page sizes;
- transparent PNG signatures;
- exported PDF opened in standard PDF readers;
- overlay position consistency between preview and exported PDF.

## Code quality rules

- Use TypeScript types for domain state.
- Prefer pure functions for coordinate mapping.
- Keep PDF export deterministic and testable.
- Avoid hidden global state.
- Avoid large, multi-purpose components.
- Avoid premature digital-certificate signing features in the MVP.

## Current product scope

In scope:

- visual signatures;
- stamps;
- text overlays;
- local file open;
- export new PDF.

Out of scope for initial MVP:

- OCR;
- editing original PDF text content;
- cryptographic digital signatures;
- cloud sync;
- user accounts;
- online document storage.
