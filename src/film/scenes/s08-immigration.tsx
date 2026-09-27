import React from "react";
import { clamp01, lerp } from "../../animation/interpolate-clamped";
import type { ActorTrack } from "../../actors/action-track";
import { interpolatePoints } from "../../paths/interpolate-path";
import { mixColor, PALETTE } from "../../theme/palette";
import type { CameraState } from "../../types/camera";
import type { Point } from "../../types/paths";
import { A, P, actor, actorItems } from "../actors";
import { foldFromTilt, K, ramp, win } from "../anim";
import { M } from "../data/geo";
import { Building } from "../draw/architecture";
import { AnthemText, At, DateText, EventText } from "../draw/labels";
import { MapGround } from "../draw/map";
import { railD, Windmill } from "../draw/props";
import { SheetGround } from "../draw/sheet";
import { Ship } from "../draw/ship";
import { Train } from "../draw/train";
import type { CamKey } from "../film-camera";
import { lineState, sAtX, stateParts, translateState } from "../line";
import { applySim, IDENTITY, simPlacement } from "../space";
import type { FilmCtx, FilmStage, LineEra, StageItem } from "../types";
import { PORT_S2, REORIGIN_SIM } from "../world";
import { NETWORK_STATE } from "./s06-s07-nation";

/**
 * Scene 08 · 1880–1930 · frames 1200–1361 (journey). After the invisible
 * re-origin the chart shows waves of routes leaving European ports; steamers
 * cross; the camera dives into the port: a steamer docks, families with
 * suitcases and children come down to the quay, dock workers carry cargo,
 * a train takes them on board and departs. The maritime route becomes the
 * railway; the camera tracks the train through wheat and windmills into a
 * city that builds itself, until the rail switch multiplies (Scene 09).
 */
const MAP_PL = simPlacement(REORIGIN_SIM, IDENTITY);
const S2 = (q: Point) => applySim(REORIGIN_SIM, q);
export const RAIL_Y = 2460;
const QUAY_Y = 2600;
const WATER_Y = 2640;

const ORIGINS: readonly Point[] = [M(-8.9, -44.4), M(8.7, -42.2), M(-14.3, -40.8), M(0.1, -49.5), M(-10.0, -53.5)];

/** Train front x (world) — accelerates east from the station. */
export const trainX = (f: number) => {
  const t = clamp01((f - 1298) / (1400 - 1298));
  return -3380 + 2380 * (t * t * (1.6 - 0.6 * t));
};

const T = {
  routes: K([
    [1188, 0, "atlasDrift"],
    [1226, 1],
  ]),
  map: (f: number) => (f < 1186 ? 0 : 1 - ramp(f, 1236, 1258)),
  port: K([
    [1226, 0, "atlasDrift"],
    [1256, 1],
  ]),
  steamer: K([
    [1224, 0, "atlasDrift"],
    [1262, 1],
  ]),
  fields: K([
    [1300, 0, "atlasDrift"],
    [1336, 1],
  ]),
  city: K([
    [1326, 0, "atlasDrift"],
    [1370, 1],
  ]),
};

export const KEYS_08: readonly CamKey[] = [
  { f: 1200, x: -500, y: -1900, zoom: 0.1, tilt: 0, rot: 0 },
  { f: 1222, x: -2500, y: 700, zoom: 0.22, tilt: 12, rot: 0 },
  { f: 1242, x: -3480, y: 2380, zoom: 0.75, tilt: 38, rot: 0 },
  { f: 1260, x: -3600, y: 2540, zoom: 1.3, tilt: 52, rot: 0 },
  { f: 1282, x: -3400, y: 2540, zoom: 1.8, tilt: 56, rot: 0 },
  { f: 1304, x: -3180, y: 2480, zoom: 1.3, tilt: 52, rot: 0 },
  { f: 1332, x: -2560, y: 2450, zoom: 1.22, tilt: 50, rot: 0 },
  { f: 1361, x: -1760, y: 2430, zoom: 1.28, tilt: 54, rot: 0 },
];

/* ------------------------------------------------------------------ ground */

const WAVES = (() => {
  let d = "";
  for (let k = 0; k < 14; k++) {
    for (let i = 0; i < 16; i++) {
      const x = -4600 + i * 170 + ((k * 61) % 90);
      d += `M ${x} ${WATER_Y + 26 + k * 34} q 30 -6 60 0 `;
    }
  }
  return d;
})();

const WHEAT = (() => {
  let d = "";
  const fields: [number, number, number, number][] = [
    [-3000, 2330, -2300, 2420],
    [-2900, 2510, -2150, 2620],
    [-2200, 2320, -1900, 2420],
  ];
  for (const [x0, y0, x1, y1] of fields) {
    for (let x = x0; x < x1; x += 14) {
      d += `M ${x} ${y0} L ${x + 8} ${y1} `;
    }
    d += `M ${x0} ${y0} H ${x1} V ${y1} H ${x0} Z `;
  }
  return d;
})();

