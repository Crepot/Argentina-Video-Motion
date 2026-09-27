import React from "react";
import { lerp } from "../../animation/interpolate-clamped";
import { PALETTE } from "../../theme/palette";
import { K, ramp } from "../anim";
import { Laurel, type BranchState } from "../draw/laurel";
import type { FilmStage } from "../types";

/**
 * LaurelAnimation across eras (storyboard motif lock §5, one instance):
 * 1986 draws only the left branch in gold · 2014 the right branch begins in
 * pale blue and stops (its last leaf becomes South America) · 2021 several
 * right leaves earn gold · 2022 it hovers as a watermark, then completes
 * around the trophy · 3000 the leaves release into the final convergence.
 */
export interface LaurelFrame {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  s: number;
  opacity: number;
  left: BranchState;
  right: BranchState;
}

const CENTER = { cx: 960, cy: 500, rx: 430, ry: 340, s: 1 };
const EDGE = { cx: 1660, cy: 250, rx: 150, ry: 118, s: 0.36 };
const GOLD_LEFT: BranchState = { drawn: 11, gold: 11, base: PALETTE.goldMuted };

const n86 = K([
  [2394, 0, "atlasDrift"],
  [2436, 11],
]);
/** 2014: pale-blue right leaves begin and stop after four. */
export const R14 = K([
  [2766, 0, "atlasDrift"],
  [2782, 4],
]);
/** Index of the last pale leaf (the one that becomes South America). */
export const LEAF_TO_CONTINENT = 3;
const r21 = K([
  [2854, 4, "atlasDrift"],
  [2872, 7],
]);
const g21 = K([
  [2860, 0, "ceremonial"],
  [2880, 5],
]);
const r22 = K([
  [2980, 7, "ceremonial"],
  [2996, 11],
]);
const g22 = K([
  [2984, 5, "ceremonial"],
  [3000, 11],
]);

export const laurelAt = (f: number): LaurelFrame | null => {
  if (f >= 2380 && f < 2460) {
    const n = n86(f);
    return { ...CENTER, opacity: ramp(f, 2392, 2400) * (1 - ramp(f, 2432, 2450)), left: { drawn: n, gold: n, base: PALETTE.goldMuted }, right: { drawn: 0, gold: 0, guide: 0.25 } };
  }
  if (f >= 2712 && f < 2804) {
    const o = lerp(0.26, 0.85, ramp(f, 2766, 2778)) * ramp(f, 2712, 2728) * (1 - ramp(f, 2788, 2800));
    return { ...CENTER, opacity: o, left: GOLD_LEFT, right: { drawn: R14(f), gold: 0, base: PALETTE.skyBluePale, guide: 0.3 } };
  }
  if (f >= 2844 && f < 2896) {
    return { ...CENTER, opacity: 0.9 * ramp(f, 2846, 2858) * (1 - ramp(f, 2882, 2894)), left: GOLD_LEFT, right: { drawn: r21(f), gold: g21(f), base: PALETTE.skyBluePale, guide: 0.2 } };
  }
  if (f >= 2898 && f < 3030) {
    const c = ramp(f, 2966, 2982);
    const out = ramp(f, 3004, 3026);
    const grow = 1 + out * 0.25;
    return {
      cx: lerp(EDGE.cx, CENTER.cx, c),
      cy: lerp(EDGE.cy, CENTER.cy, c),
      rx: lerp(EDGE.rx, CENTER.rx, c) * grow,
      ry: lerp(EDGE.ry, CENTER.ry, c) * grow,
      s: lerp(EDGE.s, CENTER.s, c),
      opacity: lerp(0.38, 1, c) * ramp(f, 2900, 2914) * (1 - out),
      left: GOLD_LEFT,
      right: { drawn: r22(f), gold: g22(f), base: PALETTE.skyBluePale, guide: 0.2 },
    };
  }
  return null;
};

const LaurelOverlay: React.FC<{ f: number }> = ({ f }) => {
  const l = laurelAt(f);
  return l ? <Laurel cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} s={l.s} opacity={l.opacity} left={l.left} right={l.right} /> : null;
};

export const STAGE_LAUREL: FilmStage = { id: "laurel", from: 2380, to: 3030, Overlay: LaurelOverlay, order: 10 };
