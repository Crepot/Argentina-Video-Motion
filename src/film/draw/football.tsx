import React from "react";
import { clamp01 } from "../../animation/interpolate-clamped";
import { createPrng } from "../../animation/stroke-draw";
import { mixColor, PALETTE } from "../../theme/palette";
import { planeMatrix, type Projector } from "../../stage/projection";
import type { Point } from "../../types/paths";
import type { CrowdMember } from "./crowd";
import { standMatrix } from "./stand";

/**
 * Football kit for 1986–2022 (storyboard §A "Football scenes"): a parametric
 * pitch drawn on the ground (built line by line from inherited geometry), a
 * standing goal, the ball, stands as crowd rings, and an original simplified
 * World Cup trophy. Local units: 30 per metre (players ≈ 80, editorial).
 */
export const PITCH_L = 3150;
export const PITCH_W = 2040;
const HL = PITCH_L / 2;
const HW = PITCH_W / 2;
const M = 30;

export const pitchLines = (draw: number) => {
  // Segments in drafting order; `draw` reveals them progressively.
  const seg: string[] = [
    `M ${-HL} ${-HW} H ${HL}`,
    `M ${-HL} ${HW} H ${HL}`,
    `M ${-HL} ${-HW} V ${HW}`,
    `M ${HL} ${-HW} V ${HW}`,
    `M 0 ${-HW} V ${HW}`,
    `M ${9.15 * M} 0 A ${9.15 * M} ${9.15 * M} 0 1 1 ${-9.15 * M} 0 A ${9.15 * M} ${9.15 * M} 0 1 1 ${9.15 * M} 0`,
    `M ${-HL} ${-20.16 * M} H ${-HL + 16.5 * M} V ${20.16 * M} H ${-HL}`,
    `M ${HL} ${-20.16 * M} H ${HL - 16.5 * M} V ${20.16 * M} H ${HL}`,
    `M ${-HL} ${-9.16 * M} H ${-HL + 5.5 * M} V ${9.16 * M} H ${-HL}`,
    `M ${HL} ${-9.16 * M} H ${HL - 5.5 * M} V ${9.16 * M} H ${HL}`,
  ];
  const n = Math.round(seg.length * clamp01(draw));
  return seg.slice(0, n).join(" ");
};

export const PitchGround: React.FC<{ draw: number; fill: number; color?: string; stripes?: number }> = ({ draw, fill, color = PALETTE.paperWarm, stripes = 1 }) => {
  let st = "";
  for (let i = 0; i < 14; i += 2) {
    const x0 = -HL + (PITCH_L / 14) * i;
    st += `M ${x0} ${-HW} h ${PITCH_L / 14} v ${PITCH_W} h ${-PITCH_L / 14} Z `;
  }
  return (
    <g>
      <rect x={-HL - 90} y={-HW - 90} width={PITCH_L + 180} height={PITCH_W + 180} fill={mixColor(PALETTE.skyBluePale, PALETTE.paperWarm, 0.45)} opacity={fill} />
      <path d={st} fill={PALETTE.skyBluePale} opacity={0.35 * fill * stripes} />
      <path d={pitchLines(draw)} fill="none" stroke={color} strokeWidth={3} opacity={0.95} />
      <path d={pitchLines(draw)} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={1} opacity={0.35} />
      <circle cx={0} cy={0} r={8} fill={color} opacity={draw > 0.6 ? 1 : 0} />
    </g>
  );
};

const ns = { vectorEffect: "non-scaling-stroke" as const };

/**
 * Goal on a goal line (x = ±HL) with a net that ripples. The film camera is
 * affine and looks along the pitch, so the mouth plane is edge-on; the goal
 * is read through its volume: two side nets, the roof net and the posts.
 */
