/**
 * Numeric validation of Benchmark-V2-1722-2171 (V2 brief QA list + spec §12).
 * Run: ./node_modules/.bin/jiti scripts/validate-benchmark-v2.ts
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { evaluateActor } from "../src/actors/action-track";
import { perspectiveAt } from "../src/actors/perspective";
import { BUILDS } from "../src/actors/rig/wardrobe";
import { FACADE_Y } from "../src/atlas/geometry/city-v2";
import { MALVINAS_POLYGONS } from "../src/atlas/geometry/malvinas-entry";
import { GRID_MODULE, gridX, gridY, PITCH, PITCH_SEGMENTS } from "../src/atlas/geometry/stadium";
import { ringAt, TIERS } from "../src/atlas/geometry/stadium-v2";
import { MASTER_AUDIO } from "../src/audio/audio-contract";
import { evaluateCameraV2 } from "../src/camera/camera-paths-v2";
import { projectWorldPoint } from "../src/camera/evaluate-camera";
import { BENCHMARK_COMPOSITION } from "../src/compositions/composition-config";
import { sampleRange } from "../src/paths/interpolate-path";
import { MEMORY_LINE_STATES } from "../src/paths/memory-line-states";
import { memoryLineGeometry, mergeRanges } from "../src/paths/path-visibility";
import { ALL_ACTORS_V2 } from "../src/choreography/all-actors-v2";
import { createProjector } from "../src/stage/projection";
import { evaluateMemoryLine, TRACKS } from "../src/timeline/benchmark-timeline";
import { BENCHMARK_V2, TRACKS_V2 } from "../src/timeline/benchmark-v2-timeline";

const results: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, detail: string) => results.push([name, ok, detail]);
const cam = (f: number) => evaluateCameraV2(f);
const FRAMES = [...Array(450).keys()].map((i) => 1722 + i);

/* 1. Duration / offset / format */
check(
  "450 frames @30fps, 1920×1080",
  BENCHMARK_V2.durationInFrames === 450 && BENCHMARK_COMPOSITION.fps === 30 && BENCHMARK_COMPOSITION.width === 1920 && BENCHMARK_COMPOSITION.height === 1080,
  `${BENCHMARK_V2.durationInFrames}f ${BENCHMARK_COMPOSITION.width}×${BENCHMARK_COMPOSITION.height}@${BENCHMARK_COMPOSITION.fps}`,
);
check("globalFrame = localFrame + 1722", BENCHMARK_V2.globalStart === 1722 && BENCHMARK_V2.globalEnd === 1722 + 449, `local 0 → ${BENCHMARK_V2.globalStart}, local 449 → ${BENCHMARK_V2.globalEnd}`);

/* 2. Audio */
const t0 = BENCHMARK_V2.audioTrimBefore / 30;
const t1 = BENCHMARK_V2.audioTrimAfter / 30;
check(
  "audio trim 1722→2172 = 57.4–72.4 s, rate 1",
  BENCHMARK_V2.audioTrimBefore === 1722 && BENCHMARK_V2.audioTrimAfter === 2172 && MASTER_AUDIO.playbackRate === 1,
  `${t0.toFixed(3)} s ≤ t < ${t1.toFixed(3)} s`,
);
const wavHash = createHash("sha256").update(readFileSync(`assets/${MASTER_AUDIO.fileName}`)).digest("hex");
check("master WAV untouched (SHA-256)", wavHash === "aad141664df8db424fa692c4faeaa3c88af753d20be1eaea365060e8468b2b1d", wavHash);

