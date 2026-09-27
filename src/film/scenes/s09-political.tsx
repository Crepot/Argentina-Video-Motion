import React from "react";
import { clamp01, lerp } from "../../animation/interpolate-clamped";
import type { ActorTrack } from "../../actors/action-track";
import { FACADE_Y, NORTH_CURB, SOUTH_CURB, SOUTH_EDGE } from "../../atlas/geometry/city-v2";
import { HistoricalDate } from "../../components/HistoricalDate";
import { interpolatePoints } from "../../paths/interpolate-path";
import { MEMORY_LINE_STATES } from "../../paths/memory-line-states";
import { Vehicle } from "../../stage/Props";
import { mixColor, PALETTE } from "../../theme/palette";
import { TRACKS_V2 } from "../../timeline/benchmark-v2-timeline";
import { SCREEN_LOCKUPS } from "../../timeline/labels-v2";
import type { CameraState } from "../../types/camera";
import type { Point } from "../../types/paths";
import { FONT_SANS } from "../../typography/fonts";
import { A, P, actor, actorItems } from "../actors";
import { foldFromTilt, K, ramp, win } from "../anim";
import { Building, type ElevationKind } from "../draw/architecture";
import { crowdItems, seedCrowd } from "../draw/crowd";
import { AnthemText, At, DateText, EventText, MapLabel } from "../draw/labels";
import { ArsenalBlast, FrontPage } from "../draw/press";
import { Microphones } from "../draw/props";
import { SheetGround } from "../draw/sheet";
import { standMatrix } from "../draw/stand";
import type { CamKey } from "../film-camera";
import { IDENTITY } from "../space";
import type { FilmCtx, FilmStage, LineEra, StageItem } from "../types";
import { RAIL_Y } from "./s08-immigration";

/**
 * Scene 09 · 1930–1976 · frames 1362–1721 (conflict profile), one long avenue
 * whose median is the civic timeline, leading without a cut into the V2
 * avenue of 1976. Beats (chronological, not equivalent):
 *  1930 cut · 1946 Peronism (industry and workers' incorporation together
 *  with personalism: opposition, press, university and institutional nodes
 *  pulled toward the balcony) · 1955–1969 proscription and alternating
 *  governments (in the music's silence) · 1969–1976 radicalisation:
 *  Montoneros and ERP as revolutionary guerrilla organisations with concrete,
 *  non-graphic actions and victims before 1976 · Monte Chingolo (ERP attack
 *  on the Batallón Depósito de Arsenales 601, 23 DIC 1975): architectural
 *  blast → smoke → halftone → a front page marked RECREACIÓN GRÁFICA ·
 *  Triple A (illegal para-state) distinct from lawful security operations ·
 *  the baseline is taken over; a small 1976 enters the margin.
 */
const MED = RAIL_Y;
const CASA = { x0: 50, w: 600, h: 170 } as const;
const BALCONY: Point = [CASA.x0 + CASA.w / 2, FACADE_Y + 4];
const BALCONY_H = 88;
const ARSENAL = { x0: 2020, w: 480, h: 140 } as const;
const GATE: Point = [ARSENAL.x0 + 240, 2336];
const PAGE = { x: 1880, y: 2340, w: 760, h: 560 } as const;

const T = {
  avenue: K([
    [1362, 0, "atlasDrift"],
    [1396, 1],
  ]),
  lead: (f: number) =>
    K([
      [1362, -2090],
      [1400, -830, "atlasDrift"],
      [1440, 700],
      [1500, 1300],
      [1560, 1900],
      [1630, 2350],
      [1700, 3100, "atlasDrift"],
      [1714, 3760],
    ])(f),
  crowd: K([
    [1404, 0, "atlasDrift"],
    [1440, 1],
  ]),
  crowdExcite: K([
    [1418, 0.1],
    [1426, 0.7],
    [1452, 0.5],
    [1462, 0],
  ]),
  withdraw: K([
    [1458, 0, "atlasDrift"],
    [1500, 1],
  ]),
  compress: K([
    [1428, 0, "institutionalLock"],
    [1456, 1],
    [1500, 1, "atlasDrift"],
    [1540, 0.6],
  ]),
  broadcast: (f: number) => win(f, 1442, 1446, 1462, 1476),
  kidnap: K([
    [1512, 0, "institutionalLock"],
    [1534, 1],
  ]),
  bomb: K([
    [1556, 0, "restrainedImpact"],
    [1570, 1],
  ]),
  blast: K([
    [1632, 0, "restrainedImpact"],
    [1650, 1],
  ]),
  smoke: K([
    [1632, 0, "ceremonial"],
    [1640, 1],
    [1652, 1, "atlasDrift"],
    [1664, 0],
  ]),
  page: K([
    [1648, 0, "atlasDrift"],
    [1664, 1],
  ]),
  pageOut: K([
    [1688, 0, "atlasDrift"],
    [1712, 1],
  ]),
  stamp: K([
    [1662, 0, "ceremonial"],
    [1670, 1],
  ]),
  attacks: K([
    [1684, 0, "atlasDrift"],
    [1706, 1],
  ]),
  tripleA: (f: number) => win(f, 1684, 1694, 1716, 1730),
  security: K([
    [1690, 0, "institutionalLock"],
    [1712, 1],
  ]),
};

