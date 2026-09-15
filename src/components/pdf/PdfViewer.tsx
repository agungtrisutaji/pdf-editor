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
import { PdfThumbnails } from "./PdfThumbnails";

type PdfPageProps = {
  pdfDocument: PDFDocumentProxy;
  pageIndex: number;
  zoomScale: number;
  displayScale: number;
  overlays: Overlay[];
  selectedOverlayId: string | null;
  onOverlaySelect: (overlayId: string) => void;
  onOverlayMove: (overlayId: string, position: { x: number; y: number }) => void;
  onOverlayResize: (overlayId: string, size: { width: number; height: number }) => void;
  onPagePreviewSizeChange: (pageIndex: number, size: PageSize) => void;
  onVisible?: (pageIndex: number) => void;
};

function PdfPage({
  pdfDocument,
  pageIndex,
  zoomScale,
  displayScale,
  overlays,
  selectedOverlayId,
  onOverlaySelect,
  onOverlayMove,
  onOverlayResize,
  onPagePreviewSizeChange,
  onVisible,
}: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [baseSize, setBaseSize] = useState<PageSize | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  // 1. Fetch metadata (viewport geometry) independently of raster rendering
  useEffect(() => {
    let isCurrent = true;
    
    pdfDocument.getPage(pageIndex + 1)
      .then((page) => {
        if (!isCurrent) return;
        const viewport = page.getViewport({ scale: DEFAULT_PAGE_RENDER_SCALE });
        const size = { width: viewport.width, height: viewport.height };
        setBaseSize(size);
        onPagePreviewSizeChange(pageIndex, size);
      })
      .catch((error) => {
        console.error("Failed to load page metadata", error);
      });

    return () => {
      isCurrent = false;
    };
  }, [pdfDocument, pageIndex, onPagePreviewSizeChange]);

  // 2. Setup overscan observer for lazy rendering
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const root = el.closest('.canvas-stage');
    const observer = new IntersectionObserver(
      (entries) => {
        setShouldRender(entries[0].isIntersecting);
      },
      { root, rootMargin: "2000px 0px 2000px 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 3. Render or clear canvas based on shouldRender state
  useEffect(() => {
    if (!shouldRender || !baseSize) {
      if (canvasRef.current) {
        clearPdfCanvas(canvasRef.current);
      }
      return;
    }

    let isCurrentRender = true;
    let renderTask: Awaited<ReturnType<typeof renderPdfPageToCanvas>> | null = null;

    if (!canvasRef.current) return;

    renderPdfPageToCanvas({
      canvas: canvasRef.current,
      pdfDocument,
      pageNumber: pageIndex + 1,
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
      .catch((error: unknown) => {
        if (!isCurrentRender || isPdfRenderCancelError(error)) return;
        console.error("Page render failed:", error);
      });

    return () => {
      isCurrentRender = false;
      renderTask?.cancel();
    };
  }, [shouldRender, baseSize, pageIndex, pdfDocument, zoomScale]);

  // 4. Setup active page observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onVisible) return;
    
    const root = el.closest('.canvas-stage');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onVisible(pageIndex);
        }
      },
      { root, rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pageIndex, onVisible]);

  const pageOverlays = overlays.filter((o) => o.pageIndex === pageIndex);

  const displayWidth = baseSize ? baseSize.width * displayScale : undefined;
  const displayHeight = baseSize ? baseSize.height * displayScale : undefined;
  
  const containerStyle = baseSize ? {
    width: displayWidth,
    height: displayHeight,
    marginBottom: '24px'
  } : {
    width: 800 * displayScale, // fallback before metadata
    height: 1000 * displayScale,
    marginBottom: '24px'
  };

  return (
    <div id={`pdf-page-${pageIndex}`} ref={containerRef} className='page-surface' style={containerStyle}>
      <canvas ref={canvasRef} className='pdf-canvas' />
      <OverlayLayer
        overlays={pageOverlays}
        displayScale={displayScale}
        selectedOverlayId={selectedOverlayId}
        onOverlaySelect={onOverlaySelect}
        onOverlayMove={onOverlayMove}
        onOverlayResize={onOverlayResize}
      />
    </div>
  );
}

type PdfViewerProps = {
  pdfFile: SelectedPdfFile | null;
  activePageIndex: number;
  overlays: Overlay[];
  selectedOverlayId: string | null;
  zoomScale: number;
  displayScale: number;
  onZoomChange: (scale: number) => void;
  onOverlaySelect: (overlayId: string) => void;
  onOverlayMove: (overlayId: string, position: { x: number; y: number }) => void;
  onOverlayResize: (
    overlayId: string,
    size: { width: number; height: number },
  ) => void;
  onDocumentReadyChange: (isReady: boolean) => void;
  onPagePreviewSizeChange: (pageIndex: number, size: PageSize) => void;
  onPageIndexChange: (pageIndex: number) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};


export function PdfViewer({
  pdfFile,
  activePageIndex,
  overlays,
  selectedOverlayId,
  zoomScale,
  displayScale,
  onZoomChange,
  onOverlaySelect,
  onOverlayMove,
  onOverlayResize,
  onDocumentReadyChange,
  onPagePreviewSizeChange,
  onPageIndexChange,
  isSidebarOpen,
  onToggleSidebar,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  function handleThumbnailClick(pageIndex: number) {
    const el = document.getElementById(`pdf-page-${pageIndex}`);
    const container = containerRef.current;
    if (el && container) {
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scrollPos = Math.max(0, container.scrollTop + (elRect.top - containerRect.top) - 24);
      
      container.scrollTo({
        top: scrollPos,
        behavior: 'smooth'
      });
    }
  }

  useEffect(() => {
    let isCurrentFile = true;
    let loadingTask: PDFDocumentLoadingTask | null = null;

    setPdfDocument(null);
    onDocumentReadyChange(false);
    setErrorMessage(null);

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

  const totalPages = pdfDocument?.numPages ?? 0;

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

    // Check if clicked on an overlay or thumbnails sidebar, if so, do not pan
    if ((e.target as HTMLElement).closest('.pdf-overlay') || (e.target as HTMLElement).closest('.thumbnails-sidebar')) return;

    // Check if clicked on a scrollbar
    const isClickOnVerticalScrollbar = e.clientX >= container.getBoundingClientRect().right - container.offsetWidth + container.clientWidth;
    const isClickOnHorizontalScrollbar = e.clientY >= container.getBoundingClientRect().bottom - container.offsetHeight + container.clientHeight;
    
    if (isClickOnVerticalScrollbar || isClickOnHorizontalScrollbar) return;

    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    };
    
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
      <div className='viewer-toolbar'>
        <div className='viewer-toolbar-left'>
          <button
            type='button'
            className='small-button icon-toggle-button'
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}>
            {isSidebarOpen ? '◀' : '☰'}
          </button>
          {pdfDocument && (
            <button
              type='button'
              className='small-button icon-toggle-button'
              onClick={() => setIsThumbnailsOpen(!isThumbnailsOpen)}
              title={isThumbnailsOpen ? 'Close Thumbnails' : 'Open Thumbnails'}>
              {isThumbnailsOpen ? '▤' : '▦'}
            </button>
          )}
        </div>

        <div className='viewer-toolbar-title' title={pdfFile?.fileName ?? 'No file selected'}>
          {pdfFile?.fileName ?? 'No file selected'}
        </div>

        <div className='viewer-toolbar-right'>
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

      <div className='viewer-workspace'>
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
          
          <div className="pdf-pages-stack">
            {pdfDocument ? (
              Array.from({ length: totalPages }).map((_, index) => (
                <PdfPage
                  key={index}
                  pageIndex={index}
                  pdfDocument={pdfDocument}
                  zoomScale={zoomScale}
                  displayScale={displayScale}
                  overlays={overlays}
                  selectedOverlayId={selectedOverlayId}
                  onOverlaySelect={onOverlaySelect}
                  onOverlayMove={onOverlayMove}
                  onOverlayResize={onOverlayResize}
                  onPagePreviewSizeChange={onPagePreviewSizeChange}
                  onVisible={onPageIndexChange}
                />
              ))
            ) : (
              <div className='empty-state' style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                Choose a local PDF file to preview its pages.
              </div>
            )}
          </div>
        </div>

        {isThumbnailsOpen && pdfDocument && (
          <PdfThumbnails
            pdfDocument={pdfDocument}
            totalPages={totalPages}
            activePageIndex={activePageIndex}
            onThumbnailClick={handleThumbnailClick}
          />
        )}
      </div>
    </section>
  );
}
