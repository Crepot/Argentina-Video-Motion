import React from "react";
import { lerp } from "../animation/interpolate-clamped";
import {
  BOWL_RINGS,
  GRID_J_RANGE,
  GRID_K_RANGE,
  gridX,
  gridY,
  PITCH,
} from "../atlas/geometry/stadium";
import { graticuleX, graticuleY } from "../atlas/south-atlantic-geometry";

/**
 * atlas.grid.main — one grid that changes function without unmounting
 * (§9.3): civic plot grid → controlled grid → pitch seed → South Atlantic
 * graticule. `transitionProgress` is the ocean registration: every line V_k /
 * H_j slides to its meridian / parallel, so the projection change is visible.
 * The pitch cell and the stadium ring spans are left open here because
 * FootballPitch draws those exact segments; the gaps close again as the
 * stadium dissolves into cartography.
 */
export interface CartographicGridProps {
  mode: "institutional" | "controlled" | "pitch-seed" | "ocean";
  color: string;
  opacity: number;
  strokeWidth: number;
  transitionProgress: number;
  /** 0 = pitch cell open, 1 = closed by the graticule. */
  pitchGapClose: number;
  /** 0 = ring spans open, 1 = closed. */
  ringGapClose: number;
}

// Linear maps from grid coordinates to graticule coordinates.
const K_SPAN = [GRID_K_RANGE[0], GRID_K_RANGE[1]] as const;
const kOfX = (x: number) => (x - gridX(0)) / (gridX(1) - gridX(0));
const jOfY = (y: number) => (y - gridY(0)) / (gridY(1) - gridY(0));
const gxTo = (x: number, p: number) => {
  const k = kOfX(x);
  const ox = graticuleX(0) + k * (graticuleX(1) - graticuleX(0));
  return lerp(x, ox, p);
};
const gyTo = (y: number, p: number) => {
  const j = jOfY(y);
  const oy = graticuleY(0) + j * (graticuleY(1) - graticuleY(0));
  return lerp(y, oy, p);
};

const V_EXTENT = [
  gridY(GRID_J_RANGE[0]) - 40,
  gridY(GRID_J_RANGE[1]) + 40,
] as const;
const H_EXTENT = [gridX(K_SPAN[0]) - 40, gridX(K_SPAN[1]) + 40] as const;

/** A 1D segment [a, b] with an optional gap [g0, g1] that narrows as it closes. */
const segmentWithGap = (
  a: number,
  b: number,
  gap: readonly [number, number] | null,
  close: number,
) => {
  if (!gap || close >= 1) {
    return [[a, b]] as [number, number][];
  }
  const mid = (gap[0] + gap[1]) / 2;
  const half = ((gap[1] - gap[0]) / 2) * (1 - close);
  return [
    [a, mid - half],
    [mid + half, b],
  ] as [number, number][];
};

export const CartographicGrid: React.FC<CartographicGridProps> = ({
  mode,
  color,
  opacity,
  strokeWidth,
  transitionProgress: p,
  pitchGapClose,
  ringGapClose,
}) => {
  let d = "";
  for (let k = K_SPAN[0]; k <= K_SPAN[1]; k++) {
    const x = gxTo(gridX(k), p);
    const inPitch = k >= 0 && k <= 4;
    const parts = segmentWithGap(
      V_EXTENT[0],
      V_EXTENT[1],
      inPitch ? [PITCH.top, PITCH.bottom] : null,
      pitchGapClose,
    );
    for (const [y0, y1] of parts) {
      d += `M ${x.toFixed(2)} ${gyTo(y0, p).toFixed(2)} V ${gyTo(y1, p).toFixed(2)} `;
    }
  }
  for (let j = GRID_J_RANGE[0]; j <= GRID_J_RANGE[1]; j++) {
    const y = gyTo(gridY(j), p);
    const ring = BOWL_RINGS.find(
      (r) => r.upperGridJ === j || r.lowerGridJ === j,
    );
    const inPitch = j >= 0 && j <= 3;
    const gap: [number, number] | null = ring
      ? [ring.stadium.cx - ring.stadium.rx, ring.stadium.cx + ring.stadium.rx]
      : inPitch
        ? [PITCH.left, PITCH.right]
        : null;
    const parts = segmentWithGap(
      H_EXTENT[0],
      H_EXTENT[1],
      gap,
      ring ? ringGapClose : pitchGapClose,
    );
    for (const [x0, x1] of parts) {
      d += `M ${gxTo(x0, p).toFixed(2)} ${y.toFixed(2)} H ${gxTo(x1, p).toFixed(2)} `;
    }
  }
  return (
    <path
      data-id="atlas.grid.main"
      data-mode={mode}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      opacity={opacity}
    />
  );
};

/** Grid → graticule mapping, shared with components that ride on the grid. */
export const mapGridPoint = (x: number, y: number, p: number) =>
  [gxTo(x, p), gyTo(y, p)] as const;
