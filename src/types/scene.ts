import type { FrameRange, GlobalFrame } from "./branded-frames";
import type { EaseId } from "./camera";
import type { LabelCue } from "./labels";
import type { PathStateCue } from "./paths";

export interface PaletteState {
  paper: string;
  primary: string;
  structural: string;
  subdued: string;
  gold: string;
  goldAllowed: boolean;
  /** 0..1, applied to tokens, never as a global CSS filter. */
  saturation: number;
}

export interface HistoricalLayerState {
  id: string;
  range: FrameRange;
  opacity: number;
  parallaxLayer: number;
  state:
    | "active"
    | "controlled"
    | "censored"
    | "missing"
    | "context-only"
    | "reopening";
}

export interface TransitionState {
  id: string;
  range: FrameRange;
  fromGeometry: string;
  toGeometry: string;
  progressEase: EaseId;
  preserveIds: readonly string[];
}

export interface AudioAnchor {
  id: string;
  frame: GlobalFrame;
  role:
    | "scene-entry"
    | "internal-transform"
    | "geometry-transform"
    | "next-scene";
  mandatory: boolean;
}

export interface SceneSpec {
  id: string;
  range: FrameRange;
  cameraPathId: string;
  paletteCues: readonly { frame: GlobalFrame; value: PaletteState }[];
  labels: readonly LabelCue[];
  pathCues: readonly PathStateCue[];
  historicalLayers: readonly HistoricalLayerState[];
  transitions: readonly TransitionState[];
  audioAnchors: readonly AudioAnchor[];
}

export interface MicroBlock {
  id: string;
  range: FrameRange;
  role: string;
}
