import React from "react";
import { mixColor, PALETTE } from "../../theme/palette";
import type { Point } from "../../types/paths";
import {
  AFRO_EURASIA,
  ANTARCTIC_COAST,
  ARGENTINA,
  ARGENTINA_FUEGO,
  BRITAIN,
  CARIBBEAN_ISLANDS,
  EURO_AFRICA,
  FLORIDA_US,
  lonLatPath,
  M,
  MALVINAS_SIMPLE,
  NORTH_CARIBBEAN,
  SOUTH_AMERICA,
  TIERRA_DEL_FUEGO,
  antarctic,
  smoothPath,
  type LonLat,
} from "../data/geo";
import type { CameraState } from "../../types/camera";
import { type Placement } from "../space";
import { SheetGround } from "./sheet";

/**
 * Editorial map ground (storyboard §A Maps/Oceans): light land tint, a
 * deep-blue coastline with a pale water rim, sparse graticule. Everything is
 * precomputed once in canonical Mercator world units; a placement puts the
 * map where the current camera segment needs it.
 */
const CONTINENTS = {
  southAmerica: lonLatPath(SOUTH_AMERICA, true, 2),
  fuego: lonLatPath(TIERRA_DEL_FUEGO, true, 2),
  euroAfrica: lonLatPath(EURO_AFRICA, true, 2),
  afroEurasia: lonLatPath(AFRO_EURASIA, true, 2),
  britain: lonLatPath(BRITAIN, true, 2),
  northAmerica: lonLatPath(NORTH_CARIBBEAN, true, 2),
  florida: lonLatPath(FLORIDA_US, true, 2),
  caribbean: CARIBBEAN_ISLANDS.map((c) => lonLatPath(c, true, 2)).join(" "),
  malvinas: MALVINAS_SIMPLE.map((c) => lonLatPath(c, true, 3)).join(" "),
} as const;

export type ContinentId = keyof typeof CONTINENTS;

export const ARGENTINA_PATH = lonLatPath(ARGENTINA, true, 3);
export const ARGENTINA_FUEGO_PATH = lonLatPath(ARGENTINA_FUEGO, false, 3);
export const MALVINAS_PATH = CONTINENTS.malvinas;

const graticule = (lon0: number, lon1: number, lat0: number, lat1: number, step: number) => {
  let d = "";
  for (let lon = Math.ceil(lon0 / step) * step; lon <= lon1; lon += step) {
    const a = M(lon, lat0);
    const b = M(lon, lat1);
    d += `M ${a[0].toFixed(1)} ${a[1].toFixed(1)} L ${b[0].toFixed(1)} ${b[1].toFixed(1)} `;
  }
  for (let lat = Math.ceil(lat0 / step) * step; lat <= lat1; lat += step) {
    const a = M(lon0, lat);
    const b = M(lon1, lat);
    d += `M ${a[0].toFixed(1)} ${a[1].toFixed(1)} L ${b[0].toFixed(1)} ${b[1].toFixed(1)} `;
  }
  return d;
};

export const GRATICULE_10 = graticule(-40, 110, -60, 62, 10);
export const GRATICULE_5 = graticule(-40, 110, -60, 62, 5);

export interface MapGroundProps {
  camera: CameraState;
  placement: Placement;
  continents: readonly ContinentId[];
  opacity: number;
  /** World (canonical) circle revealing the drawing outward; omit = fully drawn. */
  reveal?: { c: Point; r: number };
  graticule?: number;
  graticuleFine?: number;
  /** 0 = warm ivory land, 1 = cool gray-blue (loss, control). */
  cool?: number;
  landTint?: number;
  clipId: string;
}

