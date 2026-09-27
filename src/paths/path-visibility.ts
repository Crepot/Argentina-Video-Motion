import type { Point, VisibleRange } from "../types/paths";
import { interpolatePoints } from "./interpolate-path";
import { MEMORY_LINE_STATES } from "./memory-line-states";

/**
 * Adjacent ranges with a zero-width gap and identical style are drawn as a
 * single stroke, so round caps never overlap into a darker dot while a gap is
 * still closed.
 */
export const mergeRanges = (
  ranges: readonly VisibleRange[],
): VisibleRange[] => {
  const out: VisibleRange[] = [];
  for (const r of ranges) {
    if (r.end - r.start <= 1e-5 || r.opacity <= 0.002) {
      continue;
    }
    const prev = out[out.length - 1];
    if (
      prev &&
      r.start - prev.end <= 1e-4 &&
      prev.color === r.color &&
      Math.abs(prev.opacity - r.opacity) < 1e-3 &&
      !prev.dash &&
      !r.dash
    ) {
      prev.end = Math.max(prev.end, r.end);
    } else {
      out.push({ ...r });
    }
  }
  return out;
};

/**
 * Geometry of memoryLine.main for the given morph weights. The four morph
 * windows never overlap, so the active pair is unambiguous.
 */
export const memoryLineGeometry = (m: {
  m1: number;
  m2: number;
  m3: number;
  m4: number;
}): Point[] => {
  const S = MEMORY_LINE_STATES;
  if (m.m4 > 0) {
    return interpolatePoints(S.southAtlanticIsobar, S.southAtlanticRoute, m.m4);
  }
  if (m.m3 > 0) {
    return interpolatePoints(S.stadiumBoundary, S.southAtlanticIsobar, m.m3);
  }
  if (m.m2 > 0) {
    return interpolatePoints(S.woundedTimeline, S.stadiumBoundary, m.m2);
  }
  return interpolatePoints(S.civicTimeline, S.woundedTimeline, m.m1);
};
