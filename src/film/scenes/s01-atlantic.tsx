import React from "react";
import { clamp01, lerp } from "../../animation/interpolate-clamped";
import { mixColor, PALETTE } from "../../theme/palette";
import type { Point } from "../../types/paths";
import { K, ramp, win } from "../anim";
import { polylineToPath, sampleRange } from "../../paths/interpolate-path";
import { MP, M, lonLatPath } from "../data/geo";
import { ATLANTIC_ROUTE, BRANCHES, COLONIAL_TOWNS, routeAt } from "../data/routes";
import { VIRREINATO_1776 } from "../data/geo";
import { Building } from "../draw/architecture";
import { At, DateText, EventText, MapLabel } from "../draw/labels";
import { HatchedArea, MapGround, pathBBox } from "../draw/map";
import { Ship } from "../draw/ship";
import { SheetGround } from "../draw/sheet";
import type { CameraState } from "../../types/camera";
import type { CamKey } from "../film-camera";
import { IDENTITY } from "../space";
import type { FilmStage, LineEra, StageItem } from "../types";
import { foldFromTilt } from "../anim";

/**
 * Scene 01 · 1492–1776 · frames 0–179 (journey profile).
 * The atlas draws itself around a route that advances: a compass tick, the
 * graticule, the coasts; caravels cross on memoryLine.main; the route bends
 * south and settles on rivers and coasts as the 1776 viceroyalty with its
 * colonial towns rising from the map. Exit: the viceroyalty's eastern edge
 * becomes a wave crest in the Río de la Plata (Scene 02 ships enter on it).
 */
const COMPASS: Point = M(47, -31);
const T = {
  mapReveal: K([
    [4, 0, "atlasDrift"],
    [70, 16000],
  ]),
  graticule: K([
    [2, 0],
    [30, 1],
  ]),
  compass: K([
    [0, 0.42, "ceremonial"],
    [14, 1],
  ]),
  rhumbs: K([
    [8, 0, "atlasDrift"],
    [64, 1],
  ]),
  /** Route head s (0..1): Iberia (22) → Río de la Plata (164). */
  head: K([
    [20, 0, "atlasDrift"],
    [60, 0.28, "linearTravel"],
    [120, 0.72, "atlasDrift"],
    [166, 1],
  ]),
  virreinato: K([
    [124, 0, "atlasDrift"],
    [172, 1],
  ]),
  label1492: (f: number) => win(f, 20, 34, 92, 108),
  label1776: (f: number) => win(f, 128, 142, 200, 214),
};

export const routeHead = (f: number) => T.head(f);

/* ---------------------------------------------------------------- camera */

const camOnRoute = (f: number, s: number, zoom: number, tilt: number, rot: number, off: Point = [0, 0]): CamKey => {
  const q = routeAt(ATLANTIC_ROUTE, s).p;
  return { f, x: q[0] + off[0], y: q[1] + off[1], zoom, tilt, rot };
};

export const KEYS_01: readonly CamKey[] = [
  { f: 0, x: 11200, y: -7900, zoom: 0.1, tilt: 0, rot: 0 },
  { f: 36, x: 10800, y: -7300, zoom: 0.108, tilt: 4, rot: 1 },
  camOnRoute(78, 0.4, 0.13, 20, 4, [-1600, 900]),
  camOnRoute(118, 0.7, 0.155, 30, 7, [-1500, 900]),
  { f: 150, x: 6500, y: -1350, zoom: 0.2, tilt: 20, rot: 9 },
];

/* ------------------------------------------------------------------ ground */

const VIRR_D = lonLatPath(VIRREINATO_1776, true, 3);
const VIRR_BBOX = pathBBox(VIRREINATO_1776);

const CompassRose: React.FC<{ o: number; c: Point; r: number }> = ({ o, c, r }) => {
  if (o <= 0.002) {
    return null;
  }
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rr = i % 4 === 0 ? r : i % 2 === 0 ? r * 0.55 : r * 0.32;
    pts.push(`M ${c[0]} ${c[1]} L ${(c[0] + Math.sin(a) * rr).toFixed(1)} ${(c[1] - Math.cos(a) * rr).toFixed(1)}`);
  }
  return (
    <g opacity={o} data-id="compass">
      <circle cx={c[0]} cy={c[1]} r={r * 0.62} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={0.9} />
      <circle cx={c[0]} cy={c[1]} r={r * 0.66} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={0.6} strokeDasharray="2 4" />
      <path d={pts.join(" ")} stroke={PALETTE.deepBlueSoft} strokeWidth={0.9} />
      {/* The single gold of 1492–1776: an orientation hairline, not achievement. */}
      <path d={`M ${c[0]} ${c[1] + r * 0.2} L ${c[0]} ${c[1] - r * 1.08}`} stroke={PALETTE.goldMuted} strokeWidth={1.1} />
    </g>
  );
};