export const MapGround: React.FC<MapGroundProps> = ({
  camera,
  placement,
  continents,
  opacity,
  reveal,
  graticule: gOp = 0,
  graticuleFine = 0,
  cool = 0,
  landTint = 1,
  clipId,
}) => {
  if (opacity <= 0.002) {
    return null;
  }
  const d = continents.map((c) => CONTINENTS[c]).join(" ");
  const coast = mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, cool * 0.6);
  const land = mixColor(mixColor(PALETTE.paperWarm, PALETTE.grayBluePale, 0.22), PALETTE.grayBluePale, cool * 0.5);
  return (
    <SheetGround camera={camera} pl={placement} opacity={opacity} id={`map.${clipId}`}>
      {reveal ? (
        <defs>
          <clipPath id={clipId}>
            <circle cx={reveal.c[0]} cy={reveal.c[1]} r={Math.max(0, reveal.r)} />
          </clipPath>
        </defs>
      ) : null}
      <g clipPath={reveal ? `url(#${clipId})` : undefined}>
        {gOp > 0.002 ? <path d={GRATICULE_10} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={0.8} opacity={gOp * 0.32} /> : null}
        {graticuleFine > 0.002 ? <path d={GRATICULE_5} fill="none" stroke={PALETTE.grayBlue} strokeWidth={0.6} opacity={graticuleFine * 0.35} /> : null}
        <path d={d} fill="none" stroke={PALETTE.skyBluePale} strokeWidth={16} strokeLinejoin="round" opacity={0.28} />
        <path d={d} fill="none" stroke={PALETTE.skyBlue} strokeWidth={6} strokeLinejoin="round" opacity={0.26} />
        <path d={d} fill={land} fillOpacity={landTint} stroke={coast} strokeWidth={1.3} strokeLinejoin="round" />
      </g>
    </SheetGround>
  );
};

/** Hatch lines clipped to a closed path (world units spacing). */
export const HatchedArea: React.FC<{
  id: string;
  d: string;
  bbox: [number, number, number, number];
  spacing: number;
  angle?: number;
  color: string;
  width?: number;
  opacity: number;
  dash?: string;
}> = ({ id, d, bbox, spacing, angle = 45, color, width = 0.8, opacity, dash }) => {
  if (opacity <= 0.002) {
    return null;
  }
  const [x0, y0, x1, y1] = bbox;
  const w = x1 - x0;
  const h = y1 - y0;
  const t = Math.tan((angle * Math.PI) / 180);
  let lines = "";
  for (let x = x0 - h / t; x < x1; x += spacing) {
    lines += `M ${x.toFixed(1)} ${y1.toFixed(1)} L ${(x + h / t).toFixed(1)} ${y0.toFixed(1)} `;
  }
  void w;
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={lines} clipPath={`url(#${id})`} stroke={color} strokeWidth={width} fill="none" strokeDasharray={dash} />
    </g>
  );
};

export const pathBBox = (pts: readonly LonLat[]): [number, number, number, number] => {
  const p = pts.map((q) => M(q[0], q[1]));
  return [Math.min(...p.map((q) => q[0])), Math.min(...p.map((q) => q[1])), Math.max(...p.map((q) => q[0])), Math.max(...p.map((q) => q[1]))];
};

/* ------------------------------------------------ Antarctic inset */

const sectorEdge = (lonW: number) => {
  const a = antarctic(lonW, 60);
  const b = antarctic(lonW, 90);
  return `M ${a[0].toFixed(1)} ${a[1].toFixed(1)} L ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
};

const arc60 = (() => {
  const pts: Point[] = [];
  for (let lon = 74; lon >= 25; lon -= 1) {
    pts.push(antarctic(lon, 60));
  }
  return smoothPath(pts, false, 1);
})();

export const ANTARCTIC = {
  sector: `${sectorEdge(74)} ${sectorEdge(25)} ${arc60.replace("M", "M")}`,
  sectorArea: (() => {
    const pts: Point[] = [];
    for (let lon = 74; lon >= 25; lon -= 1) {
      pts.push(antarctic(lon, 60));
    }
    pts.push(antarctic(25, 90));
    return `M ${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ")} Z`;
  })(),
  coast: smoothPath(ANTARCTIC_COAST.map((q) => antarctic(q[0], q[1])), false, 2),
  bbox: (() => {
    const pts = [antarctic(74, 60), antarctic(25, 60), antarctic(49.5, 90), antarctic(49.5, 60)];
    return [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))] as [number, number, number, number];
  })(),
};
