import React from "react";
import { usePx } from "../camera/CameraPath";
import {
  pointAndAngleAt,
  polylineToPath,
  sampleRange,
} from "../paths/interpolate-path";
import { memoryLineGeometry, mergeRanges } from "../paths/path-visibility";
import type { PathRegistry } from "../paths/path-registry";
import { PALETTE } from "../theme/palette";
import type { GlobalFrame } from "../types/branded-frames";
import type { PathStateCue, Point } from "../types/paths";
import type { MemoryLineFrame } from "../timeline/benchmark-timeline";

/**
 * memoryLine.main (§5, §9.7). Mounted exactly once by the composition, above
 * every scene layer; it never unmounts at a scene boundary and never receives
 * a raw `d` from a scene. Scenes only declare cues; this component morphs the
 * 96-sample geometry, applies visible ranges (gaps are masks of visibility,
 * never deleted points) and draws the route head.
 */
export interface MemoryLineProps {
  pathId: "memoryLine.main";
  globalFrame: GlobalFrame;
  registry: PathRegistry;
  cues: readonly PathStateCue[];
  state: MemoryLineFrame;
  strokeWidthPx: number;
  debug?: boolean;
  /**
   * V2 (tilted camera): stroke width and dashes in screen pixels via
   * non-scaling-stroke, so the ground foreshortening never thins the line.
   */
  screenSpaceStroke?: boolean;
  /**
   * Full film: the geometry of the current era, already evaluated by the
   * film memory-line evaluator (same 96-sample topology). When omitted the
   * benchmark state machine (`state.morph`) supplies it.
   */
  points?: readonly Point[];
  /** Earned gold core drawn inside the line (storyboard §A: milestones only). */
  core?: readonly { start: number; end: number; opacity: number }[];
  /** World units per drawing unit when drawn inside a scaled sheet. */
  unitScale?: number;
}

export const MemoryLine: React.FC<MemoryLineProps> = ({
  pathId,
  globalFrame,
  state,
  strokeWidthPx,
  debug,
  screenSpaceStroke = false,
  points,
  core,
  unitScale = 1,
}) => {
  const pxW = usePx();
  const px = (n: number) => pxW(n) / unitScale;
  const sw = screenSpaceStroke ? (n: number) => n : px;
  const pts = points ?? memoryLineGeometry(state.morph);
  const ranges = mergeRanges(state.ranges);
  const head = state.head ? pointAndAngleAt(pts, state.head.s) : null;
  return (
    <g data-id={pathId} data-frame={globalFrame}>
      {ranges.map((r, i) => (
        <path
          // Keys are positional: the set of ranges is stable within a block.
          key={i}
          d={polylineToPath(sampleRange(pts, r.start, r.end))}
          fill="none"
          stroke={r.color}
          strokeWidth={sw(strokeWidthPx)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={
            r.dash ? `${sw(r.dash[0])} ${sw(r.dash[1])}` : undefined
          }
          vectorEffect={screenSpaceStroke ? "non-scaling-stroke" : undefined}
          opacity={r.opacity}
        />
      ))}
      {core?.map((c, i) =>
        c.opacity > 0.002 && c.end > c.start ? (
          <path
            key={`core${i}`}
            d={polylineToPath(sampleRange(pts, c.start, c.end))}
            fill="none"
            stroke={PALETTE.goldMuted}
            strokeWidth={sw(strokeWidthPx * 0.42)}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect={screenSpaceStroke ? "non-scaling-stroke" : undefined}
            opacity={c.opacity}
          />
        ) : null,
      )}
      {head && state.head && state.head.opacity > 0.002 ? (
        <g opacity={state.head.opacity}>
          <circle
            cx={head.p[0]}
            cy={head.p[1]}
            r={px(4.2)}
            fill={PALETTE.paperCool}
            stroke={PALETTE.skyBlue}
            strokeWidth={px(1.8)}
          />
          <path
            d={`M ${head.p[0]} ${head.p[1]} l ${Math.cos(head.angle) * px(14)} ${Math.sin(head.angle) * px(14)}`}
            stroke={PALETTE.deepBlueSoft}
            strokeWidth={px(1.2)}
            opacity={0.6}
          />
        </g>
      ) : null}
      {debug ? <MemoryLineDebug pts={pts} px={px} /> : null}
    </g>
  );
};

const MemoryLineDebug: React.FC<{
  pts: readonly Point[];
  px: (n: number) => number;
}> = ({ pts, px }) => (
  <g>
    {pts.map((p, i) => (
      <circle
        key={i}
        cx={p[0]}
        cy={p[1]}
        r={px(i % 10 === 0 ? 3.5 : 2)}
        fill={i % 10 === 0 ? "#C4453A" : "#E08A3A"}
      />
    ))}
  </g>
);
