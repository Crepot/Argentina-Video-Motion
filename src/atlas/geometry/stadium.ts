import { createPrng } from "../../animation/stroke-draw";
import type { Point } from "../../types/paths";
import { ANCHORS } from "../atlas-anchors";

/**
 * One grid carries the whole benchmark (atlas.grid.main). Its module is the
 * pitch: the "surviving rectangle" of the controlled grid is exactly 4 × 3
 * modules, so grid and stadium share the same four corner anchors (§8.10).
 */
export const GRID_MODULE = { x: 104, y: 90 } as const;

const [CX, CY] = ANCHORS.stadiumCenter;

export const PITCH = {
  center: ANCHORS.stadiumCenter,
  width: GRID_MODULE.x * 4,
  height: GRID_MODULE.y * 3,
  left: CX - GRID_MODULE.x * 2,
  right: CX + GRID_MODULE.x * 2,
  top: CY - GRID_MODULE.y * 1.5,
  bottom: CY + GRID_MODULE.y * 1.5,
} as const;

/** Grid line coordinates: V_k at x = GRID_ORIGIN.x + k·104, H_j at y = GRID_ORIGIN.y + j·90. */
export const GRID_ORIGIN = { x: PITCH.left, y: PITCH.top } as const;
export const GRID_K_RANGE = [-14, 26] as const;
export const GRID_J_RANGE = [-4, 14] as const;
export const gridX = (k: number) => GRID_ORIGIN.x + k * GRID_MODULE.x;
export const gridY = (j: number) => GRID_ORIGIN.y + j * GRID_MODULE.y;

// Real proportions of a 105 × 68 m pitch mapped onto the 416 × 270 cell.
const sx = PITCH.width / 105;
const sy = PITCH.height / 68;
const PENALTY_DEPTH = 16.5 * sx;
const PENALTY_HALF = (40.32 / 2) * sy;
const GOAL_AREA_DEPTH = 5.5 * sx;
const GOAL_AREA_HALF = (18.32 / 2) * sy;
export const CENTER_CIRCLE_R = 9.15 * sy;
export const PENALTY_SPOT = 11 * sx;
export const GOAL_HALF = (7.32 / 2) * sy;

export interface MorphSegment {
  id: string;
  /** Role inside the controlled grid. */
  grid: readonly [Point, Point];
  /** Role on the 1978 pitch. */
  pitch: readonly [Point, Point];
  /** Touchlines, goal lines and halfway fade at different times (§8.14). */
  fadeGroup: "touch" | "goal" | "halfway" | "box" | "goalArea";
}

const L = PITCH.left;
const R = PITCH.right;
const T = PITCH.top;
const B = PITCH.bottom;

const mirror = (s: MorphSegment, id: string): MorphSegment => ({
  id,
  fadeGroup: s.fadeGroup,
  grid: [
    [2 * CX - s.grid[0][0], s.grid[0][1]],
    [2 * CX - s.grid[1][0], s.grid[1][1]],
  ],
  pitch: [
    [2 * CX - s.pitch[0][0], s.pitch[0][1]],
    [2 * CX - s.pitch[1][0], s.pitch[1][1]],
  ],
});

