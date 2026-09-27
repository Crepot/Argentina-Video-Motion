/**
 * Numeric validation of Benchmark-1722-2171 (REMOTION_IMPLEMENTATION_SPEC §12).
 * Run: ./node_modules/.bin/jiti scripts/validate-benchmark.ts
 */
import { BENCHMARK_COMPOSITION } from "../src/compositions/composition-config";
import { BENCHMARK, TRACKS, evaluateMemoryLine } from "../src/timeline/benchmark-timeline";
import { benchmarkCameraPath } from "../src/camera/camera-paths";
import { evaluateSmoothedCameraPath, projectWorldPoint } from "../src/camera/evaluate-camera";
import { memoryLineGeometry, mergeRanges } from "../src/paths/path-visibility";
import { MEMORY_LINE_STATES } from "../src/paths/memory-line-states";
import { sampleRange } from "../src/paths/interpolate-path";
import { MASTER_AUDIO } from "../src/audio/audio-contract";
import { CONTROL_LINES } from "../src/atlas/geometry/institutions";
import { progress } from "../src/animation/interpolate-clamped";

const results: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, detail: string) => results.push([name, ok, detail]);
const cam = (f: number) => evaluateSmoothedCameraPath(benchmarkCameraPath, f);

// 1. Duration / offset
check("450 frames @30fps, 1920x1080",
  BENCHMARK_COMPOSITION.durationInFrames === 450 && BENCHMARK_COMPOSITION.fps === 30 &&
  BENCHMARK_COMPOSITION.width === 1920 && BENCHMARK_COMPOSITION.height === 1080,
  `${BENCHMARK_COMPOSITION.durationInFrames}f ${BENCHMARK_COMPOSITION.width}x${BENCHMARK_COMPOSITION.height}@${BENCHMARK_COMPOSITION.fps}`);
check("globalFrame = localFrame + 1722", BENCHMARK_COMPOSITION.globalOffset === 1722 && BENCHMARK.globalEnd === 1722 + 449,
  `local 0 → ${BENCHMARK.globalStart}, local 449 → ${BENCHMARK.globalEnd}`);

// 2. Audio window
const t0 = BENCHMARK.audioTrimBefore / 30, t1 = BENCHMARK.audioTrimAfter / 30;
check("audio trim 1722→2172 = 57.4–72.4 s", BENCHMARK.audioTrimBefore === 1722 && BENCHMARK.audioTrimAfter === 2172 &&
  Math.abs(t0 - 57.4) < 1e-9 && Math.abs(t1 - 72.4) < 1e-9 && MASTER_AUDIO.playbackRate === 1,
  `${t0.toFixed(3)}s ≤ t < ${t1.toFixed(3)}s, rate ${MASTER_AUDIO.playbackRate}`);

// 3. 96-sample topology
check("memory line states all 96 samples", Object.values(MEMORY_LINE_STATES).every((s) => s.length === 96),
  Object.entries(MEMORY_LINE_STATES).map(([k, v]) => `${k}:${v.length}`).join(" "));

// 4. Memory-line displacement between consecutive frames (morph only, camera held fixed).
const visibleSamples = (f: number) => {
  const st = evaluateMemoryLine(f);
  const pts = memoryLineGeometry(st.morph);
  return { st, pts, ranges: mergeRanges(st.ranges) };
};
const displacement = (a: number, b: number, centralOnly: boolean) => {
  const A = visibleSamples(a), B = visibleSamples(b);
  const c = cam(b);
  let max = 0;
  for (let i = 0; i < 96; i++) {
    const s = i / 95;
    const visible = B.ranges.some((r) => s >= r.start && s <= r.end && r.opacity > 0.05);
    if (!visible) continue;
    const pa = projectWorldPoint(A.pts[i], c), pb = projectWorldPoint(B.pts[i], c);
    if (centralOnly && (Math.abs(pb[0] - 960) > 480 || Math.abs(pb[1] - 540) > 270)) continue;
    max = Math.max(max, Math.hypot(pb[0] - pa[0], pb[1] - pa[1]));
  }
  return max;
};
for (const [a, b] of [[1906, 1907], [1907, 1908], [1908, 1909], [2083, 2084], [2084, 2085], [2085, 2086]] as const) {
  const all = displacement(a, b, false), central = displacement(a, b, true);
  const camShift = Math.hypot(cam(b).x - cam(a).x, cam(b).y - cam(a).y) * cam(b).zoom;
  console.log(`  memory line ${a}→${b}: morph max ${all.toFixed(2)} px, central-50% ${central.toFixed(2)} px, camera ${camShift.toFixed(2)} px`);
}
const b1 = displacement(1907, 1908, true), b2 = displacement(2084, 2085, true);
check("memory line boundary displacement < 3 px (viewport centre)", b1 < 3 && b2 < 3,
  `1907/1908: ${b1.toFixed(2)} px · 2084/2085: ${b2.toFixed(2)} px`);

