# PDF Editor

Secure offline desktop PDF editor for local PDF preview, visual overlays, and
exporting a new annotated PDF.

The app is an overlay-based editor. It does not edit original PDF text content
and it does not create cryptographic digital signatures.

## Development

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm tauri dev
```

## Privacy & Security

- PDF files are opened from the local device and processed in the app.
- PDF contents, signature images, and overlay data are not uploaded.
- Overlay state is kept in memory and is cleared when the app reloads or a new
  PDF is selected.
- Signature images are read into memory only for preview/export.
- Export creates a new PDF download and does not overwrite the original file.
- The MVP does not include telemetry, analytics, crash reporting, account login,
  cloud sync, OCR, or certificate-based digital signing.

See [docs/SECURITY.md](docs/SECURITY.md) for the detailed security model and
[docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md) for manual release checks.

## Known Limitations

- Visual signatures are not cryptographic digital signatures.
- Original PDF text content is not editable.
- OCR is not supported.
- Overlay state is not persisted after reload.
- Export embeds visual overlays into a new PDF; it does not certify or seal the
  document.
