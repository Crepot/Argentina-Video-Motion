import React from "react";
import { clamp01, lerp } from "../../animation/interpolate-clamped";
import type { ActorTrack } from "../../actors/action-track";
import { interpolatePoints } from "../../paths/interpolate-path";
import { mixColor, PALETTE } from "../../theme/palette";
import type { CameraState } from "../../types/camera";
import type { Point } from "../../types/paths";
import { A, P, actor, actorItems } from "../actors";
import { foldFromTilt, K, ramp, win } from "../anim";
import {
  BA_SHEET,
  BLOCKS_D,
  CABILDO,
  CABILDO_CX,
  CATEDRAL,
  FORT,
  HOUSES,
  PLAZA,
  PLAZA_STATE,
  RAIN,
  SHORE_D,
} from "../data/ba-colonial";
import { M } from "../data/geo";
import { ATLANTIC_ROUTE } from "../data/routes";
import { Building } from "../draw/architecture";
import { crowdItems, seedCrowd } from "../draw/crowd";
import { AnthemText, At, DateText, EventText } from "../draw/labels";
import { MapGround } from "../draw/map";
import { SheetGround } from "../draw/sheet";
import { Ship } from "../draw/ship";
import { standMatrix } from "../draw/stand";
import { camIn, type CamKey } from "../film-camera";
import { IDENTITY } from "../space";
import type { FilmCtx, FilmStage, LineEra, StageItem } from "../types";

/**
 * Scenes 02 (1806–1808) and 03 (1810) on the colonial Buenos Aires sheet.
 * 02: the estuary wave lifts ships; British columns land and march on the
 * plaza; militia and residents answer from streets and rooftops; routes knot
 * and reverse. The camera rises: the Atlantic connection to Spain loses ink
 * as a Napoleonic figure presses on it. 03: the broken end of that line
 * becomes the plaza axis; the Cabildo drafts itself, rain falls, people
 * gather under umbrellas; at 462 (hard cut) the sky-blue pulse crosses the
 * crowd and climbs the Cabildo axis; it leaves as a ribbon (Scene 04).
 */
const PL = BA_SHEET;
const COLONIAL = mixColor(PALETTE.skyBlue, PALETTE.grayBlue, 0.55);
const NAVY = mixColor(PALETTE.deepBlue, PALETTE.grayBlue, 0.25);

const T = {
  townBuild: K([
    [186, 0, "atlasDrift"],
    [238, 1],
  ]),
  ships: K([
    [180, 0, "atlasDrift"],
    [236, 1],
  ]),
  shipsLeave: K([
    [284, 0, "atlasDrift"],
    [334, 1],
  ]),
  britishRoute: K([
    [224, 0, "atlasDrift"],
    [258, 1],
  ]),
  counterRoute: K([
    [240, 0, "atlasDrift"],
    [266, 1],
  ]),
  reverse: K([
    [268, 0, "institutionalLock"],
    [296, 1],
  ]),
  townFold: K([
    [292, 0, "atlasDrift"],
    [318, 1],
    [340, 1, "ceremonial"],
    [372, 0],
  ]),
  mapBack: (f: number) => win(f, 290, 312, 336, 372),
  napoleon: (f: number) => win(f, 298, 312, 334, 352),
  /** 1808: the imperial line loses ink, from the middle toward Buenos Aires. */
  gapA: K([
    [300, 0.62, "atlasDrift"],
    [336, 0.08],
  ]),
  gapB: K([
    [300, 0.62, "atlasDrift"],
    [334, 0.986],
  ]),
  cabildo: K([
    [346, 0, "atlasDrift"],
    [414, 1],
  ]),
  ends: K([
    [336, 0, "ceremonial"],
    [356, 1],
  ]),
  crowd: K([
    [360, 0, "atlasDrift"],
    [446, 1],
  ]),
  umbrellas: K([
    [378, 0],
    [398, 1],
    [462, 1, "atlasDrift"],
    [476, 0.4],
  ]),
  rain: (f: number) => win(f, 344, 366, 452, 470),
  pulse: K([
    [462, 0, "restrainedImpact"],
    [478, 1],
  ]),
  excite: K([
    [440, 0.05],
    [461, 0.25],
    [462, 0.9, "atlasDrift"],
    [480, 0.55],
  ]),
  glint: (f: number) => win(f, 462, 464, 468, 471),
  sky: K([
    [461, 0],
    [462, 0.35, "restrainedImpact"],
    [476, 1],
  ]),
  exitFold: K([
    [462, 0, "atlasDrift"],
    [500, 1],
  ]),
};

