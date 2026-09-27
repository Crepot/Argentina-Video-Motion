import React from "react";
import { clamp01, lerp } from "../../animation/interpolate-clamped";
import type { ActorTrack } from "../../actors/action-track";
import { positionAt } from "../../actors/action-track";
import { mixColor, PALETTE } from "../../theme/palette";
import type { CameraState } from "../../types/camera";
import type { Point, VisibleRange } from "../../types/paths";
import { A, P, actor, actorItems } from "../actors";
import { K, ramp, win } from "../anim";
import { crowdItems } from "../draw/crowd";
import { Ball, Goal, PitchGround, PITCH_L, PITCH_W, standsCrowd, WorldCupTrophy } from "../draw/football";
import { AnthemText, At, DateText, EventText, MapLabel } from "../draw/labels";
import { MapGround } from "../draw/map";
import { SheetGround } from "../draw/sheet";
import { camIn, type CamKey } from "../film-camera";
import { GLOBE, LUSAIL_W, PITCH22 } from "../late-world";
import { IDENTITY, toWorld } from "../space";
import type { FilmCtx, FilmStage, LineEra, StageItem } from "../types";
import { ARC22, LATE, offsetPolyline, S, sOf } from "./late-line";
import { PITCH86 } from "./s13-maradona";

/**
 * Scene 18 · Qatar 2022 · frames 2892–2999. The double strand (sky-blue
 * route + 1986 gold thread) flies from Rio to Lusail and lands on a pitch
 * drawn out of the Qatar coordinate grid. An original team action (no match
 * recreation): two passes, Messi accelerates (2937), the decisive shot. At
 * impact the blue strand merges with the gold thread; the camera makes one
 * impossible pullback along the merged 36-year line (1986 → 2022 · 36
 * AÑOS) and races back; the team celebrates, Messi lifts the trophy, the
 * right laurel completes and …QUE SUPIMOS CONSEGUIR resolves.
 */
const PL = PITCH22;
const BLUE_ARC: readonly Point[] = offsetPolyline(ARC22, -7);

const T = {
  flight: K([
    [2886, 0, "atlasDrift"],
    [2912, 1],
  ]),
  map: K([
    [2884, 0, "atlasDrift"],
    [2896, 1],
    [2914, 1, "atlasDrift"],
    [2928, 0],
  ]),
  grid: K([
    [2906, 0, "atlasDrift"],
    [2916, 1],
    [2924, 1, "atlasDrift"],
    [2936, 0],
  ]),
  pitch: K([
    [2912, 0, "atlasDrift"],
    [2930, 1],
  ]),
  crowd: K([
    [2916, 0, "atlasDrift"],
    [2936, 1],
  ]),
  excite: K([
    [2930, 0.3],
    [2946, 0.5],
    [2948, 1, "restrainedImpact"],
    [2970, 0.8],
    [2986, 1],
    [3000, 0.7],
  ]),
  net: K([
    [2947, 0],
    [2949, 1, "restrainedImpact"],
    [2962, 0],
  ]),
  merge: K([
    [2946, 0, "restrainedImpact"],
    [2952, 1],
  ]),
  past: (f: number) => win(f, 2950, 2960, 2970, 2980),
  trophy: K([
    [2974, 0, "ceremonial"],
    [2984, 1],
  ]),
  exit: K([
    [2998, 0, "atlasDrift"],
    [3012, 1],
  ]),
};

/* ------------------------------------------------------------------ actors */

