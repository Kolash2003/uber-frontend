"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useActiveTripStore } from "@/stores/active-trip-store";
import { useTripStatus, useUpdateTripStatus } from "@/hooks/use-trip-queries";
import { USE_MOCK } from "@/lib/api/client";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, MessageSquareIcon, PhoneIcon, ShieldAlertIcon, SquareCheckIcon, FlagIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import type { TripStatus } from "@/types";

const MapView = dynamic(
  () => import("@/components/shared/map-view").then((m) => m.default),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse-soft bg-muted" /> }
);

const ACTIONS: Record<TripStatus, { label: string; icon: React.ComponentType<{ className?: string }>; nextStatus: TripStatus }> = {
  matched: { label: "Start navigation to pickup", icon: FlagIcon, nextStatus: "en_route" },
  en_route: { label: "I've arrived", icon: FlagIcon, nextStatus: "arrived" },
  arrived: { label: "Start trip", icon: FlagIcon, nextStatus: "in_progress" },
  in_progress: { label: "End trip", icon: SquareCheckIcon, nextStatus: "completed" },
  idle: { label: "", icon: FlagIcon, nextStatus: "idle" },
  searching: { label: "", icon: FlagIcon, nextStatus: "idle" },
  completed: { label: "", icon: FlagIcon, nextStatus: "idle" },
  cancelled: { label: "", icon: FlagIcon, nextStatus: "idle" },
};

export default function DriverTripPage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const trip = useActiveTripStore((s) => s.trip);
  const interpolated = useActiveTripStore((s) => s.interpolatedDriverLocation);
  const setStatus = useActiveTripStore((s) => s.setStatus);
  const setTrip = useActiveTripStore((s) => s.setTrip);
  const clear = useActiveTripStore((s) => s.clear);
  const updateStatus = useUpdateTripStatus();
  const { data: serverTrip } = useTripStatus(params.tripId);

  useEffect(() => {
    if (trip) return;
    if (serverTrip) {
      setTrip(serverTrip);
    } else if (USE_MOCK) {
      setTrip({
        id: params.tripId,
        status: "matched",
        rideType: "economy",
        pickup: {
          id: "p",
          label: "Pickup",
          primary: "1455 Market St, San Francisco",
          location: { lat: 37.7766, lng: -122.4172 },
        },
        dropoff: {
          id: "d",
          label: "Dropoff",
          primary: "SFO Airport, Terminal 2",
          location: { lat: 37.6213, lng: -122.379 },
        },
        fare: {
          rideType: "economy",
          base: 2.5,
          distanceFare: 22.4,
          timeFare: 11.6,
          surge: 1,
          total: 36.5,
          currency: "USD",
          estimatedDistanceMiles: 13.2,
          estimatedDurationMinutes: 26,
        },
        paymentMethodId: "pm_1",
      });
    }
  }, [trip, serverTrip, params.tripId, setTrip, USE_MOCK]);

  useEffect(() => {
    if (trip?.status === "completed" || trip?.status === "cancelled") {
      clear();
      router.replace("/driver/dashboard");
    }
  }, [trip?.status, clear, router]);

  if (!trip) return null;

  const action = ACTIONS[trip.status];

  async function onAction() {
    try {
      await updateStatus.mutateAsync({ tripId: params.tripId, status: action.nextStatus });
      setStatus(action.nextStatus);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update trip");
    }
  }

  return (
    <div className="relative h-[calc(100dvh-3rem)]">
      <div className="absolute inset-0">
        <MapView
          markers={[
            { id: "pickup", position: trip.pickup.location, kind: "pickup" },
            { id: "dropoff", position: trip.dropoff.location, kind: "dropoff" },
            ...(interpolated
              ? [{ id: "driver", position: interpolated, kind: "driver" as const }]
              : []),
          ]}
          followMarkerId={
            trip.status === "in_progress"
              ? "dropoff"
              : trip.status === "en_route" || trip.status === "arrived"
                ? "pickup"
                : "pickup"
          }
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 px-4 pt-3">
        <Button
          variant="secondary"
          size="icon-sm"
          className="pointer-events-auto rounded-full bg-background/95 shadow-md ring-1 ring-foreground/10 backdrop-blur"
          onClick={() => router.replace("/driver/dashboard")}
          aria-label="Back"
        >
          <ArrowLeftIcon />
        </Button>
        <div className="pointer-events-auto rounded-full bg-background/95 px-3 py-1.5 shadow-md ring-1 ring-foreground/10 backdrop-blur">
          <StatusBadge status={trip.status} />
        </div>
        <div className="w-9" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 space-y-2 p-4 pb-safe">
        <div className="pointer-events-auto mx-auto max-w-md space-y-3 rounded-2xl bg-background/95 p-3 shadow-xl ring-1 ring-foreground/10 backdrop-blur">
          <div className="text-sm font-semibold">
            {trip.status === "in_progress" ? "Heading to" : "Pickup"}
          </div>
          <div className="text-base font-medium">
            {trip.status === "in_progress" ? trip.dropoff.primary : trip.pickup.primary}
          </div>

          {action.label && (
            <Button
              size="lg"
              className="w-full"
              onClick={onAction}
            >
              <action.icon />
              {action.label}
            </Button>
          )}

          <div className="grid grid-cols-3 gap-2 pt-1">
            <Button variant="outline" size="sm">
              <PhoneIcon />
              Call
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquareIcon />
              Chat
            </Button>
            <Button variant="outline" size="sm">
              <ShieldAlertIcon />
              SOS
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
