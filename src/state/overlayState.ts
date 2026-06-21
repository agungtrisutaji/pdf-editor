import type {
  Overlay,
  OverlayPageState,
  SignatureOverlay,
  StampOverlay,
  TextFontFamily,
  TextOverlay,
} from "../types/overlays";

type OverlayPosition = {
  x: number;
  y: number;
};

type OverlaySize = {
  width: number;
  height: number;
};

type TextOverlayLayoutPatch = OverlaySize & Partial<OverlayPosition>;

export type TextOverlayStylePatch = Partial<{
  fontSize: number;
  fontFamily: TextFontFamily;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}>;

type CreateTextOverlayInput = {
  pageIndex: number;
  id?: string;
  x?: number;
  y?: number;
};

type CreateSignatureOverlayInput = {
  pageIndex: number;
  imageDataUrl: string;
  naturalWidth?: number;
  naturalHeight?: number;
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

const DEFAULT_SIGNATURE_WIDTH = 220;
const FALLBACK_SIGNATURE_HEIGHT = 90;
const MIN_SIGNATURE_HEIGHT = 48;
const MAX_SIGNATURE_HEIGHT = 160;

type CreateStampOverlayInput = {
  pageIndex: number;
  label: string;
  color: string;
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
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
    fontFamily: "Helvetica",
    color: "#111827",
    bold: false,
    italic: false,
    underline: false,
  };
}

export function createSignatureOverlay({
  pageIndex,
  imageDataUrl,
  naturalWidth = DEFAULT_SIGNATURE_WIDTH,
  naturalHeight = FALLBACK_SIGNATURE_HEIGHT,
  id = crypto.randomUUID(),
  x = 96,
  y = 140,
  width = DEFAULT_SIGNATURE_WIDTH,
  height = getDefaultSignatureHeight({ naturalWidth, naturalHeight, width }),
}: CreateSignatureOverlayInput): SignatureOverlay {
  return {
    id,
    type: "signature",
    pageIndex,
    x,
    y,
    width,
    height,
    rotation: 0,
    imageDataUrl,
    opacity: 1,
    naturalWidth,
    naturalHeight,
  };
}

export function createStampOverlay({
  pageIndex,
  label,
  color,
  id = crypto.randomUUID(),
  x = 96,
  y = 180,
  width = 180,
  height = 56,
}: CreateStampOverlayInput): StampOverlay {
  return {
    id,
    type: "stamp",
    pageIndex,
    x,
    y,
    width,
    height,
    rotation: 0,
    label,
    color,
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
  layout?: TextOverlayLayoutPatch,
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
          ...layout,
        };
      }),
    ]),
  );
}

export function updateTextOverlayStyle(
  overlayState: OverlayPageState,
  overlayId: string,
  patch: TextOverlayStylePatch,
  layout?: TextOverlayLayoutPatch,
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
          ...patch,
          ...layout,
        };
      }),
    ]),
  );
}

export function updateOverlayPosition(
  overlayState: OverlayPageState,
  overlayId: string,
  position: OverlayPosition,
): OverlayPageState {
  return Object.fromEntries(
    Object.entries(overlayState).map(([pageIndex, overlays]) => [
      pageIndex,
      overlays.map((overlay) => {
        if (overlay.id !== overlayId) {
          return overlay;
        }

        return {
          ...overlay,
          x: position.x,
          y: position.y,
        };
      }),
    ]),
  );
}

export function updateOverlaySize(
  overlayState: OverlayPageState,
  overlayId: string,
  size: OverlaySize,
): OverlayPageState {
  return Object.fromEntries(
    Object.entries(overlayState).map(([pageIndex, overlays]) => [
      pageIndex,
      overlays.map((overlay) => {
        if (overlay.id !== overlayId) {
          return overlay;
        }

        return {
          ...overlay,
          width: size.width,
          height: size.height,
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

function getDefaultSignatureHeight({
  naturalWidth,
  naturalHeight,
  width,
}: {
  naturalWidth: number;
  naturalHeight: number;
  width: number;
}): number {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return FALLBACK_SIGNATURE_HEIGHT;
  }

  const aspectRatio = naturalWidth / naturalHeight;

  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return FALLBACK_SIGNATURE_HEIGHT;
  }

  return Math.min(
    Math.max(MIN_SIGNATURE_HEIGHT, width / aspectRatio),
    MAX_SIGNATURE_HEIGHT,
  );
}
