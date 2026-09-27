import { smoothTrack } from "../animation/interpolate-clamped";
import type { CameraState } from "../types/camera";

/**
 * Benchmark V2 camera (global frames). Unlike V1's flat atlas pan, V2 moves
 * between cartographic overhead (tilt ≈ 0) and an oblique scene view
 * (tilt ≈ 60°), always motivated by a subject (spec §2A.5):
 *
 *  1722–1790  lateral-track with the military column along the avenue
 *  1790–1812  push-in on the institution / Videla's command
 *  1812–1871  pullback-reveal: extent of control, the emptied street
 *  1871–1907  rise-overhead: façades fold into the city plan → pitch cell
 *  1908–1973  descend-scale into the stadium as the stands rise
 *  1974–2016  follow the attack and the goal
 *  2016–2084  rise-overhead + pullback: bowl → ellipse → isobar
 *  2085–2171  overhead ocean travel, then descend-scale onto the islands
 *
 * Channels are independent monotone cubic tracks (C1, no overshoot): the
 * velocity is continuous through every key, so no smoothing kernel is needed.
 */
export interface CameraKeyV2 {
  f: number;
  x: number;
  y: number;
  zoom: number;
  tilt: number;
  rot: number;
}

export const CAMERA_V2_KEYS: readonly CameraKeyV2[] = [
  { f: 1722, x: 3150, y: 2398, zoom: 1.5, tilt: 62, rot: 3.0 },
  { f: 1752, x: 3420, y: 2392, zoom: 1.66, tilt: 61, rot: 1.5 },
  { f: 1776, x: 3760, y: 2396, zoom: 2.1, tilt: 59, rot: 0.5 },
  { f: 1796, x: 3905, y: 2402, zoom: 2.5, tilt: 58, rot: 0 },
  { f: 1812, x: 3935, y: 2390, zoom: 2.3, tilt: 57, rot: 0 },
  { f: 1840, x: 3910, y: 2372, zoom: 1.8, tilt: 54, rot: 0 },
  { f: 1871, x: 3930, y: 2340, zoom: 1.42, tilt: 45, rot: 0 },
  { f: 1907, x: 4058, y: 2214, zoom: 1.1, tilt: 6, rot: 0 },
  { f: 1908, x: 4060, y: 2213, zoom: 1.1, tilt: 6.1, rot: 0 },
  { f: 1937, x: 4070, y: 2200, zoom: 1.26, tilt: 18, rot: 0 },
  { f: 1970, x: 4050, y: 2196, zoom: 1.78, tilt: 55, rot: 0 },
  { f: 1994, x: 4118, y: 2198, zoom: 2.02, tilt: 57, rot: -1.2 },
  { f: 2012, x: 4196, y: 2196, zoom: 2.2, tilt: 58, rot: -2.4 },
  { f: 2024, x: 4203, y: 2214, zoom: 2.14, tilt: 57, rot: -2.3 },
  { f: 2036, x: 4210, y: 2226, zoom: 1.9, tilt: 50, rot: -1.9 },
  { f: 2048, x: 4225, y: 2233, zoom: 1.62, tilt: 39, rot: -1.2 },
  { f: 2066, x: 4270, y: 2246, zoom: 1.24, tilt: 20, rot: -0.4 },
  { f: 2084, x: 4330, y: 2262, zoom: 0.99, tilt: 7, rot: 0 },
  { f: 2085, x: 4336, y: 2264, zoom: 0.985, tilt: 6.8, rot: 0 },
  { f: 2096, x: 4450, y: 2295, zoom: 0.88, tilt: 3, rot: -0.7 },
  { f: 2112, x: 4730, y: 2375, zoom: 0.95, tilt: 0, rot: -2 },
  { f: 2130, x: 5060, y: 2500, zoom: 1.2, tilt: 2, rot: -3.2 },
  { f: 2150, x: 5470, y: 2690, zoom: 1.6, tilt: 16, rot: -4.2 },
  { f: 2171, x: 5842, y: 2852, zoom: 2.1, tilt: 38, rot: -5 },
  // Continuation beyond the benchmark (2172+): keeps velocity continuous at 2171.
  { f: 2190, x: 5930, y: 2880, zoom: 2.45, tilt: 48, rot: -5 },
];

const channel = (sel: (k: CameraKeyV2) => number) =>
  CAMERA_V2_KEYS.map((k) => [k.f, sel(k)] as const);

const X = channel((k) => k.x);
const Y = channel((k) => k.y);
const LOGZ = channel((k) => Math.log(k.zoom));
const TILT = channel((k) => k.tilt);
const ROT = channel((k) => k.rot);

export const evaluateCameraV2 = (f: number): CameraState => ({
  x: smoothTrack(f, X),
  y: smoothTrack(f, Y),
  zoom: Math.exp(smoothTrack(f, LOGZ)),
  tilt: smoothTrack(f, TILT),
  rotation: smoothTrack(f, ROT),
});
