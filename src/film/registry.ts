import { mixColor, PALETTE } from "../theme/palette";
import type { CamKey, CamSegment, FilmCamera } from "./film-camera";
import { ERA_01, KEYS_01, STAGES_01 } from "./scenes/s01-atlantic";
import { ERA_02, ERA_03, KEYS_02_03, STAGES_02_03 } from "./scenes/s02-s03-buenosaires";
import { ERA_04, ERA_05, KEYS_04_05, STAGES_04_05 } from "./scenes/s04-s05-andes";
import { ERA_06, ERA_07, KEYS_06_07, STAGES_06_07 } from "./scenes/s06-s07-nation";
import { ERA_08, KEYS_08, STAGES_08 } from "./scenes/s08-immigration";
import { ERA_09, KEYS_09, STAGES_09 } from "./scenes/s09-political";
import { ERA_10_12, KEYS_10_12, STAGES_10_12 } from "./scenes/s10-s12-v2";
import { ERA_13, KEYS_13, STAGES_13 } from "./scenes/s13-maradona";
import { ERA_14_15, KEYS_14_15, STAGES_14_15 } from "./scenes/s14-s15-city";
import { ERA_16, KEYS_16, STAGES_16 } from "./scenes/s16-2014";
import { ERA_17, KEYS_17, STAGES_17 } from "./scenes/s17-2021";
import { ERA_18, KEYS_18, STAGES_18 } from "./scenes/s18-2022";
import { ERA_19, KEYS_19, STAGES_19 } from "./scenes/s19-finale";
import { STAGE_LAUREL } from "./scenes/laurel-stage";
import { CUT_1810, CUT_LIBERTAD, REORIGIN, sceneAt } from "./timing";
import type { FilmLineFrame, FilmStage, LineEra } from "./types";
import { REORIGIN_SIM } from "./world";

/**
 * The film's single registry: every stage, memory-line era and camera key,
 * in chronological order. Components never learn scene numbers.
 */
export const FILM_STAGES: readonly FilmStage[] = [...STAGES_01, ...STAGES_02_03, ...STAGES_04_05, ...STAGES_06_07, ...STAGES_08, ...STAGES_09, ...STAGES_10_12, ...STAGES_13, STAGE_LAUREL, ...STAGES_14_15, ...STAGES_16, ...STAGES_17, ...STAGES_18, ...STAGES_19];

const KEYS: readonly CamKey[] = [...KEYS_01, ...KEYS_02_03, ...KEYS_04_05, ...KEYS_06_07, ...KEYS_08, ...KEYS_09, ...KEYS_10_12, ...KEYS_13, ...KEYS_14_15, ...KEYS_16, ...KEYS_17, ...KEYS_18, ...KEYS_19];

const SEGMENTS: readonly CamSegment[] = [
  { id: "atlas.a", start: 0, end: CUT_1810 - 1, next: { kind: "cut" } },
  { id: "atlas.b", start: CUT_1810, end: REORIGIN - 1, next: { kind: "sim", sim: REORIGIN_SIM } },
  { id: "world", start: REORIGIN, end: CUT_LIBERTAD - 1, next: { kind: "cut" } },
  { id: "final", start: CUT_LIBERTAD, end: 3149 },
];

export const FILM_CAMERA: FilmCamera = { segments: SEGMENTS, keys: KEYS };

const ERAS: readonly LineEra[] = [ERA_01, ERA_02, ERA_03, ERA_04, ERA_05, ERA_06, ERA_07, ERA_08, ERA_09, ERA_10_12, ERA_13, ERA_14_15, ERA_16, ERA_17, ERA_18, ERA_19];

const EMPTY: FilmLineFrame = { points: ERA_01.evaluate(0).points, ranges: [], head: null, core: [] };

export const evaluateFilmLine = (f: number): FilmLineFrame => {
  const e = ERAS.find((x) => f >= x.from && f <= x.to);
  return e ? e.evaluate(f) : EMPTY;
};

/** Paper tone: warm ivory for most of the film, cooler during 1976–1983. */
export const paperAt = (f: number) =>
  f >= 1700 && f <= 2260 ? PALETTE.paperCool : f > 2260 && f < 2300 ? mixColor(PALETTE.paperCool, PALETTE.paperIvory, (f - 2260) / 40) : PALETTE.paperIvory;

export const sceneLabelAt = (f: number) => {
  const s = sceneAt(f);
  return `${s.id} · ${s.title}`;
};