const leftSide: MorphSegment[] = [
  // Interior grid vertical V_1 slides in and shortens into the box front.
  {
    id: "boxFront",
    fadeGroup: "box",
    grid: [
      [gridX(1), T],
      [gridX(1), B],
    ],
    pitch: [
      [L + PENALTY_DEPTH, CY - PENALTY_HALF],
      [L + PENALTY_DEPTH, CY + PENALTY_HALF],
    ],
  },
  // Interior grid horizontals H_1 / H_2 (west half) become the box sides.
  {
    id: "boxTop",
    fadeGroup: "box",
    grid: [
      [L, gridY(1)],
      [CX, gridY(1)],
    ],
    pitch: [
      [L, CY - PENALTY_HALF],
      [L + PENALTY_DEPTH, CY - PENALTY_HALF],
    ],
  },
  {
    id: "boxBottom",
    fadeGroup: "box",
    grid: [
      [L, gridY(2)],
      [CX, gridY(2)],
    ],
    pitch: [
      [L, CY + PENALTY_HALF],
      [L + PENALTY_DEPTH, CY + PENALTY_HALF],
    ],
  },
  // The grid's mid-edge registration tick opens into the goal area.
  {
    id: "goalAreaTop",
    fadeGroup: "goalArea",
    grid: [
      [L, CY - 10],
      [L + 16, CY - 10],
    ],
    pitch: [
      [L, CY - GOAL_AREA_HALF],
      [L + GOAL_AREA_DEPTH, CY - GOAL_AREA_HALF],
    ],
  },
  {
    id: "goalAreaFront",
    fadeGroup: "goalArea",
    grid: [
      [L + 16, CY - 10],
      [L + 16, CY + 10],
    ],
    pitch: [
      [L + GOAL_AREA_DEPTH, CY - GOAL_AREA_HALF],
      [L + GOAL_AREA_DEPTH, CY + GOAL_AREA_HALF],
    ],
  },
  {
    id: "goalAreaBottom",
    fadeGroup: "goalArea",
    grid: [
      [L, CY + 10],
      [L + 16, CY + 10],
    ],
    pitch: [
      [L, CY + GOAL_AREA_HALF],
      [L + GOAL_AREA_DEPTH, CY + GOAL_AREA_HALF],
    ],
  },
];

export const PITCH_SEGMENTS: readonly MorphSegment[] = [
  {
    id: "touchTop",
    fadeGroup: "touch",
    grid: [
      [L, T],
      [R, T],
    ],
    pitch: [
      [L, T],
      [R, T],
    ],
  },
  {
    id: "touchBottom",
    fadeGroup: "touch",
    grid: [
      [L, B],
      [R, B],
    ],
    pitch: [
      [L, B],
      [R, B],
    ],
  },
  {
    id: "goalLineW",
    fadeGroup: "goal",
    grid: [
      [L, T],
      [L, B],
    ],
    pitch: [
      [L, T],
      [L, B],
    ],
  },
  {
    id: "goalLineE",
    fadeGroup: "goal",
    grid: [
      [R, T],
      [R, B],
    ],
    pitch: [
      [R, T],
      [R, B],
    ],
  },
  {
    id: "halfway",
    fadeGroup: "halfway",
    grid: [
      [CX, T],
      [CX, B],
    ],
    pitch: [
      [CX, T],
      [CX, B],
    ],
  },
  ...leftSide.map((s) => ({ ...s, id: `${s.id}W` })),
  ...leftSide.map((s) => mirror(s, `${s.id}E`)),
];

/** The institutional lock marker at the cell centre: a square that becomes the centre circle. */
export const LOCK_HALF = 7;
export const centerLockToCircle = (t: number, samples = 48): Point[] => {
  const pts: Point[] = [];
  for (let i = 0; i < samples; i++) {
    const a = (i / samples) * Math.PI * 2 - Math.PI / 4;
    const c = Math.cos(a);
    const s = Math.sin(a);
    // Point on the square with the same angle.
    const k = LOCK_HALF / Math.max(Math.abs(c), Math.abs(s));
    const sq: Point = [CX + c * k, CY + s * k];
    const ci: Point = [CX + c * CENTER_CIRCLE_R, CY + s * CENTER_CIRCLE_R];
    pts.push([sq[0] + (ci[0] - sq[0]) * t, sq[1] + (ci[1] - sq[1]) * t]);
  }
  return pts;
};

export const PENALTY_ARC = {
  radius: CENTER_CIRCLE_R,
  halfAngle: Math.acos((PENALTY_DEPTH - PENALTY_SPOT) / CENTER_CIRCLE_R),
};

/* ---------------------------------------------------------------- ellipses */

export interface EllipseParams {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Degrees, clockwise in screen space. */
  tilt: number;
}

export const ellipsePoint = (
  e: EllipseParams,
  tDeg: number,
  radial = 1,
): Point => {
  const t = (tDeg * Math.PI) / 180;
  const a = (e.tilt * Math.PI) / 180;
  const lx = e.rx * radial * Math.cos(t);
  const ly = e.ry * radial * Math.sin(t);
  return [
    e.cx + lx * Math.cos(a) - ly * Math.sin(a),
    e.cy + lx * Math.sin(a) + ly * Math.cos(a),
  ];
};

