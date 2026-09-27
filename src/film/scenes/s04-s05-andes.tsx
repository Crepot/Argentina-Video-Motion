import React from "react";
import { clamp01, lerp } from "../../animation/interpolate-clamped";
import type { ActorTrack, PosKey } from "../../actors/action-track";
import { interpolatePoints } from "../../paths/interpolate-path";
import { billboardMatrix } from "../../stage/projection";
import { FlagCloth } from "../../stage/FlagCloth";
import { mixColor, PALETTE } from "../../theme/palette";
import type { CameraState } from "../../types/camera";
import type { Point } from "../../types/paths";
import { A, P, actor, actorItems } from "../actors";
import { foldFromTilt, K, ramp, win } from "../anim";
import { M, place as placeLL } from "../data/geo";
import { PLAZA_STATE } from "../data/ba-colonial";
import { Building } from "../draw/architecture";
import { AnthemText, At, DateText, EventText, MapLabel } from "../draw/labels";
import { MapGround } from "../draw/map";
import { SheetGround } from "../draw/sheet";
import { standMatrix } from "../draw/stand";
import { ChainLinks, SunOfMay } from "../draw/symbols";
import { makeRidge, Ridge, Rock } from "../draw/terrain";
import { camIn, type CamKey } from "../film-camera";
import { lineState, placedState } from "../line";
import { anchorAt, IDENTITY, toWorld } from "../space";
import type { FilmCtx, FilmStage, LineEra, StageItem } from "../types";

/**
 * Scene 04 (1810–1816, frames 480–674): the sky-blue ribbon leaves the
 * plaza, Belgrano raises the flag at Rosario, the route turns west and the
 * atlas lifts into the Andes: the Army of the Andes marches up a mountain
 * path — infantry, granaderos, mules, flags and San Martín on horseback —
 * followed laterally with foreground rock parallax; the imperial chain
 * breaks at the pass (the storyboard stops the route at the ridge: the
 * 1817 crossing is not pre-dated).
 * Scene 05 (1816, frames 675–809): contours flatten into the rules of the
 * declaration; delegates arrive at the Casa de Tucumán; signatures; at 738
 * the first earned gold (seal, date rule, a narrow Sun-of-May ray).
 */
export const ANDES = anchorAt([0, 0], M(68.6, 32.9), 0.2);
const PL = ANDES;

const PATH_CTRL: readonly Point[] = [
  [700, 140],
  [300, 80],
  [-100, 130],
  [-500, 50],
  [-900, 110],
  [-1300, 40],
  [-1700, 90],
  [-2200, 10],
  [-2800, 60],
];
const PATH = lineState(PATH_CTRL);
const pathY = (x: number) => {
  for (let i = 0; i < PATH.length - 1; i++) {
    const a = PATH[i];
    const b = PATH[i + 1];
    if ((x <= a[0] && x >= b[0]) || (x >= a[0] && x <= b[0])) {
      return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0] || 1));
    }
  }
  return x > PATH[0][0] ? PATH[0][1] : PATH[PATH.length - 1][1];
};

const T = {
  ribbon: K([
    [480, 0, "atlasDrift"],
    [516, 0.3, "linearTravel"],
    [548, 0.5, "atlasDrift"],
    [668, 0.93],
  ]),
  belgrano: (f: number) => win(f, 492, 504, 532, 548),
  flagRaise: K([
    [502, 0, "ceremonial"],
    [526, 1],
  ]),
  north: K([
    [516, 0, "atlasDrift"],
    [556, 1],
  ]),
  terrainRise: K([
    [540, 0, "ceremonial"],
    [590, 1],
    [666, 1, "atlasDrift"],
    [692, 0],
  ]),
  army: K([
    [548, 0, "atlasDrift"],
    [580, 1],
  ]),
  chainBreak: K([
    [636, 0, "restrainedImpact"],
    [654, 1],
  ]),
  page: K([
    [672, 0, "atlasDrift"],
    [702, 1],
  ]),
  house: K([
    [684, 0, "atlasDrift"],
    [736, 1],
  ]),
  signatures: K([
    [704, 0],
    [736, 1],
  ]),
  seal: K([
    [737, 0, "ceremonial"],
    [746, 1],
  ]),
  perimeter: K([
    [738, 0, "atlasDrift"],
    [760, 1],
  ]),
  split: K([
    [784, 0, "institutionalLock"],
    [809, 1],
  ]),
  sunRay: (f: number) => win(f, 740, 752, 780, 800),
  exit: K([
    [790, 0, "atlasDrift"],
    [818, 1],
  ]),
};