/* ---------------------------------------------------------------- camera */

export const KEYS_02_03: readonly CamKey[] = [
  { f: 172, x: 6180, y: -560, zoom: 0.34, tilt: 8, rot: 18 },
  { f: 196, x: 6040, y: -300, zoom: 1.2, tilt: 10, rot: 36 },
  camIn(PL, 218, 520, 60, 0.9, 30, 0),
  camIn(PL, 244, 360, 380, 1.25, 50, 0),
  camIn(PL, 266, 160, 420, 1.45, 53, 0),
  camIn(PL, 288, 300, 300, 0.95, 36, 0),
  { f: 312, x: 6900, y: -1150, zoom: 0.33, tilt: 28, rot: 26 },
  { f: 332, x: 6500, y: -700, zoom: 0.42, tilt: 20, rot: 38 },
  camIn(PL, 356, CABILDO_CX, 330, 0.62, 18, 0),
  camIn(PL, 392, CABILDO_CX, 420, 1.0, 42, 0),
  camIn(PL, 430, CABILDO_CX, 380, 1.35, 50, 0),
  camIn(PL, 461, CABILDO_CX, 310, 1.85, 50, 0),
  // Hard cut (25 MAY 1810): wide, revealing the full plaza.
  camIn(PL, 462, CABILDO_CX, 470, 0.92, 55, 0),
  camIn(PL, 478, CABILDO_CX, 470, 0.8, 44, 0),
];

/* ---------------------------------------------------------------- ground */

const RIVER_HATCH = (() => {
  let d = "";
  for (let k = 0; k < 22; k++) {
    const y = -40 - k * 70;
    for (let i = 0; i < 9; i++) {
      const x = -1700 + i * 460 + ((k * 137) % 230);
      d += `M ${x} ${y} q 40 -8 80 0 `;
    }
  }
  return d;
})();

const arrowHead = (p: Point, dir: Point, s: number) => {
  const l = Math.hypot(dir[0], dir[1]) || 1;
  const u: Point = [dir[0] / l, dir[1] / l];
  const n: Point = [-u[1], u[0]];
  return `M ${p[0] - u[0] * s + n[0] * s * 0.6} ${p[1] - u[1] * s + n[1] * s * 0.6} L ${p[0]} ${p[1]} L ${p[0] - u[0] * s - n[0] * s * 0.6} ${p[1] - u[1] * s - n[1] * s * 0.6}`;
};

