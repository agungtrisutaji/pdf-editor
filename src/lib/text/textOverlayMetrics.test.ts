import { describe, expect, it } from "vitest";
import {
  getTextOverlayCssFont,
  getTextOverlayCssFontFamily,
  measureTextOverlayBounds,
  TEXT_OVERLAY_MIN_HEIGHT,
  TEXT_OVERLAY_MIN_WIDTH,
} from "./textOverlayMetrics";

describe("textOverlayMetrics", () => {
  it("resolves CSS font family names correctly", () => {
    expect(getTextOverlayCssFontFamily("Helvetica")).toBe(
      "Arial, Helvetica, sans-serif",
    );
    expect(getTextOverlayCssFontFamily("Times Roman")).toBe(
      '"Times New Roman", Times, serif',
    );
    expect(getTextOverlayCssFontFamily("Courier")).toBe(
      '"Courier New", Courier, monospace',
    );
  });

  it("builds CSS font strings with bold and italic variants", () => {
    expect(
      getTextOverlayCssFont({
        fontSize: 16,
        fontFamily: "Helvetica",
        bold: true,
        italic: false,
      }),
    ).toBe("normal 700 16px Arial, Helvetica, sans-serif");

    expect(
      getTextOverlayCssFont({
        fontSize: 20,
        fontFamily: "Times Roman",
        bold: false,
        italic: true,
      }),
    ).toBe('italic 400 20px "Times New Roman", Times, serif');
  });

  it("enforces minimum width and height bounds", () => {
    const bounds = measureTextOverlayBounds({
      text: "",
      fontSize: 8,
      fontFamily: "Helvetica",
      bold: false,
      italic: false,
    });

    expect(bounds.width).toBeGreaterThanOrEqual(TEXT_OVERLAY_MIN_WIDTH);
    expect(bounds.height).toBeGreaterThanOrEqual(TEXT_OVERLAY_MIN_HEIGHT);
  });

  it("scales height according to font size and padding", () => {
    const boundsSmall = measureTextOverlayBounds({
      text: "Hello",
      fontSize: 14,
      fontFamily: "Helvetica",
      bold: false,
      italic: false,
    });

    const boundsLarge = measureTextOverlayBounds({
      text: "Hello",
      fontSize: 32,
      fontFamily: "Helvetica",
      bold: false,
      italic: false,
    });

    expect(boundsLarge.height).toBeGreaterThan(boundsSmall.height);
    expect(boundsLarge.width).toBeGreaterThan(boundsSmall.width);
  });
});
