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
};

export function mapPreviewRectToPdfRect({
  rect,
  previewPageSize,
  pdfPageSize,
}: {
  rect: PreviewRect;
  previewPageSize: PageSize;
  pdfPageSize: PageSize;
}): PdfRect {
  if (
    previewPageSize.width <= 0 ||
    previewPageSize.height <= 0 ||
    pdfPageSize.width <= 0 ||
    pdfPageSize.height <= 0
  ) {
    throw new Error("Cannot map overlay coordinates with an invalid page size.");
  }

  const scaleX = pdfPageSize.width / previewPageSize.width;
  const scaleY = pdfPageSize.height / previewPageSize.height;
  const width = rect.width * scaleX;
  const height = rect.height * scaleY;

  return {
    x: rect.x * scaleX,
    y: pdfPageSize.height - rect.y * scaleY - height,
    width,
    height,
  };
}

export function getPageScale({
  previewPageSize,
  pdfPageSize,
}: {
  previewPageSize: PageSize;
  pdfPageSize: PageSize;
}): { scaleX: number; scaleY: number } {
  if (
    previewPageSize.width <= 0 ||
    previewPageSize.height <= 0 ||
    pdfPageSize.width <= 0 ||
    pdfPageSize.height <= 0
  ) {
    throw new Error("Cannot calculate page scale with an invalid page size.");
  }

  return {
    scaleX: pdfPageSize.width / previewPageSize.width,
    scaleY: pdfPageSize.height / previewPageSize.height,
  };
}