const ImmigrationGround: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const r = T.routes(f);
  const port = T.port(f);
  const railEnd = Math.min(4000, trainX(f) + 900);
  const ba = PORT_S2 as Point;
  return (
    <>
      <MapGround camera={camera} placement={MAP_PL} continents={["southAmerica", "fuego", "euroAfrica", "britain", "northAmerica", "caribbean", "florida"]} opacity={T.map(f)} graticule={0.5} clipId="s08" />
      {r > 0.002 && f < 1262 ? (
        <SheetGround camera={camera} pl={IDENTITY} opacity={T.map(f)}>
          {ORIGINS.map((o, i) => {
            const a = S2(o);
            const t = clamp01(r * 1.5 - i * 0.1);
            const pts = lineState([a, [lerp(a[0], ba[0], 0.4) - 900 + i * 300, lerp(a[1], ba[1], 0.5) - 400], ba]);
            const n = Math.max(2, Math.round(pts.length * t));
            return <path key={i} d={`M ${pts.slice(0, n).map((q) => `${q[0].toFixed(0)} ${q[1].toFixed(0)}`).join(" L ")}`} fill="none" stroke={PALETTE.skyBlue} strokeWidth={1.8} strokeDasharray="2 8" strokeLinecap="round" opacity={0.8} />;
          })}
        </SheetGround>
      ) : null}
      <SheetGround camera={camera} pl={IDENTITY} opacity={port * (1 - ramp(f, 1376, 1400))}>
        <path d={`M -4700 ${WATER_Y} H -2600 C -2320 ${WATER_Y + 60}, -2180 2900, -2080 3400 H -4700 Z`} fill={mixColor(PALETTE.skyBluePale, PALETTE.paperWarm, 0.6)} opacity={0.55} />
        <path d={WAVES} fill="none" stroke={PALETTE.skyBlue} strokeWidth={1.1} opacity={0.6} />
        <path d={`M -4700 2240 H -1300 V ${WATER_Y} H -4700 Z`} fill={mixColor(PALETTE.paperWarm, PALETTE.grayBluePale, 0.2)} opacity={0.6} />
        <path d={`M -4700 ${QUAY_Y} H -2600 M -4700 ${WATER_Y} H -2600 C -2320 ${WATER_Y + 60}, -2180 2900, -2080 3400`} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={1.4} />
        <path d={Array.from({ length: 28 }, (_, i) => `M ${-4680 + i * 82} ${QUAY_Y} V ${WATER_Y}`).join(" ")} stroke={PALETTE.grayBlue} strokeWidth={1} />
        <path d={railD(-4300, railEnd, RAIL_Y, 16, 18)} stroke={PALETTE.deepBlueSoft} strokeWidth={1.2} fill="none" />
        <path d={`M -4300 2508 H -2900 M -4300 2522 H -2900`} stroke={PALETTE.grayBlue} strokeWidth={1.2} />
        <path d={WHEAT} fill="none" stroke={PALETTE.goldLight} strokeWidth={1.1} opacity={0.7 * T.fields(f)} />
        {/* The switch: sidings multiply ahead of the city (→ factory windows). */}
        <path d={`M -1700 ${RAIL_Y} C -1600 ${RAIL_Y - 40}, -1500 ${RAIL_Y - 60}, -1300 ${RAIL_Y - 60} H 200 M -1650 ${RAIL_Y} C -1560 ${RAIL_Y + 40}, -1480 ${RAIL_Y + 60}, -1300 ${RAIL_Y + 60} H 200`} stroke={PALETTE.deepBlueSoft} strokeWidth={1.3} fill="none" opacity={ramp(f, 1338, 1360)} />
      </SheetGround>
    </>
  );
};

/* ------------------------------------------------------------------ actors */

const GANGWAY: Point = [-3560, 2690];
const family = (id: string, w: ActorTrack["wardrobe"], k: number, dx: number, dy: number, child = false): ActorTrack =>
  actor(
    id,
    w,
    child ? 0.8 : 0.8,
    [P(1262 + k * 3, GANGWAY[0] + dx * 0.3, GANGWAY[1]), P(1296 + k * 2, -3380 + dx, 2515 + dy, "atlasDrift"), P(1312, -3360 + dx, 2500 + dy)],
    [A(1262 + k * 3, "walk", { facing: 1 }), A(1296 + k * 2, "stand", { breadth: 0.6 })],
    { from: 1262 + k * 3, to: 1312, enter: "rise", enterDur: 10, exit: "fade", exitDur: 10 },
    child ? { build: "child" } : {},
  );

