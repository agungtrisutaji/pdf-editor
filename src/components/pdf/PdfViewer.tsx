import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";
import type { SelectedPdfFile } from "./PdfFilePicker";
import { OverlayLayer } from "../overlays/OverlayLayer";
import {
  clearPdfCanvas,
  createPdfLoadingTask,
  getPdfErrorMessage,
  isPdfRenderCancelError,
  renderPdfPageToCanvas,
} from "../../lib/pdf/pdfRenderer";
import type { Overlay } from "../../types/overlays";

type PdfViewerProps = {
  pdfFile: SelectedPdfFile | null;
  pageIndex: number;
  overlays: Overlay[];
  onPageIndexChange: (pageIndex: number) => void;
  onDocumentReadyChange: (isReady: boolean) => void;
};

type LoadStatus = "idle" | "loading" | "ready" | "error";
type RenderStatus = "idle" | "rendering" | "ready" | "error";

export function PdfViewer({
  pdfFile,
  pageIndex,
  overlays,
  onPageIndexChange,
  onDocumentReadyChange,
}: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [renderStatus, setRenderStatus] = useState<RenderStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pageNumber = pageIndex + 1;

  useEffect(() => {
    let isCurrentFile = true;
    let loadingTask: PDFDocumentLoadingTask | null = null;

    setPdfDocument(null);
    onDocumentReadyChange(false);
    setErrorMessage(null);
    clearPdfCanvas(canvasRef.current);

    if (!pdfFile) {
      setLoadStatus("idle");
      setRenderStatus("idle");
      return;
    }

    setLoadStatus("loading");
    setRenderStatus("idle");
    loadingTask = createPdfLoadingTask(pdfFile.data);

    loadingTask.promise
      .then((document) => {
        if (!isCurrentFile) {
          return;
        }

        setPdfDocument(document);
        setLoadStatus("ready");
        onDocumentReadyChange(true);
      })
      .catch((error: unknown) => {
        if (!isCurrentFile) {
          return;
        }

        setLoadStatus("error");
        onDocumentReadyChange(false);
        setErrorMessage(getPdfErrorMessage(error));
      });

    return () => {
      isCurrentFile = false;
      if (loadingTask) {
        void loadingTask.destroy();
      }
    };
  }, [onDocumentReadyChange, pdfFile]);

  useEffect(() => {
    let isCurrentRender = true;
    let renderTask:
      | Awaited<ReturnType<typeof renderPdfPageToCanvas>>
      | null = null;

    if (!pdfDocument) {
      return;
    }

    if (!canvasRef.current) {
      setRenderStatus("error");
      setErrorMessage("The PDF canvas is not available.");
      return;
    }

    setRenderStatus("rendering");
    setErrorMessage(null);

    renderPdfPageToCanvas({
      canvas: canvasRef.current,
      pdfDocument,
      pageNumber,
    })
      .then((task) => {
        if (!isCurrentRender) {
          task.cancel();
          return;
        }

        renderTask = task;
        return task.promise;
      })
      .then(() => {
        if (isCurrentRender) {
          setRenderStatus("ready");
        }
      })
      .catch((error: unknown) => {
        if (!isCurrentRender || isPdfRenderCancelError(error)) {
          return;
        }

        setRenderStatus("error");
        setErrorMessage(getPdfErrorMessage(error));
      });

    return () => {
      isCurrentRender = false;
      renderTask?.cancel();
    };
  }, [pdfDocument, pageNumber]);

  const totalPages = pdfDocument?.numPages ?? 0;
  const canGoPrevious = pageIndex > 0;
  const canGoNext = totalPages > 0 && pageIndex < totalPages - 1;
  const statusText =
    loadStatus === "loading"
      ? "Loading PDF..."
      : loadStatus === "error"
        ? "Could not open PDF"
      : renderStatus === "rendering"
        ? "Rendering page..."
        : renderStatus === "error"
          ? "Page render failed"
        : loadStatus === "ready"
          ? "Ready"
          : "No PDF selected";

  return (
    <section className="viewer-panel" aria-label="PDF viewer">
      <div className="viewer-toolbar">
        <div>
          <p className="eyebrow">Local PDF Viewer</p>
          <h1>{pdfFile?.fileName ?? "No file selected"}</h1>
        </div>

        <div className="page-controls" aria-label="Page navigation">
          <button
            type="button"
            onClick={() => onPageIndexChange(Math.max(0, pageIndex - 1))}
            disabled={!canGoPrevious}
          >
            Previous
          </button>
          <span>
            Page {totalPages > 0 ? pageNumber : "-"} of{" "}
            {totalPages > 0 ? totalPages : "-"}
          </span>
          <button
            type="button"
            onClick={() =>
              onPageIndexChange(Math.min(totalPages - 1, pageIndex + 1))
            }
            disabled={!canGoNext}
          >
            Next
          </button>
        </div>
      </div>

      <div className="viewer-meta" role="status" aria-live="polite">
        <span>{statusText}</span>
        {pdfFile ? <span>{pdfFile.fileName}</span> : null}
        {totalPages > 0 ? <span>{totalPages} pages</span> : null}
      </div>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      <div className="canvas-stage">
        <div className="page-surface">
          <canvas ref={canvasRef} className="pdf-canvas" />
          {pdfDocument ? <OverlayLayer overlays={overlays} /> : null}
        </div>
        {!pdfFile && (
          <div className="empty-state">
            Choose a local PDF file to preview its pages.
          </div>
        )}
      </div>
    </section>
  );
}
