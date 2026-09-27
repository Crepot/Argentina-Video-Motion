import React from "react";
import { lerp } from "../animation/interpolate-clamped";
import { strokeDrawProps } from "../animation/stroke-draw";
import {
  BOWL_RINGS,
  centerLockToCircle,
  ellipsePoint,
  GOAL_HALF,
  gridY,
  lerpEllipse,
  type MorphSegment,
  PENALTY_ARC,
  PENALTY_SPOT,
  PITCH,
  PITCH_SEGMENTS,
} from "../atlas/geometry/stadium";
import { polylineToPath } from "../paths/interpolate-path";
import type { Point } from "../types/paths";

/**
 * Parametric pitch + stadium bowl (§9.10). Every line starts as a segment of
 * the controlled grid's surviving cell and ends as pitch geometry: nothing is
 * crossfaded. The bowl rings start as horizontal grid lines, close into
 * rings, then stretch into South Atlantic isobars with the memory line.
 */
export interface FootballPitchProps {
  geometryId: "pitch1978";
  /** Grid cell → pitch guide (0.92 at 1907, 1 at 1908). */
  constructionProgress: number;
  /** Pitch-only details born at 1908: spots, arcs, goals. */
  detailProgress: number;
  /** Flat grid lines → closed bowl rings. */
  stadiumProgress: number;
  crowdIntensity: number;
  contextOpacity: number;
  lineOpacity: number;
  lineColor: string;
  lineWidth: number;
  /** Seed-cell centre lock marker (institutional lock) visibility. */
  lockOpacity: number;
  fadeByGroup: Record<MorphSegment["fadeGroup"], number>;
  fillColor: string;
  fillOpacity: number;
  ringColor: string;
  ringOpacity: number;
  ringWidth: number;
  transitionToIsobarProgress: number;
}

