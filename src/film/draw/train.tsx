import React from "react";
import { mixColor, PALETTE } from "../../theme/palette";
import type { Projector } from "../../stage/projection";
import { standMatrix } from "./stand";

/**
 * Train on a rail (VehicleOnRoute): locomotive + passenger cars as billboards
 * along a straight track (local units, person ≈ 80). Wheel rotation and rod
 * phase come from distance travelled; smoke puffs trail from the stack.
 */
const ns = { vectorEffect: "non-scaling-stroke" as const };
const f1 = (n: number) => n.toFixed(1);

const Wheel: React.FC<{ x: number; r: number; spin: number; line: string }> = ({ x, r, spin, line }) => (
  <g transform={`translate(${x} ${-r}) rotate(${spin.toFixed(1)})`}>
    <circle r={r} fill={mixColor(PALETTE.deepBlue, PALETTE.deepBlueSoft, 0.4)} stroke={line} strokeWidth={1} {...ns} />
    <path d={`M ${-r * 0.8} 0 H ${r * 0.8} M 0 ${-r * 0.8} V ${r * 0.8}`} stroke={PALETTE.grayBlue} strokeWidth={1} {...ns} />
  </g>
);

export const Train: React.FC<{
  p: Projector;
  x: number;
  y: number;
  dist: number;
  cars: number;
  facing?: 1 | -1;
  fold?: number;
  smoke?: number;
  passengers?: number;
  tone?: number;
}> = ({ p, x, y, dist, cars, facing = 1, fold = 0, smoke = 1, passengers = 1, tone = 0 }) => {
  const T = (c: string) => mixColor(c, PALETTE.paperCool, tone);
  const line = T(PALETTE.deepBlue);
  const body = T(mixColor(PALETTE.deepBlueSoft, PALETTE.deepBlue, 0.3));
  const carC = T(mixColor(PALETTE.grayBlue, PALETTE.paperWarm, 0.25));
  const spin = (dist / (2 * Math.PI * 16)) * 360;
  const rod = Math.sin((dist / (2 * Math.PI * 22)) * Math.PI * 2) * 8;
  const puffs = [0, 1, 2, 3, 4].map((i) => {
    const t = (dist / 160 + i * 0.2) % 1;
    return { x: 140 - t * 260, y: -150 - t * 90, r: 16 + t * 34, o: Math.sin(t * Math.PI) * smoke };
  });
  return (
    <g transform={standMatrix(p, x, y, 1, facing, fold)}>
      {puffs.map((q, i) => (
        <ellipse key={i} cx={q.x} cy={q.y} rx={q.r} ry={q.r * 0.7} fill={T(PALETTE.grayBluePale)} opacity={0.75 * q.o} />
      ))}
      {Array.from({ length: cars }, (_, i) => {
        const x0 = -210 - i * 172;
        let win = "";
        let heads = "";
        for (let k = 0; k < 6; k++) {
          const wx = x0 + 16 + k * 24;
          win += `M ${wx} -84 h 16 v 22 h -16 Z `;
          if (passengers > 0.02 && (k + i) % 2 === 0) {
            heads += `M ${wx + 8} -70 m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 `;
          }
        }
        return (
          <g key={i}>
            <path d={`M ${x0} -100 H ${x0 + 160} V -30 H ${x0} Z`} fill={carC} stroke={line} strokeWidth={1.1} {...ns} />
            <path d={`M ${x0 - 4} -100 C ${x0 + 40} -112, ${x0 + 120} -112, ${x0 + 164} -100`} fill={T(PALETTE.deepBlueSoft)} stroke={line} strokeWidth={1} {...ns} />
            <path d={win} fill={T(PALETTE.paperWarm)} stroke={line} strokeWidth={0.7} {...ns} />
            {heads ? <path d={heads} fill={T(PALETTE.deepBlueSoft)} opacity={passengers} /> : null}
            <path d={`M ${x0 + 160} -50 H ${x0 + 172}`} stroke={line} strokeWidth={2} {...ns} />
            <Wheel x={x0 + 30} r={14} spin={spin} line={line} />
            <Wheel x={x0 + 130} r={14} spin={spin} line={line} />
          </g>
        );
      })}
      {/* Locomotive */}
      <path d="M -40 -40 H 150 V -104 H -40 Z" fill={body} stroke={line} strokeWidth={1.2} {...ns} />
      <path d="M -40 -40 V -150 H 30 V -104" fill={T(mixColor(PALETTE.deepBlue, PALETTE.deepBlueSoft, 0.2))} stroke={line} strokeWidth={1.2} {...ns} />
      <path d="M -28 -138 h 22 v 22 h -22 Z" fill={T(PALETTE.paperWarm)} stroke={line} strokeWidth={0.8} {...ns} />
      <path d="M 118 -104 L 112 -150 H 140 L 134 -104 Z M 70 -104 C 70 -122, 96 -122, 96 -104" fill={body} stroke={line} strokeWidth={1.1} {...ns} />
      <path d="M 150 -40 L 176 -12 H 140 Z" fill={T(PALETTE.grayBlue)} stroke={line} strokeWidth={1} {...ns} />
      <path d={`M 20 ${-28 + rod * 0.2} L 90 ${-28 - rod * 0.2}`} stroke={T(PALETTE.grayBluePale)} strokeWidth={2.2} {...ns} />
      <Wheel x={20} r={22} spin={spin} line={line} />
      <Wheel x={70} r={22} spin={spin} line={line} />
      <Wheel x={120} r={16} spin={spin} line={line} />
      <path d={`M 150 -80 h 8`} stroke={T(PALETTE.skyBlue)} strokeWidth={5} {...ns} />
      <path d={`M ${f1(-40)} -104 H 150`} stroke={T(PALETTE.skyBlue)} strokeWidth={2} {...ns} />
    </g>
  );
};
