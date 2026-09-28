"use client";

import dynamic from "next/dynamic";
import { SearchIcon, MapPinIcon, HomeIcon, BriefcaseIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookingStore } from "@/stores/booking-store";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useSavedPlaces } from "@/hooks/use-trip-queries";
import { api } from "@/lib/api/client";
import type { Address } from "@/types";
import { DEFAULT_MAP_CENTER } from "@/lib/mock/data";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { cn } from "cn";

const MapView = dynamic(
  () => import("@/components/shared/map-view").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse-soft bg-muted" aria-label="Loading map" />
    ),
  }
);

export default function RiderHomePage() {
  const router = useRouter();
  const setPickup = useBookingStore((s) => s.setPickup);
  const setDropoff = useBookingStore((s) => s.setDropoff);
  const dropoff = useBookingStore((s) => s.dropoff);
  const user = useAuthStore((s) => s.user);

  const hasCoords = Boolean(user?.hasLocation && user.lastLat != null && user.lastLng != null);
  const homeLat = hasCoords ? (user!.lastLat as number) : DEFAULT_MAP_CENTER.lat;
  const homeLng = hasCoords ? (user!.lastLng as number) : DEFAULT_MAP_CENTER.lng;
  const homeCenter = { lat: homeLat, lng: homeLng };

  useEffect(() => {
    const existing = useBookingStore.getState().pickup;
    if (!existing || existing.id === "current") {
      setPickup({
        id: "current",
        label: "Current location",
        primary: user?.lastAddress ?? "You",
        secondary: user?.lastAddress ?? "Current location",
        location: { lat: homeLat, lng: homeLng },
      });
    }
  }, [setPickup, homeLat, homeLng, user?.lastAddress]);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Address[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounce(query, 300);
  const { data: savedPlaces = [] } = useSavedPlaces();

  useEffect(() => {
    if (!debounced || debounced.length < 2) return;
    let cancelled = false;
    const id = window.setTimeout(() => {
      setSearching(true);
      api
        .get<Address[]>("/geocode?q=" + encodeURIComponent(debounced))
        .then((r) => {
          if (cancelled) return;
          setResults(r);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [debounced]);

  const visibleResults = debounced && debounced.length >= 2 ? results : [];
  const recent = savedPlaces.filter((p) => p.id.startsWith("recent"));

  return (
    <div className="relative h-[calc(100dvh-3rem)]">
      <div className="absolute inset-0">
        <MapView center={homeCenter} markers={[]} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-4">
        <div className="pointer-events-auto mx-auto max-w-md space-y-2 rounded-2xl bg-background/95 p-3 shadow-xl ring-1 ring-foreground/10 backdrop-blur">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl bg-secondary/60 px-3 py-3 text-left text-sm transition-colors hover:bg-secondary"
            onClick={() => {
              if (dropoff) {
                router.push("/book");
              } else {
                inputRef.current?.focus();
              }
            }}
          >
            <SearchIcon className="size-5 text-muted-foreground" />
            <span className="text-muted-foreground">Where to?</span>
          </button>

          <div className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
            <MapPinIcon className="mt-0.5 size-3.5 text-status-online" />
            <span className="truncate">{user?.lastAddress ?? "Current location"}</span>
          </div>

          {(query === "" || debounced === "") && (
            <div className="space-y-0.5 pt-1">
              {savedPlaces.slice(0, 3).map((p) => {
                const Icon = p.id === "home" ? HomeIcon : p.id === "work" ? BriefcaseIcon : ClockIcon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-secondary"
                    onClick={() => {
                      setDropoff(p);
                      router.push("/book");
                    }}
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{p.label}</div>
                      <div className="truncate text-xs text-muted-foreground">{p.primary}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {(query !== "" && debounced !== "") && (
            <div className="space-y-0.5 pt-1">
              {searching && (
                <div className="px-2 py-2 text-xs text-muted-foreground">Searching…</div>
              )}
              {!searching && visibleResults.length === 0 && (
                <div className="px-2 py-2 text-xs text-muted-foreground">No matches</div>
              )}
              {visibleResults.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-secondary"
                  )}
                  onClick={() => {
                    setDropoff(r);
                    setQuery("");
                    router.push("/book");
                  }}
                >
                  <MapPinIcon className="size-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.primary}</div>
                    {r.secondary && (
                      <div className="truncate text-xs text-muted-foreground">{r.secondary}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 px-4 pb-safe">
        <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-2 rounded-full bg-background/95 p-2 shadow-xl ring-1 ring-foreground/10 backdrop-blur">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a destination"
            className="flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search destination"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (dropoff) {
                router.push("/book");
              } else {
                inputRef.current?.focus();
              }
            }}
          >
            <SearchIcon />
          </Button>
        </div>
      </div>

      {dropoff && (
        <div className="pointer-events-none absolute right-4 top-20 z-10 max-w-xs rounded-full bg-foreground px-3 py-1 text-xs text-background shadow-lg">
          → {dropoff.primary}
        </div>
      )}
    </div>
  );
}
