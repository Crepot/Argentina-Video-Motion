import React from "react";
import { lerp } from "../../animation/interpolate-clamped";
import { interpolatePoints } from "../../paths/interpolate-path";
import { mixColor, PALETTE } from "../../theme/palette";
import type { CameraState } from "../../types/camera";
import type { Point, VisibleRange } from "../../types/paths";
import { FONT_DISPLAY } from "../../typography/fonts";
import { K, ramp, win } from "../anim";
import { antarctic, M, MALVINAS_SIMPLE, place as placeLL } from "../data/geo";
import { At, DateText, EventText, MapLabel } from "../draw/labels";
import { ANTARCTIC, ARGENTINA_FUEGO_PATH, ARGENTINA_PATH, HatchedArea, MALVINAS_PATH, MapGround, pathBBox } from "../draw/map";
import { SheetGround } from "../draw/sheet";
import { SunOfMay } from "../draw/symbols";
import type { CamKey } from "../film-camera";
import { G, GLOBE } from "../late-world";
import { toWorld } from "../space";
import type { FilmStage, LineEra } from "../types";
import { ARG_OUTLINE, LATE, S, sOf } from "./late-line";

/**
 * Scene 19 · 2023–2026 / LIBERTAD · frames 3000–3149. The completed laurel
 * releases; the 36-year line and every surviving stretch converge on the
 * globe sheet into continental Argentina (confident sky-blue outline) while
 * a contemporary network — city and Congress, industry, countryside,
 * science, culture, the south — pulses between regions. Malvinas and the
 * Antarctic sector are drawn with differentiated dashed/hatched treatment
 * and their notes. Three LIBERTAD impacts (3020 deep blue · 3042 sky blue
 * with a gold rule · 3064 gold, largest, Sun of May rays once — the second
 * sanctioned hard cut), then ARGENTINA · 1810—2026, stillness, and the marks
 * dissolve into ivory over the last 12 frames.
 */

/* --------------------------------------------------------------- framing */

const ARG_TOP = G(65, 22)[1];
const ANT_BOTTOM = toWorld(GLOBE, antarctic(49.5, 90))[1];
const MAP_CX = G(63, 40)[0];
const MAP_CY = (ARG_TOP + ANT_BOTTOM) / 2;
const MAP_H = ANT_BOTTOM - ARG_TOP;
const ZN = 900 / MAP_H;
const ZF = 960 / MAP_H;
/** Camera x that puts the map centre at screen x = sx. */
const camX = (sx: number, z: number) => MAP_CX + (960 - sx) / z;

export const KEYS_19: readonly CamKey[] = [
  { f: 3008, x: 16560, y: -2700, zoom: 0.95, tilt: 0, rot: 0 },
  { f: 3020, x: G(62, 34)[0] + 300 / 1.7, y: G(62, 34)[1], zoom: 1.7, tilt: 0, rot: 0 },
  { f: 3038, x: camX(700, ZN), y: MAP_CY, zoom: ZN, tilt: 0, rot: 0 },
  { f: 3042, x: camX(700, ZN), y: MAP_CY, zoom: ZN, tilt: 0, rot: 0 },
  { f: 3047, x: camX(700, ZN * 1.015), y: MAP_CY, zoom: ZN * 1.015, tilt: 0, rot: 0 },
  { f: 3063, x: camX(700, ZN * 1.02), y: MAP_CY, zoom: ZN * 1.02, tilt: 0, rot: 0 },
  // Final segment (after the LIBERTAD cut): one tiny axial push, then perfectly still.
  { f: 3064, x: camX(600, ZF * 1.03), y: MAP_CY, zoom: ZF * 1.03, tilt: 0, rot: 0 },
  { f: 3072, x: camX(600, ZF), y: MAP_CY, zoom: ZF, tilt: 0, rot: 0 },
  { f: 3149, x: camX(600, ZF), y: MAP_CY, zoom: ZF, tilt: 0, rot: 0 },
];

