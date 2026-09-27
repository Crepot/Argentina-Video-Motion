import type { Point } from "../../types/paths";

/**
 * ActorRig2D skeleton (spec §9.14). One shared 2D skeleton for every human
 * in the film: head, neck, shoulders, elbows, hands, hips, knees, feet. Rigs
 * differ by build (proportions) and wardrobe, never by bespoke drawings.
 *
 * Local space: figure faces +x, SVG y points down, the ground is y = 0 and a
 * standard adult is 100 units tall. Angles are degrees; 0 = limb hanging
 * straight down, positive = rotated forward (toward +x).
 */
export interface Pose {
  /** Torso lean from vertical, + forward. */
  lean: number;
  /** Head tilt relative to the torso, + forward/down. */
  head: number;
  hipN: number;
  kneeN: number;
  footN: number;
  hipF: number;
  kneeF: number;
  footF: number;
  shN: number;
  elN: number;
  shF: number;
  elF: number;
  /** Extra lift above the solved ground contact (jumps), local units. */
  bob: number;
  /** Whole-body rotation about the pelvis (dives, falls), + forward. */
  rot: number;
  /** 0 = pure profile … 1 = three-quarter view toward camera. */
  breadth: number;
}

export const NEUTRAL: Pose = {
  lean: 0,
  head: 0,
  hipN: 0,
  kneeN: 2,
  footN: 0,
  hipF: 0,
  kneeF: 2,
  footF: 0,
  shN: -3,
  elN: 8,
  shF: 3,
  elF: 8,
  bob: 0,
  rot: 0,
  breadth: 0.35,
};

export const lerpPose = (a: Pose, b: Pose, t: number): Pose => {
  if (t <= 0) {
    return a;
  }
  if (t >= 1) {
    return b;
  }
  const out = { ...a };
  for (const k of Object.keys(a) as (keyof Pose)[]) {
    out[k] = a[k] + (b[k] - a[k]) * t;
  }
  return out;
};

/** Body proportions. Historical figures and players differ here. */
export interface Build {
  /** Overall height multiplier (1 = 100 units). */
  height: number;
  /** Shoulder half-width multiplier for three-quarter views and torso mass. */
  shoulders: number;
  /** Torso/limb thickness multiplier. */
  girth: number;
  /** Head radius multiplier. */
  headSize: number;
  /** Leg length multiplier relative to torso. */
  legs: number;
}

export const BUILD_STANDARD: Build = {
  height: 1,
  shoulders: 1,
  girth: 1,
  headSize: 1,
  legs: 1,
};

export interface Joints {
  pelvis: Point;
  neck: Point;
  head: Point;
  shoulderN: Point;
  shoulderF: Point;
  elbowN: Point;
  elbowF: Point;
  wristN: Point;
  wristF: Point;
  hipN: Point;
  hipF: Point;
  kneeN: Point;
  kneeF: Point;
  ankleN: Point;
  ankleF: Point;
  toeN: Point;
  toeF: Point;
  /** Unit vectors of the torso frame: up and forward. */
  up: Point;
  fwd: Point;
  /** Absolute angles (deg) used by limb drawing. */
  angles: {
    torso: number;
    head: number;
    thighN: number;
    shinN: number;
    thighF: number;
    shinF: number;
    upperN: number;
    foreN: number;
    upperF: number;
    foreF: number;
    footN: number;
    footF: number;
  };
  dims: Dims;
}

export interface Dims {
  thigh: number;
  shin: number;
  ankleH: number;
  footLen: number;
  heel: number;
  torso: number;
  neck: number;
  headR: number;
  upperArm: number;
  foreArm: number;
  shoulderHalf: number;
  hipHalf: number;
  girth: number;
}

export const dimsFor = (b: Build): Dims => {
  const h = b.height;
  return {
    thigh: 24 * h * b.legs,
    shin: 23 * h * b.legs,
    ankleH: 3.2 * h,
    footLen: 10 * h,
    heel: 3 * h,
    torso: 31 * h,
    neck: 4 * h,
    headR: 6.9 * h * b.headSize,
    upperArm: 17 * h,
    foreArm: 14.5 * h,
    shoulderHalf: 10.5 * h * b.shoulders,
    hipHalf: 6.5 * h * b.girth,
    girth: b.girth,
  };
};

const RAD = Math.PI / 180;
/** Direction of a limb hanging at angle a (0 = down, + forward). */
const dir = (a: number): Point => [Math.sin(a * RAD), Math.cos(a * RAD)];
const add = (p: Point, v: Point, k: number): Point => [
  p[0] + v[0] * k,
  p[1] + v[1] * k,
];
const rotAbout = (p: Point, c: Point, a: number): Point => {
  const s = Math.sin(a * RAD);
  const co = Math.cos(a * RAD);
  const dx = p[0] - c[0];
  const dy = p[1] - c[1];
  return [c[0] + dx * co - dy * s, c[1] + dx * s + dy * co];
};

/**
 * Forward kinematics with ground contact: the pelvis height is solved so the
 * lowest sole touches y = 0 (no floating, no sinking), then `bob` lifts it.
 * Three-quarter breadth offsets near/far limbs horizontally.
 */