const BuenosAiresGround: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const town = T.townBuild(f);
  const mapB = T.mapBack(f);
  const br = T.britishRoute(f);
  const cr = T.counterRoute(f);
  const rev = T.reverse(f);
  const o = clamp01(town * 1.4) * (1 - 0.8 * mapB);
  // British route: beach → west along the shore road; later reversed.
  const bx = lerp(760, lerp(230, 560, rev), br);
  return (
    <>
      <MapGround
        camera={camera}
        placement={IDENTITY}
        continents={["southAmerica", "euroAfrica", "northAmerica", "caribbean", "florida", "britain"]}
        opacity={f < 180 ? 0 : Math.max(1 - ramp(f, 196, 226), mapB)}
        graticule={0.6}
        clipId="s02"
      />
      <SheetGround camera={camera} pl={PL} opacity={o}>
        <path d={RIVER_HATCH} fill="none" stroke={PALETTE.skyBlue} strokeWidth={1.1} opacity={0.55} />
        <path d={`${SHORE_D} L 2200 1400 L -1700 1400 Z`} fill={mixColor(PALETTE.paperWarm, PALETTE.grayBluePale, 0.18)} stroke="none" />
        <path d={SHORE_D} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={1.4} />
        <path d={SHORE_D} fill="none" stroke={PALETTE.skyBlue} strokeWidth={7} opacity={0.25} transform="translate(0 -8)" />
        <path d={BLOCKS_D} fill={mixColor(PALETTE.paperWarm, PALETTE.grayBlue, 0.12)} stroke={mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.4)} strokeWidth={1} />
        <rect x={PLAZA.x0} y={PLAZA.y0} width={PLAZA.x1 - PLAZA.x0} height={PLAZA.y1 - PLAZA.y0} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={1.2} />
        <path
          d={Array.from({ length: 9 }, (_, i) => `M ${PLAZA.x0} ${PLAZA.y0 + i * 42} H ${PLAZA.x1}`).join(" ")}
          stroke={PALETTE.grayBlue}
          strokeWidth={0.8}
          opacity={0.5}
        />
        {/* The fort: bastioned plan on the shore. */}
        <path
          d={`M ${FORT.x0} ${FORT.y0} L ${FORT.x1} ${FORT.y0} L ${FORT.x1 + 40} ${FORT.y0 - 30} L ${FORT.x1 + 20} ${FORT.y1} L ${FORT.x0 - 20} ${FORT.y1} L ${FORT.x0 - 40} ${FORT.y0 - 30} Z`}
          fill={mixColor(PALETTE.grayBlue, PALETTE.paperWarm, 0.5)}
          stroke={PALETTE.deepBlueSoft}
          strokeWidth={1.3}
        />
        <path d={`M 1000 0 V -230 M 1040 0 V -230 M 1000 -230 H 1040`} stroke={PALETTE.deepBlueSoft} strokeWidth={1.4} />
        {br > 0.002 ? (
          <g opacity={1 - ramp(f, 300, 318)}>
            <path d={`M 900 417 L ${bx} 417`} stroke={NAVY} strokeWidth={3} strokeDasharray="12 9" fill="none" />
            <path d={arrowHead([bx, 417], [rev > 0.5 ? 1 : -1, 0], 22)} stroke={NAVY} strokeWidth={3} fill="none" />
          </g>
        ) : null}
        {cr > 0.002 ? (
          <g opacity={1 - ramp(f, 300, 318)} stroke={PALETTE.skyBlue} strokeWidth={3.2} fill="none" strokeLinecap="round">
            <path d={`M -900 417 L ${lerp(-900, 80 + rev * 250, cr)} 417`} />
            <path d={`M 138 900 L 138 ${lerp(900, 470, cr)}`} />
            <path d={`M -46 900 L -46 ${lerp(900, 480, cr)}`} />
            {cr > 0.9 ? <circle cx={160 + rev * 220} cy={417} r={40 * (1 - rev * 0.5)} strokeDasharray="6 6" /> : null}
          </g>
        ) : null}
      </SheetGround>
    </>
  );
};

/* ------------------------------------------------------------------ actors */

const S = 0.8;

const british: ActorTrack[] = Array.from({ length: 10 }, (_, i) => {
  const file = i % 2;
  const rank = Math.floor(i / 2);
  const x0 = 760 + rank * 44;
  const y = 400 + file * 34;
  const stopX = 250 + rank * 44;
  return actor(
    `british.${i}`,
    "british1806",
    S,
    [P(226, x0, y), P(262, stopX, y, "institutionalLock"), P(272, stopX, y), P(300, stopX + 520, y, "atlasDrift")],
    [A(226, "march", { facing: -1 }), A(262, "guard", { facing: -1, breadth: 0.5 }), A(272, "retreat", { facing: 1, blend: 8 })],
    { from: 226 + rank * 2, to: 312, enter: "rise", enterDur: 12, exit: "fold", exitDur: 14 },
  );
});

