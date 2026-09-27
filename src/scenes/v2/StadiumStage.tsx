import React from "react";
import { clamp01, lerp, progress } from "../../animation/interpolate-clamped";
import { ellipsePoint, PITCH } from "../../atlas/geometry/stadium";
import {
  PAPELITOS,
  ringAt,
  ringPoint,
  RIM_WALL,
  SPECTATORS,
  STAND_FLAGS,
  tierHeightAt,
  TIERS,
} from "../../atlas/geometry/stadium-v2";
import { BALL_KEYS } from "../../choreography/benchmark-v2-choreography";
import { mixColor, PALETTE } from "../../theme/palette";
import { FlagCloth } from "../../stage/FlagCloth";
import { billboardMatrix, planeMatrix, type Projector } from "../../stage/projection";
import { TRACKS } from "../../timeline/benchmark-timeline";
import { TRACKS_V2 } from "../../timeline/benchmark-v2-timeline";
import type { Point } from "../../types/paths";
import type { StageContext, StageItem } from "./stage-items";

/**
 * Scene 11 (1978) in V2: an illustrated stadium that grows out of the city
 * plan, fills with people and returns to cartography. The bowl's rings are
 * the city kerbs bent closed; lifted by height they become stands; flattened
 * again they become South Atlantic isobars and the crowd becomes wind.
 */
const T = TRACKS_V2;
const SECTORS = 48;
const f1 = (n: number) => n.toFixed(1);

const SHIRTS = [PALETTE.skyBlue, PALETTE.paperWarm, mixColor(PALETTE.grayBlue, PALETTE.skyBluePale, 0.4), mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.3)];

export interface BowlState {
  morph: number;
  isobar: number;
  build: number;
  opacity: number;
  fill: number;
  excite: number;
  wind: number;
}

export const bowlState = (f: number): BowlState => ({
  morph: T.bowl.ringMorph(f),
  isobar: TRACKS.memory.m3(f),
  build: T.bowl.build(f) * (1 - T.bowl.unbuild(f)),
  opacity: T.bowl.opacity(f),
  fill: T.crowd.fill(f),
  excite: T.crowd.excite(f),
  wind: T.crowd.wind(f),
});

const heightOf = (i: number, b: BowlState, t: number) => tierHeightAt(i, t) * b.build;

/** Ground-plane outlines of the rings (visible as plan while heights are low). */
export const BowlRingsGround: React.FC<{ f: number; px: (n: number) => number }> = ({ f, px }) => {
  const b = bowlState(f);
  if (f < 1890 || b.opacity <= 0.002) {
    return null;
  }
  const lines: string[] = [];
  for (let i = 0; i <= TIERS; i += i === 0 ? 2 : 2) {
    const pts: Point[] = [];
    for (let k = 0; k <= 96; k++) {
      pts.push(ringPoint(i, (k / 96) * 360, b.morph, b.isobar));
    }
    lines.push(`M ${pts.map((q) => `${f1(q[0])} ${f1(q[1])}`).join(" L ")}`);
  }
  const ringColor = mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.3 + 0.3 * b.isobar);
  return (
    <path
      data-id="stadium.rings"
      d={lines.join(" ")}
      fill="none"
      stroke={ringColor}
      strokeWidth={px(1.3)}
      opacity={b.opacity * (1 - 0.6 * b.build)}
    />
  );
};

/* -------------------------------------------------------------- bowl items */

