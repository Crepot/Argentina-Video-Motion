import React from "react";
import { clamp01 } from "../../animation/interpolate-clamped";
import { createPrng } from "../../animation/stroke-draw";
import { insideMalvinas, MALVINAS_BOUNDS, MALVINAS_PATHS } from "../../atlas/geometry/malvinas-entry";
import { geo } from "../../atlas/south-atlantic-geometry";
import { mixColor, PALETTE } from "../../theme/palette";
import { TRACKS_V2 } from "../../timeline/benchmark-v2-timeline";
import type { Point } from "../../types/paths";
import type { StageContext, StageItem } from "./stage-items";

/**
 * Scene 12 entry (1982) in V2: national scale → regional scale → insular
 * scale. The islands keep the disputed-territory treatment (hatch + dashed
 * edge + explicit legend, never the mainland's continuous line); as the
 * camera descends their contour lines lift into relief, tussock and rock
 * rise from the hatching, wind crosses them and soldiers appear.
 */
const T = TRACKS_V2;
const f1 = (n: number) => n.toFixed(1);

/** Authored relief (approximate positions; pending cartographic review). */
const HILLS: readonly { c: Point; r: number; h: number; seed: number }[] = [
  { c: geo(58.87, 51.7), r: 46, h: 58, seed: 1 },
  { c: geo(59.2, 51.66), r: 38, h: 40, seed: 2 },
  { c: geo(58.5, 51.64), r: 34, h: 34, seed: 3 },
  { c: geo(58.05, 51.67), r: 22, h: 22, seed: 4 },
  { c: geo(60.07, 51.57), r: 40, h: 50, seed: 5 },
  { c: geo(60.0, 51.9), r: 34, h: 36, seed: 6 },
  { c: geo(60.55, 51.72), r: 30, h: 30, seed: 7 },
];

const contour = (c: Point, r: number, seed: number, k: number, lift: number) => {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const wob = 1 + 0.16 * Math.sin(a * 3 + seed) + 0.09 * Math.sin(a * 5 + seed * 2.3);
    pts.push([c[0] + Math.cos(a) * r * wob, c[1] + Math.sin(a) * r * wob * 0.7, lift]);
  }
  return { pts, k };
};

/** Tussock/grass tufts scattered on the islands (seeded). */
const TUFTS: readonly Point[] = (() => {
  const r = createPrng(1982);
  const out: Point[] = [];
  const { minX, maxX, minY, maxY } = MALVINAS_BOUNDS;
  for (let i = 0; out.length < 170 && i < 4000; i++) {
    const q: Point = [minX + r() * (maxX - minX), minY + r() * (maxY - minY)];
    if (insideMalvinas(q)) {
      out.push(q);
    }
  }
  return out;
})();

/** Ground (world layer): islands land tone, hatch, dashed disputed edge. */
export const IslandsGround: React.FC<{ f: number; px: (n: number) => number }> = ({ f, px }) => {
  const hatch = T.ocean.islandsHatch(f);
  const outline = T.ocean.islandsOutline(f);
  if (hatch <= 0.002 && outline <= 0.002) {
    return null;
  }
  const { minX, maxX, minY, maxY } = MALVINAS_BOUNDS;
  let d = "";
  for (let x = minX - (maxY - minY); x < maxX; x += 5.5) {
    d += `M ${f1(x)} ${f1(maxY)} L ${f1(x + (maxY - minY))} ${f1(minY)} `;
  }
  return (
    <g data-id="islands.malvinas" data-status="disputed">
      <defs>
        <clipPath id="v2-malvinas-clip">
          {MALVINAS_PATHS.map((q) => (
            <path key={q.id} d={q.d} />
          ))}
        </clipPath>
      </defs>
      {MALVINAS_PATHS.map((q) => (
        <path key={`land.${q.id}`} d={q.d} fill={mixColor(PALETTE.paperWarm, PALETTE.grayBluePale, 0.55)} opacity={hatch} />
      ))}
      <path d={d} clipPath="url(#v2-malvinas-clip)" fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={px(0.8)} opacity={hatch * 0.55} />
      {MALVINAS_PATHS.map((q) => (
        <g key={q.id}>
          <path d={q.d} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={px(1.3)} opacity={outline * 0.5} />
          <path d={q.d} fill="none" stroke={PALETTE.deepBlue} strokeWidth={px(1.5)} strokeDasharray={`${px(7)} ${px(4)}`} opacity={outline} transform="translate(0 0)" />
        </g>
      ))}
    </g>
  );
};

