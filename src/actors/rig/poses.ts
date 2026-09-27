import { clamp01 } from "../../animation/interpolate-clamped";
import { lerpPose, NEUTRAL, type Pose } from "./skeleton";

/**
 * Pose library and locomotion cycles (spec §2A.7, §9.14). Cycles are closed
 * parametric curves of a phase in [0, 1); the phase always comes from the
 * distance travelled (feet never slide) or from a declared action window,
 * never from wall-clock time. Pure functions only.
 */
const TAU = Math.PI * 2;
const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
/** 0→1→0 bump over [a, b]. */
const bump = (t: number, a: number, b: number) =>
  t <= a || t >= b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI);

export type GaitStyle =
  | "walk"
  | "march"
  | "jog"
  | "run"
  | "wind"
  | "retreat"
  | "stroll";

interface GaitSpec {
  hip: number;
  knee: number;
  kneeBase: number;
  arm: number;
  elbow: number;
  elbowSwing: number;
  lean: number;
  head: number;
  bob: number;
  /** Local units travelled per full cycle for a 100-unit figure. */
  stride: number;
}

export const GAITS: Record<GaitStyle, GaitSpec> = {
  walk: { hip: 21, knee: 52, kneeBase: 6, arm: 17, elbow: 12, elbowSwing: 14, lean: 3, head: 2, bob: 0, stride: 66 },
  stroll: { hip: 16, knee: 42, kneeBase: 5, arm: 10, elbow: 10, elbowSwing: 8, lean: 1, head: 4, bob: 0, stride: 52 },
  march: { hip: 26, knee: 38, kneeBase: 3, arm: 26, elbow: 4, elbowSwing: 4, lean: 0, head: -1, bob: 0, stride: 78 },
  jog: { hip: 30, knee: 78, kneeBase: 14, arm: 30, elbow: 78, elbowSwing: 10, lean: 9, head: -3, bob: 2.4, stride: 96 },
  run: { hip: 40, knee: 96, kneeBase: 18, arm: 44, elbow: 88, elbowSwing: 12, lean: 15, head: -6, bob: 3.6, stride: 130 },
  wind: { hip: 16, knee: 46, kneeBase: 8, arm: 7, elbow: 16, elbowSwing: 6, lean: 13, head: 10, bob: 0, stride: 44 },
  retreat: { hip: 23, knee: 56, kneeBase: 7, arm: 12, elbow: 20, elbowSwing: 10, lean: 7, head: 8, bob: 0, stride: 70 },
};

/**
 * Gait at phase φ. Swing knee bends while the thigh travels forward
 * (dθ/dφ > 0), stance knee stays nearly straight; arms counter-swing.
 */
export const gaitPose = (phase: number, style: GaitStyle, breadth = 0.3): Pose => {
  const g = GAITS[style];
  const a = phase * TAU;
  const legAt = (off: number) => {
    const s = Math.sin(a + off);
    const c = Math.cos(a + off);
    const swing = Math.max(0, c);
    return {
      hip: g.hip * s,
      knee: g.kneeBase + g.knee * Math.pow(swing, 1.6),
      // Toe drops on push-off (thigh behind, moving forward), heel strikes ahead.
      foot: s < -0.35 && c > 0 ? 18 * swing : s > 0.6 && c < 0 ? -8 : 0,
    };
  };
  const n = legAt(0);
  const f = legAt(Math.PI);
  const armN = -g.arm * Math.sin(a);
  const armF = g.arm * Math.sin(a);
  return {
    lean: g.lean,
    head: g.head,
    hipN: n.hip,
    kneeN: n.knee,
    footN: n.foot,
    hipF: f.hip,
    kneeF: f.knee,
    footF: f.foot,
    shN: armN,
    elN: g.elbow + g.elbowSwing * Math.max(0, Math.sin(a + Math.PI)),
    shF: armF,
    elF: g.elbow + g.elbowSwing * Math.max(0, Math.sin(a)),
    bob: g.bob * Math.abs(Math.cos(a)),
    rot: 0,
    breadth,
  };
};

export const strideFor = (style: GaitStyle) => GAITS[style].stride;

/** Standing with a slow breath: chest and shoulders move, feet planted. */
export const standPose = (breathPhase: number, breadth = 0.4): Pose => {
  const b = Math.sin(breathPhase * TAU);
  return {
    ...NEUTRAL,
    lean: 0.6 * b,
    head: 1.2 * b,
    hipN: 3,
    hipF: -3,
    shN: -3 + b * 1.4,
    shF: 3 - b * 1.4,
    breadth,
  };
};

/** At attention / on guard: feet slightly apart, arms held. */
export const guardPose = (breathPhase: number, breadth = 0.55): Pose => {
  const b = Math.sin(breathPhase * TAU);
  return {
    ...NEUTRAL,
    lean: -0.5 + 0.4 * b,
    head: -1 + 0.8 * b,
    hipN: 5,
    kneeN: 1,
    hipF: -5,
    kneeF: 1,
    // At ease: arms down along the body, a slight bend; no gesture.
    shN: 2,
    elN: 10,
    shF: -2,
    elF: 8,
    breadth,
  };
};

