import type { Overlay } from "../../types/overlays";

type OverlayListProps = {
  overlays: Overlay[];
  selectedOverlayId: string | null;
  onOverlaySelect: (overlayId: string) => void;
  onOverlayDelete: (overlayId: string) => void;
  onOverlayMoveForward: (overlayId: string) => void;
  onOverlayMoveBackward: (overlayId: string) => void;
};

function getOverlayLabel(overlay: Overlay, index: number): string {
  if (overlay.type === "text") {
    const text = overlay.text.trim();
    return text ? `Text: ${text.slice(0, 28)}` : `Text ${index + 1}`;
  }

  if (overlay.type === "signature") {
    return `Signature ${index + 1}`;
  }

  if (overlay.type === "stamp") {
    return `Stamp: ${overlay.label}`;
  }

  return `Overlay ${index + 1}`;
}

export function OverlayList({
  overlays,
  selectedOverlayId,
  onOverlaySelect,
  onOverlayDelete,
  onOverlayMoveForward,
  onOverlayMoveBackward,
}: OverlayListProps) {
  return (
    <section className="overlay-list-panel" aria-label="Overlay list">
      <h2>Overlays</h2>

      {overlays.length === 0 ? (
        <p className="helper-text">No overlays on this page yet.</p>
      ) : (
        <ol className="overlay-list">
          {overlays.map((overlay, index) => {
            const isSelected = overlay.id === selectedOverlayId;

            return (
              <li
                key={overlay.id}
                className={`overlay-list-item${
                  isSelected ? " is-selected" : ""
                }`}
              >
                <button
                  type="button"
                  className="overlay-select-button"
                  onClick={() => onOverlaySelect(overlay.id)}
                  aria-pressed={isSelected}
                >
                  {getOverlayLabel(overlay, index)}
                </button>

                <div className="overlay-list-actions" aria-label="Overlay actions">
                  <button
                    type="button"
                    className="small-button"
                    onClick={() => onOverlayMoveBackward(overlay.id)}
                    disabled={index === 0}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="small-button"
                    onClick={() => onOverlayMoveForward(overlay.id)}
                    disabled={index === overlays.length - 1}
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    className="small-button danger-button"
                    onClick={() => onOverlayDelete(overlay.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
