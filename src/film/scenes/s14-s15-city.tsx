import React from "react";
import { clamp01, lerp } from "../../animation/interpolate-clamped";
import type { ActorTrack, PosKey } from "../../actors/action-track";
import { positionAt } from "../../actors/action-track";
import { interpolatePoints } from "../../paths/interpolate-path";
import { billboardMatrix } from "../../stage/projection";
import { Lamppost, Vehicle, type VehicleKind } from "../../stage/Props";
import { mixColor, PALETTE } from "../../theme/palette";
import type { CameraState } from "../../types/camera";
import type { Point, VisibleRange } from "../../types/paths";
import { A, P, actor, actorItems } from "../actors";
import { hash01, K, ramp, win } from "../anim";
import { Building, type ElevationKind } from "../draw/architecture";
import { Ball } from "../draw/football";
import { crowdItems, seedCrowd } from "../draw/crowd";
import { At, DateText, MapLabel } from "../draw/labels";
import { SheetGround } from "../draw/sheet";
import type { CamKey } from "../film-camera";
import { lineState, stateParts } from "../line";
import { IDENTITY } from "../space";
import type { FilmCtx, FilmStage, LineEra, StageItem } from "../types";
import { MARADONA_STATE } from "./s13-maradona";

/**
 * Scenes 14–15 · 1990–2001 → 2001–2014 · frames 2445–2699.
 *
 * 14: the golden 1986 line compresses into a horizontal timeline laid along
 * the median of one accelerating street. Commuters, buses and cars, shops,
 * offices, a factory whose outline empties, a ledger line behind the
 * façades. No policy, currency sign, president or party. At 2001 the
 * systems overrun their guides: a bank's shutters come down in front of the
 * people who reach it, the ledger drops out of registration, the camera
 * jolts and the paper cracks. The gold thread survives beneath the paper.
 *
 * 15: one fissure becomes the vertical stem of the new century. The city
 * grid re-registers around it by overdraw (cracks stitched, not erased),
 * brief civic / science / culture / network actions, and a young `10`
 * climbs a winding sky-blue route toward the 2014 centre mark while the
 * buried thread is glimpsed through coordinate apertures.
 */
export const STREET_Y = 380;
export const FISSURE_X = 11800;
/** 2014: the timeline's top becomes the centre mark of the 2014 pitch. */
export const MARK_2014: Point = [FISSURE_X, -2600];
const FACADE = 250;
const N_WALK = 312;
const S_WALK = 452;
const X_START = 7400;

export const yearX = (yr: number) => FISSURE_X - (2001 - yr) * 210;
export const yearY = (yr: number) => STREET_Y - (yr - 2001) * ((STREET_Y - MARK_2014[1]) / 13);

const T = {
  street: K([
    [2432, 0, "atlasDrift"],
    [2456, 1],
  ]),
  crack: K([
    [2516, 0, "restrainedImpact"],
    [2526, 1],
  ]),
  cool: K([
    [2498, 0, "atlasDrift"],
    [2520, 1],
    [2560, 1, "atlasDrift"],
    [2620, 0.25],
  ]),
  shut: K([
    [2500, 0, "institutionalLock"],
    [2514, 1],
  ]),
  factory: K([
    [2478, 0, "atlasDrift"],
    [2494, 1],
  ]),
  streetOut: K([
    [2560, 0, "atlasDrift"],
    [2604, 1],
  ]),
  stitch: K([
    [2540, 0, "atlasDrift"],
    [2600, 1],
  ]),
  exit15: K([
    [2690, 0, "atlasDrift"],
    [2712, 1],
  ]),
};

/* ---------------------------------------------------------------- camera */

/** Lateral track (x) used both by the camera and to time what it discovers. */
const CAM_X: readonly (readonly [number, number])[] = [
  [2424, 9000],
  [2452, 9380],
  [2472, 9900],
  [2492, 10620],
  [2508, 11280],
  [2515, 11560],
  [2520, 11690],
];
/** Frame at which the camera centre passes world x (inverse of CAM_X). */
const fAt = (x: number) => {
  if (x <= CAM_X[0][1]) {
    return CAM_X[0][0];
  }
  for (let i = 0; i < CAM_X.length - 1; i++) {
    const [fa, xa] = CAM_X[i];
    const [fb, xb] = CAM_X[i + 1];
    if (x <= xb) {
      return lerp(fa, fb, (x - xa) / (xb - xa));
    }
  }
  return CAM_X[CAM_X.length - 1][0] + (x - CAM_X[CAM_X.length - 1][1]) / 20;
};

/* ------------------------------------------------------------ Messi route */

