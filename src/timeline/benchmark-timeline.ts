import {
  clamp01,
  lerp,
  smoothTrack,
  track,
  type Key,
} from "../animation/interpolate-clamped";
import { IDX, OCEANIC_RANGE, s } from "../paths/memory-line-states";
import { mixColor, PALETTE } from "../theme/palette";
import { frameRange, isInRange } from "../types/branded-frames";
import type { VisibleRange } from "../types/paths";
import type { MicroBlock, SceneSpec } from "../types/scene";
import { BENCHMARK_AUDIO_ANCHORS } from "./audio-anchors";
import { LABEL_CUES } from "./labels";

export const BENCHMARK = {
  id: "Benchmark-1722-2171",
  globalStart: 1722,
  globalEnd: 2171,
  durationInFrames: 450,
  audioTrimBefore: 1722,
  audioTrimAfter: 2172,
} as const;

if (
  BENCHMARK.globalEnd - BENCHMARK.globalStart + 1 !==
  BENCHMARK.durationInFrames
) {
  throw new Error("Benchmark range and duration disagree");
}

/** Micro-blocks A–N (§8.3), global and inclusive. */
export const MICRO_BLOCKS: readonly MicroBlock[] = [
  {
    id: "A",
    range: frameRange(1722, 1751),
    role: "Control militar ocupa instituciones",
  },
  {
    id: "B",
    range: frameRange(1752, 1791),
    role: "Cierre de red cívica; lockup",
  },
  { id: "C", range: frameRange(1792, 1811), role: "Censura e intercepción" },
  {
    id: "D",
    range: frameRange(1812, 1841),
    role: "Represión y ausencia bajo control institucional",
  },
  {
    id: "E",
    range: frameRange(1842, 1871),
    role: "Daño sostenido; espacio público vacío",
  },
  {
    id: "F",
    range: frameRange(1872, 1907),
    role: "Rectángulo superviviente → seed de cancha",
  },
  {
    id: "G",
    range: frameRange(1908, 1937),
    role: "Nace el estadio dentro del atlas herido",
  },
  {
    id: "H",
    range: frameRange(1938, 1973),
    role: "1978 y celebración pública",
  },
  {
    id: "I",
    range: frameRange(1974, 2015),
    role: "Acción deportiva contenida",
  },
  { id: "J", range: frameRange(2016, 2046), role: "Trofeo y gold restringido" },
  {
    id: "K",
    range: frameRange(2047, 2084),
    role: "Pullback: estadio → elipse / isobar",
  },
  { id: "L", range: frameRange(2085, 2114), role: "Anchor Atlántico Sur" },
  { id: "M", range: frameRange(2115, 2144), role: "Viaje cartográfico" },
  { id: "N", range: frameRange(2145, 2171), role: "Entrada a Malvinas" },
];

const PALETTE_BENCHMARK = {
  paper: PALETTE.paperCool,
  primary: PALETTE.skyBlue,
  structural: PALETTE.deepBlueSoft,
  subdued: PALETTE.grayBlue,
  gold: PALETTE.goldMuted,
  goldAllowed: false,
  saturation: 0.35,
};

