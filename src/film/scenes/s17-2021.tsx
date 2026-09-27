import React from "react";
import { clamp01, lerp } from "../../animation/interpolate-clamped";
import type { ActorTrack } from "../../actors/action-track";
import { positionAt } from "../../actors/action-track";
import { interpolatePoints } from "../../paths/interpolate-path";
import { resamplePolyline } from "../../paths/normalize-path";
import { mixColor, PALETTE } from "../../theme/palette";
import type { CameraState } from "../../types/camera";
import type { Point, VisibleRange } from "../../types/paths";
import { A, P, actor, actorItems } from "../actors";
import { K, ramp, win } from "../anim";
import { MP, SOUTH_AMERICA } from "../data/geo";
import { crowdItems } from "../draw/crowd";
import { Ball, Goal, PitchGround, PITCH_L, PITCH_W, standsCrowd } from "../draw/football";
import { At, DateText, EventText, MapLabel } from "../draw/labels";
import { MapGround } from "../draw/map";
import { SheetGround } from "../draw/sheet";
import { camIn, type CamKey } from "../film-camera";
import { G, GLOBE, PITCH21, RIO_W } from "../late-world";
import { IDENTITY, toWorld } from "../space";
import type { FilmCtx, FilmStage, LineEra, StageItem } from "../types";
import { LATE, ROUTE21, S, sOf } from "./late-line";

/**
 * Scene 17 · Copa América 2021 · frames 2805–2891. South America is the
 * former laurel leaf. A sky-blue route runs from Buenos Aires to Rio; the
 * 1986 gold thread resurfaces beside it without merging. The continent
 * outline opens into the pitch boundary; players rise from the route nodes:
 * three passes, a long ball, a chip — then the team converges into one
 * circle. Several right-branch leaves earn gold; one small gold node marks
 * the tournament (not the World Cup trophy).
 */
const PL = PITCH21;

const T = {
  map: K([
    [2798, 0, "atlasDrift"],
    [2810, 1],
    [2828, 1, "atlasDrift"],
    [2842, 0],
  ]),
  route: K([
    [2808, 0, "atlasDrift"],
    [2824, 1],
  ]),
  open: K([
    [2822, 0, "atlasDrift"],
    [2836, 1],
  ]),
  pitch: K([
    [2826, 0, "atlasDrift"],
    [2842, 1],
  ]),
  crowd: K([
    [2832, 0, "atlasDrift"],
    [2850, 0.9],
  ]),
  excite: K([
    [2840, 0.3],
    [2860, 0.5],
    [2862, 1, "restrainedImpact"],
    [2880, 0.8],
  ]),
  star: (f: number) => win(f, 2868, 2876, 2888, 2896),
  net: K([
    [2861, 0],
    [2863, 1, "restrainedImpact"],
    [2876, 0],
  ]),
  exit: K([
    [2880, 0, "atlasDrift"],
    [2894, 1],
  ]),
};

/* ------------------------------------------------------------------ actors */

