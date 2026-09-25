import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserRole } from "@/types";

export type AuthUser = {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  photoUrl?: string;
  role: UserRole;
};

type AuthState = {
  user: AuthUser | null;
  status: "unauthenticated" | "pending-otp" | "authenticated";
  sessionToken: string | null;
  setUser: (user: AuthUser | null) => void;
  setSession: (token: string | null) => void;
  setStatus: (status: AuthState["status"]) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      status: "unauthenticated",
      sessionToken: null,
      setUser: (user) =>
        set((state) => ({
          user,
          status: user ? "authenticated" : "unauthenticated",
          sessionToken: user ? state.sessionToken : null,
        })),
      setSession: (sessionToken) => set({ sessionToken }),
      setStatus: (status) => set({ status }),
      signOut: () =>
        set({
          user: null,
          status: "unauthenticated",
          sessionToken: null,
        }),
    }),
    {
      name: "uber-ride-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        status: state.status === "pending-otp" ? "unauthenticated" : state.status,
        sessionToken: state.sessionToken,
      }),
    }
  )
);
