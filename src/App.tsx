import { useState } from "react";
import "./App.css";
import {
  PdfFilePicker,
  type SelectedPdfFile,
} from "./components/pdf/PdfFilePicker";
import { OverlayList } from "./components/overlays/OverlayList";
import { SignatureImagePicker } from "./components/overlays/SignatureImagePicker";
import { TextOverlayEditor } from "./components/overlays/TextOverlayEditor";
import { PdfViewer } from "./components/pdf/PdfViewer";
import {
  addOverlay,
  createSignatureOverlay,
  createTextOverlay,
  deleteOverlay,
  getPageOverlays,
  moveOverlayBackward,
  moveOverlayForward,
  updateOverlayPosition,
  updateOverlaySize,
  updateTextOverlayText,
} from "./state/overlayState";
import type { OverlayPageState } from "./types/overlays";

const TEXT_OVERLAY_BASE_POSITION = 96;
const TEXT_OVERLAY_OFFSET_STEP = 24;
const TEXT_OVERLAY_MAX_OFFSET = 240;
const SIGNATURE_OVERLAY_BASE_X = 96;
const SIGNATURE_OVERLAY_BASE_Y = 140;
const SIGNATURE_OVERLAY_OFFSET_STEP = 24;
const SIGNATURE_OVERLAY_MAX_OFFSET = 240;

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
  const selectedOverlay =
    activePageOverlays.find(
      (overlay) => overlay.id === selectedOverlayId,
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

    const offset = Math.min(
      activePageOverlays.length * TEXT_OVERLAY_OFFSET_STEP,
      TEXT_OVERLAY_MAX_OFFSET,
    );
    const textOverlay = createTextOverlay({
      pageIndex: activePageIndex,
      x: TEXT_OVERLAY_BASE_POSITION + offset,
      y: TEXT_OVERLAY_BASE_POSITION + offset,
    });
    setOverlayState((currentState) => addOverlay(currentState, textOverlay));
    setSelectedOverlayId(textOverlay.id);
  }

  function handleSignatureSelected(imageDataUrl: string) {
    if (!canAddTextOverlay) {
      return;
    }

    const offset = Math.min(
      activePageOverlays.length * SIGNATURE_OVERLAY_OFFSET_STEP,
      SIGNATURE_OVERLAY_MAX_OFFSET,
    );
    const signatureOverlay = createSignatureOverlay({
      pageIndex: activePageIndex,
      imageDataUrl,
      x: SIGNATURE_OVERLAY_BASE_X + offset,
      y: SIGNATURE_OVERLAY_BASE_Y + offset,
    });
    setOverlayState((currentState) =>
      addOverlay(currentState, signatureOverlay),
    );
    setSelectedOverlayId(signatureOverlay.id);
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

  function handleOverlayDelete(overlayId: string) {
    setOverlayState((currentState) => deleteOverlay(currentState, overlayId));

    if (selectedOverlayId === overlayId) {
      setSelectedOverlayId(null);
    }
  }

  function handleOverlayMoveForward(overlayId: string) {
    setOverlayState((currentState) =>
      moveOverlayForward(currentState, activePageIndex, overlayId),
    );
    setSelectedOverlayId(overlayId);
  }

  function handleOverlayMoveBackward(overlayId: string) {
    setOverlayState((currentState) =>
      moveOverlayBackward(currentState, activePageIndex, overlayId),
    );
    setSelectedOverlayId(overlayId);
  }

  function handleOverlayPositionChange(
    overlayId: string,
    position: { x: number; y: number },
  ) {
    setOverlayState((currentState) =>
      updateOverlayPosition(currentState, overlayId, position),
    );
  }

  function handleOverlaySizeChange(
    overlayId: string,
    size: { width: number; height: number },
  ) {
    setOverlayState((currentState) =>
      updateOverlaySize(currentState, overlayId, size),
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

        <SignatureImagePicker
          disabled={!canAddTextOverlay}
          onSignatureSelected={handleSignatureSelected}
        />

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

        <OverlayList
          overlays={selectedPdf ? activePageOverlays : []}
          selectedOverlayId={selectedOverlayId}
          onOverlaySelect={setSelectedOverlayId}
          onOverlayDelete={handleOverlayDelete}
          onOverlayMoveForward={handleOverlayMoveForward}
          onOverlayMoveBackward={handleOverlayMoveBackward}
        />

        <TextOverlayEditor
          overlay={selectedOverlay}
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
        onOverlayMove={handleOverlayPositionChange}
        onOverlayResize={handleOverlaySizeChange}
        onPageIndexChange={handlePageIndexChange}
        onDocumentReadyChange={setIsPdfReady}
      />
    </main>
  );
}

export default App;
