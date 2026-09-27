import React from "react";
import { clamp01 } from "../animation/interpolate-clamped";
import { mixColor, PALETTE } from "../theme/palette";
import { billboardMatrix, planeMatrix, type Projector } from "./projection";

/**
 * Reusable environment props for the V2 stage: vehicles on routes, street
 * furniture, a newspaper kiosk that censorship shutters, barriers, graphic
 * smoke and loose documents. All are billboards/planes on the atlas ground.
 */
const ns = { vectorEffect: "non-scaling-stroke" as const };
const tint = (c: string, tone: number) => mixColor(c, PALETTE.paperCool, tone);

/* ------------------------------------------------------------ vehicles */

export type VehicleKind = "truck" | "jeep" | "sedan" | "bus";

const VEHICLES: Record<
  VehicleKind,
  { body: string; cover?: string; glass: string; lines: string; wheels: [number, number][]; r: number }
> = {
  // Military truck: cab + canvas-covered bed (original generic design).
  truck: {
    body: "M -86 -18 H 34 V -44 H 52 L 62 -70 H 82 L 90 -46 V -18 Z",
    cover: "M -88 -44 C -88 -86, -80 -92, -60 -92 H 26 C 32 -92, 36 -86, 36 -78 V -44 Z",
    glass: "M 56 -48 L 64 -66 H 78 L 84 -48 Z",
    lines: "M -64 -92 V -44 M -38 -92 V -44 M -12 -92 V -44 M 12 -92 V -44 M -86 -30 H 34",
    wheels: [
      [-58, -14],
      [-30, -14],
      [62, -14],
    ],
    r: 14,
  },
  jeep: {
    body: "M -52 -16 H 50 L 54 -38 H 18 L 10 -52 H -30 L -34 -38 H -52 Z",
    glass: "M 8 -50 L 16 -38 H -2 V -50 Z",
    lines: "M -30 -52 V -38 M 18 -38 H 54",
    wheels: [
      [-32, -13],
      [32, -13],
    ],
    r: 12,
  },
  // City bus (film, 1990s–2000s street; generic silhouette).
  bus: {
    body: "M -128 -16 H 126 L 128 -84 C 128 -92, 122 -96, 114 -96 H -118 C -124 -96, -128 -92, -128 -86 Z",
    glass: "M -116 -86 H -84 V -60 H -116 Z M -76 -86 H -44 V -60 H -76 Z M -36 -86 H -4 V -60 H -36 Z M 4 -86 H 36 V -60 H 4 Z M 44 -86 H 76 V -60 H 44 Z M 86 -86 H 120 V -52 H 86 Z",
    lines: "M -128 -46 H 128 M 80 -50 V -18",
    wheels: [
      [-88, -12],
      [84, -12],
    ],
    r: 13,
  },
  // Dark 1970s saloon car (generic silhouette).
  sedan: {
    body: "M -70 -16 H 72 L 74 -32 L 44 -36 L 26 -54 H -30 L -46 -36 L -70 -34 Z",
    glass: "M -26 -50 H 0 V -38 H -40 Z M 6 -50 H 22 L 34 -38 H 6 Z",
    lines: "M -70 -26 H 74 M 3 -52 V -20",
    wheels: [
      [-44, -12],
      [46, -12],
    ],
    r: 12,
  },
};

