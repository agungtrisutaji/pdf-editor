export type OverlayKind = "text" | "signature" | "stamp";

export type BaseOverlay = {
  id: string;
  type: OverlayKind;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

export type TextOverlay = BaseOverlay & {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
};

export type SignatureOverlay = BaseOverlay & {
  type: "signature";
  imageDataUrl: string;
  opacity: number;
  naturalWidth: number;
  naturalHeight: number;
};

export type StampOverlay = BaseOverlay & {
  type: "stamp";
  label: string;
  color: string;
};

export type Overlay = TextOverlay | SignatureOverlay | StampOverlay;

export type OverlayPageState = Record<number, Overlay[]>;
