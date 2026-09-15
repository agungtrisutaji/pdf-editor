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
import {
  DEFAULT_PAGE_RENDER_SCALE,
  ZOOM_LEVELS,
  type PageSize,
} from "../../lib/pdf/coordinateMapper";
import type { Overlay } from "../../types/overlays";

type PdfViewerProps = {
  pdfFile: SelectedPdfFile | null;
  pageIndex: number;
  overlays: Overlay[];
  selectedOverlayId: string | null;
  zoomScale: number;
  onZoomChange: (scale: number) => void;
  onOverlaySelect: (overlayId: string) => void;
  onOverlayMove: (overlayId: string, position: { x: number; y: number }) => void;
  onOverlayResize: (
    overlayId: string,
    size: { width: number; height: number },
  ) => void;
  onPageIndexChange: (pageIndex: number) => void;
  onDocumentReadyChange: (isReady: boolean) => void;
  onPagePreviewSizeChange: (pageIndex: number, size: PageSize) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};


export function PdfViewer({
  pdfFile,
  pageIndex,
  overlays,
  selectedOverlayId,
  zoomScale,
  onZoomChange,
  onOverlaySelect,
  onOverlayMove,
  onOverlayResize,
  onPageIndexChange,
  onDocumentReadyChange,
  onPagePreviewSizeChange,
  isSidebarOpen,
  onToggleSidebar,
}: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  const pageNumber = pageIndex + 1;

  useEffect(() => {
    let isCurrentFile = true;
    let loadingTask: PDFDocumentLoadingTask | null = null;

    setPdfDocument(null);
    onDocumentReadyChange(false);
    setErrorMessage(null);
    clearPdfCanvas(canvasRef.current);

    if (!pdfFile) {
      return;
    }

    const activeLoadingTask = createPdfLoadingTask(pdfFile.data);
    loadingTask = activeLoadingTask;

    activeLoadingTask.promise
      .then((document) => {
        if (!isCurrentFile) {
          return;
        }

        setPdfDocument(document);
        onDocumentReadyChange(true);
      })
      .catch((error: unknown) => {
        if (!isCurrentFile) {
          return;
        }

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
      setErrorMessage("The PDF canvas is not available.");
      return;
    }

    setErrorMessage(null);

    renderPdfPageToCanvas({
      canvas: canvasRef.current,
      pdfDocument,
      pageNumber,
      scale: zoomScale,
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

          const canvas = canvasRef.current;
          if (canvas) {
            const bounds = canvas.getBoundingClientRect();
            const width =
              bounds.width || Number.parseFloat(canvas.style.width) || 0;
            const height =
              bounds.height || Number.parseFloat(canvas.style.height) || 0;

            if (width > 0 && height > 0) {
              onPagePreviewSizeChange(pageIndex, { width, height });
            }
          }
        }
      })
      .catch((error: unknown) => {
        if (!isCurrentRender || isPdfRenderCancelError(error)) {
          return;
        }

        setErrorMessage(getPdfErrorMessage(error));
      });

    return () => {
      isCurrentRender = false;
      renderTask?.cancel();
    };
  }, [onPagePreviewSizeChange, pageIndex, pdfDocument, pageNumber, zoomScale]);

  const totalPages = pdfDocument?.numPages ?? 0;
  const canGoPrevious = pageIndex > 0;
  const canGoNext = totalPages > 0 && pageIndex < totalPages - 1;

  const minZoom = ZOOM_LEVELS[0];
  const maxZoom = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  const zoomPercentage = Math.round(
    (zoomScale / DEFAULT_PAGE_RENDER_SCALE) * 100,
  );
  const canZoomIn = pdfFile !== null && zoomScale < maxZoom - 0.01;
  const canZoomOut = pdfFile !== null && zoomScale > minZoom + 0.01;
  const canResetZoom =
    pdfFile !== null &&
    Math.abs(zoomScale - DEFAULT_PAGE_RENDER_SCALE) > 0.01;

  function handleZoomIn() {
    const nextZoom =
      ZOOM_LEVELS.find((level) => level > zoomScale + 0.01) ?? maxZoom;
    onZoomChange(nextZoom);
  }

  function handleZoomOut() {
    const previousLevels = ZOOM_LEVELS.filter(
      (level) => level < zoomScale - 0.01,
    );
    const nextZoom =
      previousLevels.length > 0
        ? previousLevels[previousLevels.length - 1]
        : minZoom;
    onZoomChange(nextZoom);
  }

  function handleResetZoom() {
    onZoomChange(DEFAULT_PAGE_RENDER_SCALE);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleNativeWheel(e: WheelEvent) {
      if (e.ctrlKey) {
        e.preventDefault();
        
        if (e.deltaY < 0 && canZoomIn) {
          handleZoomIn();
        } else if (e.deltaY > 0 && canZoomOut) {
          handleZoomOut();
        }
      }
    }

    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleNativeWheel);
  }, [canZoomIn, canZoomOut, zoomScale, onZoomChange]);

  function handleStagePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return; // Only left click
    const container = containerRef.current;
    if (!container) return;

    // Prevent panning when clicking on the scrollbar
    const rect = container.getBoundingClientRect();
    if (
      e.clientX > rect.left + container.clientWidth ||
      e.clientY > rect.top + container.clientHeight
    ) {
      return;
    }

    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    };
    setIsPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleStagePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isPanning || !panStartRef.current || !containerRef.current) return;
    
    const deltaX = e.clientX - panStartRef.current.x;
    const deltaY = e.clientY - panStartRef.current.y;

    containerRef.current.scrollLeft = panStartRef.current.scrollLeft - deltaX;
    containerRef.current.scrollTop = panStartRef.current.scrollTop - deltaY;
  }

  function handleStagePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isPanning) return;
    setIsPanning(false);
    panStartRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <section className='viewer-panel' aria-label='PDF viewer'>
      <div className='viewer-toolbar' style={{ margin: '0 0 8px', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <button
            type='button'
            className='small-button'
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
            style={{
              padding: '6px 10px',
              fontSize: '1rem',
            }}>
            {isSidebarOpen ? '◀' : '☰'}
          </button>
          
          <div className='page-controls' aria-label='Page navigation'>
            <button
              type='button'
              className='small-button'
              onClick={() => onPageIndexChange(Math.max(0, pageIndex - 1))}
              disabled={!canGoPrevious}>
              Prev
            </button>
            <span style={{ minWidth: '70px', textAlign: 'center' }}>
              {totalPages > 0 ? `${pageNumber} / ${totalPages}` : '-'}
            </span>
            <button
              type='button'
              className='small-button'
              onClick={() =>
                onPageIndexChange(Math.min(totalPages - 1, pageIndex + 1))
              }
              disabled={!canGoNext}>
              Next
            </button>
          </div>
        </div>

        <div 
          style={{ 
            flex: '0 1 auto', 
            fontWeight: 600, 
            color: '#334155',
            fontSize: '0.9rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            padding: '0 16px',
            maxWidth: '40%'
          }}
          title={pdfFile?.fileName ?? 'No file selected'}
        >
          {pdfFile?.fileName ?? 'No file selected'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', flex: 1, minWidth: 0 }}>
          <div className='zoom-controls' aria-label='Zoom controls'>
            <button
              type='button'
              className='zoom-button'
              onClick={handleZoomOut}
              disabled={!canZoomOut}
              aria-label='Zoom out'
              title='Zoom out'>
              −
            </button>
            <button
              type='button'
              className='zoom-level-button'
              onClick={handleResetZoom}
              disabled={!canResetZoom}
              aria-label='Reset zoom to 100%'
              title='Click to reset zoom to 100%'>
              {zoomPercentage}%
            </button>
            <button
              type='button'
              className='zoom-button'
              onClick={handleZoomIn}
              disabled={!canZoomIn}
              aria-label='Zoom in'
              title='Zoom in'>
              +
            </button>
          </div>
        </div>
      </div>

      {errorMessage ? <p className='error-message'>{errorMessage}</p> : null}

      <div
        className={`canvas-stage${isPanning ? ' is-panning' : ''}`}
        ref={containerRef}
        onClick={(e) => {
          if (e.ctrlKey && canZoomIn) {
            handleZoomIn();
          }
        }}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
        onPointerLeave={handleStagePointerUp}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}>
        <div className='page-surface'>
          <canvas ref={canvasRef} className='pdf-canvas' />
          {pdfDocument ? (
            <OverlayLayer
              overlays={overlays}
              selectedOverlayId={selectedOverlayId}
              onOverlaySelect={onOverlaySelect}
              onOverlayMove={onOverlayMove}
              onOverlayResize={onOverlayResize}
            />
          ) : null}
        </div>
        {!pdfFile && (
          <div className='empty-state'>
            Choose a local PDF file to preview its pages.
          </div>
        )}
      </div>
    </section>
  );
}
