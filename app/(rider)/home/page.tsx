"use client";

import dynamic from "next/dynamic";
import {
  SearchIcon,
  MapPinIcon,
  HomeIcon,
  BriefcaseIcon,
  ClockIcon,
  ArrowRightIcon,
  Loader2Icon,
} from "lucide-react";
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

  const showResults = debounced.length >= 2;
  const visibleResults = showResults ? results : [];

  return (
    <div className="relative h-map">
      <div className="absolute inset-0">
        <MapView center={homeCenter} markers={[]} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-4">
        <div className="pointer-events-auto mx-auto max-w-md panel p-3">
          <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 transition-colors focus-within:bg-secondary focus-within:ring-2 focus-within:ring-ring/50">
            <SearchIcon className="size-5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Where to?"
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Search destination"
            />
            {searching && <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />}
          </div>

          <div className="flex items-start gap-2 px-1 pt-2 text-xs text-muted-foreground">
            <MapPinIcon className="mt-0.5 size-3.5 shrink-0 text-status-online" />
            <span className="truncate">{user?.lastAddress ?? "Current location"}</span>
          </div>

          {showResults ? (
            <div className="max-h-64 space-y-0.5 overflow-y-auto pt-1">
              {!searching && visibleResults.length === 0 && (
                <div className="px-2 py-3 text-xs text-muted-foreground">
                  No places match &ldquo;{debounced}&rdquo;
                </div>
              )}
              {visibleResults.map((r) => (
                <PlaceRow
                  key={r.id}
                  icon={MapPinIcon}
                  title={r.primary}
                  subtitle={r.secondary}
                  onClick={() => {
                    setDropoff(r);
                    setQuery("");
                    router.push("/book");
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-0.5 pt-1">
              {savedPlaces.slice(0, 3).map((p) => (
                <PlaceRow
                  key={p.id}
                  icon={p.id === "home" ? HomeIcon : p.id === "work" ? BriefcaseIcon : ClockIcon}
                  title={p.label}
                  subtitle={p.primary}
                  onClick={() => {
                    setDropoff(p);
                    router.push("/book");
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {dropoff && (
        <div className="absolute inset-x-0 bottom-4 z-10 px-4 pb-safe">
          <Button
            size="lg"
            className="mx-auto flex w-full max-w-md shadow-xl"
            onClick={() => router.push("/book")}
          >
            <span className="truncate">Continue to {dropoff.primary}</span>
            <ArrowRightIcon />
          </Button>
        </div>
      )}
    </div>
  );
}

function PlaceRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm outline-none transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="truncate font-medium">{title}</div>
        {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      <ArrowRightIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground/60" />
    </button>
  );
}
