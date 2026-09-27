#!/usr/bin/env bash
# Renders QA stills of Benchmark-V2-1722-2171 from GLOBAL frame numbers.
# Usage: scripts/render-qa-v2.sh <bundle-dir> <out-dir> <debug:true|false> [global frames...]
set -euo pipefail
BUNDLE="$1"; OUT="$2"; DEBUG="$3"; shift 3
FRAMES=("$@")
if [ ${#FRAMES[@]} -eq 0 ]; then
  FRAMES=(1722 1812 1872 1907 1908 1974 2016 2047 2084 2085 2145 2171)
fi
OFFSET=1722
mkdir -p "$OUT"
for G in "${FRAMES[@]}"; do
  L=$((G - OFFSET))
  ./node_modules/.bin/remotion still "$BUNDLE" Benchmark-V2-1722-2171 \
    "$OUT/global-${G}_local-$(printf '%03d' "$L").png" \
    --frame="$L" --image-format=png --props="{\"debug\":$DEBUG}" --log=error
done
