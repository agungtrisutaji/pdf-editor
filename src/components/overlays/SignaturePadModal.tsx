import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { SignatureImageInput } from "./SignatureImagePicker";

type SignaturePadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: SignatureImageInput) => void;
};

const CANVAS_DISPLAY_WIDTH = 480;
const CANVAS_DISPLAY_HEIGHT = 200;
const STROKE_BASE_WIDTH = 2.5;

const INK_COLORS = [
  { label: "Black", color: "#111827" },
  { label: "Navy Blue", color: "#1d4ed8" },
  { label: "Dark Red", color: "#991b1b" },
];

export function SignaturePadModal({
  isOpen,
  onClose,
  onSave,
}: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState(INK_COLORS[0].color);
  const [hasDrawn, setHasDrawn] = useState(false);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas with high-DPI scaling
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setHasDrawn(false);
    isDrawingRef.current = false;
    lastPointRef.current = null;

    const timer = window.setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(CANVAS_DISPLAY_WIDTH * dpr);
      canvas.height = Math.floor(CANVAS_DISPLAY_HEIGHT * dpr);
      canvas.style.width = `${CANVAS_DISPLAY_WIDTH}px`;
      canvas.style.height = `${CANVAS_DISPLAY_HEIGHT}px`;

      const context = canvas.getContext("2d");
      if (context) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, CANVAS_DISPLAY_WIDTH, CANVAS_DISPLAY_HEIGHT);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function getCanvasCoordinates(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const bounds = canvas.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) {
      return;
    }

    const point = getCanvasCoordinates(event);
    if (!point) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    lastPointRef.current = point;

    const context = canvasRef.current?.getContext("2d");
    if (context) {
      context.beginPath();
      context.arc(point.x, point.y, STROKE_BASE_WIDTH / 2, 0, Math.PI * 2);
      context.fillStyle = selectedColor;
      context.fill();
    }

    setHasDrawn(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || !lastPointRef.current) {
      return;
    }

    const currentPoint = getCanvasCoordinates(event);
    if (!currentPoint) {
      return;
    }

    const context = canvasRef.current?.getContext("2d");
    if (context) {
      context.beginPath();
      context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      context.lineTo(currentPoint.x, currentPoint.y);
      context.strokeStyle = selectedColor;
      context.lineWidth = STROKE_BASE_WIDTH;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();
    }

    lastPointRef.current = currentPoint;
  }

  function finishDrawing(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    isDrawingRef.current = false;
    lastPointRef.current = null;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (context) {
      const dpr = window.devicePixelRatio || 1;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, CANVAS_DISPLAY_WIDTH, CANVAS_DISPLAY_HEIGHT);
    }

    setHasDrawn(false);
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      return;
    }

    const cropped = cropSignatureCanvas(canvas);
    if (!cropped) {
      return;
    }

    onSave(cropped);
    onClose();
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signature-pad-title"
    >
      <div className="modal-dialog signature-pad-dialog">
        <header className="modal-header">
          <h2 id="signature-pad-title">Draw Signature</h2>
          <button
            type="button"
            className="small-button close-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </header>

        <div className="signature-pad-body">
          <div className="signature-canvas-wrapper">
            <canvas
              ref={canvasRef}
              className="signature-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishDrawing}
              onPointerCancel={finishDrawing}
            />
            <div className="signature-baseline-guide" aria-hidden="true" />
            <p className="signature-pad-hint">Sign above the line</p>
          </div>

          <div className="signature-pad-controls">
            <div className="color-selector" aria-label="Ink color">
              {INK_COLORS.map((item) => (
                <button
                  key={item.color}
                  type="button"
                  className={`color-button${
                    selectedColor === item.color ? " is-active" : ""
                  }`}
                  style={{ backgroundColor: item.color }}
                  onClick={() => setSelectedColor(item.color)}
                  aria-label={`${item.label} ink`}
                  aria-pressed={selectedColor === item.color}
                />
              ))}
            </div>

            <button
              type="button"
              className="small-button"
              onClick={handleClear}
              disabled={!hasDrawn}
            >
              Clear
            </button>
          </div>
        </div>

        <footer className="modal-footer">
          <button
            type="button"
            className="small-button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasDrawn}
          >
            Use Signature
          </button>
        </footer>
      </div>
    </div>
  );
}

function cropSignatureCanvas(
  sourceCanvas: HTMLCanvasElement,
): SignatureImageInput | null {
  const context = sourceCanvas.getContext("2d");
  if (!context) {
    return null;
  }

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alphaIndex = (y * width + x) * 4 + 3;
      if (data[alphaIndex] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1 || maxY === -1) {
    return null;
  }

  const dpr = window.devicePixelRatio || 1;
  const padding = Math.round(10 * dpr);
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropWidth = Math.min(width - cropX, maxX - minX + 1 + padding * 2);
  const cropHeight = Math.min(height - cropY, maxY - minY + 1 + padding * 2);

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedContext = croppedCanvas.getContext("2d");

  if (!croppedContext) {
    return null;
  }

  croppedContext.drawImage(
    sourceCanvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  return {
    imageDataUrl: croppedCanvas.toDataURL("image/png"),
    naturalWidth: cropWidth,
    naturalHeight: cropHeight,
  };
}
