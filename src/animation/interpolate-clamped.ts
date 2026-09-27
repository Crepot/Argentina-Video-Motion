import type { EaseId } from "../types/camera";
import { EASES } from "./easing";

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const clamp01 = (v: number) => clamp(v, 0, 1);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Normalized progress of `frame` inside [start, end], clamped. */
export const progress = (frame: number, start: number, end: number) =>
  end === start
    ? frame >= end
      ? 1
      : 0
    : clamp01((frame - start) / (end - start));

/**
 * A keyframe: [globalFrame, value, easeToNext]. The ease applies to the
 * segment that starts at this key. Default is `linearTravel`.
 */
export type Key = readonly [number, number, EaseId?];

/** Piecewise eased interpolation with clamp extrapolation on both sides. */
export const track = (frame: number, keys: readonly Key[]): number => {
  if (keys.length === 0) {
    throw new Error("track() needs at least one key");
  }
  if (frame <= keys[0][0]) {
    return keys[0][1];
  }
  const last = keys[keys.length - 1];
  if (frame >= last[0]) {
    return last[1];
  }
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0, ease] = keys[i];
    const [f1, v1] = keys[i + 1];
    if (frame >= f0 && frame < f1) {
      const t = EASES[ease ?? "linearTravel"](progress(frame, f0, f1));
      return lerp(v0, v1, t);
    }
  }
  return last[1];
};

/**
 * Monotone cubic (Fritsch–Carlson) interpolation through keys. Used where a
 * value must pass exact anchor values without a velocity discontinuity at the
 * interior keys (e.g. the stadium→isobar morph crossing the 2084/2085 anchor).
 * `endSlopes: 'zero'` settles at both ends; `'secant'` keeps travelling.
 */
export const smoothTrack = (
  frame: number,
  keys: readonly (readonly [number, number])[],
  endSlopes: "zero" | "secant" = "zero",
): number => {
  const n = keys.length;
  if (frame <= keys[0][0]) {
    return keys[0][1];
  }
  if (frame >= keys[n - 1][0]) {
    return keys[n - 1][1];
  }
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    d.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]));
  }
  const m: number[] = new Array(n).fill(0);
  m[0] = endSlopes === "zero" ? 0 : d[0];
  m[n - 1] = endSlopes === "zero" ? 0 : d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) {
      m[i] = 0;
    } else {
      // Weighted harmonic mean keeps the curve monotone.
      const h0 = keys[i][0] - keys[i - 1][0];
      const h1 = keys[i + 1][0] - keys[i][0];
      const w1 = 2 * h1 + h0;
      const w2 = h1 + 2 * h0;
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  let i = 0;
  while (i < n - 2 && frame >= keys[i + 1][0]) {
    i++;
  }
  const h = keys[i + 1][0] - keys[i][0];
  const t = (frame - keys[i][0]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * keys[i][1] +
    (t3 - 2 * t2 + t) * h * m[i] +
    (-2 * t3 + 3 * t2) * keys[i + 1][1] +
    (t3 - t2) * h * m[i + 1]
  );
};
