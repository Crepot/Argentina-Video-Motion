import React from "react";
import { LAYERS, type LayerId } from "../atlas/layers";
import { MasterAudio } from "../audio/MasterAudio";
import { benchmarkCameraPath } from "../camera/camera-paths";
import { CameraPath } from "../camera/CameraPath";
import { evaluateSmoothedCameraPath } from "../camera/evaluate-camera";
import { AtlasCanvas, WorldLayer } from "../components/AtlasCanvas";
import { MemoryLine } from "../components/MemoryLine";
import { PaperGrain } from "../components/PaperTexture";
import {
  GlobalFrameProvider,
  useGlobalFrame,
} from "../context/GlobalFrameProvider";
import { DebugOverlay } from "../debug/DebugOverlay";
import { PATH_REGISTRY } from "../paths/path-registry";
import {
  LabelsOverlay,
  WorldAboveMemoryLine,
  WorldBelowMemoryLine,
} from "../scenes/SceneLayerRouter";
import { LINE_PX } from "../theme/line-styles";
import { PALETTE } from "../theme/palette";
import {
  BENCHMARK,
  BENCHMARK_SCENES,
  blockAt,
  evaluateMemoryLine,
  sceneAt,
} from "../timeline/benchmark-timeline";
import { loadLocalFonts } from "../typography/fonts";
import type { CameraState } from "../types/camera";

loadLocalFonts();

/** Each parallax layer is registered at its reference frame (computed once). */
const LAYER_REFERENCES = Object.fromEntries(
  (Object.keys(LAYERS) as LayerId[]).map((id) => [
    id,
    evaluateSmoothedCameraPath(benchmarkCameraPath, LAYERS[id].referenceFrame),
  ]),
) as Record<LayerId, CameraState>;

const MEMORY_LINE_CUES = BENCHMARK_SCENES.flatMap((scene) => scene.pathCues);

export type BenchmarkProps = { debug: boolean };

const BenchmarkAtlas: React.FC<BenchmarkProps> = ({ debug }) => {
  const { globalFrame, localFrame } = useGlobalFrame();
  const memoryState = evaluateMemoryLine(globalFrame);
  return (
    <CameraPath spec={benchmarkCameraPath} globalFrame={globalFrame}>
      {(camera) => (
        <AtlasCanvas
          worldWidth={7680}
          worldHeight={4320}
          viewportWidth={1920}
          viewportHeight={1080}
          camera={camera}
          layerReferences={LAYER_REFERENCES}
          paperColor={PALETTE.paperCool}
          overlay={
            <>
              <LabelsOverlay />
              {debug ? (
                <DebugOverlay
                  globalFrame={globalFrame}
                  localFrame={localFrame}
                  camera={camera}
                  blockId={blockAt(globalFrame)}
                  sceneId={sceneAt(globalFrame)}
                />
              ) : null}
            </>
          }
        >
          <WorldBelowMemoryLine />
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
            />
          </WorldLayer>
          <WorldAboveMemoryLine />
          <PaperGrain screenGrainOpacity={0.016} />
        </AtlasCanvas>
      )}
    </CameraPath>
  );
};

/**
 * Benchmark-1722-2171: a 450-frame window of the master atlas. Local frame
 * 0 is global 1722; the master WAV plays 57.4 s ≤ t < 72.4 s.
 */
export const Benchmark1976Malvinas: React.FC<BenchmarkProps> = ({ debug }) => (
  <GlobalFrameProvider offset={BENCHMARK.globalStart}>
    <MasterAudio
      trimBefore={BENCHMARK.audioTrimBefore}
      trimAfter={BENCHMARK.audioTrimAfter}
    />
    <BenchmarkAtlas debug={debug} />
  </GlobalFrameProvider>
);