/* 3. Source hygiene: no remote assets, no Math.random */
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const sources = walk("src").filter((p) => /\.(tsx?|css)$/.test(p));
const remote = sources.filter((p) => /(src|href|url)\s*[=(:]\s*["'`]https?:\/\/|fetch\(|@import\s+url\(["']?https?:/.test(readFileSync(p, "utf8")));
check("no remote assets referenced in src/", remote.length === 0, remote.length ? remote.join(", ") : `${sources.length} files scanned`);
// This checker is excluded: its own check label names the forbidden call.
const rnd = [...sources, ...walk("scripts").filter((p) => !p.endsWith("validate-benchmark-v2.ts"))].filter((p) => /Math\.random\s*\(/.test(readFileSync(p, "utf8").replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "")));
check("no Math.random() in src/ or scripts/", rnd.length === 0, rnd.length ? rnd.join(", ") : "0 occurrences");
// Editorial lock §2.2: the phrase is prohibited in any visible copy.
const bannedPhrase = new RegExp(["terrorismo", "de", "estado"].join("\\s+"), "i");
const banned = sources.filter((p) => bannedPhrase.test(readFileSync(p, "utf8")));
check("prohibited phrase absent from all source/visible copy (lock §2.2)", banned.length === 0, banned.length ? banned.join(", ") : "0 occurrences");
const memoryMounts = (readFileSync("src/compositions/BenchmarkV2.tsx", "utf8").match(/<MemoryLine\b/g) ?? []).length;
check("memoryLine.main mounted exactly once (V2)", memoryMounts === 1, `${memoryMounts} <MemoryLine> in BenchmarkV2.tsx`);

/* 4. Memory line continuity */
check("memory line states all 96 samples", Object.values(MEMORY_LINE_STATES).every((s) => s.length === 96), Object.keys(MEMORY_LINE_STATES).join(", "));
let minLen = Infinity;
let minAt = 0;
for (const f of FRAMES) {
  const st = evaluateMemoryLine(f);
  const pts = memoryLineGeometry(st.morph);
  let len = 0;
  for (const r of mergeRanges(st.ranges)) {
    const p = sampleRange(pts, r.start, r.end, 2);
    for (let i = 1; i < p.length; i++) len += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  }
  if (len < minLen) {
    minLen = len;
    minAt = f;
  }
}
check("memoryLine.main visible on every frame", minLen > 200, `min visible length ${minLen.toFixed(0)} world units @ ${minAt}`);
const lineJump = (a: number, b: number) => {
  const A = memoryLineGeometry(evaluateMemoryLine(a).morph);
  const B = memoryLineGeometry(evaluateMemoryLine(b).morph);
  const c = cam(b);
  let max = 0;
  for (let i = 0; i < 96; i++) {
    const pa = projectWorldPoint(A[i], c);
    const pb = projectWorldPoint(B[i], c);
    if (Math.abs(pb[0] - 960) > 480 || Math.abs(pb[1] - 540) > 270) continue;
    max = Math.max(max, Math.hypot(pb[0] - pa[0], pb[1] - pa[1]));
  }
  return max;
};
const j1 = lineJump(1907, 1908);
const j2 = lineJump(2084, 2085);
check("memory line boundary displacement < 3 px (viewport centre)", j1 < 3 && j2 < 3, `1907/1908 ${j1.toFixed(2)} px · 2084/2085 ${j2.toFixed(2)} px`);

/* 5. Camera continuity & limits */
let maxPx = 0;
let maxZ = 0;
let maxR = 0;
let maxT = 0;
let atZ = 0;
for (let f = 1723; f <= 2171; f++) {
  const a = cam(f - 1);
  const b = cam(f);
  maxPx = Math.max(maxPx, Math.hypot(b.x - a.x, b.y - a.y) * b.zoom);
  const z = Math.abs(b.zoom / a.zoom - 1) * 100;
  if (z > maxZ) {
    maxZ = z;
    atZ = f;
  }
  maxR = Math.max(maxR, Math.abs(b.rotation - a.rotation));
  maxT = Math.max(maxT, Math.abs((b.tilt ?? 0) - (a.tilt ?? 0)));
}
check("camera ≤ 42 px/frame, rotation ≤ 0.35°/frame, tilt ≤ 1.8°/frame (no cut)", maxPx <= 42 && maxR <= 0.35 && maxT <= 1.8, `${maxPx.toFixed(2)} px · ${maxR.toFixed(3)}° · tilt ${maxT.toFixed(3)}°`);
check("camera zoom ≤ 1.7 %/frame (spec 1.5 %, V2 dive tolerance)", maxZ <= 1.7, `${maxZ.toFixed(3)} %/frame @ ${atZ}`);

/* 6. 1976 → 1978 is geometric and continuous */
const foldedGrid = (() => {
  // Institution façade folded flat (fold = 1, module 90): grid lines land at
  // x = PITCH.left + 104k and y = FACADE_Y − 90j.
  let dev = 0;
  for (let k = 0; k <= 4; k++) dev = Math.max(dev, Math.abs(PITCH.left + GRID_MODULE.x * k - gridX(k)));
  for (let j = 0; j <= 3; j++) dev = Math.max(dev, Math.abs(FACADE_Y - 90 * j - gridY(3 - j)));
  return dev;
})();
const segStartsOnGrid = PITCH_SEGMENTS.every((s) =>
  s.grid.every(([x, y]) => x >= PITCH.left - 0.01 && x <= PITCH.right + 0.01 && y >= PITCH.top - 0.01 && y <= PITCH.bottom + 0.01),
);
check(
  "1976→1978: folded institutional façade = pitch seed cell (shared anchors)",
  foldedGrid < 0.01 && segStartsOnGrid && Math.abs(TRACKS_V2.city.institutionModule(1906) - 90) < 0.01 && TRACKS_V2.city.institutionFold(1906) === 1,
  `grid deviation ${foldedGrid.toFixed(3)} · fold(1906)=${TRACKS_V2.city.institutionFold(1906)} · module(1906)=${TRACKS_V2.city.institutionModule(1906)}`,
);
let gap = 0;
for (let f = 1850; f <= 1940; f++) {
  const cell = Math.max(TRACKS_V2.city.institutionLines(f), TRACKS_V2.pitch.lineOpacity(f));
  if (cell < 0.3) gap++;
}
check("1976→1978: the cell never disappears (façade lines hand over to pitch lines)", gap === 0, `${gap} frames with cell opacity < 0.3 in 1850–1940`);

/* 7. 1978 → Atlantic is a transformation, not a cut */
// A cut concentrates the change in one frame; a transformation spreads it.
let maxShare = 0;
let shareAt = 0;
for (let f = 2041; f <= 2112; f++) {
  const share = Math.abs(TRACKS.memory.m3(f) - TRACKS.memory.m3(f - 1));
  if (share > maxShare) {
    maxShare = share;
    shareAt = f;
  }
}
let ringsVisible = true;
for (let f = 2040; f <= 2112; f++) if (TRACKS_V2.bowl.opacity(f) < 0.3) ringsVisible = false;
const outer0 = ringAt(TIERS, 0);
const outer1 = ringAt(TIERS, 1);
check(
  "1978→Atlántico: bowl rings morph continuously into isobars (no cut)",
  maxShare < 0.1 && ringsVisible && TRACKS_V2.crowd.wind(2108) === 1 && TRACKS_V2.bowl.unbuild(2080) === 1,
  `largest single-frame share of the ellipse→isobar morph ${(maxShare * 100).toFixed(1)}% @ ${shareAt} · outer ring rx ${outer0.rx.toFixed(0)}→${outer1.rx.toFixed(0)} · rings ≥ 0.3 opacity 2040–2112 · stands flat by 2080 · crowd→wind 1.0 at 2108`,
);

/* 8. Human figures clearly visible */
const QA = [1722, 1812, 1872, 1907, 1908, 1974, 2016, 2047, 2084, 2085, 2145, 2171];
const figureReport: string[] = [];
let framesWithPeople = 0;
for (const f of QA) {
  const c = cam(f);
  let n = 0;
  let tallest = 0;
  for (const tr of ALL_ACTORS_V2) {
    const a = evaluateActor(tr, f);
    if (!a.visible || a.rise < 0.5) continue;
    const p = createProjector(c, tr.depth ?? 1);
    const s = p.point(a.x, a.y, 0);
    if (s[0] < 0 || s[0] > 1920 || s[1] < 0 || s[1] > 1400) continue;
    const h = 100 * BUILDS[tr.build ?? "standard"].height * tr.scale * perspectiveAt(p, s[1]) * p.zoom * p.rise * a.rise;
    if (h >= 40) {
      n++;
      tallest = Math.max(tallest, h);
    }
  }
  if (n > 0) framesWithPeople++;
  figureReport.push(`${f}:${n}${n ? `/${tallest.toFixed(0)}px` : ""}`);
}
const sceneFrames = [1722, 1812, 1974, 2016, 2171];
const perScene = sceneFrames.every((f) => !figureReport.find((r) => r.startsWith(`${f}:0`)));
check(
  "human figures ≥ 40 px in every period (1976, 1978, 1982); overhead map beats excepted",
  perScene && framesWithPeople >= 7,
  figureReport.join(" "),
);
let peopleFrames = 0;
for (const f of FRAMES) {
  const c = cam(f);
  if (ALL_ACTORS_V2.some((tr) => {
    const a = evaluateActor(tr, f);
    if (!a.visible || a.rise < 0.5) return false;
    const p = createProjector(c, tr.depth ?? 1);
    const s = p.point(a.x, a.y, 0);
    const h = 100 * tr.scale * p.zoom * p.rise * a.rise;
    return h >= 40 && s[0] > 0 && s[0] < 1920 && s[1] > 0 && s[1] < 1400;
  })) peopleFrames++;
}
check("frames with at least one person ≥ 40 px on screen (≥ 60 %)", peopleFrames >= 270, `${peopleFrames}/450`);

/* 9. Malvinas really grows */
const islandsWidth = (f: number) => {
  const c = cam(f);
  const xs = MALVINAS_POLYGONS.flat().map((q) => projectWorldPoint(q, c)[0]);
  return Math.max(...xs) - Math.min(...xs);
};
const w = [2085, 2115, 2145, 2171].map((f) => islandsWidth(f));
check("Malvinas scale increases (projected width px)", w[3] > 900 && w[3] / w[1] > 1.9 && w[3] > w[2] && w[2] > w[1], `2085 ${w[0].toFixed(0)} · 2115 ${w[1].toFixed(0)} · 2145 ${w[2].toFixed(0)} · 2171 ${w[3].toFixed(0)} px`);

/* 10. Anchors land on their frames */
const changesAt = (name: string, fn: (f: number) => number, f: number) => {
  const before = Math.abs(fn(f - 1) - fn(f - 2));
  const at = Math.abs(fn(f) - fn(f - 1));
  check(`anchor ${f}: ${name}`, at > 0.005 && at > 2 * before, `Δ(f-2→f-1)=${before.toFixed(4)} Δ(f-1→f)=${at.toFixed(4)}`);
};
changesAt("central civic stretch starts vanishing", TRACKS.memory.centralOpacity, 1812);
changesAt("pitch guide closes (cell → pitch)", TRACKS_V2.pitch.guide, 1908);
changesAt("goal-impact ring", TRACKS_V2.trophy.ringOpacity, 2016);
changesAt("South Atlantic isobars begin", TRACKS_V2.ocean.isobarsDraw, 2085);
check(
  "2171: 1982 lockup legible, route advancing, no 1983 yet",
  TRACKS_V2.labels.year1982(2171) >= 0.9 && TRACKS_V2.labels.guerra(2171) >= 0.8 && TRACKS.memory.head(2171) > TRACKS.memory.head(2170),
  `1982 ${TRACKS_V2.labels.year1982(2171).toFixed(2)} · guerra ${TRACKS_V2.labels.guerra(2171).toFixed(2)} · head ${TRACKS.memory.head(2171).toFixed(3)}`,
);

/* 11. Gold discipline */
const goldBad = FRAMES.filter((f) => (f < 2016 || f > 2070) && (TRACKS_V2.trophy.gold(f) > 0.001 || TRACKS_V2.trophy.ringOpacity(f) > 0.001));
check("gold only in 2016–2070 (goal ring + held trophy)", goldBad.length === 0, goldBad.length ? `gold at ${goldBad[0]}` : "ok");

let fail = 0;
for (const [n, ok, d] of results) {
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${n} — ${d}`);
}
console.log(fail ? `${fail} check(s) failed` : "all checks passed");
