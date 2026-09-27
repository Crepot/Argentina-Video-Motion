import { smoothTrack } from "../animation/interpolate-clamped";
import { CAMERA_V2_KEYS } from "../camera/camera-paths-v2";
import type { CameraState } from "../types/camera";
import { applySim, invertSim, toWorld, type Placement, type Similarity } from "./space";

/**
 * Master camera (spec §4): a pure function of the global frame. Channels
 * (x, y, log zoom, tilt, rotation) are monotone cubic tracks through authored
 * keys: continuous velocity, no overshoot, no springs.
 *
 * The film is split into camera segments. Inside a segment the camera is
 * continuous. Between segments there are two kinds of joins:
 *  - `sim`: an invisible re-origin. World content and camera are mapped by
 *    the same similarity at that frame, so the picture does not change; it
 *    lets the continental atlas (1492–1880) hand over to the V2 world.
 *  - `cut`: one of the two hard cuts the storyboard allows (25 MAY 1810 and
 *    the third LIBERTAD). Keys never interpolate across a cut.
 */
export interface CamKey {
  f: number;
  x: number;
  y: number;
  zoom: number;
  tilt: number;
  rot: number;
}

export interface CamSegment {
  id: string;
  start: number;
  end: number;
  /** Join with the next segment. */
  next?: { kind: "sim"; sim: Similarity } | { kind: "cut" };
}

/** A camera key authored in a sheet's local frame (rotation relative to the sheet). */
export const camIn = (pl: Placement, f: number, x: number, y: number, zoom: number, tilt = 0, rot = 0): CamKey => {
  const [wx, wy] = toWorld(pl, [x, y]);
  return { f, x: wx, y: wy, zoom: zoom / pl.k, tilt, rot: rot + (pl.rot ?? 0) };
};

const simKey = (t: Similarity, k: CamKey): CamKey => {
  const [x, y] = applySim(t, [k.x, k.y]);
  return { ...k, x, y, zoom: k.zoom / t.s };
};

export interface FilmCamera {
  segments: readonly CamSegment[];
  keys: readonly CamKey[];
}

export const segmentAt = (cam: FilmCamera, f: number) => {
  const i = cam.segments.findIndex((s) => f >= s.start && f <= s.end);
  return i < 0 ? (f < cam.segments[0].start ? 0 : cam.segments.length - 1) : i;
};

type Channels = Record<"x" | "y" | "z" | "tilt" | "rot", (readonly [number, number])[]>;

const channelCache = new Map<string, Channels>();

/** Keys usable from segment `si`, expressed in that segment's coordinates. */
const channelsFor = (cam: FilmCamera, si: number): Channels => {
  const cacheKey = `${si}:${cam.keys.length}`;
  const hit = channelCache.get(cacheKey);
  if (hit) {
    return hit;
  }
  const keys: CamKey[] = [];
  const segOf = (f: number) => segmentAt(cam, f);
  // Walk backwards/forwards through `sim` joins only.
  let lo = si;
  while (lo > 0 && cam.segments[lo - 1].next?.kind === "sim") {
    lo--;
  }
  let hi = si;
  while (hi < cam.segments.length - 1 && cam.segments[hi].next?.kind === "sim") {
    hi++;
  }
  for (const k of cam.keys) {
    const ks = segOf(k.f);
    if (ks < lo || ks > hi) {
      continue;
    }
    let out = k;
    for (let j = ks; j < si; j++) {
      const n = cam.segments[j].next;
      if (n?.kind === "sim") {
        out = simKey(n.sim, out);
      }
    }
    for (let j = ks - 1; j >= si; j--) {
      const n = cam.segments[j].next;
      if (n?.kind === "sim") {
        out = simKey(invertSim(n.sim), out);
      }
    }
    keys.push(out);
  }
  keys.sort((a, b) => a.f - b.f);
  const ch: Channels = {
    x: keys.map((k) => [k.f, k.x] as const),
    y: keys.map((k) => [k.f, k.y] as const),
    z: keys.map((k) => [k.f, Math.log(k.zoom)] as const),
    tilt: keys.map((k) => [k.f, k.tilt] as const),
    rot: keys.map((k) => [k.f, k.rot] as const),
  };
  channelCache.set(cacheKey, ch);
  return ch;
};

export const evaluateFilmCamera = (cam: FilmCamera, f: number): CameraState => {
  const ch = channelsFor(cam, segmentAt(cam, f));
  return {
    x: smoothTrack(f, ch.x),
    y: smoothTrack(f, ch.y),
    zoom: Math.exp(smoothTrack(f, ch.z)),
    tilt: smoothTrack(f, ch.tilt),
    rotation: smoothTrack(f, ch.rot),
  };
};

/** The approved Benchmark V2 camera, reused unchanged for 1722–2171. */
export const V2_CAMERA_KEYS: readonly CamKey[] = CAMERA_V2_KEYS.filter((k) => k.f <= 2171).map((k) => ({
  f: k.f,
  x: k.x,
  y: k.y,
  zoom: k.zoom,
  tilt: k.tilt,
  rot: k.rot,
}));
