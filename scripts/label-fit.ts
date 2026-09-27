import { benchmarkCameraPath } from "../src/camera/camera-paths";
import {
  evaluateSmoothedCameraPath,
  projectWorldPoint,
} from "../src/camera/evaluate-camera";
import { SAFE_AREA } from "../src/atlas/atlas-constants";
import { evaluateMemoryLine } from "../src/timeline/benchmark-timeline";
import { memoryLineGeometry } from "../src/paths/path-visibility";
import { sampleRange } from "../src/paths/interpolate-path";
import { BOWL_RINGS, ellipsePoint } from "../src/atlas/geometry/stadium";
import { COASTLINES } from "../src/atlas/south-atlantic-geometry";
import { MALVINAS_BOUNDS } from "../src/atlas/geometry/malvinas-entry";
type P = readonly [number, number];
const [W, H] = [390, 150];
const frames = [2145, 2150, 2155, 2160, 2165, 2171];
const obstacles = (f: number): P[] => {
  const st = evaluateMemoryLine(f);
  const pts = memoryLineGeometry(st.morph);
  const out: P[] = [];
  for (const r of st.ranges)
    if (r.opacity > 0.25) out.push(...sampleRange(pts, r.start, r.end, 3));
  for (const ring of BOWL_RINGS)
    for (let t = 0; t < 360; t += 3) out.push(ellipsePoint(ring.isobar, t));
  for (const c of COASTLINES) out.push(...sampleRange(c.points, 0, 1, 4));
  const b = MALVINAS_BOUNDS;
  for (let x = b.minX; x <= b.maxX; x += 20)
    for (let y = b.minY; y <= b.maxY; y += 20) out.push([x, y]);
  return out;
};
const cache = new Map(frames.map((f) => [f, obstacles(f)]));
let best: { a: P; score: number } | null = null;
for (let ax = 4300; ax <= 6200; ax += 20)
  for (let ay = 2000; ay <= 3200; ay += 20) {
    let ok = true;
    let clearance = Infinity;
    for (const f of frames) {
      const cam = evaluateSmoothedCameraPath(benchmarkCameraPath, f);
      const [x, y] = projectWorldPoint([ax, ay], cam);
      if (
        x < SAFE_AREA.left ||
        x + W > SAFE_AREA.right ||
        y < SAFE_AREA.top ||
        y + H > SAFE_AREA.bottom
      ) {
        ok = false;
        break;
      }
      if (f < 2152) continue; // only the legible part must be clear
      for (const o of cache.get(f)!) {
        const [ox, oy] = projectWorldPoint(o, cam);
        const dx = Math.max(x - ox, 0, ox - (x + W));
        const dy = Math.max(y - oy, 0, oy - (y + H));
        clearance = Math.min(clearance, Math.hypot(dx, dy));
      }
    }
    if (ok && (!best || clearance > best.score))
      best = { a: [ax, ay], score: clearance };
  }
console.log(best);
if (best)
  for (const f of frames)
    console.log(
      f,
      projectWorldPoint(
        best.a,
        evaluateSmoothedCameraPath(benchmarkCameraPath, f),
      )
        .map((v) => v.toFixed(0))
        .join(","),
    );
