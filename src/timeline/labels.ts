import { OCEAN_LABEL_ANCHOR } from "../atlas/south-atlantic-geometry";
import { frameRange } from "../types/branded-frames";
import type { LabelCue } from "../types/labels";

/**
 * Every visible string of the benchmark (§6.1). Spanish only.
 * Editorial lock §2.2: the dictatorship is named only `DICTADURA`; no
 * secondary line (the phrase banned by §2.2) may be shown. Keep null.
 */
export const DICTADURA_SECONDARY_LINE: string | null = null;

export const TEXT = {
  year1976: "1976",
  dictaduraDates: "1976–1983",
  dictadura: "DICTADURA",
  year1978: "1978",
  campeon: "ARGENTINA · CAMPEÓN DEL MUNDO",
  anthem1978: ["CORONADOS", "DE GLORIA VIVAMOS"],
  year1982: "1982",
  guerraMalvinas: "GUERRA DE MALVINAS",
  oceano: "OCÉANO ATLÁNTICO SUR",
} as const;

export const LABEL_CUES = {
  year1976: {
    id: "label.1976.marginal",
    kind: "date",
    text: [TEXT.year1976],
    range: frameRange(1730, 1770),
    enterFrames: 12,
    exitFrames: 10,
    anchor: [3370, 1940],
    mode: "hybrid",
    align: "left",
    maxWidthPx: 200,
  },
  dictaduraLockup: {
    id: "label.dictadura.lockup",
    kind: "date",
    text: DICTADURA_SECONDARY_LINE
      ? [TEXT.dictaduraDates, TEXT.dictadura, DICTADURA_SECONDARY_LINE]
      : [TEXT.dictaduraDates, TEXT.dictadura],
    range: frameRange(1760, 1891),
    enterFrames: 14,
    exitFrames: 21,
    anchor: [3500, 1970],
    mode: "stabilized",
    align: "left",
    maxWidthPx: 460,
  },
  year1978: {
    id: "label.1978",
    kind: "date",
    text: [TEXT.year1978, TEXT.campeon],
    range: frameRange(1928, 2068),
    enterFrames: 22,
    exitFrames: 19,
    anchor: [3368, 1779],
    mode: "stabilized",
    align: "left",
    maxWidthPx: 460,
  },
  anthem1978: {
    id: "label.anthem.coronados",
    kind: "anthem",
    text: TEXT.anthem1978,
    range: frameRange(1988, 2066),
    enterFrames: 22,
    exitFrames: 19,
    anchor: [3368, 2436],
    mode: "stabilized",
    align: "left",
    maxWidthPx: 620,
  },
  year1982: {
    id: "label.1982",
    kind: "date",
    text: [TEXT.year1982, TEXT.guerraMalvinas],
    range: frameRange(2138, 2171),
    enterFrames: 17,
    exitFrames: 0,
    anchor: [5600, 2160],
    mode: "stabilized",
    align: "left",
    maxWidthPx: 460,
  },
  oceano: {
    id: "label.oceano",
    kind: "map",
    text: [TEXT.oceano],
    range: frameRange(2085, 2171),
    enterFrames: 15,
    exitFrames: 0,
    anchor: OCEAN_LABEL_ANCHOR,
    mode: "world",
    align: "center",
    maxWidthPx: 520,
  },
} as const satisfies Record<string, LabelCue>;
