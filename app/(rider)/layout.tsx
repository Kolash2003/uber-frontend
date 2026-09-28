"use client";

import { useEffect } from "react";
import { Home, History, User2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useSyncSession } from "@/hooks/use-sync-session";
import { useSocket } from "@/lib/socket/client";
import { useActiveTripStore } from "@/stores/active-trip-store";
import { AppShell, type NavTab } from "@/components/shared/app-shell";
import { LocationPermissionDialog } from "@/components/shared/location-permission-dialog";
import { useDriverMarkerInterpolator } from "@/hooks/use-driver-marker-interpolator";

const TABS: readonly NavTab[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/trips", label: "Trips", icon: History },
  { href: "/profile", label: "Profile", icon: User2 },
];

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
    <AppShell wordmark="Ride" homeHref="/home" tabs={TABS} navLabel="Rider navigation">
      {children}
      <LocationPermissionDialog />
    </AppShell>
  );
}
