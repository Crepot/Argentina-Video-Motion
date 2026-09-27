import React from "react";
import { clamp01, lerp } from "../../animation/interpolate-clamped";
import type { ActorTrack, PosKey } from "../../actors/action-track";
import { positionAt } from "../../actors/action-track";
import { interpolatePoints } from "../../paths/interpolate-path";
import { mixColor, PALETTE } from "../../theme/palette";
import type { CameraState } from "../../types/camera";
import type { Point } from "../../types/paths";
import { A, P, actor, actorItems } from "../actors";
import { K, ramp, win } from "../anim";
import { crowdItems } from "../draw/crowd";
import { Ball, Goal, PitchGround, standsCrowd, WorldCupTrophy } from "../draw/football";
import { AnthemText, At, DateText, EventText } from "../draw/labels";
import { SheetGround } from "../draw/sheet";
import { camIn, type CamKey } from "../film-camera";
import { lineState, stateParts } from "../line";
import { anchorAt, toWorld } from "../space";
import type { FilmCtx, FilmStage, LineEra, StageItem } from "../types";
import { CIVIC_1983, PITCH86_CENTER } from "./s10-s12-v2";

/**
 * Scene 13 · México 1986 · frames 2259–2444 (sport profile). The 1983 civic
 * line curls into the centre circle; touchlines straighten from the ocean
 * parallels; players rise from nodes. An original graphic reinterpretation of
 * the run (no footage, no frame-accurate replay): receive → first defender
 * → turn → second defender → acceleration → defenders left behind →
 * goalkeeper → resolution → goal (2352). The memory line follows the run
 * exactly, turns gold, climbs into the trophy and draws only the left laurel
 * branch; SEAN ETERNOS LOS LAURELES… stays open.
 */
export const PITCH86 = anchorAt([0, 0], PITCH86_CENTER, 1);
const PL = PITCH86;

/** Maradona's run (local): the memory line copies this geometry. */
const RUN: readonly (readonly [number, number, number])[] = [
  [2270, 150, 230],
  [2282, 300, 170],
  [2290, 390, 200],
  [2300, 600, 100],
  [2310, 820, 40],
  [2320, 1030, -40],
  [2330, 1200, -100],
  [2338, 1310, -70],
  [2344, 1400, -150],
  [2350, 1470, -95],
];
const GOAL_PT: Point = [1575, -40];

const T = {
  pitch: K([
    [2256, 0, "atlasDrift"],
    [2282, 1],
  ]),
  fill: K([
    [2262, 0, "atlasDrift"],
    [2290, 1],
    [2420, 1, "atlasDrift"],
    [2446, 0.2],
  ]),
  crowd: K([
    [2268, 0, "atlasDrift"],
    [2310, 1],
  ]),
  excite: K([
    [2300, 0.15],
    [2350, 0.4],
    [2352, 1, "atlasDrift"],
    [2400, 0.6],
    [2430, 0.2],
  ]),
  gold: K([
    [2352, 0, "restrainedImpact"],
    [2368, 1],
  ]),
  trophy: K([
    [2378, 0, "ceremonial"],
    [2394, 1],
  ]),
  lift: K([
    [2388, 0, "ceremonial"],
    [2402, 1],
  ]),
  net: K([
    [2351, 0],
    [2353, 1, "restrainedImpact"],
    [2368, 0],
  ]),
  exit: K([
    [2420, 0, "atlasDrift"],
    [2448, 1],
  ]),
};

const runKeys: PosKey[] = RUN.map(([f, x, y]) => P(f, x, y));
const MARADONA: ActorTrack = actor(
  "historical.maradona",
  "maradona",
  1,
  [...runKeys, P(2360, 1380, -260, "atlasDrift"), P(2378, 1150, -420, "atlasDrift"), P(2388, 1000, -380)],
  [
    A(2266, "jog", { facing: 1 }),
    A(2276, "dribble", { facing: 1, amount: 16 }),
    A(2346, "kick", { dur: 10, blend: 2 }),
    A(2354, "celebrateRun", { facing: -1, amount: 1 }),
    A(2378, "stand", { breadth: 0.8 }),
    A(2388, "lift", { dur: 14, blend: 6 }),
  ],
  { from: 2262, to: 2446, enter: "rise", enterDur: 12, exit: "fold", exitDur: 16 },
  { build: "stocky", detail: "hero", role: "primary", held: { from: 2388, to: 2446, prop: "trophy" } },
);

const defender = (id: string, from: Point, lunge: Point, fAt: number, after: Point, extra: Partial<ActorTrack> = {}): ActorTrack =>
  actor(id, "england1986", 1, [P(fAt - 16, from[0], from[1]), P(fAt, lunge[0], lunge[1], "institutionalLock"), P(fAt + 14, after[0], after[1], "atlasDrift")], [
    A(fAt - 16, "jog", { facing: -1 }),
    A(fAt - 4, "run", { facing: -1 }),
    A(fAt + 4, "retreat", { facing: 1, blend: 6 }),
  ], { from: fAt - 24, to: fAt + 36, enter: "rise", enterDur: 10, exit: "fold", exitDur: 14 }, extra);

