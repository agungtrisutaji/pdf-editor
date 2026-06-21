import type { Overlay } from "../../types/overlays";

type OverlayLayerProps = {
  overlays: Overlay[];
};

export function OverlayLayer({ overlays }: OverlayLayerProps) {
  return (
    <div className="overlay-layer" aria-label="PDF overlays">
      {overlays.map((overlay) => {
        if (overlay.type !== "text") {
          return null;
        }

        return (
          <div
            key={overlay.id}
            className="pdf-overlay text-overlay"
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
