import { mixColor, PALETTE } from "../../theme/palette";
import { BUILD_STANDARD, type Build } from "./skeleton";

/**
 * Wardrobe = the contour set a rig wears (spec §9.14: historical rigs share
 * the skeleton and swap clothing/props). Colours come only from the locked
 * palette; depth is expressed by value (foreground dark, background pale).
 */
export type HatStyle =
  | "none"
  | "hairShort"
  | "hairLong"
  | "hairBun"
  | "helmet"
  | "peakedCap"
  | "generalCap"
  | "flatCap"
  | "hood"
  | "bicorne"
  | "shako"
  | "topHat"
  | "wideBrim"
  | "kepi"
  | "headband"
  | "hairCurly"
  | "bowler"
  | "hairWavy"
  | "hairSide";

export type HeadProfile = "standard" | "gaunt" | "round";

export type PropId =
  | "rifleSlung"
  | "rifleCarried"
  | "shield"
  | "baton"
  | "briefcase"
  | "bag"
  | "pack"
  | "document"
  | "umbrella"
  | "musket"
  | "suitcase"
  | "bundle"
  | "lance"
  | "quill"
  | "microphone";

export interface Wardrobe {
  id: string;
  top: string;
  bottom: string;
  boots: string;
  skin: string;
  hat: HatStyle;
  hatColor: string;
  head: HeadProfile;
  /** Coat hem as a fraction of the thigh (0 = waist jacket, 1 = knee). */
  skirt: number;
  shorts?: boolean;
  socks?: string;
  /** Vertical shirt stripes (e.g. 1978 Argentina kit). */
  stripes?: string;
  belt?: string;
  collar?: string;
  trouserStripe?: string;
  shoulderBoards?: string;
  buttons?: string;
  gloves?: string;
  mask?: "gas";
  mustache?: boolean;
  /** Short full beard (e.g. Messi 2022). */
  beard?: boolean;
  /** Cape / cloak flowing behind the shoulders. */
  cape?: string;
  /** Crossed shoulder belts (early 19th-century infantry). */
  crossbelts?: string;
  /** Poncho over the torso (gaucho, frontier). */
  poncho?: string;
  /**
   * Face lines slot (HistoricalFigure): an optional path in head-local units
   * (head centre at 0,0, facing +x, radius ≈ 6.4). Reserved for the future
   * "2D recognizable faces" pass; today only a few brow/sideburn marks.
   */
  faceLines?: string;
  props: readonly PropId[];
}

const P = PALETTE;
const uniformMid = mixColor(P.deepBlueSoft, P.grayBlue, 0.42);
const uniformDark = mixColor(P.deepBlue, P.deepBlueSoft, 0.5);
const skin = mixColor(P.grayBluePale, P.grayBlue, 0.3);
const coatLight = mixColor(P.grayBlue, P.paperIvory, 0.35);

