import React from "react";
import { clamp01, lerp } from "../../animation/interpolate-clamped";
import type { ActorTrack, PosKey } from "../../actors/action-track";
import { interpolatePoints } from "../../paths/interpolate-path";
import { mixColor, PALETTE } from "../../theme/palette";
import type { CameraState } from "../../types/camera";
import type { Point } from "../../types/paths";
import { A, P, actor, actorItems } from "../actors";
import { foldFromTilt, K, ramp, win } from "../anim";
import { CAPITALS, M, MP, TERRITORY_1830, lonLatPath, place as placeLL, regionCells } from "../data/geo";
import { Building } from "../draw/architecture";
import { AnthemText, At, DateText, EventText, MapLabel } from "../draw/labels";
import { MapGround } from "../draw/map";
import { Fortin, TelegraphPole, Toldo } from "../draw/props";
import { SheetGround } from "../draw/sheet";
import type { CamKey } from "../film-camera";
import { stateParts } from "../line";
import { IDENTITY } from "../space";
import type { FilmCtx, FilmStage, LineEra, StageItem } from "../types";
import { ERA_05 } from "./s04-s05-andes";

/**
 * Scene 06 (1816–1853, 810–1043): a regional mosaic that drifts apart;
 * mounted groups (federal montoneras, a unitario line column, a littoral
 * caudillo's riders) cross it on incompatible routes — curved local networks
 * against straight radial pulls — and meet without gore; the gold seal of
 * 1816 survives only as an empty ring. Scene 07 (1853–1880, 1044–1199): the
 * crossings become nodes, the ring becomes the constitutional node (Santa Fe,
 * 1853), roads, telegraph and settlements extend effective authority; the
 * frontier moves south with its forts while indigenous peoples remain on the
 * map as present, identified actors. An edge leaves for the Atlantic and
 * Europe: migration begins (Scene 08).
 */
const CELLS = regionCells();
const TERR_D = lonLatPath(TERRITORY_1830, true, 2);
const CENTER = M(63.5, 30.5);
const SANTA_FE = placeLL("santaFe");
const BA = placeLL("buenosAires");

const T = {
  mosaic: K([
    [812, 0, "atlasDrift"],
    [846, 1],
  ]),
  drift: K([
    [830, 0, "atlasDrift"],
    [960, 1],
    [1044, 1, "institutionalLock"],
    [1088, 0],
  ]),
  arrows: K([
    [836, 0, "atlasDrift"],
    [900, 1],
  ]),
  arrowsOut: K([
    [1044, 0, "atlasDrift"],
    [1080, 1],
  ]),
  network: K([
    [1052, 0, "atlasDrift"],
    [1100, 1],
  ]),
  constitution: (f: number) => win(f, 1072, 1080, 1120, 1170),
  frontier: K([
    [1096, 0, "atlasDrift"],
    [1176, 1],
  ]),
  toldos: K([
    [1090, 0, "atlasDrift"],
    [1120, 1],
  ]),
  atlantic: K([
    [1150, 0, "atlasDrift"],
    [1186, 1],
  ]),
};

/* ---------------------------------------------------------------- camera */

export const KEYS_06_07: readonly CamKey[] = [
  { f: 828, x: 4700, y: -700, zoom: 1.1, tilt: 22, rot: 0 },
  { f: 850, x: 5050, y: -760, zoom: 0.62, tilt: 34, rot: 2 },
  { f: 874, x: 5300, y: -690, zoom: 0.95, tilt: 42, rot: 4 },
  { f: 902, x: 5250, y: -780, zoom: 1.08, tilt: 44, rot: 1 },
  { f: 930, x: 5240, y: -770, zoom: 1.28, tilt: 48, rot: -2 },
  { f: 960, x: 5450, y: -700, zoom: 1.0, tilt: 44, rot: -1 },
  { f: 990, x: 5700, y: -950, zoom: 0.86, tilt: 40, rot: 2 },
  { f: 1016, x: 5520, y: -760, zoom: 0.6, tilt: 34, rot: 1 },
  { f: 1048, x: 5500, y: -780, zoom: 0.45, tilt: 26, rot: 0 },
  { f: 1086, x: 5450, y: -640, zoom: 0.5, tilt: 30, rot: 0 },
  { f: 1116, x: 5350, y: 260, zoom: 0.78, tilt: 42, rot: 0 },
  { f: 1140, x: 5650, y: 300, zoom: 0.72, tilt: 40, rot: 0 },
  { f: 1158, x: 6100, y: -300, zoom: 0.3, tilt: 16, rot: 0 },
  { f: 1180, x: 9400, y: -5200, zoom: 0.092, tilt: 0, rot: 0 },
];