const england: ActorTrack[] = [
  defender("eng.1", [430, 100], [310, 150], 2284, [340, 250]),
  defender("eng.2", [460, 330], [380, 270], 2292, [420, 360]),
  defender("eng.3", [760, -80], [630, 20], 2306, [680, 130]),
  defender("eng.4", [1150, 60], [1040, -10], 2320, [1080, 110]),
  defender("eng.5", [1320, 40], [1230, -60], 2330, [1270, 60]),
  actor("eng.gk", "goalkeeper", 1, [P(2300, 1520, -30), P(2338, 1470, -30), P(2346, 1420, -110, "restrainedImpact"), P(2356, 1440, -60)], [
    A(2300, "stand", { facing: -1, breadth: 0.8 }),
    A(2336, "stroll", { facing: -1 }),
    A(2342, "dive", { facing: -1, dur: 12, blend: 3 }),
  ], { from: 2294, to: 2390, enter: "rise", exit: "fold" }),
];

const teammates: ActorTrack[] = [0, 1, 2, 3, 4].map((i) =>
  actor(`arg86.${i}`, "argentina1986", 1, [P(2262, -100 + i * 200, -400 + (i % 3) * 360), P(2340, 600 + i * 160, -380 + (i % 3) * 280), P(2376, 1120 + i * 60, -340 - (i % 2) * 120, "atlasDrift")], [
    A(2262, "jog", { facing: 1 }),
    A(2354, "celebrateRun", { amount: 1, facing: 1 }),
    A(2378, "cheer", { amount: 1 }),
  ], { from: 2262 + i * 2, to: 2446, enter: "rise", exit: "fold", exitDur: 16 }, { tone: 0.04 * i }),
);

const STANDS = standsCrowd(1986, 1900, 1360, 5);

const ballAt = (f: number): { x: number; y: number; h: number } => {
  if (f < 2350) {
    const p = positionAt(MARADONA, f);
    return { x: p.x + 24, y: p.y + 8, h: 0 };
  }
  const t = clamp01((f - 2350) / 3);
  const a = RUN[RUN.length - 1];
  return { x: lerp(a[1] + 24, GOAL_PT[0] + 30, t), y: lerp(a[2], GOAL_PT[1], t), h: Math.sin(t * Math.PI) * 10 };
};

/* ---------------------------------------------------------------- camera */

const camRun = (f: number, dx: number, zoom: number, tilt = 55, rot = 0): CamKey => {
  const p = positionAt(MARADONA, f);
  return camIn(PL, f, p.x + dx, p.y + 40, zoom, tilt, rot);
};

export const KEYS_13: readonly CamKey[] = [
  { f: 2272, x: PITCH86_CENTER[0] + 100, y: PITCH86_CENTER[1] + 200, zoom: 1.2, tilt: 44, rot: 0 },
  camRun(2286, 90, 2.2),
  camRun(2300, 110, 2.4),
  camRun(2314, 110, 2.45),
  camRun(2328, 100, 2.45, 55, -4),
  camRun(2342, 60, 2.5, 56, -12),
  camIn(PL, 2358, 1360, -170, 2.0, 52, -10),
  camIn(PL, 2380, 1100, -380, 1.9, 50, -4),
  camIn(PL, 2400, 1000, -330, 2.7, 46, 0),
  camIn(PL, 2424, 1000, -330, 1.8, 30, 0),
];

/* ------------------------------------------------------------------- stage */

const Ground13: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => (
  <SheetGround camera={camera} pl={PL} opacity={1 - T.exit(f) * 0.85 - 0.15 * ramp(f, 2448, 2466)}>
    <PitchGround draw={T.pitch(f)} fill={T.fill(f)} />
  </SheetGround>
);

const items13 = (ctx: FilmCtx): StageItem[] => {
  const { f } = ctx;
  const p = ctx.proj(PL);
  const out: StageItem[] = [];
  const go = ramp(f, 2266, 2282) * (1 - T.exit(f));
  out.push({ key: "goalE", y: -1, depth: 1, node: <Goal p={p} side={1} ripple={T.net(f)} opacity={go} /> });
  out.push({ key: "goalW", y: -1, depth: 1, node: <Goal p={p} side={-1} ripple={0} opacity={go} /> });
  if (f >= 2270 && f <= 2372) {
    const b = ballAt(f);
    out.push({ key: "ball", y: b.y + 0.5, depth: 1, node: <Ball p={p} x={b.x} y={b.y} h={b.h} opacity={1 - ramp(f, 2362, 2372)} /> });
  }
  out.push(
    ...crowdItems({
      key: "stands86",
      p,
      members: STANDS,
      look: { u: 7, tall: 3.4, shirts: [PALETTE.skyBlue, PALETTE.paperWarm, mixColor(PALETTE.grayBlue, PALETTE.skyBluePale, 0.4), mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.3)], flags: 0.8 },
      state: { presence: T.crowd(f), excite: T.excite(f), opacity: 1 - T.exit(f) },
      f,
      bands: 8,
    }),
  );
  out.push(...actorItems(ctx, PL, [MARADONA, ...england, ...teammates]));
  return out;
};

