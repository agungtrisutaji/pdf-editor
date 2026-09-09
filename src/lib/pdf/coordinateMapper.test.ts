import { describe, expect, it } from "vitest";
import {
  fitRectContain,
  getPageScale,
  mapPreviewRectToPdfRect,
  rotateLocalVector,
} from "./coordinateMapper";

describe("coordinateMapper", () => {
  const pdfPageSize = { width: 595, height: 842 }; // A4 portrait
  const previewPageSize = { width: 595 * 1.4, height: 842 * 1.4 }; // 1.4 scale

  describe("mapPreviewRectToPdfRect", () => {
    it("maps coordinates correctly for unrotated (0 degree) pages", () => {
      const rect = { x: 70, y: 140, width: 140, height: 70 };
      const mapped = mapPreviewRectToPdfRect({
        rect,
        previewPageSize,
        pdfPageSize,
        pageRotation: 0,
      });

      expect(mapped.rotationDegrees).toBe(0);
      expect(mapped.x).toBeCloseTo(50, 1);
      // y is inverted from bottom: 842 - (140/1.4) - (70/1.4) = 842 - 100 - 50 = 692
      expect(mapped.y).toBeCloseTo(692, 1);
      expect(mapped.width).toBeCloseTo(100, 1);
      expect(mapped.height).toBeCloseTo(50, 1);
    });

    it("maps coordinates correctly for 90 degree rotated pages", () => {
      // For 90 degree page, preview width is based on PDF height and preview height on PDF width
      const rotatedPreview = { width: 842 * 1.4, height: 595 * 1.4 };
      const rect = { x: 100, y: 50, width: 200, height: 60 };

      const mapped = mapPreviewRectToPdfRect({
        rect,
        previewPageSize: rotatedPreview,
        pdfPageSize,
        pageRotation: 90,
      });

      expect(mapped.rotationDegrees).toBe(90);
      expect(mapped.width).toBeCloseTo(200 / 1.4, 1);
      expect(mapped.height).toBeCloseTo(60 / 1.4, 1);
      expect(mapped.x).toBeCloseTo((50 + 60) / 1.4, 1);
      expect(mapped.y).toBeCloseTo(100 / 1.4, 1);
    });

    it("maps coordinates correctly for 180 degree rotated pages", () => {
      const rect = { x: 70, y: 140, width: 140, height: 70 };
      const mapped = mapPreviewRectToPdfRect({
        rect,
        previewPageSize,
        pdfPageSize,
        pageRotation: 180,
      });

      expect(mapped.rotationDegrees).toBe(180);
      expect(mapped.x).toBeCloseTo(595 - 50, 1);
      expect(mapped.y).toBeCloseTo((140 + 70) / 1.4, 1);
      expect(mapped.width).toBeCloseTo(100, 1);
      expect(mapped.height).toBeCloseTo(50, 1);
    });

    it("maps coordinates correctly for 270 degree rotated pages", () => {
      const rotatedPreview = { width: 842 * 1.4, height: 595 * 1.4 };
      const rect = { x: 100, y: 50, width: 200, height: 60 };

      const mapped = mapPreviewRectToPdfRect({
        rect,
        previewPageSize: rotatedPreview,
        pdfPageSize,
        pageRotation: 270,
      });

      expect(mapped.rotationDegrees).toBe(270);
      expect(mapped.width).toBeCloseTo(200 / 1.4, 1);
      expect(mapped.height).toBeCloseTo(60 / 1.4, 1);
      expect(mapped.x).toBeCloseTo(595 - (50 + 60) / 1.4, 1);
      expect(mapped.y).toBeCloseTo(842 - 100 / 1.4, 1);
    });

    it("throws an error on invalid page dimensions", () => {
      expect(() =>
        mapPreviewRectToPdfRect({
          rect: { x: 0, y: 0, width: 100, height: 50 },
          previewPageSize: { width: 0, height: 100 },
          pdfPageSize,
        }),
      ).toThrow("Cannot map overlay coordinates with an invalid page size.");
    });
  });

  describe("rotateLocalVector", () => {
    it("returns unchanged vector for 0 degrees", () => {
      expect(rotateLocalVector({ x: 10, y: 20, rotationDegrees: 0 })).toEqual({
        dx: 10,
        dy: 20,
      });
    });

    it("rotates vector 90 degrees counter-clockwise", () => {
      expect(rotateLocalVector({ x: 10, y: 20, rotationDegrees: 90 })).toEqual({
        dx: -20,
        dy: 10,
      });
    });

    it("rotates vector 180 degrees counter-clockwise", () => {
      expect(rotateLocalVector({ x: 10, y: 20, rotationDegrees: 180 })).toEqual({
        dx: -10,
        dy: -20,
      });
    });

    it("rotates vector 270 degrees counter-clockwise", () => {
      expect(rotateLocalVector({ x: 10, y: 20, rotationDegrees: 270 })).toEqual({
        dx: 20,
        dy: -10,
      });
    });
  });

  describe("getPageScale", () => {
    it("calculates scale for unrotated pages", () => {
      const scale = getPageScale({ previewPageSize, pdfPageSize, pageRotation: 0 });
      expect(scale.scaleX).toBeCloseTo(1 / 1.4, 3);
      expect(scale.scaleY).toBeCloseTo(1 / 1.4, 3);
    });

    it("transposes dimensions for 90 degree pages", () => {
      const rotatedPreview = { width: 842 * 1.4, height: 595 * 1.4 };
      const scale = getPageScale({
        previewPageSize: rotatedPreview,
        pdfPageSize,
        pageRotation: 90,
      });
      expect(scale.scaleX).toBeCloseTo(1 / 1.4, 3);
      expect(scale.scaleY).toBeCloseTo(1 / 1.4, 3);
    });
  });

  describe("fitRectContain", () => {
    it("fits content by height when container is wider", () => {
      const fitted = fitRectContain({
        containerWidth: 200,
        containerHeight: 100,
        contentAspectRatio: 1, // square
      });
      expect(fitted.width).toBe(100);
      expect(fitted.height).toBe(100);
      expect(fitted.xOffset).toBe(50);
      expect(fitted.yOffset).toBe(0);
    });

    it("fits content by width when container is taller", () => {
      const fitted = fitRectContain({
        containerWidth: 100,
        containerHeight: 200,
        contentAspectRatio: 1, // square
      });
      expect(fitted.width).toBe(100);
      expect(fitted.height).toBe(100);
      expect(fitted.xOffset).toBe(0);
      expect(fitted.yOffset).toBe(50);
    });

    it("safely handles invalid aspect ratios or dimensions", () => {
      const fitted = fitRectContain({
        containerWidth: 100,
        containerHeight: 100,
        contentAspectRatio: 0,
      });
      expect(fitted.width).toBe(100);
      expect(fitted.height).toBe(100);
      expect(fitted.xOffset).toBe(0);
      expect(fitted.yOffset).toBe(0);
    });
  });
});