const immigrants: ActorTrack[] = [
  family("imm.1", "immigrantMan", 0, 0, 0),
  family("imm.2", "immigrantWoman", 1, 36, 10),
  family("imm.3", "immigrantChild", 2, 60, 20, true),
  family("imm.4", "immigrantMan2", 3, 110, -6),
  family("imm.5", "immigrantWoman", 4, 150, 14),
  family("imm.6", "immigrantChild", 5, 176, 24, true),
  family("imm.7", "immigrantMan", 6, 230, 0),
  family("imm.8", "immigrantWoman", 7, 270, 18),
  family("imm.9", "immigrantMan2", 8, 320, 4),
];
const dockers: ActorTrack[] = [
  actor("dock.1", "dockWorker", 0.8, [P(1250, -4000, 2570), P(1310, -3700, 2575)], [A(1250, "carry", { facing: 1 })], { from: 1250, to: 1316, exit: "fade" }),
  actor("dock.2", "dockWorker", 0.8, [P(1256, -3200, 2585), P(1310, -3500, 2580)], [A(1256, "carry", { facing: -1 })], { from: 1256, to: 1316, exit: "fade" }),
  actor("dock.3", "dockWorker", 0.8, [P(1262, -3900, 2560)], [A(1262, "stand", { facing: 1 }), A(1280, "point", { dur: 14 })], { from: 1262, to: 1316, exit: "fade" }),
];
const pampa: ActorTrack[] = [
  actor("farmer.1", "farmer", 0.8, [P(1306, -2600, 2560), P(1350, -2520, 2560)], [A(1306, "walk", { facing: 1 }), A(1330, "point", { dur: 14 })], { from: 1306, to: 1356, exit: "fade" }),
  actor("farmer.2", "settler", 0.8, [P(1310, -2360, 2360)], [A(1310, "stand", { facing: -1 }), A(1326, "cheer", { amount: 0.5 })], { from: 1310, to: 1356, exit: "fade" }),
];
// Foreground: a mother and child crossing close to camera (depth plane).
const fg: ActorTrack[] = [
  actor("fg.mother", "immigrantWoman", 1, [P(1264, -3900, 2850), P(1304, -3340, 2850)], [A(1264, "walk", { facing: 1 })], { from: 1264, to: 1304, enter: "none", exit: "none" }, { depth: 2.2, detail: "hero" }),
  actor("fg.child", "immigrantChild", 1, [P(1266, -3960, 2870), P(1306, -3400, 2870)], [A(1266, "walk", { facing: 1 })], { from: 1266, to: 1306, enter: "none", exit: "none" }, { depth: 2.2, detail: "hero", build: "child" }),
];

const CITY: readonly { kind: "apartmentBlock" | "shopRow" | "officeTower" | "warehouse"; x: number; w: number; h: number; y: number }[] = [
  { kind: "shopRow", x: -2000, w: 300, h: 150, y: 2305 },
  { kind: "apartmentBlock", x: -1680, w: 260, h: 300, y: 2305 },
  { kind: "officeTower", x: -1400, w: 180, h: 420, y: 2305 },
  { kind: "apartmentBlock", x: -1200, w: 280, h: 340, y: 2305 },
  { kind: "shopRow", x: -1900, w: 360, h: 140, y: 2700 },
  { kind: "warehouse", x: -1450, w: 380, h: 150, y: 2700 },
];

