import React from "react";
import { catmullRomAt } from "../paths/interpolate-path";
import { mixColor, PALETTE } from "../theme/palette";
import type { Point } from "../types/paths";
import { solveJoints, type Build, type Joints, type Pose } from "./rig/skeleton";
import type { HatStyle, HeadProfile, Wardrobe } from "./rig/wardrobe";

/**
 * ActorRig2D (spec §9.14). Draws one human from a pose, a build and a
 * wardrobe in local units (100 = standard height, facing +x, ground y = 0).
 * Flat vector masses, deep-blue line art and limited hatching; no facial
 * features — recognition comes from posture, clothing contour and props.
 *
 * The caller positions it with a billboard matrix; `pxPerUnit` is the
 * apparent screen scale so line weights stay constant at any size.
 */
export type DetailLevel = "hero" | "mid" | "map";

export interface ActorRig2DProps {
  uid: string;
  pose: Pose;
  build: Build;
  wardrobe: Wardrobe;
  detail: DetailLevel;
  /** Screen px per local unit (for constant line weight). */
  pxPerUnit: number;
  /** 0 = full value (foreground) … 1 = recedes toward the paper. */
  tone?: number;
  /** Phase for cloth/flag secondary motion. */
  clothPhase?: number;
  /** Optional prop held overhead with both hands. */
  held?: "trophy" | null;
  heldGold?: number;
}

const f2 = (n: number) => n.toFixed(2);

const smoothClosed = (pts: readonly Point[], sub = 3) => {
  const n = pts.length;
  const ring: Point[] = [pts[n - 1], ...pts, pts[0], pts[1]];
  let d = "";
  for (let i = 1; i <= n; i++) {
    for (let s = 0; s < sub; s++) {
      const p = catmullRomAt(ring, i + s / sub);
      d += `${d ? " L" : "M"} ${f2(p[0])} ${f2(p[1])}`;
    }
  }
  return `${d} Z`;
};

const norm = (a: Point, b: Point): Point => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [-dy / l, dx / l];
};

/**
 * A tapered limb through joint points with a half-width per joint; interior
 * joints use the bisector normal so bent knees/elbows stay solid.
 */
const limb = (pts: readonly Point[], w: readonly number[]) => {
  const n = pts.length;
  const normals: Point[] = pts.map((_, i) => {
    if (i === 0) {
      return norm(pts[0], pts[1]);
    }
    if (i === n - 1) {
      return norm(pts[n - 2], pts[n - 1]);
    }
    const a = norm(pts[i - 1], pts[i]);
    const b = norm(pts[i], pts[i + 1]);
    const m: Point = [a[0] + b[0], a[1] + b[1]];
    const l = Math.hypot(m[0], m[1]) || 1;
    const cosHalf = Math.max(0.55, l / 2);
    return [m[0] / l / cosHalf, m[1] / l / cosHalf];
  });
  const left = pts.map((p, i): Point => [
    p[0] + normals[i][0] * w[i],
    p[1] + normals[i][1] * w[i],
  ]);
  const right = pts.map((p, i): Point => [
    p[0] - normals[i][0] * w[i],
    p[1] - normals[i][1] * w[i],
  ]);
  const end = pts[n - 1];
  const endDir: Point = [
    end[0] - pts[n - 2][0],
    end[1] - pts[n - 2][1],
  ];
  const el = Math.hypot(endDir[0], endDir[1]) || 1;
  const capE: Point = [
    end[0] + (endDir[0] / el) * w[n - 1] * 1.25,
    end[1] + (endDir[1] / el) * w[n - 1] * 1.25,
  ];
  const start = pts[0];
  const capS: Point = [
    start[0] - (endDir[0] / el) * w[0] * 0.9,
    start[1] - (endDir[1] / el) * w[0] * 0.9,
  ];
  let d = `M ${f2(left[0][0])} ${f2(left[0][1])}`;
  for (let i = 1; i < n; i++) {
    d += ` L ${f2(left[i][0])} ${f2(left[i][1])}`;
  }
  d += ` Q ${f2(capE[0])} ${f2(capE[1])} ${f2(right[n - 1][0])} ${f2(right[n - 1][1])}`;
  for (let i = n - 2; i >= 0; i--) {
    d += ` L ${f2(right[i][0])} ${f2(right[i][1])}`;
  }
  d += ` Q ${f2(capS[0])} ${f2(capS[1])} ${f2(left[0][0])} ${f2(left[0][1])} Z`;
  return d;
};

