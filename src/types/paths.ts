import type { EaseId } from "./camera";

export type Point = readonly [number, number];

export type PathId =
  | "memoryLine.main"
  | "colonialRoute"
  | "civicTimeline"
  | "woundedTimeline"
  | "stadiumBoundary"
  | "southAtlanticIsobar"
  | "southAtlanticRoute"
  | "ballTrajectory1978"
  | "navalGuide1982"
  | "maradonaThread"
  | "messiThread"
  | "nationalOutline";

export type MemoryLineMode =
  | "civicTimeline"
  | "woundedTimeline"
  | "stadiumBoundary"
  | "southAtlanticIsobar"
  | "southAtlanticRoute";

export interface NormalizedPathGeometry {
  id: PathId;
  points: readonly Point[];
  closed: false;
  sampleCount: 96;
}

/** Semantic state declared by the timeline; geometry lives in the registry. */
export interface PathStateCue {
  frame: number;
  mode: MemoryLineMode;
  geometryId: PathId;
  visibleRanges: readonly (readonly [number, number])[];
  strokeToken: string;
  opacity: number;
  morphEase: EaseId;
}

/** One visible stretch of a persistent path, in normalized progress 0..1. */
export interface VisibleRange {
  start: number;
  end: number;
  opacity: number;
  color: string;
  /** Screen-px dash pattern; undefined = solid. */
  dash?: readonly [number, number];
}