/**
 * One command gesture (g ∈ [0,1]): the near arm rises forward to shoulder
 * height, holds, lowers; the torso turns toward the camera meanwhile.
 */
export const commandGesturePose = (g: number, breathPhase: number): Pose => {
  const base = standPose(breathPhase, 0.4);
  const raise = smooth(g / 0.32) * (1 - smooth((g - 0.72) / 0.28));
  const turn = smooth(g / 0.25);
  return {
    ...base,
    breadth: 0.4 + 0.55 * turn,
    lean: base.lean - 1.5 * raise,
    head: base.head - 4 * raise,
    shN: base.shN + (78 - base.shN) * raise,
    elN: base.elN + (6 - base.elN) * raise,
    shF: base.shF + (-8 - base.shF) * raise,
  };
};

/** Cheering on the spot; `amount` 0 = standing, 1 = arms high and bouncing. */
export const cheerPose = (phase: number, amount: number, breadth = 0.8): Pose => {
  const a = phase * TAU;
  const up = smooth(amount);
  const wave = Math.sin(a);
  return {
    ...NEUTRAL,
    breadth,
    lean: -3 * up,
    head: -8 * up,
    hipN: 4,
    hipF: -4,
    kneeN: 4 + 10 * up * Math.max(0, wave),
    kneeF: 4 + 10 * up * Math.max(0, wave),
    shN: -3 + (158 + 12 * wave - -3) * up,
    elN: 8 + 14 * up,
    shF: 3 + (150 - 12 * wave - 3) * up,
    elF: 8 + 18 * up,
    bob: 3.5 * up * Math.max(0, Math.sin(a * 2)),
  };
};

/** Running celebration: run gait with arms raised. */
export const celebrateRunPose = (phase: number, amount: number): Pose => {
  const run = gaitPose(phase, "jog", 0.5);
  const up = smooth(amount);
  return {
    ...run,
    lean: run.lean * (1 - up) - 4 * up,
    head: run.head - 8 * up,
    shN: run.shN + (150 - run.shN) * up,
    elN: run.elN + (20 - run.elN) * up,
    shF: run.shF + (140 - run.shF) * up,
    elF: run.elF + (25 - run.elF) * up,
  };
};

/**
 * Strike of the ball with the near leg (k ∈ [0,1]; contact at k = 0.55):
 * plant → back-swing → strike → follow-through.
 */
export const KICK_CONTACT = 0.55;
export const kickPose = (k: number): Pose => {
  const back = smooth(k / 0.4) * (1 - smooth((k - 0.4) / 0.15));
  const through = smooth((k - 0.42) / 0.3);
  const settle = smooth((k - 0.8) / 0.2);
  const hipN = -38 * back + 64 * through * (1 - 0.6 * settle);
  const kneeN = 88 * back + 8 * (1 - back) * (1 - through) + 6 * through;
  return {
    ...NEUTRAL,
    breadth: 0.45,
    lean: 6 + 6 * back - 14 * through * (1 - settle),
    head: 10,
    hipN,
    kneeN,
    footN: 26 * through,
    hipF: -6 + 4 * through,
    kneeF: 18 * back + 10 * through,
    shN: -30 * through + 20 * back,
    elN: 30,
    shF: 40 * back + 70 * through,
    elF: 20,
  };
};

/** Goalkeeper dive toward +x (d ∈ [0,1]). */
export const divePose = (d: number): Pose => {
  const t = smooth(d);
  return {
    ...NEUTRAL,
    breadth: 0.8,
    lean: 10 * t,
    head: -10 * t,
    hipN: 20 * t,
    kneeN: 20 + 10 * t,
    hipF: -25 * t,
    kneeF: 40 * t,
    shN: 10 + 150 * t,
    elN: 10,
    shF: 30 + 130 * t,
    elF: 16,
    bob: 26 * bump(d, 0.05, 1.0),
    rot: 72 * t,
  };
};

/** Arms lifting a trophy overhead (l ∈ [0,1]); breath keeps it alive. */
export const liftPose = (l: number, breathPhase: number): Pose => {
  const t = smooth(l);
  const b = Math.sin(breathPhase * TAU);
  return {
    ...NEUTRAL,
    breadth: 0.9,
    lean: -2 * t,
    head: -12 * t,
    hipN: 4,
    hipF: -4,
    shN: -3 + (168 + b * 3 - -3) * t,
    elN: 8 + 18 * t,
    shF: 3 + (160 + b * 3 - 3) * t,
    elF: 8 + 24 * t,
    bob: 1.5 * t * Math.max(0, b),
  };
};

