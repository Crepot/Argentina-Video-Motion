import {
  CIVIC_TIMELINE_X,
  CIVIC_TIMELINE_Y,
} from "../atlas/geometry/institutions";
import {
  ellipsePoint,
  ellipseTangentAngle,
  type EllipseParams,
  SOUTH_ATLANTIC_ISOBAR,
  STADIUM_BOUNDARY,
} from "../atlas/geometry/stadium";
import { gridX } from "../atlas/geometry/stadium";
import { geo } from "../atlas/south-atlantic-geometry";
import type { Point } from "../types/paths";
import { assertSampleCount, SAMPLE_COUNT } from "./normalize-path";

/**
 * Index semantics shared by every state of memoryLine.main (96 samples):
 *   0‥28   R1 — west tail (civic → wounded; stays as wounded evidence)
 *   29‥58  R2 — central stretch (disappears in block D)
 *   59‥62  R3 entry — the surviving stretch that straightens and enters
 *   62‥95  R3 ellipse — 315° open boundary, entry at the west point
 * Civic/wounded states stack 69‥95 at the stroke's end: the government
 * baseline "stops mid-stroke", and those samples later unfold as the stadium
 * perimeter is drawn.
 */
export const IDX = {
  r1End: 28,
  r3Start: 59,
  entryEnd: 62,
  civicSpreadEnd: 68,
  last: SAMPLE_COUNT - 1,
} as const;

export const s = (index: number) => index / IDX.last;

/** Ellipse arc: CW from the west point, 315° (§5.3), leaving a SW gate. */
const ARC_START = 180;
const ARC_SWEEP = 315;
const arcT = (i: number) =>
  ARC_START + ((i - IDX.entryEnd) / (IDX.last - IDX.entryEnd)) * ARC_SWEEP;

/** Normalized progress on the line for an ellipse parameter t (degrees). */
export const sForArcT = (tDeg: number) =>
  s(
    IDX.entryEnd + ((tDeg - ARC_START) / ARC_SWEEP) * (IDX.last - IDX.entryEnd),
  );

/** Oceanic stretch of the route: from the coast crossing to the east cap. */
export const OCEANIC_RANGE = [sForArcT(262), sForArcT(360)] as const;

/* ----------------------------------------------------------------- civic */

const civicX = (i: number) => {
  const k = Math.min(i, IDX.civicSpreadEnd) / IDX.civicSpreadEnd;
  return CIVIC_TIMELINE_X[0] + k * (CIVIC_TIMELINE_X[1] - CIVIC_TIMELINE_X[0]);
};

const civic: Point[] = Array.from({ length: SAMPLE_COUNT }, (_, i) => [
  civicX(i),
  CIVIC_TIMELINE_Y,
]);

/* --------------------------------------------------------------- wounded */

// Orthogonal deflections one module after each control vertical: the line is
// intercepted by the grid, not bent by an abstract force.
const NOTCHES: readonly [number, number, number][] = [
  [gridX(-12), gridX(-11), 22],
  [gridX(-8), gridX(-7), -18],
  [gridX(-5), gridX(-4), 24],
  [gridX(-3), gridX(-2), -16],
];
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const notch = (x: number) =>
  NOTCHES.reduce(
    (acc, [a, b, dy]) =>
      acc +
      dy * (smoothstep(a - 10, a + 10, x) - smoothstep(b - 10, b + 10, x)),
    0,
  );

const wounded: Point[] = civic.map(([x, y]) => [x, y + notch(x)]);

/* ------------------------------------------------------ ellipse families */

const entryAlongTangent = (e: EllipseParams): Point[] => {
  const w = ellipsePoint(e, ARC_START);
  const a = ellipseTangentAngle(e, ARC_START);
  const dir: Point = [Math.cos(a), Math.sin(a)];
  // Three samples behind the west point, along the incoming tangent.
  return [285, 190, 95, 0].map((k) => [w[0] - dir[0] * k, w[1] - dir[1] * k]);
};

const ellipseState = (e: EllipseParams, entry: readonly Point[]): Point[] => {
  const pts: Point[] = [];
  for (let i = 0; i <= IDX.r1End; i++) {
    pts.push(wounded[i]);
  }
  const tailEnd = wounded[IDX.r1End];
  const entryStart = entry[0];
  for (let i = IDX.r1End + 1; i < IDX.r3Start; i++) {
    const t = (i - IDX.r1End) / (IDX.r3Start - IDX.r1End);
    pts.push([
      tailEnd[0] + (entryStart[0] - tailEnd[0]) * t,
      tailEnd[1] + (entryStart[1] - tailEnd[1]) * t,
    ]);
  }
  for (let i = IDX.r3Start; i < IDX.entryEnd; i++) {
    pts.push(entry[i - IDX.r3Start]);
  }
  for (let i = IDX.entryEnd; i <= IDX.last; i++) {
    pts.push(ellipsePoint(e, arcT(i)));
  }
  return pts;
};

const stadium = ellipseState(
  STADIUM_BOUNDARY,
  entryAlongTangent(STADIUM_BOUNDARY),
);
const isobar = ellipseState(
  SOUTH_ATLANTIC_ISOBAR,
  entryAlongTangent(SOUTH_ATLANTIC_ISOBAR),
);

/**
 * Route: the isobar acquires a bearing (§8.16). Its oceanic stretch (coast
 * crossing → east cap) straightens toward a point in open water west of the
 * islands; the remainder of the isobar relaxes back to the contour. Same
 * samples, same topology, no new object.
 */
const ROUTE_TARGET: Point = geo(62.3, 51.55);
const route: Point[] = (() => {
  const from = ellipsePoint(SOUTH_ATLANTIC_ISOBAR, 255);
  const capShift: Point = [
    ROUTE_TARGET[0] - ellipsePoint(SOUTH_ATLANTIC_ISOBAR, 360)[0],
    ROUTE_TARGET[1] - ellipsePoint(SOUTH_ATLANTIC_ISOBAR, 360)[1],
  ];
  return isobar.map((p, i) => {
    if (i < IDX.entryEnd) {
      return p;
    }
    const t = arcT(i);
    if (t <= 255) {
      return p;
    }
    if (t <= 360) {
      const k = (t - 255) / 105;
      const chord: Point = [
        from[0] + (ROUTE_TARGET[0] - from[0]) * k,
        from[1] + (ROUTE_TARGET[1] - from[1]) * k,
      ];
      const w = Math.sin((Math.PI * k) / 2) ** 2;
      return [p[0] + (chord[0] - p[0]) * w, p[1] + (chord[1] - p[1]) * w];
    }
    const decay = 1 - smoothstep(0, 1, (t - 360) / 70);
    return [p[0] + capShift[0] * decay, p[1] + capShift[1] * decay];
  });
})();

export const MEMORY_LINE_STATES = {
  civicTimeline: civic,
  woundedTimeline: wounded,
  stadiumBoundary: stadium,
  southAtlanticIsobar: isobar,
  southAtlanticRoute: route,
} as const;

for (const [id, pts] of Object.entries(MEMORY_LINE_STATES)) {
  assertSampleCount(id, pts);
}