export const WARDROBES = {
  /** Army conscript/infantry, 1976: helmet, field uniform, slung rifle. */
  army1976: {
    id: "army1976",
    top: uniformMid,
    bottom: mixColor(uniformMid, P.deepBlue, 0.18),
    boots: P.deepBlue,
    skin,
    hat: "helmet",
    hatColor: uniformDark,
    head: "standard",
    skirt: 0.22,
    belt: P.deepBlue,
    props: ["rifleSlung"],
  },
  /** Security/riot line: gas mask, helmet, shield and baton. */
  riot1976: {
    id: "riot1976",
    top: uniformDark,
    bottom: uniformDark,
    boots: P.deepBlue,
    skin,
    hat: "helmet",
    hatColor: P.deepBlue,
    head: "standard",
    skirt: 0.3,
    belt: P.deepBlue,
    gloves: P.deepBlue,
    mask: "gas",
    props: ["shield", "baton"],
  },
  /** Field officer: peaked cap, belted jacket, shoulder boards. */
  officer1976: {
    id: "officer1976",
    top: uniformMid,
    bottom: mixColor(uniformMid, P.deepBlue, 0.25),
    boots: P.deepBlue,
    skin,
    hat: "peakedCap",
    hatColor: uniformDark,
    head: "standard",
    skirt: 0.34,
    belt: P.deepBlue,
    shoulderBoards: P.grayBluePale,
    buttons: P.grayBluePale,
    props: [],
  },
  /**
   * Jorge Rafael Videla, 1976 (HistoricalFigure): tall, gaunt, high-crowned
   * general's cap, belted uniform with shoulder boards and trouser stripe,
   * narrow moustache. No facial features beyond the profile contour.
   */
  generalVidela: {
    id: "generalVidela",
    top: mixColor(P.deepBlueSoft, P.grayBlue, 0.3),
    bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.22),
    boots: P.deepBlue,
    skin,
    hat: "generalCap",
    hatColor: P.deepBlue,
    head: "gaunt",
    skirt: 0.36,
    belt: P.deepBlue,
    collar: P.grayBluePale,
    trouserStripe: P.deepBlue,
    shoulderBoards: P.grayBluePale,
    buttons: P.grayBluePale,
    mustache: true,
    props: [],
  },
  civilianCoat: {
    id: "civilianCoat",
    top: coatLight,
    bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.55),
    boots: P.deepBlueSoft,
    skin,
    hat: "flatCap",
    hatColor: P.deepBlueSoft,
    head: "standard",
    skirt: 0.95,
    props: ["briefcase"],
  },
  civilianJacket: {
    id: "civilianJacket",
    top: mixColor(P.skyBluePale, P.grayBlue, 0.4),
    bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.4),
    boots: P.deepBlueSoft,
    skin,
    hat: "hairShort",
    hatColor: P.deepBlueSoft,
    head: "round",
    skirt: 0.28,
    props: ["document"],
  },
  civilianWoman: {
    id: "civilianWoman",
    top: mixColor(P.grayBluePale, P.skyBluePale, 0.35),
    bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.3),
    boots: P.deepBlueSoft,
    skin,
    hat: "hairBun",
    hatColor: P.deepBlueSoft,
    head: "round",
    skirt: 1.05,
    props: ["bag"],
  },
  /** 1978 Argentina kit: sky-blue/white vertical stripes, dark shorts. */
  footballArgentina: {
    id: "footballArgentina",
    top: P.paperWarm,
    bottom: P.deepBlue,
    boots: P.deepBlue,
    skin,
    hat: "hairLong",
    hatColor: P.deepBlueSoft,
    head: "standard",
    skirt: 0,
    shorts: true,
    socks: P.paperWarm,
    stripes: P.skyBlue,
    props: [],
  },
  /** Opponent: solid, deliberately generic (no national kit reproduced). */
  footballOpponent: {
    id: "footballOpponent",
    top: mixColor(P.grayBlue, P.deepBlueSoft, 0.35),
    bottom: P.paperWarm,
    boots: P.deepBlue,
    skin,
    hat: "hairShort",
    hatColor: P.deepBlueSoft,
    head: "standard",
    skirt: 0,
    shorts: true,
    socks: mixColor(P.grayBlue, P.deepBlueSoft, 0.35),
    props: [],
  },
  goalkeeper: {
    id: "goalkeeper",
    top: mixColor(P.grayBluePale, P.grayBlue, 0.5),
    bottom: P.deepBlue,
    boots: P.deepBlue,
    skin,
    hat: "hairShort",
    hatColor: P.deepBlue,
    head: "standard",
    skirt: 0,
    shorts: true,
    socks: P.grayBlue,
    gloves: P.paperWarm,
    props: [],
  },
  /** Argentine soldier, Malvinas 1982: helmet, long parka, pack, rifle. */
  soldierMalvinas: {
    id: "soldierMalvinas",
    top: mixColor(P.deepBlueSoft, P.grayBlue, 0.5),
    bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.38),
    boots: P.deepBlue,
    skin,
    hat: "helmet",
    hatColor: mixColor(P.deepBlue, P.deepBlueSoft, 0.4),
    head: "standard",
    skirt: 0.72,
    belt: P.deepBlue,
    props: ["pack", "rifleSlung"],
  },
  /* ============================================ full film (1492–2026) */
  sailor: { id: "sailor", top: mixColor(P.paperWarm, P.grayBlue, 0.35), bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.35), boots: P.deepBlueSoft, skin, hat: "hairShort", hatColor: P.deepBlueSoft, head: "standard", skirt: 0.3, belt: P.deepBlueSoft, props: [] },
  /** 1806–1807 British infantry: generic dark coat, crossbelts, shako, musket (no red: palette lock). */
  british1806: { id: "british1806", top: mixColor(P.deepBlueSoft, P.grayBlue, 0.2), bottom: mixColor(P.paperWarm, P.grayBlue, 0.5), boots: P.deepBlue, skin, hat: "shako", hatColor: P.deepBlue, head: "standard", skirt: 0.35, crossbelts: P.paperWarm, props: ["musket"] },
  /** Buenos Aires militia (Patricios), 1806–1810. */
  patricio: { id: "patricio", top: mixColor(P.deepBlue, P.deepBlueSoft, 0.5), bottom: mixColor(P.paperWarm, P.grayBluePale, 0.3), boots: P.deepBlue, skin, hat: "bicorne", hatColor: P.deepBlue, head: "standard", skirt: 0.5, crossbelts: P.paperWarm, belt: P.paperWarm, props: ["musket"] },
  vecino: { id: "vecino", top: mixColor(P.deepBlueSoft, P.grayBlue, 0.35), bottom: mixColor(P.paperWarm, P.grayBlue, 0.4), boots: P.deepBlue, skin, hat: "topHat", hatColor: P.deepBlue, head: "standard", skirt: 0.95, props: ["umbrella"] },
  vecinoLight: { id: "vecinoLight", top: mixColor(P.grayBlue, P.paperWarm, 0.3), bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.5), boots: P.deepBlueSoft, skin, hat: "topHat", hatColor: P.deepBlueSoft, head: "round", skirt: 0.9, props: [] },
  vecina: { id: "vecina", top: mixColor(P.grayBluePale, P.skyBluePale, 0.3), bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.35), boots: P.deepBlueSoft, skin, hat: "hairBun", hatColor: P.deepBlueSoft, head: "round", skirt: 1.35, props: ["umbrella"] },
  /** Napoleon Bonaparte (HistoricalFigure, map-scale gesture only): greatcoat and bicorne. */
  napoleon: { id: "napoleon", top: mixColor(P.grayBlue, P.deepBlueSoft, 0.55), bottom: mixColor(P.paperWarm, P.grayBlue, 0.3), boots: P.deepBlue, skin, hat: "bicorne", hatColor: P.deepBlue, head: "round", skirt: 1.0, belt: P.deepBlueSoft, buttons: P.grayBluePale, props: [] },
  /** Manuel Belgrano (HistoricalFigure): military frock coat, bicorne, sash-like belt. */
  belgrano: { id: "belgrano", top: mixColor(P.deepBlue, P.deepBlueSoft, 0.35), bottom: mixColor(P.paperWarm, P.grayBluePale, 0.25), boots: P.deepBlue, skin, hat: "bicorne", hatColor: P.deepBlue, head: "standard", skirt: 0.72, belt: P.skyBluePale, collar: P.skyBluePale, buttons: P.grayBluePale, faceLines: "M 1.6 -3.0 L 4.4 -3.4", props: [] },
  /**
   * José de San Martín (HistoricalFigure): dark granadero coat with high
   * collar, bicorne worn crosswise, long cloak, riding boots, sideburns.
   */
  sanMartin: { id: "sanMartin", top: mixColor(P.deepBlue, P.deepBlueSoft, 0.2), bottom: mixColor(P.paperWarm, P.grayBluePale, 0.2), boots: P.deepBlue, skin, hat: "bicorne", hatColor: P.deepBlue, head: "gaunt", skirt: 0.62, collar: P.deepBlue, belt: P.grayBluePale, buttons: P.goldMuted, cape: mixColor(P.deepBlue, P.grayBlue, 0.25), faceLines: "M -0.8 -2.6 C -1.6 0.6, -1.2 3.6, 0.8 5.6 M 1.8 -3.2 L 4.6 -3.6", props: [] },
  granadero: { id: "granadero", top: mixColor(P.deepBlue, P.deepBlueSoft, 0.45), bottom: mixColor(P.paperWarm, P.grayBluePale, 0.35), boots: P.deepBlue, skin, hat: "shako", hatColor: P.deepBlue, head: "standard", skirt: 0.5, crossbelts: P.paperWarm, belt: P.paperWarm, props: ["rifleSlung"] },
  andesInfantry: { id: "andesInfantry", top: mixColor(P.deepBlueSoft, P.grayBlue, 0.3), bottom: mixColor(P.paperWarm, P.grayBlue, 0.4), boots: P.deepBlue, skin, hat: "shako", hatColor: mixColor(P.deepBlue, P.deepBlueSoft, 0.4), head: "standard", skirt: 0.55, crossbelts: P.paperWarm, poncho: undefined, props: ["musket", "pack"] },
  andesPoncho: { id: "andesPoncho", top: mixColor(P.deepBlueSoft, P.grayBlue, 0.3), bottom: mixColor(P.paperWarm, P.grayBlue, 0.4), boots: P.deepBlue, skin, hat: "shako", hatColor: mixColor(P.deepBlue, P.deepBlueSoft, 0.4), head: "standard", skirt: 0.4, poncho: mixColor(P.grayBlue, P.paperWarm, 0.25), props: ["musket"] },
  delegate: { id: "delegate", top: mixColor(P.deepBlue, P.grayBlue, 0.35), bottom: mixColor(P.paperWarm, P.grayBluePale, 0.3), boots: P.deepBlue, skin, hat: "hairWavy", hatColor: mixColor(P.grayBluePale, P.grayBlue, 0.5), head: "standard", skirt: 0.95, collar: P.paperWarm, props: ["document"] },
  delegateB: { id: "delegateB", top: mixColor(P.deepBlueSoft, P.grayBlue, 0.3), bottom: mixColor(P.paperWarm, P.grayBluePale, 0.3), boots: P.deepBlue, skin, hat: "hairSide", hatColor: P.deepBlueSoft, head: "round", skirt: 0.95, collar: P.paperWarm, props: [] },
  clerk: { id: "clerk", top: mixColor(P.grayBlue, P.deepBlueSoft, 0.4), bottom: mixColor(P.paperWarm, P.grayBlue, 0.3), boots: P.deepBlue, skin, hat: "hairWavy", hatColor: P.grayBlue, head: "standard", skirt: 0.8, collar: P.paperWarm, props: ["quill"] },
  gaucho: { id: "gaucho", top: mixColor(P.paperWarm, P.grayBlue, 0.3), bottom: mixColor(P.paperWarm, P.grayBluePale, 0.4), boots: P.deepBlueSoft, skin, hat: "wideBrim", hatColor: P.deepBlue, head: "standard", skirt: 0.2, poncho: mixColor(P.grayBlue, P.deepBlueSoft, 0.35), props: ["lance"] },
  gauchoLight: { id: "gauchoLight", top: mixColor(P.paperWarm, P.grayBlue, 0.3), bottom: mixColor(P.paperWarm, P.grayBluePale, 0.4), boots: P.deepBlueSoft, skin, hat: "wideBrim", hatColor: P.deepBlueSoft, head: "round", skirt: 0.2, poncho: mixColor(P.skyBluePale, P.grayBlue, 0.4), props: ["lance"] },
  lineOfficer: { id: "lineOfficer", top: mixColor(P.deepBlue, P.deepBlueSoft, 0.5), bottom: mixColor(P.paperWarm, P.grayBluePale, 0.3), boots: P.deepBlue, skin, hat: "kepi", hatColor: P.deepBlue, head: "standard", skirt: 0.6, belt: P.paperWarm, buttons: P.grayBluePale, props: [] },
  frontierSoldier: { id: "frontierSoldier", top: mixColor(P.deepBlueSoft, P.grayBlue, 0.4), bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.3), boots: P.deepBlue, skin, hat: "kepi", hatColor: P.deepBlue, head: "standard", skirt: 0.35, belt: P.deepBlue, props: ["rifleSlung"] },
  courier: { id: "courier", top: mixColor(P.paperWarm, P.grayBlue, 0.4), bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.4), boots: P.deepBlue, skin, hat: "wideBrim", hatColor: P.deepBlueSoft, head: "standard", skirt: 0.3, poncho: mixColor(P.paperWarm, P.grayBlue, 0.5), props: ["document"] },
  indigenousMan: { id: "indigenousMan", top: mixColor(P.paperWarm, P.grayBlue, 0.45), bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.25), boots: P.deepBlueSoft, skin, hat: "headband", hatColor: P.deepBlue, head: "standard", skirt: 0.5, poncho: mixColor(P.deepBlueSoft, P.grayBlue, 0.2), props: [] },
  indigenousWoman: { id: "indigenousWoman", top: mixColor(P.grayBlue, P.deepBlueSoft, 0.3), bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.45), boots: P.deepBlueSoft, skin, hat: "headband", hatColor: P.deepBlue, head: "round", skirt: 1.35, props: [] },
  settler: { id: "settler", top: mixColor(P.paperWarm, P.skyBluePale, 0.3), bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.4), boots: P.deepBlueSoft, skin, hat: "wideBrim", hatColor: P.deepBlueSoft, head: "round", skirt: 0.25, props: [] },
  immigrantMan: { id: "immigrantMan", top: mixColor(P.grayBlue, P.deepBlueSoft, 0.45), bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.3), boots: P.deepBlue, skin, hat: "flatCap", hatColor: P.deepBlue, head: "standard", skirt: 0.4, props: ["suitcase"] },
  immigrantMan2: { id: "immigrantMan2", top: mixColor(P.paperWarm, P.grayBlue, 0.45), bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.4), boots: P.deepBlue, skin, hat: "bowler", hatColor: P.deepBlue, head: "round", skirt: 0.45, mustache: true, props: ["bundle"] },
  immigrantWoman: { id: "immigrantWoman", top: mixColor(P.grayBluePale, P.skyBluePale, 0.25), bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.4), boots: P.deepBlueSoft, skin, hat: "hairBun", hatColor: P.deepBlueSoft, head: "round", skirt: 1.4, props: ["bag"] },
  immigrantChild: { id: "immigrantChild", top: mixColor(P.skyBluePale, P.paperWarm, 0.4), bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.35), boots: P.deepBlueSoft, skin, hat: "flatCap", hatColor: P.deepBlueSoft, head: "round", skirt: 0.3, props: [] },
  dockWorker: { id: "dockWorker", top: mixColor(P.paperWarm, P.grayBlue, 0.5), bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.3), boots: P.deepBlue, skin, hat: "flatCap", hatColor: P.deepBlueSoft, head: "standard", skirt: 0.2, belt: P.deepBlueSoft, props: ["bundle"] },
  worker: { id: "worker", top: mixColor(P.grayBlue, P.skyBluePale, 0.3), bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.3), boots: P.deepBlue, skin, hat: "flatCap", hatColor: P.deepBlue, head: "standard", skirt: 0.2, belt: P.deepBlue, props: [] },
  workerShirt: { id: "workerShirt", top: mixColor(P.paperWarm, P.grayBluePale, 0.4), bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.25), boots: P.deepBlue, skin, hat: "hairSide", hatColor: P.deepBlue, head: "round", skirt: 0.15, props: [] },
  workerWoman: { id: "workerWoman", top: mixColor(P.skyBluePale, P.grayBlue, 0.35), bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.4), boots: P.deepBlueSoft, skin, hat: "hairWavy", hatColor: P.deepBlue, head: "round", skirt: 1.2, props: [] },
  /** Juan Domingo Perón (HistoricalFigure, brief contextual gesture): general's uniform, slicked hair. */
  peron: { id: "peron", top: mixColor(P.grayBlue, P.paperWarm, 0.35), bottom: mixColor(P.grayBlue, P.paperWarm, 0.3), boots: P.deepBlue, skin, hat: "hairSide", hatColor: P.deepBlue, head: "round", skirt: 0.4, belt: P.deepBlueSoft, shoulderBoards: P.deepBlueSoft, buttons: P.deepBlueSoft, props: [] },
  /** Eva Perón (HistoricalFigure, 8–14 frames): tailored suit, hair gathered in a bun. */
  evita: { id: "evita", top: mixColor(P.paperWarm, P.grayBluePale, 0.3), bottom: mixColor(P.grayBlue, P.paperWarm, 0.3), boots: P.deepBlueSoft, skin, hat: "hairBun", hatColor: mixColor(P.grayBluePale, P.paperWarm, 0.3), head: "round", skirt: 1.15, props: [] },
  officialSuit: { id: "officialSuit", top: mixColor(P.deepBlueSoft, P.grayBlue, 0.3), bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.3), boots: P.deepBlue, skin, hat: "hairSide", hatColor: P.deepBlue, head: "standard", skirt: 0.5, props: ["document"] },
  police: { id: "police", top: mixColor(P.deepBlue, P.deepBlueSoft, 0.4), bottom: mixColor(P.deepBlue, P.deepBlueSoft, 0.4), boots: P.deepBlue, skin, hat: "peakedCap", hatColor: P.deepBlue, head: "standard", skirt: 0.3, belt: P.paperWarm, props: [] },
  /** Guerrilla (Montoneros / ERP): civilian clothes of the period, long gun held low. */
  guerrilla: { id: "guerrilla", top: mixColor(P.grayBlue, P.deepBlueSoft, 0.55), bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.2), boots: P.deepBlue, skin, hat: "hairWavy", hatColor: P.deepBlue, head: "standard", skirt: 0.35, props: ["rifleCarried"] },
  guerrillaB: { id: "guerrillaB", top: mixColor(P.paperWarm, P.grayBlue, 0.55), bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.3), boots: P.deepBlue, skin, hat: "hairShort", hatColor: P.deepBlue, head: "gaunt", skirt: 0.3, mustache: true, props: ["rifleCarried"] },
  /** Triple A: dark civilian coats, armed, no insignia (para-state). */
  tripleA: { id: "tripleA", top: mixColor(P.deepBlue, P.grayBlue, 0.15), bottom: mixColor(P.deepBlue, P.grayBlue, 0.2), boots: P.deepBlue, skin, hat: "hairSide", hatColor: P.deepBlue, head: "gaunt", skirt: 0.85, props: ["rifleCarried"] },
  student: { id: "student", top: mixColor(P.skyBluePale, P.paperWarm, 0.3), bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.4), boots: P.deepBlueSoft, skin, hat: "hairLong", hatColor: P.deepBlueSoft, head: "round", skirt: 0.25, props: ["document"] },
  /** Maradona, 1986 (HistoricalFigure): Argentina's dark-blue change shirt worn that day, curly hair, stocky. */
  maradona: { id: "maradona", top: mixColor(P.deepBlue, P.deepBlueSoft, 0.35), bottom: P.paperWarm, boots: P.deepBlue, skin, hat: "hairCurly", hatColor: P.deepBlue, head: "round", skirt: 0, shorts: true, socks: mixColor(P.deepBlue, P.deepBlueSoft, 0.35), props: [] },
  argentina1986: { id: "argentina1986", top: mixColor(P.deepBlue, P.deepBlueSoft, 0.35), bottom: P.paperWarm, boots: P.deepBlue, skin, hat: "hairShort", hatColor: P.deepBlue, head: "standard", skirt: 0, shorts: true, socks: mixColor(P.deepBlue, P.deepBlueSoft, 0.35), props: [] },
  england1986: { id: "england1986", top: P.paperWarm, bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.25), boots: P.deepBlue, skin, hat: "hairWavy", hatColor: P.deepBlueSoft, head: "standard", skirt: 0, shorts: true, socks: P.paperWarm, props: [] },
  /** Messi (HistoricalFigure): striped kit; 2014 short hair, 2022 beard. */
  messi2014: { id: "messi2014", top: P.paperWarm, bottom: P.deepBlue, boots: P.deepBlue, skin, hat: "hairShort", hatColor: P.deepBlueSoft, head: "round", skirt: 0, shorts: true, socks: P.paperWarm, stripes: P.skyBlue, props: [] },
  messi2022: { id: "messi2022", top: P.paperWarm, bottom: P.deepBlue, boots: P.deepBlue, skin, hat: "hairSide", hatColor: P.deepBlue, head: "round", skirt: 0, shorts: true, socks: P.paperWarm, stripes: P.skyBlue, beard: true, props: [] },
  argentinaKit: { id: "argentinaKit", top: P.paperWarm, bottom: P.deepBlue, boots: P.deepBlue, skin, hat: "hairShort", hatColor: P.deepBlueSoft, head: "standard", skirt: 0, shorts: true, socks: P.paperWarm, stripes: P.skyBlue, props: [] },
  argentinaKitB: { id: "argentinaKitB", top: P.paperWarm, bottom: P.deepBlue, boots: P.deepBlue, skin, hat: "hairWavy", hatColor: P.deepBlue, head: "round", skirt: 0, shorts: true, socks: P.paperWarm, stripes: P.skyBlue, beard: true, props: [] },
  opponentDark: { id: "opponentDark", top: mixColor(P.deepBlueSoft, P.grayBlue, 0.45), bottom: P.paperWarm, boots: P.deepBlue, skin, hat: "hairShort", hatColor: P.deepBlue, head: "standard", skirt: 0, shorts: true, socks: mixColor(P.deepBlueSoft, P.grayBlue, 0.45), props: [] },
  opponentLight: { id: "opponentLight", top: mixColor(P.paperWarm, P.grayBluePale, 0.5), bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.4), boots: P.deepBlue, skin, hat: "hairWavy", hatColor: P.deepBlueSoft, head: "standard", skirt: 0, shorts: true, socks: P.paperWarm, props: [] },
  commuter: { id: "commuter", top: mixColor(P.grayBlue, P.deepBlueSoft, 0.3), bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.4), boots: P.deepBlue, skin, hat: "hairShort", hatColor: P.deepBlue, head: "standard", skirt: 0.55, props: ["briefcase"] },
  commuterWoman: { id: "commuterWoman", top: mixColor(P.skyBluePale, P.grayBlue, 0.3), bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.3), boots: P.deepBlueSoft, skin, hat: "hairLong", hatColor: P.deepBlueSoft, head: "round", skirt: 1.0, props: ["bag"] },
  scientist: { id: "scientist", top: P.paperWarm, bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.4), boots: P.deepBlue, skin, hat: "hairSide", hatColor: P.deepBlueSoft, head: "round", skirt: 0.95, props: ["document"] },
  farmer: { id: "farmer", top: mixColor(P.skyBluePale, P.paperWarm, 0.35), bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.35), boots: P.deepBlue, skin, hat: "wideBrim", hatColor: P.deepBlueSoft, head: "standard", skirt: 0.2, props: [] },
  fan: { id: "fan", top: P.paperWarm, bottom: mixColor(P.deepBlueSoft, P.grayBlue, 0.35), boots: P.deepBlue, skin, hat: "hairShort", hatColor: P.deepBlue, head: "round", skirt: 0.2, stripes: P.skyBlue, props: [] },
  fanWoman: { id: "fanWoman", top: P.paperWarm, bottom: mixColor(P.grayBlue, P.deepBlueSoft, 0.4), boots: P.deepBlueSoft, skin, hat: "hairLong", hatColor: P.deepBlueSoft, head: "round", skirt: 0.3, stripes: P.skyBlue, props: [] },
} as const satisfies Record<string, Wardrobe>;

export type WardrobeId = keyof typeof WARDROBES;

/** Named body builds. New historical figures add a build + wardrobe here. */
export const BUILDS = {
  standard: BUILD_STANDARD,
  tall: { height: 1.07, shoulders: 1, girth: 0.95, headSize: 1, legs: 1.02 },
  gaunt: { height: 1.1, shoulders: 0.94, girth: 0.86, headSize: 0.97, legs: 1.04 },
  sturdy: { height: 0.98, shoulders: 1.08, girth: 1.1, headSize: 1.02, legs: 0.97 },
  athlete: { height: 1.02, shoulders: 1.05, girth: 0.95, headSize: 0.98, legs: 1.03 },
  slight: { height: 0.94, shoulders: 0.9, girth: 0.9, headSize: 1.02, legs: 0.98 },
  stocky: { height: 0.92, shoulders: 1.08, girth: 1.08, headSize: 1.04, legs: 0.93 },
  child: { height: 0.6, shoulders: 0.8, girth: 0.85, headSize: 1.45, legs: 0.9 },
  broad: { height: 1.02, shoulders: 1.1, girth: 1.12, headSize: 1.04, legs: 0.98 },
} as const satisfies Record<string, Build>;

export type BuildId = keyof typeof BUILDS;