/** Scene records: data only. Components never learn scene numbers. */
export const BENCHMARK_SCENES: readonly SceneSpec[] = [
  {
    id: "scene10.dictadura",
    range: frameRange(1722, 1907),
    cameraPathId: "camera.benchmark.1722-2171",
    paletteCues: [
      { frame: frameRange(1722, 1722).start, value: PALETTE_BENCHMARK },
    ],
    labels: [LABEL_CUES.year1976, LABEL_CUES.dictaduraLockup],
    pathCues: [
      {
        frame: 1722,
        mode: "civicTimeline",
        geometryId: "civicTimeline",
        visibleRanges: [[0, 1]],
        strokeToken: "deepBlueSoft",
        opacity: 0.78,
        morphEase: "institutionalLock",
      },
      {
        frame: 1811,
        mode: "woundedTimeline",
        geometryId: "woundedTimeline",
        visibleRanges: [
          [0, 0.27],
          [0.33, 0.565],
          [0.62, 1],
        ],
        strokeToken: "deepBlueSoft",
        opacity: 0.62,
        morphEase: "institutionalLock",
      },
    ],
    historicalLayers: [
      {
        id: "city.inherited",
        range: frameRange(1722, 2114),
        opacity: 0.62,
        parallaxLayer: 20,
        state: "controlled",
      },
      {
        id: "control.militaryControl",
        range: frameRange(1722, 2171),
        opacity: 0.58,
        parallaxLayer: 30,
        state: "controlled",
      },
      {
        id: "censorship",
        range: frameRange(1776, 2114),
        opacity: 0.82,
        parallaxLayer: 30,
        state: "censored",
      },
      {
        id: "missingNodes",
        range: frameRange(1722, 2171),
        opacity: 0.3,
        parallaxLayer: 30,
        state: "missing",
      },
    ],
    transitions: [
      {
        id: "bridge.institutional-to-pitch",
        range: frameRange(1872, 1937),
        fromGeometry: "controlledRectangle",
        toGeometry: "pitch1978",
        progressEase: "institutionalLock",
        preserveIds: ["memoryLine.main", "atlas.grid.main", "paper.world"],
      },
    ],
    audioAnchors: BENCHMARK_AUDIO_ANCHORS.filter((a) => a.frame <= 1907),
  },
  {
    id: "scene11.worldCup1978",
    range: frameRange(1908, 2084),
    cameraPathId: "camera.benchmark.1722-2171",
    paletteCues: [
      {
        frame: frameRange(1908, 1908).start,
        value: { ...PALETTE_BENCHMARK, goldAllowed: true },
      },
    ],
    labels: [LABEL_CUES.year1978, LABEL_CUES.anthem1978],
    pathCues: [
      {
        frame: 1956,
        mode: "stadiumBoundary",
        geometryId: "stadiumBoundary",
        visibleRanges: [
          [0, 0.27],
          [0.62, 1],
        ],
        strokeToken: "skyBlue",
        opacity: 0.92,
        morphEase: "ceremonial",
      },
    ],
    historicalLayers: [
      {
        id: "control.militaryControl",
        range: frameRange(1908, 2084),
        opacity: 0.28,
        parallaxLayer: 30,
        state: "context-only",
      },
    ],
    transitions: [
      {
        id: "bridge.stadium-to-isobar",
        range: frameRange(2047, 2098),
        fromGeometry: "stadiumBoundary",
        toGeometry: "southAtlanticIsobar",
        progressEase: "atlasDrift",
        preserveIds: ["memoryLine.main", "atlas.grid.main", "paper.world"],
      },
    ],
    audioAnchors: BENCHMARK_AUDIO_ANCHORS.filter(
      (a) => a.frame >= 1908 && a.frame <= 2084,
    ),
  },
  {
    id: "scene12.southAtlanticEntry",
    range: frameRange(2085, 2171),
    cameraPathId: "camera.benchmark.1722-2171",
    paletteCues: [
      { frame: frameRange(2085, 2085).start, value: PALETTE_BENCHMARK },
    ],
    labels: [LABEL_CUES.oceano, LABEL_CUES.year1982],
    pathCues: [
      {
        frame: 2098,
        mode: "southAtlanticIsobar",
        geometryId: "southAtlanticIsobar",
        visibleRanges: [[0.62, 1]],
        strokeToken: "skyBlue",
        opacity: 0.9,
        morphEase: "atlasDrift",
      },
      {
        frame: 2144,
        mode: "southAtlanticRoute",
        geometryId: "southAtlanticRoute",
        visibleRanges: [[0.62, 1]],
        strokeToken: "skyBlue",
        opacity: 0.9,
        morphEase: "atlasDrift",
      },
    ],
    historicalLayers: [
      {
        id: "control.militaryControl",
        range: frameRange(2085, 2171),
        opacity: 0.06,
        parallaxLayer: 30,
        state: "context-only",
      },
    ],
    transitions: [],
    audioAnchors: BENCHMARK_AUDIO_ANCHORS.filter((a) => a.frame >= 2085),
  },
];

export const blockAt = (f: number) =>
  MICRO_BLOCKS.find((b) => isInRange(f, b.range))?.id ?? "—";
