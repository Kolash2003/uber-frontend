import { create } from "zustand";
import type { Trip, TripStatus, LatLng, Driver, Vehicle } from "@/types";

type ActiveTripState = {
  trip: Trip | null;
  driverLocation: LatLng | null;
  interpolatedDriverLocation: LatLng | null;
  etaSeconds: number | null;
  statusMessage: string | null;

  setTrip: (trip: Trip | null) => void;
  setStatus: (status: TripStatus, message?: string | null) => void;
  setDriver: (driver: (Driver & { vehicle: Vehicle }) | null) => void;
  setDriverLocation: (location: LatLng | null) => void;
  setInterpolatedDriverLocation: (location: LatLng | null) => void;
  setEta: (seconds: number | null) => void;
  clear: () => void;
};

export const useActiveTripStore = create<ActiveTripState>((set) => ({
  trip: null,
  driverLocation: null,
  interpolatedDriverLocation: null,
  etaSeconds: null,
  statusMessage: null,

  setTrip: (trip) => set({ trip }),
  setStatus: (status, message = null) =>
    set((state) => ({
      trip: state.trip ? { ...state.trip, status } : state.trip,
      statusMessage: message,
    })),
  setDriver: (driver) =>
    set((state) => ({
      trip: state.trip && driver ? { ...state.trip, driver: { ...driver, location: state.driverLocation ?? state.trip.pickup.location } } : state.trip,
    })),
  setDriverLocation: (driverLocation) =>
    set((state) => ({
      trip: state.trip && driverLocation && state.trip.driver
        ? { ...state.trip, driver: { ...state.trip.driver, location: driverLocation } }
        : state.trip,
      driverLocation,
    })),
  setInterpolatedDriverLocation: (interpolatedDriverLocation) =>
    set({ interpolatedDriverLocation }),
  setEta: (etaSeconds) =>
    set((state) => ({
      trip: state.trip ? { ...state.trip, etaSeconds: etaSeconds ?? undefined } : state.trip,
      etaSeconds,
    })),
  clear: () =>
    set({
      trip: null,
      driverLocation: null,
      interpolatedDriverLocation: null,
      etaSeconds: null,
      statusMessage: null,
    }),
}));
