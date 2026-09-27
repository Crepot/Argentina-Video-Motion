import type { Point } from "../types/paths";

/** Point-to-point interpolation between two states of the same topology (§5.5). */
export const interpolatePoints = (
  a: readonly Point[],
  b: readonly Point[],
  t: number,
): Point[] => {
  if (a.length !== b.length) {
    throw new Error("interpolatePoints: topology mismatch");
  }
  if (t <= 0) {
    return a as Point[];
  }
  if (t >= 1) {
    return b as Point[];
  }
  return a.map((p, i) => [
    p[0] + (b[i][0] - p[0]) * t,
    p[1] + (b[i][1] - p[1]) * t,
  ]);
};

/** Uniform Catmull-Rom evaluation at fractional sample index u ∈ [0, n-1]. */
export const catmullRomAt = (pts: readonly Point[], u: number): Point => {
  const n = pts.length;
  const uc = Math.min(n - 1, Math.max(0, u));
  const i = Math.min(n - 2, Math.floor(uc));
  const t = uc - i;
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(n - 1, i + 2)];
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 *
    (2 * b +
      (-a + c) * t +
      (2 * a - 5 * b + 4 * c - d) * t2 +
      (-a + 3 * b - 3 * c + d) * t3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
};

/**
 * Deterministic smooth polyline for the normalized range [s0, s1] of a path.
 * Visible ranges never delete points: they only choose what is drawn (§5.3).
 */
export const sampleRange = (
  pts: readonly Point[],
  s0: number,
  s1: number,
  subdivisions = 5,
): Point[] => {
  const n = pts.length;
  const u0 = Math.max(0, Math.min(1, s0)) * (n - 1);
  const u1 = Math.max(0, Math.min(1, s1)) * (n - 1);
  if (u1 <= u0) {
    return [];
  }
  const out: Point[] = [catmullRomAt(pts, u0)];
  const step = 1 / subdivisions;
  let u = Math.floor(u0 / step) * step + step;
  while (u < u1 - 1e-6) {
    out.push(catmullRomAt(pts, u));
    u += step;
  }
  out.push(catmullRomAt(pts, u1));
  return out;
};

export const polylineToPath = (pts: readonly Point[]) => {
  if (pts.length === 0) {
    return "";
  }
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)}`;
  }
  return d;
};

/** Point and tangent angle (radians) at normalized progress s. */
export const pointAndAngleAt = (
  pts: readonly Point[],
  s: number,
): { p: Point; angle: number } => {
  const n = pts.length;
  const u = Math.max(0, Math.min(1, s)) * (n - 1);
  const p = catmullRomAt(pts, u);
  const q = catmullRomAt(pts, Math.min(n - 1, u + 0.05));
  const r = catmullRomAt(pts, Math.max(0, u - 0.05));
  return { p, angle: Math.atan2(q[1] - r[1], q[0] - r[0]) };
};
