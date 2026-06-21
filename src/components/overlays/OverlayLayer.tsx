import type { Overlay } from "../../types/overlays";

type OverlayLayerProps = {
  overlays: Overlay[];
  selectedOverlayId: string | null;
  onOverlaySelect: (overlayId: string) => void;
};

export function OverlayLayer({
  overlays,
  selectedOverlayId,
  onOverlaySelect,
}: OverlayLayerProps) {
  return (
    <div className="overlay-layer" aria-label="PDF overlays">
      {overlays.map((overlay) => {
        if (overlay.type !== "text") {
          return null;
        }

        return (
          <div
            key={overlay.id}
            className={`pdf-overlay text-overlay${
              overlay.id === selectedOverlayId ? " is-selected" : ""
            }`}
            role="button"
            tabIndex={0}
            aria-label="Text overlay"
            aria-pressed={overlay.id === selectedOverlayId}
            onClick={() => onOverlaySelect(overlay.id)}
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
