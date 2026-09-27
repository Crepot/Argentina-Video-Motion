import type { Point } from "../types/paths";
import { M, place as placeLL } from "./data/geo";
import { anchorAt, toWorld } from "./space";

/**
 * Late-film sheets (2014 → 2026). The 2014 pitch sits on the new-century
 * stem; South America, the Atlantic and Qatar live on one scaled globe
 * sheet (GLOBE) far enough east that the old sheets never overlap it; the
 * 2021 and 2022 pitches are opened from that globe at Rio and Lusail, not
 * to scale (the continent outline becomes the pitch boundary). The final
 * bicontinental map is the same globe sheet.
 */
export const MARK_2014: Point = [11800, -2600];
export const PITCH14 = anchorAt([0, 0], MARK_2014, 1);

export const GLOBE_K = 0.08;
export const GLOBE_CENTER_LL = M(58, 16);
export const GLOBE = anchorAt(GLOBE_CENTER_LL, [16000, -2600], GLOBE_K);
export const G = (lonW: number, latS: number): Point => toWorld(GLOBE, M(lonW, latS));
export const GP = (id: Parameters<typeof placeLL>[0]): Point => toWorld(GLOBE, placeLL(id));

export const RIO_W = GP("rio");
export const LUSAIL_W = GP("lusail");
export const BA_W = GP("buenosAires");

/** 2021 and 2022 pitches: similar in size to the continent they open from. */
export const PITCH_K = 0.3;
export const PITCH21 = anchorAt([0, 0], RIO_W, PITCH_K);
export const PITCH22 = anchorAt([0, 0], LUSAIL_W, PITCH_K);
