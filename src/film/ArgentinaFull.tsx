import React from "react";
import { LAYERS, type LayerId } from "../atlas/layers";
import { RigDefs } from "../actors/ActorRig2D";
import { MasterAudio } from "../audio/MasterAudio";
import { CameraPath } from "../camera/CameraPath";
import { AtlasCanvas, WorldLayer } from "../components/AtlasCanvas";
import { MemoryLine } from "../components/MemoryLine";
import { PaperGrain } from "../components/PaperTexture";
import { GlobalFrameProvider, useGlobalFrame } from "../context/GlobalFrameProvider";
import { PATH_REGISTRY } from "../paths/path-registry";
import { PropDefs } from "../stage/Props";
import { LINE_PX } from "../theme/line-styles";
import type { CameraPathSpec, CameraState } from "../types/camera";
import { loadLocalFonts } from "../typography/fonts";
import { FilmDefs } from "./draw/defs";
import { FilmPaperFibres } from "./draw/paper";
import { evaluateFilmCamera } from "./film-camera";
import { FILM_CAMERA, FILM_STAGES, evaluateFilmLine, paperAt, sceneLabelAt } from "./registry";
import { IDENTITY, localCamera, makeProjectorCache, toLocal } from "./space";
import { cameraTransform } from "../camera/evaluate-camera";
import type { FilmCtx, StageItem } from "./types";

loadLocalFonts();

export const FILM = {
  id: "Argentina-Full",
  durationInFrames: 3150,
  fps: 30,
  width: 1920,
  height: 1080,
} as const;

const cameraSpec: CameraPathSpec = {
  id: "camera.film",
  extrapolate: "clamp",
  keyframes: [
    { frame: 0, x: 0, y: 0, zoom: 1, rotation: 0, easeToNext: "atlasDrift" },
    { frame: 3149, x: 0, y: 0, zoom: 1, rotation: 0, easeToNext: "atlasDrift" },
  ],
};

const evaluate = (f: number) => evaluateFilmCamera(FILM_CAMERA, f);

const layerRefs = (camera: CameraState) =>
  Object.fromEntries((Object.keys(LAYERS) as LayerId[]).map((id) => [id, camera])) as Record<LayerId, CameraState>;

const active = (f: number) => FILM_STAGES.filter((s) => f >= s.from && f <= s.to);

const FilmItems: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => {
  const proj = makeProjectorCache(camera);
  const ctx: FilmCtx = {
    f,
    camera,
    proj,
    onScreen: (pl, x, y, depth = 1, margin = 300) => {
      const s = proj(pl, depth).point(x, y, 0);
      return s[0] > -margin && s[0] < 1920 + margin && s[1] > -margin && s[1] < 1080 + margin * 2;
    },
  };
  const stages = active(f).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const mid: StageItem[] = [];
  const fg: StageItem[] = [];
  for (const s of stages) {
    if (!s.items) {
      continue;
    }
    const items = s.items(ctx);
    const sorted = [...items].sort((a, b) => (a.depth === b.depth ? a.y - b.y : a.depth - b.depth));
    for (const it of sorted) {
      (it.depth > 1 ? fg : mid).push({ ...it, key: `${s.id}.${it.key}` });
    }
  }
  fg.sort((a, b) => (a.depth === b.depth ? a.y - b.y : a.depth - b.depth));
  return (
    <>
      <g data-plane="midground">
        {mid.map((i) => (
          <React.Fragment key={i.key}>{i.node}</React.Fragment>
        ))}
      </g>
      <g data-plane="foreground">
        {fg.map((i) => (
          <React.Fragment key={i.key}>{i.node}</React.Fragment>
        ))}
      </g>
    </>
  );
};

const DebugHud: React.FC<{ f: number; camera: CameraState }> = ({ f, camera }) => (
  <div
    style={{
      position: "absolute",
      left: 12,
      top: 8,
      font: "14px monospace",
      color: "#C4453A",
      whiteSpace: "pre",
    }}
  >
    {`f ${f}  ${sceneLabelAt(f)}\nx ${camera.x.toFixed(0)} y ${camera.y.toFixed(0)} z ${camera.zoom.toFixed(3)} tilt ${(camera.tilt ?? 0).toFixed(1)} rot ${camera.rotation.toFixed(1)}`}
  </div>
);

const FilmAtlas: React.FC<{ debug: boolean }> = ({ debug }) => {
  const { globalFrame: f } = useGlobalFrame();
  const line = evaluateFilmLine(f);
  const lineSheet = line.sheet ?? IDENTITY;
  const linePoints = line.sheet ? line.points.map((q) => toLocal(lineSheet, q)) : line.points;
  const paper = paperAt(f);
  return (
    <CameraPath spec={cameraSpec} globalFrame={f} evaluate={evaluate}>
      {(camera) => {
        const stages = active(f);
        return (
          <AtlasCanvas
            worldWidth={7680}
            worldHeight={4320}
            viewportWidth={1920}
            viewportHeight={1080}
            camera={camera}
            layerReferences={layerRefs(camera)}
            paperColor={paper}
            overlay={
              <>
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  {stages.map((s) => (s.Overlay ? <s.Overlay key={s.id} f={f} camera={camera} /> : null))}
                </div>
                {debug ? <DebugHud f={f} camera={camera} /> : null}
              </>
            }
          >
            <RigDefs />
            <PropDefs />
            <FilmDefs />
            <WorldLayer layer="cartography">
              <FilmPaperFibres camera={camera} />
            </WorldLayer>
            {stages.map((s) => (s.Ground ? <s.Ground key={s.id} f={f} camera={camera} /> : null))}
            <g data-layer="memoryLine" transform={cameraTransform(localCamera(camera, lineSheet))}>
              {/* The one and only instance of memoryLine.main (§5.1). */}
              <MemoryLine
                key="memoryLine.main"
                pathId="memoryLine.main"
                globalFrame={f}
                registry={PATH_REGISTRY}
                cues={[]}
                state={{ morph: { m1: 0, m2: 0, m3: 0, m4: 0 }, ranges: line.ranges, head: line.head }}
                points={linePoints}
                unitScale={lineSheet.k}
                core={line.core}
                strokeWidthPx={LINE_PX.memoryLine}
                screenSpaceStroke
              />
            </g>
            <FilmItems f={f} camera={camera} />
            <PaperGrain screenGrainOpacity={0.016} />
          </AtlasCanvas>
        );
      }}
    </CameraPath>
  );
};

/** ARGENTINA — A HISTORY DRAWN IN LINES. Full film, 3150 frames, master audio from frame 0. */
export const ArgentinaFull: React.FC<{ debug: boolean }> = ({ debug }) => (
  <GlobalFrameProvider offset={0}>
    <MasterAudio />
    <FilmAtlas debug={debug} />
  </GlobalFrameProvider>
);
