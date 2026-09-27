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
  | "hood";

export type HeadProfile = "standard" | "gaunt" | "round";

export type PropId =
  | "rifleSlung"
  | "rifleCarried"
  | "shield"
  | "baton"
  | "briefcase"
  | "bag"
  | "pack"
  | "document";

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
} as const satisfies Record<string, Build>;

export type BuildId = keyof typeof BUILDS;
