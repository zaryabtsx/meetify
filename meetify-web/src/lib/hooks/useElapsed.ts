"use client";

import { useEffect, useState } from "react";
import { formatElapsed } from "@/lib/utils/format";

export function useElapsed(running: boolean): string {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting a local timer on stop is intentional
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  return formatElapsed(seconds);
}