const lerpP = (a: Point, b: Point, t: number): Point => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

/** Point in the torso frame: t along the spine (0 pelvis, 1 neck), s forward. */
const torsoPt = (j: Joints, t: number, s: number): Point => [
  j.pelvis[0] + j.up[0] * j.dims.torso * t + j.fwd[0] * s,
  j.pelvis[1] + j.up[1] * j.dims.torso * t + j.fwd[1] * s,
];

const TORSO_T = [0, 0.3, 0.55, 0.8, 0.95, 1.02] as const;
const TORSO_FRONT = [7.0, 6.6, 6.2, 7.9, 6.4, 2.8] as const;
const TORSO_BACK = [7.2, 6.4, 6.0, 7.0, 7.6, 3.2] as const;

const torsoOutline = (j: Joints, breadth: number, grow = 0) => {
  const g = j.dims.girth;
  const sh = j.dims.shoulderHalf / 10.5;
  const front = TORSO_T.map((t, i) => {
    const wide = t > 0.7 ? breadth * 3.2 * sh : breadth * 1.4;
    return torsoPt(j, t, (TORSO_FRONT[i] * g + wide) * (i >= 3 ? sh : 1) + grow);
  });
  const back = TORSO_T.map((t, i) => {
    const wide = t > 0.7 ? breadth * 3.2 * sh : breadth * 1.4;
    return torsoPt(j, t, -((TORSO_BACK[i] * g + wide) * (i >= 3 ? sh : 1) + grow));
  });
  return [...front, ...back.reverse()];
};

/* ------------------------------------------------------------------ heads */

type HeadPts = readonly Point[];

/** Profile head outlines around the head centre, facing +x, radius ≈ 6.4. */
const HEADS: Record<HeadProfile, HeadPts> = {
  standard: [
    [-2.6, 6.4],
    [-5.9, 2.4],
    [-6.2, -2.2],
    [-3.6, -6.1],
    [0.8, -6.9],
    [4.9, -4.6],
    [6.2, -1.2],
    [7.4, 1.0],
    [6.3, 2.2],
    [6.2, 3.6],
    [5.0, 5.8],
    [2.4, 6.9],
  ],
  gaunt: [
    [-2.4, 7.0],
    [-5.6, 2.6],
    [-6.0, -2.4],
    [-3.6, -6.3],
    [0.6, -7.1],
    [4.6, -5.2],
    [5.8, -1.6],
    [7.6, 1.2],
    [6.0, 2.4],
    [6.0, 4.4],
    [4.6, 7.2],
    [1.8, 7.8],
  ],
  round: [
    [-2.8, 6.2],
    [-6.2, 2.2],
    [-6.4, -2.2],
    [-3.8, -6.0],
    [0.8, -6.8],
    [5.0, -4.4],
    [6.4, -0.8],
    [7.0, 1.2],
    [6.2, 2.4],
    [6.1, 3.6],
    [4.6, 5.8],
    [2.2, 6.6],
  ],
};

