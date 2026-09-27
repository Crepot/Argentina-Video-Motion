import React from "react";
import { mixColor, PALETTE } from "../../theme/palette";
import type { Projector } from "../../stage/projection";
import { standMatrix } from "./stand";

/**
 * Small period props standing on a sheet (local units, person ≈ 80): toldo
 * (indigenous tent), fortín (frontier post), telegraph pole, windmill, mate
 * vignette, microphone stand, lamppost. Billboards; `fold` lays them flat.
 */
const ns = { vectorEffect: "non-scaling-stroke" as const };
const line = PALETTE.deepBlue;

export const Toldo: React.FC<{ p: Projector; x: number; y: number; s: number; fold?: number; tone?: number }> = ({ p, x, y, s, fold = 0, tone = 0 }) => {
  const c = mixColor(mixColor(PALETTE.grayBlue, PALETTE.paperWarm, 0.3), PALETTE.paperCool, tone);
  return (
    <g transform={standMatrix(p, x, y, s, 1, fold)}>
      <path d="M -70 0 C -66 -40, -34 -66, 0 -68 C 34 -66, 66 -40, 72 0 Z" fill={c} stroke={line} strokeWidth={1.1} {...ns} />
      <path d="M -40 0 C -36 -30, -20 -48, 0 -52 M 40 0 C 36 -30, 20 -48, 0 -52 M 0 -68 V 0" fill="none" stroke={line} strokeWidth={0.8} opacity={0.6} {...ns} />
      <path d="M -12 0 V -30 H 12 V 0" fill={mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.3)} {...ns} />
    </g>
  );
};

export const Fortin: React.FC<{ p: Projector; x: number; y: number; s: number; fold?: number; flag?: boolean }> = ({ p, x, y, s, fold = 0 }) => {
  let pal = "";
  for (let i = -60; i <= 60; i += 8) {
    pal += `M ${i} 0 V ${-38 - (i % 16 === 0 ? 4 : 0)} `;
  }
  return (
    <g transform={standMatrix(p, x, y, s, 1, fold)}>
      <path d={pal} stroke={mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.3)} strokeWidth={2.2} {...ns} />
      <path d="M -62 -30 H 62" stroke={line} strokeWidth={1} {...ns} />
      <path d="M 30 -38 V -120 M 58 -38 V -120 M 26 -120 H 62 V -138 H 26 Z M 30 -60 L 58 -90 M 58 -60 L 30 -90" fill={mixColor(PALETTE.paperWarm, PALETTE.grayBlue, 0.3)} stroke={line} strokeWidth={1.2} {...ns} />
    </g>
  );
};

export const TelegraphPole: React.FC<{ p: Projector; x: number; y: number; s: number; fold?: number }> = ({ p, x, y, s, fold = 0 }) => (
  <g transform={standMatrix(p, x, y, s, 1, fold)}>
    <path d="M 0 0 V -120 M -14 -110 H 14 M -10 -100 H 10" stroke={line} strokeWidth={1.4} {...ns} />
  </g>
);

export const Windmill: React.FC<{ p: Projector; x: number; y: number; s: number; phase: number; fold?: number }> = ({ p, x, y, s, phase, fold = 0 }) => {
  let blades = "";
  for (let i = 0; i < 12; i++) {
    const a = phase * Math.PI * 2 + (i / 12) * Math.PI * 2;
    blades += `M 0 -150 L ${(Math.cos(a) * 34).toFixed(1)} ${(-150 + Math.sin(a) * 34).toFixed(1)} `;
  }
  return (
    <g transform={standMatrix(p, x, y, s, 1, fold)}>
      <path d="M -24 0 L -4 -150 M 24 0 L 4 -150 M -18 -40 H 18 M -12 -90 H 12" stroke={line} strokeWidth={1.1} fill="none" {...ns} />
      <path d={blades} stroke={mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.2)} strokeWidth={1.2} {...ns} />
      <path d="M 0 -150 l 40 6 l 0 -12 Z" fill={PALETTE.skyBluePale} stroke={line} strokeWidth={0.8} {...ns} />
    </g>
  );
};

export const Microphones: React.FC<{ p: Projector; x: number; y: number; s: number; lift?: number }> = ({ p, x, y, s, lift = 0 }) => (
  <g transform={standMatrix(p, x, y, s, 1, 0, lift)}>
    <path d="M 0 0 V -58 M -10 -58 H 10 M -8 -58 V -66 M 0 -58 V -68 M 8 -58 V -66" stroke={line} strokeWidth={1.3} {...ns} />
    <circle cx={-8} cy={-68} r={3} fill={line} />
    <circle cx={0} cy={-70} r={3.4} fill={line} />
    <circle cx={8} cy={-68} r={3} fill={line} />
  </g>
);

/** Rail track with sleepers placed by arc length (straight segment, local units). */
export const railD = (x0: number, x1: number, y: number, gauge = 14, spacing = 16) => {
  let d = `M ${x0} ${y - gauge / 2} H ${x1} M ${x0} ${y + gauge / 2} H ${x1} `;
  for (let x = Math.ceil(x0 / spacing) * spacing; x <= x1; x += spacing) {
    d += `M ${x} ${y - gauge / 2 - 5} V ${y + gauge / 2 + 5} `;
  }
  return d;
};