const ROUTE_CTRL: readonly Point[] = [
  [FISSURE_X, 400],
  [11990, 250],
  [12000, -30],
  [11720, -260],
  [11640, -560],
  [11860, -820],
  [12020, -1100],
  [11980, -1420],
  [11700, -1700],
  [11620, -2000],
  [11760, -2320],
  MARK_2014,
];
const ROUTE: readonly Point[] = lineState(ROUTE_CTRL);
const R0 = 2548;
const R1 = 2696;
const routeU = (f: number) => clamp01((f - R0) / (R1 - R0));
const routeAt = (u: number): Point => {
  const s = clamp01(u) * (ROUTE.length - 1);
  const i = Math.min(ROUTE.length - 2, Math.floor(s));
  return [lerp(ROUTE[i][0], ROUTE[i + 1][0], s - i), lerp(ROUTE[i][1], ROUTE[i + 1][1], s - i)];
};
const routeKeys = (from: number, to: number): PosKey[] => {
  const out: PosKey[] = [];
  for (let f = from; f <= to; f += 6) {
    const q = routeAt(routeU(f));
    out.push(P(f, q[0], q[1] + 4));
  }
  const q = routeAt(routeU(to));
  out.push(P(to, q[0], q[1] + 4));
  return out;
};

const MESSI_YOUNG: ActorTrack = actor("historical.messi.young", "messiYoung", 1.0, routeKeys(2544, 2628), [
  A(2544, "jog", { facing: 1 }),
  A(2560, "run", { facing: 1 }),
  A(2596, "dribble", { amount: 14 }),
], { from: 2544, to: 2628, enter: "rise", enterDur: 10, exit: "fade", exitDur: 8 }, { build: "slight", detail: "hero", role: "primary" });

export const MESSI_ADULT_15: ActorTrack = actor("historical.messi.climb", "messi2014", 1.2, routeKeys(2620, 2699), [
  A(2620, "dribble", { amount: 16 }),
  A(2662, "run"),
  A(2686, "dribble", { amount: 12 }),
], { from: 2620, to: 2699, enter: "fade", enterDur: 8, exit: "none" }, { build: "athlete", detail: "hero", role: "primary" });

export const KEYS_14_15: readonly CamKey[] = [
  ...CAM_X.slice(1, 6).map(([f, x]) => ({ f, x, y: f < 2460 ? 320 : 290, zoom: 1.42, tilt: 46, rot: 0 })),
  // 2001: sudden deceleration and a short downward jolt.
  { f: 2520, x: 11690, y: 330, zoom: 1.48, tilt: 48, rot: -1.4 },
  { f: 2527, x: 11760, y: 250, zoom: 1.42, tilt: 44, rot: -0.6 },
  { f: 2540, x: FISSURE_X, y: 120, zoom: 1.3, tilt: 36, rot: 0 },
  // 15: crane-like ascent following the `10`.
  ...[2560, 2584, 2606, 2628, 2650, 2672].map((f) => {
    const q = routeAt(routeU(f + 10));
    return { f, x: lerp(FISSURE_X, q[0], 0.7), y: q[1] - 40, zoom: f === 2628 ? 1.45 : 1.62, tilt: 36, rot: 0 };
  }),
  { f: 2694, x: MARK_2014[0] + 40, y: MARK_2014[1] + 30, zoom: 1.6, tilt: 42, rot: 0 },
];

/* ---------------------------------------------------------------- street */

const BUILDINGS: readonly { x: number; w: number; h: number; k: ElevationKind; v?: number }[] = [
  { x: 9280, w: 240, h: 210, k: "apartmentBlock" },
  { x: 9560, w: 200, h: 92, k: "shopRow" },
  { x: 9800, w: 220, h: 320, k: "officeTower" },
  { x: 10060, w: 320, h: 150, k: "factory" },
  { x: 10420, w: 240, h: 230, k: "apartmentBlock", v: 1 },
  { x: 10700, w: 200, h: 92, k: "shopRow", v: 1 },
  { x: 10940, w: 220, h: 360, k: "officeTower", v: 1 },
  { x: 11200, w: 330, h: 170, k: "bankHall" },
  { x: 11570, w: 200, h: 220, k: "apartmentBlock", v: 2 },
  { x: 11880, w: 240, h: 260, k: "officeTower", v: 2 },
  { x: 12160, w: 260, h: 180, k: "apartmentBlock" },
];
const BANK = BUILDINGS[7];
const BANK_DOOR: Point = [BANK.x + BANK.w / 2, N_WALK];

const LEDGER: readonly Point[] = Array.from({ length: 46 }, (_, i) => {
  const x = 9100 + i * 60;
  return [x, 150 - 34 * Math.sin(x / 230) - 26 * hash01(i + 7) + (x > 11500 ? (x - 11500) * 0.35 : 0)] as Point;
});

const FISSURE = `M ${FISSURE_X} 540 L ${FISSURE_X - 12} 440 L ${FISSURE_X + 14} 350 L ${FISSURE_X - 8} 250 L ${FISSURE_X + 6} 120 L ${FISSURE_X - 10} -60 L ${FISSURE_X + 8} -260 L ${FISSURE_X} -700`;
const CRACKS: readonly string[] = [
  `M ${FISSURE_X - 8} 250 L ${FISSURE_X - 90} 214 L ${FISSURE_X - 160} 232`,
  `M ${FISSURE_X + 14} 350 L ${FISSURE_X + 110} 320 L ${FISSURE_X + 180} 352 L ${FISSURE_X + 260} 330`,
  `M ${FISSURE_X - 12} 440 L ${FISSURE_X - 120} 470 L ${FISSURE_X - 200} 452`,
  `M ${FISSURE_X + 6} 120 L ${FISSURE_X + 90} 90 L ${FISSURE_X + 120} 30`,
  `M ${FISSURE_X - 10} -60 L ${FISSURE_X - 110} -90`,
];
/** Stitches (overdraw) along the cracks, 2001 → 2014. */
const STITCHES: readonly Point[] = [
  [FISSURE_X - 60, 225],
  [FISSURE_X - 125, 222],
  [FISSURE_X + 70, 330],
  [FISSURE_X + 150, 338],
  [FISSURE_X + 220, 340],
  [FISSURE_X - 70, 458],
  [FISSURE_X - 160, 462],
  [FISSURE_X + 60, 100],
  [FISSURE_X - 70, -78],
];

