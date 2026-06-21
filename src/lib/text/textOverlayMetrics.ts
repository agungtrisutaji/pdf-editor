import type { TextFontFamily } from "../../types/overlays";

export type TextOverlayBounds = {
  width: number;
  height: number;
};

export const TEXT_OVERLAY_HORIZONTAL_PADDING = 8;
export const TEXT_OVERLAY_VERTICAL_PADDING = 4;
export const TEXT_OVERLAY_BORDER_WIDTH = 1;
export const TEXT_OVERLAY_LINE_HEIGHT = 1.2;
export const TEXT_OVERLAY_MIN_WIDTH = 24;
export const TEXT_OVERLAY_MIN_HEIGHT = 20;
export const TEXT_OVERLAY_BASELINE_FACTOR = 0.8;

let measurementCanvas: HTMLCanvasElement | null = null;

export function measureTextOverlayBounds({
  text,
  fontSize,
  fontFamily,
  bold,
  italic,
}: {
  text: string;
  fontSize: number;
  fontFamily: TextFontFamily;
  bold: boolean;
  italic: boolean;
}): TextOverlayBounds {
  const safeFontSize = Math.max(1, fontSize);
  const measuredText = text || " ";
  const textWidth = measureTextWidth({
    text: measuredText,
    font: getTextOverlayCssFont({
      fontSize: safeFontSize,
      fontFamily,
      bold,
      italic,
    }),
    fontSize: safeFontSize,
  });
  const horizontalInset =
    TEXT_OVERLAY_HORIZONTAL_PADDING + TEXT_OVERLAY_BORDER_WIDTH;
  const verticalInset = TEXT_OVERLAY_VERTICAL_PADDING + TEXT_OVERLAY_BORDER_WIDTH;

  return {
    width: Math.max(
      TEXT_OVERLAY_MIN_WIDTH,
      Math.ceil(textWidth + horizontalInset * 2),
    ),
    height: Math.max(
      TEXT_OVERLAY_MIN_HEIGHT,
      Math.ceil(safeFontSize * TEXT_OVERLAY_LINE_HEIGHT + verticalInset * 2),
    ),
  };
}

export function getTextOverlayCssFont({
  fontSize,
  fontFamily,
  bold,
  italic,
}: {
  fontSize: number;
  fontFamily: TextFontFamily;
  bold: boolean;
  italic: boolean;
}): string {
  const fontStyle = italic ? "italic" : "normal";
  const fontWeight = bold ? 700 : 400;

  return `${fontStyle} ${fontWeight} ${fontSize}px ${getTextOverlayCssFontFamily(
    fontFamily,
  )}`;
}

export function getTextOverlayCssFontFamily(
  fontFamily: TextFontFamily,
): string {
  switch (fontFamily) {
    case "Times Roman":
      return '"Times New Roman", Times, serif';
    case "Courier":
      return '"Courier New", Courier, monospace';
    case "Helvetica":
    default:
      return "Arial, Helvetica, sans-serif";
  }
}

function measureTextWidth({
  text,
  font,
  fontSize,
}: {
  text: string;
  font: string;
  fontSize: number;
}): number {
  if (typeof document === "undefined") {
    return text.length * fontSize * 0.55;
  }

  measurementCanvas ??= document.createElement("canvas");
  const context = measurementCanvas.getContext("2d");

  if (!context) {
    return text.length * fontSize * 0.55;
  }

  context.font = font;

  return context.measureText(text).width;
}
