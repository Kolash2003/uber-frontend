"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useSyncSession } from "@/hooks/use-sync-session";
import { useSocket } from "@/lib/socket/client";
import { useActiveTripStore } from "@/stores/active-trip-store";
import { RiderBottomNav } from "@/components/shared/rider-bottom-nav";
import { ConnectivityIndicator } from "@/components/shared/connectivity-indicator";
import { useDriverMarkerInterpolator } from "@/hooks/use-driver-marker-interpolator";

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  useSyncSession();
  useDriverMarkerInterpolator();

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (user) {
      document.cookie = `uber-ride-role=${user.role}; path=/; max-age=86400`;
    }
  }, [user]);

  useSocket({
    onStatusChange: (_tripId, status, _message, extra) => {
      const store = useActiveTripStore.getState();
      store.setStatus(status);
      if (extra?.driver) {
        store.setDriver(extra.driver as import("@/types").Driver & { vehicle: import("@/types").Vehicle });
      }
    },
    onDriverLocation: (_tripId, lat, lng) => {
      useActiveTripStore.getState().setDriverLocation({ lat, lng });
    },
    onEta: (_tripId, etaSeconds) => {
      useActiveTripStore.getState().setEta(etaSeconds);
    },
  });

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Link href="/home" className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid size-7 place-items-center rounded-md bg-foreground text-background text-xs">R</span>
          Ride
        </Link>
        <ConnectivityIndicator />
      </header>
      <main className="flex-1">{children}</main>
      <RiderBottomNav />
    </div>
  );
}