const CityGround: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const st = T.street(f) * (1 - T.streetOut(f) * 0.8);
  const cool = T.cool(f);
  const line = mixColor(mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.35), PALETTE.grayBlue, cool * 0.6);
  const flow = mixColor(PALETTE.skyBlue, PALETTE.grayBlue, cool * 0.7);
  const lead = CAM_X[0][1] + 1500 + (f - 2424) * 40;
  const crack = T.crack(f);
  const stitch = T.stitch(f);
  // Traffic flows: dashed sky-blue lanes whose phase runs with the frame.
  const phase = -(f * 14) % 60;
  let ticks = "";
  for (let yr = 1990; yr <= 2001; yr++) {
    const x = yearX(yr);
    ticks += `M ${x} ${STREET_Y - (yr % 5 === 0 ? 34 : 18)} V ${STREET_Y + (yr % 5 === 0 ? 34 : 18)} `;
  }
  let zebra = "";
  for (const x of [9700, 10560, 11100]) {
    for (let y = N_WALK + 18; y < S_WALK - 12; y += 20) {
      zebra += `M ${x} ${y} H ${x + 46} `;
    }
  }
  return (
    <SheetGround camera={camera} pl={IDENTITY} opacity={st}>
      <path d={`M 9000 ${FACADE - 20} H 12600 V ${S_WALK + 140} H 9000 Z`} fill={mixColor(PALETTE.paperWarm, PALETTE.grayBluePale, 0.16 + cool * 0.1)} opacity={0.55} />
      <path d={`M 9000 ${FACADE} H 12600 M 9000 ${N_WALK} H 12600 M 9000 ${S_WALK} H 12600 M 9000 ${S_WALK + 100} H 12600`} stroke={line} strokeWidth={1.3} vectorEffect="non-scaling-stroke" />
      <path d={zebra} stroke={line} strokeWidth={3} opacity={0.28} />
      <path d={`M 9000 ${STREET_Y - 36} H 12600 M 9000 ${STREET_Y + 36} H 12600`} stroke={flow} strokeWidth={2} strokeDasharray="26 34" strokeDashoffset={phase} vectorEffect="non-scaling-stroke" opacity={0.7 * (1 - crack * 0.6)} />
      {/* Year ticks: the stadium marks compressed into a timeline. */}
      <path d={ticks} stroke={PALETTE.deepBlueSoft} strokeWidth={1.8} vectorEffect="non-scaling-stroke" opacity={ramp(f, 2440, 2458)} />
      {/* Ledger line behind the façades; near 2001 it drops out of registration. */}
      <path
        d={`M ${LEDGER.filter((q) => q[0] < lead)
          .map((q) => `${q[0]} ${q[1]}`)
          .join(" L ")}`}
        fill="none"
        stroke={mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.4)}
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
        opacity={0.8}
      />
      {LEDGER.filter((q, i) => i % 3 === 0 && q[0] < lead).map((q) => (
        <rect key={q[0]} x={q[0] - 7} y={q[1] - 7} width={14} height={14} fill="none" stroke={PALETTE.grayBlue} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      ))}
      {/* Closed node: flows stop at a bar in front of the bank. */}
      <g opacity={T.shut(f)}>
        <path d={`M ${BANK_DOOR[0] - 70} ${N_WALK - 16} H ${BANK_DOOR[0] + 70}`} stroke={PALETTE.deepBlue} strokeWidth={4} />
        <circle cx={BANK_DOOR[0]} cy={N_WALK - 40} r={16} fill="none" stroke={PALETTE.deepBlue} strokeWidth={2} />
      </g>
      {/* 2001: the fissure opens across the street and north through the paper. */}
      {crack > 0.002 ? (
        <g opacity={1 - stitch * 0.55}>
          <path d={FISSURE} fill="none" stroke={mixColor(PALETTE.grayBluePale, PALETTE.paperWarm, 0.2)} strokeWidth={14} strokeLinejoin="bevel" pathLength={1} strokeDasharray={`${crack} 1`} />
          <path d={FISSURE} fill="none" stroke={PALETTE.deepBlue} strokeWidth={1.8} strokeLinejoin="bevel" pathLength={1} strokeDasharray={`${crack} 1`} vectorEffect="non-scaling-stroke" />
          {CRACKS.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={1.2} pathLength={1} strokeDasharray={`${clamp01(crack * 1.6 - i * 0.12)} 1`} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      ) : null}
      {stitch > 0.002
        ? STITCHES.map((q, i) => {
            const s = clamp01(stitch * 1.6 - i * 0.07);
            return s > 0 ? <path key={i} d={`M ${q[0] - 10} ${q[1] - 12} L ${q[0] + 10} ${q[1] + 12} M ${q[0] + 10} ${q[1] - 12} L ${q[0] - 10} ${q[1] + 12}`} stroke={PALETTE.skyBlue} strokeWidth={2.2} opacity={s} vectorEffect="non-scaling-stroke" /> : null;
          })
        : null}
    </SheetGround>
  );
};

