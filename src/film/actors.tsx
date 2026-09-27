import { placeActors, ActorView } from "../actors/ActorLayer";
import type { ActionKey, ActorTrack, PosKey } from "../actors/action-track";
import type { StageItem } from "../scenes/v2/stage-items";
import type { Placement } from "./space";
import type { FilmCtx } from "./types";

/**
 * Actor helpers for the film (spec §9.14 ActionTrackPlayer): tracks are data;
 * this only shortens authoring and places them on a sheet.
 */
export const P = (f: number, x: number, y: number, ease?: PosKey["ease"]): PosKey => ({ f, x, y, ease });
export const A = (f: number, action: ActionKey["action"], extra: Partial<ActionKey> = {}): ActionKey => ({ f, action, ...extra });

export const actor = (
  id: string,
  wardrobe: ActorTrack["wardrobe"],
  scale: number,
  pos: readonly PosKey[],
  actions: readonly ActionKey[],
  life: ActorTrack["life"],
  extra: Partial<ActorTrack> = {},
): ActorTrack => ({
  id,
  wardrobe,
  scale,
  detail: "mid",
  seed: Array.from(id).reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7),
  role: "secondary",
  pos,
  actions,
  life,
  ...extra,
});

/** Evaluate, cull and wrap actors of one sheet as depth-sortable items. */
export const actorItems = (ctx: FilmCtx, pl: Placement, tracks: readonly ActorTrack[]): StageItem[] => {
  const live = tracks.filter((t) => ctx.f >= t.life.from && ctx.f <= t.life.to);
  if (!live.length) {
    return [];
  }
  const placed = placeActors(live, ctx.f, (d) => ctx.proj(pl, d)).filter((a) => {
    const s = ctx.proj(pl, a.track.depth ?? 1).point(a.frame.x, a.frame.y, 0);
    return s[0] > -600 && s[0] < 2520 && s[1] > -300 && s[1] < 2000;
  });
  return placed.map((a) => ({
    key: a.track.id,
    y: a.frame.y + (a.track.lift ? -0.5 : 0),
    depth: a.track.depth ?? 1,
    node: <ActorView placed={a} projector={ctx.proj(pl, a.track.depth ?? 1)} />,
  }));
};
