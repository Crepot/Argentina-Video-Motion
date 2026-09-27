import React from "react";
import { clamp01 } from "../animation/interpolate-clamped";
import {
  INSTITUTION_MODULE_H,
  MAST,
  type FacadeSpec,
} from "../atlas/geometry/city-v2";
import { GRID_MODULE } from "../atlas/geometry/stadium";
import { mixColor, PALETTE } from "../theme/palette";
import { facadeMatrix, type Projector } from "./projection";

/**
 * ArchitecturalDrawing for the V2 city (spec §B, §10.1C). Elevations are
 * drawn in local units (x → east, y up is negative) from reusable primitives
 * (wall, cornice, window grid, columns, pediment, mast) and placed with a
 * façade matrix. `fold` lays the elevation flat on its block (north), so the
 * city turns into a plan when the camera rises overhead.
 */
const rect = (x0: number, y0: number, x1: number, y1: number) =>
  `M ${x0.toFixed(1)} ${y0.toFixed(1)} H ${x1.toFixed(1)} V ${y1.toFixed(1)} H ${x0.toFixed(1)} Z `;

const windowGrid = (
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  cols: number,
  rows: number,
  wFrac: number,
  hFrac: number,
) => {
  let d = "";
  const cw = (x1 - x0) / cols;
  const rh = (y1 - y0) / rows;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cx = x0 + cw * (c + 0.5);
      const cy = y0 + rh * (r + 0.5);
      d += rect(cx - (cw * wFrac) / 2, cy - (rh * hFrac) / 2, cx + (cw * wFrac) / 2, cy + (rh * hFrac) / 2);
    }
  }
  return d;
};

export interface FacadeDrawing {
  mass: string;
  openings: string;
  lines: string;
  accents: string;
}

/** Elevation of each façade kind; the institution depends on its module height. */
export const drawFacade = (s: FacadeSpec, moduleH = INSTITUTION_MODULE_H): FacadeDrawing => {
  const W = s.width;
  const H = s.kind === "institution" ? moduleH * 3 : s.height;
  switch (s.kind) {
    case "apartments": {
      const floorH = (H - 30) / s.floors;
      let lines = `M 0 ${-H + 18} H ${W} M -6 ${-H + 4} H ${W + 6} `;
      for (let i = 1; i < s.floors; i++) {
        lines += `M 0 ${(-i * floorH - 22).toFixed(1)} H ${W} `;
      }
      // Balconies on alternate bays.
      let accents = "";
      const bw = W / s.bays;
      for (let f = 1; f < s.floors; f++) {
        for (let b = 1; b < s.bays; b += 2) {
          const y = -f * floorH - 22;
          accents += rect(b * bw + 6, y - 4, (b + 1) * bw - 6, y + 2);
        }
      }
      return {
        mass: rect(0, -H, W, 0),
        openings: windowGrid(0, W, -H + 30, -22, s.bays, s.floors, 0.46, 0.5) + rect(W / 2 - 16, -34, W / 2 + 16, 0),
        lines,
        accents,
      };
    }
    case "ministry": {
      const base = 60;
      let cols = "";
      const n = 6;
      const cx0 = W * 0.22;
      const cx1 = W * 0.78;
      for (let i = 0; i < n; i++) {
        const x = cx0 + ((cx1 - cx0) * i) / (n - 1);
        cols += rect(x - 7, -H + 92, x + 7, -base);
      }
      return {
        mass: rect(0, -H + 70, W, 0) + `M ${W * 0.16} ${-H + 72} L ${W / 2} ${-H} L ${W * 0.84} ${-H + 72} Z`,
        openings:
          windowGrid(0, W * 0.18, -H + 96, -base - 6, 1, 3, 0.5, 0.52) +
          windowGrid(W * 0.82, W, -H + 96, -base - 6, 1, 3, 0.5, 0.52) +
          windowGrid(cx0, cx1, -H + 110, -base - 10, 5, 2, 0.46, 0.6),
        lines: `M ${W * 0.16} ${-H + 92} H ${W * 0.84} M 0 ${-H + 70} H ${W} M 0 ${-base} H ${W} M 0 ${-base + 12} H ${W} `,
        accents: cols,
      };
    }
    case "broadcast": {
      const floorH = (H - 26) / s.floors;
      let lines = `M -4 ${-H} H ${W + 4} `;
      for (let i = 1; i < s.floors; i++) {
        lines += `M 0 ${(-i * floorH).toFixed(1)} H ${W} `;
      }
      // Lattice radio mast rising from the roof.
      const mx = MAST.x - s.x0;
      const top = -MAST.top;
      const baseY = -H;
      let mast = `M ${mx - 26} ${baseY} L ${mx - 3} ${top} M ${mx + 26} ${baseY} L ${mx + 3} ${top} `;
      for (let k = 0; k < 6; k++) {
        const ya = baseY + ((top - baseY) * k) / 6;
        const yb = baseY + ((top - baseY) * (k + 1)) / 6;
        const wa = 26 - 23 * (k / 6);
        const wb = 26 - 23 * ((k + 1) / 6);
        mast += `M ${mx - wa} ${ya} L ${mx + wb} ${yb} M ${mx + wa} ${ya} L ${mx - wb} ${yb} `;
      }
      return {
        mass: rect(0, -H, W, 0),
        openings: windowGrid(0, W, -H + 22, -8, s.bays, s.floors, 0.6, 0.34),
        lines: lines + mast,
        accents: rect(W * 0.1, -H + 10, W * 0.9, -H + 24),
      };
    }
    case "bank": {
      const floorH = (H - 40) / s.floors;
      let lines = `M -8 ${-H} H ${W + 8} M 0 ${-H + 20} H ${W} `;
      for (let i = 1; i < s.floors; i++) {
        lines += `M 0 ${(-i * floorH - 20).toFixed(1)} H ${W} `;
      }
      return {
        mass: rect(0, -H, W, 0),
        openings: windowGrid(0, W, -H + 40, -60, s.bays, s.floors - 1, 0.42, 0.56) + windowGrid(W * 0.2, W * 0.8, -58, -4, 3, 1, 0.6, 0.86),
        lines,
        accents: `M ${W / 2 - 22} ${-H - 22} A 22 22 0 0 1 ${W / 2 + 22} ${-H - 22} Z`,
      };
    }
    case "institution": {
      // Structural grid 4 × 3: the controlled cell of the atlas grid.
      const mw = GRID_MODULE.x;
      let grid = "";
      for (let k = 0; k <= 4; k++) {
        grid += `M ${k * mw} 0 V ${-H} `;
      }
      for (let j = 0; j <= 3; j++) {
        grid += `M 0 ${-j * moduleH} H ${W} `;
      }
      let openings = "";
      for (let k = 0; k < 4; k++) {
        for (let j = 0; j < 3; j++) {
          const x0 = k * mw;
          const y0 = -(j + 1) * moduleH;
          openings += rect(x0 + 14, y0 + moduleH * 0.18, x0 + mw / 2 - 5, y0 + moduleH * 0.82);
          openings += rect(x0 + mw / 2 + 5, y0 + moduleH * 0.18, x0 + mw - 14, y0 + moduleH * 0.82);
        }
      }
      return { mass: rect(0, -H, W, 0), openings, lines: grid, accents: "" };
    }
    default:
      return { mass: "", openings: "", lines: "", accents: "" };
  }
};

