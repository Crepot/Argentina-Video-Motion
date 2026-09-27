import type { Point } from "../../types/paths";
import { ARGENTINA } from "../data/geo";
import { BA_W, G, LUSAIL_W, MARK_2014, PITCH22, RIO_W } from "../late-world";
import { lineState, stateParts } from "../line";
import { toWorld } from "../space";
import { MARADONA_STATE } from "./s13-maradona";
import { THREAD14_WORLD } from "./s16-2014";
import { STREET_Y, FISSURE_X } from "./s14-s15-city";

/**
 * The 36-year line (1986 → 2022) as one 96-sample state, part by part, so
 * 2021 and 2022 reveal their own stretch while the pullback can show the
 * whole: 1986 run · 1990s street · new-century stem · 2014 pitch · link to
 * the globe · Buenos Aires → Rio · Rio → Qatar · the decisive 2022 run.
 */
export const offsetPolyline = (pts: readonly Point[], d: number): Point[] =>
  pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [p[0] - (dy / l) * d, p[1] + (dx / l) * d] as Point;
  });

/** 2021 route Buenos Aires → Rio (world, on the globe sheet). */
export const ROUTE21: readonly Point[] = lineState([BA_W, G(55.5, 35.8), G(51, 33.4), G(47.5, 28.6), G(44.6, 24.6), RIO_W]);
/** Rio → Lusail flight arc across the Atlantic and Africa. */
export const ARC22: readonly Point[] = lineState([RIO_W, G(36, 24), G(20, 20), G(0, 8), G(-25, -8), G(-40, -18), LUSAIL_W]);
/** The decisive 2022 run on the Lusail pitch (pitch-local). */
export const RUN22_LOCAL: readonly Point[] = [
  [0, 0],
  [330, -150],
  [650, 100],
  [860, 40],
  [1030, -40],
  [1600, -20],
];

export const S = {
  A: [0, 15],
  B: [16, 27],
  C: [28, 39],
  D: [40, 57],
  L: [58, 61],
  E: [62, 71],
  F: [72, 87],
  G: [88, 95],
} as const;
export const sOf = (i: number) => i / 95;

export const LATE: readonly Point[] = stateParts([
  [MARADONA_STATE.slice(20, 81), 16],
  [[[7400, STREET_Y], [FISSURE_X, STREET_Y]], 12],
  [[[FISSURE_X, STREET_Y], MARK_2014], 12],
  [THREAD14_WORLD, 18],
  [[THREAD14_WORLD[THREAD14_WORLD.length - 1], BA_W], 4],
  [offsetPolyline(ROUTE21, 7), 10],
  [offsetPolyline(ARC22, 7), 16],
  [RUN22_LOCAL.map((q) => toWorld(PITCH22, q)), 8],
]);

/** Continental Argentina (closed) on the globe sheet: the final outline. */
export const ARG_OUTLINE: readonly Point[] = lineState([...ARGENTINA.map((q) => G(q[0], q[1])), G(ARGENTINA[0][0], ARGENTINA[0][1])], false);

