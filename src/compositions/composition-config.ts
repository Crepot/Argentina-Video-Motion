import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH, FPS } from "../atlas/atlas-constants";
import { BENCHMARK } from "../timeline/benchmark-timeline";

/** Locked composition metadata (§0 constants). */
export const COMPOSITION = {
  width: VIEWPORT_WIDTH,
  height: VIEWPORT_HEIGHT,
  fps: FPS,
  masterFrames: 3150,
} as const;

export const BENCHMARK_COMPOSITION = {
  id: BENCHMARK.id,
  durationInFrames: BENCHMARK.durationInFrames,
  globalOffset: BENCHMARK.globalStart,
  ...COMPOSITION,
} as const;
