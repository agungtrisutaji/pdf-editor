import {
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import type {
  Overlay,
  OverlayPageState,
  TextFontFamily,
} from "../../types/overlays";
import {
  TEXT_OVERLAY_BASELINE_FACTOR,
  TEXT_OVERLAY_BORDER_WIDTH,
  TEXT_OVERLAY_HORIZONTAL_PADDING,
  TEXT_OVERLAY_VERTICAL_PADDING,
} from "../text/textOverlayMetrics";
import {
  fitRectContain,
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
  courier: PDFFont;
  courierBold: PDFFont;
  courierBoldOblique: PDFFont;
  courierOblique: PDFFont;
  helvetica: PDFFont;
  helveticaBold: PDFFont;
  helveticaBoldOblique: PDFFont;
  helveticaOblique: PDFFont;
  timesRoman: PDFFont;
  timesRomanBold: PDFFont;
  timesRomanBoldItalic: PDFFont;
  timesRomanItalic: PDFFont;
};

export async function exportPdfWithOverlays({
  pdfData,
  overlayState,
  previewPageSizes,
}: ExportPdfWithOverlaysInput): Promise<Uint8Array> {
  const pdfDocument = await PDFDocument.load(pdfData.slice(0));
  const fonts: EmbeddedFonts = {
    courier: await pdfDocument.embedFont(StandardFonts.Courier),
    courierBold: await pdfDocument.embedFont(StandardFonts.CourierBold),
    courierBoldOblique: await pdfDocument.embedFont(
      StandardFonts.CourierBoldOblique,
    ),
    courierOblique: await pdfDocument.embedFont(StandardFonts.CourierOblique),
    helvetica: await pdfDocument.embedFont(StandardFonts.Helvetica),
    helveticaBold: await pdfDocument.embedFont(StandardFonts.HelveticaBold),
    helveticaBoldOblique: await pdfDocument.embedFont(
      StandardFonts.HelveticaBoldOblique,
    ),
    helveticaOblique: await pdfDocument.embedFont(
      StandardFonts.HelveticaOblique,
    ),
    timesRoman: await pdfDocument.embedFont(StandardFonts.TimesRoman),
    timesRomanBold: await pdfDocument.embedFont(StandardFonts.TimesRomanBold),
    timesRomanBoldItalic: await pdfDocument.embedFont(
      StandardFonts.TimesRomanBoldItalic,
    ),
    timesRomanItalic: await pdfDocument.embedFont(
      StandardFonts.TimesRomanItalic,
    ),
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
          fonts,
        });
        continue;
      }

      if (overlay.type === "signature") {
        const image = await embedSignatureImage(
          pdfDocument,
          overlay.imageDataUrl,
        );
        const fittedRect = fitRectContain({
          containerWidth: rect.width,
          containerHeight: rect.height,
          contentAspectRatio: getSignatureAspectRatio(overlay),
        });

        page.drawImage(image, {
          x: rect.x + fittedRect.xOffset,
          y: rect.y + fittedRect.yOffset,
          width: fittedRect.width,
          height: fittedRect.height,
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
  fonts,
}: {
  overlay: Extract<Overlay, { type: "text" }>;
  page: PDFPage;
  rect: PdfRect;
  previewPageSize: PageSize;
  pdfPageSize: PageSize;
  fonts: EmbeddedFonts;
}) {
  const { scaleX, scaleY } = getPageScale({ previewPageSize, pdfPageSize });
  const font = getTextOverlayFont({
    fonts,
    fontFamily: overlay.fontFamily,
    bold: overlay.bold,
    italic: overlay.italic,
  });
  const fontSize = Math.max(1, overlay.fontSize * scaleY);
  const textInsetX =
    (TEXT_OVERLAY_HORIZONTAL_PADDING + TEXT_OVERLAY_BORDER_WIDTH) * scaleX;
  const textInsetY =
    (TEXT_OVERLAY_VERTICAL_PADDING + TEXT_OVERLAY_BORDER_WIDTH) * scaleY;
  const textX = rect.x + textInsetX;
  const contentTopY = rect.y + rect.height - textInsetY;
  const baselineY = contentTopY - fontSize * TEXT_OVERLAY_BASELINE_FACTOR;
  const maxTextWidth = Math.max(1, rect.width - textInsetX * 2);
  const color = parseHexColor(overlay.color);

  page.drawText(overlay.text, {
    x: textX,
    y: baselineY,
    size: fontSize,
    font,
    color,
    maxWidth: maxTextWidth,
  });

  if (overlay.underline) {
    const textWidth = Math.min(
      font.widthOfTextAtSize(overlay.text, fontSize),
      maxTextWidth,
    );
    const underlineY = baselineY - fontSize * 0.12;

    page.drawLine({
      start: { x: textX, y: underlineY },
      end: { x: textX + textWidth, y: underlineY },
      thickness: Math.max(0.5, fontSize * 0.05),
      color,
    });
  }
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

function getSignatureAspectRatio(
  overlay: Extract<Overlay, { type: "signature" }>,
): number {
  if (overlay.naturalWidth <= 0 || overlay.naturalHeight <= 0) {
    return overlay.width / overlay.height;
  }

  return overlay.naturalWidth / overlay.naturalHeight;
}

function getTextOverlayFont({
  fonts,
  fontFamily,
  bold,
  italic,
}: {
  fonts: EmbeddedFonts;
  fontFamily: TextFontFamily;
  bold: boolean;
  italic: boolean;
}): PDFFont {
  if (fontFamily === "Times Roman") {
    if (bold && italic) {
      return fonts.timesRomanBoldItalic;
    }

    if (bold) {
      return fonts.timesRomanBold;
    }

    if (italic) {
      return fonts.timesRomanItalic;
    }

    return fonts.timesRoman;
  }

  if (fontFamily === "Courier") {
    if (bold && italic) {
      return fonts.courierBoldOblique;
    }

    if (bold) {
      return fonts.courierBold;
    }

    if (italic) {
      return fonts.courierOblique;
    }

    return fonts.courier;
  }

  if (bold && italic) {
    return fonts.helveticaBoldOblique;
  }

  if (bold) {
    return fonts.helveticaBold;
  }

  if (italic) {
    return fonts.helveticaOblique;
  }

  return fonts.helvetica;
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
