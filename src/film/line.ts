import { EASES } from "../animation/easing";
import { clamp01, progress } from "../animation/interpolate-clamped";
import { interpolatePoints } from "../paths/interpolate-path";
import { resamplePolyline, SAMPLE_COUNT } from "../paths/normalize-path";
import type { EaseId } from "../types/camera";
import type { Point } from "../types/paths";
import { catmullRomAt } from "../paths/interpolate-path";
import type { Placement } from "./space";
import { toWorld } from "./space";

/**
 * Helpers for memoryLine.main states: every state is an open polyline of 96
 * samples (spec §5.3), so any two states morph point to point.
 */
export const lineState = (ctrl: readonly Point[], smooth = true): Point[] => {
  if (!smooth || ctrl.length < 3) {
    return resamplePolyline(ctrl, SAMPLE_COUNT);
  }
  const dense: Point[] = [];
  for (let u = 0; u <= ctrl.length - 1; u += 0.05) {
    dense.push(catmullRomAt(ctrl, u));
  }
  dense.push(ctrl[ctrl.length - 1]);
  return resamplePolyline(dense, SAMPLE_COUNT);
};

export const placedState = (pl: Placement, ctrl: readonly Point[], smooth = true) =>
  lineState(ctrl.map((p) => toWorld(pl, p)), smooth);

/** Geometry key: at frame `f` the line is `pts`; `ease` shapes the morph to the next key. */
export interface GeoKey {
  f: number;
  pts: readonly Point[];
  ease?: EaseId;
}

export const morphTrack = (keys: readonly GeoKey[], f: number): readonly Point[] => {
  if (f <= keys[0].f) {
    return keys[0].pts;
  }
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f < b.f) {
      if (a.pts === b.pts) {
        return a.pts;
      }
      const t = EASES[a.ease ?? "atlasDrift"](progress(f, a.f, b.f));
      return interpolatePoints(a.pts, b.pts, t);
    }
  }
  return keys[keys.length - 1].pts;
};

/** Normalized progress on a state for the sample nearest to world x (monotone x lines). */
export const sAtX = (pts: readonly Point[], x: number) => {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i][0];
    const b = pts[i + 1][0];
    if ((x >= a && x <= b) || (x <= a && x >= b)) {
      const t = b === a ? 0 : (x - a) / (b - a);
      return clamp01((i + t) / (pts.length - 1));
    }
  }
  return x < pts[0][0] === pts[0][0] < pts[pts.length - 1][0] ? 0 : 1;
};

export const translateState = (pts: readonly Point[], dx: number, dy: number): Point[] =>
  pts.map((p) => [p[0] + dx, p[1] + dy]);

/** A 96-sample state built from parts with explicit sample budgets (stable s for joins). */
export const stateParts = (parts: readonly (readonly [readonly Point[], number])[], smooth = true): Point[] => {
  const out: Point[] = [];
  for (const [ctrl, n] of parts) {
    let dense: Point[];
    if (smooth && ctrl.length >= 3) {
      dense = [];
      for (let u = 0; u <= ctrl.length - 1; u += 0.05) {
        dense.push(catmullRomAt(ctrl, u));
      }
      dense.push(ctrl[ctrl.length - 1]);
    } else {
      dense = [...ctrl];
    }
    const total = dense.length > 1 ? dense.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - dense[i][0], p[1] - dense[i][1]), 0) : 0;
    out.push(...(total > 0 ? resamplePolyline(dense, n) : Array.from({ length: n }, () => ctrl[0])));
  }
  if (out.length !== SAMPLE_COUNT) {
    throw new Error(`stateParts: ${out.length} samples`);
  }
  return out;
};
