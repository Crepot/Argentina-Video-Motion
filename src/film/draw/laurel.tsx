import React from "react";
import { clamp01 } from "../../animation/interpolate-clamped";
import { mixColor, PALETTE } from "../../theme/palette";

/**
 * LaurelAnimation (storyboard §B, motif lock §5): two branches on an open
 * ellipse. Leaves are procedural instances; each branch reports how many
 * leaves are drawn and how many have earned gold. 1986: left branch only;
 * 2014: right branch begins pale blue and stops; 2021: several gold leaves;
 * 2022: complete. Screen-space, matte, no glow.
 */
export const LEAVES = 11;

export interface BranchState {
  /** Leaves drawn (0…LEAVES, fractional = growing leaf). */
  drawn: number;
  /** Leaves in gold, counted from the base. */
  gold: number;
  /** Colour of drawn but not golden leaves. */
  base?: string;
  /** Faint construction guide for undrawn leaves (0..1). */
  guide?: number;
}

const leafPath = (L: number, W: number) => `M 0 0 C ${W} ${-L * 0.3}, ${W * 0.9} ${-L * 0.8}, 0 ${-L} C ${-W * 0.9} ${-L * 0.8}, ${-W} ${-L * 0.3}, 0 0 Z`;

const Branch: React.FC<{ side: -1 | 1; rx: number; ry: number; st: BranchState }> = ({ side, rx, ry, st }) => {
  const nodes: React.ReactNode[] = [];
  const stem: string[] = [];
  const t0 = Math.PI / 2 + 0.18;
  const t1 = Math.PI * 1.5 - 0.62;
  for (let i = 0; i < LEAVES; i++) {
    const u = i / (LEAVES - 1);
    const a = t0 + (t1 - t0) * u;
    const x = side * -Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    stem.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    const grow = clamp01(st.drawn - i);
    const tang = Math.atan2(Math.cos(a) * ry, side * Math.sin(a) * rx);
    const rot = (tang * 180) / Math.PI;
    const size = 46 * (1 - u * 0.35);
    const isGold = i < st.gold;
    const col = isGold ? PALETTE.goldMuted : st.base ?? PALETTE.skyBluePale;
    for (const o of [-1, 1]) {
      const ang = rot + o * 38 * side;
      if (grow > 0.001) {
        nodes.push(
          <path
            key={`${i}.${o}`}
            d={leafPath(size * grow, size * 0.34 * grow)}
            transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`}
            fill={isGold ? mixColor(PALETTE.goldLight, PALETTE.paperWarm, 0.2) : mixColor(col, PALETTE.paperWarm, 0.45)}
            stroke={isGold ? PALETTE.goldMuted : col}
            strokeWidth={1.4}
          />,
        );
      } else if ((st.guide ?? 0) > 0.002) {
        nodes.push(
          <path key={`g${i}.${o}`} d={leafPath(size, size * 0.34)} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`} fill="none" stroke={PALETTE.grayBlue} strokeWidth={1} strokeDasharray="3 4" opacity={st.guide} />,
        );
      }
    }
  }
  const stemN = Math.max(1, Math.min(LEAVES, Math.ceil(st.drawn)));
  return (
    <g>
      {st.drawn > 0.01 ? <path d={`M ${stem.slice(0, stemN).join(" L ")}`} fill="none" stroke={st.gold >= 1 ? PALETTE.goldMuted : st.base ?? PALETTE.skyBluePale} strokeWidth={2} /> : null}
      {nodes}
    </g>
  );
};

export const Laurel: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity: number;
  left: BranchState;
  right: BranchState;
}> = ({ cx, cy, rx, ry, opacity, left, right }) =>
  opacity > 0.002 ? (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} data-id="laurel">
      <g transform={`translate(${cx} ${cy})`} opacity={opacity}>
        <Branch side={-1} rx={rx} ry={ry} st={left} />
        <Branch side={1} rx={rx} ry={ry} st={right} />
      </g>
    </svg>
  ) : null;
