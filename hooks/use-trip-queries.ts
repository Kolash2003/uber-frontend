import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  Address,
  EarningsByDay,
  FareEstimate,
  PaymentMethod,
  RideType,
  Trip,
  TripStatus,
} from "@/types";

export const queryKeys = {
  trips: ["trips"] as const,
  activeTrip: ["trips", "active"] as const,
  trip: (id: string) => ["trips", id] as const,
  savedPlaces: ["saved-places"] as const,
  paymentMethods: ["payment-methods"] as const,
  earnings: ["earnings"] as const,
  fareEstimate: (pickupId?: string, dropoffId?: string) =>
    ["fare", "estimate", pickupId, dropoffId] as const,
  me: ["me"] as const,
};

export function useTrips() {
  return useQuery({
    queryKey: queryKeys.trips,
    queryFn: () => api.get<Trip[]>("/trips"),
  });
}

export function useActiveTrip() {
  return useQuery({
    queryKey: queryKeys.activeTrip,
    queryFn: () => api.get<Trip | null>("/trips/active"),
    refetchInterval: 30_000,
  });
}

export function useSavedPlaces() {
  return useQuery({
    queryKey: queryKeys.savedPlaces,
    queryFn: () => api.get<Address[]>("/saved-places"),
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: queryKeys.paymentMethods,
    queryFn: () => api.get<PaymentMethod[]>("/payment-methods"),
  });
}

export function useEarnings() {
  return useQuery({
    queryKey: queryKeys.earnings,
    queryFn: () => api.get<EarningsByDay[]>("/earnings"),
  });
}

export function useFareEstimate(opts: {
  pickup?: Address;
  dropoff?: Address;
  enabled?: boolean;
}) {
  const { pickup, dropoff } = opts;
  const params =
    pickup && dropoff
      ? `pickupLat=${pickup.location.lat}&pickupLng=${pickup.location.lng}&dropoffLat=${dropoff.location.lat}&dropoffLng=${dropoff.location.lng}`
      : "";
  return useQuery({
    queryKey: queryKeys.fareEstimate(pickup?.id, dropoff?.id),
    queryFn: () => api.get<FareEstimate[]>(`/fare/estimate?${params}`),
    enabled: opts.enabled !== false && Boolean(pickup && dropoff),
    staleTime: 30_000,
  });
}

export function useTripStatus(tripId: string | undefined) {
  return useQuery({
    queryKey: tripId ? queryKeys.trip(tripId) : ["trips", "noop"],
    queryFn: () => api.get<Trip>(`/trips/${tripId}`),
    enabled: Boolean(tripId),
    refetchInterval: (q) => {
      const status = (q.state.data as Trip | undefined)?.status as
        | TripStatus
        | undefined;
      if (!status) return 5_000;
      if (status === "completed" || status === "cancelled") return false;
      return 3_000;
    },
  });
}

// ---- Mutations ----
export function useRequestTrip() {
  return useMutation({
    mutationFn: (body: {
      pickup: Address;
      dropoff: Address;
      rideType: RideType;
      paymentMethodId: string;
    }) => api.post<{ tripId: string; status: TripStatus }>("/trip/request", body),
  });
}

export function useAcceptTrip(tripId: string) {
  return useMutation({
    mutationFn: () =>
      api.post<{ tripId: string; status: TripStatus }>(`/trips/${tripId}/accept`),
  });
}

export function useUpdateTripStatus() {
  return useMutation({
    mutationFn: (body: { tripId: string; status: TripStatus }) =>
      api.post<{ tripId: string; status: TripStatus }>(`/trips/${body.tripId}/status`, {
        status: body.status,
      }),
  });
}

export function useCancelTrip(tripId: string) {
  return useMutation({
    mutationFn: () =>
      api.post<{ tripId: string; status: TripStatus }>(`/trips/${tripId}/cancel`),
  });
}

export function useRateTrip(tripId: string) {
  return useMutation({
    mutationFn: (body: { rating?: number; tip?: number; feedback?: string }) =>
      api.post<{ ok: true }>(`/trips/${tripId}/rate`, body),
  });
}

export function useDriverOnline() {
  return useMutation({
    mutationFn: (online: boolean) =>
      api.post<{ ok: true }>("/driver/online", { online }),
  });
}

export function useDriverLocation() {
  return useMutation({
    mutationFn: (body: { latitude: number; longitude: number }) =>
      api.post<{ ok: true; latitude: number; longitude: number }>("/driver/location", body),
  });
}