const W = 1.0;
const b1 = actor("arg22.b1", "argentinaKitB", W, [P(2918, -80, 320), P(2930, 20, 300)], [A(2918, "jog", { facing: 1 }), A(2928, "kick", { dur: 8, blend: 2 }), A(2936, "jog", { facing: 1 })], {
  from: 2916,
  to: 3008,
  enter: "rise",
  exit: "fold",
});
const b2 = actor("arg22.b2", "argentinaKit", W, [P(2918, 250, -200), P(2933, 330, -150, "atlasDrift"), P(2960, 1180, -230)], [A(2918, "jog", { facing: 1 }), A(2933, "kick", { dur: 8, blend: 2 }), A(2942, "run", { facing: 1 }), A(2958, "embrace")], {
  from: 2916,
  to: 3008,
  enter: "rise",
  exit: "fold",
});
const KICK = 2945;
const MESSI_KEYS = [P(2918, 480, 260), P(2936, 650, 100, "atlasDrift"), P(2940, 800, 60), P(KICK, 1030, -40, "restrainedImpact"), P(2958, 1250, -180, "atlasDrift"), P(2976, 1200, -170, "atlasDrift")];
export const MESSI_22: ActorTrack = actor(
  "historical.messi.2022",
  "messi2022",
  1.05,
  MESSI_KEYS,
  [
    A(2918, "jog", { facing: 1 }),
    A(2936, "dribble", { facing: 1, amount: 16 }),
    A(KICK - 2, "kick", { dur: 10, blend: 2 }),
    A(2950, "celebrateRun", { amount: 1, facing: 1 }),
    A(2966, "stand", { breadth: 0.8 }),
    A(2986, "lift", { dur: 14, blend: 6 }),
  ],
  { from: 2916, to: 3008, enter: "rise", exit: "fold", exitDur: 12 },
  { build: "athlete", detail: "hero", role: "primary", held: { from: 2986, to: 3008, prop: "trophy" } },
);
const TROPHY_AT: Point = [1200, -250];
const team: ActorTrack[] = Array.from({ length: 7 }, (_, i) => {
  const a = (i / 7) * Math.PI * 2 + 0.3;
  const home: Point = [1200 + Math.cos(a) * 170, -170 + Math.sin(a) * 110];
  return actor(`arg22.t${i}`, i % 2 ? "argentinaKit" : "argentinaKitB", W, [P(2946, 520 + i * 90, 420 - (i % 3) * 300), P(2962, 1250 + Math.cos(a) * 90, -180 + Math.sin(a) * 60, "atlasDrift"), P(2980, home[0], home[1], "atlasDrift")], [
    A(2946, "run", { facing: 1 }),
    A(2960, "embrace"),
    A(2978, "cheer", { amount: 0.8 }),
    A(2988, "cheer", { amount: 1 }),
  ], { from: 2944, to: 3008, enter: "rise", exit: "fold", exitDur: 12 });
});
const opponents: ActorTrack[] = [
  actor("fra22.1", "opponentDark", W, [P(2930, 900, 120), P(2940, 800, 60, "institutionalLock"), P(2952, 840, 150)], [A(2930, "jog", { facing: -1 }), A(2937, "run", { facing: -1 }), A(2944, "retreat", { facing: 1 })], { from: 2926, to: 2990, enter: "rise", exit: "fold" }),
  actor("fra22.2", "opponentDark", W, [P(2934, 1120, -160), P(2943, 980, -110, "institutionalLock"), P(2956, 1020, -40)], [A(2934, "jog", { facing: -1 }), A(2940, "run", { facing: -1 }), A(2948, "stand", { facing: -1 })], { from: 2928, to: 2990, enter: "rise", exit: "fold" }),
  actor("gk22", "goalkeeper", W, [P(2930, 1545, -10), P(2944, 1500, -30, "atlasDrift"), P(2950, 1500, 60, "restrainedImpact")], [A(2930, "stand", { facing: -1, breadth: 0.8 }), A(2942, "stroll", { facing: -1 }), A(2945, "dive", { facing: -1, dur: 10, blend: 2 })], { from: 2926, to: 2990, enter: "rise", exit: "fold" }),
];

const STANDS = standsCrowd(2022, 1900, 1360, 5);

const feet = (t: ActorTrack, f: number): Point => {
  const p = positionAt(t, f);
  return [p.x + 22, p.y + 8];
};
const ballAt = (f: number): { x: number; y: number; h: number } | null => {
  const seg = (fa: number, fb: number, a: Point, b: Point, h = 0) => {
    const k = clamp01((f - fa) / (fb - fa));
    return { x: lerp(a[0], b[0], k), y: lerp(a[1], b[1], k), h: Math.sin(k * Math.PI) * h };
  };
  if (f < 2918 || f > 2962) {
    return null;
  }
  if (f < 2929) {
    const q = feet(b1, f);
    return { x: q[0], y: q[1], h: 0 };
  }
  if (f < 2932) {
    return seg(2929, 2932, feet(b1, 2929), feet(b2, 2932));
  }
  if (f < 2934) {
    const q = feet(b2, f);
    return { x: q[0], y: q[1], h: 0 };
  }
  if (f < 2937) {
    return seg(2934, 2937, feet(b2, 2934), feet(MESSI_22, 2937));
  }
  if (f < KICK) {
    const q = feet(MESSI_22, f);
    return { x: q[0], y: q[1], h: 0 };
  }
  if (f < 2948) {
    return seg(KICK, 2948, feet(MESSI_22, KICK), [1600, -20], 24);
  }
  return seg(2948, 2962, [1600, -20], [1630, -20]);
};

