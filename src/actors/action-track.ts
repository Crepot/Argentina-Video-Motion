import { EASES } from "../animation/easing";
import { clamp01, progress } from "../animation/interpolate-clamped";
import type { EaseId } from "../types/camera";
import {
  celebrateRunPose,
  cheerPose,
  commandGesturePose,
  divePose,
  flagHoldPose,
  gaitPose,
  guardPose,
  kickPose,
  liftPose,
  standPose,
  strideFor,
  type GaitStyle,
} from "./rig/poses";
import { lerpPose, type Pose } from "./rig/skeleton";
import type { DetailLevel } from "./ActorRig2D";
import type { BuildId, WardrobeId } from "./rig/wardrobe";

/**
 * ActorTrack (spec §6, §9.14 ActionTrackPlayer). Every visible person is
 * data: position keys on the atlas ground, action keys, life range. The
 * evaluator is a pure function of the global frame; locomotion phase comes
 * from distance travelled, so feet never slide and no state accumulates.
 */
export type ActionKind =
  | GaitStyle
  | "stand"
  | "guard"
  | "gesture"
  | "cheer"
  | "celebrateRun"
  | "kick"
  | "dive"
  | "lift"
  | "flag";

export interface PosKey {
  f: number;
  x: number;
  y: number;
  /** Ease of the segment that starts at this key. */
  ease?: EaseId;
}

export interface ActionKey {
  f: number;
  action: ActionKind;
  facing?: 1 | -1;
  breadth?: number;
  /** Windowed actions (gesture, kick, dive, lift, flag): frames to complete. */
  dur?: number;
  /** Blend frames from the previous action (default 6). */
  blend?: number;
  /** Cheer/celebration amount. */
  amount?: number;
}

export type EnterMode = "rise" | "fade" | "none";
export type ExitMode = "fold" | "fade" | "absorb" | "none";

export interface ActorTrack {
  id: string;
  wardrobe: WardrobeId;
  build?: BuildId;
  /** World units per local rig unit (0.8 → an 80-unit-tall figure). */
  scale: number;
  /** Plane depth: 1 = ground plane, > 1 foreground plane. */
  depth?: number;
  detail: DetailLevel;
  tone?: number;
  seed: number;
  role: "primary" | "secondary" | "context";
  pos: readonly PosKey[];
  actions: readonly ActionKey[];
  life: {
    from: number;
    to: number;
    enter?: EnterMode;
    enterDur?: number;
    exit?: ExitMode;
    exitDur?: number;
  };
  held?: { from: number; to: number; prop: "trophy" };
}

export interface ActorFrame {
  id: string;
  visible: boolean;
  x: number;
  y: number;
  facing: 1 | -1;
  pose: Pose;
  /** Height factor (0 = folded into a ground mark, 1 = standing). */
  rise: number;
  opacity: number;
  /** Absorption progress for exit 'absorb' (figure → control bars). */
  absorb: number;
  clothPhase: number;
  held: "trophy" | null;
}

const segProgress = (f: number, a: PosKey, b: PosKey) =>
  EASES[a.ease ?? "linearTravel"](progress(f, a.f, b.f));

export const positionAt = (track: ActorTrack, f: number) => {
  const k = track.pos;
  if (f <= k[0].f) {
    return { x: k[0].x, y: k[0].y, dist: 0, vx: 0 };
  }
  let dist = 0;
  for (let i = 0; i < k.length - 1; i++) {
    const a = k[i];
    const b = k[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (f < b.f) {
      const t = segProgress(f, a, b);
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        dist: dist + len * t,
        vx: b.x - a.x,
      };
    }
    dist += len;
  }
  const last = k[k.length - 1];
  return { x: last.x, y: last.y, dist, vx: 0 };
};

const GAIT_KINDS: readonly ActionKind[] = [
  "walk",
  "stroll",
  "march",
  "jog",
  "run",
  "wind",
  "retreat",
];

const poseFor = (
  key: ActionKey,
  f: number,
  dist: number,
  track: ActorTrack,
): Pose => {
  const seedPhase = (track.seed % 97) / 97;
  const breath = f / 84 + seedPhase;
  const b = key.breadth;
  const win = key.dur ? clamp01((f - key.f) / key.dur) : 1;
  if ((GAIT_KINDS as readonly string[]).includes(key.action)) {
    const style = key.action as GaitStyle;
    const stride = strideFor(style) * track.scale;
    return gaitPose(dist / stride + seedPhase, style, b ?? 0.3);
  }
  switch (key.action) {
    case "stand":
      return standPose(breath, b ?? 0.4);
    case "guard":
      return guardPose(breath, b ?? 0.55);
    case "gesture":
      return commandGesturePose(win, breath);
    case "cheer":
      return cheerPose(f / 17 + seedPhase, key.amount ?? 1, b ?? 0.8);
    case "celebrateRun":
      return celebrateRunPose(
        dist / (strideFor("jog") * track.scale) + seedPhase,
        key.amount ?? 1,
      );
    case "kick":
      return kickPose(win);
    case "dive":
      return divePose(win);
    case "lift":
      return liftPose(win, breath);
    case "flag":
      return flagHoldPose(win, breath);
    default:
      return standPose(breath, b ?? 0.4);
  }
};