const patricios: ActorTrack[] = Array.from({ length: 8 }, (_, i) => {
  const file = i % 2;
  const rank = Math.floor(i / 2);
  const x0 = -720 - rank * 42;
  const y = 398 + file * 34;
  return actor(
    `patricio.${i}`,
    "patricio",
    S,
    [P(236, x0, y), P(266, -60 - rank * 42, y, "institutionalLock"), P(274, -60 - rank * 42, y), P(302, 200 - rank * 42, y, "atlasDrift")],
    [A(236, "march", { facing: 1 }), A(266, "guard", { facing: 1, breadth: 0.5 }), A(274, "march", { facing: 1 })],
    { from: 236, to: 316, enter: "rise", enterDur: 12, exit: "fold", exitDur: 14 },
  );
});

const vecinos: ActorTrack[] = [
  actor("vecino.1", "vecinoLight", S, [P(242, 138, 760), P(276, 138, 330, "atlasDrift")], [A(242, "walk"), A(276, "point", { dur: 16 })], { from: 242, to: 316, exit: "fold" }),
  actor("vecino.2", "vecina", S * 0.94, [P(246, 150, 820), P(280, 160, 400, "atlasDrift")], [A(246, "walk"), A(280, "stand")], { from: 246, to: 316, exit: "fold" }),
  actor("vecino.3", "vecinoLight", S, [P(248, -46, 800), P(282, -46, 360, "atlasDrift")], [A(248, "walk"), A(282, "cheer", { amount: 0.6 })], { from: 248, to: 316, exit: "fold" }),
  // Residents on the rooftops (1807 defence): watch, then raise their arms.
  actor("roof.1", "vecinoLight", S, [P(240, -330, 394)], [A(240, "stand", { facing: 1 }), A(268, "cheer", { amount: 0.8 })], { from: 240, to: 316, exit: "fold" }, { lift: 104 }),
  actor("roof.2", "patricio", S, [P(244, -260, 394)], [A(244, "guard", { facing: 1 }), A(272, "point", { dur: 14 })], { from: 244, to: 316, exit: "fold" }, { lift: 104 }),
  actor("roof.3", "vecina", S * 0.94, [P(250, 420, 394)], [A(250, "stand", { facing: -1 }), A(276, "cheer", { amount: 0.7 })], { from: 250, to: 316, exit: "fold" }, { lift: 100 }),
];

/* ---- 1810 ---- */

const CROWD = seedCrowd({
  seed: 1810,
  count: 190,
  shirts: 5,
  area: (r) => [PLAZA.x0 + 20 + r() * (PLAZA.x1 - PLAZA.x0 - 40), PLAZA.y0 + 60 + r() * (PLAZA.y1 - PLAZA.y0 - 70)],
  from: (p, r) => [(r() - 0.5) * 200, 380 + r() * 200],
});
const CROWD_LOOK = {
  u: 6.4,
  tall: 9.6,
  shirts: [
    mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.3),
    mixColor(PALETTE.grayBlue, PALETTE.paperWarm, 0.3),
    mixColor(PALETTE.deepBlue, PALETTE.deepBlueSoft, 0.5),
    mixColor(PALETTE.grayBluePale, PALETTE.skyBluePale, 0.3),
    PALETTE.paperWarm,
  ],
} as const;

