import { smoothTrack, track, type Key } from "../animation/interpolate-clamped";
import { frameRange } from "../types/branded-frames";
import type { MicroBlock } from "../types/scene";

/**
 * Benchmark V2 timeline. Same window, same audio and the same mandatory
 * anchors as V1 (1722, 1812, 1908, 2016, 2085, 2171); only the visual
 * direction is rebuilt. Everything is an absolute function of the global
 * frame (§8.1). The memory line reuses V1's state machine unchanged.
 */
export const BENCHMARK_V2 = {
  id: "Benchmark-V2-1722-2171",
  globalStart: 1722,
  globalEnd: 2171,
  durationInFrames: 450,
  audioTrimBefore: 1722,
  audioTrimAfter: 2172,
} as const;

if (BENCHMARK_V2.globalEnd - BENCHMARK_V2.globalStart + 1 !== BENCHMARK_V2.durationInFrames) {
  throw new Error("Benchmark V2 range and duration disagree");
}

/** V2 shot list mapped on the locked micro-blocks (§8.3). */
export const SHOTS_V2: readonly MicroBlock[] = [
  { id: "A", range: frameRange(1722, 1751), role: "Lateral track: columna y vehículos ocupan la avenida" },
  { id: "B", range: frameRange(1752, 1791), role: "Push-in: la columna se abre, Videla ordena; línea antidisturbios corta la avenida" },
  { id: "C", range: frameRange(1792, 1811), role: "Censura (kiosco, radio); Videla absorbido por barras de control" },
  { id: "D", range: frameRange(1812, 1841), role: "Represión y ausencia: nodos removidos, anillos vacíos, sedán oscuro" },
  { id: "E", range: frameRange(1842, 1871), role: "Pullback: calle vacía, vigilancia, humo → rayado" },
  { id: "F", range: frameRange(1872, 1907), role: "Rise-overhead: fachadas se pliegan en plano; fachada institucional → celda de cancha" },
  { id: "G", range: frameRange(1908, 1937), role: "Cancha nace; calles → anillos; jugadores surgen de nodos" },
  { id: "H", range: frameRange(1938, 1973), role: "Descend-scale: tribunas se elevan, multitud llena, pases" },
  { id: "I", range: frameRange(1974, 2015), role: "Follow: ataque, gambeta, remate" },
  { id: "J", range: frameRange(2016, 2046), role: "Gol, celebración, papelitos, trofeo contenido" },
  { id: "K", range: frameRange(2047, 2084), role: "Rise + pullback: tribunas → elipse; multitud → viento" },
  { id: "L", range: frameRange(2085, 2114), role: "Atlántico Sur: isobaras, costa, viento" },
  { id: "M", range: frameRange(2115, 2144), role: "Viaje sureste; islas emergen" },
  { id: "N", range: frameRange(2145, 2171), role: "Descend-scale a Malvinas: relieve, viento, soldados" },
];

export const shotAt = (f: number) =>
  SHOTS_V2.find((b) => f >= b.range.start && f <= b.range.end)?.id ?? "—";

const K = (keys: readonly Key[]) => (f: number) => track(f, keys);