export const Goal: React.FC<{ p: Projector; side: 1 | -1; ripple: number; opacity?: number }> = ({ p, side, ripple, opacity = 1 }) => {
  const x = side * HL;
  const half = 3.66 * M;
  const h = 2.44 * M;
  const depth = (70 + ripple * 26) * side;
  const sideNet = (yy: number) => planeMatrix(p, [x, yy, 0], [side, 0, 0], [0, 0, -1]);
  const roof = planeMatrix(p, [x, -half, h], [side, 0, 0], [0, 1, 0]);
  const d = Math.abs(depth);
  let mesh = "";
  for (let k = 1; k < 6; k++) {
    mesh += `M ${(k * d) / 6} 0 V ${-h} `;
  }
  for (let k = 1; k < 4; k++) {
    mesh += `M 0 ${(-k * h) / 4} H ${d} `;
  }
  let roofMesh = "";
  for (let k = 1; k < 10; k++) {
    roofMesh += `M 0 ${(k * 2 * half) / 10} H ${d} `;
  }
  const post = (yy: number) => {
    const a = p.point(x, yy, 0);
    const b = p.point(x, yy, h);
    return `M ${a[0].toFixed(1)} ${a[1].toFixed(1)} L ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  };
  const t0 = p.point(x, -half, h);
  const t1 = p.point(x, half, h);
  const frame = `${post(-half)} ${post(half)} M ${t0[0].toFixed(1)} ${t0[1].toFixed(1)} L ${t1[0].toFixed(1)} ${t1[1].toFixed(1)}`;
  return (
    <g opacity={opacity}>
      {[-half, half].map((yy) => (
        <g key={yy} transform={sideNet(yy)}>
          <rect x={0} y={-h} width={d} height={h} fill={PALETTE.paperWarm} opacity={0.35} />
          <path d={mesh} stroke={PALETTE.deepBlueSoft} strokeWidth={0.7} opacity={0.6} {...ns} />
          <path d={`M 0 ${-h} H ${d} V 0`} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={1} opacity={0.8} {...ns} />
        </g>
      ))}
      <g transform={roof}>
        <rect x={0} y={0} width={d} height={2 * half} fill={PALETTE.paperWarm} opacity={0.3} />
        <path d={roofMesh} stroke={PALETTE.deepBlueSoft} strokeWidth={0.7} opacity={0.55} {...ns} />
        <path d={`M ${d} 0 V ${2 * half}`} stroke={PALETTE.deepBlueSoft} strokeWidth={1} opacity={0.8} {...ns} />
      </g>
      <path d={frame} fill="none" stroke={PALETTE.paperWarm} strokeWidth={5} strokeLinecap="round" />
      <path d={frame} fill="none" stroke={PALETTE.deepBlue} strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
};

export const Ball: React.FC<{ p: Projector; x: number; y: number; h: number; r?: number; opacity?: number }> = ({ p, x, y, h, r = 11, opacity = 1 }) => {
  const g = p.point(x, y, 0);
  const c = p.point(x, y, h + r);
  const rr = r * p.zoom;
  return (
    <g opacity={opacity}>
      <ellipse cx={g[0]} cy={g[1]} rx={rr * 1.1} ry={rr * 0.45} fill={PALETTE.deepBlue} opacity={0.2} />
      <circle cx={c[0]} cy={c[1]} r={rr} fill={PALETTE.paperWarm} stroke={PALETTE.deepBlue} strokeWidth={1.2} />
      <path d={`M ${c[0] - rr * 0.5} ${c[1] - rr * 0.2} l ${rr * 0.5} ${-rr * 0.35} l ${rr * 0.45} ${rr * 0.3} l ${-rr * 0.2} ${rr * 0.5} l ${-rr * 0.55} 0 Z`} fill={PALETTE.deepBlue} />
    </g>
  );
};

/** Seated spectators on elliptical terraces around a pitch (members for crowdItems). */
export const standsCrowd = (seed: number, rx: number, ry: number, rows: number, spacing = 46): CrowdMember[] => {
  const r = createPrng(seed);
  const out: CrowdMember[] = [];
  for (let row = 0; row < rows; row++) {
    const ax = rx + row * 70;
    const ay = ry + row * 60;
    const n = Math.floor((2 * Math.PI * Math.sqrt((ax * ax + ay * ay) / 2)) / spacing);
    for (let k = 0; k < n; k++) {
      const t = (k / n) * Math.PI * 2 + (r() - 0.5) * 0.02;
      out.push({ x: Math.cos(t) * ax, y: Math.sin(t) * ay, shirt: Math.floor(r() * 4), phase: r(), lift: r(), order: r() * 0.7 + row * 0.06, from: [0, 0] });
    }
  }
  return out;
};

/** Original simplified World Cup trophy (not a replica): base bands, spiral body, globe. */
export const WorldCupTrophy: React.FC<{ p: Projector; x: number; y: number; s: number; lift: number; gold: number; opacity?: number; fold?: number }> = ({
  p,
  x,
  y,
  s,
  lift,
  gold,
  opacity = 1,
  fold = 0,
}) => {
  const g = mixColor(PALETTE.grayBluePale, PALETTE.goldMuted, gold);
  const gl = mixColor(PALETTE.grayBluePale, PALETTE.goldLight, gold);
  const line = mixColor(PALETTE.deepBlueSoft, PALETTE.goldMuted, gold * 0.5);
  return (
    <g transform={standMatrix(p, x, y, s, 1, fold, lift)} opacity={opacity}>
      <path d="M -16 0 L -13 -14 H 13 L 16 0 Z" fill={g} stroke={line} strokeWidth={1} {...ns} />
      <path d="M -13 -5 H 13 M -13 -9 H 13" stroke={PALETTE.deepBlueSoft} strokeWidth={1.4} opacity={0.5} {...ns} />
      <path d="M -11 -14 C -6 -30, -14 -44, -9 -58 C -6 -66, 6 -66, 9 -58 C 14 -44, 6 -30, 11 -14 Z" fill={g} stroke={line} strokeWidth={1.1} {...ns} />
      <path d="M -10 -18 C 2 -26, -6 -40, 6 -50 M 10 -20 C -2 -30, 6 -42, -6 -54" fill="none" stroke={mixColor(line, PALETTE.deepBlue, 0.3)} strokeWidth={0.9} opacity={0.7} {...ns} />
      <circle cx={0} cy={-71} r={11} fill={gl} stroke={line} strokeWidth={1.1} {...ns} />
      <path d="M -11 -71 H 11 M 0 -82 C -6 -76, -6 -66, 0 -60 C 6 -66, 6 -76, 0 -82" fill="none" stroke={line} strokeWidth={0.8} opacity={0.7} {...ns} />
    </g>
  );
};

/** Screen position helper for a ground point. */
export const screenOf = (p: Projector, q: Point, h = 0) => p.point(q[0], q[1], h);