const people1810: ActorTrack[] = [
  ...[0, 1, 2, 3, 4, 5].map((i) =>
    actor(`guard1810.${i}`, "patricio", S, [P(370, -120 + i * 70, 262)], [A(370, "guard", { facing: 1, breadth: 0.7 }), A(462 + i, "cheer", { amount: 0.5 })], { from: 364 + i * 3, to: 500, enter: "rise", exit: "fold" }),
  ),
  // Members of the open council on the Cabildo balcony (upper arcade).
  actor("balcony.1", "vecino", S * 0.95, [P(404, CABILDO_CX - 60, CABILDO.y - 4)], [A(404, "stand", { facing: 1, breadth: 0.8 }), A(440, "point", { dur: 18 })], { from: 404, to: 492, enter: "rise", exit: "fold" }, { lift: 106, wardrobe: "vecinoLight" }),
  actor("balcony.2", "delegate", S * 0.95, [P(410, CABILDO_CX - 10, CABILDO.y - 4)], [A(410, "stand", { breadth: 0.85 }), A(462, "armsUp", { dur: 10 })], { from: 410, to: 492, enter: "rise", exit: "fold" }, { lift: 106 }),
  actor("balcony.3", "vecinoLight", S * 0.95, [P(414, CABILDO_CX + 40, CABILDO.y - 4)], [A(414, "stand", { facing: -1, breadth: 0.8 }), A(464, "cheer", { amount: 0.8 })], { from: 414, to: 492, enter: "rise", exit: "fold" }, { lift: 106 }),
  actor("balcony.4", "delegateB", S * 0.95, [P(418, CABILDO_CX + 92, CABILDO.y - 4)], [A(418, "stand", { facing: -1, breadth: 0.7 }), A(466, "cheer", { amount: 0.6 })], { from: 418, to: 492, enter: "rise", exit: "fold" }, { lift: 106 }),
  // Foreground: two figures with umbrellas crossing close to camera.
  actor("fg1810.1", "vecino", 1, [P(376, -260, 900), P(452, 260, 900)], [A(376, "umbrellaWalk", { facing: 1 })], { from: 376, to: 452, enter: "none", exit: "fade" }, { depth: 2.1, detail: "hero" }),
  actor("fg1810.2", "vecina", 0.95, [P(392, 520, 930), P(461, 40, 930)], [A(392, "umbrellaWalk", { facing: -1 })], { from: 392, to: 461, enter: "none", exit: "none" }, { depth: 2.1, detail: "hero" }),
];

/* ------------------------------------------------------------------- items */

