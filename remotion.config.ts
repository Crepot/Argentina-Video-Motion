/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideBundlerConfig(enableTailwind);

// The master WAV lives in /assets and must never be moved, copied or
// rewritten (REMOTION_IMPLEMENTATION_SPEC §2.6). Serving that folder as the
// public dir lets staticFile() reference the original file.
Config.setPublicDir("assets");