const items = (ctx: FilmCtx): StageItem[] => {
  const { f, camera } = ctx;
  const out: StageItem[] = [];
  const p = ctx.proj(IDENTITY);
  // Chart steamers crossing the Atlantic (1186–1240).
  if (f >= 1186 && f < 1250) {
    const fold = foldFromTilt(camera, 4, 30);
    ORIGINS.slice(0, 3).forEach((o, i) => {
      const a = S2(o);
      const t = clamp01((f - 1188 - i * 5) / 52);
      const q: Point = [lerp(a[0], PORT_S2[0] + 1400, t), lerp(a[1], PORT_S2[1] - 1600, t)];
      out.push({
        key: `chartSteamer.${i}`,
        y: q[1],
        depth: 1,
        node: <Ship p={p} x={q[0]} y={q[1]} scale={0.38 / camera.zoom} facing={-1} kind="steamer" wind={f / 20 + i} fold={fold} smoke={1} opacity={win(f, 1188, 1198, 1236, 1250)} />,
      });
    });
  }
  const port = T.port(f);
  if (port > 0.002) {
    const fold = foldFromTilt(camera, 8, 36);
    const st = T.steamer(f);
    out.push({
      key: "steamer",
      y: 2800,
      depth: 1,
      node: <Ship p={p} x={lerp(-2500, -3600, st)} y={2800} scale={1.55} facing={-1} kind="steamer" wind={f / 24} fold={fold} smoke={1 - st * 0.6} passengers={1 - ramp(f, 1266, 1296)} flag="argentina" opacity={1 - ramp(f, 1330, 1350)} />,
    });
    const b = port;
    [
      { kind: "warehouse" as const, x: -4400, w: 460, h: 170 },
      { kind: "station" as const, x: -3860, w: 560, h: 150 },
      { kind: "warehouse" as const, x: -3180, w: 420, h: 160 },
    ].forEach((bld, i) =>
      out.push({ key: `port.b${i}`, y: 2305, depth: 1, node: <Building p={p} kind={bld.kind} x={bld.x} y={2305} w={bld.w} h={bld.h} build={clamp01(b * 1.3 - i * 0.1)} fold={fold} tone={0.05} id={`s08-port-${i}`} /> }),
    );
    out.push({ key: "windmill", y: 2330, depth: 1, node: <g opacity={T.fields(f)}><Windmill p={p} x={-2450} y={2330} s={1.2} phase={f / 40} fold={fold} /></g> });
    const c = T.city(f);
    CITY.forEach((bld, i) => {
      out.push({ key: `city.${i}`, y: bld.y, depth: 1, node: <Building p={p} kind={bld.kind} x={bld.x} y={bld.y} w={bld.w} h={bld.h} build={clamp01(c * 1.4 - i * 0.08)} fold={fold} tone={bld.y > 2600 ? 0.1 : 0} id={`s08-city-${i}`} /> });
    });
    // The train.
    const tx = trainX(f);
    out.push({
      key: "train",
      y: RAIL_Y + 1,
      depth: 1,
      node: <g opacity={1 - ramp(f, 1398, 1414)}><Train p={p} x={tx} y={RAIL_Y} dist={tx + 4000} cars={4} fold={fold} smoke={f > 1296 ? 1 : 0.4} passengers={ramp(f, 1300, 1312)} /></g>,
    });
  }
  out.push(...actorItems(ctx, IDENTITY, [...immigrants, ...dockers, ...pampa, ...fg]));
  return out;
};

const Overlay: React.FC<{ f: number }> = ({ f }) => {
  const a = win(f, 1204, 1218, 1296, 1316);
  const anth = win(f, 1250, 1262, 1320, 1340);
  return (
    <>
      <At x={168} y={96} id="label.1880">
        <DateText text="1880–1930" size={104} o={a} enter={ramp(f, 1204, 1218)} />
        <EventText lines={["INMIGRACIÓN · FERROCARRIL · CIUDAD"]} o={a} enter={ramp(f, 1208, 1224)} tracking={0.14} />
      </At>
      <At x={1752} y={880} align="right" id="anthem.libres">
        <AnthemText lines={["Y LOS LIBRES DEL MUNDO RESPONDEN…"]} o={anth} reveal={ramp(f, 1250, 1276)} align="right" size={42} />
      </At>
    </>
  );
};

export const STAGES_08: readonly FilmStage[] = [{ id: "s08", from: 1186, to: 1500, Ground: ImmigrationGround, items, Overlay }];

/* ------------------------------------------------------------- memory line */

const NET_S2 = translateState(NETWORK_STATE, REORIGIN_SIM.dx, REORIGIN_SIM.dy);
export const RAIL_STATE = stateParts([
  [
    [
      [-900, RAIL_Y],
      [-3650, RAIL_Y],
      [-3690, 2560],
      [PORT_S2[0], PORT_S2[1]],
    ],
    64,
  ],
  [NET_S2.slice(64), 32],
]);
const S_PORT = 63 / 95;

export const ERA_08: LineEra = {
  id: "migrationRail",
  from: 1186,
  to: 1361,
  evaluate: (f) => {
    const m = ramp(f, 1232, 1262);
    const pts = interpolatePoints(NET_S2, RAIL_STATE, m);
    const tail = 1 - ramp(f, 1250, 1280);
    const interior = 1 - ramp(f, 1186, 1230);
    const ranges = [];
    if (interior > 0.002) {
      ranges.push({ start: 0, end: S_PORT, opacity: 0.95 * interior, color: PALETTE.skyBlue });
    }
    ranges.push({ start: S_PORT, end: 1, opacity: 0.95 * tail, color: PALETTE.skyBlue });
    if (m >= 1) {
      const s = sAtX(RAIL_STATE.slice(0, 62), trainX(f) + 170) * (61 / 95);
      ranges.push({ start: Math.min(S_PORT, s), end: S_PORT, opacity: 0.95 * ramp(f, 1262, 1280), color: PALETTE.skyBlue });
    }
    return { points: pts, ranges, head: null, core: [] };
  },
};