/* ---------------------------------------------------------------- camera */

export const KEYS_09: readonly CamKey[] = [
  { f: 1386, x: -1050, y: 2430, zoom: 1.28, tilt: 52, rot: 0 },
  { f: 1406, x: -250, y: 2440, zoom: 1.15, tilt: 50, rot: 0 },
  { f: 1426, x: 330, y: 2380, zoom: 1.55, tilt: 56, rot: 0 },
  { f: 1440, x: 350, y: 2380, zoom: 1.72, tilt: 56, rot: 0 },
  { f: 1456, x: 560, y: 2440, zoom: 1.1, tilt: 50, rot: 0 },
  { f: 1480, x: 960, y: 2440, zoom: 1.2, tilt: 50, rot: 0 },
  { f: 1503, x: 1200, y: 2450, zoom: 1.25, tilt: 50, rot: 0 },
  { f: 1526, x: 1450, y: 2480, zoom: 1.35, tilt: 52, rot: 0 },
  { f: 1548, x: 1680, y: 2460, zoom: 1.3, tilt: 52, rot: 0 },
  { f: 1572, x: 1850, y: 2470, zoom: 1.3, tilt: 52, rot: 0 },
  { f: 1602, x: 2040, y: 2540, zoom: 1.45, tilt: 54, rot: 0 },
  { f: 1628, x: 2240, y: 2420, zoom: 1.8, tilt: 56, rot: 0 },
  { f: 1640, x: 2240, y: 2430, zoom: 1.55, tilt: 50, rot: 0 },
  { f: 1656, x: 2260, y: 2560, zoom: 1.3, tilt: 14, rot: 0 },
  { f: 1674, x: 2260, y: 2610, zoom: 1.45, tilt: 1, rot: 0 },
  { f: 1692, x: 2520, y: 2520, zoom: 1.0, tilt: 22, rot: 1 },
  { f: 1708, x: 2800, y: 2410, zoom: 1.2, tilt: 46, rot: 2.5 },
];

/* ------------------------------------------------------------------ ground */

const X_MIN = -1500;
const X_MAX = 2500;

const NODES: readonly { id: string; p: Point; label: string; removeAt?: number; kind: "press" | "victim" | "civic" }[] = [
  { id: "prensa", p: [1000, NORTH_CURB - 12], label: "PRENSA", kind: "press" },
  { id: "universidad", p: [1320, NORTH_CURB - 12], label: "UNIVERSIDAD", kind: "press" },
  { id: "oposicion", p: [760, SOUTH_CURB + 26], label: "OPOSICIÓN", kind: "press" },
  { id: "instituciones", p: [1500, SOUTH_CURB + 26], label: "INSTITUCIONES", kind: "press" },
  { id: "civil", p: [1300, 2612], label: "CIVIL · SECUESTRO", removeAt: 1526, kind: "victim" },
  { id: "politico", p: [1470, 2616], label: "DIRIGENTE POLÍTICO", removeAt: 1538, kind: "victim" },
  { id: "sindical", p: [1830, 2612], label: "DIRIGENTE SINDICAL", removeAt: 1548, kind: "victim" },
  { id: "policia", p: [1640, 2616], label: "POLICÍA", removeAt: 1562, kind: "victim" },
  { id: "militar", p: [2300, 2616], label: "MILITAR", removeAt: 1636, kind: "victim" },
];

const nodePos = (n: (typeof NODES)[number], f: number): Point => {
  if (n.kind !== "press") {
    return n.p;
  }
  const c = T.compress(f) * 0.28;
  return [lerp(n.p[0], BALCONY[0], c), lerp(n.p[1], BALCONY[1] + 40, c)];
};

const SEGMENTS: readonly { x: number; year: string; mil: boolean }[] = [
  { x: 1000, year: "1955", mil: true },
  { x: 1110, year: "1958", mil: false },
  { x: 1220, year: "1962", mil: true },
  { x: 1320, year: "1963", mil: false },
  { x: 1430, year: "1966", mil: true },
];

const PATH_MONTO: readonly Point[] = [
  [1120, 2920],
  [1200, 2720],
  [1282, 2650],
  [1300, 2612],
  [1360, 2700],
  [1420, 2900],
];
const PATH_ERP: readonly Point[] = [
  [1580, 2940],
  [1650, 2700],
  [1640, 2620],
  [1900, 2690],
  [2140, 2560],
  [GATE[0], GATE[1] + 10],
];
const angular = (pts: readonly Point[], t: number) => {
  const n = Math.max(2, Math.ceil(pts.length * clamp01(t)));
  return `M ${pts
    .slice(0, n)
    .map((q) => `${q[0]} ${q[1]}`)
    .join(" L ")}`;
};

