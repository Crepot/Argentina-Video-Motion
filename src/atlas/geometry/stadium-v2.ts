import { createPrng } from "../../animation/stroke-draw";
import type { Point } from "../../types/paths";
import { NORTH_CURB, NORTH_STREET_Y } from "./city-v2";
import {
  ellipsePoint,
  lerpEllipse,
  SOUTH_ATLANTIC_ISOBAR,
  STADIUM_BOUNDARY,
  type EllipseParams,
} from "./stadium";

/**
 * V2 stadium bowl. Tier ring 0 IS the memory-line boundary (the running
 * track edge); the stands rake outward and upward from it. Each ring has
 * three lives: a straight city kerb (1976 plan) → a closed ellipse (1978)
 * → a South Atlantic isobar (1982). Same ring, same identity.
 */
export const TIERS = 6;

const [CX, CY] = [STADIUM_BOUNDARY.cx, STADIUM_BOUNDARY.cy];

export const tierEllipse = (i: number): EllipseParams => ({
  cx: CX,
  cy: CY,
  rx: STADIUM_BOUNDARY.rx + i * 40,
  ry: STADIUM_BOUNDARY.ry + i * 33,
  tilt: 0,
});

/** Height of ring i at full build (world units). */
export const tierHeight = (i: number) => 4 + i * 23;

/**
 * The near (south) side is a low stand: the camera looks over it into the
 * bowl, as from the upper tier, instead of facing its exterior wall.
 */
export const tierHeightAt = (i: number, tDeg: number) => {
  const s = Math.sin((tDeg * Math.PI) / 180);
  const k = Math.min(1, Math.max(0, (s - 0.05) / 0.55));
  const near = k * k * (3 - 2 * k);
  return tierHeight(i) * (1 - 0.66 * near);
};
export const RIM_WALL = 16;

const PIVOT: Point = [5300, 2640];
const scaleAbout = (e: EllipseParams, s: number): EllipseParams => ({
  cx: PIVOT[0] + (e.cx - PIVOT[0]) * s,
  cy: PIVOT[1] + (e.cy - PIVOT[1]) * s,
  rx: e.rx * s,
  ry: e.ry * s,
  tilt: e.tilt,
});

/** Isobar family each ring stretches into (outside the memory-line isobar). */
export const tierIsobar = (i: number) => scaleAbout(SOUTH_ATLANTIC_ISOBAR, 1.06 + i * 0.055);

/** Ring i at a given isobar progress. */
export const ringAt = (i: number, isobar: number) => lerpEllipse(tierEllipse(i), tierIsobar(i), isobar);

/**
 * Point of ring i at parameter t (deg) for the kerb → ellipse morph: the
 * upper half starts on the north street, the lower half on the avenue kerb.
 */
export const ringPoint = (i: number, tDeg: number, morph: number, isobar: number): Point => {
  const e = ringAt(i, isobar);
  const onEllipse = ellipsePoint(e, tDeg);
  if (morph >= 1) {
    return onEllipse;
  }
  const base = tierEllipse(i);
  const u = Math.cos((tDeg * Math.PI) / 180);
  const flatX = base.cx + base.rx * u;
  const upper = Math.sin((tDeg * Math.PI) / 180) < 0;
  const flatY = upper ? NORTH_STREET_Y - i * 26 : NORTH_CURB + 40 + i * 30;
  return [flatX + (onEllipse[0] - flatX) * morph, flatY + (onEllipse[1] - flatY) * morph];
};

/** Seeded crowd: per row, per seat parameter; colours are shirts of a real crowd. */
export interface Spectator {
  row: number;
  t: number;
  shirt: 0 | 1 | 2 | 3;
  phase: number;
  lift: number;
}

export const SPECTATORS: readonly Spectator[] = (() => {
  const r = createPrng(1978);
  const out: Spectator[] = [];
  for (let row = 0; row < TIERS; row++) {
    const e = tierEllipse(row + 0.5);
    const circumference = 2 * Math.PI * Math.sqrt((e.rx * e.rx + e.ry * e.ry) / 2);
    const n = Math.floor(circumference / 8.6);
    for (let k = 0; k < n; k++) {
      const t = (k / n) * 360 + (r() - 0.5) * (200 / n);
      const v = r();
      out.push({
        row,
        t,
        shirt: v < 0.34 ? 0 : v < 0.66 ? 1 : v < 0.86 ? 2 : 3,
        phase: r(),
        lift: r(),
      });
    }
  }
  return out;
})();

/** Flags planted in the stands (parameter t, row). */
export const STAND_FLAGS: readonly { t: number; row: number; size: number }[] = [
  { t: 198, row: 4, size: 1 },
  { t: 214, row: 2, size: 1.1 },
  { t: 232, row: 5, size: 1.3 },
  { t: 246, row: 3, size: 1 },
  { t: 262, row: 1, size: 0.9 },
  { t: 274, row: 4, size: 1.2 },
  { t: 292, row: 2, size: 1 },
  { t: 306, row: 5, size: 1.3 },
  { t: 322, row: 3, size: 1.1 },
  { t: 338, row: 1, size: 0.9 },
  { t: 352, row: 4, size: 1 },
  { t: 12, row: 3, size: 1 },
  { t: 168, row: 3, size: 1 },
  { t: 184, row: 5, size: 1.1 },
];

/** Papelitos: paper confetti thrown from the rim after the goal (seed 1978). */
export const PAPELITOS: readonly { t: number; start: number; fall: number; drift: number; spin: number; size: number }[] =
  (() => {
    const r = createPrng(7801);
    return Array.from({ length: 220 }, () => ({
      t: r() * 360,
      start: 2016 + r() * 26,
      fall: 34 + r() * 26,
      drift: 0.35 + r() * 0.55,
      spin: r(),
      size: 4.2 + r() * 3,
    }));
  })();
