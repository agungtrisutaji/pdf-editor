import type { Overlay, TextFontFamily } from "../../types/overlays";
import type { TextOverlayStylePatch } from "../../state/overlayState";

type TextOverlayEditorProps = {
  overlay: Overlay | null;
  onTextChange: (text: string) => void;
  onStyleChange: (patch: TextOverlayStylePatch) => void;
};

export function TextOverlayEditor({
  overlay,
  onTextChange,
  onStyleChange,
}: TextOverlayEditorProps) {
  if (!overlay) {
    return (
      <section className="overlay-editor-panel" aria-label="Text overlay editor">
        <h2>Text Overlay</h2>
        <p className="helper-text">Select a text overlay to edit.</p>
      </section>
    );
  }

  if (overlay.type === "signature") {
    return (
      <section className="overlay-editor-panel" aria-label="Text overlay editor">
        <h2>Text Overlay</h2>
        <p className="helper-text">Selected overlay is a signature image.</p>
      </section>
    );
  }

  if (overlay.type === "stamp") {
    return (
      <section className="overlay-editor-panel" aria-label="Text overlay editor">
        <h2>Text Overlay</h2>
        <p className="helper-text">Selected overlay is a stamp.</p>
      </section>
    );
  }

  if (overlay.type !== "text") {
    return (
      <section className="overlay-editor-panel" aria-label="Text overlay editor">
        <h2>Text Overlay</h2>
        <p className="helper-text">Select a text overlay to edit.</p>
      </section>
    );
  }

  return (
    <section className="overlay-editor-panel" aria-label="Text overlay editor">
      <h2>Text Overlay</h2>
      <div className="editor-control-group">
        <h3>Text Content</h3>
        <label className="field-label" htmlFor="selected-overlay-text">
          Text
        </label>
        <textarea
          id="selected-overlay-text"
          value={overlay.text}
          onChange={(event) => onTextChange(event.currentTarget.value)}
          rows={3}
        />
      </div>

      <div className="editor-control-group">
        <h3>Font</h3>
        <div className="editor-control-row">
          <div>
            <label className="field-label" htmlFor="selected-overlay-font-family">
              Family
            </label>
            <select
              id="selected-overlay-font-family"
              value={overlay.fontFamily}
              onChange={(event) =>
                onStyleChange({
                  fontFamily: event.currentTarget.value as TextFontFamily,
                })
              }
            >
              <option value="Helvetica">Helvetica</option>
              <option value="Times Roman">Times Roman</option>
              <option value="Courier">Courier</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="selected-overlay-font-size">
              Size
            </label>
            <input
              id="selected-overlay-font-size"
              type="number"
              min={8}
              max={96}
              step={1}
              value={overlay.fontSize}
              onChange={(event) => {
                const fontSize = Number(event.currentTarget.value);

                if (!Number.isFinite(fontSize)) {
                  return;
                }

                onStyleChange({
                  fontSize: Math.min(Math.max(8, fontSize), 96),
                });
              }}
            />
          </div>
        </div>
      </div>

      <div className="editor-control-group">
        <h3>Style</h3>
        <div className="text-style-toggle-group" aria-label="Text style">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={overlay.bold}
              onChange={(event) =>
                onStyleChange({ bold: event.currentTarget.checked })
              }
            />
            Bold
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={overlay.italic}
              onChange={(event) =>
                onStyleChange({ italic: event.currentTarget.checked })
              }
            />
            Italic
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={overlay.underline}
              onChange={(event) =>
                onStyleChange({ underline: event.currentTarget.checked })
              }
            />
            Underline
          </label>
        </div>
      </div>

      <div className="editor-control-group">
        <h3>Color</h3>
        <div className="editor-color-row">
          <label className="field-label" htmlFor="selected-overlay-text-color">
            Text color
          </label>
          <input
            id="selected-overlay-text-color"
            type="color"
            value={overlay.color}
            onChange={(event) =>
              onStyleChange({ color: event.currentTarget.value })
            }
          />
        </div>
      </div>
    </section>
  );
}
