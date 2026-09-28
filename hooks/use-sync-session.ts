"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types";

type SessionUser = {
  id: string;
  email?: string | null;
  image?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  role?: string | null;
  lastLat?: number | null;
  lastLng?: number | null;
  lastAddress?: string | null;
};

export function useSyncSession() {
  useEffect(() => {
    let cancelled = false;

    authClient
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        const sessionUser = data?.user as unknown as SessionUser | undefined;
        const store = useAuthStore.getState();

        if (!sessionUser) {
          if (store.user) store.signOut();
          return;
        }

        const hasLocation =
          sessionUser.lastLat != null && sessionUser.lastLng != null;

        store.setUser({
          id: sessionUser.id,
          firstName: sessionUser.firstName ?? "",
          lastName: sessionUser.lastName ?? "",
          email: sessionUser.email ?? undefined,
          phoneNumber: sessionUser.phoneNumber ?? undefined,
          photoUrl: sessionUser.image ?? undefined,
          role: (sessionUser.role as UserRole) ?? "rider",
          hasLocation,
          lastLat: sessionUser.lastLat ?? undefined,
          lastLng: sessionUser.lastLng ?? undefined,
          lastAddress: sessionUser.lastAddress ?? undefined,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);
}
