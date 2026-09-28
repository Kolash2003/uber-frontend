import { create } from "zustand";

type ConnectivityStateStore = {
  state: "online" | "reconnecting" | "offline";
  lastConnectedAt: number | null;
  reconnectAttempts: number;
  setState: (state: ConnectivityStateStore["state"]) => void;
  incrementAttempts: () => void;
  resetAttempts: () => void;
};

export const useConnectivityStore = create<ConnectivityStateStore>((set) => ({
  state: "reconnecting",
  lastConnectedAt: null,
  reconnectAttempts: 0,
  setState: (state) =>
    set((prev) => ({
      state,
      lastConnectedAt: state === "online" ? Date.now() : prev.lastConnectedAt,
      reconnectAttempts: state === "online" ? 0 : prev.reconnectAttempts,
    })),
  incrementAttempts: () =>
    set((prev) => ({ reconnectAttempts: prev.reconnectAttempts + 1 })),
  resetAttempts: () => set({ reconnectAttempts: 0 }),
}));