export const Vehicle: React.FC<{
  kind: VehicleKind;
  p: Projector;
  x: number;
  y: number;
  scale: number;
  facing: 1 | -1;
  /** Distance travelled (world units) → wheel rotation, no sliding. */
  dist: number;
  tone?: number;
  rise?: number;
}> = ({ kind, p, x, y, scale, facing, dist, tone = 0, rise = 1 }) => {
  const v = VEHICLES[kind];
  const body =
    kind === "sedan"
      ? tint(mixColor(PALETTE.deepBlue, PALETTE.deepBlueSoft, 0.4), tone)
      : kind === "bus"
      ? tint(mixColor(PALETTE.skyBlue, PALETTE.grayBlue, 0.35), tone)
      : tint(mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.4), tone);
  const cover = tint(mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.3), tone);
  const line = tint(PALETTE.deepBlue, tone);
  const spin = ((dist / (2 * Math.PI * v.r * scale)) * 360 * facing) % 360;
  return (
    <g transform={billboardMatrix(p, x, y, scale, facing)}>
      <g transform={`scale(1 ${Math.max(0.0001, rise).toFixed(4)})`}>
        <ellipse cx={0} cy={0} rx={96} ry={7} fill={PALETTE.deepBlue} opacity={0.1} />
        {v.cover ? <path d={v.cover} fill={cover} stroke={line} strokeWidth={1.1} {...ns} /> : null}
        <path d={v.body} fill={body} stroke={line} strokeWidth={1.2} {...ns} />
        <path d={v.glass} fill={tint(PALETTE.grayBluePale, tone)} stroke={line} strokeWidth={0.9} {...ns} />
        <path d={v.lines} fill="none" stroke={line} strokeWidth={0.9} opacity={0.7} {...ns} />
        {v.wheels.map(([wx, wy], i) => (
          <g key={i} transform={`translate(${wx} ${wy}) rotate(${spin.toFixed(1)})`}>
            <circle r={v.r} fill={tint(PALETTE.deepBlue, tone)} />
            <circle r={v.r * 0.45} fill={tint(PALETTE.grayBlue, tone)} />
            <path d={`M 0 ${-v.r * 0.45} V ${v.r * 0.45} M ${-v.r * 0.45} 0 H ${v.r * 0.45}`} stroke={line} strokeWidth={0.8} {...ns} />
          </g>
        ))}
      </g>
    </g>
  );
};

/* ------------------------------------------------------ street furniture */

export const Lamppost: React.FC<{ p: Projector; x: number; y: number; scale: number; tone?: number }> = ({ p, x, y, scale, tone = 0 }) => (
  <g transform={billboardMatrix(p, x, y, scale)}>
    <path
      d="M -1.6 0 V -150 C -1.6 -160, 6 -164, 16 -162 M 16 -162 L 24 -158 M -5 0 H 5"
      fill="none"
      stroke={tint(PALETTE.deepBlue, tone)}
      strokeWidth={2.2}
      strokeLinecap="round"
      {...ns}
    />
    <path d="M 12 -160 L 28 -154 L 24 -148 L 10 -154 Z" fill={tint(PALETTE.deepBlueSoft, tone)} />
  </g>
);

/** Newspaper kiosk: pages on display get grey censorship shutters (left → right). */
export const Kiosk: React.FC<{
  p: Projector;
  x: number;
  y: number;
  scale: number;
  censor: number;
  tone?: number;
}> = ({ p, x, y, scale, censor, tone = 0 }) => {
  const line = tint(PALETTE.deepBlue, tone);
  const pages = [-40, -20, 0, 20];
  return (
    <g transform={billboardMatrix(p, x, y, scale)}>
      <path d="M -54 0 V -70 H 54 V 0 Z" fill={tint(mixColor(PALETTE.grayBlue, PALETTE.paperWarm, 0.3), tone)} stroke={line} strokeWidth={1.2} {...ns} />
      <path d="M -62 -70 L -54 -86 H 54 L 62 -70 Z" fill={tint(PALETTE.deepBlueSoft, tone)} stroke={line} strokeWidth={1.1} {...ns} />
      {pages.map((px, i) => {
        const shut = clamp01(censor * 4 - i);
        return (
          <g key={px}>
            <rect x={px - 8} y={-64} width={17} height={24} fill={tint(PALETTE.paperWarm, tone)} stroke={line} strokeWidth={0.7} {...ns} />
            <path d={`M ${px - 6} -60 h 13 M ${px - 6} -56 h 9 M ${px - 6} -52 h 12 M ${px - 6} -48 h 8`} stroke={line} strokeWidth={0.6} opacity={0.6} {...ns} />
            <rect x={px - 8} y={-64} width={17 * shut} height={24} fill={tint(PALETTE.grayBluePale, tone)} />
            {shut > 0 ? <rect x={px - 8} y={-58} width={17 * shut} height={3} fill={tint(PALETTE.grayBlue, tone)} /> : null}
          </g>
        );
      })}
      <path d="M -54 -36 H 54" stroke={line} strokeWidth={0.9} {...ns} />
    </g>
  );
};

