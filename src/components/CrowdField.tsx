import React from "react";
import { lerp } from "../animation/interpolate-clamped";
import {
  BOWL_RINGS,
  CROWD_STROKES,
  ellipsePoint,
  type EllipseParams,
  lerpEllipse,
  SOUTH_ATLANTIC_ISOBAR,
  STADIUM_BOUNDARY,
} from "../atlas/geometry/stadium";

/**
 * Stadium crowd as one patterned path (§11.1): short radial strokes between
 * the memory-line boundary and the bowl rings. In block K the same strokes
 * rotate to the ring tangents and lengthen: crowd becomes wind hatching.
 */
export interface CrowdFieldProps {
  intensity: number;
  /** Low-frequency wave amplitude (0..~0.35). */
  wave: number;
  globalFrame: number;
  /** 0 = radial crowd, 1 = tangential wind hatching. */
  windProgress: number;
  isobarProgress: number;
  color: string;
  strokeWidth: number;
}

const GATE: readonly [number, number] = [128, 187];

export const CrowdField: React.FC<CrowdFieldProps> = ({
  intensity,
  wave,
  globalFrame,
  windProgress: w,
  isobarProgress,
  color,
  strokeWidth,
}) => {
  if (intensity <= 0.002) {
    return null;
  }
  const boundary = lerpEllipse(
    STADIUM_BOUNDARY,
    SOUTH_ATLANTIC_ISOBAR,
    isobarProgress,
  );
  const inner = lerpEllipse(
    BOWL_RINGS[0].stadium,
    BOWL_RINGS[0].isobar,
    isobarProgress,
  );
  const outer = lerpEllipse(
    BOWL_RINGS[1].stadium,
    BOWL_RINGS[1].isobar,
    isobarProgress,
  );
  const tiers: [EllipseParams, EllipseParams][] = [
    [boundary, inner],
    [inner, outer],
  ];
  let d = "";
  for (const c of CROWD_STROKES) {
    const tt = ((c.t % 360) + 360) % 360;
    if (c.tier === 0 && tt > GATE[0] && tt < GATE[1]) {
      continue;
    }
    const [ea, eb] = tiers[c.tier];
    const at = (r: number) => {
      const p = ellipsePoint(ea, c.t);
      const q = ellipsePoint(eb, c.t);
      return [lerp(p[0], q[0], r), lerp(p[1], q[1], r)] as const;
    };
    const swell =
      1 +
      wave *
        Math.sin(
          (globalFrame / 38) * Math.PI * 2 -
            (c.t * Math.PI) / 60 +
            c.phase * 0.2,
        );
    const half = (c.length * swell * 0.9) / 2;
    const r0 = at(Math.max(0, c.r - half));
    const r1 = at(Math.min(1, c.r + half));
    const mid = at(c.r);
    // Tangent from neighbouring parameters on the mid ellipse.
    const m = lerpEllipse(ea, eb, c.r);
    const pa = ellipsePoint(m, c.t - 0.6);
    const pb = ellipsePoint(m, c.t + 0.6);
    const tl = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) || 1;
    const windHalf = 26 + 18 * c.length;
    const w0 = [
      mid[0] - ((pb[0] - pa[0]) / tl) * windHalf,
      mid[1] - ((pb[1] - pa[1]) / tl) * windHalf,
    ];
    const w1 = [
      mid[0] + ((pb[0] - pa[0]) / tl) * windHalf,
      mid[1] + ((pb[1] - pa[1]) / tl) * windHalf,
    ];
    const x0 = lerp(r0[0], w0[0], w);
    const y0 = lerp(r0[1], w0[1], w);
    const x1 = lerp(r1[0], w1[0], w);
    const y1 = lerp(r1[1], w1[1], w);
    d += `M ${x0.toFixed(1)} ${y0.toFixed(1)} L ${x1.toFixed(1)} ${y1.toFixed(1)} `;
  }
  return (
    <path
      data-id="stadium.crowd"
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity={intensity}
    />
  );
};
