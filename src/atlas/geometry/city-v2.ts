import { createPrng } from "../../animation/stroke-draw";
import type { Point } from "../../types/paths";
import { GRID_MODULE, PITCH } from "./stadium";
import { CIVIC_TIMELINE_Y } from "./institutions";

/**
 * V2 city section (1976). The avenue runs west→east on the atlas; its median
 * IS the civic timeline (memoryLine.main, y = 2460). Façades stand on the
 * north building line; the block whose façade is the institutional grid is
 * exactly the future pitch (PITCH.left…right, building line = PITCH.bottom),
 * so folding that façade flat lays its 4 × 3 structural grid on the pitch.
 */
export const FACADE_Y = PITCH.bottom; // 2305
export const NORTH_CURB = 2345;
export const MEDIAN_Y = CIVIC_TIMELINE_Y; // 2460
export const SOUTH_CURB = 2585;
export const SOUTH_EDGE = 2640;
export const NORTH_STREET_Y = PITCH.top - 60; // street behind the blocks

/** Cross streets (x ranges) between blocks. */
export const CROSS_STREETS: readonly [number, number][] = [
  [2980, 3040],
  [3400, 3460],
  [3822, 3882],
  [4298, 4358],
  [4720, 4780],
];

export type FacadeKind =
  | "apartments"
  | "ministry"
  | "broadcast"
  | "institution"
  | "bank";

export interface FacadeSpec {
  id: string;
  kind: FacadeKind;
  x0: number;
  width: number;
  height: number;
  floors: number;
  bays: number;
}

/** Module height of the institutional façade before it folds (150 → 90). */
export const INSTITUTION_MODULE_H = 150;

export const FACADES: readonly FacadeSpec[] = [
  { id: "facade.apartments.w", kind: "apartments", x0: 2600, width: 380, height: 380, floors: 7, bays: 7 },
  { id: "facade.ministry", kind: "ministry", x0: 3040, width: 360, height: 330, floors: 3, bays: 6 },
  { id: "facade.broadcast", kind: "broadcast", x0: 3460, width: 362, height: 300, floors: 4, bays: 6 },
  {
    id: "facade.institution",
    kind: "institution",
    x0: PITCH.left,
    width: PITCH.width,
    height: INSTITUTION_MODULE_H * 3,
    floors: 3,
    bays: 4,
  },
  { id: "facade.bank", kind: "bank", x0: 4358, width: 362, height: 360, floors: 5, bays: 5 },
];

/** Radio mast on the broadcast building: the waves censorship erases. */
export const MAST = { x: 3780, base: 300, top: 640 } as const;

/** Civic nodes on the avenue (sky-blue public points); three are removed at 1812+. */
export interface CivicNodeV2 {
  id: string;
  p: Point;
  removeAt?: number;
}
export const CIVIC_NODES_V2: readonly CivicNodeV2[] = [
  { id: "node.v2.a", p: [3180, MEDIAN_Y] },
  { id: "node.v2.b", p: [3330, 2612], removeAt: 1814 },
  { id: "node.v2.c", p: [3560, MEDIAN_Y], removeAt: 1821 },
  { id: "node.v2.d", p: [3700, 2612], removeAt: 1828 },
  { id: "node.v2.e", p: [3610, 2330] },
  { id: "node.v2.f", p: [3250, 2330] },
];

/** Stable pseudo-random papers blown along the avenue (seed 1976). */
export const LOOSE_PAPERS: readonly {
  x: number;
  y: number;
  phase: number;
  drift: number;
  size: number;
}[] = (() => {
  const r = createPrng(1976);
  return Array.from({ length: 11 }, () => ({
    x: 3150 + r() * 900,
    y: 2360 + r() * 300,
    phase: r(),
    drift: 1.2 + r() * 1.6,
    size: 7 + r() * 5,
  }));
})();

export const GRID_V = GRID_MODULE;