const PoliticalGround: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const av = T.avenue(f);
  const line = mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.35);
  const comp = T.compress(f);
  const kid = T.kidnap(f);
  const aa = T.tripleA(f);
  const sec = T.security(f);
  const att = T.attacks(f);
  let zebra = "";
  for (const x of [-600, 0, 700, 1200, 1700, 2250]) {
    for (let y = NORTH_CURB + 14; y < SOUTH_CURB - 10; y += 22) {
      zebra += `M ${x} ${y} H ${x + 50} `;
    }
  }
  return (
    <SheetGround camera={camera} pl={IDENTITY} opacity={av}>
      <path d={`M ${X_MIN} ${FACADE_Y - 200} H ${X_MAX} V ${SOUTH_EDGE + 260} H ${X_MIN} Z`} fill={mixColor(PALETTE.paperWarm, PALETTE.grayBluePale, 0.18)} opacity={0.5} />
      <path
        d={`M ${X_MIN} ${FACADE_Y} H ${X_MAX} M ${X_MIN} ${NORTH_CURB} H ${X_MAX} M ${X_MIN} ${SOUTH_CURB} H ${X_MAX} M ${X_MIN} ${SOUTH_EDGE} H ${X_MAX}`}
        stroke={line}
        strokeWidth={1.3}
      />
      <path d={`M ${X_MIN} 2402 H ${X_MAX} M ${X_MIN} 2524 H ${X_MAX}`} stroke={line} strokeWidth={1.1} strokeDasharray="18 16" opacity={0.5} />
      <path d={zebra} stroke={line} strokeWidth={3} opacity={0.3} />
      {/* 1930: a narrow military bar interrupts the civic line. */}
      <path d={`M -600 ${MED - 46} V ${MED + 46} M -590 ${MED - 46} V ${MED + 46}`} stroke={PALETTE.deepBlue} strokeWidth={3.4} opacity={ramp(f, 1380, 1388) * (1 - ramp(f, 1520, 1560) * 0.7)} />
      {/* 1946: institutional/press/opposition nodes pulled toward the balcony axis. */}
      {comp > 0.002
        ? NODES.filter((n) => n.kind === "press").map((n) => {
            const q = nodePos(n, f);
            return (
              <g key={n.id} opacity={Math.min(1, comp * 1.5)}>
                <path d={`M ${q[0]} ${q[1]} L ${BALCONY[0]} ${BALCONY[1] + 30}`} stroke={PALETTE.deepBlueSoft} strokeWidth={1.3} strokeDasharray="4 5" />
                <rect x={q[0] - 34 + comp * 10} y={q[1] - 24 + comp * 6} width={68 - comp * 20} height={48 - comp * 12} fill="none" stroke={PALETTE.deepBlue} strokeWidth={1.4} />
                <circle cx={q[0]} cy={q[1]} r={9} fill={PALETTE.paperWarm} stroke={PALETTE.deepBlueSoft} strokeWidth={1.3} />
              </g>
            );
          })
        : null}
      {/* 1955–1969: alternating civilian and military segments; proscription bracket. */}
      {SEGMENTS.map((s, i) => {
        const o = ramp(f, 1462 + i * 6, 1470 + i * 6) * (1 - ramp(f, 1600, 1640) * 0.6);
        return o > 0.002 ? (
          <g key={s.year} opacity={o}>
            {s.mil ? (
              <path d={`M ${s.x - 6} ${MED - 40} V ${MED + 40} M ${s.x + 6} ${MED - 40} V ${MED + 40}`} stroke={PALETTE.deepBlue} strokeWidth={3} />
            ) : (
              <circle cx={s.x} cy={MED} r={13} fill={PALETTE.skyBlue} stroke={PALETTE.deepBlueSoft} strokeWidth={1.2} />
            )}
            <text x={s.x} y={MED + 70} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={500} fontSize={20} letterSpacing={2} fill={PALETTE.deepBlueSoft}>
              {s.year}
            </text>
          </g>
        ) : null;
      })}
      <g opacity={win(f, 1466, 1478, 1520, 1550)}>
        <path d={`M 540 2410 H 520 V 2510 H 540 M 900 2410 H 920 V 2510 H 900`} stroke={PALETTE.deepBlue} strokeWidth={2.6} fill="none" />
        <path d="M 520 2460 H 920" stroke={PALETTE.grayBlue} strokeWidth={2} strokeDasharray="8 8" />
      </g>
      {/* Guerrilla routes: angular, dashed, with chevrons — never rounded civic lines. */}
      <path d={angular(PATH_MONTO, ramp(f, 1506, 1528))} fill="none" stroke={mixColor(PALETTE.deepBlue, PALETTE.grayBlue, 0.2)} strokeWidth={3} strokeDasharray="16 6 3 6" opacity={1 - ramp(f, 1580, 1610)} />
      {kid > 0.002 ? <circle cx={1300} cy={2612} r={60 - 30 * kid} fill="none" stroke={PALETTE.deepBlue} strokeWidth={2.2} strokeDasharray="10 5" opacity={(1 - ramp(f, 1560, 1590)) * kid} /> : null}
      <path d={angular(PATH_ERP, ramp(f, 1546, 1626))} fill="none" stroke={PALETTE.deepBlue} strokeWidth={3.4} strokeDasharray="22 7" opacity={1 - ramp(f, 1650, 1680)} />
      {/* Civic protest (1969–1975): rounded sky-blue route, separate from armed paths. */}
      <path d={`M 700 2560 C 800 2550, 950 2555, ${lerp(700, 1150, ramp(f, 1504, 1540))} 2560`} fill="none" stroke={PALETTE.skyBlue} strokeWidth={3} strokeLinecap="round" opacity={win(f, 1504, 1512, 1560, 1590)} />
      {/* Victims before 1976: nodes that become exact empty rings. */}
      {NODES.filter((n) => n.kind === "victim").map((n) => {
        const e = n.removeAt ? ramp(f, n.removeAt, n.removeAt + 10) : 0;
        const o = ramp(f, 1500, 1512) * (1 - ramp(f, 1712, 1730) * 0.5);
        return (
          <g key={n.id} opacity={o}>
            <circle cx={n.p[0]} cy={n.p[1]} r={11 * (1 - e)} fill={PALETTE.skyBlue} />
            <circle cx={n.p[0]} cy={n.p[1]} r={18} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={1.4} />
          </g>
        );
      })}
      {/* After the newspaper: a dense field of dated attacks jams the civic network. */}
      {att > 0.002 ? (
        <g opacity={att * (1 - ramp(f, 1716, 1740))}>
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d={`M ${PAGE.x + PAGE.w - 40} ${2300 + i * 26} H ${lerp(PAGE.x + PAGE.w, 3400, att) - (i % 4) * 60}`} stroke={PALETTE.grayBlue} strokeWidth={1.2} />
          ))}
          {["1973", "1974", "1975"].map((y, i) => (
            <text key={y} x={2750 + i * 180} y={2290 + i * 150} fontFamily={FONT_SANS} fontWeight={500} fontSize={20} letterSpacing={2} fill={PALETTE.deepBlueSoft}>
              {y}
            </text>
          ))}
        </g>
      ) : null}
      {/* Security forces (lawful orders): rigid solid parallels on the north kerb. */}
      {sec > 0.002 ? (
        <path d={`M 2300 ${NORTH_CURB + 6} H ${lerp(2300, 3400, sec)} M 2300 ${NORTH_CURB + 16} H ${lerp(2300, 3400, sec)}`} stroke={mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.6)} strokeWidth={2} />
      ) : null}
      {/* Triple A (illegal para-state): broken, bracketed route from a ministry node. */}
      {aa > 0.002 ? (
        <g opacity={aa}>
          <path d={`M 3220 ${NORTH_CURB + 30} L 3220 2560 L ${lerp(3220, 2300, clamp01(aa * 1.3))} 2560`} fill="none" stroke={PALETTE.deepBlue} strokeWidth={2.6} strokeDasharray="6 10" />
          <path d="M 3196 2536 H 3180 V 2584 H 3196 M 2324 2536 H 2340 V 2584 H 2324" stroke={PALETTE.deepBlue} strokeWidth={2.2} fill="none" />
        </g>
      ) : null}
      {T.page(f) > 0.002 ? (
        <g transform={`translate(${PAGE.x} ${PAGE.y})`} opacity={1 - T.pageOut(f)}>
          <FrontPage w={PAGE.w} h={PAGE.h} reveal={T.page(f)} stamp={T.stamp(f)} />
        </g>
      ) : null}
    </SheetGround>
  );
};

