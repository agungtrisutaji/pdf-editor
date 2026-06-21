import { useRef, useState, type ChangeEvent } from "react";

export type SignatureImageInput = {
  imageDataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
};

type SignatureImagePickerProps = {
  disabled: boolean;
  onSignatureSelected: (signatureImage: SignatureImageInput) => void;
};

function isSupportedSignatureImage(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return (
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg")
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("The selected image could not be read."));
    });
    reader.addEventListener("error", () => {
      reject(new Error("The selected image could not be read."));
    });
    reader.readAsDataURL(file);
  });
}

function readImageDimensions(
  imageDataUrl: string,
): Promise<{ naturalWidth: number; naturalHeight: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        resolve({
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
        });
        return;
      }

      reject(new Error("The selected image dimensions could not be read."));
    });
    image.addEventListener("error", () => {
      reject(new Error("The selected image dimensions could not be read."));
    });
    image.src = imageDataUrl;
  });
}

export function SignatureImagePicker({
  disabled,
  onSignatureSelected,
}: SignatureImagePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    if (!isSupportedSignatureImage(file)) {
      setErrorMessage("Choose a PNG or JPG signature image.");
      event.currentTarget.value = "";
      return;
    }

    setErrorMessage(null);
    setIsReading(true);

    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      const { naturalWidth, naturalHeight } =
        await readImageDimensions(imageDataUrl);

      onSignatureSelected({
        imageDataUrl,
        naturalWidth,
        naturalHeight,
      });
    } catch {
      setErrorMessage("The selected signature image could not be read.");
    } finally {
      setIsReading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="signature-picker">
      <label className="file-picker-label" htmlFor="signature-image-input">
        Import signature image
      </label>
      <input
        ref={inputRef}
        id="signature-image-input"
        type="file"
        accept="image/png,image/jpeg,.png,.jpg,.jpeg"
        disabled={disabled || isReading}
        onChange={handleImageChange}
      />
      <p className="helper-text">
        {isReading ? "Reading image..." : "PNG or JPG, kept in memory only."}
      </p>
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
    </div>
  );
}
