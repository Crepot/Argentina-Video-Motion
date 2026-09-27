import React from "react";
import { lerp } from "../../animation/interpolate-clamped";
import { billboardMatrix } from "../../stage/projection";
import { FlagCloth } from "../../stage/FlagCloth";
import { GroundV2, LabelsOverlayV2, V2OceanLabel, v2StageItems } from "../../scenes/v2/SceneRouterV2";
import type { StageContext } from "../../scenes/v2/stage-items";
import { PALETTE, mixColor } from "../../theme/palette";
import { evaluateMemoryLine } from "../../timeline/benchmark-timeline";
import { memoryLineGeometry } from "../../paths/path-visibility";
import { interpolatePoints } from "../../paths/interpolate-path";
import type { CameraState } from "../../types/camera";
import type { Point } from "../../types/paths";
import { K, ramp, win } from "../anim";
import { M, place as placeLL } from "../data/geo";
import { AnthemText, At, DateText, EventText, MapLabel } from "../draw/labels";
import { MapGround } from "../draw/map";
import { SheetGround } from "../draw/sheet";
import { V2_CAMERA_KEYS, type CamKey } from "../film-camera";
import { stateParts } from "../line";
import { IDENTITY } from "../space";
import type { FilmCtx, FilmStage, LineEra, StageItem } from "../types";

/**
 * Scenes 10–12 in the film. 1722–2171 is the approved Benchmark V2, reused
 * unchanged except for the editorial locks (Malvinas legend) and the early
 * entry of its 1976 column (so nothing pops at 1722). After 2171 the
 * Malvinas beat continues at human scale — Argentine soldiers reach the
 * ridge against the wind, one helps another, two plant and hold the flag —
 * then a pullback recovers the mainland where the civic line reconnects:
 * 1983 · DEMOCRACIA (no individual leader).
 */
const v2ctx = (ctx: FilmCtx): StageContext => ({
  f: ctx.f,
  proj: (d = 1) => ctx.proj(IDENTITY, d),
  onScreen: (x, y, d = 1, margin = 300) => ctx.onScreen(IDENTITY, x, y, d, margin),
});

const V2Ground: React.FC<{ f: number }> = ({ f }) => (
  <>
    <GroundV2 f={f} fibres={false} />
    <V2OceanLabel f={f} />
  </>
);

/* ------------------------------------------------ Malvinas continuation */

const FLAG_AT: Point = [5902, 2976];
const MALV = M(59.3, 51.7);
const T = {
  flagRaise: K([
    [2198, 0, "ceremonial"],
    [2218, 1],
  ]),
  flagO: (f: number) => win(f, 2190, 2198, 2226, 2240),
  map: (f: number) => K([
    [2222, 0, "atlasDrift"],
    [2250, 1],
  ])(f) * (1 - ramp(f, 2268, 2290)),
  civic: K([
    [2228, 0, "atlasDrift"],
    [2256, 1],
  ]),
};

export const KEYS_10_12: readonly CamKey[] = [
  ...V2_CAMERA_KEYS,
  { f: 2190, x: 5930, y: 2880, zoom: 2.45, tilt: 48, rot: -5 },
  { f: 2206, x: 5905, y: 2915, zoom: 2.75, tilt: 58, rot: -4 },
  { f: 2222, x: 5890, y: 2905, zoom: 2.4, tilt: 54, rot: -3 },
  { f: 2240, x: 5900, y: 1700, zoom: 0.45, tilt: 14, rot: -1 },
  { f: 2256, x: 6500, y: 900, zoom: 0.3, tilt: 8, rot: 0 },
];

const CONGRESO_NODES: readonly { id: string; ll: readonly [number, number]; label: string }[] = [
  { id: "congreso", ll: [58.4, 34.6], label: "CONGRESO" },
  { id: "urnas", ll: [60.65, 32.95], label: "ELECCIONES" },
  { id: "plaza", ll: [64.2, 31.4], label: "CALLES · PLAZAS" },
];

const DemocracyGround: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const m = T.map(f);
  const c = T.civic(f);
  return (
    <>
      <MapGround camera={camera} placement={IDENTITY} continents={["southAmerica", "fuego"]} opacity={m} graticule={0.4} clipId="s12" cool={1 - c * 0.7} />
      <SheetGround camera={camera} pl={IDENTITY} opacity={m}>
        <circle cx={MALV[0]} cy={MALV[1]} r={150} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={1.2} strokeDasharray="6 6" />
        {CONGRESO_NODES.map((n, i) => {
          const q = M(n.ll[0], n.ll[1]);
          const o = ramp(f, 2232 + i * 6, 2246 + i * 6);
          return (
            <g key={n.id}>
              <circle cx={q[0]} cy={q[1]} r={46} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={1.4} />
              <circle cx={q[0]} cy={q[1]} r={30 * o} fill={PALETTE.skyBlue} opacity={o} />
            </g>
          );
        })}
      </SheetGround>
    </>
  );
};

