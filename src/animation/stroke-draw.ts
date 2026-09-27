import { clamp01 } from "./interpolate-clamped";

/**
 * Stroke reveal for paths declared with pathLength={1}: the dash pattern is
 * expressed in normalized length, so no DOM measurement is needed (§10.2).
 */
export const strokeDrawProps = (progress: number) => {
  const p = clamp01(progress);
  return {
    pathLength: 1,
    strokeDasharray: "1 1",
    strokeDashoffset: 1 - p,
  } as const;
};

/** Deterministic PRNG (mulberry32). Seeded once at module level; never per frame. */
export const createPrng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