/* ------------------------------------------------------------------ actors */

const W = 0.8;
const workers: ActorTrack[] = Array.from({ length: 10 }, (_, i) =>
  actor(`worker46.${i}`, (["worker", "workerShirt", "workerWoman", "worker"] as const)[i % 4], W, [P(1386 + (i % 3) * 3, -760 + (i % 5) * 60, 2400 + Math.floor(i / 5) * 90), P(1430, -60 + (i % 5) * 60, 2400 + Math.floor(i / 5) * 90, "atlasDrift")], [
    A(1386, "march", { facing: 1 }),
    A(1430, "cheer", { amount: 0.6 }),
  ], { from: 1384 + (i % 3) * 3, to: 1470, enter: "rise", exit: "fold", exitDur: 16 }),
);
/** Juan Domingo Perón: a brief contextual gesture on the balcony (≈30 frames), never a portrait. */
const PERON = actor("historical.peron", "peron", W, [P(1414, BALCONY[0] - 26, BALCONY[1])], [A(1414, "stand", { breadth: 0.9 }), A(1420, "armsUp", { dur: 12, breadth: 0.95 })], {
  from: 1414,
  to: 1450,
  enter: "rise",
  enterDur: 8,
  exit: "fold",
  exitDur: 10,
}, { lift: BALCONY_H, build: "broad", role: "primary", detail: "hero" });
/** Eva Perón: 13 frames; her contour dissolves into a broadcast ring. */
const EVITA = actor("historical.evita", "evita", W * 0.95, [P(1430, BALCONY[0] + 30, BALCONY[1])], [A(1430, "stand", { breadth: 0.85 }), A(1434, "cheer", { amount: 0.4 })], {
  from: 1430,
  to: 1446,
  enter: "rise",
  enterDur: 5,
  exit: "fade",
  exitDur: 6,
}, { lift: BALCONY_H, build: "slight", role: "primary", detail: "hero" });

