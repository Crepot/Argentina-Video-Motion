import React from "react";
import { clamp01 } from "../../animation/interpolate-clamped";
import { PALETTE } from "../../theme/palette";
import type { Point } from "../../types/paths";

const f1 = (n: number) => n.toFixed(1);

/**
 * Sun of May (storyboard §A): a reduced geometric symbol — alternating
 * straight and flame rays around a plain disk. Matte gold, never glowing.
 */
export const SunOfMay: React.FC<{ c: Point; r: number; rays: number; o: number; color?: string; strokeW?: number; disk?: number }> = ({
  c,
  r,
  rays,
  o,
  color = PALETTE.goldMuted,
  strokeW = 1.4,
  disk = 1,
}) => {
  if (o <= 0.002) {
    return null;
  }
  const n = 32;
  let straight = "";
  let flame = "";
  for (let i = 0; i < n; i++) {
    const t = clamp01(rays * n - i * 0.35);
    if (t <= 0) {
      continue;
    }
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r0 = r * 0.62;
    const r1 = r0 + (r - r0) * t * (i % 2 === 0 ? 1 : 0.86);
    const x0 = c[0] + Math.cos(a) * r0;
    const y0 = c[1] + Math.sin(a) * r0;
    const x1 = c[0] + Math.cos(a) * r1;
    const y1 = c[1] + Math.sin(a) * r1;
    if (i % 2 === 0) {
      straight += `M ${f1(x0)} ${f1(y0)} L ${f1(x1)} ${f1(y1)} `;
    } else {
      const nx = -Math.sin(a) * r * 0.05;
      const ny = Math.cos(a) * r * 0.05;
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      flame += `M ${f1(x0)} ${f1(y0)} Q ${f1(mx + nx)} ${f1(my + ny)} ${f1((mx + x1) / 2)} ${f1((my + y1) / 2)} T ${f1(x1)} ${f1(y1)} `;
    }
  }
  return (
    <g opacity={o}>
      <circle cx={c[0]} cy={c[1]} r={r * 0.5} fill="none" stroke={color} strokeWidth={strokeW} opacity={disk} />
      <circle cx={c[0]} cy={c[1]} r={r * 0.44} fill={color} opacity={0.14 * disk} />
      <path d={straight} stroke={color} strokeWidth={strokeW} fill="none" strokeLinecap="round" />
      <path d={flame} stroke={color} strokeWidth={strokeW * 0.9} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** Chain of oval links along a polyline; `gap` opens a break at `breakAt` (0..1). */
export const ChainLinks: React.FC<{ pts: readonly Point[]; o: number; breakAt: number; gap: number; size: number; color?: string }> = ({
  pts,
  o,
  breakAt,
  gap,
  size,
  color = PALETTE.grayBlue,
}) => {
  if (o <= 0.002) {
    return null;
  }
  let d = "";
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const t = i / (n - 1);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const push = t < breakAt ? -gap : gap;
    const cx = (a[0] + b[0]) / 2 + (dx / l) * push;
    const cy = (a[1] + b[1]) / 2 + (dy / l) * push;
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    const rx = size;
    const ry = size * (i % 2 === 0 ? 0.45 : 0.3);
    const ca = Math.cos((ang * Math.PI) / 180);
    const sa = Math.sin((ang * Math.PI) / 180);
    const p1: Point = [cx - ca * rx, cy - sa * rx];
    d += `M ${f1(p1[0])} ${f1(p1[1])} A ${f1(rx)} ${f1(ry)} ${f1(ang)} 1 1 ${f1(cx + ca * rx)} ${f1(cy + sa * rx)} A ${f1(rx)} ${f1(ry)} ${f1(ang)} 1 1 ${f1(p1[0])} ${f1(p1[1])} `;
  }
  return <path d={d} fill="none" stroke={color} strokeWidth={2} opacity={o} />;
};
