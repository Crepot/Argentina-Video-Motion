import React from "react";
import { clamp01 } from "../../animation/interpolate-clamped";
import { mixColor, PALETTE } from "../../theme/palette";
import type { Projector } from "../../stage/projection";
import { standMatrix } from "./stand";

/**
 * ArchitecturalDrawing (storyboard §A "Historical buildings", §B): elevations
 * built from reusable primitives (wall, arcade, window grid, columns,
 * pediment, tower, dome, sawtooth roof) and revealed in architectural order —
 * axis → lines (centre-out) → mass → openings → detail — as though the atlas
 * were drafting them. Placed with a stand matrix; `fold` lays them flat.
 * Local units: x 0…W, ground y = 0, up is negative.
 */
export type ElevationKind =
  | "colonialHouse"
  | "colonialHouseTall"
  | "church"
  | "fortWall"
  | "cabildo"
  | "casaTucuman"
  | "warehouse"
  | "station"
  | "factory"
  | "congreso"
  | "casaRosada"
  | "arsenal"
  | "apartmentBlock"
  | "officeTower"
  | "bankHall"
  | "shopRow"
  | "barracks"
  | "pulperia";

export interface Elevation {
  w: number;
  h: number;
  mass: string;
  roof?: string;
  openings: string;
  lines: string;
  accents: string;
  /** Height of the tallest element (for culling). */
  top: number;
}

const r = (x0: number, y0: number, x1: number, y1: number) =>
  `M ${x0.toFixed(1)} ${y0.toFixed(1)} H ${x1.toFixed(1)} V ${y1.toFixed(1)} H ${x0.toFixed(1)} Z `;

const arch = (cx: number, base: number, w: number, h: number) => {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const spring = base - h + w / 2;
  return `M ${x0.toFixed(1)} ${base.toFixed(1)} V ${spring.toFixed(1)} A ${(w / 2).toFixed(1)} ${(w / 2).toFixed(1)} 0 0 1 ${x1.toFixed(1)} ${spring.toFixed(1)} V ${base.toFixed(1)} Z `;
};

const grid = (x0: number, x1: number, y0: number, y1: number, cols: number, rows: number, wf: number, hf: number) => {
  let d = "";
  const cw = (x1 - x0) / cols;
  const rh = (y1 - y0) / rows;
  for (let c = 0; c < cols; c++) {
    for (let k = 0; k < rows; k++) {
      const cx = x0 + cw * (c + 0.5);
      const cy = y0 + rh * (k + 0.5);
      d += r(cx - (cw * wf) / 2, cy - (rh * hf) / 2, cx + (cw * wf) / 2, cy + (rh * hf) / 2);
    }
  }
  return d;
};

const reja = (x0: number, y0: number, x1: number, y1: number, n = 4) => {
  let d = "";
  for (let i = 1; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    d += `M ${x.toFixed(1)} ${y0.toFixed(1)} V ${y1.toFixed(1)} `;
  }
  return d;
};

const cache = new Map<string, Elevation>();

