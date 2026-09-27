/**
 * The single audio source of the film (§7.1). The file is served from the
 * /assets public dir and must keep this exact hash: never normalized,
 * transcoded, trimmed on disk, renamed or rewritten.
 */
export const MASTER_AUDIO = {
  fileName: "Lealtad_y_Destino_2026-09-26T210416.wav",
  sha256: "aad141664df8db424fa692c4faeaa3c88af753d20be1eaea365060e8468b2b1d",
  durationSeconds: 105,
  sampleRate: 48000,
  channels: 2,
  volume: 1,
  playbackRate: 1,
} as const;
