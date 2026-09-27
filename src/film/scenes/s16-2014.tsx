import React from "react";
import { clamp01, lerp } from "../../animation/interpolate-clamped";
import type { ActorTrack } from "../../actors/action-track";
import { positionAt } from "../../actors/action-track";
import { projectWorldPoint } from "../../camera/evaluate-camera";
import { interpolatePoints } from "../../paths/interpolate-path";
import { resamplePolyline } from "../../paths/normalize-path";
import { mixColor, PALETTE } from "../../theme/palette";
import type { CameraState } from "../../types/camera";
import type { Point, VisibleRange } from "../../types/paths";
import { A, P, actor, actorItems } from "../actors";
import { K, ramp, win } from "../anim";
import { MP, SOUTH_AMERICA } from "../data/geo";
import { crowdItems } from "../draw/crowd";
import { Ball, Goal, PitchGround, standsCrowd, WorldCupTrophy } from "../draw/football";
import { At, DateText, EventText } from "../draw/labels";
import { leafOutline } from "../draw/laurel";
import { SheetGround } from "../draw/sheet";
import { camIn, type CamKey } from "../film-camera";
import { GLOBE, MARK_2014, PITCH14 } from "../late-world";
import { stateParts } from "../line";
import { toWorld } from "../space";
import type { FilmCtx, FilmStage, LineEra, StageItem } from "../types";
import { LEAF_TO_CONTINENT } from "./laurel-stage";
import { THREAD_B } from "./s14-s15-city";

/**
 * Scene 16 · Brasil 2014 · frames 2700–2804. The new-century stem is the
 * halfway line; the 2014 tick is the centre mark. Messi (dark away kit, as
 * in the final) receives, runs diagonally, meets three defenders and the
 * goalkeeper, shoots — the ball passes just beneath the buried gold thread
 * and wide of the post. The body slows and stops; nothing shatters. The
 * right laurel begins in pale blue and stops; its last leaf turns into the
 * outline of South America.
 */
const PL = PITCH14;

const T = {
  pitch: K([
    [2688, 0, "atlasDrift"],
    [2712, 1],
  ]),
  fill: K([
    [2692, 0, "atlasDrift"],
    [2716, 1],
  ]),
  crowd: K([
    [2700, 0, "atlasDrift"],
    [2730, 0.75],
  ]),
  excite: K([
    [2700, 0.15],
    [2750, 0.5],
    [2758, 0.95, "restrainedImpact"],
    [2766, 0.2, "atlasDrift"],
    [2790, 0.05],
  ]),
  exit: K([
    [2772, 0, "atlasDrift"],
    [2786, 1],
  ]),
  miss: (f: number) => win(f, 2746, 2754, 2766, 2778),
  morph: K([
    [2788, 0, "atlasDrift"],
    [2806, 1],
  ]),
};

/* ------------------------------------------------------------------ actors */

const KICK = 2756;
export const MESSI_14: ActorTrack = actor(
  "historical.messi.2014",
  "messi2014",
  1.2,
  [P(2700, 0, 4), P(2716, 250, -110), P(2730, 520, -220), P(2744, 800, -290), P(KICK, 1060, -306), P(2768, 1180, -282, "atlasDrift"), P(2782, 1230, -266, "atlasDrift")],
  [A(2700, "dribble", { facing: 1, amount: 14 }), A(KICK - 2, "kick", { dur: 10, blend: 2 }), A(2766, "jog", { facing: 1 }), A(2776, "stand", { facing: 1, breadth: 0.75 })],
  { from: 2700, to: 2786, enter: "none", exit: "fold", exitDur: 10 },
  { build: "athlete", detail: "hero", role: "primary" },
);

const defender = (id: string, from: Point, lunge: Point, fAt: number, after: Point): ActorTrack =>
  actor(id, "opponentLight", 1.2, [P(fAt - 14, from[0], from[1]), P(fAt, lunge[0], lunge[1], "institutionalLock"), P(fAt + 14, after[0], after[1], "atlasDrift")], [
    A(fAt - 14, "jog", { facing: -1 }),
    A(fAt - 4, "run", { facing: -1 }),
    A(fAt + 4, "retreat", { facing: 1, blend: 6 }),
  ], { from: fAt - 22, to: 2786, enter: "rise", enterDur: 10, exit: "fold", exitDur: 12 });