export const elevation = (kind: ElevationKind, w: number, h: number, variant = 0): Elevation => {
  const key = `${kind}|${w}|${h}|${variant}`;
  const hit = cache.get(key);
  if (hit) {
    return hit;
  }
  let e: Elevation;
  switch (kind) {
    case "colonialHouse":
    case "colonialHouseTall": {
      const tall = kind === "colonialHouseTall";
      const bays = Math.max(2, Math.round(w / 60));
      let openings = "";
      let accents = "";
      const bw = w / bays;
      for (let i = 0; i < bays; i++) {
        const cx = bw * (i + 0.5);
        if (i === Math.floor(bays / 2) || (variant + i) % 3 === 0) {
          openings += r(cx - 11, -46, cx + 11, 0);
        } else {
          openings += r(cx - 12, -h * 0.72, cx + 12, -h * 0.28);
          accents += reja(cx - 12, -h * 0.72, cx + 12, -h * 0.28);
        }
        if (tall) {
          openings += r(cx - 10, -h + 14, cx + 10, -h * 0.58 - 6);
        }
      }
      e = {
        w,
        h,
        mass: r(0, -h, w, 0),
        roof: variant % 2 === 0 ? `M -4 ${-h} L ${w * 0.1} ${-h - 16} H ${w * 0.9} L ${w + 4} ${-h} Z` : r(-3, -h - 6, w + 3, -h),
        openings,
        lines: `M 0 ${-h} H ${w} M 0 -4 H ${w}${tall ? ` M 0 ${-h * 0.56} H ${w}` : ""}`,
        accents,
        top: h + 16,
      };
      break;
    }
    case "church": {
      const tw = w * 0.2;
      const th = h * 1.7;
      const nave = r(tw, -h, w - tw, 0);
      const towers = r(0, -th, tw, 0) + r(w - tw, -th, w, 0);
      const caps = `M -4 ${-th} L ${tw / 2} ${-th - 36} L ${tw + 4} ${-th} Z M ${w - tw - 4} ${-th} L ${w - tw / 2} ${-th - 36} L ${w + 4} ${-th} Z`;
      const pediment = `M ${tw} ${-h} L ${w / 2} ${-h - 46} L ${w - tw} ${-h} Z`;
      e = {
        w,
        h: th,
        mass: nave + towers + pediment,
        roof: caps,
        openings: arch(w / 2, 0, w * 0.16, h * 0.62) + arch(tw / 2, -th + 60, tw * 0.4, 44) + arch(w - tw / 2, -th + 60, tw * 0.4, 44) + r(w / 2 - 12, -h + 14, w / 2 + 12, -h + 38),
        lines: `M 0 ${-h * 0.55} H ${w} M ${tw} ${-h} H ${w - tw} M 0 ${-th + 90} H ${tw} M ${w - tw} ${-th + 90} H ${w}`,
        accents: `M ${w / 2} ${-h - 46} V ${-h - 76} M ${w / 2 - 10} ${-h - 64} H ${w / 2 + 10}`,
        top: th + 40,
      };
      break;
    }
    case "fortWall": {
      e = {
        w,
        h,
        mass: `M 0 0 V ${-h} H ${w * 0.4} V ${-h - 10} H ${w * 0.6} V ${-h} H ${w} V 0 Z`,
        openings: arch(w / 2, 0, 34, 50),
        lines: `M 0 ${-h + 8} H ${w} ` + Array.from({ length: Math.floor(w / 26) }, (_, i) => `M ${i * 26} ${-h} v -8 h 13 v 8`).join(" "),
        accents: `M ${w / 2} ${-h - 10} V ${-h - 60}`,
        top: h + 60,
      };
      break;
    }
    case "cabildo": {
      // 1810 Cabildo: long two-storey arcade, balcony, central tower with clock.
      const n = 11;
      const aw = w / n;
      const floor = h / 2;
      let openings = "";
      for (let i = 0; i < n; i++) {
        const cx = aw * (i + 0.5);
        openings += arch(cx, 0, aw * 0.66, floor * 0.84);
        openings += arch(cx, -floor, aw * 0.56, floor * 0.74);
      }
      const tx0 = w / 2 - aw * 0.8;
      const tx1 = w / 2 + aw * 0.8;
      const tTop = -h - 150;
      e = {
        w,
        h: -tTop,
        mass: r(0, -h, w, 0) + r(tx0, tTop + 34, tx1, -h) + `M ${tx0 + 6} ${tTop + 34} L ${w / 2} ${tTop} L ${tx1 - 6} ${tTop + 34} Z`,
        roof: `M -8 ${-h} L 6 ${-h - 12} H ${w - 6} L ${w + 8} ${-h} Z`,
        openings: openings + arch(w / 2, -h - 44, 30, 56),
        lines: `M 0 ${-floor} H ${w} M 0 ${-floor - 8} H ${w} M ${tx0} ${-h - 70} H ${tx1} M ${w / 2} ${tTop} V ${tTop - 22}`,
        accents: `M ${w / 2 + 17} ${-h - 100} a 17 17 0 1 0 -34 0 a 17 17 0 1 0 34 0 M ${w / 2} ${-h - 100} v -11 M ${w / 2} ${-h - 100} l 8 4 M ${w / 2 - aw * 1.4} ${-floor - 2} H ${w / 2 + aw * 1.4} V ${-floor + 12} H ${w / 2 - aw * 1.4} Z`,
        top: -tTop + 22,
      };
      break;
    }
    case "casaTucuman": {
      // Colonial one-storey house with the twisted-column baroque portal.
      const pw = 96;
      const px0 = w / 2 - pw / 2;
      const px1 = w / 2 + pw / 2;
      const pt = -h - 58;
      let twist = "";
      for (const cx of [px0 + 12, px1 - 12]) {
        for (let k = 0; k < 7; k++) {
          const y = -8 - k * 16;
          twist += `M ${cx - 7} ${y} C ${cx - 2} ${y - 4}, ${cx + 2} ${y - 12}, ${cx + 7} ${y - 16} `;
        }
      }
      let openings = r(w / 2 - 20, -80, w / 2 + 20, 0);
      let accents = twist;
      for (const cx of [w * 0.16, w * 0.32, w * 0.68, w * 0.84]) {
        openings += r(cx - 16, -h * 0.74, cx + 16, -h * 0.26);
        accents += reja(cx - 16, -h * 0.74, cx + 16, -h * 0.26, 5);
      }
      e = {
        w,
        h: -pt,
        mass: r(0, -h, w, 0) + r(px0, -h - 20, px1, 0) + `M ${px0 - 8} ${-h - 20} L ${w / 2 - 14} ${pt} M ${px1 + 8} ${-h - 20} L ${w / 2 + 14} ${pt}` + `M ${px0 - 8} ${-h - 20} L ${w / 2} ${pt - 6} L ${px1 + 8} ${-h - 20} Z`,
        roof: `M -6 ${-h} L 4 ${-h - 8} H ${w - 4} L ${w + 6} ${-h} Z`,
        openings,
        lines: `M 0 -6 H ${w} M ${px0} ${-h - 20} H ${px1} M ${px0 + 12} 0 V ${-h - 16} M ${px1 - 12} 0 V ${-h - 16}`,
        accents,
        top: -pt + 10,
      };
      break;
    }
    case "warehouse":
    case "barracks": {
      const bays = Math.max(3, Math.round(w / 48));
      e = {
        w,
        h,
        mass: r(0, -h, w, 0),
        roof: kind === "warehouse" ? `M -4 ${-h} L ${w / 2} ${-h - 34} L ${w + 4} ${-h} Z` : r(-4, -h - 8, w + 4, -h),
        openings: grid(0, w, -h + 14, -10, bays, 2, 0.5, 0.55) + (kind === "warehouse" ? r(w / 2 - 24, -h * 0.6, w / 2 + 24, 0) : ""),
        lines: `M 0 ${-h * 0.5} H ${w}`,
        accents: "",
        top: h + 34,
      };
      break;
    }
    case "station": {
      const shed = `M 0 ${-h} C ${w * 0.1} ${-h - 90}, ${w * 0.9} ${-h - 90}, ${w} ${-h} Z`;
      let ribs = "";
      for (let i = 1; i < 8; i++) {
        const x = (w * i) / 8;
        ribs += `M ${x} ${-h} V ${-h - 90 * Math.sin((Math.PI * i) / 8) * 0.78} `;
      }
      e = {
        w,
        h: h + 190,
        mass: r(0, -h, w, 0) + shed + r(w - 70, -h - 190, w - 20, -h),
        openings: grid(0, w - 90, -h + 10, -6, 7, 1, 0.6, 0.72) + arch(w / 2 - 40, 0, 60, h * 0.8),
        lines: ribs + `M 0 ${-h} H ${w}`,
        accents: `M ${w - 45 + 16} ${-h - 150} a 16 16 0 1 0 -32 0 a 16 16 0 1 0 32 0 M ${w - 45} ${-h - 150} v -10 M ${w - 45} ${-h - 150} l 7 3`,
        top: h + 200,
      };
      break;
    }
    case "factory": {
      const teeth = Math.max(3, Math.round(w / 60));
      const tw = w / teeth;
      let roof = `M 0 ${-h} `;
      for (let i = 0; i < teeth; i++) {
        roof += `L ${i * tw} ${-h - 38} L ${(i + 1) * tw} ${-h} `;
      }
      roof += "Z";
      const chim = r(w * 0.12, -h - 190, w * 0.12 + 22, -h) + r(w * 0.72, -h - 160, w * 0.72 + 20, -h);
      e = {
        w,
        h: h + 190,
        mass: r(0, -h, w, 0) + chim,
        roof,
        openings: grid(0, w, -h + 14, -12, Math.round(w / 26), 3, 0.62, 0.5),
        lines: `M 0 ${-h * 0.33} H ${w} M 0 ${-h * 0.66} H ${w}`,
        accents: `M ${w * 0.12} ${-h - 170} h 22 M ${w * 0.72} ${-h - 140} h 20`,
        top: h + 190,
      };
      break;
    }
    case "congreso": {
      const cx = w / 2;
      const domeR = w * 0.16;
      const drumTop = -h - 60;
      const cols = Array.from({ length: 8 }, (_, i) => r(cx - 120 + i * 32, -h + 6, cx - 112 + i * 32, -26)).join("");
      e = {
        w,
        h: h + 60 + domeR * 1.6,
        mass:
          r(0, -h, w, 0) +
          r(cx - domeR, drumTop, cx + domeR, -h) +
          `M ${cx - domeR} ${drumTop} C ${cx - domeR} ${drumTop - domeR * 1.3}, ${cx + domeR} ${drumTop - domeR * 1.3}, ${cx + domeR} ${drumTop} Z` +
          `M ${cx - 140} ${-h} L ${cx} ${-h - 50} L ${cx + 140} ${-h} Z`,
        openings: grid(0, cx - 150, -h + 16, -30, 4, 2, 0.4, 0.56) + grid(cx + 150, w, -h + 16, -30, 4, 2, 0.4, 0.56) + grid(cx - domeR, cx + domeR, drumTop + 10, -h - 8, 6, 1, 0.4, 0.6),
        lines: `M 0 -26 H ${w} M 0 ${-h + 6} H ${w} M ${cx} ${drumTop - domeR * 0.97} V ${drumTop - domeR * 1.4}`,
        accents: cols,
        top: h + 60 + domeR * 1.4,
      };
      break;
    }
    case "casaRosada": {
      const cx = w / 2;
      e = {
        w,
        h: h + 40,
        mass: r(0, -h, w, 0) + r(cx - 70, -h - 40, cx + 70, -h),
        openings: grid(0, w, -h + 12, -h * 0.52, 12, 1, 0.42, 0.6) + Array.from({ length: 12 }, (_, i) => arch((w / 12) * (i + 0.5), 0, w / 12 * 0.5, h * 0.4)).join("") + arch(cx, -h - 2, 34, 36),
        lines: `M 0 ${-h * 0.5} H ${w} M 0 ${-h * 0.46} H ${w}`,
        // The balcony: a projecting slab with balustrade at the first floor.
        accents: `M ${cx - 60} ${-h * 0.5} H ${cx + 60} V ${-h * 0.5 + 8} H ${cx - 60} Z M ${cx - 60} ${-h * 0.5} v -18 H ${cx + 60} v 18 ` + Array.from({ length: 12 }, (_, i) => `M ${cx - 55 + i * 10} ${-h * 0.5} v -18`).join(" "),
        top: h + 40,
      };
      break;
    }
    case "arsenal": {
      // Military depot: long barracks, water tower and a perimeter wall with gate.
      const tower = r(w * 0.8, -h - 120, w * 0.8 + 16, -h) + r(w * 0.8 - 20, -h - 170, w * 0.8 + 36, -h - 120);
      e = {
        w,
        h: h + 170,
        mass: r(0, -h, w * 0.7, 0) + r(w * 0.7, -h * 0.55, w, 0) + tower,
        roof: `M -4 ${-h} L ${w * 0.35} ${-h - 30} L ${w * 0.7 + 4} ${-h} Z`,
        openings: grid(0, w * 0.7, -h + 12, -10, Math.round((w * 0.7) / 34), 2, 0.5, 0.52) + r(w * 0.82, -h * 0.5, w * 0.95, 0),
        lines: `M 0 ${-h * 0.5} H ${w * 0.7}`,
        accents: `M ${w * 0.8 - 20} ${-h - 145} H ${w * 0.8 + 36}`,
        top: h + 170,
      };
      break;
    }
    case "apartmentBlock": {
      const floors = Math.max(3, Math.round(h / 44));
      const bays = Math.max(3, Math.round(w / 46));
      e = {
        w,
        h,
        mass: r(0, -h, w, 0),
        openings: grid(0, w, -h + 16, -30, bays, floors, 0.5, 0.52) + r(w / 2 - 14, -30, w / 2 + 14, 0),
        lines: Array.from({ length: floors }, (_, i) => `M 0 ${(-30 - ((h - 46) * i) / floors).toFixed(1)} H ${w}`).join(" ") + ` M -4 ${-h} H ${w + 4}`,
        accents: "",
        top: h,
      };
      break;
    }
    case "officeTower": {
      const bays = Math.max(4, Math.round(w / 30));
      const floors = Math.max(6, Math.round(h / 30));
      let lines = "";
      for (let i = 0; i <= bays; i++) {
        lines += `M ${((w * i) / bays).toFixed(1)} 0 V ${-h} `;
      }
      e = {
        w,
        h,
        mass: r(0, -h, w, 0),
        openings: grid(0, w, -h + 8, -8, bays, floors, 0.78, 0.6),
        lines,
        accents: r(w * 0.4, -h - 30, w * 0.44, -h),
        top: h + 30,
      };
      break;
    }
    case "bankHall": {
      const cols = Array.from({ length: 6 }, (_, i) => r(w * 0.12 + i * w * 0.15, -h + 30, w * 0.12 + i * w * 0.15 + 14, -18)).join("");
      e = {
        w,
        h: h + 40,
        mass: r(0, -h, w, 0) + `M -6 ${-h} L ${w / 2} ${-h - 40} L ${w + 6} ${-h} Z`,
        openings: r(w * 0.2, -h * 0.55, w * 0.8, 0),
        lines: `M 0 -18 H ${w} M 0 ${-h + 30} H ${w}`,
        accents: cols,
        top: h + 40,
      };
      break;
    }
    case "shopRow": {
      const n = Math.max(2, Math.round(w / 70));
      let openings = "";
      let accents = "";
      for (let i = 0; i < n; i++) {
        const x0 = (w / n) * i + 8;
        const x1 = (w / n) * (i + 1) - 8;
        openings += r(x0, -h * 0.46, x1, 0);
        accents += `M ${x0} ${-h * 0.46 - 6} L ${x0 - 4} ${-h * 0.36} H ${x1 + 4} L ${x1} ${-h * 0.46 - 6} Z `;
        openings += r(x0 + 6, -h + 12, x1 - 6, -h * 0.58);
      }
      e = { w, h, mass: r(0, -h, w, 0), openings, lines: `M -3 ${-h} H ${w + 3}`, accents, top: h };
      break;
    }
    case "pulperia": {
      e = {
        w,
        h,
        mass: r(0, -h, w, 0),
        roof: `M -10 ${-h} L ${w * 0.5} ${-h - 30} L ${w + 10} ${-h} Z`,
        openings: r(w * 0.36, -54, w * 0.6, 0) + r(w * 0.72, -h * 0.72, w * 0.9, -h * 0.34),
        lines: `M 0 -4 H ${w}`,
        accents: reja(w * 0.72, -h * 0.72, w * 0.9, -h * 0.34, 4),
        top: h + 30,
      };
      break;
    }
  }
  cache.set(key, e);
  return e;
};

