"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSignIcon, ClockIcon, TrendingUpIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useDriverStatusStore } from "@/stores/driver-status-store";
import { startMockIncomingRequest } from "@/lib/socket/client";
import { USE_MOCK } from "@/lib/api/client";
import {
  useAcceptTrip,
  useDriverLocation,
  useDriverOnline,
  useEarnings,
} from "@/hooks/use-trip-queries";
import { DEFAULT_MAP_CENTER } from "@/lib/mock/data";
import { toast } from "sonner";
import { cn } from "cn";

const MapView = dynamic(
  () => import("@/components/shared/map-view").then((m) => m.default),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse-soft bg-muted" /> }
);

export default function DriverDashboardPage() {
  const router = useRouter();
  const isOnline = useDriverStatusStore((s) => s.isOnline);
  const setOnline = useDriverStatusStore((s) => s.setOnline);
  const incomingRequest = useDriverStatusStore((s) => s.incomingRequest);
  const clearIncomingRequest = useDriverStatusStore((s) => s.clearIncomingRequest);

  const setOnlineApi = useDriverOnline();
  const reportLocation = useDriverLocation();
  const acceptTrip = useAcceptTrip(incomingRequest?.tripId ?? "");
  const { data: earningsData } = useEarnings();

  const today = earningsData && earningsData.length > 0 ? earningsData[earningsData.length - 1] : null;
  const earnings = today?.earnings ?? 0;
  const trips = today?.trips ?? 0;
  const onlineMin = today?.onlineMinutes ?? 0;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const lastLocationSent = useRef(0);

  async function onToggleOnline(v: boolean) {
    setOnline(v);
    if (USE_MOCK) return;
    try {
      await setOnlineApi.mutateAsync(v);
    } catch (err) {
      setOnline(!v);
      toast.error(err instanceof Error ? err.message : "Failed to update online status");
    }
  }

  function simulateRequest() {
    startMockIncomingRequest();
  }

  async function onAccept() {
    if (!incomingRequest) return;
    try {
      await acceptTrip.mutateAsync();
      clearIncomingRequest();
      setDrawerOpen(false);
      router.push(`/driver/trip/${incomingRequest.tripId}`);
    } catch (err) {
      clearIncomingRequest();
      setDrawerOpen(false);
      toast.error(err instanceof Error ? err.message : "Failed to accept request");
    }
  }

  useEffect(() => {
    if (!incomingRequest || drawerOpen) return;
    const id = window.setTimeout(() => setDrawerOpen(true), 0);
    return () => window.clearTimeout(id);
  }, [incomingRequest, drawerOpen]);

  useEffect(() => {
    if (USE_MOCK || !isOnline) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const send = (latitude: number, longitude: number) => {
      const now = Date.now();
      if (now - lastLocationSent.current < 4000) return;
      lastLocationSent.current = now;
      reportLocation.mutate({ latitude, longitude });
    };
    const watchId = navigator.geolocation.watchPosition(
      (pos) => send(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        console.warn("geolocation unavailable, using fallback location", err);
        send(DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline, reportLocation, USE_MOCK]);

  return (
    <div className="relative h-map">
      <div className="absolute inset-0">
        <MapView center={DEFAULT_MAP_CENTER} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 space-y-2 px-4 pt-3">
        <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-3 panel p-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</div>
            <div className="text-sm font-semibold">{isOnline ? "Online" : "Offline"}</div>
          </div>
          <Switch
            checked={isOnline}
            onCheckedChange={onToggleOnline}
            aria-label="Toggle online status"
            className="data-checked:bg-status-online"
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 pb-safe">
        <div className="pointer-events-auto mx-auto max-w-md space-y-3">
          <Card size="sm">
            <CardContent className="grid grid-cols-3 divide-x p-0">
              <Stat icon={DollarSignIcon} label="Today" value={`$${earnings.toFixed(2)}`} accent />
              <Stat icon={ClockIcon} label="Online" value={formatMinutes(onlineMin)} />
              <Stat icon={TrendingUpIcon} label="Trips" value={String(trips)} />
            </CardContent>
          </Card>

          {isOnline ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-status-online/15 p-3 text-sm font-medium text-status-online">
              <span className="relative grid size-2 place-items-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-status-online/60" />
                <span className="relative size-2 rounded-full bg-status-online" />
              </span>
              Waiting for requests…
            </div>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => onToggleOnline(true)}
            >
              Go online
            </Button>
          )}

          {USE_MOCK && !incomingRequest && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={simulateRequest}
            >
              Simulate incoming request
            </Button>
          )}
        </div>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} showSwipeHandle swipeDirection="down">
        <DrawerContent>
          {incomingRequest ? (
            <div className="px-4 pt-2 pb-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  New request
                </div>
                <div className={cn(
                  "grid size-12 place-items-center rounded-full font-mono text-lg font-semibold tabular-nums",
                  incomingRequest.secondsRemaining <= 5
                    ? "bg-status-cancelled/15 text-status-cancelled"
                    : "bg-secondary text-foreground"
                )}>
                  {incomingRequest.secondsRemaining}
                </div>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-start gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-status-online" />
                  <div>
                    <div className="text-sm font-semibold">{incomingRequest.pickupLabel}</div>
                    <div className="text-xs text-muted-foreground">Pickup</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-destructive" />
                  <div>
                    <div className="text-sm font-semibold">{incomingRequest.dropoffLabel}</div>
                    <div className="text-xs text-muted-foreground">Dropoff</div>
                  </div>
                </div>
              </div>

              <div className="mb-4 rounded-xl bg-foreground p-4 text-background">
                <div className="text-xs uppercase tracking-wide opacity-70">Estimated fare</div>
                <div className="font-mono text-2xl font-semibold tabular-nums">
                  ${incomingRequest.fareTotal.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    clearIncomingRequest();
                    setDrawerOpen(false);
                  }}
                >
                  Decline
                </Button>
                <Button size="lg" className="flex-[2]" onClick={onAccept}>
                  Accept
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-4 pt-2 pb-4 text-center text-sm text-muted-foreground">
              Request expired.
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 p-4 text-center">
      <Icon className={cn("size-4", accent ? "text-status-completed" : "text-muted-foreground")} />
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function formatMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
