import React from "react";
import { strokeDrawProps } from "../animation/stroke-draw";
import {
  MALVINAS_BOUNDS,
  MALVINAS_PATHS,
} from "../atlas/geometry/malvinas-entry";
import { COASTLINES } from "../atlas/south-atlantic-geometry";
import { polylineToPath, sampleRange } from "../paths/interpolate-path";
import { PALETTE } from "../theme/palette";

/**
 * Territory treatments whose status never depends on colour alone (§9.9).
 * 'modern' mainland: continuous coastline plus inland engraving ticks.
 * 'disputed' islands: resolve from ocean hatching with a fine dashed edge,
 * different from the mainland; the sovereignty label comes after 2171.
 */
export interface TerritoryHighlightProps {
  geometryId: "mainland.patagonia" | "islands.malvinas";
  status: "historical" | "modern" | "disputed" | "claimed";
  fillOpacity: number;
  strokeOpacity: number;
  hatch?: "none" | "light" | "claim";
  labelId?: string;
  drawProgress: number;
  px: (n: number) => number;
}

const COAST_D = COASTLINES.map((c) => ({
  id: c.id,
  d: polylineToPath(sampleRange(c.points, 0, 1, 6)),
}));

/** Short engraving ticks on the land side of the coast (west). */
const INLAND_TICKS = COASTLINES.slice(0, 2)
  .map((c) =>
    c.points
      .slice(0, -1)
      .map((p, i) => {
        const q = c.points[i + 1];
        const mx = (p[0] + q[0]) / 2;
        const my = (p[1] + q[1]) / 2;
        const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
        const nx = -(q[1] - p[1]) / len;
        const ny = (q[0] - p[0]) / len;
        // Normal pointing west (land).
        const s = nx < 0 ? 1 : -1;
        return `M ${(mx + s * nx * 6).toFixed(1)} ${(my + s * ny * 6).toFixed(1)} l ${(s * nx * 20).toFixed(1)} ${(s * ny * 20).toFixed(1)}`;
      })
      .join(" "),
  )
  .join(" ");

const HATCH_D = (() => {
  const { minX, maxX, minY, maxY } = MALVINAS_BOUNDS;
  let d = "";
  for (let x = minX - (maxY - minY); x < maxX; x += 9) {
    d += `M ${x.toFixed(1)} ${maxY.toFixed(1)} L ${(x + (maxY - minY)).toFixed(1)} ${minY.toFixed(1)} `;
  }
  return d;
})();

export const TerritoryHighlight: React.FC<TerritoryHighlightProps> = ({
  geometryId,
  status,
  fillOpacity,
  strokeOpacity,
  drawProgress,
  px,
}) => {
  if (geometryId === "mainland.patagonia") {
    return (
      <g
        data-id={geometryId}
        data-status={status}
        fill="none"
        stroke={PALETTE.deepBlueSoft}
      >
        {COAST_D.map((c) => (
          <path
            key={c.id}
            d={c.d}
            strokeWidth={px(1.4)}
            strokeLinejoin="round"
            opacity={strokeOpacity}
            {...strokeDrawProps(drawProgress)}
          />
        ))}
        <path
          d={INLAND_TICKS}
          strokeWidth={px(0.9)}
          opacity={strokeOpacity * 0.45 * drawProgress}
        />
      </g>
    );
  }
  return (
    <g data-id={geometryId} data-status={status}>
      <defs>
        <clipPath id="malvinas-clip">
          {MALVINAS_PATHS.map((p) => (
            <path key={p.id} d={p.d} />
          ))}
        </clipPath>
      </defs>
      <path
        d={HATCH_D}
        clipPath="url(#malvinas-clip)"
        fill="none"
        stroke={PALETTE.deepBlueSoft}
        strokeWidth={px(0.9)}
        opacity={fillOpacity}
      />
      {MALVINAS_PATHS.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill="none"
          stroke={PALETTE.deepBlueSoft}
          strokeWidth={px(1.1)}
          strokeDasharray={`${px(5)} ${px(3)}`}
          opacity={strokeOpacity}
        />
      ))}
    </g>
  );
};