const opponents: ActorTrack[] = [
  defender("de14.1", [430, 40], [300, -70], 2722, [360, 40]),
  defender("de14.2", [780, -60], [660, -190], 2738, [720, -80]),
  defender("de14.3", [1170, -130], [1010, -250], 2752, [1060, -170]),
  actor("gk14", "goalkeeper", 1.2, [P(2730, 1545, -10), P(2754, 1480, -110, "atlasDrift"), P(2762, 1500, -150, "restrainedImpact")], [
    A(2730, "stand", { facing: -1, breadth: 0.8 }),
    A(2748, "stroll", { facing: -1 }),
    A(2755, "dive", { facing: -1, dur: 10, blend: 3 }),
  ], { from: 2726, to: 2786, enter: "rise", exit: "fold", exitDur: 12 }),
];

const teammates: ActorTrack[] = [0, 1, 2].map((i) =>
  actor(`arg14.${i}`, "argentina2014", 1.2, [P(2700, -260 + i * 240, 380 - i * 330), P(2770, 420 + i * 300, 300 - i * 360, "atlasDrift")], [A(2700, "jog", { facing: 1 }), A(2770, "stand", { facing: 1 })], {
    from: 2700,
    to: 2786,
    enter: "rise",
    exit: "fold",
    exitDur: 12,
  }),
);

const STANDS = standsCrowd(2014, 1900, 1360, 4);

const ballAt = (f: number): { x: number; y: number; h: number } => {
  if (f < KICK) {
    const p = positionAt(MESSI_14, f);
    return { x: p.x + 26, y: p.y + 8, h: 0 };
  }
  // The shot: just beneath the gold thread, just wide of the near post.
  const t = clamp01((f - KICK) / 10);
  return { x: lerp(1086, 1700, t), y: lerp(-300, -150, t), h: Math.sin(t * Math.PI) * 26 };
};

/* ---------------------------------------------------------------- camera */

export const KEYS_16: readonly CamKey[] = [
  camIn(PL, 2706, 70, -20, 1.62, 46, 0),
  camIn(PL, 2720, 320, -130, 1.66, 50, 0),
  camIn(PL, 2734, 610, -220, 1.7, 52, 0),
  camIn(PL, 2748, 900, -280, 1.72, 52, 0),
  // Slight overshoot toward the trophy, then back to the stationary 10.
  camIn(PL, 2762, 1300, -300, 1.62, 50, 0),
  camIn(PL, 2774, 1190, -262, 1.74, 50, 0),
  camIn(PL, 2784, 1190, -250, 1.62, 46, 0),
];

/* ------------------------------------------------------------------ ground */

const Ground16: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const e = T.exit(f);
  const trail: Point[] = [];
  for (let g = 2700; g <= Math.min(f, KICK); g += 2) {
    const p = positionAt(MESSI_14, g);
    trail.push([p.x, p.y]);
  }
  const b = ballAt(f);
  return (
    <SheetGround camera={camera} pl={PL} opacity={1 - e}>
      <PitchGround draw={T.pitch(f)} fill={T.fill(f)} />
      {trail.length > 1 ? (
        <path d={`M ${trail.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" L ")}`} fill="none" stroke={PALETTE.skyBlue} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      {f > KICK ? <path d={`M 1086 -300 L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`} fill="none" stroke={PALETTE.skyBlue} strokeWidth={3} strokeDasharray="10 8" /> : null}
    </SheetGround>
  );
};

const items16 = (ctx: FilmCtx): StageItem[] => {
  const { f } = ctx;
  const p = ctx.proj(PL);
  const out: StageItem[] = [];
  const go = ramp(f, 2698, 2712) * (1 - T.exit(f));
  out.push({ key: "goalE", y: -1, depth: 1, node: <Goal p={p} side={1} ripple={0} opacity={go} /> });
  out.push({ key: "goalW", y: -1, depth: 1, node: <Goal p={p} side={-1} ripple={0} opacity={go} /> });
  if (f <= 2772) {
    const b = ballAt(f);
    out.push({ key: "ball", y: b.y + 0.5, depth: 1, node: <Ball p={p} x={b.x} y={b.y} h={b.h} opacity={1 - ramp(f, 2766, 2772)} /> });
  }
  // Distant trophy beyond the focal plane: low-opacity, physically far.
  out.push({ key: "trophy14", y: -420, depth: 1, node: <WorldCupTrophy p={p} x={1900} y={-420} s={1.5} lift={0} gold={0.55} opacity={0.5 * ramp(f, 2716, 2736) * (1 - T.exit(f))} /> });
  out.push(
    ...crowdItems({
      key: "stands14",
      p,
      members: STANDS,
      look: { u: 7, tall: 3.4, shirts: [PALETTE.skyBlue, PALETTE.paperWarm, mixColor(PALETTE.grayBlue, PALETTE.skyBluePale, 0.4), PALETTE.deepBlueSoft], flags: 0.6 },
      state: { presence: T.crowd(f), excite: T.excite(f), opacity: 1 - T.exit(f) },
      f,
      bands: 8,
    }),
  );
  out.push(...actorItems(ctx, PL, [MESSI_14, ...opponents, ...teammates]));
  return out;
};

/* ---------------------------------------------------------------- overlay */

const SA_LOCAL = resamplePolyline([...SOUTH_AMERICA.map(MP), MP(SOUTH_AMERICA[0])], 64);

/** The last pale leaf of the right branch rotates and grows into South America. */
export const LeafToContinent: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const m = T.morph(f);
  if (m <= 0 || f > 2816) {
    return null;
  }
  const leaf = leafOutline(960, 500, 430, 340, 1, LEAF_TO_CONTINENT, 1, 64);
  const sa = SA_LOCAL.map((q) => projectWorldPoint(toWorld(GLOBE, q), camera));
  const pts = interpolatePoints(leaf, sa, m);
  const o = 1 - ramp(f, 2806, 2816);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} data-id="leaf.southAmerica">
      <path
        d={`M ${pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" L ")} Z`}
        fill={mixColor(PALETTE.skyBluePale, PALETTE.paperWarm, 0.45)}
        fillOpacity={1 - m * 0.6}
        stroke={PALETTE.skyBlue}
        strokeWidth={lerp(1.4, 2.4, m)}
        opacity={o}
      />
    </svg>
  );
};

