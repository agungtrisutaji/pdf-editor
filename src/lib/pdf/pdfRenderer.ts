import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
  type RenderTask,
} from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const DEFAULT_PAGE_RENDER_SCALE = 1.4;

export function createPdfLoadingTask(
  data: ArrayBuffer,
): PDFDocumentLoadingTask {
  return getDocument({ data: data.slice(0) });
}

type RenderPdfPageInput = {
  canvas: HTMLCanvasElement;
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  scale?: number;
};

export async function renderPdfPageToCanvas({
  canvas,
  pdfDocument,
  pageNumber,
  scale = DEFAULT_PAGE_RENDER_SCALE,
}: RenderPdfPageInput): Promise<RenderTask> {
  const page = await pdfDocument.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas rendering is not available in this window.");
  }

  const outputScale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
  context.clearRect(0, 0, viewport.width, viewport.height);

  return page.render({
    canvas,
    canvasContext: context,
    viewport,
  });
}

export function clearPdfCanvas(canvas: HTMLCanvasElement | null): void {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }
  canvas.removeAttribute("width");
  canvas.removeAttribute("height");
  canvas.style.removeProperty("width");
  canvas.style.removeProperty("height");
}

export function isPdfRenderCancelError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "RenderingCancelledException" ||
      error.message.toLowerCase().includes("cancel"))
  );
}

export function getPdfErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "InvalidPDFException") {
      return "The selected file is not a valid PDF.";
    }

    if (error.name === "PasswordException") {
      return "This PDF is password protected and cannot be opened yet.";
    }

    return error.message || "The PDF could not be opened.";
  }

  return "The PDF could not be opened.";
}