export const sceneAt = (f: number) =>
  BENCHMARK_SCENES.find((sc) => isInRange(f, sc.range))?.id ?? "—";

/* ====================================================================== */
/* Per-frame evaluation. Everything is an absolute function of the global  */
/* frame; nothing accumulates between frames (§8.1).                       */
/* ====================================================================== */

const K = (keys: readonly Key[]) => (f: number) => track(f, keys);

/** Opacity/position tracks, grouped by the object they drive. */
export const TRACKS = {
  grid: {
    controlMix: K([
      [1722, 0],
      [1760, 0.6],
      [1811, 1],
    ]),
    opacity: K([
      [1722, 0.12],
      [1811, 0.17],
      [1908, 0.15],
      [2047, 0.15],
      [2110, 0.15],
      [2171, 0.12],
    ]),
    oceanColor: K([
      [2047, 0, "atlasDrift"],
      [2110, 1],
    ]),
    oceanProgress: (f: number) =>
      smoothTrack(f, [
        [2047, 0],
        [2084, 0.5],
        [2112, 1],
      ]),
    pitchGapClose: K([
      [2062, 0, "atlasDrift"],
      [2102, 1],
    ]),
    ringGapClose: K([
      [2060, 0, "atlasDrift"],
      [2106, 1],
    ]),
    stadiumMask: K([
      [1908, 0, "ceremonial"],
      [1950, 1],
      [2047, 1, "atlasDrift"],
      [2084, 0],
    ]),
  },
  city: {
    opacity: K([
      [1722, 0.62],
      [1752, 0.56],
      [1791, 0.5],
      [1812, 0.5, "atlasDrift"],
      [1841, 0.36],
      [1871, 0.3],
      [1907, 0.26],
      [1937, 0.22],
      [2047, 0.22, "atlasDrift"],
      [2084, 0.1],
      [2110, 0.05],
    ]),
    previousRoutes: K([
      [1722, 0.22],
      [1791, 0.18],
      [1812, 0.18, "atlasDrift"],
      [1834, 0.08],
      [1871, 0.05],
    ]),
    figures: K([
      [1722, 0.16],
      [1812, 0.14, "atlasDrift"],
      [1841, 0.06],
    ]),
    figuresWithdraw: K([
      [1812, 0, "atlasDrift"],
      [1841, 1],
    ]),
  },
  control: {
    opacity: K([
      [1722, 0.2],
      [1751, 0.48],
      [1791, 0.55],
      [1812, 0.58],
      [1871, 0.58],
      [1907, 0.45],
      [1937, 0.3],
      [2047, 0.28, "atlasDrift"],
      [2084, 0.14],
      [2115, 0.07],
      [2171, 0.06],
    ]),
    scan: K([
      [1792, 0],
      [1804, 0.34],
      [1871, 0.34],
      [1907, 0.14],
      [2047, 0.1],
      [2080, 0],
    ]),
    censor: K([
      [1722, 0.86],
      [1907, 0.8],
      [1937, 0.55],
      [2047, 0.5, "atlasDrift"],
      [2084, 0.2],
      [2110, 0.08],
    ]),
    repressionResidual: K([
      [1841, 0.16],
      [1907, 0.12],
      [2047, 0.1],
      [2084, 0.04],
    ]),
  },
  nodes: {
    opacity: K([
      [1722, 0.8],
      [1811, 0.62],
      [1871, 0.46],
      [1937, 0.3],
      [2047, 0.26],
      [2084, 0.1],
    ]),
    rings: K([
      [1722, 0.3],
      [2047, 0.3],
      [2110, 0.22],
    ]),
  },
  memory: {
    m1: K([
      [1752, 0, "institutionalLock"],
      [1791, 0.45, "institutionalLock"],
      [1811, 1],
    ]),
    m2: K([
      [1872, 0, "institutionalLock"],
      [1907, 1],
    ]),
    // Stadium → isobar (§8.14/§8.15): 0.55 at 2084, complete at 2098. A short
    // plateau around the 2084/2085 boundary keeps the line still (< 3 px)
    // while the ellipse is ambiguous; the semantic change completes after it.
    m3: (f: number) =>
      smoothTrack(f, [
        [2047, 0],
        [2080, 0.52],
        [2084, 0.55],
        [2086, 0.553],
        [2098, 1],
      ]),
    m4: K([
      [2115, 0, "atlasDrift"],
      [2144, 1],
    ]),
    a1: K([
      [1752, 0.3, "institutionalLock"],
      [1791, 0.285, "institutionalLock"],
      [1811, 0.27],
    ]),
    b2: K([
      [1752, 0.3, "institutionalLock"],
      [1791, 0.315, "institutionalLock"],
      [1811, 0.33],
    ]),
    a2: K([
      [1752, 0.61, "institutionalLock"],
      [1791, 0.595, "institutionalLock"],
      [1811, 0.565],
    ]),
    b3: K([
      [1752, 0.61, "institutionalLock"],
      [1791, 0.62, "institutionalLock"],
      [1811, 0.62],
    ]),
    stadiumDraw: (f: number) =>
      smoothTrack(
        f,
        [
          [1907, 0],
          [1937, 0.45],
          [1956, 1],
        ],
        "secant",
      ),
    tailOpacity: K([
      [1722, 0.78],
      [1751, 0.66],
      [1811, 0.62],
      [1842, 0.62],
      [1871, 0.54],
      [1907, 0.46],
      [1937, 0.42],
      [2047, 0.4],
      [2084, 0.34],
    ]),
    centralOpacity: K([
      [1722, 0.78],
      [1751, 0.66],
      [1811, 0.62, "ceremonial"],
      [1824, 0],
    ]),
    survivorOpacity: K([
      [1722, 0.78],
      [1751, 0.66],
      [1811, 0.62],
      [1842, 0.62],
      [1871, 0.54],
      [1885, 0.54, "ceremonial"],
      [1920, 0.92],
      [2085, 0.92],
      [2171, 0.88],
    ]),
    survivorSky: K([
      [1885, 0, "ceremonial"],
      [1920, 1],
    ]),
    coolness: K([
      [2084, 0, "atlasDrift"],
      [2171, 0.22],
    ]),
    woundedGray: K([
      [1811, 0],
      [1871, 0.25],
    ]),
    pulse: (f: number) =>
      f >= 1974 && f <= 2015
        ? 0.06 *
          Math.sin(((f - 1974) / 14) * Math.PI * 2) *
          Math.sin(((f - 1974) / 41) * Math.PI)
        : 0,
    head: (f: number) =>
      smoothTrack(
        f,
        [
          [2115, 0.08],
          [2144, 0.32],
          [2171, 0.48],
        ],
        "secant",
      ),
    dashGap: K([
      [2115, 0, "atlasDrift"],
      [2132, 1],
    ]),
    headMarker: K([
      [2115, 0],
      [2127, 1],
    ]),
  },
  pitch: {
    seedRegularity: K([
      [1842, 0, "institutionalLock"],
      [1871, 1],
    ]),
    seedOpacity: K([
      [1722, 0.14],
      [1842, 0.14],
      [1871, 0.28],
      [1907, 0.46],
      [1920, 0.55],
      [1974, 0.62],
    ]),
    guide: (f: number) =>
      f >= 1908
        ? 1
        : track(f, [
            [1872, 0, "institutionalLock"],
            [1907, 0.92],
          ]),
    construction: K([
      [1907, 0, "ceremonial"],
      [1931, 1],
    ]),
    lineTone: K([
      [1872, 0, "institutionalLock"],
      [1920, 1],
    ]),
    fill: K([
      [1842, 0],
      [1872, 0.08],
      [1907, 0.3],
      [1908, 0.36],
      [1937, 0.52],
      [2016, 0.52],
      [2047, 0.45, "atlasDrift"],
      [2084, 0.08],
      [2100, 0],
    ]),
    fillSaturation: K([
      [1938, 0],
      [2016, 0.35],
      [2047, 0.35],
      [2084, 0],
    ]),
    residual: K([
      [2084, 1, "atlasDrift"],
      [2104, 0.08],
    ]),
    fade: {
      touch: K([
        [2050, 1, "atlasDrift"],
        [2078, 0.22],
      ]),
      goal: K([
        [2056, 1, "atlasDrift"],
        [2082, 0.22],
      ]),
      halfway: K([
        [2062, 1, "atlasDrift"],
        [2090, 0.22],
      ]),
      box: K([
        [2047, 1, "atlasDrift"],
        [2070, 0.22],
      ]),
      goalArea: K([
        [2047, 1, "atlasDrift"],
        [2066, 0.22],
      ]),
    },
  },
  bowl: {
    morph: K([
      [1907, 0, "ceremonial"],
      [1949, 1],
    ]),
    opacity: K([
      [1722, 0.12],
      [1908, 0.14],
      [1937, 0.4],
      [2016, 0.5],
      [2047, 0.5],
      [2098, 0.36],
      [2171, 0.3],
    ]),
    tone: K([
      [1907, 0, "ceremonial"],
      [1936, 1],
    ]),
    isobarTone: K([
      [2060, 0, "atlasDrift"],
      [2098, 1],
    ]),
  },
  crowd: {
    intensity: K([
      [1908, 0],
      [1915, 0.1],
      [1937, 0.22],
      [1973, 0.42],
      [2016, 0.56],
      [2046, 0.56],
      [2084, 0.36],
      [2108, 0.3],
    ]),
    wave: K([
      [1938, 0],
      [1974, 0.25],
      [2016, 0.35],
      [2040, 0.15],
      [2047, 0],
    ]),
    wind: (f: number) =>
      smoothTrack(f, [
        [2047, 0],
        [2084, 0.6],
        [2108, 1],
      ]),
  },
  trophy: {
    ghost: K([
      [1974, 0],
      [1990, 0.08],
      [2016, 0.08],
      [2020, 0],
    ]),
    axisDraw: K([
      [2015, 0, "ceremonial"],
      [2021, 1],
    ]),
    bodyDraw: K([
      [2019, 0, "ceremonial"],
      [2031, 1],
    ]),
    fill: K([
      [2026, 0],
      [2036, 0.82],
      [2046, 0.82, "atlasDrift"],
      [2064, 0],
    ]),
    gold: K([
      [2016, 1],
      [2046, 1, "atlasDrift"],
      [2068, 0],
    ]),
    ringRadius: K([
      [2015, 6, "restrainedImpact"],
      [2030, 62],
    ]),
    ringOpacity: K([
      [2015, 0],
      [2016, 0.9],
      [2021, 0.9, "atlasDrift"],
      [2033, 0],
    ]),
    axisExtend: K([
      [2050, 0, "atlasDrift"],
      [2092, 1],
    ]),
    axisOpacity: K([
      [2016, 0.55],
      [2046, 0.55],
      [2110, 0.2],
    ]),
  },
  ball: {
    guide: K([
      [1950, 0],
      [1962, 0.26],
      [2016, 0.26],
      [2030, 0],
    ]),
    progress: K([
      [1974, 0, "atlasDrift"],
      [1998, 0.35],
      [2015, 1],
    ]),
    route: K([
      [1974, 0.8],
      [2030, 0.8, "atlasDrift"],
      [2060, 0],
    ]),
  },
  ocean: {
    coastDraw: K([
      [2058, 0, "atlasDrift"],
      [2110, 1],
    ]),
    coastOpacity: K([
      [2058, 0.5],
      [2171, 0.56],
    ]),
    isobarsDraw: K([
      [2084, 0, "ceremonial"],
      [2131, 1],
    ]),
    wind: K([
      [2095, 0],
      [2126, 0.3],
    ]),
    islandsHatch: K([
      [2145, 0, "atlasDrift"],
      [2171, 0.28],
    ]),
    islandsOutline: K([
      [2150, 0, "atlasDrift"],
      [2171, 0.2],
    ]),
    navalGuide: K([
      [2120, 0, "atlasDrift"],
      [2171, 0.55],
    ]),
    oceanLabel: K([
      [2084, 0, "ceremonial"],
      [2099, 0.42],
    ]),
  },
  labels: {
    year1976: K([
      [1730, 0, "ceremonial"],
      [1742, 0.72],
      [1760, 0.72],
      [1770, 0],
    ]),
    lockup: K([
      [1760, 0, "ceremonial"],
      [1774, 0.92],
      [1850, 0.92, "atlasDrift"],
      [1871, 0.15],
      [1891, 0],
    ]),
    lockupTracking: K([
      [1850, 0],
      [1871, 2],
    ]),
    year1978: K([
      [1928, 0],
      [1937, 0.35],
      [1938, 0.35, "ceremonial"],
      [1950, 1],
      [2047, 1, "atlasDrift"],
      [2066, 0],
    ]),
    campeon: K([
      [1950, 0, "ceremonial"],
      [1966, 1],
      [2050, 1, "atlasDrift"],
      [2068, 0],
    ]),
    anthemLine1: K([
      [1988, 0, "ceremonial"],
      [1998, 1],
    ]),
    anthemLine2: K([
      [1998, 0, "ceremonial"],
      [2010, 1],
    ]),
    anthemOpacity: K([
      [1988, 1],
      [2047, 1, "atlasDrift"],
      [2066, 0],
    ]),
    year1982: K([
      [2138, 0],
      [2144, 0.18],
      [2145, 0.18, "ceremonial"],
      [2155, 0.9],
    ]),
    guerra: K([
      [2154, 0, "ceremonial"],
      [2168, 0.82],
    ]),
  },
} as const;

