import { describe, expect, it } from "vitest";
import type { PDFPage } from "pdf-lib";
import { getFallbackPreviewPageSize } from "./pdfExporter";

describe("pdfExporter", () => {
  describe("getFallbackPreviewPageSize", () => {
    it("computes unrotated page preview size", () => {
      const mockPage = {
        getSize: () => ({ width: 500, height: 700 }),
        getRotation: () => ({ angle: 0 }),
      } as unknown as PDFPage;

      const size = getFallbackPreviewPageSize(mockPage, 1.5);
      expect(size).toEqual({ width: 750, height: 1050 });
    });

    it("transposes dimensions for 90 degree rotated page", () => {
      const mockPage = {
        getSize: () => ({ width: 500, height: 700 }),
        getRotation: () => ({ angle: 90 }),
      } as unknown as PDFPage;

      const size = getFallbackPreviewPageSize(mockPage, 1.5);
      expect(size).toEqual({ width: 1050, height: 750 });
    });

    it("transposes dimensions for 270 degree rotated page", () => {
      const mockPage = {
        getSize: () => ({ width: 500, height: 700 }),
        getRotation: () => ({ angle: 270 }),
      } as unknown as PDFPage;

      const size = getFallbackPreviewPageSize(mockPage, 1);
      expect(size).toEqual({ width: 700, height: 500 });
    });

    it("keeps dimensions for 180 degree rotated page", () => {
      const mockPage = {
        getSize: () => ({ width: 500, height: 700 }),
        getRotation: () => ({ angle: 180 }),
      } as unknown as PDFPage;

      const size = getFallbackPreviewPageSize(mockPage, 1);
      expect(size).toEqual({ width: 500, height: 700 });
    });
  });
});