/** Army vanguard x on the path (local). */
const headX = (f: number) => lerp(260, -2150, clamp01((f - 548) / (700 - 548)));

/* ---------------------------------------------------------------- camera */

const ROSARIO = placeLL("rosario");
export const KEYS_04_05: readonly CamKey[] = [
  { f: 500, x: 5860, y: -390, zoom: 0.62, tilt: 22, rot: 22 },
  { f: 522, x: ROSARIO[0] + 40, y: ROSARIO[1] - 60, zoom: 0.72, tilt: 30, rot: 8 },
  { f: 546, x: 4860, y: -520, zoom: 0.95, tilt: 22, rot: 0 },
  camIn(PL, 588, 60, -20, 0.95, 36, 0),
  camIn(PL, 610, -560, 20, 1.5, 56, 0),
  camIn(PL, 628, -830, 100, 2.7, 66, 0),
  camIn(PL, 650, -1110, 40, 1.8, 58, 0),
  camIn(PL, 664, -1350, 40, 1.3, 50, 0),
  camIn(PL, 686, -1620, 180, 1.0, 30, 0),
  camIn(PL, 708, -1650, 140, 1.1, 38, 0),
  camIn(PL, 736, -1650, 10, 1.5, 50, 0),
  camIn(PL, 764, -1650, 60, 1.28, 46, 0),
  camIn(PL, 792, -1640, 90, 0.9, 26, 0),
];

/* ----------------------------------------------------------------- terrain */

const FAR = makeRidge(1817, -4600, 2400, 250, 380, 12);
const MID = makeRidge(1816, -3800, 1800, 160, 270, 15);
const NEAR = makeRidge(1814, -3500, 1400, 90, 170, 20);
const FORE = makeRidge(1813, -3600, 1600, 30, 70, 26);
const CHAIN: readonly Point[] = Array.from({ length: 34 }, (_, i) => [-900 - i * 44, -70 + Math.sin(i * 0.9) * 6] as Point);

const SCREE = (() => {
  let d = "";
  for (let i = 0; i < 260; i++) {
    const x = -3400 + ((i * 7919) % 4800);
    const y = -110 + ((i * 104729) % 520);
    if (Math.abs(y - pathY(x)) < 30) {
      continue;
    }
    d += `M ${x} ${y} l ${6 + (i % 5) * 3} ${-(2 + (i % 3))} `;
  }
  return d;
})();

const PAGE = { x0: -2000, y0: 150, w: 700, h: 430 };
const PAGE_BASE_Y = PAGE.y0 + PAGE.h + 8;
const DOOR: Point = [-1650, -40];

