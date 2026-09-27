import React from "react";
import { mixColor, PALETTE } from "../theme/palette";
import type { Point } from "../types/paths";

/**
 * HorseRig (spec §9.14): a stylized horse/mule in rig local units (facing +x,
 * ground y = 0, a 100-unit rider scale; withers ≈ 60). Four-beat walk from a
 * phase that always comes from distance travelled: hooves never slide.
 * Flat vector masses and deep-blue line art, like ActorRig2D.
 */
export const SADDLE: Point = [-2, -70];

const TAU = Math.PI * 2;
const f2 = (n: number) => n.toFixed(2);

const leg = (hip: Point, a1: number, a2: number, l1: number, l2: number, w0: number, w1: number) => {
  const r = Math.PI / 180;
  const knee: Point = [hip[0] + Math.sin(a1 * r) * l1, hip[1] + Math.cos(a1 * r) * l1];
  const hoof: Point = [knee[0] + Math.sin(a2 * r) * l2, knee[1] + Math.cos(a2 * r) * l2];
  const n1: Point = [Math.cos(a1 * r), -Math.sin(a1 * r)];
  const n2: Point = [Math.cos(a2 * r), -Math.sin(a2 * r)];
  const d = `M ${f2(hip[0] - n1[0] * w0)} ${f2(hip[1] - n1[1] * w0)} L ${f2(knee[0] - n2[0] * w1)} ${f2(knee[1] - n2[1] * w1)} L ${f2(hoof[0] - n2[0] * w1 * 0.8)} ${f2(hoof[1])} L ${f2(hoof[0] + n2[0] * w1 * 0.9 + 1.4)} ${f2(hoof[1])} L ${f2(knee[0] + n2[0] * w1)} ${f2(knee[1] + n2[1] * w1)} L ${f2(hip[0] + n1[0] * w0)} ${f2(hip[1] + n1[1] * w0)} Z`;
  return { d, hoof };
};

export interface HorseProps {
  /** Gait phase (cycles). */
  phase: number;
  /** 0 = standing, 1 = full walk amplitude. */
  gait: number;
  coat: "light" | "dark" | "gray";
  kind: "horse" | "mule";
  pxPerUnit: number;
  tone?: number;
  detail: "hero" | "mid" | "map";
  /** Uphill pitch in degrees (+ = nose up). */
  pitch?: number;
}

export const HorseRig: React.FC<HorseProps> = ({ phase, gait, coat, kind, pxPerUnit, tone = 0, detail, pitch = 0 }) => {
  const paper = PALETTE.paperCool;
  const T = (c: string) => (tone > 0 ? mixColor(c, paper, tone * 0.72) : c);
  const base =
    coat === "light"
      ? mixColor(PALETTE.paperWarm, PALETTE.grayBlue, 0.28)
      : coat === "gray"
        ? mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.25)
        : mixColor(PALETTE.deepBlueSoft, PALETTE.deepBlue, 0.35);
  const fill = T(base);
  const far = T(mixColor(base, PALETTE.deepBlue, 0.22));
  const line = T(PALETTE.deepBlue);
  const lw = detail === "map" ? 0 : (detail === "hero" ? 1.3 : 1) / pxPerUnit;
  const common = { stroke: detail === "map" ? "none" : line, strokeWidth: lw, strokeLinejoin: "round" as const };
  const a = phase * TAU;
  const bob = 1.2 * gait * Math.abs(Math.sin(a * 2));
  const swing = (off: number) => {
    const s = Math.sin(a + off);
    const c = Math.cos(a + off);
    return { a1: 18 * gait * s, a2: 18 * gait * s - 26 * gait * Math.max(0, c) };
  };
  // Lateral-sequence walk: LH, LF, RH, RF a quarter cycle apart.
  const lh = swing(0);
  const lf = swing(Math.PI / 2);
  const rh = swing(Math.PI);
  const rf = swing((3 * Math.PI) / 2);
  const Y = -bob;
  const legs = (h: typeof lh, f: typeof lf, color: string, dx: number) => (
    <>
      <path d={leg([-22 + dx, -58 + Y], h.a1 - 4, h.a2 + 6, 26, 32, 6.5, 3.2).d} fill={color} {...common} />
      <path d={leg([20 + dx, -56 + Y], f.a1, f.a2, 26, 30, 5.4, 3.0).d} fill={color} {...common} />
    </>
  );
  const mule = kind === "mule";
  const earL = mule ? 12 : 7;
  const neck = `M 16 ${-72 + Y} C 24 ${-84 + Y}, 30 ${-96 + Y}, 36 ${-104 + Y} L 44 ${-100 + Y} C 40 ${-88 + Y}, 36 ${-76 + Y}, 32 ${-64 + Y} Z`;
  const head = `M 34 ${-104 + Y} C 38 ${-110 + Y}, 44 ${-108 + Y}, 48 ${-102 + Y} L 60 ${-86 + Y} C 61 ${-82 + Y}, 57 ${-80 + Y}, 54 ${-82 + Y} L 42 ${-90 + Y} Z`;
  const ear = `M 38 ${-106 + Y} L ${40 - earL * 0.2} ${-106 - earL + Y} L 43 ${-105 + Y} Z`;
  const body = `M -30 ${-70 + Y} C -32 ${-56 + Y}, -24 ${-50 + Y}, -10 ${-50 + Y} L 16 ${-50 + Y} C 28 ${-50 + Y}, 34 ${-60 + Y}, 32 ${-70 + Y} C 28 ${-78 + Y}, 18 ${-76 + Y}, 8 ${-74 + Y} L -12 ${-74 + Y} C -22 ${-76 + Y}, -29 ${-76 + Y}, -30 ${-70 + Y} Z`;
  const tailSwing = Math.sin(a * 2 + 1) * 3 * gait;
  const tail = `M -30 ${-72 + Y} C ${-38 + tailSwing} ${-66 + Y}, ${-40 + tailSwing} ${-52 + Y}, ${-36 + tailSwing * 1.4} ${-40 + Y} C ${-34 + tailSwing} ${-50 + Y}, -32 ${-60 + Y}, -28 ${-66 + Y} Z`;
  const mane = mule ? null : `M 18 ${-74 + Y} C 24 ${-88 + Y}, 28 ${-98 + Y}, 36 ${-106 + Y} L 33 ${-98 + Y} C 28 ${-90 + Y}, 22 ${-82 + Y}, 14 ${-72 + Y} Z`;
  return (
    <g transform={pitch ? `rotate(${-pitch} 0 ${-40})` : undefined}>
      {legs(rh, rf, far, 2)}
      <path d={tail} fill={T(mixColor(base, PALETTE.deepBlue, 0.45))} {...common} />
      <path d={body} fill={fill} {...common} />
      <path d={neck} fill={fill} {...common} />
      {mane ? <path d={mane} fill={T(mixColor(base, PALETTE.deepBlue, 0.5))} stroke="none" /> : null}
      <path d={head} fill={fill} {...common} />
      <path d={ear} fill={fill} {...common} />
      {detail !== "map" ? (
        <path
          d={`M 50 ${-94 + Y} L 42 ${-90 + Y} L 8 ${-78 + Y} M -12 ${-74 + Y} C -10 ${-66 + Y}, 4 ${-66 + Y}, 6 ${-74 + Y}`}
          fill="none"
          stroke={line}
          strokeWidth={lw * 0.9}
          opacity={0.8}
        />
      ) : null}
      {legs(lh, lf, fill, 0)}
    </g>
  );
};
