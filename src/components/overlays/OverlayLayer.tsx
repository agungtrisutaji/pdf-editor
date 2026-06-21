import { useRef, useState, type PointerEvent } from "react";
import type { Overlay } from "../../types/overlays";

type OverlayPosition = {
  x: number;
  y: number;
};

type OverlaySize = {
  width: number;
  height: number;
};

type DragState = {
  overlayId: string;
  pointerStartX: number;
  pointerStartY: number;
  overlayStartX: number;
  overlayStartY: number;
  overlayWidth: number;
  overlayHeight: number;
};

type ResizeState = {
  overlayId: string;
  pointerStartX: number;
  pointerStartY: number;
  overlayX: number;
  overlayY: number;
  overlayStartWidth: number;
  overlayStartHeight: number;
};

type OverlayLayerProps = {
  overlays: Overlay[];
  selectedOverlayId: string | null;
  onOverlaySelect: (overlayId: string) => void;
  onOverlayMove: (overlayId: string, position: OverlayPosition) => void;
  onOverlayResize: (overlayId: string, size: OverlaySize) => void;
};

const MIN_OVERLAY_WIDTH = 48;
const MIN_OVERLAY_HEIGHT = 24;

export function OverlayLayer({
  overlays,
  selectedOverlayId,
  onOverlaySelect,
  onOverlayMove,
  onOverlayResize,
}: OverlayLayerProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  function getPointerPosition(event: PointerEvent<HTMLElement>) {
    const layerBounds = layerRef.current?.getBoundingClientRect();

    if (!layerBounds) {
      return null;
    }

    return {
      x: event.clientX - layerBounds.left,
      y: event.clientY - layerBounds.top,
      layerWidth: layerBounds.width,
      layerHeight: layerBounds.height,
    };
  }

  function clampOverlayPosition({
    x,
    y,
    overlayWidth,
    overlayHeight,
    layerWidth,
    layerHeight,
  }: OverlayPosition & {
    overlayWidth: number;
    overlayHeight: number;
    layerWidth: number;
    layerHeight: number;
  }): OverlayPosition {
    const maxX = Math.max(0, layerWidth - overlayWidth);
    const maxY = Math.max(0, layerHeight - overlayHeight);

    return {
      x: Math.min(Math.max(0, x), maxX),
      y: Math.min(Math.max(0, y), maxY),
    };
  }

  function clampOverlaySize({
    width,
    height,
    overlayX,
    overlayY,
    layerWidth,
    layerHeight,
  }: OverlaySize & {
    overlayX: number;
    overlayY: number;
    layerWidth: number;
    layerHeight: number;
  }): OverlaySize {
    const maxWidth = Math.max(MIN_OVERLAY_WIDTH, layerWidth - overlayX);
    const maxHeight = Math.max(MIN_OVERLAY_HEIGHT, layerHeight - overlayY);

    return {
      width: Math.min(Math.max(MIN_OVERLAY_WIDTH, width), maxWidth),
      height: Math.min(Math.max(MIN_OVERLAY_HEIGHT, height), maxHeight),
    };
  }

  function handlePointerDown(
    event: PointerEvent<HTMLDivElement>,
    overlay: Overlay,
  ) {
    if (event.button !== 0) {
      return;
    }

    const pointerPosition = getPointerPosition(event);

    if (!pointerPosition) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onOverlaySelect(overlay.id);
    setResizeState(null);
    setDragState({
      overlayId: overlay.id,
      pointerStartX: pointerPosition.x,
      pointerStartY: pointerPosition.y,
      overlayStartX: overlay.x,
      overlayStartY: overlay.y,
      overlayWidth: overlay.width,
      overlayHeight: overlay.height,
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragState) {
      return;
    }

    const pointerPosition = getPointerPosition(event);

    if (!pointerPosition) {
      return;
    }

    const nextPosition = clampOverlayPosition({
      x:
        dragState.overlayStartX +
        (pointerPosition.x - dragState.pointerStartX),
      y:
        dragState.overlayStartY +
        (pointerPosition.y - dragState.pointerStartY),
      overlayWidth: dragState.overlayWidth,
      overlayHeight: dragState.overlayHeight,
      layerWidth: pointerPosition.layerWidth,
      layerHeight: pointerPosition.layerHeight,
    });

    onOverlayMove(dragState.overlayId, nextPosition);
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragState) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragState(null);
  }

  function handleResizePointerDown(
    event: PointerEvent<HTMLSpanElement>,
    overlay: Overlay,
  ) {
    if (event.button !== 0) {
      return;
    }

    const pointerPosition = getPointerPosition(event);

    if (!pointerPosition) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onOverlaySelect(overlay.id);
    setDragState(null);
    setResizeState({
      overlayId: overlay.id,
      pointerStartX: pointerPosition.x,
      pointerStartY: pointerPosition.y,
      overlayX: overlay.x,
      overlayY: overlay.y,
      overlayStartWidth: overlay.width,
      overlayStartHeight: overlay.height,
    });
  }

  function handleResizePointerMove(event: PointerEvent<HTMLSpanElement>) {
    if (!resizeState) {
      return;
    }

    const pointerPosition = getPointerPosition(event);

    if (!pointerPosition) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const nextSize = clampOverlaySize({
      width:
        resizeState.overlayStartWidth +
        (pointerPosition.x - resizeState.pointerStartX),
      height:
        resizeState.overlayStartHeight +
        (pointerPosition.y - resizeState.pointerStartY),
      overlayX: resizeState.overlayX,
      overlayY: resizeState.overlayY,
      layerWidth: pointerPosition.layerWidth,
      layerHeight: pointerPosition.layerHeight,
    });

    onOverlayResize(resizeState.overlayId, nextSize);
  }

  function finishResize(event: PointerEvent<HTMLSpanElement>) {
    if (!resizeState) {
      return;
    }

    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setResizeState(null);
  }

  return (
    <div ref={layerRef} className="overlay-layer" aria-label="PDF overlays">
      {overlays.map((overlay) => {
        return (
          <div
            key={overlay.id}
            className={`pdf-overlay ${overlay.type}-overlay${
              overlay.id === selectedOverlayId ? " is-selected" : ""
            }${overlay.id === dragState?.overlayId ? " is-dragging" : ""}${
              overlay.id === resizeState?.overlayId ? " is-resizing" : ""
            }`}
            role="button"
            tabIndex={0}
            aria-label={`${overlay.type} overlay`}
            aria-pressed={overlay.id === selectedOverlayId}
            onClick={() => onOverlaySelect(overlay.id)}
            onPointerDown={(event) => handlePointerDown(event, overlay)}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOverlaySelect(overlay.id);
              }
            }}
            style={{
              left: overlay.x,
              top: overlay.y,
              width: overlay.width,
              height: overlay.height,
              transform: `rotate(${overlay.rotation}deg)`,
              ...(overlay.type === "text"
                ? {
                    color: overlay.color,
                    fontFamily: overlay.fontFamily,
                    fontSize: overlay.fontSize,
                  }
                : {}),
              ...(overlay.type === "stamp" ? { color: overlay.color } : {}),
            }}
          >
            {overlay.type === "text" ? (
              <span className="text-overlay-content">{overlay.text}</span>
            ) : overlay.type === "signature" ? (
              <img
                className="signature-overlay-image"
                src={overlay.imageDataUrl}
                alt=""
                draggable={false}
                style={{ opacity: overlay.opacity }}
              />
            ) : (
              <span className="stamp-overlay-label">{overlay.label}</span>
            )}
            {overlay.id === selectedOverlayId ? (
              <span
                className="overlay-resize-handle"
                aria-hidden="true"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => handleResizePointerDown(event, overlay)}
                onPointerMove={handleResizePointerMove}
                onPointerUp={finishResize}
                onPointerCancel={finishResize}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