/* ---------------------------------------------------------------- camera */

const WHOLE: CamKey = { f: 2964, x: 12100, y: -1150, zoom: 0.16, tilt: 0, rot: 0 };
export const KEYS_18: readonly CamKey[] = [
  { f: 2894, x: 16560, y: -2800, zoom: 1.02, tilt: 6, rot: -3 },
  { f: 2906, x: 16860, y: -2960, zoom: 1.22, tilt: 0, rot: 0 },
  camIn(PL, 2918, 120, 40, 0.7, 26, 0),
  camIn(PL, 2928, 300, 40, 1.45, 48, 0),
  camIn(PL, 2937, 640, 40, 1.65, 50, 0),
  camIn(PL, 2945, 1060, -20, 1.75, 52, 0),
  camIn(PL, 2952, 1300, -80, 1.6, 50, 0),
  // One impossible pullback along the merged 36-year line, then race back.
  WHOLE,
  { ...WHOLE, f: 2970, x: 12160, zoom: 0.165 },
  camIn(PL, 2980, 1220, -150, 1.3, 44, 0),
  camIn(PL, 2990, 1200, -170, 1.9, 46, 0),
  camIn(PL, 3000, 1200, -170, 1.5, 38, 0),
];

/* ------------------------------------------------------------------ ground */

const GRID = (() => {
  let d = "";
  const hl = PITCH_L / 2;
  const hw = PITCH_W / 2;
  for (let i = 0; i <= 10; i++) {
    const x = -hl + (PITCH_L / 10) * i;
    d += `M ${x} ${-hw - 300} V ${hw + 300} `;
  }
  for (let j = 0; j <= 8; j++) {
    const y = -hw - 300 + ((PITCH_W + 600) / 8) * j;
    d += `M ${-hl - 300} ${y} H ${hl + 300} `;
  }
  return d;
})();

const Ground18: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const fl = T.flight(f);
  const n = Math.max(2, Math.ceil(fl * (BLUE_ARC.length - 1)) + 1);
  const e = T.exit(f);
  const trail: Point[] = [];
  for (let g = 2936; g <= Math.min(f, KICK); g += 1) {
    const p = positionAt(MESSI_22, g);
    trail.push([p.x, p.y]);
  }
  const blueRun = (1 - T.merge(f)) * ramp(f, 2936, 2940);
  return (
    <>
      <MapGround camera={camera} placement={GLOBE} continents={["southAmerica", "fuego", "afroEurasia"]} opacity={T.map(f)} graticule={0.35} clipId="g18" />
      <SheetGround camera={camera} pl={IDENTITY} opacity={T.map(f) * (1 - ramp(f, 2912, 2922))}>
        <path d={`M ${BLUE_ARC.slice(0, n).map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" L ")}`} fill="none" stroke={PALETTE.skyBlue} strokeWidth={3.4} strokeLinecap="round" />
      </SheetGround>
      <SheetGround camera={camera} pl={PL} opacity={1 - e}>
        <path d={GRID} stroke={PALETTE.skyBlue} strokeWidth={1.2} opacity={0.7 * T.grid(f)} fill="none" />
        <g opacity={T.pitch(f)}>
          <PitchGround draw={T.pitch(f)} fill={T.pitch(f)} />
        </g>
        {trail.length > 1 && blueRun > 0.002 ? (
          <path d={`M ${trail.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" L ")}`} fill="none" stroke={PALETTE.skyBlue} strokeWidth={4} strokeLinecap="round" opacity={blueRun} />
        ) : null}
      </SheetGround>
    </>
  );
};

