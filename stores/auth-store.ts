import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserRole } from "@/types";

export type AuthUser = {
  id: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  email?: string;
  photoUrl?: string;
  role: UserRole;
};

type AuthState = {
  user: AuthUser | null;
  status: "unauthenticated" | "authenticated";
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthState["status"]) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      status: "unauthenticated",
      setUser: (user) =>
        set({
          user,
          status: user ? "authenticated" : "unauthenticated",
        }),
      setStatus: (status) => set({ status }),
      signOut: () =>
        set({
          user: null,
          status: "unauthenticated",
        }),
    }),
    {
      name: "uber-ride-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        status: state.status,
      }),
    }
  )
);