const students: ActorTrack[] = [0, 1, 2, 3].map((i) =>
  actor(`student.${i}`, i % 2 ? "student" : "workerShirt", W, [P(1504, 700 + i * 44, 2560 + (i % 2) * 20), P(1546, 1120 + i * 44, 2560 + (i % 2) * 20)], [A(1504, "walk", { facing: 1 })], { from: 1504, to: 1560, enter: "rise", exit: "fold" }),
);
const montoneros: ActorTrack[] = [0, 1, 2].map((i) =>
  actor(`montoneros.${i}`, i === 1 ? "guerrillaB" : "guerrilla", W, [P(1508, 1130 + i * 40, 2900 + i * 16), P(1522, 1240 + i * 36, 2690 + i * 12), P(1534, 1290 + i * 30, 2650), P(1560, 1400 + i * 30, 2880, "atlasDrift")], [
    A(1508, "run", { facing: 1 }),
    A(1522, "walk", { facing: 1 }),
    A(1534, "retreat", { facing: 1 }),
  ], { from: 1508, to: 1566, enter: "rise", exit: "fold", exitDur: 12 }),
);
const kidnapped = actor("kidnapped.civil", "officialSuit", W, [P(1500, 1300, 2600), P(1528, 1300, 2600), P(1556, 1400, 2860, "atlasDrift")], [A(1500, "stand", { facing: -1, breadth: 0.6 }), A(1528, "walk", { facing: 1 })], { from: 1500, to: 1558, enter: "rise", exit: "fade" });
const police: ActorTrack[] = [0, 1].map((i) =>
  actor(`police.${i}`, "police", W, [P(1540, 1600 + i * 60, 2350), P(1566, 1560 + i * 60, 2380, "atlasDrift")], [A(1540, "guard", { facing: 1 }), A(1560, "retreat", { facing: -1 })], { from: 1540, to: 1600, enter: "rise", exit: "fold" }),
);
const erp: ActorTrack[] = [0, 1, 2, 3].map((i) =>
  actor(`erp.${i}`, i % 2 ? "guerrillaB" : "guerrilla", W, [P(1548 + i * 2, 1580 + i * 30, 2950), P(1572, 1650 + i * 20, 2720), P(1600, 1900 + i * 26, 2690), P(1622, 2150 + i * 28, 2560), P(1632, 2220 + i * 20, 2420, "atlasDrift")], [
    A(1548, "run", { facing: 1 }),
    A(1572, "walk", { facing: 1 }),
    A(1600, "run", { facing: 1 }),
    A(1632, "retreat", { facing: -1 }),
  ], { from: 1548 + i * 2, to: 1644, enter: "rise", exit: "fold", exitDur: 12 }),
);
const guards: ActorTrack[] = [0, 1].map((i) =>
  actor(`arsenal.guard.${i}`, "army1976", W, [P(1600, GATE[0] - 80 + i * 160, GATE[1] - 8), P(1640, GATE[0] - 120 + i * 240, GATE[1] - 30, "atlasDrift")], [A(1600, "guard", { facing: i ? -1 : 1 }), A(1634, "retreat", { facing: i ? 1 : -1 })], { from: 1600, to: 1656, enter: "rise", exit: "fold" }),
);
const fgGuerrilla = actor("fg.guerrilla", "guerrilla", 1, [P(1586, 1640, 2960), P(1624, 2140, 2960)], [A(1586, "run", { facing: 1 })], { from: 1586, to: 1624, enter: "none", exit: "none" }, { depth: 2.1, detail: "hero" });
const tripleA: ActorTrack[] = [0, 1].map((i) =>
  actor(`tripleA.${i}`, "tripleA", W, [P(1690, 2560 + i * 50, 2610 + i * 12)], [A(1690, "stand", { facing: -1, breadth: 0.5 }), A(1704, "walk", { facing: -1 })], { from: 1690, to: 1726, enter: "rise", exit: "fade" }),
);

const CROWD = seedCrowd({
  seed: 1946,
  count: 240,
  shirts: 4,
  area: (r) => [-100 + r() * 1100, 2370 + r() * 250],
  from: (p, r) => [-600 - r() * 300, (r() - 0.5) * 60],
});

const BUILDINGS: readonly { kind: ElevationKind; x: number; w: number; h: number; at: number; id: string }[] = [
  { kind: "factory", x: -880, w: 330, h: 160, at: 1362, id: "fac1" },
  { kind: "factory", x: -520, w: 250, h: 140, at: 1368, id: "fac2" },
  { kind: "casaRosada", x: CASA.x0, w: CASA.w, h: CASA.h, at: 1392, id: "casaRosada" },
  { kind: "officeTower", x: 700, w: 160, h: 280, at: 1398, id: "radio" },
  { kind: "bankHall", x: 900, w: 200, h: 150, at: 1402, id: "prensa" },
  { kind: "congreso", x: 1140, w: 360, h: 150, at: 1410, id: "universidad" },
  { kind: "bankHall", x: 1560, w: 200, h: 140, at: 1480, id: "comisaria" },
  { kind: "apartmentBlock", x: 1790, w: 200, h: 210, at: 1490, id: "sindicato" },
  { kind: "arsenal", x: ARSENAL.x0, w: ARSENAL.w, h: ARSENAL.h, at: 1560, id: "arsenal" },
];

