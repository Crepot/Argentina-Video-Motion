import "./index.css";
import { Composition } from "remotion";
import { Benchmark1976Malvinas } from "./compositions/Benchmark1976Malvinas";
import { BENCHMARK_COMPOSITION } from "./compositions/composition-config";
import { DEBUG } from "./debug/debug-config";
import { RigLab } from "./debug/RigLab";
import { BenchmarkV2 } from "./compositions/BenchmarkV2";
import { BENCHMARK_V2 } from "./timeline/benchmark-v2-timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={BENCHMARK_COMPOSITION.id}
        component={Benchmark1976Malvinas}
        durationInFrames={BENCHMARK_COMPOSITION.durationInFrames}
        fps={BENCHMARK_COMPOSITION.fps}
        width={BENCHMARK_COMPOSITION.width}
        height={BENCHMARK_COMPOSITION.height}
        defaultProps={{ debug: DEBUG }}
      />
      <Composition
        id={BENCHMARK_V2.id}
        component={BenchmarkV2}
        durationInFrames={BENCHMARK_V2.durationInFrames}
        fps={BENCHMARK_COMPOSITION.fps}
        width={BENCHMARK_COMPOSITION.width}
        height={BENCHMARK_COMPOSITION.height}
        defaultProps={{ debug: DEBUG }}
      />
      <Composition
        id="Dev-RigLab"
        component={RigLab}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
