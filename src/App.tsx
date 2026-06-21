import { useState } from "react";
import "./App.css";
import {
  PdfFilePicker,
  type SelectedPdfFile,
} from "./components/pdf/PdfFilePicker";
import { PdfViewer } from "./components/pdf/PdfViewer";
import {
  addOverlay,
  createTextOverlay,
  getPageOverlays,
} from "./state/overlayState";
import type { OverlayPageState } from "./types/overlays";

function App() {
  const [selectedPdf, setSelectedPdf] = useState<SelectedPdfFile | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [overlayState, setOverlayState] = useState<OverlayPageState>({});

  const activePageOverlays = getPageOverlays(overlayState, activePageIndex);
  const canAddTextOverlay = selectedPdf !== null && isPdfReady;

  function handlePdfSelected(file: SelectedPdfFile) {
    setPickerError(null);
    setSelectedPdf(file);
    setIsPdfReady(false);
    setActivePageIndex(0);
    setOverlayState({});
  }

  function handlePickerError(message: string) {
    setPickerError(message);
    setSelectedPdf(null);
    setIsPdfReady(false);
    setActivePageIndex(0);
    setOverlayState({});
  }

  function handleAddTextOverlay() {
    if (!canAddTextOverlay) {
      return;
    }

    const textOverlay = createTextOverlay({ pageIndex: activePageIndex });
    setOverlayState((currentState) => addOverlay(currentState, textOverlay));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Milestone 2</p>
          <h1>PDF Overlay Editor</h1>
        </div>

        <PdfFilePicker
          onPdfSelected={handlePdfSelected}
          onError={handlePickerError}
        />

        <button
          type="button"
          onClick={handleAddTextOverlay}
          disabled={!canAddTextOverlay}
        >
          Add Text
        </button>

        <dl className="page-summary">
          <div>
            <dt>File</dt>
            <dd>{selectedPdf?.fileName ?? "None"}</dd>
          </div>
          <div>
            <dt>Processing</dt>
            <dd>Local only</dd>
          </div>
          <div>
            <dt>Active page</dt>
            <dd>{selectedPdf ? activePageIndex + 1 : "-"}</dd>
          </div>
          <div>
            <dt>Page overlays</dt>
            <dd>{selectedPdf ? activePageOverlays.length : "-"}</dd>
          </div>
        </dl>

        {pickerError ? <p className="error-message">{pickerError}</p> : null}
      </aside>

      <PdfViewer
        pdfFile={selectedPdf}
        pageIndex={activePageIndex}
        overlays={selectedPdf ? activePageOverlays : []}
        onPageIndexChange={setActivePageIndex}
        onDocumentReadyChange={setIsPdfReady}
      />
    </main>
  );
}

export default App;