const AndesGround: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const north = T.north(f);
  const page = T.page(f);
  const exit = T.exit(f);
  const sig = T.signatures(f);
  const per = T.perimeter(f) * (1 - T.split(f) * 0.6);
  const split = T.split(f);
  const mapO = f < 575 ? 1 : 1 - ramp(f, 575, 600) + ramp(f, 792, 812);
  const tuc = placeLL("tucuman");
  const salta = placeLL("salta");
  const cor = placeLL("cordoba");
  return (
    <>
      <MapGround camera={camera} placement={IDENTITY} continents={["southAmerica"]} opacity={f >= 480 && f < 520 ? ramp(f, 480, 500) : mapO} graticule={0.5} clipId="s04" />
      {f >= 520 && f <= 600 ? (
        <SheetGround camera={camera} pl={IDENTITY} opacity={ramp(f, 520, 546) * (1 - ramp(f, 584, 600))}>
          {Array.from({ length: 9 }, (_, i) => {
            const lon = 69.2 + i * 0.28;
            let d = "";
            for (let lat = 27; lat <= 38; lat += 0.5) {
              const q = M(lon + Math.sin(lat * 2.1 + i) * 0.12, lat);
              d += `${d ? "L" : "M"} ${q[0].toFixed(1)} ${q[1].toFixed(1)} `;
            }
            return <path key={i} d={d} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={0.9} opacity={0.5 - i * 0.04} />;
          })}
        </SheetGround>
      ) : null}
      {north > 0.002 ? (
        <SheetGround camera={camera} pl={IDENTITY} opacity={1 - ramp(f, 580, 600)}>
          <path
            d={`M ${ROSARIO[0]} ${ROSARIO[1]} L ${lerp(ROSARIO[0], cor[0], clamp01(north * 3))} ${lerp(ROSARIO[1], cor[1], clamp01(north * 3))} ${north > 0.33 ? `L ${lerp(cor[0], tuc[0], clamp01(north * 3 - 1))} ${lerp(cor[1], tuc[1], clamp01(north * 3 - 1))}` : ""} ${north > 0.66 ? `L ${lerp(tuc[0], salta[0], clamp01(north * 3 - 2))} ${lerp(tuc[1], salta[1], clamp01(north * 3 - 2))}` : ""}`}
            fill="none"
            stroke={PALETTE.skyBlue}
            strokeWidth={2.2}
            strokeDasharray="2 7"
            strokeLinecap="round"
          />
        </SheetGround>
      ) : null}
      <SheetGround camera={camera} pl={PL} opacity={ramp(f, 560, 590) * (1 - exit)}>
        {/* Valley floor, path bed and contour hatching of the cordillera foothills. */}
        <path d={`M -4200 -1600 H 2400 V 900 H -4200 Z`} fill={mixColor(PALETTE.paperWarm, PALETTE.grayBluePale, 0.25)} opacity={0.6 * (1 - page)} />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M -3600 ${-260 - i * 140} C -2400 ${-300 - i * 150}, -600 ${-200 - i * 140}, 1600 ${-280 - i * 150}`} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={0.8} opacity={0.3 * (1 - page)} />
        ))}
        <path d={SCREE} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={0.9} opacity={0.35 * (1 - page)} />
        <path d={`M ${PATH_CTRL.map((q) => `${q[0]} ${q[1]}`).join(" L ")}`} fill="none" stroke={mixColor(PALETTE.grayBlue, PALETTE.paperWarm, 0.3)} strokeWidth={26} strokeLinejoin="round" opacity={0.7 * (1 - page)} />
        <ChainLinks pts={CHAIN.map((q, i) => [q[0], q[1] + (i > 14 ? 1 : -1) * 18 * T.chainBreak(f)] as Point)} o={win(f, 596, 612, 656, 676)} breakAt={0.5} gap={40 * T.chainBreak(f)} size={22} />
        {page > 0.002 ? (
          <g data-id="declaration.page">
            <rect x={PAGE.x0} y={PAGE.y0} width={PAGE.w} height={PAGE.h * page} fill={PALETTE.paperWarm} stroke={PALETTE.deepBlueSoft} strokeWidth={1.2} />
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d={`M ${PAGE.x0 + 40} ${PAGE.y0 + 60 + i * 30} H ${PAGE.x0 + 40 + (PAGE.w - 80) * clamp01(page * 1.6 - i * 0.05)}`} stroke={PALETTE.grayBlue} strokeWidth={0.9} />
            ))}
            {/* Abstract signatures (procedural flourishes, not facsimiles). */}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => {
              const t = clamp01(sig * 7 - i);
              if (t <= 0) {
                return null;
              }
              const x = PAGE.x0 + 70 + (i % 4) * 150;
              const y = PAGE.y0 + 300 + Math.floor(i / 4) * 56;
              const n = Math.max(2, Math.round(10 * t));
              let d = `M ${x} ${y}`;
              for (let k = 1; k <= n; k++) {
                d += ` q ${8 + (k % 3) * 4} ${(k % 2 ? -1 : 1) * (14 + i * 2)} ${12 + (k % 2) * 6} 0`;
              }
              return <path key={i} d={d} fill="none" stroke={PALETTE.deepBlue} strokeWidth={1.3} />;
            })}
            {per > 0.002 ? (
              <path
                d={`M ${PAGE.x0 - 10 - split * 60} ${PAGE.y0 - 10 - split * 40} H ${PAGE.x0 + PAGE.w + 10 + split * 60} M ${PAGE.x0 + PAGE.w + 10 + split * 60} ${PAGE.y0 - 10} V ${PAGE.y0 + PAGE.h + 10 + split * 40} M ${PAGE.x0 + PAGE.w + 10} ${PAGE.y0 + PAGE.h + 10 + split * 40} H ${PAGE.x0 - 10 - split * 60} M ${PAGE.x0 - 10 - split * 60} ${PAGE.y0 + PAGE.h + 10} V ${PAGE.y0 - 10 - split * 40}`}
                stroke={PALETTE.goldMuted}
                strokeWidth={1.4}
                fill="none"
                opacity={per}
                strokeDasharray={`${lerp(PAGE.w + 20, PAGE.w * 0.6, split)} ${split * 200 + 0.1}`}
              />
            ) : null}
            {T.seal(f) > 0.002 ? (
              <g>
                <circle cx={PAGE.x0 + PAGE.w - 90} cy={PAGE.y0 + 330} r={34 * T.seal(f)} fill={PALETTE.goldLight} opacity={0.35} />
                <circle cx={PAGE.x0 + PAGE.w - 90} cy={PAGE.y0 + 330} r={34 * T.seal(f)} fill="none" stroke={PALETTE.goldMuted} strokeWidth={1.6} />
                <SunOfMay c={[PAGE.x0 + PAGE.w - 90, PAGE.y0 + 330]} r={26 * T.seal(f)} rays={T.seal(f)} o={1} strokeW={1} />
              </g>
            ) : null}
            {/* Provincial endpoints aligned on one baseline: equality; later they pull apart. */}
            {[-2, -1, 0, 1, 2, 3].map((i) => {
              const t = ramp(f, 700 + i * 3, 730 + i * 3);
              const x = PAGE.x0 + 100 + (i + 2) * 110;
              const pullX = split * (i - 0.5) * 160;
              const pullY = split * 120 * (i % 2 ? 1 : -1);
              return t > 0 ? (
                <g key={i}>
                  <path d={`M ${x + pullX + (i - 0.5) * 180 * (1 - t)} ${PAGE_BASE_Y + 260 - 200 * t + pullY} L ${x + pullX} ${PAGE_BASE_Y + pullY}`} stroke={PALETTE.skyBlue} strokeWidth={2.4} strokeLinecap="round" />
                  <circle cx={x + pullX} cy={PAGE_BASE_Y + pullY} r={9} fill={PALETTE.paperWarm} stroke={PALETTE.deepBlueSoft} strokeWidth={1.4} />
                </g>
              ) : null;
            })}
          </g>
        ) : null}
      </SheetGround>
    </>
  );
};

/* ------------------------------------------------------------------ actors */

const followKeys = (offset: number, lateral: number): PosKey[] => {
  const out: PosKey[] = [];
  for (let f = 540; f <= 708; f += 12) {
    const x = headX(f) + offset;
    out.push(P(f, x, pathY(x) + lateral));
  }
  return out;
};

const army: ActorTrack[] = [];
for (let i = 0; i < 18; i++) {
  const rank = Math.floor(i / 2);
  const file = i % 2;
  army.push(
    actor(`andes.inf.${i}`, i % 5 === 3 ? "andesPoncho" : "andesInfantry", 0.8, followKeys(40 + rank * 46 + (rank > 4 ? 260 : 0), file ? 16 : -16), [A(540, "march", { facing: -1 })], {
      from: 548 + rank * 2,
      to: 700,
      enter: "rise",
      enterDur: 14,
      exit: "fold",
      exitDur: 18,
    }, { tone: file ? 0.08 : 0 }),
  );
}
for (let i = 0; i < 4; i++) {
  army.push(
    actor(`andes.mule.${i}`, "andesInfantry", 0.8, followKeys(560 + i * 70, -10 + (i % 2) * 22), [A(540, "stand", { facing: -1 })], { from: 552, to: 700, enter: "rise", exit: "fold", exitDur: 18 }, {
      mount: { kind: "mule", coat: i % 2 ? "gray" : "light", riderless: true, pack: true },
    }),
  );
}
for (let i = 0; i < 5; i++) {
  army.push(
    actor(`andes.granadero.${i}`, "granadero", 0.8, followKeys(-160 - i * 90, i % 2 ? -30 : -60), [A(540, "ride", { facing: -1 })], { from: 550, to: 700, enter: "rise", exit: "fold", exitDur: 18 }, {
      mount: { kind: "horse", coat: i % 2 ? "dark" : "gray" },
      tone: 0.12,
    }),
  );
}
const FLAG_OFFSET = 10;
army.push(actor("andes.flagbearer", "granadero", 0.8, followKeys(FLAG_OFFSET, 34), [A(540, "march", { facing: -1 })], { from: 550, to: 700, enter: "rise", exit: "fold", exitDur: 18 }));
/** José de San Martín: mounted, beside the column, closer to camera. */
const SAN_MARTIN: ActorTrack = actor("historical.sanMartin", "sanMartin", 0.84, followKeys(200, 86), [A(540, "ride", { facing: -1 })], { from: 552, to: 702, enter: "rise", exit: "fold", exitDur: 16 }, {
  mount: { kind: "horse", coat: "light" },
  detail: "hero",
  build: "tall",
  role: "primary",
});
army.push(SAN_MARTIN);

/* Tucumán 1816 */
const delegates: ActorTrack[] = [
  { from: [-2600, -30], w: "delegate" as const },
  { from: [-700, -20], w: "delegateB" as const },
  { from: [-2400, 380], w: "delegate" as const },
  { from: [-900, 420], w: "delegateB" as const },
  { from: [-1750, 820], w: "delegate" as const },
  { from: [-1500, 860], w: "delegateB" as const },
].map((d, i) =>
  actor(`delegate.${i}`, d.w, 0.8, [P(688 + i * 3, d.from[0], d.from[1]), P(740 + i * 2, DOOR[0] + (i - 2.5) * 22, DOOR[1] + 30, "atlasDrift"), P(770, DOOR[0] + (i - 2.5) * 30, DOOR[1] + 40)], [
    A(688, "walk", { facing: d.from[0] > DOOR[0] ? -1 : 1 }),
    A(740 + i * 2, "stand", { breadth: 0.8 }),
    A(762, "cheer", { amount: 0.35 }),
  ], { from: 688 + i * 3, to: 806, enter: "rise", exit: "fold", exitDur: 16 }),
);
const clerk = actor("clerk.1816", "clerk", 0.8, [P(700, -1880, 140)], [A(700, "write")], { from: 700, to: 790, enter: "rise", exit: "fold" });

/* ------------------------------------------------------------------- items */

const items = (ctx: FilmCtx): StageItem[] => {
  const { f, camera } = ctx;
  const out: StageItem[] = [];
  // Belgrano at Rosario (map-scale drafted figure) raising the new flag.
  const bo = T.belgrano(f);
  if (bo > 0.002) {
    const p = ctx.proj(IDENTITY);
    const s = 4.4 / camera.zoom;
    const bel = actor("historical.belgrano", "belgrano", s, [P(492, ROSARIO[0] - 10 / camera.zoom, ROSARIO[1])], [A(492, "stand", { facing: 1, breadth: 0.6 }), A(504, "point", { dur: 16 })], { from: 492, to: 548, enter: "rise", exit: "fold", exitDur: 14 }, {
      detail: "hero",
      role: "primary",
    });
    out.push(...actorItems(ctx, IDENTITY, [bel]));
    const fr = T.flagRaise(f);
    const fx = ROSARIO[0] + 60 / camera.zoom;
    out.push({
      key: "belgrano.flag",
      y: ROSARIO[1] + 1,
      depth: 1,
      node: (
        <g transform={billboardMatrix(p, fx, ROSARIO[1], s)} opacity={bo}>
          <path d={`M 0 0 V -150`} stroke={PALETTE.deepBlue} strokeWidth={1.6 / (p.zoom * s)} />
          <g transform={`translate(0 ${(1 - fr) * 100})`}>
            <FlagCloth phase={f / 18} amplitude={4} width={60} height={38} pole={150} tension={0.5} pxPerUnit={p.zoom * s} />
          </g>
        </g>
      ),
    });
  }
  const tr = T.terrainRise(f);
  if (f >= 548 && f <= 700) {
    const ridges: { prof: typeof FAR; y: number; d: number; fill: string; tone: number }[] = [
      { prof: FAR, y: -330, d: 0.8, fill: mixColor(PALETTE.paperWarm, PALETTE.skyBluePale, 0.35), tone: 0 },
      { prof: MID, y: -230, d: 0.9, fill: mixColor(PALETTE.grayBluePale, PALETTE.grayBlue, 0.3), tone: 0 },
      { prof: NEAR, y: -120, d: 1, fill: mixColor(PALETTE.grayBlue, PALETTE.paperWarm, 0.35), tone: 0 },
    ];
    for (const r of ridges) {
      out.push({
        key: `ridge.${r.y}`,
        y: r.y,
        depth: 1,
        node: <Ridge p={ctx.proj(PL, r.d)} profile={r.prof} groundY={r.y} rise={tr} fill={r.fill} snow={r.y < -200 ? 1 : 0.15} opacity={ramp(f, 548, 572) * (1 - ramp(f, 686, 700))} />,
      });
    }
    out.push({
      key: "ridge.fore",
      y: 400,
      depth: 1.3,
      node: <Ridge p={ctx.proj(PL, 1.3)} profile={FORE} groundY={400} rise={tr} fill={mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.25)} snow={0} hatch={1} opacity={ramp(f, 556, 580) * (1 - ramp(f, 686, 700))} />,
    });
    // Foreground rocks close to camera (parallax plane).
    const fp = ctx.proj(PL, 1.6);
    [-300, -760, -1180, -1650, -2100].forEach((x, i) => {
      out.push({ key: `rock.${i}`, y: 700, depth: 1.6, node: <g opacity={tr}><Rock p={fp} x={x} y={300} s={0.9 + (i % 2) * 0.3} seed={40 + i} tone={0.35} /></g> });
    });
    const armyO = T.army(f);
    if (armyO > 0.002) {
      out.push(...actorItems(ctx, PL, army));
      // The Army of the Andes' flag, carried by its bearer.
      const hx = headX(f) + FLAG_OFFSET;
      const p = ctx.proj(PL);
      out.push({
        key: "andes.flag",
        y: pathY(hx) + 34.5,
        depth: 1,
        node: (
          <g transform={billboardMatrix(p, hx - 6, pathY(hx) + 34, 0.8, -1)} opacity={armyO * (1 - ramp(f, 686, 700))}>
            <path d="M 0 -30 V -190" stroke={PALETTE.deepBlue} strokeWidth={1.8 / (p.zoom * 0.8)} />
            <g transform="translate(0 -40)">
              <FlagCloth phase={f / 16} amplitude={6} width={70} height={46} pole={150} tension={0.4} pxPerUnit={p.zoom * 0.8} />
            </g>
          </g>
        ),
      });
    }
  }
  // Tucumán.
  const house = T.house(f);
  if (house > 0.002) {
    const p = ctx.proj(PL);
    const fold = Math.max(foldFromTilt(camera, 8, 34), T.exit(f));
    out.push({
      key: "casaTucuman",
      y: DOOR[1] - 10,
      depth: 1,
      node: <Building p={p} kind="casaTucuman" x={-1910} y={DOOR[1] - 10} w={520} h={150} build={house} fold={fold} id="casa-tucuman" />,
    });
    const so = T.sunRay(f);
    if (so > 0.002) {
      out.push({
        key: "sunray",
        y: DOOR[1] - 30,
        depth: 1,
        node: (
          <g transform={standMatrix(p, -1650, DOOR[1] - 30, 1, 1, fold)}>
            <SunOfMay c={[0, -250]} r={60} rays={ramp(f, 740, 760)} o={so * 0.9} strokeW={1.2} />
          </g>
        ),
      });
    }
  }
  if (f >= 686 && f <= 810) {
    out.push(...actorItems(ctx, PL, [...delegates, clerk]));
  }
  return out;
};

/* ------------------------------------------------------------------- labels */

const Overlay: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const a = win(f, 488, 502, 580, 598);
  const army = win(f, 596, 608, 650, 664);
  const anth = win(f, 612, 624, 664, 678);
  const ind = win(f, 737, 739, 790, 806);
  const ved = win(f, 744, 756, 800, 812);
  return (
    <>
      <At x={168} y={96} id="label.1810-1816">
        <DateText text="1810–1816" size={104} o={a} enter={ramp(f, 488, 502)} />
        <EventText lines={["BELGRANO · SAN MARTÍN"]} o={a} enter={ramp(f, 492, 508)} tracking={0.16} />
      </At>
      <MapLabel camera={camera} anchor={toWorld(ANDES, [-600, 520])} lines={["EJÉRCITO DE LOS ANDES"]} o={army * 0.85} size={20} tone="deep" tracking={0.3} />
      <At x={1752} y={96} align="right" id="anthem.cadenas">
        <AnthemText lines={["OÍD EL RUIDO", "DE ROTAS CADENAS"]} o={anth} reveal={ramp(f, 612, 640)} align="right" />
      </At>
      <At x={168} y={770} id="label.1816">
        <DateText text="9 JUL 1816" size={120} o={ind} />
        <div style={{ width: 360 * ramp(f, 738, 752), height: 2, background: PALETTE.goldMuted, opacity: ind, marginTop: 6 }} />
        <EventText lines={["INDEPENDENCIA"]} o={ind * ramp(f, 740, 750)} size={32} tracking={0.2} mt={10} />
      </At>
      <At x={1752} y={96} align="right" id="anthem.igualdad">
        <AnthemText lines={["VED EN TRONO", "A LA NOBLE IGUALDAD"]} o={ved} reveal={ramp(f, 744, 772)} align="right" />
      </At>
    </>
  );
};

export const STAGES_04_05: readonly FilmStage[] = [{ id: "s04-05", from: 480, to: 830, Ground: AndesGround, items, Overlay }];

/* ------------------------------------------------------------- memory line */

const ROUTE_04: readonly Point[] = lineState([
  placeLL("buenosAires"),
  M(59.3, 34.2),
  ROSARIO,
  M(62.5, 33.3),
  M(65.5, 33.4),
  M(67.6, 32.9),
  ...PATH_CTRL.map((q) => toWorld(ANDES, q)),
]);
const PAGE_BASE: readonly Point[] = placedState(PL, [
  [PAGE.x0 - 2600, PAGE_BASE_Y],
  [PAGE.x0 - 400, PAGE_BASE_Y],
  [PAGE.x0 + PAGE.w + 60, PAGE_BASE_Y],
]);

export const ERA_04: LineEra = {
  id: "campaignRoute",
  from: 480,
  to: 674,
  evaluate: (f) => {
    const h = T.ribbon(f);
    const pts = f < 492 ? interpolatePoints(PLAZA_STATE, ROUTE_04, ramp(f, 480, 492)) : ROUTE_04;
    const core = f >= 640 && f <= 672 ? [{ start: Math.max(0, h - 0.12), end: h, opacity: win(f, 640, 646, 660, 672) }] : [];
    return {
      points: pts,
      ranges: [{ start: 0, end: Math.max(0.001, h), opacity: 0.95, color: PALETTE.skyBlue }],
      head: h < 0.99 ? { s: h, opacity: 0.9 } : null,
      core,
      sheet: f >= 560 ? PL : IDENTITY,
    };
  },
};

export const ERA_05: LineEra = {
  id: "declarationBaseline",
  from: 675,
  to: 809,
  evaluate: (f) => {
    const m = ramp(f, 668, 704);
    const pts = interpolatePoints(ROUTE_04, PAGE_BASE, m);
    const gold = ramp(f, 738, 752) * (1 - ramp(f, 786, 806));
    return {
      points: pts,
      ranges: [{ start: lerp(0, 0.35, m), end: 0.93 + 0.07 * m, opacity: 0.95, color: PALETTE.skyBlue }],
      head: null,
      core: gold > 0.002 ? [{ start: 0.45, end: 1, opacity: gold }] : [],
      sheet: PL,
    };
  },
};