/* ---------------------------------------------------------------- timing */

const T = {
  map: K([
    [2998, 0, "atlasDrift"],
    [3014, 1],
  ]),
  fill: K([
    [3012, 0, "atlasDrift"],
    [3040, 1],
  ]),
  network: (f: number) => win(f, 3004, 3016, 3034, 3050),
  claims: K([
    [3026, 0, "atlasDrift"],
    [3044, 1],
  ]),
  neighbours: K([
    [3030, 1, "atlasDrift"],
    [3060, 0.45],
  ]),
  veil: K([
    [3137, 0, "atlasDrift"],
    [3149, 1],
  ]),
};

/* --------------------------------------------------------------- network */

const LL = (id: Parameters<typeof placeLL>[0]) => placeLL(id);
const NODES: Record<string, Point> = {
  ba: LL("buenosAires"),
  rosario: LL("rosario"),
  cordoba: LL("cordoba"),
  mendoza: LL("mendoza"),
  tucuman: LL("tucuman"),
  salta: LL("salta"),
  corrientes: LL("corrientes"),
  bahia: LL("bahiaBlanca"),
  neuquen: LL("neuquen"),
  bariloche: M(71.3, 41.1),
  comodoro: M(67.5, 45.9),
  ushuaia: LL("ushuaia"),
  pampa: M(61.8, 36.2),
};
const LINKS: readonly [string, string][] = [
  ["ba", "rosario"],
  ["rosario", "cordoba"],
  ["cordoba", "mendoza"],
  ["cordoba", "tucuman"],
  ["tucuman", "salta"],
  ["rosario", "corrientes"],
  ["ba", "pampa"],
  ["pampa", "bahia"],
  ["bahia", "neuquen"],
  ["neuquen", "bariloche"],
  ["bahia", "comodoro"],
  ["comodoro", "ushuaia"],
];

