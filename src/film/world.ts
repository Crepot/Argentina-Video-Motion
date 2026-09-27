import { M } from "./data/geo";
import type { Similarity } from "./space";

/**
 * The invisible re-origin at REORIGIN (1880s migration chart): the
 * continental atlas (canonical Mercator world) is mapped onto the V2 world,
 * where Buenos Aires' port opens the long corridor that leads, without a
 * cut, into the 1976 avenue of Benchmark V2. world' = s · world + d. At that
 * frame only the chart and the memory line are on screen, so the picture is
 * identical on both sides of the join.
 */
export const PORT_S2: readonly [number, number] = [-3700, 2640];
const BA = M(58.4, 34.6);
export const REORIGIN_SIM: Similarity = { s: 1, dx: PORT_S2[0] - BA[0], dy: PORT_S2[1] - BA[1] };