const sectorItems = (ctx: StageContext, b: BowlState): StageItem[] => {
  const { f } = ctx;
  const p = ctx.proj(1);
  const out: StageItem[] = [];
  if (b.build <= 0.003 && b.fill <= 0.003 && b.wind <= 0.003) {
    return out;
  }
  const rake = mixColor(PALETTE.paperWarm, PALETTE.grayBlue, 0.42);
  const wall = mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.28);
  const tierLine = mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.3);
  const heads = PALETTE.deepBlue;
  const P = (i: number, t: number, h: number) => {
    const g = ringPoint(i, t, b.morph, b.isobar);
    return p.point(g[0], g[1], h);
  };
  const eh = p.eh;
  const ex = p.ex;
  const z = p.zoom;
  const bySector: Map<number, typeof SPECTATORS[number][]> = new Map();
  for (const s of SPECTATORS) {
    const k = Math.floor((((s.t % 360) + 360) % 360) / (360 / SECTORS));
    const arr = bySector.get(k) ?? [];
    arr.push(s);
    bySector.set(k, arr);
  }
  for (let s = 0; s < SECTORS; s++) {
    const t0 = (s * 360) / SECTORS;
    const t1 = ((s + 1) * 360) / SECTORS;
    const tm = (t0 + t1) / 2;
    const mid = ringPoint(0, tm, b.morph, b.isobar);
    const outer = ringPoint(TIERS, tm, b.morph, b.isobar);
    const sm = p.point(mid[0], mid[1], 0);
    const so = p.point(outer[0], outer[1], 0);
    const inView = [sm, so].some((q) => q[0] > -260 && q[0] < 2180 && q[1] > -420 && q[1] < 1400);
    if (!inView) {
      continue;
    }
    const near = Math.sin((tm * Math.PI) / 180) > 0.05;
    // Rake surface: inner ring at its height → outer ring at the top.
    const rakePts = [P(0, t0, heightOf(0, b, t0)), P(0, t1, heightOf(0, b, t1)), P(TIERS, t1, heightOf(TIERS, b, t1)), P(TIERS, t0, heightOf(TIERS, b, t0))];
    let rows = "";
    for (let i = 1; i < TIERS; i++) {
      const a = P(i, t0, heightOf(i, b, t0));
      const c = P(i, t1, heightOf(i, b, t1));
      rows += `M ${f1(a[0])} ${f1(a[1])} L ${f1(c[0])} ${f1(c[1])} `;
    }
    const hTop0 = heightOf(TIERS, b, t0);
    const hTop1 = heightOf(TIERS, b, t1);
    const rimA = P(TIERS, t0, hTop0);
    const rimB = P(TIERS, t1, hTop1);
    const rimC = P(TIERS, t1, hTop1 + RIM_WALL * b.build);
    const rimD = P(TIERS, t0, hTop0 + RIM_WALL * b.build);
    const baseA = P(TIERS, t0, 0);
    const baseB = P(TIERS, t1, 0);

    // Crowd glyphs (head + shoulders), arms when exultant, wind strokes later.
    const shirts = ["", "", "", ""];
    let headD = "";
    let armD = "";
    let windD = "";
    const people = bySector.get(s) ?? [];
    for (const sp of people) {
      const appear = clamp01((b.fill * (TIERS + 1.5) - sp.row - sp.lift * 0.8) / 1.2);
      if (appear <= 0.02 && b.wind <= 0.01) {
        continue;
      }
      const hRow = lerp(heightOf(sp.row, b, sp.t), heightOf(sp.row + 1, b, sp.t), 0.5);
      const g0 = ringPoint(sp.row, sp.t, b.morph, b.isobar);
      const g1 = ringPoint(sp.row + 1, sp.t, b.morph, b.isobar);
      const gx = (g0[0] + g1[0]) / 2;
      const gy = (g0[1] + g1[1]) / 2;
      const base = p.point(gx, gy, hRow);
      if (b.wind > 0.01) {
        const e = ringAt(sp.row + 0.5, b.isobar);
        const dt = 0.8 + 4.2 * b.wind;
        const a = ellipsePoint(e, sp.t - dt);
        const c = ellipsePoint(e, sp.t + dt);
        const pa = p.point(a[0], a[1], hRow);
        const pc = p.point(c[0], c[1], hRow);
        windD += `M ${f1(pa[0])} ${f1(pa[1])} L ${f1(pc[0])} ${f1(pc[1])} `;
      }
      const glyph = appear * (1 - b.wind);
      if (glyph <= 0.03) {
        continue;
      }
      const jump = b.excite > 0.4 ? (b.excite - 0.4) * 5 * Math.abs(Math.sin((f / 7 + sp.phase) * Math.PI)) : 0;
      const wave = b.excite <= 0.4 ? 2.2 * Math.max(0, Math.sin(((f - 1940) / 34 - sp.t / 120) * Math.PI * 2)) * b.excite * 3 : 0;
      const lift = (jump + wave) * glyph;
      const k = glyph;
      const cx = base[0] + eh[0] * (3.2 + lift);
      const cy = base[1] + eh[1] * (3.2 + lift);
      const rx = 3.3 * z * k;
      const ry = Math.max(0.6, 2.7 * z * p.rise * k);
      shirts[sp.shirt] += `M ${f1(cx - rx)} ${f1(cy)} a ${f1(rx)} ${f1(ry)} 0 1 0 ${f1(2 * rx)} 0 a ${f1(rx)} ${f1(ry)} 0 1 0 ${f1(-2 * rx)} 0 `;
      const hx = base[0] + eh[0] * (7.4 + lift) * k;
      const hy = base[1] + eh[1] * (7.4 + lift) * k;
      const hr = 2.1 * z * k;
      headD += `M ${f1(hx - hr)} ${f1(hy)} a ${f1(hr)} ${f1(hr)} 0 1 0 ${f1(2 * hr)} 0 a ${f1(hr)} ${f1(hr)} 0 1 0 ${f1(-2 * hr)} 0 `;
      const arms = clamp01((b.excite - 0.45) * 3) * (sp.lift > 0.25 ? 1 : 0);
      if (arms > 0.02) {
        for (const side of [-1, 1]) {
          const sx = cx + ex[0] * side * 2.4 * k + eh[0] * 1.4;
          const sy = cy + ex[1] * side * 2.4 * k + eh[1] * 1.4;
          const tx = sx + ex[0] * side * 1.8 * arms + eh[0] * 7 * arms;
          const ty = sy + ex[1] * side * 1.8 * arms + eh[1] * 7 * arms;
          armD += `M ${f1(sx)} ${f1(sy)} L ${f1(tx)} ${f1(ty)} `;
        }
      }
    }

    const sortY = near ? outer[1] + 1 : mid[1];
    out.push({
      key: `bowl.${s}`,
      y: sortY,
      depth: 1,
      node: (
        <g opacity={b.opacity}>
          {b.build > 0.01 ? (
            <>
              {near ? (
                <path d={`M ${f1(baseA[0])} ${f1(baseA[1])} L ${f1(baseB[0])} ${f1(baseB[1])} L ${f1(rimB[0])} ${f1(rimB[1])} L ${f1(rimA[0])} ${f1(rimA[1])} Z`} fill={wall} stroke={PALETTE.deepBlue} strokeWidth={0.8} strokeOpacity={0.5} />
              ) : null}
              <path d={`M ${rakePts.map((q) => `${f1(q[0])} ${f1(q[1])}`).join(" L ")} Z`} fill={rake} stroke={rake} strokeWidth={0.6} />
              <path d={rows} fill="none" stroke={tierLine} strokeWidth={0.8} opacity={0.55} />
              {!near ? (
                <path d={`M ${f1(rimA[0])} ${f1(rimA[1])} L ${f1(rimB[0])} ${f1(rimB[1])} L ${f1(rimC[0])} ${f1(rimC[1])} L ${f1(rimD[0])} ${f1(rimD[1])} Z`} fill={wall} stroke={PALETTE.deepBlue} strokeWidth={0.8} strokeOpacity={0.5} />
              ) : null}
            </>
          ) : null}
          {shirts.map((d, i) => (d ? <path key={i} d={d} fill={SHIRTS[i]} stroke={PALETTE.deepBlue} strokeWidth={0.45} strokeOpacity={0.6} /> : null))}
          {headD ? <path d={headD} fill={heads} opacity={0.88} /> : null}
          {armD ? <path d={armD} stroke={PALETTE.deepBlueSoft} strokeWidth={1.1} strokeLinecap="round" /> : null}
          {windD ? <path d={windD} stroke={PALETTE.skyBlue} strokeWidth={1.4} strokeLinecap="round" opacity={Math.min(1, T.crowd.windOpacity(f) * (0.35 + b.wind))} /> : null}
        </g>
      ),
    });
  }
  return out;
};