/** Compact line vignettes (globe-local units, ~M units). */
const Vignette: React.FC<{ at: Point; kind: string; o: number; f: number }> = ({ at, kind, o, f }) => {
  const [x, y] = at;
  const s = 1;
  const c = PALETTE.deepBlueSoft;
  const sky = PALETTE.skyBlue;
  let d = "";
  let d2 = "";
  switch (kind) {
    case "city": // towers + a civic dome (Congress)
      d = `M ${x - 150} ${y} V ${y - 170} H ${x - 100} V ${y} M ${x - 90} ${y} V ${y - 250} H ${x - 30} V ${y} M ${x - 20} ${y} V ${y - 130} H ${x + 30} V ${y}`;
      d2 = `M ${x + 50} ${y} V ${y - 80} H ${x + 190} V ${y} M ${x + 60} ${y - 80} A 60 60 0 0 1 ${x + 180} ${y - 80} M ${x + 120} ${y - 140} V ${y - 175}`;
      break;
    case "industry":
      d = `M ${x - 140} ${y} V ${y - 90} L ${x - 90} ${y - 140} V ${y - 90} L ${x - 40} ${y - 140} V ${y - 90} L ${x + 10} ${y - 140} V ${y - 90} L ${x + 60} ${y - 140} V ${y} Z M ${x + 80} ${y} V ${y - 210} H ${x + 110} V ${y}`;
      break;
    case "field":
      for (let i = 0; i < 6; i++) {
        d += `M ${x - 180 + i * 16} ${y - 20 + i * 24} L ${x + 120 + i * 16} ${y - 60 + i * 24} `;
      }
      d2 = `M ${x + 170} ${y + 60} V ${y - 110} M ${x + 170} ${y - 110} l ${Math.cos(f / 6) * 50} ${Math.sin(f / 6) * 50} M ${x + 170} ${y - 110} l ${-Math.cos(f / 6) * 50} ${-Math.sin(f / 6) * 50}`;
      break;
    case "science":
      d = `M ${x - 10} ${y} L ${x} ${y - 90} L ${x + 10} ${y} M ${x - 110} ${y - 170} C ${x - 80} ${y - 70}, ${x + 50} ${y - 60}, ${x + 110} ${y - 120} Z`;
      d2 = `M ${x - 230} ${y - 110} A 230 90 0 1 0 ${x + 230} ${y - 110} A 230 90 0 1 0 ${x - 230} ${y - 110}`;
      break;
    case "culture": // an open-air stage arc and seats
      d = `M ${x - 140} ${y} A 140 140 0 0 1 ${x + 140} ${y} M ${x - 100} ${y} V ${y - 60} H ${x + 100} V ${y}`;
      d2 = `M ${x - 150} ${y + 40} H ${x + 150} M ${x - 170} ${y + 80} H ${x + 170}`;
      break;
    case "south": // wind turbines and a ridge
      for (const dx of [-120, 0, 120]) {
        const a = f / 5 + dx;
        d += `M ${x + dx} ${y} V ${y - 200} `;
        for (let k = 0; k < 3; k++) {
          const b = a + (k * Math.PI * 2) / 3;
          d += `M ${x + dx} ${y - 200} l ${(Math.cos(b) * 70).toFixed(1)} ${(Math.sin(b) * 70).toFixed(1)} `;
        }
      }
      d2 = `M ${x - 260} ${y + 40} L ${x - 140} ${y - 60} L ${x - 40} ${y + 10} L ${x + 80} ${y - 90} L ${x + 240} ${y + 40}`;
      break;
  }
  return o > 0.002 ? (
    <g opacity={o} transform={`translate(${x * (1 - s)} ${y * (1 - s)}) scale(${s})`}>
      <path d={d} fill="none" stroke={c} strokeWidth={1.6} strokeLinejoin="round" />
      {d2 ? <path d={d2} fill="none" stroke={sky} strokeWidth={1.6} strokeLinejoin="round" /> : null}
    </g>
  ) : null;
};

const VIGNETTES: readonly { at: Point; kind: string; d: number }[] = [
  { at: [NODES.ba[0] + 80, NODES.ba[1] - 60], kind: "city", d: 0 },
  { at: [NODES.cordoba[0] - 40, NODES.cordoba[1] - 80], kind: "industry", d: 3 },
  { at: NODES.pampa, kind: "field", d: 5 },
  { at: [NODES.bariloche[0] - 60, NODES.bariloche[1] - 40], kind: "science", d: 7 },
  { at: [NODES.tucuman[0] + 20, NODES.tucuman[1] - 60], kind: "culture", d: 9 },
  { at: [NODES.comodoro[0] - 60, NODES.comodoro[1] - 20], kind: "south", d: 11 },
];

/* ------------------------------------------------------------------ ground */

const MALV_BBOX = pathBBox(MALVINAS_SIMPLE.flat());