const W = 1.0;
const a1 = actor("arg21.a1", "argentinaKit", W, [P(2832, 420, 240), P(2842, 520, 250, "atlasDrift")], [A(2832, "jog", { facing: 1 }), A(2839, "kick", { dur: 8, blend: 2 }), A(2848, "jog", { facing: 1 })], {
  from: 2830,
  to: 2894,
  enter: "rise",
  exit: "fold",
});
const a2 = actor("arg21.a2", "argentinaKitB", W, [P(2832, 760, -60), P(2846, 830, -110, "atlasDrift"), P(2866, 1210, -150)], [A(2832, "jog", { facing: 1 }), A(2844, "kick", { dur: 8, blend: 2 }), A(2852, "run", { facing: 1 }), A(2866, "embrace")], {
  from: 2830,
  to: 2894,
  enter: "rise",
  exit: "fold",
});
export const MESSI_21: ActorTrack = actor(
  "historical.messi.2021",
  "messi2022",
  1.05,
  [P(2832, 900, 260), P(2850, 1010, 170, "atlasDrift"), P(2866, 1290, -70)],
  [A(2832, "jog", { facing: 1 }), A(2849, "kick", { dur: 8, blend: 2 }), A(2856, "run", { facing: 1 }), A(2866, "embrace")],
  { from: 2830, to: 2894, enter: "rise", exit: "fold" },
  { build: "athlete", detail: "hero", role: "primary" },
);
const a3 = actor("arg21.a3", "argentinaKit", W, [P(2832, 1060, -420), P(2854, 1300, -250), P(2868, 1370, -120)], [A(2832, "run", { facing: 1 }), A(2854, "kick", { dur: 10, blend: 2 }), A(2862, "celebrateRun", { amount: 1, facing: -1 }), A(2868, "embrace")], {
  from: 2830,
  to: 2894,
  enter: "rise",
  exit: "fold",
});
const CIRCLE: Point = [1300, -120];
const circleMates: ActorTrack[] = [0, 1, 2, 3].map((i) => {
  const a = (i / 4) * Math.PI * 2 + 0.6;
  return actor(`arg21.c${i}`, i % 2 ? "argentinaKitB" : "argentinaKit", W, [P(2852, 700 + i * 90, 380 - i * 200), P(2870, CIRCLE[0] + Math.cos(a) * 70, CIRCLE[1] + Math.sin(a) * 50, "atlasDrift")], [
    A(2852, "run", { facing: 1 }),
    A(2870, "embrace"),
  ], { from: 2850, to: 2894, enter: "rise", exit: "fold" });
});
const opponents: ActorTrack[] = [
  actor("opp21.1", "opponentLight", W, [P(2836, 980, 40), P(2846, 880, -40, "institutionalLock"), P(2860, 900, 40)], [A(2836, "jog", { facing: -1 }), A(2843, "run", { facing: -1 }), A(2850, "retreat", { facing: 1 })], { from: 2832, to: 2894, enter: "rise", exit: "fold" }),
  actor("opp21.2", "opponentLight", W, [P(2842, 1340, -60), P(2854, 1250, -180, "institutionalLock"), P(2866, 1280, -60)], [A(2842, "jog", { facing: -1 }), A(2850, "run", { facing: -1 }), A(2858, "stand", { facing: -1 })], { from: 2838, to: 2894, enter: "rise", exit: "fold" }),
  actor("gk21", "goalkeeper", W, [P(2840, 1545, 0), P(2856, 1460, -60, "atlasDrift"), P(2862, 1470, -40)], [A(2840, "stand", { facing: -1, breadth: 0.8 }), A(2852, "stroll", { facing: -1 }), A(2858, "stand", { facing: -1 })], { from: 2836, to: 2894, enter: "rise", exit: "fold" }),
];

const STANDS = standsCrowd(2021, 1900, 1360, 3, 60);

type Seg = readonly [number, number, Point | ActorTrack, Point | ActorTrack, number];
const feet = (t: ActorTrack, f: number): Point => {
  const p = positionAt(t, f);
  return [p.x + 22, p.y + 8];
};
/** Ball path: [from, to, origin, target, arc height]. */
const BALL: readonly Seg[] = [
  [2832, 2840, a1, a1, 0],
  [2840, 2844, a1, a2, 0],
  [2844, 2845, a2, a2, 0],
  [2845, 2849, a2, MESSI_21, 0],
  [2849, 2851, MESSI_21, MESSI_21, 0],
  [2851, 2855, MESSI_21, a3, 24],
  [2855, 2856, a3, a3, 0],
  [2856, 2862, a3, [1600, -40], 70],
  [2862, 2872, [1600, -40], [1630, -40], 0],
];
const isPt = (v: Point | ActorTrack): v is Point => Array.isArray(v);
const ballAt = (f: number): { x: number; y: number; h: number } | null => {
  for (const [fa, fb, o, t, h] of BALL) {
    if (f >= fa && f < fb) {
      if (!isPt(o) && o === t) {
        const q = feet(o, f);
        return { x: q[0], y: q[1], h: 0 };
      }
      const k = (f - fa) / (fb - fa);
      const po = isPt(o) ? o : feet(o, fa);
      const pt = isPt(t) ? t : feet(t, fb);
      return { x: lerp(po[0], pt[0], k), y: lerp(po[1], pt[1], k), h: Math.sin(k * Math.PI) * h };
    }
  }
  return null;
};
/** Pass lines drawn on the pitch as the ball travels (the team's geometry). */
const PASSES: readonly [number, number, ActorTrack, Point | ActorTrack][] = [
  [2840, 2844, a1, a2],
  [2845, 2849, a2, MESSI_21],
  [2851, 2855, MESSI_21, a3],
  [2856, 2862, a3, [1600, -40]],
];