/** Wind streaks crossing sea and land, west → east (deterministic phase). */
export const WindStreaks: React.FC<{ f: number; px: (n: number) => number }> = ({ f, px }) => {
  const o = T.ocean.wind(f);
  if (o <= 0.002) {
    return null;
  }
  const r = createPrng(2085);
  let d = "";
  for (let i = 0; i < 46; i++) {
    const y = 2560 + r() * 520;
    const len = 60 + r() * 120;
    const speed = 6 + r() * 5;
    const x0 = 5300 + ((r() * 1100 + (f - 2085) * speed) % 1100);
    d += `M ${f1(x0)} ${f1(y)} q ${f1(len / 2)} ${f1(-6)} ${f1(len)} 0 `;
  }
  return <path d={d} fill="none" stroke={PALETTE.skyBlue} strokeWidth={px(1.2)} strokeLinecap="round" opacity={o} />;
};

export const atlanticItems = (ctx: StageContext): StageItem[] => {
  const { f } = ctx;
  const items: StageItem[] = [];
  if (f < 2130) {
    return items;
  }
  const p = ctx.proj(1);
  const relief = T.ocean.relief(f);

  /* relief: contour lines lift into stacked terrain */
  if (relief > 0.002) {
    for (const hill of HILLS) {
      const K = 5;
      const rings: React.ReactNode[] = [];
      for (let k = 0; k < K; k++) {
        const lift = (hill.h * k * relief) / K;
        const ring = contour(hill.c, hill.r * (1 - k / (K + 0.6)), hill.seed, k, lift);
        const d = `M ${ring.pts.map((q) => { const s = p.point(q[0], q[1], q[2]); return `${f1(s[0])} ${f1(s[1])}`; }).join(" L ")} Z`;
        rings.push(
          <path
            key={k}
            d={d}
            fill={mixColor(PALETTE.paperWarm, PALETTE.grayBlue, 0.18 + k * 0.07)}
            fillOpacity={relief * 0.9}
            stroke={PALETTE.deepBlueSoft}
            strokeWidth={0.9}
            strokeOpacity={0.35 + 0.4 * relief}
          />,
        );
      }
      items.push({ key: `hill.${hill.seed}`, y: hill.c[1], depth: 1, node: <g>{rings}</g> });
    }
    /* tussock tufts rising from the hatch */
    let tuft = "";
    for (const q of TUFTS) {
      const s0 = p.point(q[0], q[1], 0);
      const s1 = p.point(q[0], q[1], 7 * relief);
      tuft += `M ${f1(s0[0] - 2)} ${f1(s0[1])} L ${f1(s1[0] - 3)} ${f1(s1[1])} M ${f1(s0[0])} ${f1(s0[1])} L ${f1(s1[0])} ${f1(s1[1] - 2)} M ${f1(s0[0] + 2)} ${f1(s0[1])} L ${f1(s1[0] + 3)} ${f1(s1[1])} `;
    }
    items.push({ key: "tussock", y: 2700, depth: 1, node: <path d={tuft} stroke={PALETTE.deepBlueSoft} strokeWidth={0.9} opacity={0.55 * relief} /> });
  }

  /* foreground ridge (depth plane): terrain under the soldiers' feet */
  const ridgeO = T.ocean.ridge(f);
  if (ridgeO > 0.002) {
    const fp = ctx.proj(1.9);
    const rr = createPrng(1833);
    const x0 = 5600;
    const x1 = 6200;
    const yEdge = 2958;
    const top: string[] = [];
    for (let i = 0; i <= 30; i++) {
      const x = x0 + ((x1 - x0) * i) / 30;
      const s = fp.point(x, yEdge + Math.sin(i * 1.3) * 6, 0);
      top.push(`${f1(s[0])} ${f1(s[1])}`);
    }
    const bl = fp.point(x1, 3300, 0);
    const br = fp.point(x0, 3300, 0);
    let grass = "";
    for (let i = 0; i < 120; i++) {
      const x = x0 + rr() * (x1 - x0);
      const y = yEdge + 8 + rr() * 200;
      const h = (6 + rr() * 9) * ridgeO;
      const lean = 2 + rr() * 3;
      const a = fp.point(x, y, 0);
      const b = fp.point(x + lean, y, h);
      const c = fp.point(x + lean * 1.6, y, h * 0.8);
      grass += `M ${f1(a[0])} ${f1(a[1])} L ${f1(b[0])} ${f1(b[1])} M ${f1(a[0] + 3)} ${f1(a[1])} L ${f1(c[0] + 3)} ${f1(c[1])} `;
    }
    items.push({
      key: "fg.ridge",
      y: yEdge,
      depth: 1.9,
      node: (
        <g opacity={ridgeO}>
          <path d={`M ${top.join(" L ")} L ${f1(bl[0])} ${f1(bl[1])} L ${f1(br[0])} ${f1(br[1])} Z`} fill={mixColor(PALETTE.paperWarm, PALETTE.grayBluePale, 0.7)} stroke={PALETTE.deepBlueSoft} strokeWidth={1.2} />
          <path d={grass} stroke={PALETTE.deepBlueSoft} strokeWidth={1.3} strokeLinecap="round" opacity={0.75} />
        </g>
      ),
    });
  }
  return items;
};

export const reliefProgress = (f: number) => clamp01(T.ocean.relief(f));