/* ------------------------------------------------------------- goals, ball */

const Goal: React.FC<{ p: Projector; x: number; side: 1 | -1; ripple: number }> = ({ p, x, side, ripple }) => {
  const cy = PITCH.center[1];
  const half = 30;
  const hgt = 22;
  const depth = 15 * side;
  const m = planeMatrix(p, [x, cy - half, 0], [0, 1, 0], [0, 0, -1]);
  const back = planeMatrix(p, [x + depth + ripple * 7 * side, cy - half, 0], [0, 1, 0], [0, 0, -1]);
  const topNet = planeMatrix(p, [x, cy - half, hgt], [0, 1, 0], [side, 0, 0]);
  let mesh = "";
  for (let k = 1; k < 8; k++) {
    mesh += `M ${(k * 2 * half) / 8} 0 V ${-hgt} `;
  }
  for (let k = 1; k < 4; k++) {
    mesh += `M 0 ${(-k * hgt) / 4} H ${2 * half} `;
  }
  const ns = { vectorEffect: "non-scaling-stroke" as const };
  return (
    <g>
      <g transform={back}>
        <path d={mesh} stroke={PALETTE.deepBlueSoft} strokeWidth={0.7} opacity={0.55} {...ns} />
        <path d={`M 0 0 V ${-hgt} H ${2 * half} V 0`} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={0.9} opacity={0.7} {...ns} />
      </g>
      <g transform={topNet}>
        <path d={`M 0 0 H ${2 * half} M 0 ${Math.abs(depth) / 2} H ${2 * half}`} stroke={PALETTE.deepBlueSoft} strokeWidth={0.6} opacity={0.5} {...ns} />
      </g>
      <g transform={m}>
        <path d={`M 0 0 V ${-hgt} H ${2 * half} V 0`} fill="none" stroke={PALETTE.paperWarm} strokeWidth={3.2} strokeLinejoin="miter" {...ns} />
        <path d={`M 0 0 V ${-hgt} H ${2 * half} V 0`} fill="none" stroke={PALETTE.deepBlue} strokeWidth={1} {...ns} />
      </g>
    </g>
  );
};

