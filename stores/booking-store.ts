import { create } from "zustand";
import type { Address, RideType } from "@/types";

type BookingState = {
  pickup: Address | null;
  dropoff: Address | null;
  rideType: RideType;
  paymentMethodId: string | null;
  notes: string;
  step: "idle" | "selecting-destination" | "choosing-ride" | "confirming" | "searching";
  setPickup: (pickup: Address | null) => void;
  setDropoff: (dropoff: Address | null) => void;
  setRideType: (rideType: RideType) => void;
  setPaymentMethodId: (id: string | null) => void;
  setNotes: (notes: string) => void;
  setStep: (step: BookingState["step"]) => void;
  reset: () => void;
};

const initialState = {
  pickup: null,
  dropoff: null,
  rideType: "economy" as RideType,
  paymentMethodId: null,
  notes: "",
  step: "idle" as BookingState["step"],
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,
  setPickup: (pickup) => set({ pickup }),
  setDropoff: (dropoff) => set({ dropoff }),
  setRideType: (rideType) => set({ rideType }),
  setPaymentMethodId: (paymentMethodId) => set({ paymentMethodId }),
  setNotes: (notes) => set({ notes }),
  setStep: (step) => set({ step }),
  reset: () => set(initialState),
}));