const buildingItems = (ctx: FilmCtx): StageItem[] => {
  const { f } = ctx;
  const p = ctx.proj(PL);
  const out: StageItem[] = [];
  const fold = Math.max(foldFromTilt(ctx.camera, 10, 40), T.townFold(f), f >= 462 ? T.exitFold(f) : 0);
  const town = T.townBuild(f);
  const massT = 1 - T.mapBack(f) * 0.9;
  for (const h of HOUSES) {
    const b = clamp01(town * 1.5 - h.d / 2200);
    if (b <= 0.001 || !ctx.onScreen(PL, h.x + h.w / 2, h.y, 1, 260)) {
      continue;
    }
    out.push({
      key: h.id,
      y: h.y,
      depth: 1,
      node: (
        <Building p={p} kind={h.tall ? "colonialHouseTall" : "colonialHouse"} x={h.x} y={h.y} w={h.w} h={h.h} build={b} fold={fold} variant={h.variant} opacity={massT} tone={0.05 + clamp01((h.y - 600) / 400) * 0.15} id={`ba-${h.id}`} />
      ),
    });
  }
  out.push({
    key: "fort",
    y: FORT.y1,
    depth: 1,
    node: <Building p={p} kind="fortWall" x={FORT.x0 - 20} y={FORT.y1} w={FORT.x1 - FORT.x0 + 40} h={70} build={town} fold={fold} opacity={massT} id="ba-fort" />,
  });
  out.push({
    key: "catedral",
    y: CATEDRAL.y,
    depth: 1,
    node: <Building p={p} kind="church" x={CATEDRAL.x0} y={CATEDRAL.y} w={CATEDRAL.w} h={CATEDRAL.h} build={Math.max(clamp01(town * 1.2 - 0.1), T.cabildo(f))} fold={fold} opacity={massT} id="ba-catedral" />,
  });
  // The Cabildo: its two ends rise first (the broken line), then it drafts.
  const cab = T.cabildo(f);
  const ends = T.ends(f) * (1 - T.exitFold(f));
  if (ends > 0.002 && f < 470) {
    const m = standMatrix(p, 0, CABILDO.y, 1, 1, fold);
    out.push({
      key: "cabildo.ends",
      y: CABILDO.y + 0.2,
      depth: 1,
      node: (
        <g transform={m} opacity={1 - clamp01((cab - 0.6) / 0.4)}>
          <path
            d={`M ${CABILDO.x0} 0 V ${-CABILDO.h * ends} M ${CABILDO.x0 + CABILDO.w} 0 V ${-CABILDO.h * ends}`}
            stroke={COLONIAL}
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ),
    });
  }
  if (cab > 0.001) {
    out.push({
      key: "cabildo",
      y: CABILDO.y,
      depth: 1,
      node: <Building p={p} kind="cabildo" x={CABILDO.x0} y={CABILDO.y} w={CABILDO.w} h={CABILDO.h} build={cab} fold={fold} id="ba-cabildo" />,
    });
  }
  const glint = T.glint(f);
  if (glint > 0.002) {
    const a = p.point(CABILDO_CX, CABILDO.y, 0);
    const b = p.point(CABILDO_CX, CABILDO.y, (CABILDO.h + 170) * (1 - fold));
    out.push({
      key: "cabildo.glint",
      y: CABILDO.y + 0.5,
      depth: 1,
      node: <path d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`} stroke={PALETTE.goldMuted} strokeWidth={2.4} opacity={glint} />,
    });
  }
  return out;
};

const shipItems = (ctx: FilmCtx): StageItem[] => {
  const { f } = ctx;
  if (f < 176 || f > 340) {
    return [];
  }
  const p = ctx.proj(PL);
  const t = T.ships(f);
  const leave = T.shipsLeave(f);
  const fold = Math.max(foldFromTilt(ctx.camera, 8, 36), T.townFold(f));
  const anchors: Point[] = [
    [900, -300],
    [1250, -420],
    [1560, -260],
  ];
  return anchors.map((a, i) => {
    const x = lerp(a[0] + 1500, a[0], t) + leave * 1400;
    const y = lerp(a[1] - 1300, a[1], t) - leave * 900;
    return {
      key: `frigate.${i}`,
      y,
      depth: 1,
      node: <Ship p={p} x={x} y={y} scale={0.95} facing={leave > 0.05 ? 1 : -1} kind="frigate" wind={f / 30 + i * 0.4} fold={fold} opacity={1 - ramp(f, 316, 336)} furl={clamp01((t - 0.9) * 10) * (1 - leave) * 0.6} />,
    };
  });
};

const rainItems = (ctx: FilmCtx): StageItem[] => {
  const { f } = ctx;
  const o = T.rain(f);
  if (o <= 0.002) {
    return [];
  }
  const p = ctx.proj(PL);
  let near = "";
  let far = "";
  for (const d of RAIN) {
    const h = 420 * (1 - ((f / 14 + d.ph) % 1));
    const a = p.point(d.x, d.y, h);
    const b = p.point(d.x, d.y, h + 26);
    const seg = `M ${a[0].toFixed(1)} ${a[1].toFixed(1)} L ${b[0].toFixed(1)} ${b[1].toFixed(1)} `;
    if (d.y > 500) {
      near += seg;
    } else {
      far += seg;
    }
  }
  const st = { stroke: PALETTE.skyBlue, strokeWidth: 1.2, opacity: 0.55 * o, fill: "none" };
  return [
    { key: "rain.far", y: 240, depth: 1, node: <path d={far} {...st} /> },
    { key: "rain.near", y: 900, depth: 1, node: <path d={near} {...st} /> },
  ];
};

const items02_03 = (ctx: FilmCtx): StageItem[] => {
  const { f } = ctx;
  const out: StageItem[] = [...buildingItems(ctx), ...shipItems(ctx), ...rainItems(ctx)];
  out.push(...actorItems(ctx, PL, [...british, ...patricios, ...vecinos, ...people1810]));
  const crowd = T.crowd(f);
  if (crowd > 0.002) {
    const pulse = T.pulse(f);
    out.push(
      ...crowdItems({
        key: "crowd1810",
        p: ctx.proj(PL),
        members: CROWD,
        look: { ...CROWD_LOOK, umbrellas: T.umbrellas(f), flags: clamp01((f - 462) / 10) * 0.9 },
        state: {
          presence: crowd,
          excite: T.excite(f),
          pulse: pulse > 0 && pulse < 1 ? { x: lerp(PLAZA.x1 + 40, PLAZA.x0 - 40, pulse), width: 90, strength: 1 } : null,
          rise: 1 - Math.max(foldFromTilt(ctx.camera, 10, 40), T.exitFold(f)),
          opacity: 1 - ramp(f, 490, 510),
        },
        f,
      }),
    );
  }
  return out;
};

/* ----------------------------------------------------------------- overlay */

const Overlay: React.FC<{ f: number }> = ({ f }) => {
  const inv = win(f, 194, 208, 262, 278);
  const esp = win(f, 300, 312, 340, 352);
  const oid = win(f, 292, 304, 338, 350);
  const may = win(f, 462, 463, 506, 520);
  const grito = win(f, 466, 470, 510, 524);
  return (
    <>
      <At x={168} y={96} id="label.1806">
        <DateText text="1806–1807" size={96} o={inv} enter={ramp(f, 194, 208)} />
        <EventText lines={["INVASIONES INGLESAS"]} o={inv} enter={ramp(f, 198, 214)} tracking={0.16} />
      </At>
      <At x={168} y={774} id="label.1808">
        <DateText text="1808" size={96} o={esp} enter={ramp(f, 300, 312)} />
        <EventText lines={["ESPAÑA EN CRISIS"]} o={esp} enter={ramp(f, 304, 318)} tracking={0.16} />
      </At>
      <At x={1752} y={120} align="right" id="anthem.oid">
        <AnthemText lines={["OÍD, MORTALES…"]} o={oid} reveal={ramp(f, 292, 306)} align="right" />
      </At>
      <At x={168} y={96} id="label.1810">
        <DateText text="25 MAY 1810" size={132} o={may} />
        <EventText lines={["REVOLUCIÓN DE MAYO"]} o={may * ramp(f, 464, 474)} size={32} tracking={0.18} mt={12} />
      </At>
      <At x={960} y={900} align="center" id="anthem.grito">
        <AnthemText lines={["…EL GRITO SAGRADO"]} o={grito} reveal={ramp(f, 466, 484)} center align="center" size={52} />
      </At>
    </>
  );
};

/* ------------------------------------------------ Napoleon (1808, map scale) */

const NAPOLEON_AT = M(49.0, 32.2);
const napoleonTrack: ActorTrack = actor(
  "historical.napoleon",
  "napoleon",
  1,
  [P(298, NAPOLEON_AT[0] + 300, NAPOLEON_AT[1]), P(326, NAPOLEON_AT[0], NAPOLEON_AT[1], "institutionalLock")],
  [A(298, "march", { facing: -1 }), A(322, "point", { dur: 16, facing: -1 })],
  { from: 298, to: 352, enter: "rise", enterDur: 14, exit: "fold", exitDur: 16 },
  { detail: "hero", build: "stocky", role: "primary" },
);

const napoleonItems = (ctx: FilmCtx): StageItem[] => {
  const { f, camera } = ctx;
  const o = T.napoleon(f);
  if (o <= 0.002) {
    return [];
  }
  // A drafted figure standing on the chart: ~35% of frame height, then folds away.
  const scale = 5.2 / camera.zoom;
  const tr = { ...napoleonTrack, scale };
  const items = actorItems(ctx, IDENTITY, [tr]);
  const p = ctx.proj(IDENTITY);
  // Angular military arrows pressing on the Atlantic connection.
  let d = "";
  for (let i = 0; i < 3; i++) {
    const a = p.point(NAPOLEON_AT[0] - 200 - i * 380, NAPOLEON_AT[1] + 500 + i * 260, 0);
    const b = p.point(NAPOLEON_AT[0] - 900 - i * 380, NAPOLEON_AT[1] + 1000 + i * 260, 0);
    const u = [b[0] - a[0], b[1] - a[1]];
    const l = Math.hypot(u[0], u[1]) || 1;
    const n = [-u[1] / l, u[0] / l];
    d += `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} M ${b[0] - (u[0] / l) * 22 + n[0] * 14} ${b[1] - (u[1] / l) * 22 + n[1] * 14} L ${b[0]} ${b[1]} L ${b[0] - (u[0] / l) * 22 - n[0] * 14} ${b[1] - (u[1] / l) * 22 - n[1] * 14} `;
  }
  items.push({ key: "napoleon.arrows", y: NAPOLEON_AT[1] + 800, depth: 1, node: <path d={d} stroke={NAVY} strokeWidth={3} fill="none" strokeLinejoin="miter" opacity={o * clamp01((f - 306) / 10)} /> });
  return items;
};

export const STAGES_02_03: readonly FilmStage[] = [
  {
    id: "s02-03",
    from: 172,
    to: 520,
    Ground: BuenosAiresGround,
    items: (ctx) => [...items02_03(ctx), ...napoleonItems(ctx)],
    Overlay,
  },
];

/* ------------------------------------------------------------- memory line */

const COLONIAL_RANGE = (start: number, end: number, opacity = 0.95) => ({ start, end, opacity, color: COLONIAL });

export const ERA_02: LineEra = {
  id: "colonialConnection",
  from: 180,
  to: 335,
  evaluate: (f) => {
    const a = T.gapA(f);
    const b = T.gapB(f);
    const far = 1 - ramp(f, 318, 336) * 0.7;
    return {
      points: ATLANTIC_ROUTE,
      ranges: f < 300 ? [COLONIAL_RANGE(0, 1)] : [COLONIAL_RANGE(0, a, 0.95 * far), COLONIAL_RANGE(b, 1)],
      head: null,
      core: [],
      sheet: PL,
    };
  },
};

export const ERA_03: LineEra = {
  id: "plazaAxis",
  from: 336,
  to: 479,
  evaluate: (f) => {
    const m = ramp(f, 336, 372);
    const pts = interpolatePoints(ATLANTIC_ROUTE, PLAZA_STATE, m);
    const grow = ramp(f, 372, 404);
    // The ribbon leaves through the Cabildo: the axis empties toward it at the end.
    const start = lerp(lerp(0.986, 0.6, grow), 0.985, ramp(f, 466, 479));
    const sky = T.sky(f);
    const color = mixColor(COLONIAL, PALETTE.skyBlue, sky);
    const ranges = [{ start, end: 1, opacity: 0.95, color }];
    // Civic pulse climbing the axis toward the Cabildo (sky blue, never gold).
    const pulse = T.pulse(f);
    if (f >= 462 && pulse < 1) {
      const e = lerp(0.62, 0.99, pulse);
      ranges.push({ start: Math.max(start, e - 0.07), end: e, opacity: 1, color: PALETTE.skyBlue, dash: undefined } as (typeof ranges)[number]);
    }
    return { points: pts, ranges, head: null, core: [], sheet: PL };
  },
};
