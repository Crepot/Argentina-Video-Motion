import type { Point } from "../types/paths";

/** Every morph family shares this topology (§5.3). */
export const SAMPLE_COUNT = 96;

export const polylineLength = (pts: readonly Point[]) => {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return len;
};

/** Resamples a polyline to `count` points evenly spaced by arc length. */
export const resamplePolyline = (
  pts: readonly Point[],
  count: number,
): Point[] => {
  const total = polylineLength(pts);
  const out: Point[] = [];
  let seg = 1;
  let acc = 0;
  for (let i = 0; i < count; i++) {
    const target = (i / (count - 1)) * total;
    while (seg < pts.length - 1 && acc + segLen(pts, seg) < target) {
      acc += segLen(pts, seg);
      seg++;
    }
    const l = segLen(pts, seg);
    const t = l === 0 ? 0 : Math.min(1, (target - acc) / l);
    const a = pts[seg - 1];
    const b = pts[seg];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
};

const segLen = (pts: readonly Point[], i: number) =>
  Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);

export const assertSampleCount = (id: string, pts: readonly Point[]) => {
  if (pts.length !== SAMPLE_COUNT) {
    throw new Error(
      `${id}: expected ${SAMPLE_COUNT} samples, got ${pts.length}`,
    );
  }
};