const items = (ctx: FilmCtx): StageItem[] => {
  const { f, camera } = ctx;
  const p = ctx.proj(IDENTITY);
  const out: StageItem[] = [];
  const fold = Math.max(foldFromTilt(camera, 8, 34), 0);
  for (const b of BUILDINGS) {
    const build = ramp(f, b.at, b.at + 30);
    const leave = b.x < 1000 ? ramp(f, 1600, 1640) : b.x > 1500 ? ramp(f, 1646, 1660) : 0;
    if (build <= 0 || leave >= 1 || !ctx.onScreen(IDENTITY, b.x + b.w / 2, FACADE_Y, 1, 500)) {
      continue;
    }
    const isArs = b.id === "arsenal";
    const bombT = b.id === "comisaria" ? T.bomb(f) : 0;
    out.push({
      key: b.id,
      y: FACADE_Y,
      depth: 1,
      node: (
        <g opacity={1 - leave}>
          <Building p={p} kind={b.kind} x={b.x} y={FACADE_Y} w={b.w} h={b.h} build={build} fold={fold} tone={0.03} cool={f > 1600 ? 0.3 : 0} id={`s09-${b.id}`}>
            {isArs ? <ArsenalBlast t={T.blast(f)} smoke={T.smoke(f)} /> : null}
            {bombT > 0 ? <path d="M 60 -120 L 80 -96 L 72 -70 L 90 -40 M 80 -96 L 110 -90 M 130 -130 L 120 -100 L 138 -80" stroke={PALETTE.deepBlue} strokeWidth={1.4} fill="none" vectorEffect="non-scaling-stroke" opacity={bombT} /> : null}
          </Building>
        </g>
      ),
    });
  }
  // Arsenal perimeter wall.
  if (f >= 1560 && f <= 1700) {
    out.push({
      key: "arsenal.wall",
      y: GATE[1],
      depth: 1,
      node: <Building p={p} kind="fortWall" x={ARSENAL.x0 - 30} y={GATE[1]} w={ARSENAL.w + 60} h={44} build={ramp(f, 1566, 1590)} fold={fold} opacity={1 - ramp(f, 1664, 1690)} id="s09-arsenal-wall" />,
    });
  }
  // Microphones on the balcony.
  if (f >= 1410 && f <= 1470) {
    out.push({ key: "mics", y: BALCONY[1] + 2, depth: 1, node: <g opacity={win(f, 1410, 1416, 1456, 1470)}><Microphones p={p} x={BALCONY[0]} y={BALCONY[1] + 2} s={0.8} lift={BALCONY_H} /></g> });
  }
  // Eva → broadcast ring (radio): concentric arcs leaving the balcony.
  const br = T.broadcast(f);
  if (br > 0.002) {
    const c = p.point(BALCONY[0] + 30, BALCONY[1], BALCONY_H + 60);
    const t = clamp01((f - 1442) / 32);
    out.push({
      key: "broadcast",
      y: BALCONY[1] + 3,
      depth: 1,
      node: (
        <g opacity={br} fill="none" stroke={PALETTE.skyBlue} strokeWidth={1.8}>
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={c[0]} cy={c[1]} r={(20 + (t + i * 0.33) * 220) * p.zoom * 0.5} opacity={1 - clamp01(t + i * 0.2)} />
          ))}
        </g>
      ),
    });
  }
  // Industrial smoke columns (1930s–1940s).
  if (f < 1520) {
    [-790, -700, -440].forEach((x, i) => {
      const base = p.point(x, FACADE_Y, 170 + (i === 2 ? -20 : 0));
      out.push({
        key: `smoke.${i}`,
        y: FACADE_Y - 1,
        depth: 1,
        node: (
          <g opacity={ramp(f, 1370, 1390) * (1 - ramp(f, 1500, 1520)) * (1 - fold)}>
            {[0, 1, 2].map((k) => {
              const t = ((f - 1362) / 40 + k * 0.33 + i * 0.2) % 1;
              return <ellipse key={k} cx={base[0] + t * 60 * p.zoom} cy={base[1] - t * 90 * p.zoom} rx={(12 + t * 20) * p.zoom} ry={(9 + t * 14) * p.zoom} fill={PALETTE.grayBluePale} opacity={Math.sin(t * Math.PI) * 0.8} />;
            })}
          </g>
        ),
      });
    });
  }
  // The 1946 crowd: arrives, answers, then disperses in the 1955 silence.
  const cr = T.crowd(f);
  if (cr > 0.002 && f < 1510) {
    out.push(
      ...crowdItems({
        key: "crowd1946",
        p,
        members: CROWD,
        look: {
          u: 6.4,
          tall: 9.6,
          shirts: [mixColor(PALETTE.grayBlue, PALETTE.skyBluePale, 0.35), PALETTE.paperWarm, mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.3), PALETTE.skyBluePale],
          placards: 0.9,
          flags: 0.8,
        },
        state: { presence: cr, excite: T.crowdExcite(f), withdraw: T.withdraw(f), rise: 1 - fold, opacity: 1 - ramp(f, 1492, 1510) },
        f,
      }),
    );
  }
  // Vehicles: an ERP truck toward the arsenal; Triple A sedans (dark, unmarked).
  if (f >= 1590 && f <= 1640) {
    const t = ramp(f, 1590, 1628);
    out.push({ key: "erp.truck", y: 2600, depth: 1, node: <g opacity={1 - ramp(f, 1630, 1640)}><Vehicle kind="truck" p={p} x={lerp(1700, 2100, t)} y={2600} scale={1} facing={1} dist={t * 400} tone={0.1} /></g> });
  }
  const aa = T.tripleA(f);
  if (aa > 0.002) {
    [0, 1].forEach((i) => {
      const t = ramp(f, 1684 + i * 4, 1716);
      out.push({ key: `aaa.sedan.${i}`, y: 2548 + i * 30, depth: 1, node: <g opacity={aa}><Vehicle kind="sedan" p={p} x={lerp(3300 - i * 120, 2500 - i * 120, t)} y={2548 + i * 30} scale={1} facing={-1} dist={t * 800} tone={0.05} /></g> });
    });
  }
  out.push(...actorItems(ctx, IDENTITY, [...workers, PERON, EVITA, ...students, ...montoneros, kidnapped, ...police, ...erp, ...guards, fgGuerrilla, ...tripleA]));
  // Victim / press node labels are world-anchored; see overlay.
  void standMatrix;
  return out;
};

