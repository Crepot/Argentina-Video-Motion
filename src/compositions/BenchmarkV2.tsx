import React from "react";
import { LAYERS, type LayerId } from "../atlas/layers";
import { MasterAudio } from "../audio/MasterAudio";
import { CAMERA_V2_KEYS, evaluateCameraV2 } from "../camera/camera-paths-v2";
import { CameraPath } from "../camera/CameraPath";
import { AtlasCanvas, WorldLayer } from "../components/AtlasCanvas";
import { MemoryLine } from "../components/MemoryLine";
import { PaperGrain } from "../components/PaperTexture";
import { GlobalFrameProvider, useGlobalFrame } from "../context/GlobalFrameProvider";
import { DebugOverlay } from "../debug/DebugOverlay";
import { PATH_REGISTRY } from "../paths/path-registry";
import {
  LabelsOverlayV2,
  WorldAboveMemoryLineV2,
  WorldBelowMemoryLineV2,
} from "../scenes/v2/SceneRouterV2";
import { LINE_PX } from "../theme/line-styles";
import { PALETTE } from "../theme/palette";
import { BENCHMARK_SCENES, evaluateMemoryLine } from "../timeline/benchmark-timeline";
import { BENCHMARK_V2, shotAt } from "../timeline/benchmark-v2-timeline";
import { loadLocalFonts } from "../typography/fonts";
import type { CameraPathSpec, CameraState } from "../types/camera";

loadLocalFonts();

/** Declarative form of the V2 camera (validated; evaluated by channel). */
export const benchmarkV2CameraSpec: CameraPathSpec = {
  id: "camera.benchmark.v2.1722-2171",
  extrapolate: "clamp",
  keyframes: CAMERA_V2_KEYS.map((k) => ({
    frame: k.f,
    x: k.x,
    y: k.y,
    zoom: k.zoom,
    rotation: k.rot,
    easeToNext: "atlasDrift" as const,
  })),
};

const LAYER_REFERENCES_V2 = Object.fromEntries(
  (Object.keys(LAYERS) as LayerId[]).map((id) => [id, evaluateCameraV2(LAYERS[id].referenceFrame)]),
) as Record<LayerId, CameraState>;

const MEMORY_LINE_CUES = BENCHMARK_SCENES.flatMap((scene) => scene.pathCues);

export type BenchmarkV2Props = { debug: boolean };

const BenchmarkAtlasV2: React.FC<BenchmarkV2Props> = ({ debug }) => {
  const { globalFrame, localFrame } = useGlobalFrame();
  const memoryState = evaluateMemoryLine(globalFrame);
  return (
    <CameraPath spec={benchmarkV2CameraSpec} globalFrame={globalFrame} evaluate={evaluateCameraV2}>
      {(camera) => (
        <AtlasCanvas
          worldWidth={7680}
          worldHeight={4320}
          viewportWidth={1920}
          viewportHeight={1080}
          camera={camera}
          layerReferences={LAYER_REFERENCES_V2}
          paperColor={PALETTE.paperCool}
          overlay={
            <>
              <LabelsOverlayV2 />
              {debug ? (
                <DebugOverlay
                  globalFrame={globalFrame}
                  localFrame={localFrame}
                  camera={camera}
                  blockId={shotAt(globalFrame)}
                  sceneId={`tilt ${(camera.tilt ?? 0).toFixed(1)}°`}
                />
              ) : null}
            </>
          }
        >
          <WorldBelowMemoryLineV2 />
          <WorldLayer layer="memoryLine">
            {/* The one and only instance of memoryLine.main (§5.1). */}
            <MemoryLine
              key="memoryLine.main"
              pathId="memoryLine.main"
              globalFrame={globalFrame}
              registry={PATH_REGISTRY}
              cues={MEMORY_LINE_CUES}
              state={memoryState}
              strokeWidthPx={LINE_PX.memoryLine}
              debug={debug}
              screenSpaceStroke
            />
          </WorldLayer>
          <WorldAboveMemoryLineV2 />
          <PaperGrain screenGrainOpacity={0.016} />
        </AtlasCanvas>
      )}
    </CameraPath>
  );
};

/**
 * Benchmark-V2-1722-2171: same 450-frame window, audio and anchors as V1,
 * rebuilt visual direction (people, depth, action, transformation).
 */
export const BenchmarkV2: React.FC<BenchmarkV2Props> = ({ debug }) => (
  <GlobalFrameProvider offset={BENCHMARK_V2.globalStart}>
    <MasterAudio trimBefore={BENCHMARK_V2.audioTrimBefore} trimAfter={BENCHMARK_V2.audioTrimAfter} />
    <BenchmarkAtlasV2 debug={debug} />
  </GlobalFrameProvider>
);
