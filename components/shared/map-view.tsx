"use client";

import * as React from "react";
import { cn } from "cn";
import type { LatLng } from "@/types";
import { DEFAULT_MAP_CENTER } from "@/lib/mock/data";
import "mapbox-gl/dist/mapbox-gl.css";

type Marker = {
  id: string;
  position: LatLng;
  kind: "pickup" | "dropoff" | "driver" | "user";
  label?: string;
  rotation?: number;
};

export type MapViewProps = {
  center?: LatLng;
  zoom?: number;
  markers?: Marker[];
  route?: LatLng[];
  followMarkerId?: string;
  className?: string;
  showAttribution?: boolean;
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function project(point: LatLng, bounds: { min: LatLng; max: LatLng }, size: { w: number; h: number }) {
  const x = ((point.lng - bounds.min.lng) / (bounds.max.lng - bounds.min.lng)) * size.w;
  const y = (1 - (point.lat - bounds.min.lat) / (bounds.max.lat - bounds.min.lat)) * size.h;
  return { x, y };
}

function getBounds(points: LatLng[]) {
  if (points.length === 0) {
    return {
      min: { lat: DEFAULT_MAP_CENTER.lat - 0.01, lng: DEFAULT_MAP_CENTER.lng - 0.01 },
      max: { lat: DEFAULT_MAP_CENTER.lat + 0.01, lng: DEFAULT_MAP_CENTER.lng + 0.01 },
    };
  }
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const padLat = Math.max((maxLat - minLat) * 0.4, 0.005);
  const padLng = Math.max((maxLng - minLng) * 0.4, 0.005);
  return {
    min: { lat: minLat - padLat, lng: minLng - padLng },
    max: { lat: maxLat + padLat, lng: maxLng + padLng },
  };
}

function MockMapCanvas({
  center = DEFAULT_MAP_CENTER,
  markers = [],
  route = [],
  followMarkerId,
  className,
}: MapViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [size, setSize] = React.useState({ w: 400, h: 600 });

  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setSize({ w: r.width, h: r.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const allPoints = React.useMemo<LatLng[]>(() => {
    const points: LatLng[] = [center, ...route, ...markers.map((m) => m.position)];
    return points;
  }, [center, route, markers]);

  const bounds = React.useMemo(() => getBounds(allPoints), [allPoints]);

  const projectedMarkers = React.useMemo(
    () =>
      markers.map((m) => ({
        ...m,
        projected: project(m.position, bounds, size),
      })),
    [markers, bounds, size]
  );

  const projectedRoute = React.useMemo(
    () => route.map((p) => project(p, bounds, size)),
    [route, bounds, size]
  );

  const projectedCenter = project(center, bounds, size);

  const polylinePath = projectedRoute
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const following = followMarkerId
    ? projectedMarkers.find((m) => m.id === followMarkerId)
    : null;

  const cx = following?.projected.x ?? projectedCenter.x;
  const cy = following?.projected.y ?? projectedCenter.y;

  const translateX = size.w / 2 - cx;
  const translateY = size.h / 2 - cy;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-hidden bg-[oklch(0.93_0.01_250)] dark:bg-[oklch(0.18_0.01_250)]",
        className
      )}
      aria-label="Map"
      role="img"
    >
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{ transform: `translate3d(${translateX}px, ${translateY}px, 0)` }}
      >
        <GridBackground bounds={bounds} size={size} />
        <svg
          ref={svgRef}
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${size.w} ${size.h}`}
          width={size.w}
          height={size.h}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {route.length > 1 && (
            <>
              <path
                d={polylinePath}
                fill="none"
                stroke="var(--map-route)"
                strokeOpacity="0.25"
                strokeWidth={10}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={polylinePath}
                fill="none"
                stroke="var(--map-route)"
                strokeOpacity="0.95"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>

        {projectedMarkers.map((m) => (
          <div
            key={m.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: m.projected.x, top: m.projected.y }}
          >
            {m.kind === "driver" ? (
              <DriverMarker rotation={m.rotation} />
            ) : m.kind === "pickup" ? (
              <PlaceMarker color="var(--online)" label="Pickup" />
            ) : m.kind === "dropoff" ? (
              <PlaceMarker color="var(--destructive)" label="Dropoff" />
            ) : (
              <UserMarker />
            )}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute right-3 bottom-3 text-[10px] text-muted-foreground/70">
        Map data — mock
      </div>
    </div>
  );
}

function GridBackground({
  bounds,
  size,
}: {
  bounds: { min: LatLng; max: LatLng };
  size: { w: number; h: number };
}) {
  const lines: React.ReactElement[] = [];
  const step = 40;
  for (let x = 0; x <= size.w; x += step) {
    lines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={size.h}
        stroke="currentColor"
        strokeOpacity="0.04"
        strokeWidth={1}
      />
    );
  }
  for (let y = 0; y <= size.h; y += step) {
    lines.push(
      <line
        key={`h-${y}`}
        x1={0}
        y1={y}
        x2={size.w}
        y2={y}
        stroke="currentColor"
        strokeOpacity="0.04"
        strokeWidth={1}
      />
    );
  }
  return (
    <svg className="absolute inset-0 h-full w-full text-foreground" viewBox={`0 0 ${size.w} ${size.h}`}>
      {lines}
    </svg>
  );
}

function DriverMarker({ rotation = 0 }: { rotation?: number }) {
  return (
    <div
      className="relative drop-shadow-md transition-transform duration-700 ease-out"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div className="absolute -inset-2 -z-10 animate-pulse-soft rounded-full bg-status-en-route/30" />
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="18" fill="var(--status-en-route)" />
        <path
          d="M18 8 L23 16 L18 14 L13 16 Z"
          fill="white"
          transform={`rotate(${rotation} 18 18)`}
        />
        <circle cx="18" cy="18" r="5" fill="white" />
      </svg>
    </div>
  );
}

function PlaceMarker({ color, label }: { color: string; label: string }) {
  return (
    <div className="relative flex flex-col items-center">
      <div
        className="size-5 rounded-full border-2 border-white shadow-md ring-2 ring-black/10"
        style={{ backgroundColor: color }}
        aria-label={label}
      />
      <div className="mt-1 rounded-md bg-foreground/80 px-1.5 py-0.5 text-[10px] font-medium text-background">
        {label}
      </div>
    </div>
  );
}

function UserMarker() {
  return (
    <div className="relative">
      <div className="absolute -inset-3 -z-10 rounded-full bg-primary/25 blur-sm" />
      <div className="size-4 rounded-full border-2 border-white bg-primary shadow-md" />
    </div>
  );
}

const MapView = React.forwardRef<HTMLDivElement, MapViewProps>(function MapView(
  props,
  ref
) {
  if (MAPBOX_TOKEN) {
    return <MapboxMap ref={ref} {...props} />;
  }
  return <MockMapCanvas {...props} />;
});

type MapboxGL = typeof import("mapbox-gl");

const MapboxMap = React.forwardRef<HTMLDivElement, MapViewProps>(function MapboxMap(
  { center = DEFAULT_MAP_CENTER, zoom = 14, markers = [], route = [], className, followMarkerId, showAttribution = true },
  ref
) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<import("mapbox-gl").Map | null>(null);
  const glRef = React.useRef<MapboxGL | null>(null);
  const markerRefs = React.useRef<import("mapbox-gl").Marker[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const mapboxgl = await import("mapbox-gl");
      if (!containerRef.current || cancelled) return;
      glRef.current = mapboxgl;
      mapboxgl.default.accessToken = MAPBOX_TOKEN!;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [center.lng, center.lat],
        zoom,
        attributionControl: showAttribution,
      });
      mapRef.current = map;
      map.on("load", () => setReady(true));
    })();
    return () => {
      cancelled = true;
      markerRefs.current.forEach((m) => m.remove());
      markerRefs.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      glRef.current = null;
    };
    // Map instance is created once; prop updates are applied in the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.easeTo({ center: [center.lng, center.lat], duration: 800 });
  }, [center, ready]);

  React.useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    if (route.length > 1) {
      const geo = {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: route.map((p) => [p.lng, p.lat]),
        },
      };
      const src = map.getSource("route") as import("mapbox-gl").GeoJSONSource | undefined;
      if (src) {
        src.setData(geo);
      } else {
        map.addSource("route", { type: "geojson", data: geo });
        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#111",
            "line-width": 5,
            "line-opacity": 0.85,
          },
        });
      }
    } else if (map.getLayer("route")) {
      map.removeLayer("route");
      if (map.getSource("route")) map.removeSource("route");
    }
  }, [route, ready]);

  React.useEffect(() => {
    if (!ready || !mapRef.current || !glRef.current) return;
    const mapboxgl = glRef.current;
    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = markers.map((m) => {
      const el = document.createElement("div");
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";
      el.style.background = m.kind === "driver" ? "#3b82f6" : m.kind === "pickup" ? "#10b981" : "#ef4444";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.25)";
      return new mapboxgl.Marker(el)
        .setLngLat([m.position.lng, m.position.lat])
        .addTo(mapRef.current!);
    });
  }, [markers, ready]);

  React.useEffect(() => {
    if (!ready || !followMarkerId || !mapRef.current) return;
    const marker = markers.find((m) => m.id === followMarkerId);
    if (marker) {
      mapRef.current.flyTo({
        center: [marker.position.lng, marker.position.lat],
        zoom: 15,
      });
    }
  }, [followMarkerId, markers, ready]);

  return (
    <div ref={ref} className={cn("relative h-full w-full", className)}>
      <div ref={containerRef} className="absolute inset-0" />
      {showAttribution && (
        <div className="pointer-events-none absolute right-3 bottom-3 text-[10px] text-muted-foreground/80">
          © Mapbox © OpenStreetMap
        </div>
      )}
    </div>
  );
});

export default MapView;
