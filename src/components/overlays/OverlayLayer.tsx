import { useRef, useState, type PointerEvent } from "react";
import type { Overlay } from "../../types/overlays";

type OverlayPosition = {
  x: number;
  y: number;
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

type OverlayLayerProps = {
  overlays: Overlay[];
  selectedOverlayId: string | null;
  onOverlaySelect: (overlayId: string) => void;
  onOverlayMove: (overlayId: string, position: OverlayPosition) => void;
};

export function OverlayLayer({
  overlays,
  selectedOverlayId,
  onOverlaySelect,
  onOverlayMove,
}: OverlayLayerProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

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

  return (
    <div ref={layerRef} className="overlay-layer" aria-label="PDF overlays">
      {overlays.map((overlay) => {
        if (overlay.type !== "text") {
          return null;
        }

        return (
          <div
            key={overlay.id}
            className={`pdf-overlay text-overlay${
              overlay.id === selectedOverlayId ? " is-selected" : ""
            }${overlay.id === dragState?.overlayId ? " is-dragging" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="Text overlay"
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
              color: overlay.color,
              fontFamily: overlay.fontFamily,
              fontSize: overlay.fontSize,
            }}
          >
            {overlay.text}
          </div>
        );
      })}
    </div>
  );
}