/** Portolan rhumb lines radiating from the compass: navigation, not borders. */
const Rhumbs: React.FC<{ c: Point; len: number; o: number }> = ({ c, len, o }) => {
  if (o <= 0.002 || len <= 1) {
    return null;
  }
  let d = "";
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    d += `M ${c[0]} ${c[1]} L ${(c[0] + Math.sin(a) * len).toFixed(1)} ${(c[1] - Math.cos(a) * len).toFixed(1)} `;
  }
  return <path d={d} stroke={PALETTE.skyBlue} strokeWidth={0.7} opacity={o} fill="none" />;
};

const Ground01: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const reveal = T.mapReveal(f);
  const v = T.virreinato(f);
  const ba = MP([58.4, 34.6]);
  return (
    <>
      <MapGround
        camera={camera}
        placement={IDENTITY}
        continents={["euroAfrica", "britain", "southAmerica", "fuego", "northAmerica", "florida", "caribbean"]}
        opacity={f < 180 ? 1 : 0}
        reveal={{ c: COMPASS, r: reveal }}
        graticule={T.graticule(f)}
        clipId="s01"
      />
      <SheetGround camera={camera} pl={IDENTITY}>
      <Rhumbs c={COMPASS} len={T.rhumbs(f) * 9000} o={0.5 * (1 - ramp(f, 120, 170))} />
      <CompassRose o={T.compass(f) * (1 - ramp(f, 150, 190))} c={COMPASS} r={620} />
      {BRANCHES.map((b) => {
        const t = clamp01((f - b.from) / (b.to - b.from));
        if (t <= 0) {
          return null;
        }
        return (
          <path
            key={b.id}
            d={polylineToPath(sampleRange(b.pts, 0, t))}
            fill="none"
            stroke={PALETTE.skyBlue}
            strokeWidth={1.8}
            strokeDasharray="1.5 7"
            strokeLinecap="round"
            opacity={0.75 * (1 - ramp(f, 170, 215))}
          />
        );
      })}
      {v > 0.002 ? (
        <g data-id="virreinato.1776" data-status="historical">
          <path d={VIRR_D} fill={PALETTE.goldLight} opacity={0.07 * v} />
          <HatchedArea id="s01-virr" d={VIRR_D} bbox={VIRR_BBOX} spacing={46} angle={60} color={mixColor(PALETTE.skyBlue, PALETTE.goldMuted, 0.3)} width={0.9} opacity={0.55 * v} />
          <path d={VIRR_D} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={1.2} strokeDasharray="2 5" opacity={v * 0.9} />
        </g>
      ) : null}
      {COLONIAL_TOWNS.map((t) => {
        const o = ramp(f, t.at - 6, t.at + 8);
        if (o <= 0) {
          return null;
        }
        const p = MP(t.ll);
        return <circle key={t.id} cx={p[0]} cy={p[1]} r={16 * t.size} fill={PALETTE.paperWarm} stroke={PALETTE.deepBlue} strokeWidth={1.2} opacity={o} />;
      })}
      {f > 150 ? (
        // Wave crest: the viceroyalty's eastern edge continues into the estuary.
        <path
          d={`M ${ba[0] - 120} ${ba[1] + 60} C ${ba[0] + 100} ${ba[1] + 10}, ${ba[0] + 300} ${ba[1] + 40}, ${ba[0] + 520} ${ba[1] + 140}`}
          fill="none"
          stroke={PALETTE.skyBlue}
          strokeWidth={2}
          opacity={ramp(f, 150, 172) * 0.8}
        />
      ) : null}
      </SheetGround>
    </>
  );
};

/* ------------------------------------------------------------------- items */

const SHIP_LAG = [0, 0.035, 0.07] as const;

