import React from "react";
import { mixColor, PALETTE } from "../theme/palette";
import { billboardMatrix, type Projector } from "../stage/projection";
import { ActorRig2D } from "./ActorRig2D";
import { evaluateActor, type ActorFrame, type ActorTrack } from "./action-track";
import { BUILDS, WARDROBES } from "./rig/wardrobe";

import { perspectiveAt } from "./perspective";
import { HorseRig, SADDLE } from "./HorseRig";
import { solveJoints } from "./rig/skeleton";

export interface PlacedActor {
  track: ActorTrack;
  frame: ActorFrame;
  sy: number;
}

/** Evaluate + project + depth-sort (far first). */
export const placeActors = (
  tracks: readonly ActorTrack[],
  f: number,
  projectors: (depth: number) => Projector,
): PlacedActor[] =>
  tracks
    .map((track) => {
      const frame = evaluateActor(track, f);
      const p = projectors(track.depth ?? 1);
      return { track, frame, sy: p.point(frame.x, frame.y)[1] };
    })
    .filter((a) => a.frame.visible)
    .sort((a, b) =>
      (a.track.depth ?? 1) === (b.track.depth ?? 1)
        ? a.sy - b.sy
        : (a.track.depth ?? 1) - (b.track.depth ?? 1),
    );

/** Ground mark an actor rises from / folds into (a map node). */
const GroundMark: React.FC<{
  p: Projector;
  x: number;
  y: number;
  r: number;
  opacity: number;
  color: string;
}> = ({ p, x, y, r, opacity, color }) => {
  const c = p.point(x, y);
  return (
    <ellipse
      cx={c[0]}
      cy={c[1]}
      rx={r * p.zoom}
      ry={r * p.zoom * Math.max(0.25, p.squash)}
      fill="none"
      stroke={color}
      strokeWidth={1.3}
      opacity={opacity}
    />
  );
};

export const ActorView: React.FC<{
  placed: PlacedActor;
  projector: Projector;
  /** Bars an absorbed figure hands its verticals to (screen px). */
  barColor?: string;
}> = ({ placed, projector: p, barColor = PALETTE.deepBlueSoft }) => {
  const { track, frame } = placed;
  const persp = perspectiveAt(p, placed.sy);
  const s = track.scale * persp;
  const px = p.zoom * s;
  const rise = frame.rise;
  const wardrobe = WARDROBES[track.wardrobe];
  const heightK = Math.max(0.0001, rise);
  const m = billboardMatrix(p, frame.x, frame.y, s, frame.facing, track.lift ?? 0);
  const mark = rise < 0.999;
  const absorb = frame.absorb;
  return (
    <g data-actor={track.id} opacity={frame.opacity}>
      {/* Contact shadow: grounds the figure on the paper. */}
      <GroundMark
        p={p}
        x={frame.x}
        y={frame.y}
        r={11 * s}
        opacity={0.1 * rise}
        color={PALETTE.deepBlue}
      />
      {mark ? (
        <GroundMark
          p={p}
          x={frame.x}
          y={frame.y}
          r={5 * s}
          opacity={(1 - rise) * 0.8}
          color={mixColor(PALETTE.deepBlueSoft, PALETTE.skyBlue, 0.3)}
        />
      ) : null}
      {rise > 0.02 ? (
        <g transform={m}>
          <g transform={`scale(1 ${heightK.toFixed(4)})`} opacity={1 - absorb * 0.92}>
            {track.mount ? (
              <HorseRig
                phase={frame.dist / (150 * track.scale)}
                gait={Math.min(1, frame.speed / (1.2 * track.scale))}
                coat={track.mount.coat}
                kind={track.mount.kind}
                pxPerUnit={px}
                tone={track.tone ?? 0}
                detail={track.detail}
              />
            ) : null}
            <g
              transform={
                track.mount
                  ? (() => {
                      const pel = solveJoints(frame.pose, BUILDS[track.build ?? "standard"]).pelvis;
                      return `translate(${(SADDLE[0] - pel[0]).toFixed(2)} ${(SADDLE[1] - pel[1]).toFixed(2)})`;
                    })()
                  : undefined
              }
            >
            {track.mount?.riderless ? (
              track.mount.pack ? (
                <g>
                  <rect x={-24} y={-78} width={38} height={24} rx={4} fill={mixColor(PALETTE.paperWarm, PALETTE.grayBlue, 0.45)} stroke={PALETTE.deepBlue} strokeWidth={1 / px} />
                  <path d={`M -24 -66 H 14 M -5 -78 V -54`} stroke={PALETTE.deepBlue} strokeWidth={0.8 / px} />
                </g>
              ) : null
            ) : (
            <ActorRig2D
              uid={track.id.replace(/[^a-zA-Z0-9-]/g, "_")}
              pose={frame.pose}
              build={BUILDS[track.build ?? "standard"]}
              wardrobe={wardrobe}
              detail={track.detail}
              pxPerUnit={px}
              tone={track.tone ?? 0}
              clothPhase={frame.clothPhase}
              held={frame.held}
              heldGold={frame.held ? 0.85 : 0}
            />
            )}
            </g>
          </g>
          {absorb > 0.001 ? <AbsorbBars absorb={absorb} color={barColor} px={px} /> : null}
        </g>
      ) : null}
    </g>
  );
};

/**
 * SilhouetteToGeometryBridge for a standing figure: its structural verticals
 * (cap edges, shoulders, legs) extend into rigid parallel control bars.
 */
const BAR_X = [-9, -4.5, 0.5, 5, 9.5] as const;
const AbsorbBars: React.FC<{ absorb: number; color: string; px: number }> = ({
  absorb,
  color,
  px,
}) => {
  const grow = Math.min(1, absorb * 1.4);
  const top = -112 - 240 * grow;
  const bottom = 4 + 26 * grow;
  return (
    <g stroke={color} strokeLinecap="butt">
      {BAR_X.map((x, i) => (
        <path
          key={x}
          d={`M ${x} ${bottom} V ${top + i * 7}`}
          strokeWidth={(1.9 + (i % 2) * 0.6) / px}
          opacity={Math.min(1, absorb * 2) * 0.8}
        />
      ))}
    </g>
  );
};

export const ActorLayer: React.FC<{
  placed: readonly PlacedActor[];
  projectors: (depth: number) => Projector;
  filter?: (a: PlacedActor) => boolean;
}> = ({ placed, projectors, filter }) => (
  <g>
    {placed
      .filter((a) => (filter ? filter(a) : true))
      .map((a) => (
        <ActorView key={a.track.id} placed={a} projector={projectors(a.track.depth ?? 1)} />
      ))}
  </g>
);
