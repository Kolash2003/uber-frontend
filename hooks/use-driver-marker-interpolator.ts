"use client";

import * as React from "react";
import { useActiveTripStore } from "@/stores/active-trip-store";
import type { LatLng } from "@/types";

export function useDriverMarkerInterpolator() {
  const target = useActiveTripStore((s) => s.driverLocation);
  const setInterp = useActiveTripStore((s) => s.setInterpolatedDriverLocation);
  const interpRef = React.useRef<LatLng | null>(null);
  const targetRef = React.useRef<LatLng | null>(null);
  const startRef = React.useRef<{ pos: LatLng; time: number } | null>(null);
  const INTERP_MS = 1000;

  React.useEffect(() => {
    targetRef.current = target;
    if (!target) {
      interpRef.current = null;
      setInterp(null);
      return;
    }
    if (!interpRef.current) {
      interpRef.current = target;
      startRef.current = { pos: target, time: performance.now() };
      setInterp(target);
      return;
    }
    startRef.current = {
      pos: interpRef.current,
      time: performance.now(),
    };
  }, [target, setInterp]);

  React.useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const t = targetRef.current;
      const start = startRef.current;
      if (t && start) {
        const elapsed = now - start.time;
        const progress = Math.min(1, elapsed / INTERP_MS);
        const next: LatLng = {
          lat: start.pos.lat + (t.lat - start.pos.lat) * progress,
          lng: start.pos.lng + (t.lng - start.pos.lng) * progress,
        };
        if (
          !interpRef.current ||
          interpRef.current.lat !== next.lat ||
          interpRef.current.lng !== next.lng
        ) {
          interpRef.current = next;
          setInterp(next);
        }
        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          startRef.current = null;
        }
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setInterp]);
}
