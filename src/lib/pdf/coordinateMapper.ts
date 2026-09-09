export type PreviewRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PageSize = {
  width: number;
  height: number;
};

export type PdfRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDegrees: number;
};

export type ContainedRect = {
  xOffset: number;
  yOffset: number;
  width: number;
  height: number;
};

export function mapPreviewRectToPdfRect({
  rect,
  previewPageSize,
  pdfPageSize,
  pageRotation = 0,
}: {
  rect: PreviewRect;
  previewPageSize: PageSize;
  pdfPageSize: PageSize;
  pageRotation?: number;
}): PdfRect {
  if (
    previewPageSize.width <= 0 ||
    previewPageSize.height <= 0 ||
    pdfPageSize.width <= 0 ||
    pdfPageSize.height <= 0
  ) {
    throw new Error("Cannot map overlay coordinates with an invalid page size.");
  }

  const normalizedRotation = ((pageRotation % 360) + 360) % 360;

  switch (normalizedRotation) {
    case 90: {
      const scaleX = pdfPageSize.width / previewPageSize.height;
      const scaleY = pdfPageSize.height / previewPageSize.width;
      return {
        x: (rect.y + rect.height) * scaleX,
        y: rect.x * scaleY,
        width: rect.width * scaleY,
        height: rect.height * scaleX,
        rotationDegrees: 90,
      };
    }
    case 180: {
      const scaleX = pdfPageSize.width / previewPageSize.width;
      const scaleY = pdfPageSize.height / previewPageSize.height;
      return {
        x: pdfPageSize.width - rect.x * scaleX,
        y: (rect.y + rect.height) * scaleY,
        width: rect.width * scaleX,
        height: rect.height * scaleY,
        rotationDegrees: 180,
      };
    }
    case 270: {
      const scaleX = pdfPageSize.width / previewPageSize.height;
      const scaleY = pdfPageSize.height / previewPageSize.width;
      return {
        x: pdfPageSize.width - (rect.y + rect.height) * scaleX,
        y: pdfPageSize.height - rect.x * scaleY,
        width: rect.width * scaleY,
        height: rect.height * scaleX,
        rotationDegrees: 270,
      };
    }
    case 0:
    default: {
      const scaleX = pdfPageSize.width / previewPageSize.width;
      const scaleY = pdfPageSize.height / previewPageSize.height;
      return {
        x: rect.x * scaleX,
        y: pdfPageSize.height - rect.y * scaleY - rect.height * scaleY,
        width: rect.width * scaleX,
        height: rect.height * scaleY,
        rotationDegrees: 0,
      };
    }
  }
}

export function rotateLocalVector({
  x,
  y,
  rotationDegrees,
}: {
  x: number;
  y: number;
  rotationDegrees: number;
}): { dx: number; dy: number } {
  const normalizedRotation = ((rotationDegrees % 360) + 360) % 360;

  switch (normalizedRotation) {
    case 90:
      return { dx: -y, dy: x };
    case 180:
      return { dx: -x, dy: -y };
    case 270:
      return { dx: y, dy: -x };
    case 0:
    default:
      return { dx: x, dy: y };
  }
}

export function getPageScale({
  previewPageSize,
  pdfPageSize,
  pageRotation = 0,
}: {
  previewPageSize: PageSize;
  pdfPageSize: PageSize;
  pageRotation?: number;
}): { scaleX: number; scaleY: number } {
  if (
    previewPageSize.width <= 0 ||
    previewPageSize.height <= 0 ||
    pdfPageSize.width <= 0 ||
    pdfPageSize.height <= 0
  ) {
    throw new Error("Cannot calculate page scale with an invalid page size.");
  }

  const normalizedRotation = ((pageRotation % 360) + 360) % 360;
  const isTransposed = normalizedRotation === 90 || normalizedRotation === 270;

  return {
    scaleX: isTransposed
      ? pdfPageSize.width / previewPageSize.height
      : pdfPageSize.width / previewPageSize.width,
    scaleY: isTransposed
      ? pdfPageSize.height / previewPageSize.width
      : pdfPageSize.height / previewPageSize.height,
  };
}

export function fitRectContain({
  containerWidth,
  containerHeight,
  contentAspectRatio,
}: {
  containerWidth: number;
  containerHeight: number;
  contentAspectRatio: number;
}): ContainedRect {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    contentAspectRatio <= 0 ||
    !Number.isFinite(contentAspectRatio)
  ) {
    return {
      xOffset: 0,
      yOffset: 0,
      width: containerWidth,
      height: containerHeight,
    };
  }

  const containerAspectRatio = containerWidth / containerHeight;

  if (containerAspectRatio > contentAspectRatio) {
    const height = containerHeight;
    const width = height * contentAspectRatio;

    return {
      xOffset: (containerWidth - width) / 2,
      yOffset: 0,
      width,
      height,
    };
  }

  const width = containerWidth;
  const height = width / contentAspectRatio;

  return {
    xOffset: 0,
    yOffset: (containerHeight - height) / 2,
    width,
    height,
  };
}