export const items01 = (ctx: { f: number; camera: import("../../types/camera").CameraState; proj: (pl: typeof IDENTITY, d?: number) => import("../../stage/projection").Projector }): StageItem[] => {
  const { f, camera } = ctx;
  const out: StageItem[] = [];
  const p = ctx.proj(IDENTITY);
  const fold = foldFromTilt(camera, 4, 34);
  const head = T.head(f);
  SHIP_LAG.forEach((lag, i) => {
    const s = head - lag;
    const o = ramp(f, 22 + i * 6, 34 + i * 6) * (1 - ramp(f, 150 + i * 4, 172 + i * 4));
    if (o <= 0.002 || s < 0) {
      return;
    }
    const { p: q, angle } = routeAt(ATLANTIC_ROUTE, Math.max(0, s));
    const facing: 1 | -1 = Math.cos(angle) >= 0 ? 1 : -1;
    const scale = (0.42 - i * 0.05) / camera.zoom;
    out.push({
      key: `caravel.${i}`,
      y: q[1],
      depth: 1,
      node: <Ship p={p} x={q[0] + i * 40} y={q[1] + i * 260} scale={scale} facing={facing} kind="caravel" wind={f / 34 + i * 0.3} fold={fold} opacity={o} flag="abstract" />,
    });
  });
  // Foreground: a large caravel crossing close to camera (depth plane).
  const fgo = win(f, 52, 66, 108, 124);
  if (fgo > 0.002) {
    const fp = ctx.proj(IDENTITY, 2.2);
    const t = (f - 52) / 72;
    const c = routeAt(ATLANTIC_ROUTE, 0.5).p;
    out.push({
      key: "fg.caravel",
      y: 0,
      depth: 2.2,
      node: <Ship p={fp} x={c[0] - 3400 + t * 5200} y={c[1] + 2200} scale={1.9 / camera.zoom / 2.2} facing={1} kind="caravel" wind={f / 30} fold={Math.max(0, fold - 0.2)} opacity={fgo} />,
    });
  }
  // Colonial towns: church + houses drafted from the map (1776).
  for (const t of COLONIAL_TOWNS) {
    const b = ramp(f, t.at - 4, t.at + 22);
    if (b <= 0) {
      continue;
    }
    const q = MP(t.ll);
    const s = (0.2 * t.size) / camera.zoom;
    const tfold = Math.max(fold, 0.15);
    const fade = 1 - ramp(f, 196, 226);
    out.push({
      key: `town.${t.id}`,
      y: q[1],
      depth: 1,
      node: (
        <g opacity={fade}>
          <Building p={p} kind="church" x={q[0] - 90 * s} y={q[1]} w={180} h={90} scale={s} build={b} fold={tfold} id={`town-${t.id}-c`} />
          <Building p={p} kind="colonialHouse" x={q[0] - 250 * s} y={q[1] + 30 * s} w={150} h={60} scale={s} build={b * 0.95} fold={tfold} variant={1} id={`town-${t.id}-h1`} />
          <Building p={p} kind="colonialHouse" x={q[0] + 100 * s} y={q[1] + 20 * s} w={130} h={56} scale={s} build={b * 0.9} fold={tfold} variant={2} id={`town-${t.id}-h2`} />
        </g>
      ),
    });
  }
  return out;
};

const Overlay01: React.FC<{ f: number; camera: import("../../types/camera").CameraState }> = ({ f, camera }) => {
  const a = T.label1492(f);
  const b = T.label1776(f);
  return (
    <>
      <At x={168} y={96} id="label.1492">
        <DateText text="1492" size={120} o={a} enter={ramp(f, 20, 34)} />
        <EventText lines={["EL MUNDO SE CONECTA"]} o={a} enter={ramp(f, 24, 40)} tone="deep" tracking={0.16} />
      </At>
      <At x={168} y={770} id="label.1776">
        <DateText text="1776" size={112} o={b} enter={ramp(f, 128, 142)} />
        <EventText lines={["VIRREINATO DEL RÍO DE LA PLATA"]} o={b} enter={ramp(f, 132, 150)} tracking={0.14} />
      </At>
      <MapLabel camera={camera} anchor={M(32, -20)} lines={["OCÉANO ATLÁNTICO"]} o={0.55 * win(f, 40, 60, 130, 160)} size={17} tracking={0.5} />
      <MapLabel camera={camera} anchor={M(14.5, -30.5)} lines={["1492"]} o={0.5 * win(f, 100, 112, 150, 170)} size={15} tracking={0.2} />
      <MapLabel camera={camera} anchor={M(62, 8)} lines={["AMÉRICA"]} o={0.5 * win(f, 30, 50, 120, 150)} size={20} tracking={0.6} />
      <MapLabel camera={camera} anchor={M(-4, -15)} lines={["ÁFRICA"]} o={0.5 * win(f, 20, 40, 90, 120)} size={20} tracking={0.6} />
      <MapLabel camera={camera} anchor={M(4, -40.5)} lines={["EUROPA"]} o={0.5 * win(f, 16, 36, 70, 100)} size={20} tracking={0.6} />
    </>
  );
};

export const STAGES_01: readonly FilmStage[] = [
  {
    id: "s01",
    from: 0,
    to: 236,
    Ground: Ground01,
    items: items01,
    Overlay: Overlay01,
  },
];

/* ---------------------------------------------------------------- memory line */

export const ERA_01: LineEra = {
  id: "atlanticRoute",
  from: 0,
  to: 179,
  evaluate: (f) => {
    const h = T.head(f);
    return {
      points: ATLANTIC_ROUTE,
      ranges: h > 0.001 ? [{ start: 0, end: h, opacity: 0.95, color: mixColor(PALETTE.skyBlue, PALETTE.deepBlueSoft, 0.12) }] : [],
      head: h > 0.001 && h < 0.999 ? { s: h, opacity: 1 } : null,
      core: [],
    };
  },
};

export const lerpPoint = (a: Point, b: Point, t: number): Point => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