/* ------------------------------------------------------------ street life */

const WARDROBES = ["commuter", "commuterWoman", "worker", "student", "workerWoman", "commuter", "commuterWoman"] as const;

const commuters: ActorTrack[] = Array.from({ length: 22 }, (_, i) => {
  const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
  const x = 9300 + i * 112 + hash01(i) * 40;
  const y = (dir > 0 ? N_WALK + 8 : S_WALK - 8) + (hash01(i + 40) - 0.5) * 18;
  const fc = fAt(x);
  const from = Math.round(fc - 26);
  const to = Math.round(fc + 30);
  const speed = 5 + hash01(i + 3) * 3;
  const run = hash01(i + 11) > 0.6;
  return actor(`c14.${i}`, WARDROBES[i % WARDROBES.length], 0.95, [P(from, x - dir * speed * 28, y), P(to, x + dir * speed * 28, y)], [A(from, run ? "jog" : "walk", { facing: dir })], {
    from,
    to,
    enter: "rise",
    enterDur: 6,
    exit: "fold",
    exitDur: 8,
  });
});

/** People who reach the closed node: they stop in front of the shutters. */
const queue: ActorTrack[] = Array.from({ length: 7 }, (_, i) => {
  const sx = BANK_DOOR[0] - 420 + i * 60 + (i % 2) * 520;
  const tx = BANK_DOOR[0] - 90 + i * 30;
  const ty = N_WALK + 26 + (i % 3) * 22;
  const dir: 1 | -1 = sx < tx ? 1 : -1;
  return actor(`q14.${i}`, WARDROBES[(i + 2) % WARDROBES.length], 0.95, [P(2488, sx, ty), P(2508, tx, ty, "atlasDrift")], [
    A(2488, "walk", { facing: dir }),
    A(2508, "stand", { facing: i % 2 ? -1 : 1 }),
    A(2512 + (i % 3) * 2, "gesture", { dur: 10 }),
  ], { from: 2486, to: 2552, enter: "rise", enterDur: 6, exit: "fold", exitDur: 12 }, { tone: 0.03 * (i % 3) });
});

/** Foreground runner crossing the timeline (depth plane). */
const runnerFG = actor("c14.fg", "commuter", 1.0, [P(2474, 10300, 700), P(2500, 10560, 590)], [A(2474, "run", { facing: 1 })], { from: 2474, to: 2500, enter: "none", exit: "fade", exitDur: 6 }, { depth: 1.45 });

const VEHICLES: readonly { kind: VehicleKind; y: number; x0: number; f0: number; v: number; depth?: number }[] = [
  { kind: "bus", y: 356, x0: 10600, f0: 2446, v: -26 },
  { kind: "sedan", y: 410, x0: 9200, f0: 2446, v: 44 },
  { kind: "sedan", y: 356, x0: 11100, f0: 2462, v: -30 },
  { kind: "bus", y: 410, x0: 9700, f0: 2462, v: 40 },
  { kind: "sedan", y: 410, x0: 10300, f0: 2480, v: 46 },
  { kind: "sedan", y: 356, x0: 11900, f0: 2486, v: -34 },
  { kind: "bus", y: 620, x0: 10700, f0: 2454, v: -30, depth: 1.35 },
];