/* ---------------------------------------------------------------- camera */

export const KEYS_17: readonly CamKey[] = [
  { f: 2794, x: G(58, 18)[0], y: G(58, 18)[1], zoom: 0.92, tilt: 0, rot: 0 },
  { f: 2806, x: G(58, 18)[0], y: G(58, 18)[1], zoom: 0.92, tilt: 0, rot: 0 },
  { f: 2820, x: lerp(G(58, 18)[0], RIO_W[0], 0.7), y: lerp(G(58, 18)[1], RIO_W[1], 0.7), zoom: 1.35, tilt: 0, rot: 0 },
  camIn(PL, 2832, 700, 0, 0.7, 24, 0),
  camIn(PL, 2842, 760, 40, 1.45, 48, 0),
  camIn(PL, 2850, 960, 0, 1.6, 50, 0),
  camIn(PL, 2858, 1300, -120, 1.62, 50, -2),
  camIn(PL, 2866, 1330, -110, 1.8, 52, -5),
  camIn(PL, 2876, 1310, -110, 1.9, 54, -8),
  camIn(PL, 2886, 1280, -110, 1.1, 40, -9),
];

/* ------------------------------------------------------------------ ground */

const SA_WORLD = resamplePolyline([...SOUTH_AMERICA.map((q) => toWorld(GLOBE, MP(q))), toWorld(GLOBE, MP(SOUTH_AMERICA[0]))], 72);
const PITCH_RECT = (() => {
  const hl = PITCH_L / 2 + 60;
  const hw = PITCH_W / 2 + 60;
  const c: Point[] = [
    [-hl, -hw],
    [hl, -hw],
    [hl, hw],
    [-hl, hw],
    [-hl, -hw],
  ];
  const r = resamplePolyline(c.map((q) => toWorld(PL, q)), 72);
  // Align the start so the outline opens without twisting.
  let best = 0;
  let bd = Infinity;
  for (let s = 0; s < 72; s++) {
    let d = 0;
    for (let i = 0; i < 72; i += 6) {
      const a = SA_WORLD[i];
      const b = r[(i + s) % 72];
      d += Math.hypot(a[0] - b[0], a[1] - b[1]);
    }
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return r.map((_, i) => r[(i + best) % 72]);
})();

const Ground17: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const m = T.map(f);
  const r = T.route(f);
  const open = T.open(f);
  const e = T.exit(f);
  const n = Math.max(2, Math.ceil(r * (ROUTE21.length - 1)) + 1);
  const outline = open > 0 && open < 1 ? interpolatePoints(SA_WORLD, PITCH_RECT, open) : null;
  const passes: React.ReactNode[] = [];
  for (const [fa, fb, from, to] of PASSES) {
    if (f < fa) {
      continue;
    }
    const k = clamp01((f - fa) / (fb - fa));
    const a = feet(from, fa);
    const b = isPt(to) ? to : feet(to, fb);
    passes.push(<path key={fa} d={`M ${a[0]} ${a[1]} L ${lerp(a[0], b[0], k)} ${lerp(a[1], b[1], k)}`} stroke={PALETTE.skyBlue} strokeWidth={3} strokeLinecap="round" opacity={0.9 * (1 - e)} />);
  }
  return (
    <>
      <MapGround camera={camera} placement={GLOBE} continents={["southAmerica", "fuego", "afroEurasia"]} opacity={m} graticule={0.35} clipId="g17" />
      <SheetGround camera={camera} pl={IDENTITY} opacity={1}>
        {m > 0.002 ? (
          <g opacity={m}>
            <path d={`M ${ROUTE21.slice(0, n).map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" L ")}`} fill="none" stroke={PALETTE.skyBlue} strokeWidth={3.4} strokeLinecap="round" />
            {r >= 1 ? <circle cx={RIO_W[0]} cy={RIO_W[1]} r={10} fill="none" stroke={PALETTE.skyBlue} strokeWidth={2.4} /> : null}
          </g>
        ) : null}
        {outline ? <path d={`M ${outline.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" L ")} Z`} fill="none" stroke={PALETTE.skyBlue} strokeWidth={2.4} /> : null}
      </SheetGround>
      <SheetGround camera={camera} pl={PL} opacity={T.pitch(f) * (1 - e)}>
        <PitchGround draw={T.pitch(f)} fill={T.pitch(f)} />
        {passes}
        {T.star(f) > 0.002 ? (
          <g opacity={T.star(f)}>
            <circle cx={CIRCLE[0]} cy={CIRCLE[1]} r={120} fill="none" stroke={PALETTE.goldMuted} strokeWidth={2.4} />
            <circle cx={CIRCLE[0]} cy={CIRCLE[1]} r={16} fill={PALETTE.goldMuted} />
          </g>
        ) : null}
      </SheetGround>
    </>
  );
};

