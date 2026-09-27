import { geo } from "../atlas/south-atlantic-geometry";
import { frameRange } from "../types/branded-frames";
import type { LabelCue } from "../types/labels";

/**
 * Visible copy of Benchmark V2 (Spanish only, §6.1). Editorial lock §2.2:
 * the period is named only `DICTADURA`; the phrase banned by §2.2
 * is prohibited in any visible copy. Malvinas (editorial lock §2.9): the
 * primary legend states the Argentine sovereignty claim; the British
 * administration is a secondary legal note.
 */
export const TEXT_V2 = {
  year1976: "1976",
  dictaduraDates: "1976–1983",
  dictadura: "DICTADURA",
  year1978: "1978",
  campeon: "ARGENTINA · CAMPEÓN DEL MUNDO",
  anthem1978: ["CORONADOS", "DE GLORIA VIVAMOS"],
  year1982: "1982",
  guerraMalvinas: "GUERRA DE MALVINAS",
  oceano: "OCÉANO ATLÁNTICO SUR",
  malvinas: "ISLAS MALVINAS · RECLAMO ARGENTINO DE SOBERANÍA",
  malvinasNote: "BAJO ADMINISTRACIÓN BRITÁNICA",
} as const;

/** Screen-stabilized anchors are chosen per camera state (projected once). */
export const LABEL_CUES_V2 = {
  year1976: {
    id: "v2.label.1976",
    kind: "date",
    text: [TEXT_V2.year1976],
    range: frameRange(1728, 1766),
    enterFrames: 12,
    exitFrames: 10,
    anchor: [3000, 2080],
    mode: "hybrid",
    align: "left",
    maxWidthPx: 200,
  },
  dictaduraLockup: {
    id: "v2.label.dictadura",
    kind: "date",
    text: [TEXT_V2.dictaduraDates, TEXT_V2.dictadura],
    range: frameRange(1760, 1891),
    enterFrames: 14,
    exitFrames: 21,
    anchor: [0, 0],
    mode: "stabilized",
    align: "left",
    maxWidthPx: 720,
  },
  year1978: {
    id: "v2.label.1978",
    kind: "date",
    text: [TEXT_V2.year1978, TEXT_V2.campeon],
    range: frameRange(1928, 2068),
    enterFrames: 22,
    exitFrames: 19,
    anchor: [0, 0],
    mode: "stabilized",
    align: "left",
    maxWidthPx: 560,
  },
  anthem1978: {
    id: "v2.label.anthem",
    kind: "anthem",
    text: TEXT_V2.anthem1978,
    range: frameRange(1988, 2066),
    enterFrames: 22,
    exitFrames: 19,
    anchor: [0, 0],
    mode: "stabilized",
    align: "right",
    maxWidthPx: 620,
  },
  year1982: {
    id: "v2.label.1982",
    kind: "date",
    text: [TEXT_V2.year1982, TEXT_V2.guerraMalvinas],
    range: frameRange(2138, 2171),
    enterFrames: 17,
    exitFrames: 0,
    anchor: [0, 0],
    mode: "stabilized",
    align: "left",
    maxWidthPx: 520,
  },
  oceano: {
    id: "v2.label.oceano",
    kind: "map",
    text: [TEXT_V2.oceano],
    range: frameRange(2085, 2150),
    enterFrames: 15,
    exitFrames: 14,
    anchor: [5160, 2240],
    mode: "world",
    align: "center",
    maxWidthPx: 520,
  },
  malvinas: {
    id: "v2.label.malvinas",
    kind: "legal",
    text: [TEXT_V2.malvinas],
    range: frameRange(2152, 2171),
    enterFrames: 14,
    exitFrames: 0,
    anchor: geo(59.45, 51.02),
    mode: "hybrid",
    align: "center",
    maxWidthPx: 560,
  },
} as const satisfies Record<string, LabelCue>;

/** Fixed screen positions (px) for stabilized lockups, inside the safe area. */
export const SCREEN_LOCKUPS = {
  dictadura: [168, 820],
  year1978: [168, 792],
  anthem1978: [1752, 846],
  year1982: [168, 96],
} as const;