const malvinasItems = (ctx: FilmCtx): StageItem[] => {
  const { f } = ctx;
  const out: StageItem[] = [];
  const fo = T.flagO(f);
  if (fo > 0.002) {
    const p = ctx.proj(IDENTITY, 1.9);
    const s = 0.5;
    const raise = T.flagRaise(f);
    out.push({
      key: "malvinas.flag",
      y: FLAG_AT[1] + 0.5,
      depth: 1.9,
      node: (
        <g transform={billboardMatrix(p, FLAG_AT[0], FLAG_AT[1], s)} opacity={fo}>
          <g transform={`rotate(${lerp(-38, 0, raise).toFixed(2)})`}>
            <path d="M 0 0 V -200" stroke={PALETTE.deepBlue} strokeWidth={2 / (p.zoom * s)} />
            <g transform="translate(0 -60)">
              {/* Wind from the west: the cloth flies east, tense and moving. */}
              <FlagCloth phase={f / 9} amplitude={9} width={96} height={60} pole={140} tension={0.75} pxPerUnit={p.zoom * s} />
            </g>
          </g>
        </g>
      ),
    });
  }
  return out;
};

const Overlay: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const oj = win(f, 2180, 2194, 2226, 2240);
  const d83 = win(f, 2236, 2246, 2290, 2306);
  return (
    <>
      <LabelsOverlayV2 />
      <At x={1752} y={96} align="right" id="anthem.juremos">
        <AnthemText lines={["O JUREMOS", "CON GLORIA MORIR"]} o={oj} reveal={ramp(f, 2180, 2206)} align="right" />
      </At>
      <At x={168} y={96} id="label.1983">
        <DateText text="1983" size={104} o={d83} enter={ramp(f, 2236, 2246)} />
        <EventText lines={["DEMOCRACIA"]} o={d83} enter={ramp(f, 2240, 2252)} tracking={0.22} />
      </At>
      {CONGRESO_NODES.map((n, i) => (
        <MapLabel key={n.id} camera={camera} anchor={M(n.ll[0], n.ll[1])} lines={[n.label]} o={0.8 * win(f, 2240 + i * 6, 2250 + i * 6, 2290, 2300)} size={14} tone="deep" dy={26} tracking={0.25} />
      ))}
      <At x={168} y={930} id="legend.malvinas">
        <EventText lines={["ISLAS MALVINAS · RECLAMO ARGENTINO DE SOBERANÍA"]} o={win(f, 2182, 2192, 2226, 2240)} size={22} tracking={0.2} mt={0} />
        <EventText lines={["BAJO ADMINISTRACIÓN BRITÁNICA"]} o={0.85 * win(f, 2182, 2192, 2226, 2240)} size={15} tracking={0.2} tone="soft" mt={6} />
      </At>
      <MapLabel camera={camera} anchor={M(59.2, 52.9)} lines={["ISLAS MALVINAS · RECLAMO ARGENTINO DE SOBERANÍA"]} o={0.9 * win(f, 2238, 2248, 2290, 2300)} size={14} tone="deep" tracking={0.18} />
    </>
  );
};

export const STAGES_10_12: readonly FilmStage[] = [
  {
    id: "v2",
    from: 1650,
    to: 2250,
    Ground: V2Ground,
    items: (ctx) => [...v2StageItems(v2ctx(ctx)), ...malvinasItems(ctx)],
    Overlay,
  },
  { id: "s12-1983", from: 2220, to: 2300, Ground: DemocracyGround },
];

/* ------------------------------------------------------------- memory line */

/** 1983 civic line: Congress → elections → streets, reopened on the mainland. */
export const PITCH86_CENTER: Point = [8000, 700];
const curl: Point[] = Array.from({ length: 9 }, (_, i) => {
  const a = Math.PI * 0.9 - i * (Math.PI * 1.9) / 8;
  const r = 274 * (1 - i * 0.07);
  return [PITCH86_CENTER[0] + Math.cos(a) * r, PITCH86_CENTER[1] - Math.sin(a) * r] as Point;
});
export const CIVIC_1983: readonly Point[] = stateParts([
  [[placeLL("cordoba"), placeLL("rosario"), M(59.6, 33.9), placeLL("buenosAires")], 40],
  [[placeLL("buenosAires"), M(56.0, 34.9), [7200, 380], ...curl, PITCH86_CENTER], 56],
]);

const routeAt2171 = memoryLineGeometry(evaluateMemoryLine(2171).morph);

export const ERA_10_12: LineEra = {
  id: "benchmarkV2",
  from: 1722,
  to: 2272,
  evaluate: (f) => {
    if (f <= 2171) {
      const st = evaluateMemoryLine(f);
      return { points: memoryLineGeometry(st.morph), ranges: st.ranges, head: st.head, core: [] };
    }
    // After the benchmark: the oceanic route halts short of the islands (a held
    // gap for those who fought and died), then the civic line reopens north.
    const st = evaluateMemoryLine(2171);
    const halt = lerp(0.48, 0.52, ramp(f, 2172, 2196));
    const c = T.civic(f);
    const pts = c > 0 ? interpolatePoints(routeAt2171, CIVIC_1983, c) : routeAt2171;
    const cool = mixColor(PALETTE.skyBlue, PALETTE.grayBlue, 0.3);
    const ranges =
      c <= 0
        ? st.ranges.map((r) => (r.end > 0.48 && r.start < 0.49 ? { ...r, end: halt } : r)).filter((r) => r.start < halt)
        : [
            { start: 0, end: Math.max(0.001, lerp(0.05, 0.42, c) + 0.58 * ramp(f, 2252, 2272)), opacity: 0.95, color: mixColor(cool, PALETTE.skyBlue, c) },
          ];
    return { points: pts, ranges, head: c <= 0 ? { s: halt, opacity: 1 - ramp(f, 2196, 2210) } : null, core: [] };
  },
};
