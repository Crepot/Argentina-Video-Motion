import { pointAndAngleAt } from "../../paths/interpolate-path";
import type { Point } from "../../types/paths";
import { lineState } from "../line";
import { M, MP, type LonLat } from "./geo";

/**
 * Atlantic routes of the opening (identity world = continental atlas).
 * The main route is memoryLine.main's first life: Iberia → Canarias →
 * across the Atlantic → down the Brazilian coast → Río de la Plata.
 */
export const ATLANTIC_ROUTE_LL: readonly LonLat[] = [
  [6.3, -36.5],
  [10.5, -33.0],
  [15.5, -28.0],
  [21.0, -18.0],
  [26.0, -8.0],
  [29.5, 0.5],
  [31.4, 7.0],
  [34.8, 13.2],
  [36.8, 18.6],
  [40.4, 24.6],
  [45.8, 28.6],
  [50.6, 33.0],
  [54.4, 35.3],
  [56.6, 35.2],
  [58.0, 34.75],
  [58.33, 34.62],
];

export const ATLANTIC_ROUTE: readonly Point[] = lineState(ATLANTIC_ROUTE_LL.map(MP));

export const routeAt = (pts: readonly Point[], s: number) => pointAndAngleAt(pts, s);

/** Pale secondary routes of 1492–1776 (drawn dotted, never the memory line). */
export const BRANCHES: readonly { id: string; pts: readonly Point[]; from: number; to: number }[] = [
  {
    id: "colon",
    pts: lineState([M(15.5, -28), M(30, -27), M(45, -26), M(60, -25), M(74.5, -24)]),
    from: 42,
    to: 92,
  },
  {
    id: "mexico",
    pts: lineState([M(74.5, -24), M(80, -22.5), M(86, -21.8), M(94, -19.8), M(96.1, -19.2)]),
    from: 78,
    to: 118,
  },
  {
    id: "africa",
    pts: lineState([M(10.5, -33), M(18.5, -22), M(20.5, -12), M(12, -2), M(0, 2), M(-10, 12), M(-14, 30), M(-19, 36.5)]),
    from: 50,
    to: 126,
  },
  {
    id: "estrecho",
    pts: lineState([M(56.6, 35.2), M(60, 40), M(64, 45), M(66, 49), M(68.2, 52.3), M(71, 53.6), M(76, 52.5)]),
    from: 118,
    to: 168,
  },
];

/** Colonial towns of the 1776 viceroyalty and its orbit (map-scale drafting). */
export const COLONIAL_TOWNS: readonly { id: string; ll: LonLat; at: number; size: number }[] = [
  { id: "potosi", ll: [65.75, 19.6], at: 126, size: 1.1 },
  { id: "asuncion", ll: [57.6, 25.3], at: 132, size: 0.9 },
  { id: "salta", ll: [65.4, 24.8], at: 134, size: 0.8 },
  { id: "tucuman", ll: [65.2, 26.8], at: 138, size: 0.8 },
  { id: "cordoba", ll: [64.2, 31.4], at: 142, size: 0.95 },
  { id: "mendoza", ll: [68.8, 32.9], at: 146, size: 0.8 },
  { id: "santaFe", ll: [60.7, 31.6], at: 148, size: 0.75 },
  { id: "montevideo", ll: [56.2, 34.9], at: 152, size: 0.85 },
  { id: "buenosAires", ll: [58.4, 34.6], at: 150, size: 1.2 },
];
