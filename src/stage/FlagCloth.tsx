import React from "react";
import { PALETTE } from "../theme/palette";

/**
 * FlagRig cloth (spec §9.14): a pole plus a cloth of 3 horizontal bands
 * deformed by 3 authored travelling waves. Drawn in the local plane of a
 * billboard (x → fly, y down), pole foot at (0, 0). No per-frame noise.
 */
export const FlagCloth: React.FC<{
  phase: number;
  amplitude: number;
  width: number;
  height: number;
  pole: number;
  tension?: number;
  stripeMode?: "argentina" | "abstract";
  pxPerUnit: number;
}> = ({ phase, amplitude, width, height, pole, tension = 0.5, stripeMode = "argentina", pxPerUnit }) => {
  const cols = 6;
  const top = -pole;
  const wave = (u: number) =>
    amplitude * u * (Math.sin(phase * Math.PI * 2 - u * 5.2) * 0.8 + Math.sin(phase * Math.PI * 4.3 - u * 9) * 0.25);
  const sag = (u: number) => (1 - tension) * u * u * height * 0.35;
  const edge = (v: number) => {
    const pts: string[] = [];
    for (let c = 0; c <= cols; c++) {
      const u = c / cols;
      pts.push(`${(u * width * (1 - 0.08 * Math.abs(wave(u)) / Math.max(1, amplitude))).toFixed(2)} ${(top + v * height + wave(u) + sag(u)).toFixed(2)}`);
    }
    return pts;
  };
  const bands = [0, 1 / 3, 2 / 3, 1].map(edge);
  const band = (a: string[], b: string[]) => `M ${a.join(" L ")} L ${[...b].reverse().join(" L ")} Z`;
  const colors =
    stripeMode === "argentina"
      ? [PALETTE.skyBlue, PALETTE.paperWarm, PALETTE.skyBlue]
      : [PALETTE.grayBlue, PALETTE.grayBluePale, PALETTE.grayBlue];
  const lw = 1 / pxPerUnit;
  return (
    <g>
      <path d={`M 0 0 V ${top - 2}`} stroke={PALETTE.deepBlue} strokeWidth={1.6 * lw} />
      {colors.map((c, i) => (
        <path key={i} d={band(bands[i], bands[i + 1])} fill={c} stroke="none" />
      ))}
      <path d={`M ${bands[0].join(" L ")} L ${[...bands[3]].reverse().join(" L ")} Z`} fill="none" stroke={PALETTE.deepBlue} strokeWidth={0.9 * lw} strokeLinejoin="round" />
    </g>
  );
};
