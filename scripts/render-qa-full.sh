#!/usr/bin/env bash
# QA stills of Argentina-Full (task brief §39) → renders/qa-full-v1/.
# Usage: scripts/render-qa-full.sh   (bundles first; uses REMOTION_BROWSER if set)
set -euo pipefail
OUT=renders/qa-full-v1
BUNDLE=$(mktemp -d)
./node_modules/.bin/remotion bundle src/index.ts --out-dir "$BUNDLE" --log=error
BROWSER="${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}"
mkdir -p "$OUT"
while read -r NAME F; do
  [ -z "$NAME" ] && continue
  ./node_modules/.bin/remotion still "$BUNDLE" Argentina-Full "$OUT/${NAME}_f$(printf '%04d' "$F").png" \
    --frame="$F" --image-format=png --props='{"debug":false}' --browser-executable="$BROWSER" --log=error
done <<'LIST'
01_opening 24
02_colony 150
03_british-invasions 232
04_1810 470
05_san-martin-andes 628
06_independence 745
07_civil-wars 900
08_national-organization 1100
09_frontier-integration 1160
10_immigration 1262
11_1930 1384
12_peronism 1440
13_armed-conflict 1540
14_monte-chingolo-approach 1612
15_monte-chingolo-blast 1640
16_reconstructed-newspaper 1674
17_triple-a-breakdown 1706
18_1976 1760
19_1978-action 1960
20_1978-celebration 2040
21_south-atlantic 2110
22_malvinas-cartography 2160
23_malvinas-soldiers-flag 2212
24_1983 2250
25_maradona 2344
26_2001 2522
27_messi-2014 2758
28_2021 2872
29_messi-2022 2988
30_final-convergence 3036
31_argentina 3120
32_last-frame 3149
LIST
rm -rf "$BUNDLE"
