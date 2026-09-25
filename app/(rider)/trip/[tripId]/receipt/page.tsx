"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useActiveTripStore } from "@/stores/active-trip-store";
import { useTripStatus, useRateTrip } from "@/hooks/use-trip-queries";
import { FareBreakdown } from "@/components/shared/fare-breakdown";
import { RatingInput } from "@/components/shared/rating-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeftIcon, CheckCircle2Icon, ReceiptIcon, StarIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

const TIPS = [0, 2, 5, 10] as const;

export default function ReceiptPage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const activeTrip = useActiveTripStore((s) => s.trip);
  const clear = useActiveTripStore((s) => s.clear);
  const { data: trip } = useTripStatus(params.tripId);

  const [tip, setTip] = useState<number>(0);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const rateTrip = useRateTrip(params.tripId);

  const finalTrip = trip ?? activeTrip;
  useEffect(() => {
    if (!finalTrip) {
      router.replace("/home");
    }
  }, [finalTrip, router]);

  if (!finalTrip) return null;

  const driver = finalTrip.driver;
  const initials = driver ? `${driver.firstName[0] ?? ""}${driver.lastName[0] ?? ""}` : "?";

  async function submitRating() {
    try {
      await rateTrip.mutateAsync({ rating, tip, feedback: comment });
      toast.success("Thanks for your feedback!");
      clear();
      router.replace("/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit rating");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-safe">
      <header className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()} aria-label="Back">
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-base font-semibold">Trip receipt</h1>
      </header>

      <Card size="sm" className="mb-6 overflow-hidden">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-status-completed/15 text-status-completed">
              <CheckCircle2Icon className="size-6" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">You arrived</div>
              <div className="text-xs text-muted-foreground">{finalTrip.dropoff.primary}</div>
            </div>
            <ReceiptIcon className="size-5 text-muted-foreground" />
          </div>

          {driver && (
            <div className="flex items-center gap-3 pt-2">
              <Avatar className="size-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {driver.firstName} {driver.lastName}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <StarIcon className="size-3 fill-status-searching text-status-searching" />
                  <span>{driver.rating.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <FareBreakdown estimate={finalTrip.fare} tip={tip} className="mb-6" />

      <Card size="sm" className="mb-6">
        <CardContent className="space-y-3 p-4">
          <div className="text-sm font-semibold">Add a tip</div>
          <div className="grid grid-cols-4 gap-2">
            {TIPS.map((t) => (
              <button
                key={t}
                type="button"
                className={cn(
                  "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                  tip === t
                    ? "border-foreground bg-foreground/[0.04]"
                    : "border-border hover:bg-secondary/50"
                )}
                onClick={() => setTip(t)}
              >
                {t === 0 ? "No" : `$${t}`}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card size="sm" className="mb-6">
        <CardContent className="space-y-3 p-4">
          <div className="text-sm font-semibold">Rate your driver</div>
          <RatingInput value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Anything else? (optional)"
            rows={3}
            className="w-full resize-none rounded-lg border bg-background p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground"
          />
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <div className="space-y-2">
        <Button size="lg" className="w-full" onClick={submitRating}>
          Submit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => {
            clear();
            router.replace("/home");
          }}
        >
          Skip
        </Button>
      </div>
    </div>
  );
}
