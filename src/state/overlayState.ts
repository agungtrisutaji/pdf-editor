import type { Overlay, OverlayPageState, TextOverlay } from "../types/overlays";

type CreateTextOverlayInput = {
  pageIndex: number;
  id?: string;
  x?: number;
  y?: number;
};

export function createTextOverlay({
  pageIndex,
  id = crypto.randomUUID(),
  x = 96,
  y = 96,
}: CreateTextOverlayInput): TextOverlay {
  return {
    id,
    type: "text",
    pageIndex,
    x,
    y,
    width: 180,
    height: 44,
    rotation: 0,
    text: "Text",
    fontSize: 18,
    fontFamily: "Arial, sans-serif",
    color: "#111827",
  };
}

export function addOverlay(
  overlayState: OverlayPageState,
  overlay: Overlay,
): OverlayPageState {
  const pageOverlays = overlayState[overlay.pageIndex] ?? [];

  return {
    ...overlayState,
    [overlay.pageIndex]: [...pageOverlays, overlay],
  };
}

export function getPageOverlays(
  overlayState: OverlayPageState,
  pageIndex: number,
): Overlay[] {
  return overlayState[pageIndex] ?? [];
}

export function updateTextOverlayText(
  overlayState: OverlayPageState,
  overlayId: string,
  text: string,
): OverlayPageState {
  return Object.fromEntries(
    Object.entries(overlayState).map(([pageIndex, overlays]) => [
      pageIndex,
      overlays.map((overlay) => {
        if (overlay.id !== overlayId || overlay.type !== "text") {
          return overlay;
        }

        return {
          ...overlay,
          text,
        };
      }),
    ]),
  );
}