const items18 = (ctx: FilmCtx): StageItem[] => {
  const { f } = ctx;
  if (f < 2912) {
    return [];
  }
  const p = ctx.proj(PL);
  const out: StageItem[] = [];
  const go = ramp(f, 2916, 2930) * (1 - T.exit(f));
  out.push({ key: "goalE", y: -1, depth: 1, node: <Goal p={p} side={1} ripple={T.net(f)} opacity={go} /> });
  out.push({ key: "goalW", y: -1, depth: 1, node: <Goal p={p} side={-1} ripple={0} opacity={go} /> });
  const b = ballAt(f);
  if (b) {
    out.push({ key: "ball", y: b.y + 0.5, depth: 1, node: <Ball p={p} x={b.x} y={b.y} h={b.h} opacity={1 - ramp(f, 2956, 2962)} /> });
  }
  const t = T.trophy(f);
  if (t > 0.002 && f < 2992) {
    out.push({ key: "trophy22", y: TROPHY_AT[1], depth: 1, node: <WorldCupTrophy p={p} x={TROPHY_AT[0]} y={TROPHY_AT[1]} s={1.4} lift={0} gold={1} opacity={t * (1 - ramp(f, 2986, 2992))} /> });
  }
  out.push(
    ...crowdItems({
      key: "stands22",
      p,
      members: STANDS,
      look: { u: 7, tall: 3.4, shirts: [PALETTE.skyBlue, PALETTE.paperWarm, mixColor(PALETTE.grayBlue, PALETTE.skyBluePale, 0.4), PALETTE.deepBlueSoft], flags: 0.9 },
      state: { presence: T.crowd(f), excite: T.excite(f), opacity: 1 - T.exit(f) },
      f,
      bands: 8,
    }),
  );
  out.push(...actorItems(ctx, PL, [b1, b2, MESSI_22, ...team, ...opponents]));
  return out;
};

const Overlay18: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const lab = win(f, 2920, 2932, 2950, 2956) + win(f, 2978, 2986, 2998, 3008);
  const past = T.past(f);
  const anth = win(f, 2986, 2996, 3012, 3022);
  return (
    <>
      <At x={168} y={96} id="label.2022">
        <DateText text="QATAR · 2022" size={96} o={lab} enter={ramp(f, 2920, 2932)} />
        <EventText lines={["ARGENTINA · CAMPEÓN DEL MUNDO"]} o={lab} enter={ramp(f, 2924, 2936)} tracking={0.14} />
        <EventText lines={["MESSI · 10"]} o={lab} enter={ramp(f, 2928, 2940)} tracking={0.2} tone="soft" size={24} />
      </At>
      <MapLabel camera={camera} anchor={toWorld(PITCH86, [150, 230])} lines={["1986"]} o={past} size={30} tone="gold" dy={-54} tracking={0.08} />
      <MapLabel camera={camera} anchor={LUSAIL_W} lines={["2022"]} o={past} size={30} tone="gold" dy={-60} tracking={0.08} />
      <At x={960} y={880} align="center" id="label.36">
        <EventText lines={["1986 → 2022 · 36 AÑOS"]} o={past} size={36} tone="deep" tracking={0.16} mt={0} />
      </At>
      <At x={1752} y={820} align="right" id="anthem.conseguir">
        <AnthemText lines={["…QUE SUPIMOS", "CONSEGUIR"]} o={anth} reveal={ramp(f, 2986, 3006)} align="right" />
      </At>
    </>
  );
};

export const STAGES_18: readonly FilmStage[] = [{ id: "s18", from: 2882, to: 3014, Ground: Ground18, items: items18, Overlay: Overlay18 }];

/* ------------------------------------------------------------- memory line */

export const ERA_18: LineEra = {
  id: "final2022",
  from: 2892,
  to: 2999,
  evaluate: (f) => {
    const gold = PALETTE.goldMuted;
    const buried = mixColor(gold, PALETTE.paperWarm, 0.3);
    const merge = T.merge(f);
    const past = T.past(f);
    const fl = T.flight(f);
    const run = ramp(f, 2936, KICK + 3);
    const ranges: VisibleRange[] = [];
    // The whole past line (1986 → 2021) appears only in the pullback.
    const pastO = past;
    if (pastO > 0.002) {
      ranges.push({ start: 0, end: sOf(S.F[0]), opacity: 0.95 * pastO, color: gold });
    }
    ranges.push({ start: sOf(S.E[0]), end: sOf(S.E[1]), opacity: 0.6 * (1 - ramp(f, 2900, 2916)) * (1 - pastO), color: gold });
    ranges.push({ start: sOf(S.F[0]), end: lerp(sOf(S.F[0] + 3), sOf(S.F[1]), fl), opacity: 0.92, color: gold });
    if (run > 0) {
      ranges.push({ start: sOf(S.G[0]), end: lerp(sOf(S.G[0]) + 0.001, 1, run), opacity: lerp(0.5, 0.95, merge), color: mixColor(buried, gold, merge), dash: merge < 0.5 ? [5, 9] : undefined });
    }
    // Earned gold core: the merged line, and the whole 36 years in the pullback.
    const core = merge > 0.01 ? [{ start: past > 0.02 ? 0 : sOf(S.F[0]), end: 1, opacity: merge }] : [];
    return { points: LATE, ranges, head: null, core };
  },
};
