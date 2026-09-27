import React from "react";
import { progress } from "../animation/interpolate-clamped";
import { strokeDrawProps } from "../animation/stroke-draw";
import type { CivicNode } from "../atlas/geometry/institutions";
import { PALETTE } from "../theme/palette";

/**
 * Authored absences (§9.13). Nodes dim or are removed at fixed frames; a
 * removal is a short masked erosion (a crisp wipe, no particles) and leaves an
 * exact empty coordinate ring that persists. No victims are depicted.
 */
export interface MissingNodeFieldProps {
  nodes: readonly CivicNode[];
  globalFrame: number;
  nodeOpacity: number;
  ringOpacity: number;
  nodeColor: string;
  px: (n: number) => number;
}

const EROSION_FRAMES = 10;

export const MissingNodeField: React.FC<MissingNodeFieldProps> = ({
  nodes,
  globalFrame: f,
  nodeOpacity,
  ringOpacity,
  nodeColor,
  px,
}) => (
  <g data-id="missingNodes">
    <defs>
      {nodes
        .filter((n) => n.removedAt)
        .map((n) => {
          const r = px(9);
          const e = progress(
            f,
            (n.removedAt as number) - 1,
            (n.removedAt as number) + EROSION_FRAMES - 1,
          );
          // Erosion wipes the node from its top edge down.
          return (
            <clipPath key={n.id} id={`erode-${n.id}`}>
              <rect
                x={n.p[0] - r}
                y={n.p[1] - r + 2 * r * e}
                width={2 * r}
                height={2 * r * (1 - e)}
              />
            </clipPath>
          );
        })}
    </defs>
    {nodes.map((n) => {
      const r = px(n.kind === "plaza" ? 8 : 7);
      // Authored frames are the first visibly changed frame.
      const dim = n.dimAt ? progress(f, n.dimAt - 1, n.dimAt + 11) : 0;
      const removal = n.removedAt
        ? progress(f, n.removedAt - 1, n.removedAt + EROSION_FRAMES - 1)
        : 0;
      const o = nodeOpacity * (1 - 0.72 * dim) * (1 - removal);
      const ringR = px(15);
      const tick = px(6);
      return (
        <g key={n.id} data-id={n.id}>
          {o > 0.002 ? (
            <circle
              cx={n.p[0]}
              cy={n.p[1]}
              r={r}
              fill={nodeColor}
              stroke={PALETTE.deepBlueSoft}
              strokeWidth={px(1.2)}
              opacity={o}
              clipPath={n.removedAt ? `url(#erode-${n.id})` : undefined}
            />
          ) : null}
          {n.removedAt && removal > 0 ? (
            <g
              fill="none"
              stroke={PALETTE.deepBlueSoft}
              strokeWidth={px(1.1)}
              opacity={ringOpacity}
            >
              <circle
                cx={n.p[0]}
                cy={n.p[1]}
                r={ringR}
                {...strokeDrawProps(removal)}
              />
              <path
                d={`M ${n.p[0] - ringR - tick} ${n.p[1]} h ${tick} M ${n.p[0] + ringR} ${n.p[1]} h ${tick} M ${n.p[0]} ${n.p[1] - ringR - tick} v ${tick} M ${n.p[0]} ${n.p[1] + ringR} v ${tick}`}
                opacity={removal}
              />
            </g>
          ) : null}
        </g>
      );
    })}
  </g>
);
