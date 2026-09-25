"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { DriverInfoCard } from "@/components/shared/driver-info-card";
import { useActiveTripStore } from "@/stores/active-trip-store";
import { useCancelTrip, useTripStatus } from "@/hooks/use-trip-queries";
import { USE_MOCK } from "@/lib/api/client";
import { useElapsed } from "@/hooks/use-elapsed";
import { Loader2Icon, ShieldAlertIcon, MessageSquareIcon } from "lucide-react";
import { toast } from "sonner";
import type { LatLng, TripStatus } from "@/types";
import { cn } from "cn";

const MapView = dynamic(
  () => import("@/components/shared/map-view").then((m) => m.default),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse-soft bg-muted" />,
  }
);

const STATUS_COPY: Record<TripStatus, { title: string; subtitle: string }> = {
  idle: { title: "Idle", subtitle: "Set a destination to start" },
  searching: { title: "Finding your driver", subtitle: "Hang tight — we'll match you in seconds." },
  matched: { title: "Driver accepted", subtitle: "Get ready, they're heading to you." },
  en_route: { title: "Driver is on the way", subtitle: "Watch the map for live updates." },
  arrived: { title: "Your driver has arrived", subtitle: "Look for the make and plate below." },
  in_progress: { title: "Trip in progress", subtitle: "Enjoy the ride." },
  completed: { title: "Trip complete", subtitle: "You've arrived." },
  cancelled: { title: "Trip cancelled", subtitle: "Book again anytime." },
};

export default function TripPage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const trip = useActiveTripStore((s) => s.trip);
  const interpolated = useActiveTripStore((s) => s.interpolatedDriverLocation);
  const driverLocation = useActiveTripStore((s) => s.driverLocation);
  const eta = useActiveTripStore((s) => s.etaSeconds);
  const statusMessage = useActiveTripStore((s) => s.statusMessage);
  const setStatus = useActiveTripStore((s) => s.setStatus);
  const clear = useActiveTripStore((s) => s.clear);
  const elapsed = useElapsed(trip?.status === "in_progress" ? eta : null);
  const { data: serverTrip } = useTripStatus(params.tripId);
  const cancelTrip = useCancelTrip(params.tripId);

  useEffect(() => {
    if (trip?.status === "completed") {
      router.replace(`/trip/${params.tripId}/receipt`);
    }
  }, [trip?.status, router, params.tripId]);

  useEffect(() => {
    if (trip) return;
    if (serverTrip) {
      useActiveTripStore.getState().setTrip(serverTrip);
    } else if (USE_MOCK) {
      useActiveTripStore.getState().setTrip({
        id: params.tripId,
        status: "searching",
        rideType: "economy",
        pickup: {
          id: "p",
          label: "Pickup",
          primary: "Current location",
          location: { lat: 37.7749, lng: -122.4194 },
        },
        dropoff: {
          id: "d",
          label: "Dropoff",
          primary: "Destination",
          location: { lat: 37.7989, lng: -122.3978 },
        },
        fare: {
          rideType: "economy",
          base: 2.5,
          distanceFare: 9.8,
          timeFare: 6.4,
          surge: 1,
          total: 18.7,
          currency: "USD",
          estimatedDistanceMiles: 3.1,
          estimatedDurationMinutes: 14,
        },
        paymentMethodId: "pm_1",
      });
    }
  }, [trip, serverTrip, params.tripId]);

  async function onCancel() {
    setStatus("cancelled");
    if (!USE_MOCK) {
      try {
        await cancelTrip.mutateAsync();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to cancel trip");
      }
    }
    setTimeout(() => {
      clear();
      router.replace("/home");
    }, 1500);
  }

  if (!trip) {
    return (
      <div className="grid min-h-[60dvh] place-items-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const driver = trip.driver;
  const markers: { id: string; position: LatLng; kind: "pickup" | "dropoff" | "driver" }[] = [
    { id: "pickup", position: trip.pickup.location, kind: "pickup" as const },
    { id: "dropoff", position: trip.dropoff.location, kind: "dropoff" as const },
  ];
  if (interpolated) {
    markers.push({
      id: "driver",
      position: interpolated,
      kind: "driver" as const,
    });
  }

  const followId =
    interpolated
      ? "driver"
      : trip.status === "in_progress"
        ? "dropoff"
        : "pickup";

  const route: LatLng[] = [];
  if (interpolated) route.push(interpolated);
  if (trip.status === "in_progress") route.push(trip.dropoff.location);
  else if (driverLocation) route.push(driverLocation, trip.pickup.location);

  return (
    <div className="relative h-[calc(100dvh-3rem)]">
      <div
        className="trip-status-announcer"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      >
        {statusMessage ?? STATUS_COPY[trip.status].title}
      </div>

      <div className="absolute inset-0">
        <MapView markers={markers} route={route} followMarkerId={followId} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-3">
        <div className="pointer-events-auto mx-auto max-w-md rounded-2xl bg-background/95 p-3 shadow-xl ring-1 ring-foreground/10 backdrop-blur">
          <div className="flex items-center justify-between">
            <StatusBadge status={trip.status} />
            {eta != null && trip.status !== "completed" && trip.status !== "cancelled" && (
              <div className="text-right text-xs text-muted-foreground">
                <div>ETA</div>
                <div className="font-mono text-sm font-semibold text-foreground tabular-nums">
                  {trip.status === "in_progress" ? elapsed : formatMinSec(eta)}
                </div>
              </div>
            )}
          </div>
          <div className="mt-2">
            <div className="text-base font-semibold">{STATUS_COPY[trip.status].title}</div>
            <div className="text-xs text-muted-foreground">{STATUS_COPY[trip.status].subtitle}</div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 pb-safe">
        <div className="pointer-events-auto mx-auto max-w-md space-y-3">
          {driver && (
            <DriverInfoCard
              driver={driver}
              vehicle={driver.vehicle}
              rightAction={
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Message driver"
                    className="flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  >
                    <MessageSquareIcon className="size-4" />
                  </button>
                </div>
              }
            />
          )}

          <div className={cn(
            "flex items-center gap-2 rounded-2xl bg-background/95 p-2 shadow-xl ring-1 ring-foreground/10 backdrop-blur",
            !driver && "justify-center"
          )}>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" size="lg" className="flex-1">
                    <ShieldAlertIcon />
                    Cancel trip
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this trip?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A cancellation fee may apply if your driver has already arrived.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep trip</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onCancel}
                  >
                    Yes, cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="secondary" size="lg" onClick={() => router.push("/home")}>
              Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatMinSec(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
