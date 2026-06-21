import { useMemo, useState } from "react";
import "./App.css";
import { OverlayLayer } from "./components/overlays/OverlayLayer";
import {
  addOverlay,
  createTextOverlay,
  getPageOverlays,
} from "./state/overlayState";
import type { OverlayPageState } from "./types/overlays";

const ACTIVE_PAGE_INDEX = 0;

function App() {
  const [overlayState, setOverlayState] = useState<OverlayPageState>({});

  const activePageOverlays = useMemo(
    () => getPageOverlays(overlayState, ACTIVE_PAGE_INDEX),
    [overlayState],
  );

  function handleAddText() {
    const textOverlay = createTextOverlay({ pageIndex: ACTIVE_PAGE_INDEX });
    setOverlayState((currentState) => addOverlay(currentState, textOverlay));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Offline PDF Editor</p>
          <h1>Overlay Editor</h1>
        </div>

        <button type="button" onClick={handleAddText}>
          Add Text
        </button>

        <dl className="page-summary">
          <div>
            <dt>Active page</dt>
            <dd>{ACTIVE_PAGE_INDEX + 1}</dd>
          </div>
          <div>
            <dt>Overlays</dt>
            <dd>{activePageOverlays.length}</dd>
          </div>
        </dl>
      </aside>

      <section className="workspace" aria-label="PDF page workspace">
        <div className="page-frame">
          <canvas
            className="pdf-canvas"
            width="612"
            height="792"
            aria-label="PDF page preview"
          />
          <OverlayLayer overlays={activePageOverlays} />
        </div>
      </section>
    </main>
  );
}

export default App;
