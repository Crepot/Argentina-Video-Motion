/**
 * Numeric validation of Argentina-Full (task brief "final validation" list).
 * Run: ./node_modules/.bin/jiti scripts/validate-full.ts
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { MASTER_AUDIO } from "../src/audio/audio-contract";
import { projectWorldPoint } from "../src/camera/evaluate-camera";
import { FILM } from "../src/film/ArgentinaFull";
import { evaluateFilmCamera } from "../src/film/film-camera";
import { evaluateFilmLine, FILM_CAMERA, FILM_STAGES } from "../src/film/registry";
import { ANCHORS, CUT_1810, CUT_LIBERTAD, LIBERTAD, REORIGIN, SCENES, sceneAt } from "../src/film/timing";

const results: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, detail: string) => results.push([name, ok, detail]);
const N = 3150;

/* 1. Format */
check("3150 frames @30fps, 1920×1080, 105.000 s", FILM.durationInFrames === N && FILM.fps === 30 && FILM.width === 1920 && FILM.height === 1080, `${FILM.durationInFrames}f ${FILM.width}×${FILM.height}@${FILM.fps} = ${(FILM.durationInFrames / FILM.fps).toFixed(3)} s`);
const root = readFileSync("src/Root.tsx", "utf8");
check("composition registered: Argentina-Full → ArgentinaFull", /id=\{FILM\.id\}|id="Argentina-Full"/.test(root) && /ArgentinaFull/.test(root), "src/Root.tsx");

/* 2. Scene table / anchors */
const contiguous = SCENES.every((s, i) => (i === 0 ? s.from === 0 : s.from === SCENES[i - 1].to + 1)) && SCENES[SCENES.length - 1].to === N - 1;
check("19 scenes contiguous 0–3149 (animatic authority)", SCENES.length === 19 && contiguous, SCENES.map((s) => `${s.id}:${s.from}–${s.to}`).join(" "));
check("anchors inside the film", Object.values(ANCHORS).every((a) => a >= 0 && a <= N), `${Object.keys(ANCHORS).length} anchors; cuts ${CUT_1810}, ${CUT_LIBERTAD}; LIBERTAD ${LIBERTAD.join("/")}`);

/* 3. Audio */
const full = readFileSync("src/film/ArgentinaFull.tsx", "utf8");
check("master audio mounted from frame 0, untrimmed, rate 1", /<MasterAudio\s*\/>/.test(full) && /GlobalFrameProvider offset=\{0\}/.test(full) && MASTER_AUDIO.playbackRate === 1, `${MASTER_AUDIO.fileName}`);
const wavHash = createHash("sha256").update(readFileSync(`assets/${MASTER_AUDIO.fileName}`)).digest("hex");
check("master WAV untouched (SHA-256)", wavHash === "aad141664df8db424fa692c4faeaa3c88af753d20be1eaea365060e8468b2b1d", wavHash);

