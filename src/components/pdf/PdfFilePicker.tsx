import { useRef, useState, type ChangeEvent } from "react";

export type SelectedPdfFile = {
  fileName: string;
  data: ArrayBuffer;
};

type PdfFilePickerProps = {
  onPdfSelected: (file: SelectedPdfFile) => void;
  onError: (message: string) => void;
};

function isLikelyPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export function PdfFilePicker({ onPdfSelected, onError }: PdfFilePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isReading, setIsReading] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    if (!isLikelyPdfFile(file)) {
      onError("Choose a PDF file. Other file types are not supported.");
      event.currentTarget.value = "";
      return;
    }

    setIsReading(true);
    try {
      const data = await file.arrayBuffer();
      onPdfSelected({ fileName: file.name, data });
    } catch {
      onError("The selected PDF could not be read from this device.");
    } finally {
      setIsReading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="file-picker">
      <label className="file-picker-label" htmlFor="pdf-file-input">
        Open local PDF
      </label>
      <input
        ref={inputRef}
        id="pdf-file-input"
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
        disabled={isReading}
      />
      <p className="helper-text">
        {isReading ? "Reading file..." : "Files stay on this device."}
      </p>
    </div>
  );
}
