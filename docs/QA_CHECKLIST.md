# Manual QA Checklist

Run these checks before a release candidate.

## Build

- Run `pnpm typecheck`.
- Run `pnpm build`.
- Run `pnpm tauri dev`.

## PDF Viewer

- Open a single-page local PDF.
- Open a multi-page local PDF.
- Open portrait and landscape PDFs.
- Verify page navigation works.
- Verify invalid non-PDF files are rejected.

## Overlays

- Add a text overlay.
- Edit text overlay contents.
- Import a transparent PNG signature.
- Import a JPG/JPEG signature.
- Add each stamp preset.
- Drag overlays.
- Resize overlays.
- Reorder overlays forward and backward.
- Delete overlays.
- Verify overlays appear only on their own page.
- Reload the app and verify overlay state is cleared.

## Export

- Export a PDF with no overlays.
- Export a PDF with text, signature, and stamp overlays.
- Export a multi-page PDF with overlays on more than one page.
- Open the exported PDF in a standard PDF reader.
- Verify the original PDF file is unchanged.
- Verify transparent PNG signatures remain readable.
- Verify signature aspect ratio is not stretched.
- Verify overlay positions and sizes are close to preview.
- Verify z-order matches the overlay list order.

## Privacy and Security

- Verify there are no network calls during normal open/edit/export workflow.
- Verify there is no telemetry, analytics, crash reporting, or tracking.
- Verify there is no runtime CDN dependency.
- Verify PDF bytes, signature images, and overlays are not stored in
  `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or a backend.
- Review `src-tauri/capabilities/default.json` for minimal permissions.
