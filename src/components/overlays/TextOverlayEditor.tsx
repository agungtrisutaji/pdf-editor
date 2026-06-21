import type { TextOverlay } from "../../types/overlays";

type TextOverlayEditorProps = {
  overlay: TextOverlay | null;
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
