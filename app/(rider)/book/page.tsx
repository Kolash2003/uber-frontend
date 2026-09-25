"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CreditCardIcon,
  Loader2Icon,
  MapPinIcon,
  PencilIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookingStore } from "@/stores/booking-store";
import {
  useFareEstimate,
  usePaymentMethods,
  useRequestTrip,
  useSavedPlaces,
} from "@/hooks/use-trip-queries";
import { RideTypeIcon } from "@/components/shared/ride-type-icon";
import { RIDE_TYPES } from "@/lib/mock/data";
import { USE_MOCK } from "@/lib/api/client";
import { useActiveTripStore } from "@/stores/active-trip-store";
import { startMockTripSimulation } from "@/lib/socket/client";
import { toast } from "sonner";
import { cn } from "cn";
import type { FareEstimate, RideType } from "@/types";

const MapView = dynamic(
  () => import("@/components/shared/map-view").then((m) => m.default),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse-soft bg-muted" />,
  }
);

const STEP_LABELS = ["Where", "Ride", "Confirm"] as const;

export default function BookPage() {
  const router = useRouter();
  const pickup = useBookingStore((s) => s.pickup);
  const dropoff = useBookingStore((s) => s.dropoff);
  const rideType = useBookingStore((s) => s.rideType);
  const setRideType = useBookingStore((s) => s.setRideType);
  const paymentMethodId = useBookingStore((s) => s.paymentMethodId);
  const setPaymentMethodId = useBookingStore((s) => s.setPaymentMethodId);
  const reset = useBookingStore((s) => s.reset);

  useEffect(() => {
    if (!dropoff) {
      router.replace("/home");
    }
  }, [dropoff, router]);

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const { data: estimates, isLoading: loadingEstimates } = useFareEstimate({
    pickup: pickup ?? undefined,
    dropoff: dropoff ?? undefined,
  });
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: savedPlaces = [] } = useSavedPlaces();

  const selectedEstimate = useMemo<FareEstimate | undefined>(
    () => estimates?.find((e) => e.rideType === rideType),
    [estimates, rideType]
  );

  useEffect(() => {
    if (!paymentMethodId && paymentMethods[0]) {
      setPaymentMethodId(paymentMethods[0].id);
    }
  }, [paymentMethods, paymentMethodId, setPaymentMethodId]);

  const [requesting, setRequesting] = useState(false);
  const requestTrip = useRequestTrip();

  async function onConfirm() {
    if (!pickup || !dropoff || !selectedEstimate || !paymentMethodId) return;
    setRequesting(true);
    try {
      const { tripId, status } = await requestTrip.mutateAsync({
        pickup,
        dropoff,
        rideType,
        paymentMethodId,
      });
      useActiveTripStore.getState().setTrip({
        id: tripId,
        status: status ?? "searching",
        rideType,
        pickup,
        dropoff,
        fare: selectedEstimate,
        paymentMethodId,
      });
      if (USE_MOCK) {
        startMockTripSimulation(tripId, pickup.location, dropoff.location);
      }
      toast.success("Looking for a driver");
      router.replace(`/trip/${tripId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not request ride");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="relative h-[calc(100dvh-3rem)]">
      <div className="absolute inset-0">
        <MapView
          center={pickup?.location}
          markers={[
            pickup ? { id: "p", position: pickup.location, kind: "pickup", label: "Pickup" } : null,
            dropoff ? { id: "d", position: dropoff.location, kind: "dropoff", label: "Dropoff" } : null,
          ].filter(Boolean) as never[]}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start gap-2 px-4 pt-4">
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className="pointer-events-auto rounded-full bg-background/95 shadow-md ring-1 ring-foreground/10 backdrop-blur"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ArrowLeftIcon />
        </Button>
      </div>

      <Drawer defaultOpen showSwipeHandle swipeDirection="down" snapPoints={["50%", "88dvh"]}>
        <DrawerTrigger className="hidden" />
        <DrawerContent className="max-h-[88dvh]">
          <div className="px-4 pt-2">
            <Stepper currentStep={step} />
          </div>

          <div className="px-4 py-4">
            <RouteHeader
              pickup={savedPlaces.find((p) => p.id === pickup?.id) ?? pickup}
              dropoff={dropoff}
            />
          </div>

          <Separator />

          <div className="overflow-y-auto px-4 py-4">
            {step === 1 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold">Choose a ride</h2>
                {loadingEstimates ? (
                  <div className="space-y-2">
                    {RIDE_TYPES.map((r) => (
                      <Skeleton key={r.id} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <RadioGroup
                    value={rideType}
                    onValueChange={(v) => setRideType(v as RideType)}
                    className="gap-2"
                  >
                    {RIDE_TYPES.map((rt) => {
                      const estimate = estimates?.find((e) => e.rideType === rt.id);
                      const selected = rideType === rt.id;
                      return (
                        <label
                          key={rt.id}
                          htmlFor={`ride-${rt.id}`}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                            selected
                              ? "border-foreground bg-foreground/[0.04]"
                              : "border-border hover:bg-secondary/50"
                          )}
                        >
                          <RadioGroupItem value={rt.id} id={`ride-${rt.id}`} className="sr-only" />
                          <div className="grid size-12 place-items-center rounded-lg bg-secondary">
                            <RideTypeIcon rideType={rt.id} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between">
                              <div className="text-sm font-semibold">{rt.name}</div>
                              {estimate && (
                                <div className="font-mono text-sm font-semibold tabular-nums">
                                  ${estimate.total.toFixed(2)}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {rt.description}
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span>{rt.etaMinutes} min away</span>
                              <span>·</span>
                              <span>{rt.capacity} seats</span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </RadioGroup>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold">Payment</h2>
                <RadioGroup
                  value={paymentMethodId ?? ""}
                  onValueChange={setPaymentMethodId}
                  className="gap-2"
                >
                  {paymentMethods.map((pm) => (
                    <label
                      key={pm.id}
                      htmlFor={`pm-${pm.id}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                        paymentMethodId === pm.id
                          ? "border-foreground bg-foreground/[0.04]"
                          : "border-border hover:bg-secondary/50"
                      )}
                    >
                      <RadioGroupItem value={pm.id} id={`pm-${pm.id}`} className="sr-only" />
                      <div className="grid size-10 place-items-center rounded-md bg-secondary">
                        <CreditCardIcon className="size-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium uppercase">
                          {pm.brand} •••• {pm.last4}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Exp {pm.expMonth.toString().padStart(2, "0")}/{pm.expYear}
                        </div>
                      </div>
                      {pm.isDefault && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                          Default
                        </span>
                      )}
                    </label>
                  ))}
                </RadioGroup>

                {selectedEstimate && (
                  <div className="mt-4 rounded-xl bg-secondary/40 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Estimated total</span>
                      <span className="font-mono font-semibold tabular-nums">
                        ${selectedEstimate.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && selectedEstimate && (
              <div className="space-y-4 text-sm">
                <h2 className="text-sm font-semibold">Confirm your ride</h2>
                <ConfirmRow label="Pickup" value={pickup?.primary ?? ""} />
                <ConfirmRow label="Dropoff" value={dropoff?.primary ?? ""} />
                <ConfirmRow label="Ride" value={RIDE_TYPES.find((r) => r.id === rideType)?.name ?? ""} />
                <ConfirmRow
                  label="Payment"
                  value={
                    paymentMethods.find((p) => p.id === paymentMethodId)?.brand?.toUpperCase() +
                    " •••• " +
                    paymentMethods.find((p) => p.id === paymentMethodId)?.last4
                  }
                />
                <ConfirmRow label="Total" value={`$${selectedEstimate.total.toFixed(2)}`} bold />
              </div>
            )}
          </div>

          <div className="mt-auto border-t bg-background/95 p-4 pb-safe backdrop-blur">
            {step === 1 && (
              <Button
                size="lg"
                className="w-full"
                onClick={() => setStep(2)}
                disabled={loadingEstimates || !rideType}
              >
                Choose payment
                <ArrowRightIcon />
              </Button>
            )}
            {step === 2 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="lg" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  size="lg"
                  className="flex-[2]"
                  onClick={() => setStep(3)}
                  disabled={!paymentMethodId}
                >
                  Review
                  <ArrowRightIcon />
                </Button>
              </div>
            )}
            {step === 3 && (
              <Button
                size="lg"
                className="w-full"
                onClick={onConfirm}
                disabled={requesting || !selectedEstimate || !paymentMethodId}
              >
                {requesting ? <Loader2Icon className="animate-spin" /> : "Request ride"}
              </Button>
            )}
            <button
              type="button"
              className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                reset();
                router.replace("/home");
              }}
            >
              Cancel
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function Stepper({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-2 text-[11px] uppercase tracking-wide">
      {STEP_LABELS.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3;
        const active = step === currentStep;
        const done = step < currentStep;
        return (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2",
              active ? "text-foreground" : done ? "text-status-completed" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full text-[10px] font-semibold",
                active && "bg-foreground text-background",
                done && "bg-status-completed text-background",
                !active && !done && "bg-secondary"
              )}
            >
              {step}
            </span>
            <span>{label}</span>
            {i < STEP_LABELS.length - 1 && (
              <span className="mx-1 h-px w-6 bg-border" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function RouteHeader({
  pickup,
  dropoff,
}: {
  pickup: import("@/types").Address | null | undefined;
  dropoff: import("@/types").Address | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center pt-1">
        <span className="grid size-2.5 place-items-center rounded-full bg-status-online" />
        <span className="my-0.5 h-6 w-px bg-border" />
        <span className="grid size-2.5 place-items-center rounded-full bg-destructive" />
      </div>
      <div className="flex-1 space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 truncate font-medium">{pickup?.primary ?? "Pickup"}</div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 truncate font-medium">{dropoff?.primary ?? "Dropoff"}</div>
        </div>
      </div>
      <button
        type="button"
        aria-label="Edit stops"
        className="grid size-8 place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
      >
        <PencilIcon className="size-4" />
      </button>
    </div>
  );
}

function ConfirmRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right", bold && "font-semibold")}>{value}</span>
    </div>
  );
}