/* ------------------------------------------------------------------ labels */

const Lockup: React.FC<{ id: string; date: string; lines: readonly string[]; o: number; enter: number; y?: number; size?: number }> = ({ id, date, lines, o, enter, y = 96, size = 96 }) => (
  <At x={168} y={y} id={id}>
    <DateText text={date} size={size} o={o} enter={enter} />
    <EventText lines={lines} o={o} enter={enter} tracking={0.14} />
  </At>
);

const Overlay: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const l30 = win(f, 1366, 1376, 1400, 1410);
  const l46 = win(f, 1408, 1416, 1456, 1464);
  const l55 = win(f, 1464, 1472, 1502, 1510);
  const l69 = win(f, 1508, 1516, 1596, 1606);
  const guer = win(f, 1514, 1524, 1598, 1606);
  const mc = win(f, 1606, 1614, 1648, 1656);
  const v76 = TRACKS_V2.labels.year1976(f);
  const my76 = f < 1722 ? 0.72 * ramp(f, 1708, 1722) : Math.max(0, 1 - 0.28 / Math.max(0.28, 1 - v76));
  return (
    <>
      <Lockup id="label.1930" date="1930" lines={["RUPTURA INSTITUCIONAL"]} o={l30} enter={ramp(f, 1366, 1376)} />
      <Lockup id="label.1946" date="1946 · PERONISMO" lines={["INDUSTRIA · TRABAJO · PERSONALISMO"]} o={l46} enter={ramp(f, 1408, 1418)} />
      <At x={1752} y={880} align="right" id="anthem.salud">
        <AnthemText lines={["¡AL GRAN PUEBLO ARGENTINO, SALUD!"]} o={win(f, 1418, 1426, 1454, 1462)} reveal={ramp(f, 1418, 1440)} align="right" size={42} />
      </At>
      <Lockup id="label.1955" date="1955–1969" lines={["PROSCRIPCIÓN · RESISTENCIA · INESTABILIDAD"]} o={l55} enter={ramp(f, 1464, 1474)} />
      <Lockup id="label.1969" date="1969–1976" lines={["RADICALIZACIÓN · GUERRILLA · VIOLENCIA POLÍTICA"]} o={l69} enter={ramp(f, 1508, 1518)} />
      <At x={168} y={846} id="label.guerrilla">
        <EventText lines={["MONTONEROS · ERP"]} o={guer} size={34} tracking={0.2} mt={0} />
        <EventText lines={["ORGANIZACIONES GUERRILLERAS REVOLUCIONARIAS"]} o={guer} size={20} tracking={0.18} mt={6} tone="soft" />
      </At>
      <At x={168} y={96} id="label.monteChingolo">
        <EventText lines={["BATALLÓN DEPÓSITO DE ARSENALES 601", "“DOMINGO VIEJOBUENO”"]} o={mc} size={30} tracking={0.12} mt={0} />
        <EventText lines={["MONTE CHINGOLO · 23 DIC 1975"]} o={mc} size={24} tracking={0.2} tone="soft" />
      </At>
      {my76 > 0.002 ? (
        <div style={{ position: "absolute", left: SCREEN_LOCKUPS.dictadura[0], top: SCREEN_LOCKUPS.dictadura[1], whiteSpace: "nowrap" }} data-id="film.label.1976">
          <HistoricalDate year="1976" opacity={my76} emphasis="minor" colorToken="deepBlueSoft" />
        </div>
      ) : null}
      {NODES.map((n) => {
        const o = n.kind === "press" ? win(f, 1432, 1442, 1486, 1500) : win(f, 1506, 1516, 1690, 1712);
        return <MapLabel key={n.id} camera={camera} anchor={nodePos(n, f)} lines={[n.label]} o={0.85 * o} size={13} tone="deep" dy={n.kind === "press" ? -52 : 24} tracking={0.2} />;
      })}
      <MapLabel camera={camera} anchor={[1210, 2930]} lines={["MONTONEROS"]} o={0.9 * win(f, 1508, 1516, 1560, 1576)} size={15} tone="deep" tracking={0.25} />
      <MapLabel camera={camera} anchor={[1620, 2980]} lines={["ERP"]} o={0.9 * win(f, 1550, 1558, 1620, 1632)} size={15} tone="deep" tracking={0.25} />
      <MapLabel camera={camera} anchor={[900, 2600]} lines={["PROTESTA CÍVICA"]} o={0.8 * win(f, 1506, 1514, 1552, 1566)} size={13} tone="sky" tracking={0.2} />
      <MapLabel camera={camera} anchor={[720, 2382]} lines={["PROSCRIPCIÓN"]} o={0.9 * win(f, 1468, 1478, 1520, 1540)} size={14} tone="deep" tracking={0.25} />
      <MapLabel camera={camera} anchor={[2760, 2664]} lines={["TRIPLE A", "VIOLENCIA PARAESTATAL · ILEGAL"]} o={0.95 * T.tripleA(f)} size={15} tone="deep" tracking={0.2} />
      <MapLabel camera={camera} anchor={[2800, NORTH_CURB - 20]} lines={["FUERZAS ARMADAS · OPERATIVO INDEPENDENCIA", "TUCUMÁN · 1975 · POR DECRETO"]} o={0.9 * win(f, 1694, 1702, 1716, 1728)} size={13} tone="soft" tracking={0.16} />
    </>
  );
};

