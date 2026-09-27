import { BALL_TRAJECTORY } from "../atlas/geometry/stadium";
import { NAVAL_GUIDE } from "../atlas/south-atlantic-geometry";
import type { NormalizedPathGeometry, PathId, Point } from "../types/paths";
import { MEMORY_LINE_STATES } from "./memory-line-states";
import { resamplePolyline, SAMPLE_COUNT } from "./normalize-path";
import { catmullRomAt } from "./interpolate-path";

const normalized = (
  id: PathId,
  points: readonly Point[],
): NormalizedPathGeometry => ({
  id,
  points,
  closed: false,
  sampleCount: SAMPLE_COUNT,
});

/** Smooth an authored control polyline, then resample to the shared topology. */
const smoothAuthored = (pts: readonly Point[]) => {
  const dense: Point[] = [];
  for (let u = 0; u <= pts.length - 1; u += 0.1) {
    dense.push(catmullRomAt(pts, u));
  }
  dense.push(pts[pts.length - 1]);
  return resamplePolyline(dense, SAMPLE_COUNT);
};

/**
 * Registry of every persistent path. Geometry is computed once at module
 * load (§5.5, §11.2); components receive ids, never raw `d` strings.
 */
export const PATH_REGISTRY = {
  civicTimeline: normalized("civicTimeline", MEMORY_LINE_STATES.civicTimeline),
  woundedTimeline: normalized(
    "woundedTimeline",
    MEMORY_LINE_STATES.woundedTimeline,
  ),
  stadiumBoundary: normalized(
    "stadiumBoundary",
    MEMORY_LINE_STATES.stadiumBoundary,
  ),
  southAtlanticIsobar: normalized(
    "southAtlanticIsobar",
    MEMORY_LINE_STATES.southAtlanticIsobar,
  ),
  southAtlanticRoute: normalized(
    "southAtlanticRoute",
    MEMORY_LINE_STATES.southAtlanticRoute,
  ),
  ballTrajectory1978: normalized(
    "ballTrajectory1978",
    smoothAuthored(BALL_TRAJECTORY),
  ),
  navalGuide1982: normalized("navalGuide1982", smoothAuthored(NAVAL_GUIDE)),
} as const satisfies Partial<Record<PathId, NormalizedPathGeometry>>;

export type PathRegistry = typeof PATH_REGISTRY;
export type RegisteredPathId = keyof PathRegistry;

/** Objects that must survive every bridge of the benchmark (§9.12). */
export const PERSISTENT_OBJECT_IDS = [
  "memoryLine.main",
  "atlas.grid.main",
  "paper.world",
] as const;