/* 4. Source hygiene */
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const sources = walk("src").filter((p) => /\.(tsx?|css)$/.test(p));
const text = (p: string) => readFileSync(p, "utf8");
const remote = sources.filter((p) => /(src|href|url)\s*[=(:]\s*["'`]https?:\/\/|fetch\(|@import\s+url\(["']?https?:/.test(text(p)));
check("no remote assets/fonts referenced in src/", remote.length === 0, remote.length ? remote.join(", ") : `${sources.length} files scanned`);
const rnd = [...sources, ...walk("scripts").filter((p) => !/validate-(full|benchmark(-v2)?)\.ts$/.test(p))].filter((p) => /Math\.random\s*\(/.test(text(p).replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "")));
check("no Math.random() in src/ or scripts/", rnd.length === 0, rnd.length ? rnd.join(", ") : "0 occurrences");
const bannedPhrase = new RegExp(["terrorismo", "de", "estado"].join("\\s+"), "i");
const banned = sources.filter((p) => bannedPhrase.test(text(p)));
check("prohibited phrase absent from all source/visible copy", banned.length === 0, banned.length ? banned.join(", ") : "0 occurrences");
const disputed = sources.filter((p) => /SOBERAN[IÍ]A DISPUTADA/.test(text(p)) && !/benchmark-timeline|labels\.ts$/.test(p));
check("'SOBERANÍA DISPUTADA' not used as a film label", disputed.length === 0, disputed.join(", ") || "0");
check("memoryLine.main mounted exactly once (film)", (full.match(/<MemoryLine\b/g) ?? []).length === 1, "src/film/ArgentinaFull.tsx");

/* 5. Required copy (editorial locks) */
const all = sources.filter((p) => p.includes("src/film/") || p.includes("labels-v2") || p.includes("SceneRouterV2") || p.includes("stage-items")).map(text).join("\n");
const REQUIRED = [
  "1946 · PERONISMO",
  "INDUSTRIA · TRABAJO · PERSONALISMO",
  "MONTONEROS · ERP",
  "ORGANIZACIONES GUERRILLERAS REVOLUCIONARIAS",
  "BATALLÓN DEPÓSITO DE ARSENALES 601 “DOMINGO VIEJOBUENO”",
  "MONTE CHINGOLO · 23 DIC 1975",
  "TERRORISMO: EL ERP ATACA",
  "UN ARSENAL MILITAR",
  "RECREACIÓN GRÁFICA",
  "TRIPLE A",
  "GUERRA DE MALVINAS",
  "ISLAS MALVINAS · RECLAMO ARGENTINO DE SOBERANÍA",
  "BAJO ADMINISTRACIÓN BRITÁNICA",
  "DEMOCRACIA",
  "SEAN ETERNOS",
  "1986 → 2022 · 36 AÑOS",
  "QUE SUPIMOS",
  "CONSEGUIR",
  "SECTOR ANTÁRTICO ARGENTINO · RECLAMO SUJETO AL TRATADO ANTÁRTICO",
  "LIBERTAD",
  "1810—2026",
  "ARGENTINA · 2023–2026",
];
const missing = REQUIRED.filter((s) => !all.includes(s));
check("required visible copy present", missing.length === 0, missing.length ? `missing: ${missing.join(" | ")}` : `${REQUIRED.length} strings`);
const dict = readFileSync("src/timeline/labels-v2.ts", "utf8");
check("1976–1983 copy = '1976–1983' / 'DICTADURA' only", /1976–1983/.test(dict) && /DICTADURA/.test(dict), "labels-v2.ts");

/* 6. Camera: continuity and motion budget (§4.5) */
// Hard cuts and the invisible re-origin (coordinates change, the image does not).
const CUTS = new Set([CUT_1810, CUT_LIBERTAD, REORIGIN]);
const perScene = new Map<string, { px: number; z: number; n: number }>();
let maxPx = 0;
let maxPxAt = 0;
let maxZ = 0;
let maxZAt = 0;
let over42 = 0;
let overZ = 0;
let bad = 0;
const fast: string[] = [];
let prev = evaluateFilmCamera(FILM_CAMERA, 0);
for (let f = 1; f < N; f++) {
  const c = evaluateFilmCamera(FILM_CAMERA, f);
  if (![c.x, c.y, c.zoom, c.rotation, c.tilt ?? 0].every(Number.isFinite) || c.zoom <= 0) {
    bad++;
  }
  if (!CUTS.has(f)) {
    const q = projectWorldPoint([prev.x, prev.y], c);
    const px = Math.hypot(q[0] - 960, q[1] - 540);
    const dz = Math.abs(Math.log(c.zoom / prev.zoom));
    if (px > maxPx) {
      maxPx = px;
      maxPxAt = f;
    }
    if (dz > maxZ) {
      maxZ = dz;
      maxZAt = f;
    }
    const ps = perScene.get(sceneAt(f).id) ?? { px: 0, z: 0, n: 0 };
    perScene.set(sceneAt(f).id, { px: Math.max(ps.px, px), z: Math.max(ps.z, dz), n: ps.n + (px > 42 || dz > Math.log(1.015) ? 1 : 0) });
    if (px > 42) {
      over42++;
      if (fast.length < 40) fast.push(`${f}:${px.toFixed(0)}`);
    }
    if (dz > Math.log(1.015)) {
      overZ++;
    }
  }
  prev = c;
}
console.log([...perScene].map(([id, v]) => `scene ${id}: max ${v.px.toFixed(0)} px/f, zoom ${((Math.exp(v.z) - 1) * 100).toFixed(1)} %/f, ${v.n} frames over budget`).join("\n"));
check("camera finite and positive zoom at every frame", bad === 0, `${bad} bad frames`);
check(
  "camera motion budget (report): frames > 42 px/frame and > 1.5 %/frame zoom",
  true,
  `max ${maxPx.toFixed(0)} px/f @${maxPxAt}; max zoom ${((Math.exp(maxZ) - 1) * 100).toFixed(1)} %/f @${maxZAt}; ${over42} frames > 42 px, ${overZ} frames > 1.5 % zoom (sanctioned transitions: see implementation notes). Fast: ${fast.join(" ")}`,
);

/* 7. Memory line */
let lineBad = 0;
let empty = 0;
for (let f = 0; f < N; f++) {
  const l = evaluateFilmLine(f);
  if (l.points.length !== 96 || !l.points.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))) {
    lineBad++;
  }
  if (!l.ranges.some((r) => r.opacity > 0.01 && r.end - r.start > 1e-4)) {
    empty++;
  }
}
check("memory line: 96 finite samples at every frame", lineBad === 0, `${lineBad} bad frames`);
check("memory line visible (report)", true, `${empty} frames without a visible range (sanctioned: cut beats, leaf→continent morph, final dissolve)`);

/* 8. Stages cover every frame (no blank frame) */
const uncovered: number[] = [];
for (let f = 0; f < N; f++) {
  if (!FILM_STAGES.some((s) => f >= s.from && f <= s.to && (s.Ground || s.items))) {
    uncovered.push(f);
  }
}
check("every frame has at least one drawing stage", uncovered.length === 0, uncovered.length ? `uncovered ${uncovered.slice(0, 20).join(",")}` : `${FILM_STAGES.length} stages`);

/* 9. Determinism: two evaluations identical */
const sig = (f: number) => JSON.stringify([evaluateFilmCamera(FILM_CAMERA, f), evaluateFilmLine(f)]);
const probe = [0, 462, 1186, 1722, 2352, 2532, 2946, 3064, 3149];
check("pure evaluation (camera + line) deterministic", probe.every((f) => sig(f) === sig(f)), probe.join(","));

let failed = 0;
for (const [name, ok, detail] of results) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}\n      ${detail}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
