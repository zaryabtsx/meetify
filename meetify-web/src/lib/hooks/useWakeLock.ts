"use client";

import { useCallback, useRef } from "react";

/** Wraps the Screen Wake Lock API. No-ops silently where unsupported. */
export function useWakeLock() {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  const acquire = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        lockRef.current = await (navigator as Navigator & {
          wakeLock: { request: (type: "screen") => Promise<WakeLockSentinel> };
        }).wakeLock.request("screen");
      }
    } catch {
      // Wake lock is best-effort — ignore failures (e.g. backgrounded tab).
    }
  }, []);

  const release = useCallback(() => {
    try {
      lockRef.current?.release();
    } catch {
      // ignore
    } finally {
      lockRef.current = null;
    }
  }, []);

  return { acquire, release };
}