/* ------------------------------------------------------------ memory line */

export interface MemoryLineFrame {
  morph: { m1: number; m2: number; m3: number; m4: number };
  ranges: VisibleRange[];
  head: { s: number; opacity: number } | null;
}

const DASH_ON = 12;
const DASH_GAP = 9;

export const evaluateMemoryLine = (f: number): MemoryLineFrame => {
  const T = TRACKS.memory;
  const wounded = mixColor(
    PALETTE.deepBlueSoft,
    PALETTE.grayBlue,
    T.woundedGray(f),
  );
  const survivorBase = mixColor(wounded, PALETTE.skyBlue, T.survivorSky(f));
  const survivorColor = mixColor(survivorBase, PALETTE.grayBlue, T.coolness(f));
  const survivorOpacity = clamp01(T.survivorOpacity(f) + T.pulse(f));

  // Before the stadium draw starts, the survivor ends at the last spread civic
  // sample; the stacked samples beyond it only unfold after 1908.
  const e3 =
    f < 1908
      ? s(IDX.civicSpreadEnd)
      : lerp(s(IDX.civicSpreadEnd), 1, T.stadiumDraw(f));

  const ranges: VisibleRange[] = [
    { start: 0, end: T.a1(f), opacity: T.tailOpacity(f), color: wounded },
    {
      start: T.b2(f),
      end: T.a2(f),
      opacity: T.centralOpacity(f),
      color: wounded,
    },
  ];

  let head: MemoryLineFrame["head"] = null;
  if (f >= 2115) {
    const sh = lerp(OCEANIC_RANGE[0], OCEANIC_RANGE[1], T.head(f));
    const g = T.dashGap(f);
    ranges.push({
      start: T.b3(f),
      end: sh,
      opacity: survivorOpacity,
      color: survivorColor,
    });
    const dash = g > 0.001 ? ([DASH_ON, DASH_GAP * g] as const) : undefined;
    // Ahead of the head: the planned course toward the islands.
    ranges.push({
      start: sh,
      end: OCEANIC_RANGE[1],
      opacity: survivorOpacity * lerp(1, 0.62, g),
      color: survivorColor,
      dash,
    });
    // Beyond the course: the rest of the isobar recedes to a faint contour.
    ranges.push({
      start: OCEANIC_RANGE[1],
      end: e3,
      opacity: survivorOpacity * lerp(1, 0.2, g),
      color: survivorColor,
      dash,
    });
    head = { s: sh, opacity: T.headMarker(f) * survivorOpacity };
  } else {
    ranges.push({
      start: T.b3(f),
      end: e3,
      opacity: survivorOpacity,
      color: survivorColor,
    });
  }

  return {
    morph: { m1: T.m1(f), m2: T.m2(f), m3: T.m3(f), m4: T.m4(f) },
    ranges,
    head,
  };
};