/** Crowd-control barrier (valla) segment. */
export const Barrier: React.FC<{
  p: Projector;
  x: number;
  y: number;
  scale: number;
  width: number;
  build: number;
  tone?: number;
}> = ({ p, x, y, scale, width, build, tone = 0 }) => {
  const b = clamp01(build);
  if (b <= 0.001) {
    return null;
  }
  const line = tint(PALETTE.deepBlue, tone);
  const n = Math.max(2, Math.round(width / 9));
  let bars = "";
  for (let i = 0; i <= n; i++) {
    const bx = -width / 2 + (width * i) / n;
    bars += `M ${bx.toFixed(1)} 0 V ${(-34 * b).toFixed(1)} `;
  }
  return (
    <g transform={billboardMatrix(p, x, y, scale)}>
      <path
        d={`${bars} M ${-width / 2} ${-34 * b} H ${-width / 2 + width * b} M ${-width / 2} ${-6 * b} H ${-width / 2 + width * b}`}
        fill="none"
        stroke={line}
        strokeWidth={1.3}
        strokeLinecap="butt"
        {...ns}
      />
      <path d={`M ${-width / 2 - 4} 0 l 8 -4 M ${width / 2 - 4} 0 l 8 -4`} stroke={line} strokeWidth={1.4} {...ns} />
    </g>
  );
};

/**
 * Graphic smoke: hatched rounded puffs rising from a source that thin into
 * straight hatching as they age (smoke → control geometry, §10.1C).
 */
export const Smoke: React.FC<{
  p: Projector;
  x: number;
  y: number;
  scale: number;
  age: number;
  strength: number;
  seed: number;
}> = ({ p, x, y, scale, age, strength, seed }) => {
  if (strength <= 0.002) {
    return null;
  }
  const puffs = [0, 1, 2, 3, 4];
  return (
    <g transform={billboardMatrix(p, x, y, scale)} opacity={strength}>
      {puffs.map((i) => {
        const t = (age * 0.9 + i * 0.21 + (seed % 7) * 0.03) % 1;
        const cx = (i - 2) * 16 + t * 34 + Math.sin(i * 1.7 + t * 4) * 6;
        const cy = -10 - t * 70;
        const r = 12 + t * 26;
        const straighten = Math.min(1, t * 1.3);
        return (
          <g key={i} opacity={Math.sin(t * Math.PI) * 0.9}>
            <ellipse cx={cx} cy={cy} rx={r} ry={r * (0.8 - 0.3 * straighten)} fill={PALETTE.grayBluePale} opacity={0.5} />
            <ellipse cx={cx} cy={cy} rx={r} ry={r * (0.8 - 0.3 * straighten)} fill="url(#v2-smoke-hatch)" opacity={0.7} />
          </g>
        );
      })}
    </g>
  );
};

/** Loose sheets (decrees, newspapers) blown along the avenue. */
export const Paper: React.FC<{
  p: Projector;
  x: number;
  y: number;
  h: number;
  size: number;
  spin: number;
  tone?: number;
  censored?: boolean;
}> = ({ p, x, y, h, size, spin, tone = 0, censored }) => {
  const a = spin * Math.PI * 2;
  const u: [number, number, number] = [Math.cos(a) * size, 0, Math.sin(a) * size * 0.4];
  const v: [number, number, number] = [0, Math.cos(a * 0.7) * size * 1.3, -Math.sin(a * 0.7) * size * 0.9];
  return (
    <g transform={planeMatrix(p, [x, y, h], u, v)}>
      <rect x={-0.5} y={-0.5} width={1} height={1} fill={tint(PALETTE.paperWarm, tone)} stroke={tint(PALETTE.deepBlue, tone)} strokeWidth={0.8} {...ns} />
      <path d="M -0.35 -0.3 H 0.3 M -0.35 -0.1 H 0.2 M -0.35 0.1 H 0.32" stroke={tint(PALETTE.deepBlue, tone)} strokeWidth={0.6} opacity={0.6} {...ns} />
      {censored ? <rect x={-0.4} y={-0.22} width={0.8} height={0.2} fill={tint(PALETTE.grayBlue, tone)} /> : null}
    </g>
  );
};

/** Shared pattern for smoke hatching. */
export const PropDefs: React.FC = () => (
  <defs>
    <pattern id="v2-smoke-hatch" patternUnits="userSpaceOnUse" width={5} height={5} patternTransform="rotate(-24)">
      <path d="M 0 0 V 5" stroke={PALETTE.grayBlue} strokeWidth={1} />
    </pattern>
  </defs>
);