const hatPath = (hat: HatStyle): { d: string; visor?: string; band?: string } | null => {
  switch (hat) {
    case "helmet":
      return {
        d: "M -8.0 0.6 C -8.6 -5.6, -5.6 -9.6, 0.2 -9.8 C 5.8 -9.8, 8.4 -5.8, 8.0 -0.2 L 9.0 0.6 C 5.0 1.0, -4.0 1.6, -8.9 1.5 Z",
        band: "M -8.4 -0.2 C -3 0.6, 4 0.2, 8.4 -0.6",
      };
    case "peakedCap":
      return {
        d: "M -6.3 -3.2 L -6.6 -6.4 C -5.2 -8.8, 3.8 -9.6, 7.4 -7.6 L 6.6 -3.4 Z",
        visor: "M 5.6 -3.6 L 11.0 -2.0 L 10.2 -1.2 L 5.2 -2.4 Z",
        band: "M -6.4 -4.4 L 6.8 -4.6",
      };
    case "generalCap":
      // High, forward-tilted crown, dark band and a long visor.
      return {
        d: "M -6.2 -3.0 L -6.9 -7.2 C -5.6 -10.6, 4.4 -13.2, 8.8 -10.6 L 6.8 -3.2 Z",
        visor: "M 5.8 -3.4 L 11.8 -1.4 L 11.0 -0.4 L 5.4 -2.0 Z",
        band: "M -6.5 -4.6 L 7.0 -4.9 M -6.6 -5.6 L 7.2 -5.9",
      };
    case "flatCap":
      return {
        d: "M -6.4 -2.6 C -6.8 -7.2, 2.0 -8.4, 6.4 -5.2 L 9.4 -3.6 L 6.0 -3.0 Z",
      };
    case "hairShort":
      return {
        d: "M -6.3 1.4 C -7.2 -4.0, -3.8 -7.6, 1.0 -7.4 C 4.4 -7.2, 6.2 -5.4, 5.6 -3.0 C 2.6 -4.4, -1.4 -3.4, -2.6 0.8 C -3.6 2.2, -5.0 2.8, -6.3 1.4 Z",
      };
    case "hairLong":
      return {
        d: "M -6.4 6.6 C -8.4 1.0, -7.6 -5.8, -1.4 -7.8 C 3.6 -8.8, 6.8 -6.0, 6.0 -2.6 C 2.8 -4.6, -0.6 -3.6, -2.2 0.2 C -2.6 3.0, -2.0 5.6, -2.4 8.2 C -3.8 8.4, -5.4 7.8, -6.4 6.6 Z",
      };
    case "hairBun":
      return {
        d: "M -6.6 2.4 C -7.6 -3.6, -3.8 -7.6, 1.0 -7.4 C 4.8 -7.2, 6.6 -4.8, 5.8 -2.4 C 2.4 -4.2, -1.2 -3.0, -2.6 1.8 Z M -9.6 -1.6 C -9.6 -4.8, -5.6 -5.2, -5.4 -2.0 C -5.4 0.8, -9.6 1.2, -9.6 -1.6 Z",
      };
    case "hood":
      return {
        d: "M -7.2 5.0 C -8.6 -2.0, -5.0 -8.8, 0.6 -8.6 C 5.4 -8.4, 7.6 -4.8, 7.0 -1.4 L 5.6 -1.8 C 4.6 -4.8, -2.6 -5.4, -3.2 1.6 L -3.0 6.6 Z",
      };
    default:
      return null;
  }
};

/* ------------------------------------------------------------------ props */

const trophyLocal = (s: number) => {
  // Original simplified trophy (same design language as TrophySymbol), height ≈ 18·s.
  const k = (x: number, y: number) => `${f2(x * s)} ${f2(y * s)}`;
  return {
    body: `M ${k(-3.2, 0)} C ${k(-2, -2.6)}, ${k(-1.4, -5)}, ${k(-1.8, -7)} C ${k(-2.6, -10.6)}, ${k(-6, -13)}, ${k(-5.8, -16.6)} C ${k(-5.6, -19)}, ${k(-4.2, -20.8)}, ${k(-2.6, -21.8)} L ${k(2.6, -21.8)} C ${k(4.2, -20.8)}, ${k(5.6, -19)}, ${k(5.8, -16.6)} C ${k(6, -13)}, ${k(2.6, -10.6)}, ${k(1.8, -7)} C ${k(1.4, -5)}, ${k(2, -2.6)}, ${k(3.2, 0)} Z`,
    base: `M ${k(-4.6, 3.2)} H ${f2(4.6 * s)} L ${k(4.0, 0)} H ${f2(-4.0 * s)} Z`,
    globe: { cy: -24 * s, r: 3.6 * s },
  };
};

