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

export function deleteOverlay(
  overlayState: OverlayPageState,
  overlayId: string,
): OverlayPageState {
  return Object.fromEntries(
    Object.entries(overlayState).map(([pageIndex, overlays]) => [
      pageIndex,
      overlays.filter((overlay) => overlay.id !== overlayId),
    ]),
  );
}

export function moveOverlayForward(
  overlayState: OverlayPageState,
  pageIndex: number,
  overlayId: string,
): OverlayPageState {
  return moveOverlayByOffset(overlayState, pageIndex, overlayId, 1);
}

export function moveOverlayBackward(
  overlayState: OverlayPageState,
  pageIndex: number,
  overlayId: string,
): OverlayPageState {
  return moveOverlayByOffset(overlayState, pageIndex, overlayId, -1);
}

function moveOverlayByOffset(
  overlayState: OverlayPageState,
  pageIndex: number,
  overlayId: string,
  offset: 1 | -1,
): OverlayPageState {
  const pageOverlays = overlayState[pageIndex] ?? [];
  const currentIndex = pageOverlays.findIndex(
    (overlay) => overlay.id === overlayId,
  );
  const nextIndex = currentIndex + offset;

  if (
    currentIndex === -1 ||
    nextIndex < 0 ||
    nextIndex >= pageOverlays.length
  ) {
    return overlayState;
  }

  const reorderedOverlays = [...pageOverlays];
  const currentOverlay = reorderedOverlays[currentIndex];
  reorderedOverlays[currentIndex] = reorderedOverlays[nextIndex];
  reorderedOverlays[nextIndex] = currentOverlay;

  return {
    ...overlayState,
    [pageIndex]: reorderedOverlays,
  };
}