// Visible stroke length never collapses to zero (one continuous object).
let minLen = Infinity, minAt = 0;
for (let f = 1722; f <= 2171; f++) {
  const { pts, ranges } = visibleSamples(f);
  let len = 0;
  for (const r of ranges) { const p = sampleRange(pts, r.start, r.end, 2); for (let i = 1; i < p.length; i++) len += Math.hypot(p[i][0] - p[i-1][0], p[i][1] - p[i-1][1]); }
  if (len < minLen) { minLen = len; minAt = f; }
}
check("memoryLine.main visible on every frame", minLen > 200, `min visible length ${minLen.toFixed(0)} world units @ ${minAt}`);

// 5. Camera limits (§4.5)
let maxPx = 0, maxZ = 0, maxR = 0;
for (let f = 1723; f <= 2171; f++) {
  const a = cam(f - 1), b = cam(f);
  maxPx = Math.max(maxPx, Math.hypot(b.x - a.x, b.y - a.y) * b.zoom);
  maxZ = Math.max(maxZ, Math.abs(b.zoom / a.zoom - 1) * 100);
  maxR = Math.max(maxR, Math.abs(b.rotation - a.rotation));
}
check("camera ≤ 42 px/frame peak, rotation ≤ 0.35°/frame", maxPx <= 42 && maxR <= 0.35, `${maxPx.toFixed(2)} px, ${maxR.toFixed(3)}°`);
check("camera zoom ≤ 1.5 %/frame", maxZ <= 1.5, `${maxZ.toFixed(3)} %/frame`);
let dev = 0; for (const k of benchmarkCameraPath.keyframes) { const c = cam(k.frame); dev = Math.max(dev, Math.hypot(c.x - k.x, c.y - k.y)); }
console.log(`  camera max keyframe deviation after junction smoothing: ${dev.toFixed(1)} world units`);

// 6. Anchors: something changes exactly there, and it was steady just before.
// The anchor frame must be the first visibly different frame: a distinct change
// lands between f-1 and f, clearly larger than the drift just before it.
const changesAt = (name: string, fn: (f: number) => number, f: number) => {
  const before = Math.abs(fn(f - 1) - fn(f - 2));
  const at = Math.abs(fn(f) - fn(f - 1));
  check(`anchor ${f}: ${name}`, at > 0.01 && at > 3 * before, `Δ(f-2→f-1)=${before.toFixed(4)} Δ(f-1→f)=${at.toFixed(4)}`);
};
changesAt("first control line draws (1976 layer)", (f) => progress(f, CONTROL_LINES[0].start - 1, CONTROL_LINES[0].end) * 30, 1722);
changesAt("central civic stretch starts vanishing / removals", TRACKS.memory.centralOpacity, 1812);
changesAt("pitch guide closes 0.92 → 1", TRACKS.pitch.guide, 1908);
changesAt("goal-impact ring + trophy axis", TRACKS.trophy.ringOpacity, 2016);
changesAt("South Atlantic isobars / ocean label", TRACKS.ocean.isobarsDraw, 2085);
check("anchor 2171: 1982 lockup legible, islands emerging, route active",
  TRACKS.labels.year1982(2171) >= 0.89 && TRACKS.labels.guerra(2171) >= 0.8 &&
  TRACKS.ocean.islandsHatch(2171) <= 0.28 + 1e-9 && TRACKS.ocean.islandsHatch(2171) > 0.2 &&
  TRACKS.memory.head(2171) > TRACKS.memory.head(2170),
  `1982 ${TRACKS.labels.year1982(2171).toFixed(2)} · guerra ${TRACKS.labels.guerra(2171).toFixed(2)} · islands ${TRACKS.ocean.islandsHatch(2171).toFixed(2)} · head ${TRACKS.memory.head(2171).toFixed(3)} (still advancing)`);

// 7. No gold outside 1978 trophy/ring window
const goldOutside = [...Array(450).keys()].map((i) => 1722 + i).filter((f) => (f < 2016 || f > 2070) && (TRACKS.trophy.gold(f) > 0 && TRACKS.trophy.bodyDraw(f) > 0));
check("gold only in 2016–2070 (trophy/impact ring)", goldOutside.length === 0, goldOutside.length ? `gold at ${goldOutside[0]}` : "ok");

let fail = 0;
for (const [n, ok, d] of results) { if (!ok) fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n} — ${d}`); }
console.log(fail ? `${fail} check(s) failed` : "all checks passed");
