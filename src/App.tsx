import { useState } from "react";
import "./App.css";
import {
  PdfFilePicker,
  type SelectedPdfFile,
} from "./components/pdf/PdfFilePicker";
import { PdfViewer } from "./components/pdf/PdfViewer";

function App() {
  const [selectedPdf, setSelectedPdf] = useState<SelectedPdfFile | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Milestone 1</p>
          <h1>PDF Viewer</h1>
        </div>

        <PdfFilePicker
          onPdfSelected={(file) => {
            setPickerError(null);
            setSelectedPdf(file);
          }}
          onError={(message) => {
            setPickerError(message);
            setSelectedPdf(null);
          }}
        />

        <dl className="page-summary">
          <div>
            <dt>File</dt>
            <dd>{selectedPdf?.fileName ?? "None"}</dd>
          </div>
          <div>
            <dt>Processing</dt>
            <dd>Local only</dd>
          </div>
        </dl>

        {pickerError ? <p className="error-message">{pickerError}</p> : null}
      </aside>

      <PdfViewer pdfFile={selectedPdf} />
    </main>
  );
}

export default App;