export const ellipseTangentAngle = (e: EllipseParams, tDeg: number) => {
  const t = (tDeg * Math.PI) / 180;
  const a = (e.tilt * Math.PI) / 180;
  const dx = -e.rx * Math.sin(t);
  const dy = e.ry * Math.cos(t);
  return Math.atan2(
    dx * Math.sin(a) + dy * Math.cos(a),
    dx * Math.cos(a) - dy * Math.sin(a),
  );
};

export const lerpEllipse = (
  a: EllipseParams,
  b: EllipseParams,
  t: number,
): EllipseParams => ({
  cx: a.cx + (b.cx - a.cx) * t,
  cy: a.cy + (b.cy - a.cy) * t,
  rx: a.rx + (b.rx - a.rx) * t,
  ry: a.ry + (b.ry - a.ry) * t,
  tilt: a.tilt + (b.tilt - a.tilt) * t,
});

/** Memory-line stadium boundary (aspect 1.75, §8.14). */
export const STADIUM_BOUNDARY: EllipseParams = {
  cx: CX,
  cy: CY,
  rx: 350,
  ry: 200,
  tilt: 0,
};

/**
 * South Atlantic isobar the boundary stretches into (aspect 2.55). West end
 * stays beside the stadium; the east end reaches toward the islands.
 */
