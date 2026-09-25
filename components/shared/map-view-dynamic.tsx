"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "@/components/shared/map-view";

const MapView = dynamic(
  () => import("@/components/shared/map-view").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full w-full animate-pulse-soft bg-muted"
        aria-label="Loading map"
        role="status"
      />
    ),
  }
) as React.FC<MapViewProps>;

export { MapView };
