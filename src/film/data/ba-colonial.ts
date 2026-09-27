import { createPrng } from "../../animation/stroke-draw";
import type { Point } from "../../types/paths";
import { lineState } from "../line";
import { anchorAt, toWorld } from "../space";
import { M } from "./geo";

/**
 * Colonial Buenos Aires sheet (Scenes 02–03). Local units ≈ V2 units (a
 * person ≈ 80). The river is north (local y < 0), the city south of the
 * shore line y = 0. The sheet is rotated in the world so that the real
 * Buenos Aires shore (running NW→SE) is its x axis: the camera looks from
 * the pampa toward the river, and the chart's estuary becomes this river.
 * Editorial scale: the town is drawn larger than geography allows.
 */
export const BA_SHEET = anchorAt([0, 0], M(58.36, 34.6), 0.25, 44.3);

export const BLOCK = 150;
export const STREET = 34;
export const colX = (c: number) => -1300 + c * (BLOCK + STREET);
export const rowY = (r: number) => 60 + r * (BLOCK + STREET);

export const PLAZA = { x0: colX(6), x1: colX(8) + BLOCK, y0: rowY(1), y1: rowY(2) + BLOCK } as const;
export const CABILDO = { x0: -214, w: 556, y: 226, h: 210 } as const;
export const CABILDO_CX = CABILDO.x0 + CABILDO.w / 2;
export const CATEDRAL = { x0: 370, w: 180, y: 226, h: 170 } as const;
export const FORT = { x0: 700, x1: 1130, y0: 24, y1: 204 } as const;

export interface House {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tall: boolean;
  variant: number;
  /** Distance from the plaza (drafting order). */
  d: number;
}

export const HOUSES: readonly House[] = (() => {
  const r = createPrng(1806);
  const out: House[] = [];
  for (let row = 0; row < 5; row++) {
    for (let c = 0; c < 15; c++) {
      const x0 = colX(c);
      const y0 = rowY(row);
      const inPlaza = row >= 1 && row <= 2 && c >= 6 && c <= 8;
      const reserved = row === 0 && c >= 6 && c <= 13;
      // South of the plaza the town opens toward the camera (low recova edge only).
      const open = row >= 3 && c >= 4 && c <= 10;
      if (inPlaza || reserved || open) {
        continue;
      }
      for (let k = 0; k < 2; k++) {
        const tall = r() < 0.22;
        out.push({
          id: `h${row}.${c}.${k}`,
          x: x0 + 4 + k * 74,
          y: y0 + BLOCK,
          w: 70,
          h: tall ? 160 : 96 + r() * 14,
          tall,
          variant: Math.floor(r() * 3),
          d: Math.hypot(x0 + 75 - CABILDO_CX, y0 + 75 - 400),
        });
      }
    }
  }
  return out;
})();

/** Ground plan: blocks (manzanas) as light cells. */
export const BLOCKS_D = (() => {
  let d = "";
  for (let row = 0; row < 5; row++) {
    for (let c = 0; c < 15; c++) {
      const inPlaza = row >= 1 && row <= 2 && c >= 6 && c <= 8;
      if (inPlaza) {
        continue;
      }
      const x = colX(c);
      const y = rowY(row);
      d += `M ${x} ${y} h ${BLOCK} v ${BLOCK} h ${-BLOCK} Z `;
    }
  }
  return d;
})();

export const SHORE_D = "M -1700 6 C -1200 -6, -700 10, -200 2 S 700 -8, 1200 4 S 1800 0, 2200 -4";

/** Memory line in the plaza (world coords): samples 0–56 lie out on the river, 57–95 cross the plaza to the Cabildo base. */
export const PLAZA_STATE: readonly Point[] = (() => {
  const far: Point[] = [];
  for (let i = 0; i < 57; i++) {
    far.push(toWorld(BA_SHEET, [900 + i * 18, -600 - i * 16]));
  }
  const axis = lineState([
    [CABILDO_CX, PLAZA.y1 + 60],
    [CABILDO_CX - 30, 480],
    [CABILDO_CX + 10, 360],
    [CABILDO_CX, CABILDO.y + 8],
  ]).map((p) => toWorld(BA_SHEET, p));
  const step = Math.floor(axis.length / 39);
  const tail: Point[] = [];
  for (let i = 0; i < 39; i++) {
    tail.push(axis[Math.min(axis.length - 1, i * step + (i === 38 ? axis.length : 0))]);
  }
  tail[38] = axis[axis.length - 1];
  return [...far, ...tail];
})();

/** Rain streaks over the plaza (seeded). */
export const RAIN: readonly { x: number; y: number; ph: number }[] = (() => {
  const r = createPrng(1810);
  return Array.from({ length: 190 }, () => ({ x: -500 + r() * 1300, y: 150 + r() * 700, ph: r() }));
})();
