import type React from "react";
import type { StageItem } from "../scenes/v2/stage-items";
import type { Projector } from "../stage/projection";
import type { CameraState } from "../types/camera";
import type { Point, VisibleRange } from "../types/paths";
import type { Placement } from "./space";

/** Per-frame context handed to every active stage. */
export interface FilmCtx {
  f: number;
  camera: CameraState;
  /** Projector for a sheet (and a parallax depth plane). */
  proj: (pl: Placement, depth?: number) => Projector;
  /** Screen-space culling test of a sheet-local ground point. */
  onScreen: (pl: Placement, x: number, y: number, depth?: number, margin?: number) => boolean;
}

/**
 * A stage is one period's contribution to the atlas: ground drawing (inside
 * the world layer, below memoryLine.main), standing items (people, ships,
 * architecture — depth sorted, above the line) and screen typography.
 * Stages never own the camera and never create the memory line.
 */
export interface FilmStage {
  id: string;
  from: number;
  to: number;
  /** Rendered inside the cartography world layer (world coordinates). */
  Ground?: React.FC<{ f: number; camera: CameraState }>;
  items?: (ctx: FilmCtx) => StageItem[];
  /** Screen-space HTML overlay (labels). */
  Overlay?: React.FC<{ f: number; camera: CameraState }>;
  /** Items are drawn after later stages' items (e.g. foreground planes). */
  order?: number;
}

export interface FilmLineFrame {
  points: readonly Point[];
  ranges: VisibleRange[];
  head: { s: number; opacity: number } | null;
  core: { start: number; end: number; opacity: number }[];
  /** Reference sheet the line is drawn through (tilt axis); identity if omitted. */
  sheet?: Placement;
}

/** One era of memoryLine.main. Consecutive eras must agree at their join. */
export interface LineEra {
  id: string;
  from: number;
  to: number;
  evaluate: (f: number) => FilmLineFrame;
}

export type { StageItem };
