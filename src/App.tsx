import { useState } from "react";
import "./App.css";
import {
  PdfFilePicker,
  type SelectedPdfFile,
} from "./components/pdf/PdfFilePicker";
import { TextOverlayEditor } from "./components/overlays/TextOverlayEditor";
import { PdfViewer } from "./components/pdf/PdfViewer";
import {
  addOverlay,
  createTextOverlay,
  getPageOverlays,
  updateTextOverlayText,
} from "./state/overlayState";
import type { OverlayPageState, TextOverlay } from "./types/overlays";

function App() {
  const [selectedPdf, setSelectedPdf] = useState<SelectedPdfFile | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [overlayState, setOverlayState] = useState<OverlayPageState>({});
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(
    null,
  );

  const activePageOverlays = getPageOverlays(overlayState, activePageIndex);
  const selectedTextOverlay =
    activePageOverlays.find(
      (overlay): overlay is TextOverlay =>
        overlay.id === selectedOverlayId && overlay.type === "text",
    ) ?? null;
  const canAddTextOverlay = selectedPdf !== null && isPdfReady;

  function handlePdfSelected(file: SelectedPdfFile) {
    setPickerError(null);
    setSelectedPdf(file);
    setIsPdfReady(false);
    setActivePageIndex(0);
    setOverlayState({});
    setSelectedOverlayId(null);
  }

  function handlePickerError(message: string) {
    setPickerError(message);
    setSelectedPdf(null);
    setIsPdfReady(false);
    setActivePageIndex(0);
    setOverlayState({});
    setSelectedOverlayId(null);
  }

  function handleAddTextOverlay() {
    if (!canAddTextOverlay) {
      return;
    }

    const textOverlay = createTextOverlay({ pageIndex: activePageIndex });
    setOverlayState((currentState) => addOverlay(currentState, textOverlay));
    setSelectedOverlayId(textOverlay.id);
  }

  function handlePageIndexChange(pageIndex: number) {
    setActivePageIndex(pageIndex);
    setSelectedOverlayId(null);
  }

  function handleSelectedTextChange(text: string) {
    if (!selectedOverlayId) {
      return;
    }

    setOverlayState((currentState) =>
      updateTextOverlayText(currentState, selectedOverlayId, text),
    );
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

        <TextOverlayEditor
          overlay={selectedTextOverlay}
          onTextChange={handleSelectedTextChange}
        />

        {pickerError ? <p className="error-message">{pickerError}</p> : null}
      </aside>

      <PdfViewer
        pdfFile={selectedPdf}
        pageIndex={activePageIndex}
        overlays={selectedPdf ? activePageOverlays : []}
        selectedOverlayId={selectedOverlayId}
        onOverlaySelect={setSelectedOverlayId}
        onPageIndexChange={handlePageIndexChange}
        onDocumentReadyChange={setIsPdfReady}
      />
    </main>
  );
}

export default App;
