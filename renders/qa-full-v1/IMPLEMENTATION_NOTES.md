# ARGENTINA — Full film v1 · implementation notes

Composition `Argentina-Full` (`src/film/ArgentinaFull.tsx`): 1920×1080, 30 fps,
3150 frames (0–3149), 105.000 s, master WAV from frame 0, untrimmed.

- Validate: `npm run validate:full` (format, audio hash, hygiene, locked copy,
  camera and memory-line continuity, stage coverage, determinism).
- QA stills: `scripts/render-qa-full.sh` → this folder (32 PNG, named by moment and frame).
- Render: `npm run render:full` → `out/argentina-full-v1/ARGENTINA_FULL_v1.mp4`
  (then the AAC priming edit-list fix used for the benchmarks).

## Architecture

- One world camera (`film-camera.ts`) per segment: `atlas.a` 0–461 → hard cut
  (25 MAY 1810) → `atlas.b` 462–1185 → invisible re-origin (similarity) →
  `world` 1186–3063 → hard cut (third LIBERTAD) → `final` 3064–3149.
- Scenes are authored on sheets (`space.ts`: origin + scale + rotation) and
  registered in `registry.ts` (stages, camera keys, memory-line eras).
- One `memoryLine.main` instance, 96 samples, evaluated per era; eras share
  topologies where they morph (e.g. `THREAD_A/B`, `LATE`, `ARG_OUTLINE`).
- Benchmark V2 (1722–2171) is reused through `v2StageItems`/`GroundV2` and the
  V1 memory-line evaluator; the benchmark compositions are untouched in
  structure.

## Decisions and resolved contradictions

1. Timing: the animatic table is authority (scene ranges, anchors, cuts).
2. Andes: the 1817 crossing is not pre-dated; the 1810–1816 route stops at
   the ridge (label `1810–1816 · BELGRANO · SAN MARTÍN`).
3. Malvinas legend: V2's former note is replaced everywhere by
   `ISLAS MALVINAS · RECLAMO ARGENTINO DE SOBERANÍA` with the secondary
   `BAJO ADMINISTRACIÓN BRITÁNICA`; the V2 hybrid label now sets on two lines.
4. After 2171 the human Malvinas beat continues (help, flag raised against the
   wind) to ≈2226; `1983 · DEMOCRACIA` runs 2236–2306 with no leader.
5. Kits: 1986 Argentina in the dark shirt (as worn vs England); 2014 final in
   the dark away kit; 2021/2022 striped. Opponents are generic, unbranded.
6. `¡AL GRAN PUEBLO ARGENTINO, SALUD!` is used at the 1946 mass-civic beat as
   the storyboard's scene-09 note requires; the finale stays sparse (animatic §7:
   remove information) and carries only LIBERTAD ×3 and the lockup.
7. Storyboard 14 asks for a 90° camera rotation into the vertical century
   timeline. The film's street runs east–west and the fissure north, so the
   stem is already vertical on screen; no roll was needed.
8. 2014/2021/2022 pitches and the globe are sheets not to scale: the pale
   laurel leaf morphs (screen space) into South America on the globe sheet;
   the continent outline then opens into the 2021 pitch boundary; the Qatar
   pitch is drawn out of a coordinate grid at Lusail.
9. The 36-year line (`late-line.ts`) is one polyline: 1986 run · 1990s street ·
   new-century stem · 2014 pitch · Buenos Aires → Rio · Rio → Lusail · the 2022
   run. The pullback at 2952–2980 shows it whole; it then converges into the
   continental outline of Argentina (the final sky-blue contour).
10. Afro-Eurasia: a new `AFRO_EURASIA` outline (Horn, Red Sea, Arabia, Gulf)
    serves the Qatar flight; the 1492 `EURO_AFRICA` outline is unchanged.
11. Final map: continental Argentina (sky-blue outline, pale fill), Malvinas
    dashed + hatched with its two notes, Antarctic sector as a separated inset
    below Tierra del Fuego with dashed limits, hatch and the Treaty note.

## Camera motion budget (spec §4.5)

The benchmark range (scenes 10–11) stays inside ≤ 42 px/frame and ≈1.5 %/frame
zoom. Elsewhere the budget is exceeded only in designed transitions, reported
per scene by the validator: crane-ups/pull-outs between human scale and map
scale (1806→1808, 1810 wide, 1853, 1983→1986), the whip to the globe at
2786–2794 (the frame is empty paper under the leaf morph), the continental
push into the 2021 pitch, and the storyboard's “impossible cartographic
pullback” along the 36-year line (2952–2980).

## Pending visual limitations (v1)

- Figures are generic rigs; historical figures are recognisable by context,
  silhouette and wardrobe only (faces pass pending).
- Contemporary network vignettes (3004–3040) are small at national scale.
- The Antarctic inset is schematic (editorial sketch, not survey geometry).
- Stadium crowds are glyph rings; flags are simple two-tone marks.
- Motion-budget overruns listed above may need ear/eye review at speed.

## Recommended for the future `2D RECOGNIZABLE FACES` pass

San Martín, Belgrano, Perón, Eva Perón, Maradona, Messi (young and 2014/2022),
and — if editorially desired — Videla (optional, 1976 context) and the
Montoneros/ERP figures (currently generic).
