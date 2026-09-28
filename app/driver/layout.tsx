"use client";

import { useEffect } from "react";
import { Home, DollarSign, History, User2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useSyncSession } from "@/hooks/use-sync-session";
import { useSocket } from "@/lib/socket/client";
import { useDriverStatusStore } from "@/stores/driver-status-store";
import { useDriverMarkerInterpolator } from "@/hooks/use-driver-marker-interpolator";
import { AppShell, type NavTab } from "@/components/shared/app-shell";
import { LocationPermissionDialog } from "@/components/shared/location-permission-dialog";

const TABS: readonly NavTab[] = [
  { href: "/driver/dashboard", label: "Home", icon: Home },
  { href: "/driver/earnings", label: "Earnings", icon: DollarSign },
  { href: "/driver/trips", label: "Trips", icon: History },
  { href: "/driver/profile", label: "Profile", icon: User2 },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const setIncomingRequest = useDriverStatusStore((s) => s.setIncomingRequest);
  const clearIncomingRequest = useDriverStatusStore((s) => s.clearIncomingRequest);

  useSyncSession();
  useDriverMarkerInterpolator();

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (user) {
      document.cookie = `uber-ride-role=${user.role}; path=/; max-age=86400`;
    }
  }, [user]);

  useSocket({
    onIncomingRequest: (req) => {
      setIncomingRequest(req);
    },
    onRequestTick: (tripId, secondsRemaining) => {
      const store = useDriverStatusStore.getState();
      const req = store.incomingRequest;
      if (req && req.tripId === tripId) {
        store.setIncomingRequest({ ...req, secondsRemaining });
      }
    },
    onRequestCancelled: () => {
      clearIncomingRequest();
    },
  });

  return (
    <AppShell
      wordmark="Drive"
      homeHref="/driver/dashboard"
      tabs={TABS}
      navLabel="Driver navigation"
    >
      {children}
      <LocationPermissionDialog />
    </AppShell>
  );
}