const segmentPath = (s: MorphSegment, t: number) => {
  const a: Point = [
    lerp(s.grid[0][0], s.pitch[0][0], t),
    lerp(s.grid[0][1], s.pitch[0][1], t),
  ];
  const b: Point = [
    lerp(s.grid[1][0], s.pitch[1][0], t),
    lerp(s.grid[1][1], s.pitch[1][1], t),
  ];
  return `M ${a[0].toFixed(2)} ${a[1].toFixed(2)} L ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
};

const RING_SAMPLES = 64;

/** Upper/lower halves of a bowl ring at the given morph states. */
const ringHalves = (
  ring: (typeof BOWL_RINGS)[number],
  stadiumProgress: number,
  isobarProgress: number,
): [Point[], Point[]] => {
  const e = lerpEllipse(ring.stadium, ring.isobar, isobarProgress);
  const upper: Point[] = [];
  const lower: Point[] = [];
  for (let i = 0; i <= RING_SAMPLES; i++) {
    const u = i / RING_SAMPLES;
    const flatX = ring.stadium.cx - ring.stadium.rx + 2 * ring.stadium.rx * u;
    const up = ellipsePoint(e, 180 + 180 * u);
    const lo = ellipsePoint(e, 180 - 180 * u);
    upper.push([
      lerp(flatX, up[0], stadiumProgress),
      lerp(gridY(ring.upperGridJ), up[1], stadiumProgress),
    ]);
    lower.push([
      lerp(flatX, lo[0], stadiumProgress),
      lerp(gridY(ring.lowerGridJ), lo[1], stadiumProgress),
    ]);
  }
  return [upper, lower];
};

const cornerArc = (cx: number, cy: number, sx: number, sy: number, r: number) =>
  `M ${cx + sx * r} ${cy} A ${r} ${r} 0 0 ${sx * sy > 0 ? 1 : 0} ${cx} ${cy + sy * r}`;

export const FootballPitch: React.FC<FootballPitchProps> = ({
  constructionProgress: t,
  detailProgress,
  stadiumProgress,
  contextOpacity,
  lineOpacity,
  lineColor,
  lineWidth,
  lockOpacity,
  fadeByGroup,
  fillColor,
  fillOpacity,
  ringColor,
  ringOpacity,
  ringWidth,
  transitionToIsobarProgress,
}) => {
  const [cx, cy] = PITCH.center;
  const circle = centerLockToCircle(t);
  const detail = detailProgress;
  const spotR = 2.6;
  return (
    <g data-id="pitch1978" opacity={contextOpacity}>
      {fillOpacity > 0.001 ? (
        <g opacity={fillOpacity}>
          <rect
            x={PITCH.left}
            y={PITCH.top}
            width={PITCH.width}
            height={PITCH.height}
            fill={fillColor}
            opacity={0.55}
          />
          {/* Mowing bands: the grid's own modules, alternating. */}
          {[0, 2].map((k) => (
            <rect
              key={k}
              x={PITCH.left + k * (PITCH.width / 4)}
              y={PITCH.top}
              width={PITCH.width / 4}
              height={PITCH.height}
              fill={fillColor}
              opacity={0.45}
            />
          ))}
        </g>
      ) : null}

      {BOWL_RINGS.map((ring) => {
        const [upper, lower] = ringHalves(
          ring,
          stadiumProgress,
          transitionToIsobarProgress,
        );
        return (
          <path
            key={ring.id}
            data-id={`stadium.${ring.id}`}
            d={`${polylineToPath(upper)} ${polylineToPath(lower)}`}
            fill="none"
            stroke={ringColor}
            strokeWidth={ringWidth}
            strokeLinecap="butt"
            opacity={ringOpacity}
          />
        );
      })}

      <g
        stroke={lineColor}
        strokeWidth={lineWidth}
        fill="none"
        strokeLinecap="square"
        opacity={lineOpacity}
      >
        {PITCH_SEGMENTS.map((s) => (
          <path
            key={s.id}
            data-id={`pitch.${s.id}`}
            d={segmentPath(s, t)}
            opacity={fadeByGroup[s.fadeGroup]}
          />
        ))}
        <path
          data-id="pitch.centreCircle"
          d={`${polylineToPath(circle)} Z`}
          opacity={lerp(lockOpacity, 1, t) * fadeByGroup.halfway}
        />
        {detail > 0 ? (
          <g opacity={fadeByGroup.box}>
            <path
              d={`M ${PITCH.left + PENALTY_SPOT + PENALTY_ARC.radius * Math.cos(-PENALTY_ARC.halfAngle)} ${cy + PENALTY_ARC.radius * Math.sin(-PENALTY_ARC.halfAngle)} A ${PENALTY_ARC.radius} ${PENALTY_ARC.radius} 0 0 1 ${PITCH.left + PENALTY_SPOT + PENALTY_ARC.radius * Math.cos(PENALTY_ARC.halfAngle)} ${cy + PENALTY_ARC.radius * Math.sin(PENALTY_ARC.halfAngle)}`}
              {...strokeDrawProps(detail)}
            />
            <path
              d={`M ${PITCH.right - PENALTY_SPOT - PENALTY_ARC.radius * Math.cos(-PENALTY_ARC.halfAngle)} ${cy + PENALTY_ARC.radius * Math.sin(-PENALTY_ARC.halfAngle)} A ${PENALTY_ARC.radius} ${PENALTY_ARC.radius} 0 0 0 ${PITCH.right - PENALTY_SPOT - PENALTY_ARC.radius * Math.cos(PENALTY_ARC.halfAngle)} ${cy + PENALTY_ARC.radius * Math.sin(PENALTY_ARC.halfAngle)}`}
              {...strokeDrawProps(detail)}
            />
            <path
              d={[
                cornerArc(PITCH.left, PITCH.top, 1, 1, 7),
                cornerArc(PITCH.right, PITCH.top, -1, 1, 7),
                cornerArc(PITCH.left, PITCH.bottom, 1, -1, 7),
                cornerArc(PITCH.right, PITCH.bottom, -1, -1, 7),
              ].join(" ")}
              opacity={detail}
            />
            <path
              d={`M ${PITCH.left} ${cy - GOAL_HALF} H ${PITCH.left - 10} V ${cy + GOAL_HALF} H ${PITCH.left} M ${PITCH.right} ${cy - GOAL_HALF} H ${PITCH.right + 10} V ${cy + GOAL_HALF} H ${PITCH.right}`}
              {...strokeDrawProps(detail)}
            />
            <g fill={lineColor} stroke="none" opacity={detail}>
              <circle cx={cx} cy={cy} r={spotR} />
              <circle cx={PITCH.left + PENALTY_SPOT} cy={cy} r={spotR} />
              <circle cx={PITCH.right - PENALTY_SPOT} cy={cy} r={spotR} />
            </g>
          </g>
        ) : null}
      </g>
    </g>
  );
};
