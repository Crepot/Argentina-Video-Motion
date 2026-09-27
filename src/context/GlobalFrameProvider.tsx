import React, { createContext, useContext, useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  asGlobalFrame,
  asLocalFrame,
  type GlobalFrame,
  type LocalFrame,
} from "../types/branded-frames";

interface GlobalFrameValue {
  globalFrame: GlobalFrame;
  localFrame: LocalFrame;
  fps: number;
}

const GlobalFrameContext = createContext<GlobalFrameValue | null>(null);

/**
 * The only place where local → global frame mapping happens (§6.1). Master:
 * offset 0. Benchmark: offset 1722.
 */
export const GlobalFrameProvider: React.FC<{
  offset: number;
  children: React.ReactNode;
}> = ({ offset, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const value = useMemo(
    () => ({
      globalFrame: asGlobalFrame(frame + offset),
      localFrame: asLocalFrame(frame),
      fps,
    }),
    [frame, offset, fps],
  );
  return (
    <GlobalFrameContext.Provider value={value}>
      {children}
    </GlobalFrameContext.Provider>
  );
};

export const useGlobalFrame = () => {
  const ctx = useContext(GlobalFrameContext);
  if (!ctx) {
    throw new Error(
      "useGlobalFrame() must be used inside <GlobalFrameProvider>",
    );
  }
  return ctx;
};
