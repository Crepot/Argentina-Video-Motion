import type { FrameRange } from "./branded-frames";

export type LabelKind = "date" | "event" | "anthem" | "map" | "legal";
export type LabelMode = "world" | "hybrid" | "stabilized";
export type LabelAlign = "left" | "center" | "right";

export interface LabelCue {
  id: string;
  kind: LabelKind;
  text: readonly string[];
  range: FrameRange;
  enterFrames: number;
  exitFrames: number;
  anchor: readonly [number, number];
  mode: LabelMode;
  align: LabelAlign;
  maxWidthPx: number;
}