export const ballAt = (f: number) => {
  const k = BALL_KEYS;
  if (f <= k[0].f) {
    return k[0];
  }
  for (let i = 0; i < k.length - 1; i++) {
    const a = k[i];
    const b = k[i + 1];
    if (f < b.f) {
      const t = progress(f, a.f, b.f);
      const e = 1 - (1 - t) * (1 - t) * 0.35 - 0.65 * (1 - t) * 0;
      return {
        f,
        x: lerp(a.x, b.x, e),
        y: lerp(a.y, b.y, e),
        h: lerp(a.h, b.h, t) + (a.h === 0 && b.h === 0 ? 0 : Math.sin(t * Math.PI) * 4),
      };
    }
  }
  return k[k.length - 1];
};

export const stadiumItems = (ctx: StageContext): StageItem[] => {
  const { f } = ctx;
  if (f < 1888 || f > 2140) {
    return [];
  }
  const p = ctx.proj(1);
  const b = bowlState(f);
  const items = sectorItems(ctx, b);

  const gameO = clamp01(progress(f, 1912, 1924)) * (1 - clamp01(progress(f, 2050, 2080)));
  if (gameO > 0.002) {
    const net = T.net(f);
    items.push({ key: "goal.e", y: PITCH.center[1], depth: 1, node: <g opacity={gameO}><Goal p={p} x={PITCH.right} side={1} ripple={net} /></g> });
    items.push({ key: "goal.w", y: PITCH.center[1], depth: 1, node: <g opacity={gameO}><Goal p={p} x={PITCH.left} side={-1} ripple={0} /></g> });
  }
  if (f >= 1944 && f <= 2050) {
    const ball = ballAt(f);
    const g = p.point(ball.x, ball.y, 0);
    const c = p.point(ball.x, ball.y, ball.h + 3.2);
    const r = 3.4 * p.zoom;
    const o = clamp01(progress(f, 1944, 1950)) * (1 - clamp01(progress(f, 2040, 2050)));
    items.push({
      key: "ball",
      y: ball.y + 0.5,
      depth: 1,
      node: (
        <g opacity={o}>
          <ellipse cx={g[0]} cy={g[1]} rx={r * 1.1} ry={r * 0.45} fill={PALETTE.deepBlue} opacity={0.2} />
          <circle cx={c[0]} cy={c[1]} r={r} fill={PALETTE.paperWarm} stroke={PALETTE.deepBlue} strokeWidth={1.2} />
          <path d={`M ${f1(c[0] - r * 0.5)} ${f1(c[1] - r * 0.2)} l ${f1(r * 0.5)} ${f1(-r * 0.35)} l ${f1(r * 0.45)} ${f1(r * 0.3)} l ${f1(-r * 0.2)} ${f1(r * 0.5)} l ${f1(-r * 0.55)} 0 Z`} fill={PALETTE.deepBlue} />
        </g>
      ),
    });
  }

  /* flags in the stands */
  const flags = T.flags(f);
  if (flags > 0.002 && b.build > 0.05) {
    for (const [i, fl] of STAND_FLAGS.entries()) {
      const g0 = ringPoint(fl.row, fl.t, b.morph, b.isobar);
      const g1 = ringPoint(fl.row + 1, fl.t, b.morph, b.isobar);
      const x = (g0[0] + g1[0]) / 2;
      const y = (g0[1] + g1[1]) / 2;
      const h = heightOf(fl.row, b, fl.t) + 6;
      const scale = 0.72 * fl.size;
      const near = Math.sin((fl.t * Math.PI) / 180) > 0.05;
      items.push({
        key: `flag.${i}`,
        y: near ? y + 400 : y + 0.5,
        depth: 1,
        node: (
          <g transform={billboardMatrix(p, x, y, scale, 1, h)} opacity={flags * Math.min(1, b.build * 1.5)}>
            <g transform={`scale(1 ${Math.max(0.001, clamp01(flags)).toFixed(3)})`}>
              <FlagCloth phase={f / 26 + i * 0.37} amplitude={3.2 + 2.4 * b.excite} width={46} height={30} pole={70} tension={0.45} pxPerUnit={p.zoom * scale} />
            </g>
          </g>
        ),
      });
    }
  }

  /* papelitos */
  const pap = T.papelitos(f);
  if (pap > 0.002) {
    let d = "";
    for (const q of PAPELITOS) {
      const t = (f - q.start) / q.fall;
      if (t < 0 || t > 1.4) {
        continue;
      }
      const tt = Math.min(1, t);
      const e0 = ringPoint(TIERS, q.t, b.morph, b.isobar);
      const e1 = ringPoint(1, q.t, b.morph, b.isobar);
      const x = lerp(e0[0], e1[0], tt * q.drift) + Math.sin((t + q.spin) * 9) * 5;
      const y = lerp(e0[1], e1[1], tt * q.drift);
      const h = Math.max(0, (heightOf(TIERS, b, q.t) + 40) * (1 - tt * 1.05));
      const c = p.point(x, y, h);
      const a = (q.spin + t * 3) * Math.PI;
      const w = q.size * p.zoom * 0.55;
      const hh = w * (0.35 + 0.65 * Math.abs(Math.cos(a * 1.3)));
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const pts = [
        [-w, -hh],
        [w, -hh],
        [w, hh],
        [-w, hh],
      ].map(([u, v]) => `${f1(c[0] + u * ca - v * sa)} ${f1(c[1] + u * sa + v * ca)}`);
      d += `M ${pts.join(" L ")} Z `;
    }
    items.push({
      key: "papelitos",
      y: 2600,
      depth: 1,
      node: <path d={d} fill={PALETTE.paperWarm} stroke={PALETTE.deepBlueSoft} strokeWidth={0.5} strokeOpacity={0.7} opacity={pap} />,
    });
  }
  return items;
};

/** Gold goal-impact ring on the pitch (the only 1978 gold with the trophy). */
export const GoalImpactRing: React.FC<{ f: number; px: (n: number) => number }> = ({ f, px }) => {
  const o = T.trophy.ringOpacity(f);
  if (o <= 0.002) {
    return null;
  }
  const r = T.trophy.ringRadius(f);
  return (
    <circle cx={PITCH.right - 4} cy={2160} r={r} fill="none" stroke={PALETTE.goldMuted} strokeWidth={px(2.2)} opacity={o} />
  );
};