const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

export const evaluateActor = (track: ActorTrack, f: number): ActorFrame => {
  const { life } = track;
  const pos = positionAt(track, f);
  const hidden: ActorFrame = {
    id: track.id,
    visible: false,
    x: pos.x,
    y: pos.y,
    facing: 1,
    pose: standPose(0),
    rise: 0,
    opacity: 0,
    absorb: 0,
    clothPhase: 0,
    held: null,
  };
  if (f < life.from || f > life.to) {
    return hidden;
  }
  const acts = track.actions;
  let idx = 0;
  while (idx < acts.length - 1 && f >= acts[idx + 1].f) {
    idx++;
  }
  const cur = acts[idx];
  let pose = poseFor(cur, f, pos.dist, track);
  const blend = cur.blend ?? 6;
  if (idx > 0 && f < cur.f + blend) {
    const prev = poseFor(acts[idx - 1], f, pos.dist, track);
    pose = lerpPose(prev, pose, smooth((f - cur.f) / blend));
  }
  let facing: 1 | -1 = 1;
  for (let i = idx; i >= 0; i--) {
    if (acts[i].facing) {
      facing = acts[i].facing!;
      break;
    }
  }

  const enterDur = life.enterDur ?? 12;
  const exitDur = life.exitDur ?? 14;
  const enterT = smooth((f - life.from) / enterDur);
  const exitT = smooth((life.to - f) / exitDur);
  const enter = life.enter ?? "rise";
  const exit = life.exit ?? "fold";
  let rise = 1;
  let opacity = 1;
  if (enter === "rise") {
    rise *= enterT;
    opacity *= clamp01(enterT * 3);
  } else if (enter === "fade") {
    opacity *= enterT;
  }
  let absorb = 0;
  if (exit === "fold") {
    rise *= exitT;
    opacity *= clamp01(exitT * 3);
  } else if (exit === "fade") {
    opacity *= exitT;
  } else if (exit === "absorb") {
    absorb = 1 - exitT;
  }
  const held =
    track.held && f >= track.held.from && f <= track.held.to
      ? track.held.prop
      : null;
  return {
    id: track.id,
    visible: opacity > 0.004,
    x: pos.x,
    y: pos.y,
    facing,
    pose,
    rise,
    opacity,
    absorb,
    clothPhase: pos.dist / 60 + f / 45,
    held,
  };
};

/* ---------------------------------------------------------- formations */

/**
 * ArmyColumn / ActorGroup helper: members march in files along the same
 * polyline with seeded phase and a fixed spacing; one formation, many rigs.
 */
export const columnTracks = (opts: {
  idPrefix: string;
  wardrobe: WardrobeId;
  files: number;
  ranks: number;
  /** Lead position keys (the column head). */
  head: readonly PosKey[];
  rankGap: number;
  fileGap: number;
  scale: number;
  detail: DetailLevel;
  tone?: number;
  seed: number;
  action: ActionKind;
  /** Per-member hold actions appended after the march. */
  after?: (i: number, rank: number, file: number) => ActionKey[];
  /** Per-member offset of the final position (dispersal to posts). */
  post?: (
    i: number,
    rank: number,
    file: number,
  ) => { f0: number; f1: number; dx: number; dy: number } | null;
  life: ActorTrack["life"];
  facing?: 1 | -1;
}): ActorTrack[] => {
  const out: ActorTrack[] = [];
  let i = 0;
  const dirX = Math.sign(
    opts.head[opts.head.length - 1].x - opts.head[0].x,
  ) as 1 | -1;
  for (let r = 0; r < opts.ranks; r++) {
    for (let fl = 0; fl < opts.files; fl++) {
      const dx = -r * opts.rankGap * (dirX || 1);
      const dy = (fl - (opts.files - 1) / 2) * opts.fileGap;
      const jitter = ((opts.seed * (i + 3) * 7919) % 13) - 6;
      const pos: PosKey[] = opts.head.map((k) => ({
        ...k,
        x: k.x + dx + jitter * 0.4,
        y: k.y + dy,
      }));
      const post = opts.post?.(i, r, fl);
      if (post) {
        const last = pos[pos.length - 1];
        pos.push({ f: post.f0, x: last.x, y: last.y, ease: "institutionalLock" });
        pos.push({ f: post.f1, x: last.x + post.dx, y: last.y + post.dy });
      }
      out.push({
        id: `${opts.idPrefix}.${i}`,
        wardrobe: opts.wardrobe,
        scale: opts.scale * (1 + (((i * 37) % 7) - 3) * 0.012),
        detail: opts.detail,
        tone: opts.tone,
        seed: opts.seed + i * 13,
        role: "context",
        pos,
        actions: [
          { f: opts.head[0].f, action: opts.action, facing: opts.facing ?? dirX },
          ...(opts.after?.(i, r, fl) ?? []),
        ],
        life: opts.life,
      });
      i++;
    }
  }
  return out;
};
