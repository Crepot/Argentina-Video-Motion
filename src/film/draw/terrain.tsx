import React from "react";
import { createPrng } from "../../animation/stroke-draw";
import { mixColor, PALETTE } from "../../theme/palette";
import { planeMatrix, type Projector } from "../../stage/projection";

/**
 * ContourField / terrain (storyboard §B): mountain ranges are vertical
 * profile planes standing on ground lines (so they rise with camera tilt and
 * fold back into contour lines overhead), each with snow lines and limited
 * hatching on the shadow flank. Profiles are seeded once.
 */
export interface RidgeProfile {
  pts: readonly (readonly [number, number])[];
  peaks: readonly (readonly [number, number])[];
}

export const makeRidge = (seed: number, x0: number, x1: number, hMin: number, hMax: number, n: number): RidgeProfile => {
  const r = createPrng(seed);
  const pts: [number, number][] = [[x0, 0]];
  const peaks: [number, number][] = [];
  let x = x0;
  const step = (x1 - x0) / n;
  let up = true;
  while (x < x1) {
    x += step * (0.6 + r() * 0.8);
    const h = up ? hMin + (hMax - hMin) * (0.35 + 0.65 * r()) : hMin * (0.25 + 0.45 * r());
    const px = Math.min(x, x1);
    pts.push([px, h]);
    if (up) {
      peaks.push([px, h]);
    }
    up = !up;
  }
  pts.push([x1, 0]);
  return { pts, peaks };
};

const f1 = (n: number) => n.toFixed(1);

export const Ridge: React.FC<{
  p: Projector;
  profile: RidgeProfile;
  groundY: number;
  /** 0..1 rise of the profile (0 = contour line on the ground). */
  rise: number;
  fill: string;
  line?: string;
  snow?: number;
  hatch?: number;
  opacity?: number;
}> = ({ p, profile, groundY, rise, fill, line = PALETTE.deepBlueSoft, snow = 1, hatch = 1, opacity = 1 }) => {
  if (opacity <= 0.002) {
    return null;
  }
  const m = planeMatrix(p, [0, groundY, 0], [1, 0, 0], [0, 0, -Math.max(0.001, rise)]);
  const d = `M ${profile.pts.map(([x, h]) => `${f1(x)} ${f1(-h)}`).join(" L ")} Z`;
  let snowD = "";
  let hatchD = "";
  for (const [x, h] of profile.peaks) {
    if (h > 120) {
      const s = h * 0.22;
      snowD += `M ${f1(x - s * 0.9)} ${f1(-h + s)} L ${f1(x)} ${f1(-h)} L ${f1(x + s * 0.7)} ${f1(-h + s * 0.8)} L ${f1(x + s * 0.3)} ${f1(-h + s * 0.62)} L ${f1(x)} ${f1(-h + s * 0.95)} L ${f1(x - s * 0.35)} ${f1(-h + s * 0.7)} Z `;
    }
    for (let k = 1; k < 7; k++) {
      const t = k / 7;
      hatchD += `M ${f1(x + h * 0.08 * t)} ${f1(-h + h * t * 0.9)} l ${f1(h * 0.16)} ${f1(h * 0.1)} `;
    }
  }
  return (
    <g transform={m} opacity={opacity}>
      <path d={d} fill={fill} stroke={line} strokeWidth={1.1} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {hatch > 0.01 ? <path d={hatchD} stroke={line} strokeWidth={0.8} opacity={0.45 * hatch} vectorEffect="non-scaling-stroke" /> : null}
      {snow > 0.01 ? <path d={snowD} fill={PALETTE.paperWarm} opacity={snow} stroke={line} strokeWidth={0.6} strokeOpacity={0.5} vectorEffect="non-scaling-stroke" /> : null}
    </g>
  );
};

/** Foreground rock billboard (parallax plane). */
export const Rock: React.FC<{ p: Projector; x: number; y: number; s: number; seed: number; tone?: number }> = ({ p, x, y, s, seed, tone = 0 }) => {
  const r = createPrng(seed);
  const n = 7;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (i / n);
    const rad = 1 + (r() - 0.5) * 0.5;
    pts.push(`${f1(-Math.cos(a) * 60 * rad)} ${f1(-Math.sin(a) * 42 * rad)}`);
  }
  const m = planeMatrix(p, [x, y, 0], [s, 0, 0], [0, 0, -s]);
  const c = mixColor(mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.35), PALETTE.paperCool, tone);
  return (
    <g transform={m}>
      <path d={`M ${pts.join(" L ")} Z`} fill={c} stroke={PALETTE.deepBlue} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      <path d="M -20 -30 l 18 14 M 10 -26 l 16 10 M -40 -12 l 14 8" stroke={PALETTE.deepBlue} strokeWidth={0.9} opacity={0.5} vectorEffect="non-scaling-stroke" />
    </g>
  );
};
