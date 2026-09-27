/**
 * Locked macro timing (ANIMATIC_TIMELINE_v1 §2–§3). Global frames, inclusive.
 * These values are authority; scenes may only refine their interior.
 */
export const SCENES = [
  { id: "01", from: 0, to: 179, title: "1492–1776" },
  { id: "02", from: 180, to: 335, title: "1806–1808" },
  { id: "03", from: 336, to: 479, title: "1810" },
  { id: "04", from: 480, to: 674, title: "1810–1816 San Martín" },
  { id: "05", from: 675, to: 809, title: "1816" },
  { id: "06", from: 810, to: 1043, title: "1816–1853" },
  { id: "07", from: 1044, to: 1199, title: "1853–1880" },
  { id: "08", from: 1200, to: 1361, title: "1880–1930" },
  { id: "09", from: 1362, to: 1721, title: "1930–1976" },
  { id: "10", from: 1722, to: 1907, title: "1976–1983" },
  { id: "11", from: 1908, to: 2084, title: "1978" },
  { id: "12", from: 2085, to: 2258, title: "1982–1983" },
  { id: "13", from: 2259, to: 2444, title: "1986" },
  { id: "14", from: 2445, to: 2531, title: "1990–2001" },
  { id: "15", from: 2532, to: 2699, title: "2001–2014" },
  { id: "16", from: 2700, to: 2804, title: "2014" },
  { id: "17", from: 2805, to: 2891, title: "2021" },
  { id: "18", from: 2892, to: 3065, title: "2022" },
  { id: "19", from: 3066, to: 3149, title: "2023–2026 / final" },
] as const;

export const ANCHORS = {
  impact1810: 462,
  independence: 738,
  convergence: 1050,
  railAccel: 1200,
  century20: 1362,
  escalation: 1545,
  civicBreak: 1632,
  enter1976: 1722,
  dictaduraInternal: 1812,
  pitch1978: 1908,
  southAtlantic: 2085,
  civicReconnection: 2172,
  warmup1986: 2259,
  impact1986: 2352,
  thread1986: 2445,
  fracture2001: 2532,
  upward: 2628,
  pitch2014: 2700,
  copa2021: 2805,
  final2022: 2892,
  accel2022: 2937,
  laurels: 3000,
  silence: 3066,
  end: 3150,
} as const;

/** Camera segment joins (see film-camera.ts). */
export const CUT_1810 = ANCHORS.impact1810;
/** Invisible re-origin: the continental atlas hands over to the V2 world. */
export const REORIGIN = 1186;
/** Third LIBERTAD: the second sanctioned hard cut. */
export const LIBERTAD = [3020, 3042, 3064] as const;
export const CUT_LIBERTAD = LIBERTAD[2];

export const sceneAt = (f: number) => SCENES.find((s) => f >= s.from && f <= s.to) ?? SCENES[SCENES.length - 1];