const FinaleGround: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const m = T.map(f);
  const net = T.network(f);
  const claims = T.claims(f);
  return (
    <>
      <MapGround camera={camera} placement={GLOBE} continents={["southAmerica", "fuego"]} opacity={m * T.neighbours(f)} graticule={0.28} clipId="g19" />
      <SheetGround camera={camera} pl={GLOBE} opacity={m}>
        {/* Continental Argentina: pale land under the sky-blue memory outline. */}
        <path d={`${ARGENTINA_PATH} ${ARGENTINA_FUEGO_PATH}`} fill={mixColor(PALETTE.skyBluePale, PALETTE.paperWarm, 0.5)} opacity={T.fill(f)} />
        {/* Contemporary network. */}
        {net > 0.002
          ? LINKS.map(([a, b], i) => {
              const k = Math.max(0, Math.min(1, (f - 3004 - i * 1.2) / 8));
              const p = NODES[a];
              const q = NODES[b];
              return <path key={`${a}-${b}`} d={`M ${p[0]} ${p[1]} L ${lerp(p[0], q[0], k)} ${lerp(p[1], q[1], k)}`} stroke={PALETTE.skyBlue} strokeWidth={1.8} opacity={net} />;
            })
          : null}
        {net > 0.002
          ? Object.entries(NODES).map(([id, q], i) => {
              const pulse = ((f + i * 5) % 20) / 20;
              return (
                <g key={id} opacity={net}>
                  <circle cx={q[0]} cy={q[1]} r={46} fill={PALETTE.paperWarm} stroke={PALETTE.deepBlueSoft} strokeWidth={1.4} />
                  <circle cx={q[0]} cy={q[1]} r={46 + pulse * 120} fill="none" stroke={PALETTE.skyBlue} strokeWidth={1.2} opacity={1 - pulse} />
                </g>
              );
            })
          : null}
        {VIGNETTES.map((v) => (
          <Vignette key={v.kind} at={v.at} kind={v.kind} o={net * Math.max(0, Math.min(1, (f - 3006 - v.d) / 6))} f={f} />
        ))}
        {/* Malvinas: dashed sovereignty-claim treatment, lightly hatched. */}
        <g opacity={claims}>
          <path d={MALVINAS_PATH} fill={mixColor(PALETTE.skyBluePale, PALETTE.paperWarm, 0.5)} stroke={PALETTE.skyBlue} strokeWidth={1.6} strokeDasharray="4 3" />
          <HatchedArea id="finale-malv" d={MALVINAS_PATH} bbox={MALV_BBOX} spacing={34} color={PALETTE.deepBlueSoft} width={0.7} opacity={0.6} />
          <circle cx={M(59.3, 51.7)[0]} cy={M(59.3, 51.7)[1]} r={420} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={1} strokeDasharray="6 6" opacity={0.6} />
        </g>
        {/* Antarctic sector: separated inset, dashed limits and hatch (Treaty). */}
        <g opacity={claims}>
          <HatchedArea id="finale-ant" d={ANTARCTIC.sectorArea} bbox={ANTARCTIC.bbox} spacing={70} angle={-45} color={PALETTE.grayBlue} width={0.8} opacity={0.75} />
          <path d={ANTARCTIC.sector} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={1.2} strokeDasharray="7 6" />
          <path d={ANTARCTIC.coast} fill="none" stroke={PALETTE.skyBlue} strokeWidth={1.8} />
        </g>
      </SheetGround>
    </>
  );
};

/* ---------------------------------------------------------------- overlay */

const Libertad: React.FC<{ text: string; size: number; tone: string; o: number; enter: number; rule?: number }> = ({ text, size, tone, o, enter, rule = 0 }) =>
  o > 0.002 ? (
    <div style={{ opacity: o, transform: `translateY(${(1 - enter) * 10}px)`, textAlign: "center" }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: size, lineHeight: 1, letterSpacing: "0.08em", color: tone }}>{text}</div>
      {rule > 0 ? <div style={{ margin: "18px auto 0", width: 420 * rule, height: 3, background: PALETTE.goldMuted }} /> : null}
    </div>
  ) : null;

const LOCK_X = 1330;