/* ------------------------------------------------------------------ ground */

const cellD = (poly: readonly Point[], c: Point, drift: number) => {
  const dx = (c[0] - CENTER[0]) * 0.05 * drift;
  const dy = (c[1] - CENTER[1]) * 0.05 * drift;
  return `M ${poly.map((q) => `${(q[0] + dx).toFixed(1)} ${(q[1] + dy).toFixed(1)}`).join(" L ")} Z`;
};

const TINTS = [
  mixColor(PALETTE.paperWarm, PALETTE.grayBlue, 0.22),
  mixColor(PALETTE.paperWarm, PALETTE.goldLight, 0.14),
  mixColor(PALETTE.paperWarm, PALETTE.skyBluePale, 0.28),
];

/** Straight radial pulls from Buenos Aires vs curved local networks. */
const RADIAL = CAPITALS.filter((c) => c.id !== "buenosAires").map((c) => MP(c.ll));
const LOCAL_ARCS: readonly [Point, Point][] = [
  [placeLL("cordoba"), M(66.9, 29.4)],
  [M(66.9, 29.4), M(65.8, 28.5)],
  [placeLL("tucuman"), M(64.3, 27.8)],
  [placeLL("santaFe"), M(58.8, 27.5)],
  [M(60.5, 31.75), M(58.8, 27.5)],
  [placeLL("mendoza"), M(68.5, 31.5)],
  [M(66.3, 33.3), placeLL("cordoba")],
];
const arc = (a: Point, b: Point, bend: number) => {
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend;
  const my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  return `M ${a[0].toFixed(1)} ${a[1].toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
};

/** Network edges of 1853–1880 (roads/telegraph). */
const EDGES: readonly [string, string][] = [
  ["buenosAires", "santaFe"],
  ["santaFe", "parana"],
  ["parana", "corrientes"],
  ["santaFe", "cordoba"],
  ["cordoba", "santiago"],
  ["santiago", "tucuman"],
  ["tucuman", "salta"],
  ["salta", "jujuy"],
  ["tucuman", "catamarca"],
  ["catamarca", "laRioja"],
  ["cordoba", "sanLuis"],
  ["sanLuis", "mendoza"],
  ["mendoza", "sanJuan"],
  ["buenosAires", "cordoba"],
];
const cap = (id: string) => MP(CAPITALS.find((c) => c.id === id)!.ll);

/** Frontier (dashed) moving south: ~36°S (1860s) → Río Negro (1879). */
const frontierD = (t: number) => {
  let d = "";
  for (let lon = 69.5; lon >= 57.5; lon -= 0.5) {
    const base = 35.6 + (lon < 62 ? 0.5 : 0);
    const target = 39.2 + (lon > 66 ? 0.6 : 0) + (lon < 63 ? 0.2 : 0);
    const lat = lerp(base, target, t) + Math.sin(lon * 1.7) * 0.15;
    const q = M(lon, lat);
    d += `${d ? "L" : "M"} ${q[0].toFixed(1)} ${q[1].toFixed(1)} `;
  }
  return d;
};

const NationGround: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const mo = T.mosaic(f) * (1 - ramp(f, 1150, 1180) * 0.8);
  const drift = T.drift(f);
  const ar = T.arrows(f) * (1 - T.arrowsOut(f));
  const net = T.network(f);
  const fr = T.frontier(f);
  const ringGold = T.constitution(f);
  const mapO = f < 830 ? ramp(f, 800, 830) : 1;
  return (
    <>
      <MapGround
        camera={camera}
        placement={IDENTITY}
        continents={["southAmerica", "fuego", "euroAfrica", "britain", "northAmerica", "caribbean", "florida", "malvinas"]}
        opacity={f < 1186 ? mapO : 0}
        graticule={0.55}
        clipId="s06"
      />
      <SheetGround camera={camera} pl={IDENTITY} opacity={(f < 1186 ? 1 : 0) * mapO}>
        <defs>
          <clipPath id="s06-terr">
            <path d={TERR_D} />
          </clipPath>
        </defs>
        {mo > 0.002 ? (
          <g clipPath="url(#s06-terr)" opacity={mo} data-id="regional.mosaic" data-status="historical">
            {CELLS.map((c, i) => (
              <path key={c.id} d={cellD(c.poly, c.c, drift)} fill={TINTS[i % 3]} stroke={PALETTE.deepBlueSoft} strokeWidth={1} strokeDasharray="3 5" />
            ))}
          </g>
        ) : null}
        {ar > 0.002 ? (
          <g opacity={ar} fill="none">
            {RADIAL.map((c, i) => {
              const t = clamp01(ar * 1.6 - i * 0.04);
              return (
                <path
                  key={i}
                  d={`M ${BA[0]} ${BA[1]} L ${lerp(BA[0], c[0], t).toFixed(1)} ${lerp(BA[1], c[1], t).toFixed(1)}`}
                  stroke={mixColor(PALETTE.deepBlue, PALETTE.grayBlue, 0.3)}
                  strokeWidth={1.8}
                  strokeDasharray="10 6"
                />
              );
            })}
            {LOCAL_ARCS.map(([a, b], i) => (
              <path key={`l${i}`} d={arc(a, b, 0.35)} stroke={PALETTE.skyBlue} strokeWidth={2.2} opacity={clamp01(ar * 1.4 - i * 0.05)} strokeLinecap="round" />
            ))}
          </g>
        ) : null}
        {net > 0.002 ? (
          <g data-id="national.network">
            {EDGES.map(([a, b], i) => {
              const t = clamp01(net * 2.2 - i * 0.08);
              if (t <= 0) {
                return null;
              }
              const p = cap(a);
              const q = cap(b);
              return <path key={i} d={`M ${p[0]} ${p[1]} L ${lerp(p[0], q[0], t)} ${lerp(p[1], q[1], t)}`} stroke={PALETTE.skyBlue} strokeWidth={2.4} strokeLinecap="round" />;
            })}
            {/* Roads/telegraph extending to the frontier and the south. */}
            {[
              [BA, placeLL("bahiaBlanca")],
              [placeLL("bahiaBlanca"), placeLL("carmenPatagones")],
              [placeLL("mendoza"), placeLL("neuquen")],
              [placeLL("cordoba"), M(64.3, 36.6)],
            ].map(([a, b], i) => {
              const t = clamp01(fr * 1.4 - i * 0.12);
              return t > 0 ? <path key={`r${i}`} d={`M ${a[0]} ${a[1]} L ${lerp(a[0], b[0], t)} ${lerp(a[1], b[1], t)}`} stroke={PALETTE.deepBlueSoft} strokeWidth={1.6} strokeDasharray="12 5" /> : null;
            })}
          </g>
        ) : null}
        {CAPITALS.map((c) => {
          const q = MP(c.ll);
          const lock = clamp01(net * 3 - 0.2);
          return (
            <g key={c.id}>
              <circle cx={q[0]} cy={q[1]} r={22} fill={lock > 0.5 ? PALETTE.skyBlue : PALETTE.paperWarm} stroke={PALETTE.deepBlueSoft} strokeWidth={1.4} opacity={mo} />
              <circle cx={q[0]} cy={q[1]} r={34} fill="none" stroke={PALETTE.skyBlue} strokeWidth={1.2} opacity={lock * mo * 0.8} />
            </g>
          );
        })}
        {/* The 1816 seal, now an empty ring: the unrealized centre of union → 1853 constitutional node. */}
        <circle cx={SANTA_FE[0]} cy={SANTA_FE[1]} r={70} fill={PALETTE.goldLight} opacity={0.45 * ringGold} />
        <circle cx={SANTA_FE[0]} cy={SANTA_FE[1]} r={70} fill="none" stroke={PALETTE.goldMuted} strokeWidth={1.6} opacity={f < 1150 ? mo * (0.55 + 0.45 * ringGold) : mo * 0.3} />
        {fr > 0.002 ? (
          <g data-id="frontier" data-status="conflict-zone">
            <path d={frontierD(fr)} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={9} opacity={0.12} />
            <path d={frontierD(fr)} fill="none" stroke={PALETTE.deepBlue} strokeWidth={1.8} strokeDasharray="14 6 3 6" />
          </g>
        ) : null}
      </SheetGround>
    </>
  );
};

/* ------------------------------------------------------------------ actors */

const MAP_S = 2.8;
const ride = (id: string, w: ActorTrack["wardrobe"], pts: readonly [number, Point][], life: [number, number], coat: "light" | "dark" | "gray", extra: Partial<ActorTrack> = {}): ActorTrack =>
  actor(id, w, MAP_S, pts.map(([f, q]) => P(f, q[0], q[1], "atlasDrift")) as PosKey[], [A(pts[0][0], "ride", { facing: pts[pts.length - 1][1][0] >= pts[0][1][0] ? 1 : -1 })], { from: life[0], to: life[1], enter: "rise", enterDur: 14, exit: "fold", exitDur: 16 }, {
    mount: { kind: "horse", coat },
    ...extra,
  });

const LARIOJA = M(66.9, 29.4);
const COR = placeLL("cordoba");
const groupAt = (base: readonly [number, Point][], k: number, dx: number, dy: number) => base.map(([f, q]) => [f, [q[0] + dx * k, q[1] + dy * k] as Point] as [number, Point]);

const FEDERAL: [number, Point][] = [
  [836, [LARIOJA[0] - 200, LARIOJA[1] - 40]],
  [930, [COR[0] - 60, COR[1] - 20]],
  [1010, [SANTA_FE[0] - 240, SANTA_FE[1] - 80]],
];
const UNITARIO: [number, Point][] = [
  [850, [BA[0] - 120, BA[1] - 90]],
  [928, [COR[0] + 120, COR[1] + 30]],
  [940, [COR[0] + 90, COR[1] + 30]],
  [1000, [BA[0] - 350, BA[1] - 200]],
];
const LITORAL: [number, Point][] = [
  [870, [SANTA_FE[0] + 60, SANTA_FE[1] + 40]],
  [975, [M(58.8, 27.5)[0] + 40, M(58.8, 27.5)[1] + 60]],
];

const riders: ActorTrack[] = [
  ...[0, 1, 2, 3].map((i) => ride(`montonera.${i}`, i % 2 ? "gaucho" : "gauchoLight", groupAt(FEDERAL, i, -130, 62), [836 + i * 2, 1030], i % 2 ? "dark" : "gray", { tone: i * 0.06 })),
  ...[0, 1, 2, 3].map((i) => ride(`unitario.${i}`, "lineOfficer", groupAt(UNITARIO, i, 140, 56), [850 + i * 2, 1012], i === 0 ? "light" : "dark", { tone: i * 0.06 })),
  ...[0, 1, 2].map((i) => ride(`litoral.${i}`, "gaucho", groupAt(LITORAL, i, 120, -50), [870 + i * 3, 990], "gray", { tone: 0.1 + i * 0.05 })),
  ride("courier.1", "courier", [[962, placeLL("tucuman")], [1040, [BA[0] - 400, BA[1] - 300]]], [962, 1046], "light"),
];

/* Scene 07 figures: frontier forts, settlers, telegraph, indigenous presence. */
const FORTS = (t: number): Point[] => [66.5, 64.2, 62.2, 60.2].map((lon, i) => {
  const lat = lerp(35.8 + (lon < 62 ? 0.5 : 0), 39.0 + (lon > 66 ? 0.6 : 0), t) - 0.1;
  return M(lon + (i % 2) * 0.3, lat);
});

const TOLDERIAS: readonly { c: Point; at: number }[] = [
  { c: M(64.8, 38.6), at: 1094 },
  { c: M(67.2, 38.9), at: 1100 },
  { c: M(61.8, 39.6), at: 1106 },
  { c: M(61.4, 25.8), at: 1098 },
];

const indigenous: ActorTrack[] = TOLDERIAS.flatMap((t, k) =>
  [0, 1, 2].map((i) =>
    actor(`ind.${k}.${i}`, i === 1 ? "indigenousWoman" : "indigenousMan", MAP_S * 0.95, [P(t.at, t.c[0] - 120 + i * 110, t.c[1] + 60 + (i % 2) * 30), P(t.at + 70, t.c[0] - 90 + i * 110, t.c[1] + 70 + (i % 2) * 30)], [
      A(t.at, i === 0 ? "walk" : "stand", { facing: i % 2 ? -1 : 1 }),
      A(t.at + 40, "stand", { breadth: 0.6 }),
    ], { from: t.at, to: 1180, enter: "rise", exit: "fold", exitDur: 16 }, { tone: 0.05 }),
  ),
);
const indigenousRider = ride("ind.rider", "indigenousMan", [[1100, M(66.0, 39.4)], [1170, M(64.4, 39.9)]], [1100, 1180], "dark");
const frontierPeople: ActorTrack[] = [
  actor("fortin.soldier.1", "frontierSoldier", MAP_S * 0.95, [P(1108, FORTS(0.6)[1][0] - 80, FORTS(0.6)[1][1] + 70)], [A(1108, "guard", { facing: 1 }), A(1140, "point", { dur: 14 })], { from: 1108, to: 1180, exit: "fold" }),
  actor("settler.1", "settler", MAP_S * 0.95, [P(1112, M(60.2, 36.2)[0], M(60.2, 36.2)[1]), P(1170, M(61.0, 36.8)[0], M(61.0, 36.8)[1])], [A(1112, "walk", { facing: -1 })], { from: 1112, to: 1180, exit: "fold" }),
  ride("courier.2", "courier", [[1104, BA], [1176, placeLL("bahiaBlanca")]], [1104, 1180], "gray"),
];

const items = (ctx: FilmCtx): StageItem[] => {
  const { f, camera } = ctx;
  const out: StageItem[] = [];
  const p = ctx.proj(IDENTITY);
  const fold = foldFromTilt(camera, 6, 30);
  const mo = T.mosaic(f) * (1 - ramp(f, 1150, 1176));
  // Regional architecture: small towns at the capitals (drafted, map scale).
  if (mo > 0.002) {
    CAPITALS.forEach((c, i) => {
      const q = MP(c.ll);
      const s = 0.55;
      out.push({
        key: `town.${c.id}`,
        y: q[1] - 30,
        depth: 1,
        node: (
          <g opacity={mo}>
            <Building p={p} kind="church" x={q[0] - 50} y={q[1] - 30} w={100} h={50} scale={s} build={ramp(f, 816 + i * 3, 846 + i * 3)} fold={fold} id={`s06-ch-${c.id}`} />
            <Building p={p} kind="colonialHouse" x={q[0] - 130} y={q[1] - 10} w={80} h={40} scale={s} build={ramp(f, 820 + i * 3, 850 + i * 3)} fold={fold} variant={i % 3} id={`s06-h-${c.id}`} />
          </g>
        ),
      });
    });
  }
  out.push(...actorItems(ctx, IDENTITY, [...riders, ...indigenous, indigenousRider, ...frontierPeople]));
  const fr = T.frontier(f);
  if (fr > 0.002 && f < 1186) {
    FORTS(fr).forEach((q, i) => {
      out.push({ key: `fortin.${i}`, y: q[1], depth: 1, node: <g opacity={ramp(f, 1100 + i * 6, 1116 + i * 6) * (1 - ramp(f, 1170, 1184))}><Fortin p={p} x={q[0]} y={q[1]} s={1.5} fold={fold} /></g> });
    });
    const poles = [...Array(10).keys()].map((i) => [lerp(BA[0], placeLL("bahiaBlanca")[0], i / 9), lerp(BA[1], placeLL("bahiaBlanca")[1], i / 9)] as Point);
    poles.forEach((q, i) => {
      const o = ramp(f, 1104 + i * 4, 1112 + i * 4) * (1 - ramp(f, 1170, 1184));
      if (o > 0) {
        out.push({ key: `pole.${i}`, y: q[1], depth: 1, node: <g opacity={o}><TelegraphPole p={p} x={q[0] + 30} y={q[1] + 30} s={1.1} fold={fold} /></g> });
      }
    });
    TOLDERIAS.forEach((t, k) => {
      const o = ramp(f, t.at, t.at + 16) * (1 - ramp(f, 1172, 1186));
      [0, 1].forEach((j) => {
        out.push({ key: `toldo.${k}.${j}`, y: t.c[1] + j * 20, depth: 1, node: <g opacity={o}><Toldo p={p} x={t.c[0] + j * 160 - 80} y={t.c[1] + j * 20} s={1.3} fold={fold} /></g> });
      });
    });
  }
  return out;
};

/* ------------------------------------------------------------------ labels */

const Overlay: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const gc = win(f, 846, 862, 1000, 1030);
  const anth = win(f, 870, 884, 950, 970);
  const c53 = win(f, 1072, 1080, 1104, 1116);
  const org = win(f, 1096, 1108, 1160, 1178);
  const regions = win(f, 1100, 1120, 1164, 1180);
  return (
    <>
      <At x={168} y={96} id="label.guerrasCiviles">
        <DateText text="1816–1853" size={104} o={gc} enter={ramp(f, 846, 862)} />
        <EventText lines={["GUERRAS CIVILES"]} o={gc} enter={ramp(f, 850, 868)} tracking={0.16} />
      </At>
      <At x={1752} y={860} align="right" id="anthem.trono">
        <AnthemText lines={["YA SU TRONO DIGNÍSIMO ABRIERON…"]} o={anth} reveal={ramp(f, 870, 896)} align="right" size={42} />
      </At>
      <At x={168} y={96} id="label.1853">
        <DateText text="1853" size={120} o={c53} enter={ramp(f, 1072, 1082)} />
        <EventText lines={["CONSTITUCIÓN"]} o={c53} enter={ramp(f, 1074, 1088)} tracking={0.2} />
      </At>
      <At x={168} y={96} id="label.organizacion">
        <EventText lines={["ORGANIZACIÓN NACIONAL"]} size={34} o={org * (1 - c53)} tracking={0.2} mt={0} />
        <EventText lines={["1853–1880"]} size={22} o={org * (1 - c53)} tone="soft" tracking={0.2} />
      </At>
      <At x={1752} y={860} align="right" id="anthem.provincias">
        <AnthemText lines={["…LAS PROVINCIAS UNIDAS DEL SUD"]} o={win(f, 1082, 1094, 1150, 1170)} reveal={ramp(f, 1082, 1108)} align="right" size={40} />
      </At>
      <MapLabel camera={camera} anchor={M(63.2, 37.2)} lines={["FRONTERA"]} o={0.8 * regions} size={16} tone="deep" tracking={0.4} />
      <MapLabel camera={camera} anchor={M(66.2, 41.4)} lines={["PAMPA · PATAGONIA", "PUEBLOS INDÍGENAS"]} o={0.75 * regions} size={15} tracking={0.3} />
      <MapLabel camera={camera} anchor={M(61.0, 24.4)} lines={["CHACO"]} o={0.7 * regions} size={15} tracking={0.3} />
      <MapLabel camera={camera} anchor={SANTA_FE} lines={["SANTA FE"]} o={0.8 * c53} size={15} tone="deep" dy={34} tracking={0.25} />
    </>
  );
};

export const STAGES_06_07: readonly FilmStage[] = [{ id: "s06-07", from: 800, to: 1190, Ground: NationGround, items, Overlay }];

/* ------------------------------------------------------------- memory line */

const ATL_TAIL: readonly Point[] = [BA, M(52, 34), M(44, 28), M(34, 14), M(28, 0), M(24, -14), M(17, -28), M(9, -35.6), M(5.6, -36.0), M(0, -37.2), M(-5, -39.6), M(-8.9, -44.4)];
const INTERIOR_CIVIL: readonly Point[] = [
  placeLL("mendoza"),
  M(66.3, 33.3),
  placeLL("cordoba"),
  M(66.9, 29.4),
  M(65.8, 28.5),
  placeLL("tucuman"),
  M(64.3, 27.8),
  placeLL("santaFe"),
  M(58.8, 27.5),
  M(60.5, 31.75),
  BA,
];
const INTERIOR_NET: readonly Point[] = [
  placeLL("mendoza"),
  M(66.3, 33.3),
  placeLL("cordoba"),
  M(64.3, 27.8),
  placeLL("tucuman"),
  M(64.8, 29.0),
  placeLL("santaFe"),
  M(60.5, 31.75),
  M(59.4, 33.2),
  BA,
];
export const CIVIL_STATE = stateParts([
  [INTERIOR_CIVIL, 64],
  [[BA, BA], 32],
]);
export const NETWORK_STATE = stateParts([
  [INTERIOR_NET, 64],
  [ATL_TAIL, 32],
]);
const S_BA = 63 / 95;

export const ERA_06: LineEra = {
  id: "civilConflict",
  from: 810,
  to: 1043,
  evaluate: (f) => {
    const m = ramp(f, 806, 846);
    const base = ERA_05.evaluate(809).points;
    const pts = interpolatePoints(base, CIVIL_STATE, m);
    const g = ramp(f, 850, 900) * (1 - ramp(f, 1030, 1043) * 0.2);
    const color = mixColor(PALETTE.skyBlue, PALETTE.grayBlue, 0.45 * g);
    // One line splits into competing stretches (gaps), never erased.
    const cuts = [0.16, 0.34, 0.5, 0.63];
    const ranges = [];
    let a = 0;
    for (const c of cuts) {
      ranges.push({ start: a, end: Math.min(S_BA, c - 0.02 * g), opacity: 0.92, color, dash: g > 0.5 ? ([14, 7] as const) : undefined });
      a = c + 0.02 * g;
    }
    ranges.push({ start: a, end: S_BA, opacity: 0.92, color });
    return { points: pts, ranges, head: null, core: [] };
  },
};

export const ERA_07: LineEra = {
  id: "nationalNetwork",
  from: 1044,
  to: 1185,
  evaluate: (f) => {
    const m = ramp(f, 1046, 1090);
    const pts = interpolatePoints(CIVIL_STATE, NETWORK_STATE, m);
    const g = 1 - m;
    const color = mixColor(PALETTE.skyBlue, PALETTE.grayBlue, 0.45 * g);
    const end = lerp(S_BA, 1, T.atlantic(f));
    const ranges = [{ start: 0, end, opacity: 0.95, color }];
    return { points: pts, ranges, head: T.atlantic(f) > 0.01 && T.atlantic(f) < 0.99 ? { s: end, opacity: 1 } : null, core: [] };
  },
};
