import type { ActorTrack } from "../actors/action-track";
import { ACTORS_1976, ACTORS_1978, ACTORS_MALVINAS } from "./benchmark-v2-choreography";

/** Every ActorTrack of Benchmark V2 (1976 forces/civilians, 1978 teams, 1982 soldiers). */
export const ALL_ACTORS_V2: readonly ActorTrack[] = [...ACTORS_1976, ...ACTORS_1978, ...ACTORS_MALVINAS];