export const solveJoints = (pose: Pose, build: Build): Joints => {
  const d = dimsFor(build);
  const torsoA = pose.lean;
  const up: Point = [Math.sin(torsoA * RAD), -Math.cos(torsoA * RAD)];
  const fwd: Point = [-up[1], up[0]];
  const spread = pose.breadth;
  const hipOff = d.hipHalf * 0.55 * spread;
  const shOff = d.shoulderHalf * 0.62 * spread;

  // Legs relative to the pelvis at origin.
  const leg = (hip: number, knee: number, foot: number, side: 1 | -1) => {
    const h: Point = [side * hipOff, 0];
    const thighA = hip;
    const shinA = hip - knee;
    const k = add(h, dir(thighA), d.thigh);
    const an = add(k, dir(shinA), d.shin);
    // + foot = toe pointing down (push-off, kick); − = toe raised (heel strike).
    const footA = foot;
    const toe: Point = [
      an[0] + Math.cos(footA * RAD) * (d.footLen - d.heel),
      an[1] + d.ankleH + Math.sin(footA * RAD) * (d.footLen - d.heel) * 0.8,
    ];
    return { h, k, an, toe, thighA, shinA, footA };
  };
  const ln = leg(pose.hipN, pose.kneeN, pose.footN, 1);
  const lf = leg(pose.hipF, pose.kneeF, pose.footF, -1);

  // Ground contact: lowest point among soles (ankle + ankle height, toes).
  const lowest = Math.max(
    ln.an[1] + d.ankleH,
    lf.an[1] + d.ankleH,
    ln.toe[1],
    lf.toe[1],
  );
  const pelvis: Point = [0, -lowest - pose.bob];
  const shift = (p: Point): Point => [p[0] + pelvis[0], p[1] + pelvis[1]];

  const neck = add(pelvis, up, d.torso);
  const shoulderBase = add(pelvis, up, d.torso - 2.2 * build.height);
  const shoulderN: Point = [shoulderBase[0] + shOff, shoulderBase[1]];
  const shoulderF: Point = [shoulderBase[0] - shOff, shoulderBase[1]];
  const headA = torsoA + pose.head;
  const headUp: Point = [Math.sin(headA * RAD), -Math.cos(headA * RAD)];
  const head = add(add(neck, up, d.neck * 0.6), headUp, d.headR * 1.05);

  const arm = (s: Point, sh: number, el: number) => {
    const upperA = sh + torsoA;
    const foreA = upperA + el;
    const e = add(s, dir(upperA), d.upperArm);
    const w = add(e, dir(foreA), d.foreArm);
    return { e, w, upperA, foreA };
  };
  const an = arm(shoulderN, pose.shN, pose.elN);
  const af = arm(shoulderF, pose.shF, pose.elF);

  let j: Joints = {
    pelvis,
    neck,
    head,
    shoulderN,
    shoulderF,
    elbowN: an.e,
    elbowF: af.e,
    wristN: an.w,
    wristF: af.w,
    hipN: shift(ln.h),
    hipF: shift(lf.h),
    kneeN: shift(ln.k),
    kneeF: shift(lf.k),
    ankleN: shift(ln.an),
    ankleF: shift(lf.an),
    toeN: shift(ln.toe),
    toeF: shift(lf.toe),
    up,
    fwd,
    angles: {
      torso: torsoA,
      head: headA,
      thighN: ln.thighA,
      shinN: ln.shinA,
      thighF: lf.thighA,
      shinF: lf.shinA,
      upperN: an.upperA,
      foreN: an.foreA,
      upperF: af.upperA,
      foreF: af.foreA,
      footN: ln.footA,
      footF: lf.footA,
    },
    dims: d,
  };

  if (pose.rot !== 0) {
    const c = pelvis;
    const r = (p: Point) => rotAbout(p, c, pose.rot);
    const rv = (v: Point): Point => rotAbout(v, [0, 0], pose.rot);
    const A = j.angles;
    j = {
      ...j,
      neck: r(j.neck),
      head: r(j.head),
      shoulderN: r(j.shoulderN),
      shoulderF: r(j.shoulderF),
      elbowN: r(j.elbowN),
      elbowF: r(j.elbowF),
      wristN: r(j.wristN),
      wristF: r(j.wristF),
      hipN: r(j.hipN),
      hipF: r(j.hipF),
      kneeN: r(j.kneeN),
      kneeF: r(j.kneeF),
      ankleN: r(j.ankleN),
      ankleF: r(j.ankleF),
      toeN: r(j.toeN),
      toeF: r(j.toeF),
      up: rv(j.up),
      fwd: rv(j.fwd),
      angles: {
        torso: A.torso + pose.rot,
        head: A.head + pose.rot,
        thighN: A.thighN + pose.rot,
        shinN: A.shinN + pose.rot,
        thighF: A.thighF + pose.rot,
        shinF: A.shinF + pose.rot,
        upperN: A.upperN + pose.rot,
        foreN: A.foreN + pose.rot,
        upperF: A.upperF + pose.rot,
        foreF: A.foreF + pose.rot,
        footN: A.footN + pose.rot,
        footF: A.footF + pose.rot,
      },
    };
  }
  return j;
};