const Overlay16: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const lab = win(f, 2716, 2728, 2780, 2792);
  return (
    <>
      <At x={168} y={96} id="label.2014">
        <DateText text="BRASIL · 2014" size={96} o={lab} enter={ramp(f, 2716, 2728)} />
        <EventText lines={["FINAL DEL MUNDO"]} o={lab} enter={ramp(f, 2720, 2732)} tracking={0.16} />
        <EventText lines={["MESSI · 10"]} o={lab} enter={ramp(f, 2724, 2736)} tracking={0.2} tone="soft" size={24} />
      </At>
      <LeafToContinent f={f} camera={camera} />
    </>
  );
};

export const STAGES_16: readonly FilmStage[] = [{ id: "s16", from: 2686, to: 2816, Ground: Ground16, items: items16, Overlay: Overlay16 }];

/* ------------------------------------------------------------- memory line */

/** The buried thread crosses the 2014 pitch toward the distant trophy (local). */
const THREAD14_LOCAL: readonly Point[] = [
  [0, 0],
  [300, -400],
  [700, -450],
  [1000, -350],
  [1300, -335],
  [1600, -390],
  [1900, -420],
];
export const THREAD14_WORLD: readonly Point[] = THREAD14_LOCAL.map((q) => toWorld(PL, q));
/** Same topology as THREAD_B: the hidden street samples become the pitch part (trophy → centre). */
const THREAD_16: readonly Point[] = stateParts([
  [[...THREAD14_WORLD].reverse(), 70],
  [[THREAD_B[70], MARK_2014], 26],
]);
const S_CENTER = 69 / 95;
/** s on THREAD_16 nearest a local x on the pitch part. */
const sAtLocalX = (x: number) => {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < 70; i++) {
    const d = Math.abs(THREAD_16[i][0] - toWorld(PL, [x, 0])[0]);
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best / 95;
};
const S_MISS_A = sAtLocalX(1360);
const S_MISS_B = sAtLocalX(900);

export const ERA_16: LineEra = {
  id: "thread2014",
  from: 2700,
  to: 2804,
  evaluate: (f) => {
    const m = ramp(f, 2700, 2708);
    const pts = interpolatePoints(THREAD_B, THREAD_16, m);
    const out = 1 - ramp(f, 2780, 2794);
    const reveal = ramp(f, 2704, 2750);
    const buried = mixColor(PALETTE.goldMuted, PALETTE.paperWarm, 0.35);
    const ranges: VisibleRange[] = [
      { start: S_CENTER + 1 / 95, end: 1, opacity: 0.42 * (1 - ramp(f, 2702, 2720)), color: buried, dash: [5, 9] },
      { start: Math.max(0.001, S_CENTER * (1 - reveal)), end: S_CENTER, opacity: 0.5 * out, color: buried, dash: [5, 9] },
    ];
    const miss = T.miss(f) * out;
    if (miss > 0.002) {
      // The thread surfaces where the run comes within a few pixels of it.
      ranges.push({ start: S_MISS_A, end: S_MISS_B, opacity: 0.9 * miss, color: PALETTE.goldMuted });
    }
    return { points: pts, ranges, head: null, core: [] };
  },
};
