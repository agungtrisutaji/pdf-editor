import { describe, expect, it } from "vitest";
import {
  addOverlay,
  createSignatureOverlay,
  createStampOverlay,
  createTextOverlay,
  deleteOverlay,
  getPageOverlays,
  moveOverlayBackward,
  moveOverlayForward,
  rescaleOverlays,
  updateOverlayPosition,
  updateOverlaySize,
  updateTextOverlayStyle,
  updateTextOverlayText,
} from "./overlayState";
import type { OverlayPageState } from "../types/overlays";

describe("overlayState", () => {
  it("creates text overlay with default values", () => {
    const overlay = createTextOverlay({ pageIndex: 0 });
    expect(overlay.type).toBe("text");
    expect(overlay.pageIndex).toBe(0);
    expect(overlay.text).toBe("Text");
    expect(overlay.fontSize).toBe(18);
    expect(overlay.fontFamily).toBe("Helvetica");
    expect(overlay.color).toBe("#111827");
    expect(overlay.bold).toBe(false);
  });

  it("creates signature overlay with aspect ratio computation", () => {
    const overlay = createSignatureOverlay({
      pageIndex: 0,
      imageDataUrl: "data:image/png;base64,sample",
      naturalWidth: 400,
      naturalHeight: 200,
      width: 200,
    });
    expect(overlay.type).toBe("signature");
    expect(overlay.width).toBe(200);
    // aspect ratio = 2, so height = 200 / 2 = 100
    expect(overlay.height).toBe(100);
  });

  it("creates stamp overlay with preset values", () => {
    const overlay = createStampOverlay({
      pageIndex: 1,
      label: "APPROVED",
      color: "#15803d",
    });
    expect(overlay.type).toBe("stamp");
    expect(overlay.pageIndex).toBe(1);
    expect(overlay.label).toBe("APPROVED");
    expect(overlay.color).toBe("#15803d");
  });

  it("adds overlay and retrieves overlays for a specific page", () => {
    let state: OverlayPageState = {};
    const text1 = createTextOverlay({ pageIndex: 0, id: "text-1" });
    const text2 = createTextOverlay({ pageIndex: 1, id: "text-2" });

    state = addOverlay(state, text1);
    state = addOverlay(state, text2);

    expect(getPageOverlays(state, 0)).toEqual([text1]);
    expect(getPageOverlays(state, 1)).toEqual([text2]);
    expect(getPageOverlays(state, 2)).toEqual([]);
  });

  it("updates text overlay text and layout atomically", () => {
    let state: OverlayPageState = {};
    const textOverlay = createTextOverlay({ pageIndex: 0, id: "text-1" });
    state = addOverlay(state, textOverlay);

    state = updateTextOverlayText(state, "text-1", "Updated Text", {
      width: 250,
      height: 60,
    });

    const updated = getPageOverlays(state, 0)[0];
    expect(updated).toMatchObject({
      text: "Updated Text",
      width: 250,
      height: 60,
    });
  });

  it("updates text overlay style", () => {
    let state: OverlayPageState = {};
    const textOverlay = createTextOverlay({ pageIndex: 0, id: "text-1" });
    state = addOverlay(state, textOverlay);

    state = updateTextOverlayStyle(state, "text-1", {
      bold: true,
      color: "#dc2626",
      fontFamily: "Times Roman",
    });

    const updated = getPageOverlays(state, 0)[0];
    expect(updated).toMatchObject({
      bold: true,
      color: "#dc2626",
      fontFamily: "Times Roman",
    });
  });

  it("updates overlay position and size", () => {
    let state: OverlayPageState = {};
    const stamp = createStampOverlay({
      pageIndex: 0,
      label: "CONFIDENTIAL",
      color: "#7c2d12",
      id: "stamp-1",
    });
    state = addOverlay(state, stamp);

    state = updateOverlayPosition(state, "stamp-1", { x: 150, y: 300 });
    expect(getPageOverlays(state, 0)[0]).toMatchObject({ x: 150, y: 300 });

    state = updateOverlaySize(state, "stamp-1", { width: 220, height: 75 });
    expect(getPageOverlays(state, 0)[0]).toMatchObject({ width: 220, height: 75 });
  });

  it("reorders overlays forward and backward (z-index)", () => {
    let state: OverlayPageState = {};
    const o1 = createTextOverlay({ pageIndex: 0, id: "1" });
    const o2 = createTextOverlay({ pageIndex: 0, id: "2" });
    const o3 = createTextOverlay({ pageIndex: 0, id: "3" });

    state = addOverlay(state, o1);
    state = addOverlay(state, o2);
    state = addOverlay(state, o3);

    // Bring "1" forward -> index 1
    state = moveOverlayForward(state, 0, "1");
    expect(getPageOverlays(state, 0).map((o) => o.id)).toEqual(["2", "1", "3"]);

    // Send "3" backward -> index 1
    state = moveOverlayBackward(state, 0, "3");
    expect(getPageOverlays(state, 0).map((o) => o.id)).toEqual(["2", "3", "1"]);

    // Moving beyond boundaries leaves state unchanged
    state = moveOverlayBackward(state, 0, "2");
    expect(getPageOverlays(state, 0).map((o) => o.id)).toEqual(["2", "3", "1"]);
  });

  it("deletes overlay cleanly", () => {
    let state: OverlayPageState = {};
    const o1 = createTextOverlay({ pageIndex: 0, id: "1" });
    const o2 = createTextOverlay({ pageIndex: 0, id: "2" });

    state = addOverlay(state, o1);
    state = addOverlay(state, o2);

    state = deleteOverlay(state, "1");
    expect(getPageOverlays(state, 0)).toEqual([o2]);
  });

  describe("rescaleOverlays", () => {
    it("rescales positions, dimensions, and font sizes proportionally", () => {
      let state: OverlayPageState = {};
      const text = createTextOverlay({ pageIndex: 0, id: "text-1", x: 100, y: 200 });
      text.width = 150;
      text.height = 40;
      text.fontSize = 20;

      const stamp = createStampOverlay({
        pageIndex: 0,
        id: "stamp-1",
        label: "CONFIDENTIAL",
        color: "#dc2626",
        x: 50,
        y: 80,
        width: 100,
        height: 50,
      });

      state = addOverlay(state, text);
      state = addOverlay(state, stamp);

      // Scale by 1.5x (e.g. from 100% to 150%)
      const scaledState = rescaleOverlays(state, 1.5);
      const scaledOverlays = getPageOverlays(scaledState, 0);

      const scaledText = scaledOverlays.find((o) => o.id === "text-1");
      expect(scaledText).toBeDefined();
      expect(scaledText?.x).toBe(150);
      expect(scaledText?.y).toBe(300);
      expect(scaledText?.width).toBe(225);
      expect(scaledText?.height).toBe(60);
      if (scaledText?.type === "text") {
        expect(scaledText.fontSize).toBe(30);
      }

      const scaledStamp = scaledOverlays.find((o) => o.id === "stamp-1");
      expect(scaledStamp?.x).toBe(75);
      expect(scaledStamp?.y).toBe(120);
      expect(scaledStamp?.width).toBe(150);
      expect(scaledStamp?.height).toBe(75);
    });

    it("returns original state when factor is 1 or invalid", () => {
      let state: OverlayPageState = {};
      const text = createTextOverlay({ pageIndex: 0, id: "text-1", x: 100, y: 100 });
      state = addOverlay(state, text);

      expect(rescaleOverlays(state, 1)).toBe(state);
      expect(rescaleOverlays(state, 0)).toBe(state);
      expect(rescaleOverlays(state, -1.5)).toBe(state);
      expect(rescaleOverlays(state, Number.NaN)).toBe(state);
    });
  });
});
