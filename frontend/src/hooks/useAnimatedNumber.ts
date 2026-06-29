"use client";

import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(
  target: number,
  duration = 300
): number {
  const [current, setCurrent] = useState(target);
  const frameRef = useRef<number>(0);
  const startRef = useRef<{ value: number; time: number } | null>(null);

  useEffect(() => {
    if (startRef.current === null) {
      setCurrent(target);
      startRef.current = { value: target, time: performance.now() };
      return;
    }

    const startValue = current;

    const animate = (now: number) => {
      const elapsed = now - (startRef.current?.time ?? now);
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(startValue + (target - startValue) * eased);

      setCurrent(next);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrent(target);
        startRef.current = { value: target, time: performance.now() };
      }
    };

    cancelAnimationFrame(frameRef.current);
    startRef.current = { value: startValue, time: performance.now() };
    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return current;
}
