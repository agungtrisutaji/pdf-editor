---
name: pdf-editor-architecture
description: Use this skill when designing, implementing, or refactoring the offline PDF editor architecture, especially PDF viewer, overlay state, coordinate mapping, signature placement, stamp tools, and module boundaries.
---

# PDF Editor Architecture

## Core principle

This app is an offline PDF overlay editor, not a full PDF content editor.

The initial architecture must support:

- rendering PDF pages;
- placing overlays on pages;
- mapping viewport coordinates to PDF coordinates;
- exporting a new PDF with overlays embedded.

## Required module boundaries

Keep these concerns separate:

- PDF rendering
- overlay state
- coordinate mapping
- UI controls
- signature drawing/import
- stamp definitions
- PDF export
- local settings/storage
- Tauri permission/security config

## Recommended source layout

Use a structure like:

```text
src/
  app/
  components/
    pdf/
    toolbar/
    overlays/
  lib/
    pdf/
    coordinates/
    security/
  state/
  types/
