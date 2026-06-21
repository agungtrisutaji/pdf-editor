import type { Overlay } from "../../types/overlays";

type TextOverlayEditorProps = {
  overlay: Overlay | null;
  onTextChange: (text: string) => void;
};

export function TextOverlayEditor({
  overlay,
  onTextChange,
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
      <label className="field-label" htmlFor="selected-overlay-text">
        Text
      </label>
      <textarea
        id="selected-overlay-text"
        value={overlay.text}
        onChange={(event) => onTextChange(event.currentTarget.value)}
        rows={4}
      />
    </section>
  );
}
