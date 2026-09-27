#!/usr/bin/env bash
# Renders QA stills of the full film (global frames) as PNG.
# Usage: scripts/film-stills.sh <out-dir> <debug:true|false> frame [frame...]
set -euo pipefail
OUT="$1"; DEBUG="$2"; shift 2
BUNDLE="${BUNDLE:-/tmp/claude-0/scratch/bundle}"
BROWSER="${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}"
mkdir -p "$OUT"
for G in "$@"; do
  ./node_modules/.bin/remotion still "$BUNDLE" Argentina-Full "$OUT/f$(printf '%04d' "$G").png" \
    --frame="$G" --image-format=png --props="{\"debug\":$DEBUG}" --browser-executable="$BROWSER" --log=error
done
