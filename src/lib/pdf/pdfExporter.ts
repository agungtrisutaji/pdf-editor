import {
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import type { Overlay, OverlayPageState } from "../../types/overlays";
import {
  getPageScale,
  mapPreviewRectToPdfRect,
  type PageSize,
  type PdfRect,
} from "./coordinateMapper";

type ExportPdfWithOverlaysInput = {
  pdfData: ArrayBuffer;
  overlayState: OverlayPageState;
  previewPageSizes: Record<number, PageSize>;
};

type EmbeddedFonts = {
  helvetica: PDFFont;
  helveticaBold: PDFFont;
};

export async function exportPdfWithOverlays({
  pdfData,
  overlayState,
  previewPageSizes,
}: ExportPdfWithOverlaysInput): Promise<Uint8Array> {
  const pdfDocument = await PDFDocument.load(pdfData.slice(0));
  const fonts: EmbeddedFonts = {
    helvetica: await pdfDocument.embedFont(StandardFonts.Helvetica),
    helveticaBold: await pdfDocument.embedFont(StandardFonts.HelveticaBold),
  };

  for (const [pageIndexText, overlays] of Object.entries(overlayState)) {
    const pageIndex = Number(pageIndexText);

    if (!Number.isInteger(pageIndex) || overlays.length === 0) {
      continue;
    }

    const page = pdfDocument.getPage(pageIndex);
    const previewPageSize = previewPageSizes[pageIndex];

    if (!previewPageSize) {
      throw new Error(
        `Page ${pageIndex + 1} needs to be rendered before export.`,
      );
    }

    const pdfPageSize = page.getSize();

    for (const overlay of overlays) {
      const rect = mapPreviewRectToPdfRect({
        rect: overlay,
        previewPageSize,
        pdfPageSize,
      });

      if (overlay.type === "text") {
        drawTextOverlay({
          overlay,
          page,
          rect,
          previewPageSize,
          pdfPageSize,
          font: fonts.helvetica,
        });
        continue;
      }

      if (overlay.type === "signature") {
        const image = await embedSignatureImage(pdfDocument, overlay.imageDataUrl);
        page.drawImage(image, {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          opacity: overlay.opacity,
        });
        continue;
      }

      drawStampOverlay({
        overlay,
        page,
        rect,
        font: fonts.helveticaBold,
      });
    }
  }

  return pdfDocument.save();
}

function drawTextOverlay({
  overlay,
  page,
  rect,
  previewPageSize,
  pdfPageSize,
  font,
}: {
  overlay: Extract<Overlay, { type: "text" }>;
  page: PDFPage;
  rect: PdfRect;
  previewPageSize: PageSize;
  pdfPageSize: PageSize;
  font: PDFFont;
}) {
  const { scaleY } = getPageScale({ previewPageSize, pdfPageSize });
  const fontSize = Math.max(1, overlay.fontSize * scaleY);
  const topAlignedY = rect.y + Math.max(0, rect.height - fontSize * 1.15);

  page.drawText(overlay.text, {
    x: rect.x,
    y: topAlignedY,
    size: fontSize,
    font,
    color: parseHexColor(overlay.color),
    maxWidth: rect.width,
  });
}

function drawStampOverlay({
  overlay,
  page,
  rect,
  font,
}: {
  overlay: Extract<Overlay, { type: "stamp" }>;
  page: PDFPage;
  rect: PdfRect;
  font: PDFFont;
}) {
  const color = parseHexColor(overlay.color);
  const borderWidth = Math.max(1.2, Math.min(rect.width, rect.height) * 0.04);
  const fontSize = Math.max(8, Math.min(rect.height * 0.42, rect.width / 9));
  const textWidth = font.widthOfTextAtSize(overlay.label, fontSize);
  const textX = rect.x + Math.max(0, (rect.width - textWidth) / 2);
  const textY = rect.y + Math.max(0, (rect.height - fontSize) / 2);

  page.drawRectangle({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    borderColor: color,
    borderWidth,
    color: rgb(1, 1, 1),
    opacity: 0.12,
    borderOpacity: 0.95,
  });
  page.drawText(overlay.label, {
    x: textX,
    y: textY,
    size: fontSize,
    font,
    color,
    maxWidth: rect.width,
  });
}

async function embedSignatureImage(
  pdfDocument: PDFDocument,
  imageDataUrl: string,
) {
  const { mimeType, bytes } = parseImageDataUrl(imageDataUrl);

  if (mimeType === "image/png") {
    return pdfDocument.embedPng(bytes);
  }

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return pdfDocument.embedJpg(bytes);
  }

  throw new Error("Signature image must be a PNG or JPG file.");
}

function parseImageDataUrl(imageDataUrl: string): {
  mimeType: string;
  bytes: Uint8Array;
} {
  const match = /^data:(image\/(?:png|jpeg|jpg));base64,(.+)$/i.exec(
    imageDataUrl,
  );

  if (!match) {
    throw new Error("Signature image data is not supported.");
  }

  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return {
    mimeType: match[1].toLowerCase(),
    bytes,
  };
}

function parseHexColor(value: string): RGB {
  const normalizedValue = value.trim();
  const shortMatch = /^#([0-9a-f]{3})$/i.exec(normalizedValue);
  const longMatch = /^#([0-9a-f]{6})$/i.exec(normalizedValue);

  if (shortMatch) {
    const [, hex] = shortMatch;
    return rgb(
      Number.parseInt(hex[0] + hex[0], 16) / 255,
      Number.parseInt(hex[1] + hex[1], 16) / 255,
      Number.parseInt(hex[2] + hex[2], 16) / 255,
    );
  }

  if (longMatch) {
    const [, hex] = longMatch;
    return rgb(
      Number.parseInt(hex.slice(0, 2), 16) / 255,
      Number.parseInt(hex.slice(2, 4), 16) / 255,
      Number.parseInt(hex.slice(4, 6), 16) / 255,
    );
  }

  return rgb(0, 0, 0);
}