export interface BuildingProps {
  p: Projector;
  kind: ElevationKind;
  /** Ground position of the façade's left end (sheet local). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** World units per local drawing unit. */
  scale?: number;
  variant?: number;
  /** 0 → 1 architectural drafting. */
  build: number;
  fold?: number;
  tone?: number;
  /** Cool (control) tint 0..1. */
  cool?: number;
  opacity?: number;
  /** Structural lines tint (control/lock). */
  lineColor?: string;
  wallColor?: string;
  /** Fracture of the façade (Monte Chingolo): 0..1. */
  children?: React.ReactNode;
  id?: string;
}

const ns = { vectorEffect: "non-scaling-stroke" as const };

export const Building: React.FC<BuildingProps> = ({
  p,
  kind,
  x,
  y,
  w,
  h,
  scale = 1,
  variant = 0,
  build,
  fold = 0,
  tone = 0,
  cool = 0,
  opacity = 1,
  lineColor,
  wallColor,
  children,
  id,
}) => {
  if (opacity <= 0.002 || build <= 0.001) {
    return null;
  }
  const e = elevation(kind, w, h, variant);
  const paper = PALETTE.paperCool;
  const T = (c: string) => mixColor(mixColor(c, PALETTE.grayBlue, cool * 0.45), paper, tone);
  const wall = T(wallColor ?? mixColor(PALETTE.paperWarm, PALETTE.grayBlue, 0.22));
  const roof = T(mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.35));
  const open = T(mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.42));
  const line = T(lineColor ?? PALETTE.deepBlue);
  const lineB = clamp01(build / 0.4);
  const massB = clamp01((build - 0.3) / 0.3);
  const openB = clamp01((build - 0.55) / 0.3);
  const detB = clamp01((build - 0.75) / 0.25);
  // Centre-out, ground-up drafting window for the lines.
  const half = (w / 2 + 40) * lineB;
  const top = e.top * clamp01(lineB * 1.3);
  const clipId = `bld-${id ?? `${kind}-${Math.round(x)}-${Math.round(y)}`}`;
  return (
    <g data-id={id ?? kind} transform={standMatrix(p, x, y, scale, 1, fold)} opacity={opacity}>
      <defs>
        <clipPath id={clipId}>
          <rect x={w / 2 - half} y={-top - 10} width={half * 2} height={top + 20} />
        </clipPath>
      </defs>
      <g clipPath={lineB < 1 ? `url(#${clipId})` : undefined}>
        {massB > 0 ? (
          <>
            {e.roof ? <path d={e.roof} fill={roof} opacity={massB} stroke={line} strokeWidth={1} {...ns} /> : null}
            <path d={e.mass} fill={wall} fillOpacity={massB} stroke={line} strokeWidth={1.2} {...ns} />
          </>
        ) : (
          <path d={e.mass} fill="none" stroke={line} strokeWidth={1.1} {...ns} />
        )}
        {openB > 0 ? <path d={e.openings} fill={open} opacity={0.7 * openB} stroke={line} strokeWidth={0.7} strokeOpacity={0.6} {...ns} /> : null}
        <path d={e.lines} fill="none" stroke={line} strokeWidth={1} opacity={0.55} {...ns} />
        {detB > 0 ? <path d={e.accents} fill="none" stroke={line} strokeWidth={0.9} opacity={detB * 0.85} {...ns} /> : null}
        {children}
      </g>
    </g>
  );
};
