import { Audio } from "@remotion/media";
import React from "react";
import { staticFile } from "remotion";
import { MASTER_AUDIO } from "./audio-contract";

/**
 * The only audio integration (§7, §11.5). `trimBefore` / `trimAfter` select
 * the source window at playback time (end-exclusive); no new file is written.
 * Volume is Remotion's default (1, MASTER_AUDIO.volume): no fades, no gain.
 */
export const MasterAudio: React.FC<{
  trimBefore?: number;
  trimAfter?: number;
}> = ({ trimBefore, trimAfter }) => (
  <Audio
    src={staticFile(MASTER_AUDIO.fileName)}
    trimBefore={trimBefore}
    trimAfter={trimAfter}
    playbackRate={MASTER_AUDIO.playbackRate}
  />
);
