# Security Model

This app is designed for sensitive local PDF workflows. The current MVP runs as
an offline-first overlay editor: it renders a local PDF, keeps visual overlays in
memory, and exports a new PDF with those overlays embedded.

## Local-Only Processing

- PDF files are selected with the browser file picker and read as an
  `ArrayBuffer` in the client.
- PDF preview rendering uses PDF.js locally.
- PDF export uses pdf-lib locally.
- Signature images are selected with a local file picker, read as data URLs, and
  kept in memory only.
- Stamp presets are static local values.

## No Upload Guarantee

The app code does not call external APIs, upload document contents, or send
signature data to a service. There is no telemetry, analytics, crash reporting,
tracking SDK, account system, or cloud sync in the MVP.

Development mode uses the local Vite/Tauri development server. Packaged
application workflows are intended to use bundled app assets, not runtime CDN
assets.

## Storage and Persistence

- PDF bytes are not written to browser storage.
- Signature image data is not written to browser storage.
- Overlay state is stored only in React state.
- The app does not use `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or
  a backend database for document data.
- Export creates a new PDF download. The original PDF is not overwritten by app
  code.

## Tauri Permissions

The default Tauri capability grants only `core:default`. The app currently uses
browser file inputs and browser downloads instead of broad filesystem
permissions or a Tauri save dialog. Additional permissions should be added only
when a feature explicitly requires them and after review.

The runtime Content Security Policy restricts sources to bundled app assets,
data/blob images, local development connections, and workers needed for PDF.js.
No runtime CDN is required.

## Dependencies

Runtime dependencies are limited to the Tauri API, React, PDF.js, and pdf-lib.
These are used for the desktop shell, UI rendering, local PDF preview, and local
PDF export. Do not add dependencies that introduce cloud sync, telemetry,
tracking, or opaque document processing without a security review.

## Known Limitations

- Visual signatures are not cryptographic digital signatures.
- Export embeds visual overlays; it does not certify or cryptographically sign
  the PDF.
- OCR is not supported.
- Editing original PDF text content is not supported.
- Overlay state is in-memory only and is lost on reload.
- A future Tauri save dialog may require a narrowly scoped permission review.