export const ActorRig2D: React.FC<ActorRig2DProps> = ({
  uid,
  pose,
  build,
  wardrobe: w,
  detail,
  pxPerUnit,
  tone = 0,
  clothPhase = 0,
  held = null,
  heldGold = 0,
}) => {
  const j = solveJoints(pose, build);
  const D = j.dims;
  const paper = PALETTE.paperCool;
  const T = (c: string) => (tone > 0 ? mixColor(c, paper, tone * 0.72) : c);
  const shade = (c: string, k = 0.22) => T(mixColor(c, PALETTE.deepBlue, k));
  const line = T(PALETTE.deepBlue);
  const lw = (detail === "hero" ? 1.35 : detail === "mid" ? 1.0 : 0) / pxPerUnit;
  const stroke = detail === "map" ? "none" : line;
  const common = {
    stroke,
    strokeWidth: lw,
    strokeLinejoin: "round" as const,
  };
  const g = D.girth;

  /* legs */
  const legPts = (hip: Point, knee: Point, ankle: Point) => [hip, knee, ankle];
  const legW = [5.6 * g, 4.0 * g, 3.0 * g];
  const shortsW = [6.0 * g, 5.0 * g];
  const legShape = (hip: Point, knee: Point, ankle: Point, far: boolean) => {
    const base = far ? shade(w.bottom, 0.28) : T(w.bottom);
    const pieces: React.ReactNode[] = [];
    if (w.shorts) {
      const mid = lerpP(hip, knee, 0.55);
      pieces.push(
        <path key="skin" d={limb([mid, knee, ankle], [4.4 * g, 3.8 * g, 3.0 * g])} fill={far ? shade(w.skin, 0.12) : T(w.skin)} {...common} />,
      );
      const sockTop = lerpP(knee, ankle, 0.28);
      pieces.push(
        <path key="sock" d={limb([sockTop, ankle], [3.7 * g, 3.2 * g])} fill={far ? shade(w.socks ?? w.bottom, 0.2) : T(w.socks ?? w.bottom)} {...common} />,
      );
      pieces.push(
        <path key="shorts" d={limb([hip, lerpP(hip, knee, 0.62)], shortsW)} fill={base} {...common} />,
      );
    } else {
      pieces.push(<path key="trouser" d={limb(legPts(hip, knee, ankle), legW)} fill={base} {...common} />);
      if (w.trouserStripe && detail !== "map" && !far) {
        pieces.push(
          <path key="stripe" d={`M ${f2(hip[0])} ${f2(hip[1])} L ${f2(knee[0])} ${f2(knee[1])} L ${f2(ankle[0])} ${f2(ankle[1])}`} fill="none" stroke={T(w.trouserStripe)} strokeWidth={0.9} strokeLinecap="round" />,
        );
      }
    }
    return pieces;
  };
  const boot = (ankle: Point, toe: Point, far: boolean) => {
    const heel: Point = [ankle[0] - D.heel * 1.05, ankle[1] + D.ankleH];
    const top: Point = [ankle[0] - 2.8 * g, ankle[1] - 2.6];
    const front: Point = [ankle[0] + 3.2 * g, ankle[1] - 1.8];
    return (
      <path
        d={smoothClosed([top, front, [toe[0] + 1.2, toe[1] - 0.6], [toe[0] + 0.6, toe[1] + 0.4], heel, [heel[0] - 0.6, heel[1] - 2.2]], 2)}
        fill={far ? shade(w.boots, 0.15) : T(w.boots)}
        {...common}
      />
    );
  };

  /* arms */
  const sleeveW = [4.4 * g, 3.5 * g, 2.9 * g];
  const armShape = (sh: Point, el: Point, wr: Point, far: boolean) => {
    const bare = w.shorts && !w.gloves;
    const sleeveEnd = bare ? lerpP(el, wr, 0.1) : wr;
    const top = far ? shade(w.top, 0.3) : T(w.top);
    const handC = w.gloves ? (far ? shade(w.gloves, 0.2) : T(w.gloves)) : far ? shade(w.skin, 0.12) : T(w.skin);
    return (
      <>
        {bare ? (
          <path d={limb([el, wr], [3.0 * g, 2.5 * g])} fill={far ? shade(w.skin, 0.12) : T(w.skin)} {...common} />
        ) : null}
        <path d={limb([sh, el, sleeveEnd], bare ? [4.3 * g, 3.5 * g, 3.4 * g] : sleeveW)} fill={top} {...common} />
        {detail !== "map" ? (
          <circle cx={wr[0] + (wr[0] - el[0]) * 0.1} cy={wr[1] + (wr[1] - el[1]) * 0.1} r={2.1 * g} fill={handC} stroke={detail === "hero" ? stroke : "none"} strokeWidth={lw * 0.8} />
        ) : null}
      </>
    );
  };

  /* torso */
  const torsoPts = torsoOutline(j, pose.breadth);
  const torsoD = smoothClosed(torsoPts, 3);
  const skirtD = (() => {
    if (w.skirt <= 0.02) {
      return null;
    }
    const hemN = lerpP(j.hipN, j.kneeN, Math.min(1, w.skirt));
    const hemF = lerpP(j.hipF, j.kneeF, Math.min(1, w.skirt));
    const extra = Math.max(0, w.skirt - 1) * D.shin;
    const hemY = Math.max(hemN[1], hemF[1]) + extra;
    const flare = 1.8 + w.skirt * 3.2;
    const frontX = Math.max(hemN[0], hemF[0]) + 6.4 * g + flare;
    const backX = Math.min(hemN[0], hemF[0]) - 6.6 * g - flare;
    const waistF = torsoPt(j, 0.42, 5.8 * g + pose.breadth * 1.4);
    const waistB = torsoPt(j, 0.42, -(5.9 * g + pose.breadth * 1.4));
    const sway = Math.sin(clothPhase * Math.PI * 2) * 1.2 * w.skirt;
    return smoothClosed(
      [waistF, [frontX + sway, hemY - 1], [frontX - 2 + sway, hemY + 0.6], [(frontX + backX) / 2 + sway, hemY + 1.2], [backX + 2 + sway, hemY + 0.6], [backX + sway, hemY - 1], waistB],
      2,
    );
  })();

  /* head */
  const headDeg = j.angles.head;
  const headT = `translate(${f2(j.head[0])} ${f2(j.head[1])}) rotate(${f2(headDeg)}) scale(${f2(D.headR / 6.4)})`;
  const hat = hatPath(w.hat);
  const neckD = limb([torsoPt(j, 0.96, 0.6), [j.head[0] - j.up[0] * 5.4, j.head[1] - j.up[1] * 5.4]], [2.9 * g, 2.6 * g]);

  const clipId = `torso-${uid}`;
  const hatch = detail === "hero";
  const stripes = detail !== "map" ? w.stripes : undefined;

  const nearLegFirst = true;
  const legsNear = [
    ...legShape(j.hipN, j.kneeN, j.ankleN, false),
    <React.Fragment key="bootN">{boot(j.ankleN, j.toeN, false)}</React.Fragment>,
  ];
  const legsFar = [
    ...legShape(j.hipF, j.kneeF, j.ankleF, true),
    <React.Fragment key="bootF">{boot(j.ankleF, j.toeF, true)}</React.Fragment>,
  ];

  /* props behind the torso */
  const behind: React.ReactNode[] = [];
  const front: React.ReactNode[] = [];
  const has = (p: string) => (w.props as readonly string[]).includes(p);
  if (has("pack")) {
    const a = torsoPt(j, 0.9, -5.4 * g);
    const b = torsoPt(j, 0.38, -6.2 * g);
    const c = torsoPt(j, 0.42, -13.4 * g);
    const d = torsoPt(j, 0.92, -11.8 * g);
    behind.push(<path key="pack" d={smoothClosed([a, d, c, b], 2)} fill={shade(w.top, 0.18)} {...common} />);
  }
  if (has("rifleSlung")) {
    const muzzle = torsoPt(j, 1.32, -8.2);
    const butt = torsoPt(j, 0.12, -3.6);
    behind.push(
      <path key="rifle" d={limb([muzzle, lerpP(muzzle, butt, 0.72), butt], [0.9, 1.3, 2.6])} fill={T(PALETTE.deepBlue)} stroke="none" />,
    );
  }
  if (has("shield")) {
    const c = lerpP(j.elbowN, j.wristN, 0.55);
    const wide = 5 + 9 * Math.min(1, pose.breadth);
    const cx = c[0] + 3;
    front.push(
      <g key="shield">
        <rect x={cx - wide / 2} y={c[1] - 21} width={wide} height={38} rx={2} fill={T(PALETTE.grayBluePale)} opacity={0.9} {...common} />
        {detail !== "map" ? <path d={`M ${f2(cx - wide / 2 + 2)} ${f2(c[1] - 15)} h ${f2(wide - 4)} M ${f2(cx - wide / 2 + 2)} ${f2(c[1] + 11)} h ${f2(wide - 4)}`} stroke={line} strokeWidth={lw} opacity={0.6} /> : null}
      </g>,
    );
  }
  if (has("baton")) {
    const wr = j.wristF;
    const tip = [wr[0] + (wr[0] - j.elbowF[0]) * 0.9, wr[1] + (wr[1] - j.elbowF[1]) * 0.9] as const;
    behind.push(<path key="baton" d={`M ${f2(wr[0])} ${f2(wr[1])} L ${f2(tip[0])} ${f2(tip[1])}`} stroke={T(PALETTE.deepBlue)} strokeWidth={1.6} strokeLinecap="round" />);
  }
  if (has("briefcase")) {
    const wr = j.wristF;
    behind.push(<rect key="case" x={wr[0] - 6} y={wr[1] + 1.4} width={12} height={8.6} rx={1} fill={shade(PALETTE.deepBlueSoft, 0.1)} {...common} />);
  }
  if (has("bag")) {
    const wr = j.wristF;
    behind.push(<path key="bag" d={`M ${f2(wr[0] - 4)} ${f2(wr[1] + 1)} h 8 l 1 8 h -10 Z`} fill={shade(PALETTE.grayBlue, 0.25)} {...common} />);
  }
  if (has("document") && detail !== "map") {
    const wr = j.wristN;
    front.push(<rect key="doc" x={wr[0] - 1} y={wr[1] - 5} width={6.4} height={8.4} fill={T(PALETTE.paperWarm)} {...common} transform={`rotate(-12 ${f2(wr[0])} ${f2(wr[1])})`} />);
  }

  const handsMid = lerpP(j.wristN, j.wristF, 0.5);
  const trophy = held === "trophy" ? trophyLocal(1.7) : null;

  return (
    <g data-rig={w.id}>
      {hatch || stripes ? (
        <defs>
          <clipPath id={clipId}>
            <path d={torsoD} />
            {skirtD ? <path d={skirtD} /> : null}
          </clipPath>
        </defs>
      ) : null}
      {behind}
      {armShape(j.shoulderF, j.elbowF, j.wristF, true)}
      {nearLegFirst ? legsFar : null}
      {w.skirt > 0.02 ? legsNear : null}
      <path d={torsoD} fill={T(w.top)} {...common} />
      {stripes ? (
        <g clipPath={`url(#${clipId})`}>
          {[-9, -4.5, 0, 4.5, 9].map((s) => (
            <path key={s} d={`M ${f2(torsoPt(j, -0.1, s)[0])} ${f2(torsoPt(j, -0.1, s)[1])} L ${f2(torsoPt(j, 1.1, s)[0])} ${f2(torsoPt(j, 1.1, s)[1])}`} stroke={T(stripes)} strokeWidth={2.3} />
          ))}
        </g>
      ) : null}
      {skirtD ? <path d={skirtD} fill={T(w.top)} {...common} /> : null}
      {hatch ? (
        <g clipPath={`url(#${clipId})`} opacity={0.55}>
          <path d={torsoD} fill="url(#v2-hatch)" transform={`translate(${f2(-j.fwd[0] * 7)} ${f2(-j.fwd[1] * 7)})`} />
        </g>
      ) : null}
      {w.skirt <= 0.02 ? legsNear : null}
      {w.belt && detail !== "map" ? (
        <path d={`M ${f2(torsoPt(j, 0.42, 6.2 * g + pose.breadth * 1.4)[0])} ${f2(torsoPt(j, 0.42, 6.2 * g + pose.breadth * 1.4)[1])} L ${f2(torsoPt(j, 0.42, -(6.2 * g + pose.breadth * 1.4))[0])} ${f2(torsoPt(j, 0.42, -(6.2 * g + pose.breadth * 1.4))[1])}`} stroke={T(w.belt)} strokeWidth={2.2} />
      ) : null}
      {w.buttons && detail === "hero"
        ? [0.52, 0.64, 0.76, 0.88].map((t) => {
            const p = torsoPt(j, t, 4.2 * g + pose.breadth * 2.2);
            return <circle key={t} cx={p[0]} cy={p[1]} r={0.7} fill={T(w.buttons!)} />;
          })
        : null}
      {w.shoulderBoards && detail !== "map" ? (
        <path d={limb([torsoPt(j, 0.97, -3.8), torsoPt(j, 0.99, 3.4)], [1.1, 1.1])} fill={T(w.shoulderBoards)} stroke="none" />
      ) : null}
      <path d={neckD} fill={T(w.skin)} {...common} />
      {w.collar && detail !== "map" ? (
        <path d={limb([torsoPt(j, 0.9, 3.4), torsoPt(j, 1.0, 1.2)], [1.4, 1.2])} fill={T(w.collar)} stroke="none" />
      ) : null}
      <g transform={headT}>
        <path d={smoothClosed(HEADS[w.head], 3)} fill={T(w.skin)} {...common} />
        {w.mustache && detail !== "map" ? (
          <path d="M 5.2 2.3 C 6.2 1.9, 7.2 2.0, 7.1 2.6 C 6.6 3.3, 5.6 3.2, 5.0 3.0 Z" fill={line} />
        ) : null}
        {w.mask === "gas" ? (
          <g>
            <path d="M -4.8 -3.2 C -1.4 -3.8, 3.0 -3.6, 5.6 -2.2" fill="none" stroke={line} strokeWidth={1} />
            <circle cx={4.2} cy={-1.0} r={1.9} fill={T(PALETTE.grayBluePale)} {...common} />
            <path d="M 3.4 2.2 C 5.6 1.4, 8.2 3.0, 9.2 5.2 L 7.0 7.6 C 5.4 6.8, 3.6 5.6, 3.0 4.2 Z" fill={T(PALETTE.deepBlue)} {...common} />
            <path d="M 8.4 5.0 L 10.6 6.8 L 8.8 8.8 L 6.8 7.4 Z" fill={shade(PALETTE.deepBlueSoft, 0.1)} {...common} />
          </g>
        ) : null}
        {hat ? (
          <>
            <path d={hat.d} fill={T(w.hatColor)} {...common} />
            {hat.band && detail !== "map" ? <path d={hat.band} fill="none" stroke={shade(w.hatColor, 0.5)} strokeWidth={0.9} /> : null}
            {hat.visor ? <path d={hat.visor} fill={shade(w.hatColor, 0.4)} {...common} /> : null}
          </>
        ) : null}
      </g>
      {armShape(j.shoulderN, j.elbowN, j.wristN, false)}
      {front}
      {trophy ? (
        <g transform={`translate(${f2(handsMid[0])} ${f2(handsMid[1] - 1)})`}>
          <path d={trophy.base} fill={T(mixColor(PALETTE.grayBlue, PALETTE.goldMuted, heldGold))} {...common} />
          <path d={trophy.body} fill={T(mixColor(PALETTE.grayBluePale, PALETTE.goldMuted, heldGold))} {...common} />
          <circle cx={0} cy={trophy.globe.cy} r={trophy.globe.r} fill={T(mixColor(PALETTE.grayBluePale, PALETTE.goldLight, heldGold))} {...common} />
        </g>
      ) : null}
    </g>
  );
};

/** Shared hatch pattern (limited hatching): mount once in the stage <defs>. */
export const RigDefs: React.FC = () => (
  <defs>
    <pattern id="v2-hatch" patternUnits="userSpaceOnUse" width={2.4} height={2.4} patternTransform="rotate(38)">
      <path d="M 0 0 V 2.4" stroke={PALETTE.deepBlue} strokeWidth={0.5} opacity={0.5} />
    </pattern>
  </defs>
);
