import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ActorRig2D, RigDefs } from "../actors/ActorRig2D";
import {
  cheerPose,
  commandGesturePose,
  divePose,
  gaitPose,
  guardPose,
  kickPose,
  liftPose,
} from "../actors/rig/poses";
import { BUILDS, WARDROBES, type WardrobeId } from "../actors/rig/wardrobe";
import type { Pose } from "../actors/rig/skeleton";
import { PALETTE } from "../theme/palette";

/** Development sheet: every wardrobe/pose of the V2 rig system (not editorial). */
const ROWS: { w: WardrobeId; pose: (f: number) => Pose; build?: keyof typeof BUILDS; facing?: 1 | -1 }[] = [
  { w: "army1976", pose: (f) => gaitPose(f / 16, "march") },
  { w: "riot1976", pose: (f) => guardPose(f / 90) },
  { w: "officer1976", pose: (f) => gaitPose(f / 18, "walk") },
  { w: "generalVidela", build: "gaunt", pose: (f) => commandGesturePose((f % 60) / 60, f / 90) },
  { w: "civilianCoat", pose: (f) => gaitPose(f / 18, "retreat"), facing: -1 },
  { w: "civilianWoman", pose: (f) => gaitPose(f / 20, "walk"), facing: -1 },
  { w: "footballArgentina", build: "athlete", pose: (f) => gaitPose(f / 12, "run") },
  { w: "footballArgentina", build: "athlete", pose: (f) => kickPose((f % 30) / 30) },
  { w: "footballOpponent", pose: (f) => gaitPose(f / 13, "jog"), facing: -1 },
  { w: "goalkeeper", pose: (f) => divePose((f % 40) / 40) },
  { w: "footballArgentina", pose: (f) => cheerPose(f / 20, 1) },
  { w: "footballArgentina", build: "sturdy", pose: (f) => liftPose(1, f / 60) },
  { w: "soldierMalvinas", pose: (f) => gaitPose(f / 22, "wind") },
];

export const RigLab: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = 2.3;
  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.paperCool }}>
      <svg width={1920} height={1080}>
        <RigDefs />
        {ROWS.map((r, i) => {
          const col = i % 7;
          const row = Math.floor(i / 7);
          const x = 150 + col * 265;
          const y = 470 + row * 480;
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${scale * (r.facing ?? 1)} ${scale})`}>
              <line x1={-40} x2={40} y1={0} y2={0} stroke={PALETTE.grayBlue} strokeWidth={0.5} />
              <ActorRig2D
                uid={`lab-${i}`}
                pose={r.pose(frame)}
                build={BUILDS[r.build ?? "standard"]}
                wardrobe={WARDROBES[r.w]}
                detail="hero"
                pxPerUnit={scale}
                held={i === 11 ? "trophy" : null}
                heldGold={0.8}
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