const streetItems = (ctx: FilmCtx): StageItem[] => {
  const { f } = ctx;
  const out: StageItem[] = [];
  if (f > 2600) {
    return out;
  }
  const p = ctx.proj(IDENTITY);
  const cool = T.cool(f);
  const leave = T.streetOut(f);
  for (const b of BUILDINGS) {
    if (!ctx.onScreen(IDENTITY, b.x + b.w / 2, FACADE, 1, 700)) {
      continue;
    }
    const fb = fAt(b.x - 700);
    const build = ramp(f, fb - 10, fb + 6) * (f < 2446 ? ramp(f, 2432, 2446) : 1);
    const isBank = b === BANK;
    const isFactory = b.k === "factory";
    const shut = isBank ? T.shut(f) : 0;
    out.push({
      key: `b.${b.x}`,
      y: FACADE,
      depth: 1,
      node: (
        <g opacity={1 - leave}>
          <Building p={p} kind={b.k} x={b.x} y={FACADE} w={b.w} h={b.h} variant={b.v ?? 0} build={build} tone={isFactory ? T.factory(f) * 0.55 : 0.03} cool={cool * 0.8} id={`s14-${b.x}`}>
            {shut > 0.002 ? (
              <g>
                <rect x={24} y={-b.h * 0.62} width={b.w - 48} height={b.h * 0.62 * shut} fill={mixColor(PALETTE.grayBlue, PALETTE.paperWarm, 0.25)} stroke={PALETTE.deepBlue} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
                <path d={Array.from({ length: 9 }, (_, k) => `M 24 ${(-b.h * 0.62 + ((k + 1) * b.h * 0.62 * shut) / 10).toFixed(1)} H ${b.w - 24}`).join(" ")} stroke={PALETTE.deepBlueSoft} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
              </g>
            ) : null}
          </Building>
        </g>
      ),
    });
  }
  for (let x = 9200; x <= 12400; x += 380) {
    if (ctx.onScreen(IDENTITY, x, S_WALK + 30, 1, 200)) {
      out.push({ key: `lamp.${x}`, y: S_WALK + 30, depth: 1, node: <g opacity={T.street(f) * (1 - leave)}><Lamppost p={p} x={x} y={S_WALK + 30} scale={0.9} tone={cool * 0.3} /></g> });
    }
  }
  for (let x = 9390; x <= 12400; x += 300) {
    const ty = S_WALK + 150 + (hash01(x) - 0.5) * 30;
    if (ctx.onScreen(IDENTITY, x, ty, 1, 200)) {
      const s = 0.9 + hash01(x + 1) * 0.3;
      out.push({
        key: `tree.${x}`,
        y: ty,
        depth: 1,
        node: (
          <g transform={billboardMatrix(p, x, ty, s)} opacity={T.street(f) * (1 - leave)}>
            <path d="M 0 0 V -58" stroke={PALETTE.deepBlueSoft} strokeWidth={3} vectorEffect="non-scaling-stroke" />
            <ellipse cx={0} cy={-84} rx={34} ry={30} fill={mixColor(PALETTE.skyBluePale, PALETTE.grayBlue, 0.25 + cool * 0.3)} stroke={PALETTE.deepBlueSoft} strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
          </g>
        ),
      });
    }
  }
  // Broadcast arcs from an office tower (media acceleration).
  const bc = win(f, 2464, 2472, 2496, 2506);
  if (bc > 0.002) {
    const t = BUILDINGS[6];
    const c = p.point(t.x + t.w / 2, FACADE, t.h + 30);
    const ph = ((f - 2464) % 12) / 12;
    out.push({
      key: "broadcast",
      y: FACADE - 1,
      depth: 1,
      node: (
        <g opacity={bc}>
          {[0, 1, 2].map((k) => {
            const r = (18 + (k + ph) * 22) * p.zoom;
            return <path key={k} d={`M ${c[0] - r} ${c[1]} A ${r} ${r} 0 0 1 ${c[0] + r} ${c[1]}`} fill="none" stroke={PALETTE.skyBlue} strokeWidth={1.6} opacity={1 - (k + ph) / 3} />;
          })}
        </g>
      ),
    });
  }
  for (const v of VEHICLES) {
    const x = v.x0 + v.v * (f - v.f0);
    const d = v.depth ?? 1;
    if (f < v.f0 || !ctx.onScreen(IDENTITY, x, v.y, d, 400)) {
      continue;
    }
    const pv = ctx.proj(IDENTITY, d);
    const facing: 1 | -1 = v.v > 0 ? 1 : -1;
    const a = pv.point(x - facing * 130, v.y, 30);
    out.push({
      key: `v.${v.kind}.${v.x0}`,
      y: v.y,
      depth: d,
      node: (
        <g opacity={(1 - leave) * (1 - T.crack(f) * 0.6)}>
          {[0, 1, 2].map((k) => {
            const len = Math.abs(v.v) * (5 + k * 3) * pv.zoom;
            const yy = a[1] - k * 12 * pv.zoom;
            return <path key={k} d={`M ${a[0]} ${yy} h ${-facing * len}`} stroke={PALETTE.skyBlue} strokeWidth={1.4} opacity={0.5 - k * 0.12} />;
          })}
          <Vehicle kind={v.kind} p={pv} x={x} y={v.y} scale={0.95} facing={facing} dist={Math.abs(v.v * (f - v.f0))} tone={cool * 0.3} />
        </g>
      ),
    });
  }
  out.push(...actorItems(ctx, IDENTITY, [...commuters, ...queue, runnerFG]));
  return out;
};

/* ------------------------------------------------------------ new century */

const topAt = (f: number) => Math.max(MARK_2014[1], Math.min(STREET_Y, routeAt(routeU(f + 18))[1] - 260));

const civic = seedCrowd({
  seed: 2003,
  count: 26,
  area: (r) => {
    const a = r() * Math.PI * 2;
    const d = 40 + r() * 110;
    return [11420 + Math.cos(a) * d * 1.3, -80 + Math.sin(a) * d * 0.7];
  },
  shirts: 4,
  from: (p, r) => [p[0] - 200 - r() * 200, p[1] + 60],
});
const cinema = seedCrowd({
  seed: 2009,
  count: 20,
  area: (r) => [11430 + r() * 200, -1390 + r() * 70],
  shirts: 4,
});

const DISH: Point = [12360, -1000];
const SCREEN: Point = [11420, -1480];
const NET_C: Point = [12180, -2140];
const NET: readonly Point[] = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 + 0.3;
  const r = 120 + hash01(i + 90) * 90;
  return [NET_C[0] + Math.cos(a) * r * 1.3, NET_C[1] + Math.sin(a) * r * 0.8] as Point;
});