export const STAGES_09: readonly FilmStage[] = [{ id: "s09", from: 1360, to: 1740, Ground: PoliticalGround, items, Overlay }];

/* ------------------------------------------------------------- memory line */

const civicX = (i: number, x0: number) => {
  const k = Math.min(i, 68) / 68;
  return x0 + k * (3760 - x0);
};
/** Same topology as V2's civicTimeline, extended west to the port rail. */
const CIVIC_09: readonly Point[] = Array.from({ length: 96 }, (_, i) => [civicX(i, -3650), MED] as Point);
const sx = (x: number) => clamp01(((x + 3650) / (3760 + 3650)) * (68 / 95));

export const ERA_09: LineEra = {
  id: "civicTimeline",
  from: 1362,
  to: 1721,
  evaluate: (f) => {
    const base = CIVIC_09;
    // Final join with V2's civic timeline (late, off-screen west end).
    const j = f >= 1700 ? Math.pow(ramp(f, 1700, 1722), 3) : 0;
    const pts = j > 0 ? interpolatePoints(CIVIC_09, MEMORY_LINE_STATES.civicTimeline, j) : base;
    const end = sx(T.lead(f));
    const start = f < 1700 ? sx(lerp(-3650, -1400, ramp(f, 1380, 1440))) : 0;
    const color = mixColor(PALETTE.deepBlueSoft, PALETTE.skyBlue, 1 - ramp(f, 1600, 1700));
    const cuts: [number, number, number][] = [
      [-630, -560, ramp(f, 1382, 1388) * (1 - ramp(f, 1600, 1700))],
      [990, 1060, ramp(f, 1462, 1468) * (1 - ramp(f, 1600, 1700))],
      [2130, 2320, ramp(f, 1632, 1638) * (1 - ramp(f, 1690, 1716))],
    ];
    // The front page lies over the avenue: the line passes beneath it.
    const pg = T.page(f) * (1 - T.pageOut(f));
    if (pg > 0.01) {
      cuts[2] = [PAGE.x - 20, PAGE.x + PAGE.w + 20, Math.max(cuts[2][2], pg)];
    }
    const ranges = [];
    let a = start;
    for (const [x0, x1, g] of cuts) {
      const s0 = sx(x0);
      const s1 = sx(x1);
      const half = ((s1 - s0) * (1 - g)) / 2;
      if (g > 0.01 && s0 > a && s1 < end) {
        ranges.push({ start: a, end: s0 + half, opacity: 0.9, color });
        a = s1 - half;
      }
    }
    ranges.push({ start: a, end, opacity: f >= 1700 ? lerp(0.9, 0.78, ramp(f, 1700, 1722)) : 0.9, color });
    const v2Color = PALETTE.deepBlueSoft;
    if (f >= 1714) {
      for (const r of ranges) {
        r.color = mixColor(r.color, v2Color, ramp(f, 1714, 1722));
      }
    }
    return { points: pts, ranges, head: null, core: [] };
  },
};
