import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { renderPdfPageToCanvas } from "../../lib/pdf/pdfRenderer";

type PdfThumbnailItemProps = {
  pdfDocument: PDFDocumentProxy;
  pageIndex: number;
  isActive: boolean;
  onClick: (pageIndex: number) => void;
};

function PdfThumbnailItem({
  pdfDocument,
  pageIndex,
  isActive,
  onClick,
}: PdfThumbnailItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !canvasRef.current || !pdfDocument) return;

    let isCurrent = true;
    let renderTask: Awaited<ReturnType<typeof renderPdfPageToCanvas>> | null = null;

    renderPdfPageToCanvas({
      canvas: canvasRef.current,
      pdfDocument,
      pageNumber: pageIndex + 1,
      scale: 0.2, // Small scale for thumbnail
    })
      .then((task) => {
        if (!isCurrent) {
          task.cancel();
          return;
        }
        renderTask = task;
        return task.promise;
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
      renderTask?.cancel();
    };
  }, [isVisible, pdfDocument, pageIndex]);

  return (
    <div
      id={`thumbnail-item-${pageIndex}`}
      ref={containerRef}
      className={`thumbnail-item ${isActive ? "is-active" : ""}`}
      onClick={() => onClick(pageIndex)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(pageIndex);
        }
      }}
    >
      <canvas ref={canvasRef} className="thumbnail-canvas" />
      <span className="thumbnail-label">{pageIndex + 1}</span>
    </div>
  );
}

type PdfThumbnailsProps = {
  pdfDocument: PDFDocumentProxy;
  totalPages: number;
  activePageIndex: number;
  onThumbnailClick: (pageIndex: number) => void;
};

export function PdfThumbnails({
  pdfDocument,
  totalPages,
  activePageIndex,
  onThumbnailClick,
}: PdfThumbnailsProps) {
  useEffect(() => {
    const activeThumbnail = document.getElementById(`thumbnail-item-${activePageIndex}`);
    if (activeThumbnail) {
      activeThumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activePageIndex]);

  return (
    <div className="thumbnails-sidebar">
      {Array.from({ length: totalPages }).map((_, index) => (
        <PdfThumbnailItem
          key={index}
          pageIndex={index}
          pdfDocument={pdfDocument}
          isActive={index === activePageIndex}
          onClick={onThumbnailClick}
        />
      ))}
    </div>
  );
}