const CenturyGround: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const top = topAt(f);
  const o = ramp(f, 2528, 2540) * (1 - T.exit15(f));
  const u = routeU(f);
  const n = Math.max(2, Math.ceil(u * (ROUTE.length - 1)) + 1);
  const route = ROUTE.slice(0, n);
  const head = routeAt(u);
  let ticks = "";
  for (let yr = 2002; yr <= 2014; yr++) {
    const y = yearY(yr);
    if (y >= top) {
      const big = yr % 4 === 2;
      ticks += `M ${FISSURE_X - (big ? 36 : 18)} ${y} H ${FISSURE_X + (big ? 36 : 18)} `;
    }
  }
  // City blocks re-register around the stem (overdraw, bottom → top).
  const blocks: React.ReactNode[] = [];
  for (let gy = 0; gy < 11; gy++) {
    const y = 160 - gy * 250;
    const b = clamp01((top - y) / -260 + 1);
    const on = clamp01((y - top) / 240);
    if (on <= 0) {
      continue;
    }
    void b;
    for (const gx of [-3, -2, -1, 1, 2, 3]) {
      const x = FISSURE_X + gx * 280 - (gx > 0 ? 220 : 60);
      blocks.push(<rect key={`${gx}.${gy}`} x={x} y={y - 190} width={220} height={190} fill="none" stroke={mixColor(PALETTE.skyBluePale, PALETTE.deepBlueSoft, 0.35)} strokeWidth={1.1} opacity={on * 0.8} vectorEffect="non-scaling-stroke" />);
      const h = hash01(gx * 31 + gy * 7);
      if (h > 0.35) {
        // Footprints redrawn inside the block (the city re-registering).
        const fw = 70 + h * 90;
        blocks.push(<rect key={`fp${gx}.${gy}`} x={x + 20 + (h * 97) % 60} y={y - 170} width={fw} height={80 + (h * 53) % 70} fill={PALETTE.grayBluePale} opacity={on * 0.35} stroke={PALETTE.grayBlue} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />);
      }
    }
  }
  const sat = ((f - 2590) / 40) * Math.PI * 2;
  return (
    <SheetGround camera={camera} pl={IDENTITY} opacity={o}>
      {blocks}
      {/* The stem: the 2001 fissure redrawn as a timeline. */}
      <path d={`M ${FISSURE_X} ${STREET_Y} V ${top}`} stroke={PALETTE.deepBlueSoft} strokeWidth={2.4} vectorEffect="non-scaling-stroke" />
      <path d={ticks} stroke={PALETTE.deepBlueSoft} strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
      {top <= MARK_2014[1] + 1 ? <circle cx={MARK_2014[0]} cy={MARK_2014[1]} r={14} fill={PALETTE.deepBlueSoft} opacity={ramp(f, 2680, 2690)} /> : null}
      {/* Civic node. */}
      <circle cx={11420} cy={-80} r={170} fill="none" stroke={PALETTE.skyBlue} strokeWidth={1.4} strokeDasharray="8 8" opacity={win(f, 2552, 2566, 2610, 2630)} vectorEffect="non-scaling-stroke" />
      {/* Science: orbit ring around the dish. */}
      <g opacity={win(f, 2580, 2594, 2640, 2660)}>
        <ellipse cx={DISH[0]} cy={DISH[1]} rx={230} ry={150} fill="none" stroke={PALETTE.skyBlue} strokeWidth={1.4} strokeDasharray="6 7" vectorEffect="non-scaling-stroke" />
        <circle cx={DISH[0] + Math.cos(sat) * 230} cy={DISH[1] + Math.sin(sat) * 150} r={9} fill={PALETTE.deepBlueSoft} />
      </g>
      {/* Network: nodes and links spreading from the stem. */}
      <g opacity={win(f, 2628, 2642, 2688, 2704)}>
        {NET.map((q, i) => {
          const l = clamp01((f - 2630 - i * 3) / 10);
          const prev = i === 0 ? ([FISSURE_X, NET_C[1]] as Point) : NET[i - 1];
          return (
            <g key={i}>
              <path d={`M ${prev[0]} ${prev[1]} L ${lerp(prev[0], q[0], l)} ${lerp(prev[1], q[1], l)} M ${NET_C[0]} ${NET_C[1]} L ${lerp(NET_C[0], q[0], l)} ${lerp(NET_C[1], q[1], l)}`} stroke={PALETTE.skyBlue} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
              <circle cx={q[0]} cy={q[1]} r={12 * l} fill={PALETTE.paperWarm} stroke={PALETTE.deepBlueSoft} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
        <circle cx={NET_C[0]} cy={NET_C[1]} r={16} fill={PALETTE.skyBlue} />
      </g>
      {/* The `10` route: sky blue, winding around the stem. */}
      {u > 0 ? (
        <>
          <path d={`M ${route.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" L ")} L ${head[0].toFixed(1)} ${head[1].toFixed(1)}`} fill="none" stroke={PALETTE.skyBlue} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </>
      ) : null}
    </SheetGround>
  );
};

const teammate06 = actor("t15.pass", "argentinaKit", 1.0, [P(2570, 12160, -600), P(2590, 12100, -700, "atlasDrift")], [A(2570, "jog", { facing: -1 }), A(2588, "kick", { dur: 8, blend: 2 }), A(2600, "stand", { facing: -1 })], {
  from: 2568,
  to: 2626,
  enter: "rise",
  exit: "fold",
  exitDur: 10,
});
const opponent10 = actor("t15.opp", "opponentLight", 1.05, [P(2636, 11560, -1560), P(2652, 11700, -1660, "institutionalLock"), P(2664, 11640, -1600, "atlasDrift")], [
  A(2636, "jog", { facing: 1 }),
  A(2648, "run", { facing: 1 }),
  A(2656, "retreat", { facing: -1, blend: 6 }),
], { from: 2632, to: 2686, enter: "rise", exit: "fold", exitDur: 10 });
const scientist = actor("t15.sci", "scientist", 0.95, [P(2582, DISH[0] - 110, DISH[1] + 40)], [A(2582, "stand", { facing: 1 }), A(2594, "point", { dur: 14 })], {
  from: 2580,
  to: 2660,
  enter: "rise",
  exit: "fold",
  exitDur: 12,
});
const netWalkers: ActorTrack[] = [0, 1, 2].map((i) =>
  actor(`t15.net.${i}`, (["commuterWoman", "student", "commuter"] as const)[i], 0.95, [P(2630, NET_C[0] - 240 + i * 90, NET_C[1] + 150 - i * 40), P(2690, NET_C[0] + 60 + i * 90, NET_C[1] + 110 - i * 40)], [A(2630, "walk", { facing: 1 })], {
    from: 2630,
    to: 2700,
    enter: "rise",
    exit: "fold",
  }),
);

const ballAt15 = (f: number): Point | null => {
  if (f < 2556 || f > 2699) {
    return null;
  }
  if (f >= 2588 && f < 2598) {
    const q = routeAt(routeU(2598));
    const t = (f - 2588) / 10;
    return [lerp(12120, q[0] + 20, t), lerp(-690, q[1] + 8, t)];
  }
  const m = positionAt(f < 2624 ? MESSI_YOUNG : MESSI_ADULT_15, f);
  return [m.x + 22, m.y + 6];
};

const centuryItems = (ctx: FilmCtx): StageItem[] => {
  const { f } = ctx;
  const p = ctx.proj(IDENTITY);
  const out: StageItem[] = [];
  const dishO = win(f, 2578, 2592, 2640, 2660);
  if (dishO > 0.002) {
    out.push({
      key: "dish",
      y: DISH[1],
      depth: 1,
      node: (
        <g transform={billboardMatrix(p, DISH[0], DISH[1], 1)} opacity={dishO}>
          <path d="M -6 0 L 0 -70 L 6 0 Z M -24 0 H 24" fill={mixColor(PALETTE.grayBlue, PALETTE.paperWarm, 0.3)} stroke={PALETTE.deepBlue} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
          <path d="M -58 -118 C -40 -60, 30 -44, 62 -84 Z" fill={PALETTE.paperWarm} stroke={PALETTE.deepBlue} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
          <path d="M 0 -76 L -8 -120 M -58 -118 L -8 -120 L 62 -84" fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </g>
      ),
    });
  }
  const scrO = win(f, 2606, 2620, 2668, 2684);
  if (scrO > 0.002) {
    out.push({
      key: "screen",
      y: SCREEN[1],
      depth: 1,
      node: (
        <g transform={billboardMatrix(p, SCREEN[0], SCREEN[1], 1)} opacity={scrO}>
          <path d="M 0 0 V -60 M 220 0 V -60" stroke={PALETTE.deepBlue} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
          <rect x={-10} y={-190} width={240} height={130} fill={PALETTE.paperWarm} stroke={PALETTE.deepBlue} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
          <path d="M 0 -104 C 50 -112, 90 -96, 130 -108 S 200 -100, 220 -104 V -70 H 0 Z" fill={PALETTE.skyBluePale} />
          <circle cx={150} cy={-148} r={16} fill="none" stroke={PALETTE.skyBlue} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
        </g>
      ),
    });
  }
  out.push(
    ...crowdItems({
      key: "civic15",
      p,
      members: civic,
      look: { u: 6.4, tall: 5.2, shirts: [PALETTE.skyBlue, PALETTE.paperWarm, PALETTE.grayBlue, PALETTE.deepBlueSoft], flags: 0.35 },
      state: { presence: ramp(f, 2548, 2574), excite: 0.3, withdraw: ramp(f, 2606, 2630), opacity: 1 - ramp(f, 2620, 2634) },
      f,
      bands: 4,
    }),
    ...crowdItems({
      key: "cinema15",
      p,
      members: cinema,
      look: { u: 6.4, tall: 2.4, shirts: [PALETTE.skyBlue, PALETTE.paperWarm, PALETTE.grayBlue, PALETTE.deepBlueSoft] },
      state: { presence: ramp(f, 2606, 2626), excite: 0.05, opacity: scrO },
      f,
      bands: 3,
    }),
  );
  const b = ballAt15(f);
  if (b) {
    out.push({ key: "ball15", y: b[1] + 0.5, depth: 1, node: <Ball p={p} x={b[0]} y={b[1]} h={0} r={10} /> });
  }
  out.push(...actorItems(ctx, IDENTITY, [MESSI_YOUNG, MESSI_ADULT_15, teammate06, opponent10, scientist, ...netWalkers]));
  return out;
};

/* ---------------------------------------------------------------- overlay */

const Overlay: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const d90 = win(f, 2452, 2462, 2504, 2514);
  const d01 = win(f, 2518, 2522, 2548, 2560);
  const s21 = win(f, 2552, 2566, 2610, 2626);
  return (
    <>
      <At x={168} y={846} id="label.1990">
        <DateText text="1990–2001" size={104} o={d90} enter={ramp(f, 2452, 2462)} />
      </At>
      <At x={168} y={820} id="label.2001">
        <DateText text="2001" size={132} o={d01} enter={1} />
      </At>
      <At x={168} y={96} id="label.sigloxxi">
        <DateText text="SIGLO XXI" size={96} o={s21} enter={ramp(f, 2552, 2566)} tracking={0.04} />
      </At>
      {[1990, 1995, 2000].map((yr) => (
        <MapLabel key={yr} camera={camera} anchor={[yearX(yr), STREET_Y + 44]} lines={[String(yr)]} o={0.85 * ramp(f, 2444, 2460) * (1 - ramp(f, 2512, 2520))} size={18} tone="soft" tracking={0.18} />
      ))}
      {[2006, 2010, 2014].map((yr) => (
        <MapLabel
          key={yr}
          camera={camera}
          anchor={[FISSURE_X + 52, yearY(yr)]}
          lines={[String(yr)]}
          o={0.9 * (topAt(f) <= yearY(yr) ? ramp(f, 2560, 2570) : 0) * (1 - ramp(f, 2698, 2712))}
          size={20}
          align="left"
          tone="deep"
          tracking={0.16}
          dy={-12}
        />
      ))}
    </>
  );
};

export const STAGES_14_15: readonly FilmStage[] = [
  { id: "s14", from: 2432, to: 2604, Ground: CityGround, items: streetItems, Overlay },
  { id: "s15", from: 2526, to: 2712, Ground: CenturyGround, items: centuryItems },
];

/* ------------------------------------------------------------- memory line */

/** 1990–2001: the whole thread lies along the street's median. */
const THREAD_A: readonly Point[] = stateParts([[[[X_START, STREET_Y], [FISSURE_X, STREET_Y]], 96]], false);
/** From 2001: the thread continues beneath the paper, north along the fissure. */
export const THREAD_B: readonly Point[] = stateParts(
  [
    [[[X_START, STREET_Y], [FISSURE_X, STREET_Y]], 70],
    [[[FISSURE_X, STREET_Y - 30], MARK_2014], 26],
  ],
  false,
);
const S_BEND = 70 / 95;
/** Normalised s on THREAD_B for a world y on the vertical part. */
export const sAtY = (y: number) => S_BEND + (1 - S_BEND) * clamp01((STREET_Y - 30 - y) / (STREET_Y - 30 - MARK_2014[1]));

const GOLD = PALETTE.goldMuted;
const BURIED = mixColor(PALETTE.goldMuted, PALETTE.paperWarm, 0.35);

export const ERA_14_15: LineEra = {
  id: "buriedThread",
  from: 2445,
  to: 2699,
  evaluate: (f) => {
    if (f < 2516) {
      // The 1986 run straightens into the timeline; the whole thread stays gold.
      const m = ramp(f, 2445, 2462);
      const pts = interpolatePoints(MARADONA_STATE, THREAD_A, m);
      return {
        points: pts,
        ranges: [{ start: lerp(18 / 95, 0, m), end: 1, opacity: lerp(0.95, 0.85, m), color: GOLD }],
        head: null,
        core: [],
      };
    }
    const k = ramp(f, 2516, 2530);
    const pts = interpolatePoints(THREAD_A, THREAD_B, k);
    if (f < 2532) {
      // 2001: the thread kinks at the fissure and goes beneath the paper.
      return {
        points: pts,
        ranges: [{ start: 0, end: 1, opacity: lerp(0.85, 0.4, k), color: mixColor(GOLD, BURIED, k), dash: k > 0.5 ? [5, 9] : undefined }],
        head: null,
        core: [],
      };
    }
    // 2001–2014: buried; glimpsed through two coordinate apertures.
    const top = sAtY(topAt(f));
    const ranges: VisibleRange[] = [
      { start: 0, end: S_BEND, opacity: 0.3 * (1 - ramp(f, 2560, 2600)), color: BURIED, dash: [5, 9] },
      { start: S_BEND, end: Math.max(S_BEND + 0.001, top), opacity: 0.42, color: BURIED, dash: [5, 9] },
    ];
    const apertures = [
      { y: yearY(2006), o: win(f, 2590, 2598, 2616, 2626) },
      { y: yearY(2010), o: win(f, 2644, 2652, 2668, 2678) },
    ];
    for (const a of apertures) {
      if (a.o > 0.002) {
        const s = sAtY(a.y);
        ranges.push({ start: s - 0.012, end: s + 0.012, opacity: 0.9 * a.o, color: GOLD });
      }
    }
    return { points: THREAD_B, ranges, head: null, core: [] };
  },
};