/** Holding a flag pole with both hands, leaning into wind. */
export const flagHoldPose = (raise: number, breathPhase: number): Pose => {
  const t = smooth(raise);
  const b = Math.sin(breathPhase * TAU);
  return {
    ...NEUTRAL,
    breadth: 0.5,
    lean: 8 + 1.5 * b,
    head: 4 - 10 * t,
    hipN: 14,
    kneeN: 16,
    hipF: -12,
    kneeF: 4,
    shN: 60 + 90 * t,
    elN: 40 - 30 * t,
    shF: 40 + 100 * t,
    elF: 60 - 40 * t,
  };
};

/** Blend helper exported for tracks. */
export const blendPoses = lerpPose;

/* ------------------------------------------------ full-film additions */

/**
 * Seated on horseback. The horse carries the motion; the rider only sways
 * with the gait phase (hip/knee fixed around the barrel).
 */
export const ridePose = (phase: number, breadth = 0.3, reins = 1): Pose => {
  const a = phase * TAU;
  return {
    ...NEUTRAL,
    breadth,
    lean: 4 + 2 * Math.sin(a * 2),
    head: -2 + Math.sin(a * 2 + 0.6),
    hipN: 64,
    kneeN: 88,
    footN: -6,
    hipF: 60,
    kneeF: 84,
    footF: -6,
    shN: 22 * reins,
    elN: 58 * reins + 8,
    shF: 14 * reins,
    elF: 60 * reins + 8,
    bob: 0,
  };
};

/** Both arms raised in a wide V (balcony greeting); `a` 0..1 raise. */
export const armsRaisedPose = (a: number, breathPhase: number, breadth = 0.95): Pose => {
  const t = smooth(a);
  const b = Math.sin(breathPhase * TAU);
  return {
    ...NEUTRAL,
    breadth,
    lean: -1.5 * t,
    head: -6 * t,
    hipN: 3,
    hipF: -3,
    shN: -3 + (148 + 4 * b + 3) * t,
    elN: 8 + 6 * t,
    shF: 3 + (140 - 4 * b - 3) * t,
    elF: 8 + 8 * t,
  };
};

/** Writing/signing at a lectern: torso bent, near hand moving. */
export const writePose = (phase: number): Pose => {
  const a = phase * TAU;
  return {
    ...NEUTRAL,
    breadth: 0.35,
    lean: 22,
    head: 16,
    hipN: 4,
    hipF: -2,
    shN: 52 + 4 * Math.sin(a * 3),
    elN: 52 + 6 * Math.sin(a * 3 + 1),
    shF: 34,
    elF: 60,
  };
};

/** Dribbling run: run gait, torso lower, arms out for balance. */
export const dribblePose = (phase: number, lean = 14): Pose => {
  const run = gaitPose(phase, "run", 0.4);
  return {
    ...run,
    lean,
    head: 8,
    shN: run.shN * 0.6 - 18,
    elN: 30,
    shF: run.shF * 0.6 + 22,
    elF: 34,
  };
};

/** Embrace: arms wrapped forward around a teammate. */
export const embracePose = (breathPhase: number, amount = 1): Pose => {
  const t = smooth(amount);
  const b = Math.sin(breathPhase * TAU);
  return {
    ...NEUTRAL,
    breadth: 0.4,
    lean: 10 * t + b,
    head: 8 * t,
    hipN: 8,
    hipF: -6,
    kneeN: 8,
    shN: 72 * t,
    elN: 70 * t,
    shF: 82 * t,
    elF: 64 * t,
  };
};

/** Pointing ahead with the near arm (command, guidance). */
export const pointPose = (p: number, breathPhase: number): Pose => {
  const base = standPose(breathPhase, 0.45);
  const t = smooth(p);
  return { ...base, shN: base.shN + (92 - base.shN) * t, elN: base.elN * (1 - t) + 2 * t, head: base.head - 4 * t };
};

/** Arms held to carry something low in both hands (crates, a folded flag). */
export const carryPose = (phase: number, style: GaitStyle = "walk"): Pose => {
  const g = gaitPose(phase, style, 0.4);
  return { ...g, lean: g.lean + 4, shN: 26, elN: 64, shF: 20, elF: 70 };
};

/** Arms up holding a long pole with both hands (planting/raising a flag). */
export const hoistPose = (raise: number, breathPhase: number): Pose => {
  const t = smooth(raise);
  const b = Math.sin(breathPhase * TAU);
  return {
    ...NEUTRAL,
    breadth: 0.55,
    lean: 10 - 12 * t + b,
    head: 6 - 16 * t,
    hipN: 20,
    kneeN: 24 - 14 * t,
    hipF: -14,
    kneeF: 6,
    shN: 70 + 90 * t,
    elN: 30 - 20 * t,
    shF: 40 + 110 * t,
    elF: 50 - 34 * t,
  };
};

/** Helping another: leaning down, near arm extended low. */
export const helpPose = (breathPhase: number): Pose => {
  const b = Math.sin(breathPhase * TAU);
  return { ...NEUTRAL, breadth: 0.45, lean: 30 + b, head: 18, hipN: 34, kneeN: 40, hipF: -8, kneeF: 16, shN: 68, elN: 12, shF: 30, elF: 40 };
};