const Overlay13: React.FC<{ f: number }> = ({ f }) => {
  const lab = win(f, 2358, 2368, 2426, 2440);
  const anth = win(f, 2392, 2404, 2470, 2486);
  return (
    <>
      <At x={168} y={96} id="label.1986">
        <DateText text="MÉXICO · 1986" size={96} o={lab} enter={ramp(f, 2358, 2368)} />
        <EventText lines={["ARGENTINA · CAMPEÓN DEL MUNDO"]} o={lab} enter={ramp(f, 2362, 2372)} tracking={0.14} />
        <EventText lines={["MARADONA · 10"]} o={lab} enter={ramp(f, 2366, 2376)} tracking={0.2} tone="soft" size={24} />
      </At>
      <At x={1752} y={860} align="right" id="anthem.laureles">
        <AnthemText lines={["SEAN ETERNOS", "LOS LAURELES…"]} o={anth} reveal={ramp(f, 2392, 2420)} align="right" />
      </At>
    </>
  );
};

/* Trophy (items, drawn with the stage). */
const trophyItems = (ctx: FilmCtx): StageItem[] => {
  const { f } = ctx;
  const t = T.trophy(f);
  if (t <= 0.002) {
    return [];
  }
  // The lifted trophy is carried by Maradona's rig (held prop); the gold
  // echo standing on the pitch marks where the golden trajectory rises.
  const p = ctx.proj(PL);
  return [
    {
      key: "trophy.ghost",
      y: -300,
      depth: 1,
      node: <WorldCupTrophy p={p} x={1180} y={-300} s={1.4} lift={0} gold={T.gold(f)} opacity={t * (1 - T.lift(f)) * 0.9} />,
    },
  ];
};

export const STAGES_13: readonly FilmStage[] = [{ id: "s13", from: 2250, to: 2468, Ground: Ground13, items: (c) => [...items13(c), ...trophyItems(c)], Overlay: Overlay13 }];

/* ------------------------------------------------------------- memory line */

const RUN_WORLD: readonly Point[] = lineState(RUN.map(([, x, y]) => toWorld(PL, [x, y])));
export const MARADONA_STATE: readonly Point[] = stateParts([
  [[toWorld(PL, [-300, 300]), toWorld(PL, [-80, 270]), ...RUN.slice(0, 2).map(([, x, y]) => toWorld(PL, [x, y]))], 20],
  [[...RUN.slice(1).map(([, x, y]) => toWorld(PL, [x, y])), toWorld(PL, GOAL_PT)], 60],
  [[toWorld(PL, GOAL_PT), toWorld(PL, [1300, -260]), toWorld(PL, [1180, -320]), toWorld(PL, [1180, -420])], 16],
]);
const runS = (f: number) => {
  if (f < 2270) {
    return 20 / 95;
  }
  if (f >= 2352) {
    return 80 / 95;
  }
  // Head follows Maradona along samples 20…80.
  const p = positionAt(MARADONA, f);
  let best = 20;
  let bd = Infinity;
  for (let i = 20; i <= 80; i++) {
    const q = MARADONA_STATE[i];
    const w = toWorld(PL, [p.x, p.y]);
    const d = Math.hypot(q[0] - w[0], q[1] - w[1]);
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best / 95;
};
void RUN_WORLD;

export const ERA_13: LineEra = {
  id: "maradonaTrajectory",
  from: 2273,
  to: 2444,
  evaluate: (f) => {
    const m = ramp(f, 2273, 2284);
    const pts = interpolatePoints(CIVIC_1983, MARADONA_STATE, m);
    const h = runS(f);
    const g = T.gold(f);
    const climb = ramp(f, 2380, 2400);
    const color = mixColor(PALETTE.skyBlue, PALETTE.goldMuted, g);
    const start = lerp(0, 18 / 95, m);
    return {
      points: pts,
      ranges: [{ start, end: lerp(1, Math.max(start + 0.001, lerp(h, 1, climb)), m), opacity: 0.95 * (1 - T.exit(f) * 0.2), color }],
      head: f < 2352 && f > 2272 ? { s: h, opacity: 0.9 } : null,
      core: g > 0.01 ? [{ start: 20 / 95, end: lerp(h, 1, climb), opacity: g }] : [],
    };
  },
};
