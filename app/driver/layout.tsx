"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Home, DollarSign, History, User2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useSyncSession } from "@/hooks/use-sync-session";
import { useSocket } from "@/lib/socket/client";
import { useDriverStatusStore } from "@/stores/driver-status-store";
import { useDriverMarkerInterpolator } from "@/hooks/use-driver-marker-interpolator";
import { ConnectivityIndicator } from "@/components/shared/connectivity-indicator";
import { LocationPermissionDialog } from "@/components/shared/location-permission-dialog";
import { cn } from "cn";

const TABS = [
  { href: "/driver/dashboard", label: "Home", icon: Home },
  { href: "/driver/earnings", label: "Earnings", icon: DollarSign },
  { href: "/driver/trips", label: "Trips", icon: History },
  { href: "/driver/profile", label: "Profile", icon: User2 },
] as const;

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Link href="/driver/dashboard" className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid size-7 place-items-center rounded-md bg-foreground text-background text-xs">R</span>
          Drive
        </Link>
        <ConnectivityIndicator />
      </header>
      <main className="flex-1">{children}</main>
      <nav
        aria-label="Driver navigation"
        className="sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-safe"
      >
        <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-4 pt-1">
          {TABS.map((t) => {
            const active =
              pathname === t.href || (t.href !== "/driver/dashboard" && pathname.startsWith(t.href));
            const Icon = t.icon;
            return (
              <li key={t.href} className="flex-1">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-md py-2 text-xs transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span>{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <LocationPermissionDialog />
    </div>
  );
}
