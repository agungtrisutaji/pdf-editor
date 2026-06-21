---
name: pdf-export-engine
description: Use this skill when implementing or debugging PDF export, coordinate mapping, image embedding, text drawing, stamp rendering, page transforms, and multi-page overlay persistence.
---

# PDF Export Engine

## Goal

Export a new PDF where visual overlays appear in the same position as the preview.

## Required concepts

The export engine must handle:

- page width and height;
- render scale;
- viewport coordinates;
- PDF coordinates;
- PDF coordinate origin differences;
- per-page overlays;
- image dimensions;
- text size;
- stamp rectangles;
- portrait and landscape pages.

## Implementation rules

- Use pure functions for coordinate mapping.
- Keep overlay data independent from React component state shape.
- Store page number explicitly.
- Store overlay type explicitly.
- Do not overwrite the original PDF by default.
- Export into a new file path.
- Validate with at least one portrait and one landscape PDF.

## Overlay model

Prefer a domain model like:

```ts
type Overlay =
  | SignatureOverlay
  | TextOverlay
  | StampOverlay;

type BaseOverlay = {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};
