import { clamp01, smoothTrack, track, type Key } from "../animation/interpolate-clamped";
import type { CameraState } from "../types/camera";

/** Keyed track shorthand: K([[f, v, ease?], …])(f). */
export const K = (keys: readonly Key[]) => (f: number) => track(f, keys);

/** Smooth (monotone cubic) keyed track. */
export const S = (keys: readonly (readonly [number, number])[]) => (f: number) => smoothTrack(f, keys);

/** 0 → 1 → 0 window with ramps. */
export const win = (f: number, a: number, b: number, c: number, d: number) =>
  f <= a || f >= d ? 0 : f < b ? smooth01((f - a) / (b - a)) : f <= c ? 1 : smooth01((d - f) / (d - c));

export const smooth01 = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

export const ramp = (f: number, a: number, b: number) => smooth01((f - a) / (b - a));

/**
 * Standing objects lie flat on the chart when the camera is overhead and
 * stand as it tilts: fold = 1 at tilt ≤ t0, 0 at tilt ≥ t1.
 */
export const foldFromTilt = (c: CameraState, t0 = 6, t1 = 30) => 1 - smooth01(((c.tilt ?? 0) - t0) / (t1 - t0));

/** Deterministic hash → [0, 1). */
export const hash01 = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
