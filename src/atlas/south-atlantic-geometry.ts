import { createPrng } from "../animation/stroke-draw";
import type { Point } from "../types/paths";
import { ANCHORS } from "./atlas-anchors";
import { GRID_ORIGIN, gridX } from "./geometry/stadium";

/**
 * Local equirectangular projection for the South Atlantic sheet. Isotropic
 * (1.9 world units per km at 51.75°S) so that Patagonia, the ocean and the
 * islands keep their relative direction and scale. 73°W is registered on the
 * stadium axis: the 1978 trophy axis literally becomes that meridian.
 */
const KM_PER_DEG_LAT = 111.2;
const UNITS_PER_KM = 1.9;
const REF_LAT = 51.75;
const KX = KM_PER_DEG_LAT * Math.cos((REF_LAT * Math.PI) / 180) * UNITS_PER_KM; // ≈130.8
const KY = KM_PER_DEG_LAT * UNITS_PER_KM; // ≈211.3

const AXIS_LON_W = 73;
const AXIS_LAT_S = 48.5;

/** lonW / latS are positive degrees West / South. */
export const geo = (lonW: number, latS: number): Point => [
  ANCHORS.stadiumCenter[0] + (AXIS_LON_W - lonW) * KX,
  ANCHORS.stadiumCenter[1] + (latS - AXIS_LAT_S) * KY,
];

export const meridianX = (lonW: number) => geo(lonW, AXIS_LAT_S)[0];
export const parallelY = (latS: number) => geo(AXIS_LON_W, latS)[1];

/**
 * Graticule registration of the atlas grid. V_k becomes the meridian
 * (73 − (k − 2))°W; H_j becomes the parallel (48.5 + (j − 1)/2)°S. The
 * dictatorship control grid ends the benchmark as cartographic memory.
 */
export const gridKToLonW = (k: number) => AXIS_LON_W - (k - 2);
export const gridJToLatS = (j: number) => AXIS_LAT_S + (j - 1) / 2;
export const graticuleX = (k: number) => meridianX(gridKToLonW(k));
export const graticuleY = (j: number) => parallelY(gridJToLatS(j));

// Sanity: the stadium axis is grid V_2 and meridian 73°W at once.
if (
  Math.abs(gridX(2) - meridianX(AXIS_LON_W)) > 0.01 ||
  GRID_ORIGIN.x !== gridX(0)
) {
  throw new Error("Grid / graticule registration broken");
}

/* ------------------------------------------------------------- coastline */

// Simplified Patagonian Atlantic coast, north → south (lonW, latS).
const PATAGONIA_COAST: readonly (readonly [number, number])[] = [
  [65.05, 43.3],
  [65.3, 44.0],
  [65.62, 44.75],
  [65.55, 44.95],
  [66.4, 45.05],
  [67.1, 45.3],
  [67.55, 45.75],
  [67.5, 46.1],
  [67.55, 46.5],
  [67.2, 46.8],
  [66.6, 47.0],
  [65.87, 47.1],
  [65.85, 47.75],
  [66.2, 48.2],
  [66.8, 48.6],
  [67.3, 49.0],
  [67.7, 49.3],
  [68.1, 49.8],
  [68.35, 50.15],
  [68.8, 50.6],
  [69.0, 51.0],
  [69.1, 51.6],
  [68.8, 52.0],
  [68.35, 52.35],
];

// Isla Grande de Tierra del Fuego, Atlantic side (lonW, latS).
const TIERRA_DEL_FUEGO: readonly (readonly [number, number])[] = [
  [68.6, 52.65],
  [68.3, 53.0],
  [68.6, 53.35],
  [68.2, 53.6],
  [67.7, 53.8],
  [67.2, 54.05],
  [66.7, 54.3],
  [65.9, 54.55],
  [65.2, 54.65],
  [65.6, 54.9],
  [66.6, 54.95],
  [67.6, 54.98],
];

const ISLA_DE_LOS_ESTADOS: readonly (readonly [number, number])[] = [
  [64.75, 54.72],
  [64.2, 54.7],
  [63.8, 54.76],
  [64.25, 54.86],
  [64.75, 54.8],
  [64.75, 54.72],
];

const project = (pts: readonly (readonly [number, number])[]) =>
  pts.map(([lon, lat]) => geo(lon, lat));

export const COASTLINES: readonly { id: string; points: readonly Point[] }[] = [
  { id: "coast.patagonia", points: project(PATAGONIA_COAST) },
  { id: "coast.tierraDelFuego", points: project(TIERRA_DEL_FUEGO) },
  { id: "coast.islaDeLosEstados", points: project(ISLA_DE_LOS_ESTADOS) },
];

/* ---------------------------------------------------------- ocean field */

/** Additional isobars east of the memory line family (world-space cubic paths). */
export const OCEAN_ISOBARS: readonly string[] = [
  "M 5120 1660 C 5680 1820, 6240 2140, 6720 2600",
  "M 6000 2320 C 6320 2560, 6420 2980, 6200 3380",
  "M 4980 3160 C 5480 3280, 6020 3380, 6660 3260",
  "M 6320 1860 C 6760 2180, 6960 2700, 6900 3120",
];

/** Sparse directional hatching aligned with the prevailing westerlies. */
export const OCEAN_WIND: readonly {
  p: Point;
  angle: number;
  length: number;
}[] = (() => {
  const rand = createPrng(1982);
  const out: { p: Point; angle: number; length: number }[] = [];
  for (let i = 0; i < 34; i++) {
    const x = 5000 + rand() * 1800;
    const y = 1800 + rand() * 1500;
    // Skip the islands' neighbourhood so they resolve from hatching alone.
    const [ix, iy] = geo(59.5, 51.75);
    if (Math.hypot(x - ix, (y - iy) * 1.6) < 360) {
      continue;
    }
    out.push({
      p: [x, y],
      angle: 0.2 + (rand() - 0.5) * 0.18,
      length: 34 + rand() * 30,
    });
  }
  return out;
})();

/** Secondary naval/air dotted guide (≤ 0.22 opacity): mainland coast toward the islands. */
export const NAVAL_GUIDE: readonly Point[] = [
  geo(68.75, 50.7),
  geo(66.6, 51.05),
  geo(64.2, 51.4),
  geo(62.4, 51.62),
];

/** Open water north of the isobar family: visible through L–M, it leaves the frame in N. */
export const OCEAN_LABEL_ANCHOR: Point = [5250, 1950];

export const COORDINATE_LABELS: readonly {
  id: string;
  text: string;
  anchor: Point;
  frame: number;
}[] = [
  {
    id: "coord.50S",
    text: "50°S",
    anchor: [geo(66.1, 50)[0], parallelY(50) - 10],
    frame: 2106,
  },
  {
    id: "coord.64W",
    text: "64°O",
    anchor: [meridianX(64) + 10, parallelY(47.25)],
    frame: 2127,
  },
];