export interface FacadeProps {
  spec: FacadeSpec;
  projector: Projector;
  groundY: number;
  /** 0 upright … 1 flat on the block. */
  fold: number;
  /** Detail visibility (windows, ornaments) — drops as the city becomes plan. */
  detail: number;
  /** Mass fill opacity. */
  massOpacity: number;
  tone: number;
  /** Institutional lock: structural lines darken into control geometry. */
  control?: number;
  /** Institution only: module height (150 standing → 90 lying as the pitch cell). */
  moduleH?: number;
  lineColor?: string;
  /** Surveillance: coordinate brackets fix three windows of the institution. */
  brackets?: number;
}

const BRACKETS = (mh: number) => {
  const mw = GRID_MODULE.x;
  const boxes: [number, number][] = [
    [0, 1],
    [2, 2],
    [3, 0],
  ];
  let d = "";
  for (const [k, j] of boxes) {
    const x0 = k * mw + 8;
    const x1 = (k + 1) * mw - 8;
    const y0 = -(j + 1) * mh + 10;
    const y1 = -j * mh - 10;
    const c = 14;
    d += `M ${x0} ${y0 + c} V ${y0} H ${x0 + c} M ${x1 - c} ${y0} H ${x1} V ${y0 + c} M ${x1} ${y1 - c} V ${y1} H ${x1 - c} M ${x0 + c} ${y1} H ${x0} V ${y1 - c} `;
  }
  return d;
};

export const Facade: React.FC<FacadeProps> = ({
  spec,
  projector,
  groundY,
  fold,
  detail,
  massOpacity,
  tone,
  control = 0,
  moduleH,
  lineColor = PALETTE.deepBlue,
  brackets = 0,
}) => {
  const dwg = drawFacade(spec, moduleH);
  const paper = PALETTE.paperCool;
  const T = (c: string) => mixColor(c, paper, tone);
  const wall = T(mixColor(PALETTE.paperWarm, PALETTE.grayBlue, 0.3));
  const open = T(mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.38));
  const line = T(lineColor);
  const ctrl = mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.6);
  const m = facadeMatrix(projector, spec.x0, groundY, fold);
  const ns = { vectorEffect: "non-scaling-stroke" as const };
  const d = clamp01(detail);
  return (
    <g data-id={spec.id} transform={m}>
      <path d={dwg.mass} fill={wall} opacity={massOpacity} stroke={line} strokeWidth={1.2} {...ns} />
      {d > 0.01 ? (
        <>
          <path d={dwg.openings} fill={open} opacity={0.62 * d} stroke="none" />
          {brackets > 0.01 && spec.kind === "institution" ? (
            <path d={BRACKETS(moduleH ?? INSTITUTION_MODULE_H)} fill="none" stroke={ctrl} strokeWidth={1.6} opacity={brackets} {...ns} />
          ) : null}
          <path d={dwg.accents} fill={T(mixColor(PALETTE.grayBlue, PALETTE.paperWarm, 0.35))} stroke={line} strokeWidth={0.9} opacity={d} {...ns} />
        </>
      ) : null}
      <path
        d={dwg.lines}
        fill="none"
        stroke={control > 0 ? mixColor(line, ctrl, control) : line}
        strokeWidth={1 + control * 1.4}
        opacity={spec.kind === "institution" ? 0.6 + 0.4 * Math.max(d, control) : 0.35 + 0.55 * d}
        strokeLinecap="square"
        {...ns}
      />
    </g>
  );
};