export const TRACKS_V2 = {
  city: {
    /** Ordinary façades fold flat as the camera rises (plan emerges). */
    fold: K([
      [1866, 0, "institutionalLock"],
      [1902, 1],
    ]),
    /** The institution folds a little later and lands exactly on the pitch cell. */
    institutionFold: K([
      [1872, 0, "institutionalLock"],
      [1906, 1],
    ]),
    /** Module height 150 → 90: the elevation grid regularizes into the pitch cell. */
    institutionModule: K([
      [1872, 150, "institutionalLock"],
      [1906, 90],
    ]),
    detail: K([
      [1860, 1, "atlasDrift"],
      [1898, 0.12],
      [1930, 0],
    ]),
    mass: K([
      [1722, 1],
      [1868, 1, "atlasDrift"],
      [1904, 0.42],
      [1950, 0.2],
      [2050, 0.16, "atlasDrift"],
      [2092, 0],
    ]),
    institutionMass: K([
      [1722, 1],
      [1880, 1, "atlasDrift"],
      [1906, 0.2],
      [1914, 0],
    ]),
    institutionLines: K([
      [1722, 1],
      [1906, 1],
      [1909, 0],
    ]),
    tone: K([
      [1722, 0.2],
      [1812, 0.26, "atlasDrift"],
      [1871, 0.34],
      [1904, 0.42],
    ]),
    control: K([
      [1752, 0, "institutionalLock"],
      [1796, 1],
    ]),
    street: K([
      [1722, 0.8],
      [1880, 0.8, "atlasDrift"],
      [1920, 0.42],
      [2050, 0.34, "atlasDrift"],
      [2092, 0.06],
    ]),
  },
  control: {
    /** Rigid bars rise along the institution kerb, then fold into grid lines. */
    bars: K([
      [1786, 0, "institutionalLock"],
      [1808, 1],
    ]),
    barsOpacity: K([
      [1786, 0.85],
      [1871, 0.85, "atlasDrift"],
      [1906, 0.45],
      [2050, 0.3, "atlasDrift"],
      [2092, 0.06],
    ]),
    barrier: K([
      [1768, 0, "institutionalLock"],
      [1792, 1],
    ]),
    scan: K([
      [1812, 0],
      [1822, 0.4],
      [1868, 0.4, "atlasDrift"],
      [1890, 0],
    ]),
    brackets: K([
      [1796, 0, "institutionalLock"],
      [1810, 1],
      [1868, 1, "atlasDrift"],
      [1896, 0],
    ]),
  },
  censor: {
    kiosk: K([
      [1792, 0, "institutionalLock"],
      [1810, 1],
    ]),
    waves: K([
      [1722, 1],
      [1794, 1, "institutionalLock"],
      [1812, 0],
    ]),
  },
  nodes: {
    opacity: K([
      [1722, 0.9],
      [1811, 0.7],
      [1871, 0.5],
      [1910, 0.3],
      [2047, 0.26],
      [2090, 0.06],
    ]),
    rings: K([
      [1722, 0.42],
      [2047, 0.42, "atlasDrift"],
      [2100, 0.14],
    ]),
  },
  smoke: {
    strength: K([
      [1788, 0, "ceremonial"],
      [1800, 0.85],
      [1846, 0.6, "atlasDrift"],
      [1872, 0],
    ]),
  },
  papers: K([
    [1722, 1],
    [1850, 1, "atlasDrift"],
    [1880, 0],
  ]),
  pitch: {
    guide: (f: number) =>
      f >= 1908
        ? 1
        : track(f, [
            [1890, 0, "institutionalLock"],
            [1907, 0.92],
          ]),
    construction: K([
      [1907, 0, "ceremonial"],
      [1931, 1],
    ]),
    lineOpacity: K([
      [1886, 0],
      [1906, 0.7],
      [1936, 0.8],
      [2050, 0.8, "atlasDrift"],
      [2092, 0.12],
      [2110, 0],
    ]),
    fill: K([
      [1900, 0],
      [1912, 0.4],
      [1940, 0.72],
      [2046, 0.72, "atlasDrift"],
      [2084, 0.08],
      [2100, 0],
    ]),
    fillSaturation: K([
      [1930, 0],
      [2016, 0.5],
      [2046, 0.5],
      [2084, 0],
    ]),
  },
  bowl: {
    /** Street kerbs → closed rings (flat), then rings rise as tiers. */
    ringMorph: K([
      [1896, 0, "ceremonial"],
      [1934, 1],
    ]),
    build: K([
      [1928, 0, "ceremonial"],
      [1966, 1],
    ]),
    /** Tiers lie flat again as the camera rises (plus the camera's own fold). */
    unbuild: K([
      [2048, 0, "atlasDrift"],
      [2080, 1],
    ]),
    opacity: K([
      [1896, 0.3],
      [1936, 0.9],
      [2060, 0.9, "atlasDrift"],
      [2098, 0.5],
      [2171, 0.34],
    ]),
  },
  crowd: {
    fill: K([
      [1934, 0],
      [1972, 0.8],
      [2000, 0.9],
      [2016, 1],
    ]),
    excite: K([
      [1938, 0.1],
      [2012, 0.3],
      [2016, 1, "ceremonial"],
      [2040, 0.85, "atlasDrift"],
      [2056, 0.2],
    ]),
    wind: (f: number) =>
      smoothTrack(f, [
        [2050, 0],
        [2084, 0.62],
        [2108, 1],
      ]),
    windOpacity: K([
      [2084, 1, "atlasDrift"],
      [2130, 0.35],
    ]),
  },
  flags: K([
    [1944, 0, "ceremonial"],
    [1972, 1],
    [2050, 1, "atlasDrift"],
    [2074, 0],
  ]),
  papelitos: K([
    [2016, 0],
    [2020, 1],
    [2054, 1, "atlasDrift"],
    [2072, 0],
  ]),
  trophy: {
    ringRadius: K([
      [2015, 6, "restrainedImpact"],
      [2031, 70],
    ]),
    ringOpacity: K([
      [2015, 0],
      [2016, 0.9],
      [2022, 0.9, "atlasDrift"],
      [2034, 0],
    ]),
    gold: K([
      [2026, 0],
      [2036, 1],
      [2050, 1, "atlasDrift"],
      [2068, 0],
    ]),
    /** Trophy axis → longitude (73°W) as the camera rises. */
    axis: K([
      [2040, 0, "atlasDrift"],
      [2090, 1],
    ]),
    axisOpacity: K([
      [2040, 0],
      [2050, 0.5],
      [2110, 0.2],
    ]),
  },
  net: K([
    [2015, 0],
    [2017, 1, "restrainedImpact"],
    [2030, 0],
  ]),
  ocean: {
    coastDraw: K([
      [2058, 0, "atlasDrift"],
      [2110, 1],
    ]),
    coastOpacity: K([
      [2058, 0.55],
      [2171, 0.62],
    ]),
    isobarsDraw: K([
      [2084, 0, "ceremonial"],
      [2131, 1],
    ]),
    wind: K([
      [2090, 0],
      [2126, 0.45],
      [2171, 0.6],
    ]),
    islandsHatch: K([
      [2112, 0, "atlasDrift"],
      [2150, 0.55],
      [2171, 0.7],
    ]),
    islandsOutline: K([
      [2116, 0, "atlasDrift"],
      [2146, 0.75],
      [2171, 0.95],
    ]),
    relief: K([
      [2142, 0, "ceremonial"],
      [2171, 1],
    ]),
    ridge: K([
      [2146, 0, "ceremonial"],
      [2168, 1],
    ]),
    navalGuide: K([
      [2120, 0, "atlasDrift"],
      [2171, 0.55],
    ]),
  },
  labels: {
    year1976: K([
      [1728, 0, "ceremonial"],
      [1740, 0.72],
      [1756, 0.72],
      [1766, 0],
    ]),
    lockup: K([
      [1760, 0, "ceremonial"],
      [1774, 0.94],
      [1850, 0.94, "atlasDrift"],
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
    oceano: K([
      [2086, 0, "ceremonial"],
      [2100, 0.5],
      [2136, 0.5, "atlasDrift"],
      [2150, 0],
    ]),
    year1982: K([
      [2138, 0],
      [2144, 0.18],
      [2145, 0.18, "ceremonial"],
      [2155, 0.92],
    ]),
    guerra: K([
      [2154, 0, "ceremonial"],
      [2168, 0.84],
    ]),
    malvinas: K([
      [2152, 0, "ceremonial"],
      [2166, 0.8],
    ]),
  },
} as const;
