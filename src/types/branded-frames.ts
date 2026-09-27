export type GlobalFrame = number & { readonly __brand: "GlobalFrame" };
export type LocalFrame = number & { readonly __brand: "LocalFrame" };

export const asGlobalFrame = (n: number) => n as GlobalFrame;
export const asLocalFrame = (n: number) => n as LocalFrame;

/** Inclusive on both ends, always in global frames. */
export interface FrameRange {
  start: GlobalFrame;
  end: GlobalFrame;
}

export const frameRange = (start: number, end: number): FrameRange => ({
  start: asGlobalFrame(start),
  end: asGlobalFrame(end),
});

export const isInRange = (frame: number, range: FrameRange) =>
  frame >= range.start && frame <= range.end;

/** Duration of an inclusive range, as <Sequence> expects it. */
export const rangeDuration = (range: FrameRange) => range.end - range.start + 1;
