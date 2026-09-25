import { create } from "zustand";

type DriverStatusState = {
  isOnline: boolean;
  todaysEarnings: number;
  todaysTrips: number;
  todaysOnlineMinutes: number;
  incomingRequest: {
    tripId: string;
    pickupLabel: string;
    dropoffLabel: string;
    fareTotal: number;
    secondsRemaining: number;
  } | null;
  setOnline: (online: boolean) => void;
  setEarnings: (amount: number) => void;
  setIncomingRequest: (
    req: DriverStatusState["incomingRequest"]
  ) => void;
  decrementRequestTimer: () => void;
  clearIncomingRequest: () => void;
};

export const useDriverStatusStore = create<DriverStatusState>((set) => ({
  isOnline: false,
  todaysEarnings: 0,
  todaysTrips: 0,
  todaysOnlineMinutes: 0,
  incomingRequest: null,
  setOnline: (isOnline) => set({ isOnline }),
  setEarnings: (todaysEarnings) => set({ todaysEarnings }),
  setIncomingRequest: (incomingRequest) => set({ incomingRequest }),
  decrementRequestTimer: () =>
    set((state) =>
      state.incomingRequest && state.incomingRequest.secondsRemaining > 0
        ? {
            incomingRequest: {
              ...state.incomingRequest,
              secondsRemaining: state.incomingRequest.secondsRemaining - 1,
            },
          }
        : state
    ),
  clearIncomingRequest: () => set({ incomingRequest: null }),
}));
