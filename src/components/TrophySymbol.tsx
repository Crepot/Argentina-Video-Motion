import React from "react";
import { strokeDrawProps } from "../animation/stroke-draw";
import { GOAL_EAST, TROPHY } from "../atlas/geometry/stadium";
import { PALETTE } from "../theme/palette";

/**
 * Simplified, original 1978 trophy (§9, storyboard Scene 11): drawn from its
 * vertical axis, gold but not radiant, bounded by the pitch. Plus the single
 * goal-impact ring. Matte fills only; no glow.
 */
export interface TrophySymbolProps {
  ghostOpacity: number;
  bodyDraw: number;
  fillOpacity: number;
  goldOpacity: number;
  ringRadius: number;
  ringOpacity: number;
  strokeWidth: number;
}

export const TrophySymbol: React.FC<TrophySymbolProps> = ({
  ghostOpacity,
  bodyDraw,
  fillOpacity,
  goldOpacity,
  ringRadius,
  ringOpacity,
  strokeWidth,
}) => (
  <g data-id="trophy1978">
    {ghostOpacity > 0.001 ? (
      <g
        fill="none"
        stroke={PALETTE.deepBlueSoft}
        strokeWidth={strokeWidth * 0.6}
        opacity={ghostOpacity}
      >
        <path d={TROPHY.base} />
        <path d={TROPHY.body} />
        <circle cx={TROPHY.globe.cx} cy={TROPHY.globe.cy} r={TROPHY.globe.r} />
      </g>
    ) : null}
    {goldOpacity > 0.001 && bodyDraw > 0 ? (
      <g opacity={goldOpacity}>
        <defs>
          <clipPath id="trophy-body">
            <path d={TROPHY.bodyFill} />
            <circle
              cx={TROPHY.globe.cx}
              cy={TROPHY.globe.cy}
              r={TROPHY.globe.r}
            />
          </clipPath>
        </defs>
        {/* Matte gold: a faint tint plus an engraved hatch, never a solid blob. */}
        <path
          d={TROPHY.bodyFill}
          fill={PALETTE.goldLight}
          opacity={fillOpacity * 0.28}
        />
        <path
          d={TROPHY.hatch}
          clipPath="url(#trophy-body)"
          fill="none"
          stroke={PALETTE.goldMuted}
          strokeWidth={strokeWidth * 0.34}
          opacity={fillOpacity}
        />
        <g
          fill="none"
          stroke={PALETTE.goldMuted}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={TROPHY.base} {...strokeDrawProps(bodyDraw)} />
          <path d={TROPHY.body} {...strokeDrawProps(bodyDraw)} />
          <path
            d={TROPHY.spiral}
            strokeWidth={strokeWidth * 0.55}
            {...strokeDrawProps(Math.max(0, bodyDraw * 1.4 - 0.4))}
          />
          <circle
            cx={TROPHY.globe.cx}
            cy={TROPHY.globe.cy}
            r={TROPHY.globe.r}
            {...strokeDrawProps(Math.max(0, bodyDraw * 1.25 - 0.25))}
          />
          {/* Globe meridian and equator: the trophy already speaks in coordinates. */}
          <path
            d={`M ${TROPHY.globe.cx - TROPHY.globe.r} ${TROPHY.globe.cy} H ${TROPHY.globe.cx + TROPHY.globe.r} M ${TROPHY.globe.cx} ${TROPHY.globe.cy - TROPHY.globe.r} C ${TROPHY.globe.cx + 12} ${TROPHY.globe.cy - 10}, ${TROPHY.globe.cx + 12} ${TROPHY.globe.cy + 10}, ${TROPHY.globe.cx} ${TROPHY.globe.cy + TROPHY.globe.r}`}
            strokeWidth={strokeWidth * 0.55}
            opacity={Math.max(0, bodyDraw * 2 - 1)}
          />
        </g>
      </g>
    ) : null}
    {ringOpacity > 0.001 ? (
      <circle
        data-id="goalImpactRing"
        cx={GOAL_EAST[0]}
        cy={GOAL_EAST[1]}
        r={ringRadius}
        fill="none"
        stroke={PALETTE.goldMuted}
        strokeWidth={strokeWidth * 0.8}
        opacity={ringOpacity}
      />
    ) : null}
  </g>
);

/**
 * The trophy's vertical axis. Lives on the cartographic layer (factor 1) so
 * that, once extended, it registers exactly on meridian 73°W (§8.14).
 */
export const TrophyAxis: React.FC<{
  draw: number;
  extend: number;
  opacity: number;
  gold: number;
  strokeWidth: number;
  top: number;
  bottom: number;
}> = ({ draw, extend, opacity, gold, strokeWidth, top, bottom }) => {
  if (draw <= 0) {
    return null;
  }
  const [a, b] = TROPHY.axis;
  const y0 = a[1] + (bottom - a[1]) * extend;
  const y1 = b[1] + (top - b[1]) * extend;
  const color = gold > 0.5 ? PALETTE.goldMuted : PALETTE.deepBlueSoft;
  return (
    <path
      data-id="trophy1978.axis→meridian73W"
      d={`M ${a[0]} ${y0} L ${b[0]} ${y1}`}
      stroke={color}
      strokeWidth={strokeWidth}
      opacity={opacity}
      {...strokeDrawProps(draw)}
    />
  );
};