const FinaleOverlay: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const claims = T.claims(f);
  const l1 = f >= 3020 && f < 3042 ? ramp(f, 3020, 3023) : 0;
  const l2 = f >= 3042 && f < 3064 ? ramp(f, 3042, 3045) : 0;
  const l3 = f >= 3064 ? 1 - ramp(f, 3084, 3094) : 0;
  const lock = ramp(f, 3094, 3106);
  const gold = 1 - ramp(f, 3122, 3134);
  const now = win(f, 3004, 3010, 3018, 3024);
  const sunR = ramp(f, 3064, 3080);
  const malv = G(56.6, 51.9);
  const ant = toWorld(GLOBE, antarctic(23, 66));
  return (
    <>
      <At x={168} y={96} id="label.2023">
        <DateText text="ARGENTINA · 2023–2026" size={72} o={now} enter={ramp(f, 3004, 3010)} tracking={0.02} />
      </At>
      <MapLabel camera={camera} anchor={malv} lines={["ISLAS MALVINAS · RECLAMO ARGENTINO DE SOBERANÍA"]} o={claims} size={18} align="left" tone="deep" tracking={0.16} dy={-14} />
      <MapLabel camera={camera} anchor={malv} lines={["BAJO ADMINISTRACIÓN BRITÁNICA"]} o={0.85 * claims} size={15} align="left" tone="soft" tracking={0.16} dy={10} />
      <MapLabel camera={camera} anchor={ant} lines={["SECTOR ANTÁRTICO ARGENTINO · RECLAMO SUJETO AL TRATADO ANTÁRTICO"]} o={claims} size={18} align="left" tone="deep" tracking={0.14} dy={-10} />
      {f >= 3064 && l3 > 0.002 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <SunOfMay c={[LOCK_X, 470]} r={250} rays={sunR} o={0.9 * l3} strokeW={1.6} disk={0} />
        </svg>
      ) : null}
      <At x={LOCK_X} y={390} align="center" id="libertad.1">
        <Libertad text="LIBERTAD" size={112} tone={PALETTE.deepBlue} o={l1} enter={ramp(f, 3020, 3024)} />
      </At>
      <At x={LOCK_X} y={372} align="center" id="libertad.2">
        <Libertad text="LIBERTAD" size={140} tone={PALETTE.skyBlue} o={l2} enter={ramp(f, 3042, 3046)} rule={ramp(f, 3043, 3052)} />
      </At>
      <At x={LOCK_X} y={372} align="center" id="libertad.3">
        <Libertad text="LIBERTAD" size={184} tone={PALETTE.goldMuted} o={l3} enter={1} />
      </At>
      <At x={LOCK_X} y={392} align="center" id="lockup.argentina">
        {lock > 0.002 ? (
          <div style={{ opacity: lock, transform: `translateY(${(1 - lock) * 8}px)`, textAlign: "center" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 132, lineHeight: 1, letterSpacing: "0.1em", color: PALETTE.deepBlue }}>ARGENTINA</div>
            <div style={{ margin: "22px auto 18px", width: 300, height: 2, background: PALETTE.goldMuted, opacity: gold }} />
            <EventText lines={["1810—2026"]} o={1} size={40} tone="soft" tracking={0.3} mt={0} />
          </div>
        ) : null}
      </At>
      {/* Final dissolve: every mark returns to the paper. */}
      <div style={{ position: "absolute", inset: 0, background: PALETTE.paperIvory, opacity: T.veil(f) }} />
    </>
  );
};

export const STAGES_19: readonly FilmStage[] = [{ id: "s19", from: 2998, to: 3149, Ground: FinaleGround, Overlay: FinaleOverlay, order: 20 }];

/* ------------------------------------------------------------- memory line */

export const ERA_19: LineEra = {
  id: "argentinaOutline",
  from: 3000,
  to: 3149,
  evaluate: (f) => {
    const m = K([
      [3002, 0, "atlasDrift"],
      [3036, 1],
    ])(f);
    const pts = m >= 1 ? ARG_OUTLINE : interpolatePoints(LATE, ARG_OUTLINE, m);
    const color = mixColor(PALETTE.goldMuted, PALETTE.skyBlue, ramp(f, 3012, 3040));
    const ranges: VisibleRange[] = [
      { start: 0, end: sOf(S.F[0]), opacity: 0.95 * ramp(f, 3000, 3014), color },
      { start: sOf(S.F[0]), end: 1, opacity: 0.95, color },
    ];
    return { points: pts, ranges, head: null, core: [{ start: 0, end: 1, opacity: 1 - ramp(f, 3004, 3026) }] };
  },
};