const items17 = (ctx: FilmCtx): StageItem[] => {
  const { f } = ctx;
  if (f < 2826) {
    return [];
  }
  const p = ctx.proj(PL);
  const out: StageItem[] = [];
  const go = ramp(f, 2830, 2842) * (1 - T.exit(f));
  out.push({ key: "goalE", y: -1, depth: 1, node: <Goal p={p} side={1} ripple={T.net(f)} opacity={go} /> });
  const b = ballAt(f);
  if (b) {
    out.push({ key: "ball", y: b.y + 0.5, depth: 1, node: <Ball p={p} x={b.x} y={b.y} h={b.h} opacity={1 - ramp(f, 2866, 2872)} /> });
  }
  out.push(
    ...crowdItems({
      key: "stands21",
      p,
      members: STANDS,
      look: { u: 7, tall: 3.4, shirts: [PALETTE.skyBlue, PALETTE.paperWarm, mixColor(PALETTE.grayBlue, PALETTE.skyBluePale, 0.4), PALETTE.deepBlueSoft], flags: 0.5 },
      state: { presence: T.crowd(f), excite: T.excite(f), opacity: 1 - T.exit(f) },
      f,
      bands: 6,
    }),
  );
  out.push(...actorItems(ctx, PL, [a1, a2, MESSI_21, a3, ...circleMates, ...opponents]));
  return out;
};

const Overlay17: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const lab = win(f, 2812, 2824, 2878, 2890);
  return (
    <>
      <At x={168} y={96} id="label.2021">
        <DateText text="2021" size={112} o={lab} enter={ramp(f, 2812, 2824)} />
        <EventText lines={["COPA AMÉRICA"]} o={lab} enter={ramp(f, 2816, 2828)} tracking={0.16} />
        <EventText lines={["MESSI"]} o={lab} enter={ramp(f, 2820, 2832)} tracking={0.2} tone="soft" size={24} />
      </At>
      <MapLabel camera={camera} anchor={RIO_W} lines={["RÍO DE JANEIRO"]} o={0.85 * win(f, 2816, 2824, 2826, 2834)} size={15} dy={16} tone="soft" />
    </>
  );
};

export const STAGES_17: readonly FilmStage[] = [{ id: "s17", from: 2796, to: 2896, Ground: Ground17, items: items17, Overlay: Overlay17 }];

/* ------------------------------------------------------------- memory line */

const BURIED = mixColor(PALETTE.goldMuted, PALETTE.paperWarm, 0.3);

export const ERA_17: LineEra = {
  id: "copa2021",
  from: 2805,
  to: 2891,
  evaluate: (f) => {
    // The gold thread resurfaces beside the 2021 route, parallel, not merged.
    const r = ramp(f, 2810, 2826);
    const ranges: VisibleRange[] = [{ start: sOf(S.E[0]), end: lerp(sOf(S.E[0]) + 0.001, sOf(S.E[1]), r), opacity: 0.9 * ramp(f, 2806, 2812), color: mixColor(BURIED, PALETTE.goldMuted, r) }];
    const fl = ramp(f, 2884, 2891);
    if (fl > 0) {
      ranges.push({ start: sOf(S.F[0]), end: lerp(sOf(S.F[0]) + 0.001, sOf(S.F[0] + 3), fl), opacity: 0.9, color: PALETTE.goldMuted });
    }
    return { points: LATE, ranges, head: null, core: [] };
  },
};