const ISOBAR_WEST: Point = [3700, 2230];
const ISOBAR_EAST: Point = [5450, 2680];
const isobarFromEnds = (w: Point, e: Point, aspect: number): EllipseParams => {
  const dx = e[0] - w[0];
  const dy = e[1] - w[1];
  const rx = Math.hypot(dx, dy) / 2;
  return {
    cx: (w[0] + e[0]) / 2,
    cy: (w[1] + e[1]) / 2,
    rx,
    ry: rx / aspect,
    tilt: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
};
export const SOUTH_ATLANTIC_ISOBAR = isobarFromEnds(
  ISOBAR_WEST,
  ISOBAR_EAST,
  2.55,
);

/**
 * Stadium bowl rings. Before 1908 they are the horizontal atlas grid lines
 * H_-1/H_4 and H_-2/H_5 ("latitude lines around Buenos Aires"); after, closed
 * rings; after 2085, isobars nested around the memory-line isobar (scaled
 * about an interior point so they can never intersect it).
 */
const RING_PIVOT: Point = [5300, 2640];
const scaleAbout = (e: EllipseParams, s: number): EllipseParams => ({
  cx: RING_PIVOT[0] + (e.cx - RING_PIVOT[0]) * s,
  cy: RING_PIVOT[1] + (e.cy - RING_PIVOT[1]) * s,
  rx: e.rx * s,
  ry: e.ry * s,
  tilt: e.tilt,
});

export interface BowlRing {
  id: string;
  upperGridJ: number;
  lowerGridJ: number;
  stadium: EllipseParams;
  isobar: EllipseParams;
}

export const BOWL_RINGS: readonly BowlRing[] = [
  {
    id: "ringInner",
    upperGridJ: -1,
    lowerGridJ: 4,
    stadium: { cx: CX, cy: CY, rx: 410, ry: 250, tilt: 0 },
    isobar: scaleAbout(SOUTH_ATLANTIC_ISOBAR, 1.12),
  },
  {
    id: "ringOuter",
    upperGridJ: -2,
    lowerGridJ: 5,
    stadium: { cx: CX, cy: CY, rx: 470, ry: 305, tilt: 0 },
    isobar: scaleAbout(SOUTH_ATLANTIC_ISOBAR, 1.24),
  },
];

/* ------------------------------------------------------------------ crowd */

export interface CrowdStroke {
  /** Ellipse parameter, degrees. */
  t: number;
  /** Radial position inside the tier annulus, 0..1. */
  r: number;
  length: number;
  tier: 0 | 1;
  phase: number;
}

/** Seeded once (PRNG 1978); the crowd is a patterned field, not particles. */
export const CROWD_STROKES: readonly CrowdStroke[] = (() => {
  const rand = createPrng(1978);
  const out: CrowdStroke[] = [];
  const tiers: [0 | 1, number][] = [
    [0, 104],
    [1, 128],
  ];
  for (const [tier, count] of tiers) {
    for (let i = 0; i < count; i++) {
      const t = (i / count) * 360 + (rand() - 0.5) * (240 / count);
      out.push({
        t,
        r: 0.3 + rand() * 0.4,
        length: 0.35 + rand() * 0.25,
        tier,
        phase: rand() * Math.PI * 2,
      });
    }
  }
  return out;
})();

/* ----------------------------------------------------------------- trophy */

/**
 * Simplified, original trophy silhouette drawn from its vertical axis: a
 * two-band base, a waisted stem that opens into two arms cradling a globe.
 * An editorial interpretation, not a reproduction of any real object.
 */
const tx = (dx: number) => CX + dx;
const ty = (dy: number) => CY + dy;
const trophySide = (m: 1 | -1) =>
  `M ${tx(-15 * m)} ${ty(46)} C ${tx(-9 * m)} ${ty(34)}, ${tx(-6 * m)} ${ty(22)}, ${tx(-8 * m)} ${ty(12)} C ${tx(-12 * m)} ${ty(-6)}, ${tx(-28 * m)} ${ty(-18)}, ${tx(-27 * m)} ${ty(-36)} C ${tx(-26 * m)} ${ty(-48)}, ${tx(-19 * m)} ${ty(-57)}, ${tx(-12 * m)} ${ty(-62)}`;
export const TROPHY = {
  axis: [
    [CX, ty(80)],
    [CX, ty(-98)],
  ] as const,
  base: `M ${tx(-24)} ${ty(72)} H ${tx(24)} L ${tx(21)} ${ty(60)} H ${tx(-21)} Z M ${tx(-19)} ${ty(60)} L ${tx(-16)} ${ty(46)} H ${tx(16)} L ${tx(19)} ${ty(60)}`,
  body: `${trophySide(1)} ${trophySide(-1)}`,
  spiral: `M ${tx(-7)} ${ty(10)} C ${tx(2)} ${ty(-8)}, ${tx(14)} ${ty(-20)}, ${tx(19)} ${ty(-42)} M ${tx(7)} ${ty(10)} C ${tx(-2)} ${ty(-8)}, ${tx(-14)} ${ty(-20)}, ${tx(-19)} ${ty(-42)}`,
  bodyFill: `M ${tx(-15)} ${ty(46)} C ${tx(-9)} ${ty(34)}, ${tx(-6)} ${ty(22)}, ${tx(-8)} ${ty(12)} C ${tx(-12)} ${ty(-6)}, ${tx(-28)} ${ty(-18)}, ${tx(-27)} ${ty(-36)} C ${tx(-26)} ${ty(-48)}, ${tx(-19)} ${ty(-57)}, ${tx(-12)} ${ty(-62)} L ${tx(12)} ${ty(-62)} C ${tx(19)} ${ty(-57)}, ${tx(26)} ${ty(-48)}, ${tx(27)} ${ty(-36)} C ${tx(28)} ${ty(-18)}, ${tx(12)} ${ty(-6)}, ${tx(8)} ${ty(12)} C ${tx(6)} ${ty(22)}, ${tx(9)} ${ty(34)}, ${tx(15)} ${ty(46)} Z`,
  globe: { cx: CX, cy: ty(-70), r: 19 },
  hatch: (() => {
    let d = "";
    for (let x = -60; x <= 60; x += 5.5) {
      d += `M ${tx(x - 40)} ${ty(75)} L ${tx(x + 40)} ${ty(-95)} `;
    }
    return d;
  })(),
} as const;

/* ------------------------------------------------------------------- ball */

/** Original trajectory (not a match reconstruction): west half → east goal. */
export const BALL_TRAJECTORY: readonly Point[] = [
  [PITCH.left + 104, CY + 62],
  [CX - 40, CY + 48],
  [CX + 40, CY - 8],
  [CX + 120, CY - 34],
  [PITCH.right - 42, CY - 18],
  [PITCH.right, CY + 2],
];
export const GOAL_EAST: Point = [PITCH.right, CY];
