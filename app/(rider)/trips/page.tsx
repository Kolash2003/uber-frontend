"use client";

import { useTrips } from "@/hooks/use-trip-queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightIcon, MapPinIcon } from "lucide-react";
import { cn } from "cn";

export default function TripsPage() {
  const { data: trips = [], isLoading } = useTrips();
  const upcoming = trips.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const past = trips.filter((t) => t.status === "completed" || t.status === "cancelled");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-safe">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Your trips</h1>
        <p className="text-sm text-muted-foreground">Past rides and upcoming bookings.</p>
      </header>

      <Tabs defaultValue="past">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : upcoming.length === 0 ? (
            <EmptyState message="No upcoming trips" />
          ) : (
            upcoming.map((t) => <TripCard key={t.id} trip={t} />)
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-4 space-y-3">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : past.length === 0 ? (
            <EmptyState message="No past trips yet" />
          ) : (
            past.map((t) => <TripCard key={t.id} trip={t} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed py-12 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function TripCard({ trip }: { trip: import("@/types").Trip }) {
  return (
    <Card size="sm">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <StatusBadge status={trip.status} />
          <div className="font-mono text-sm font-semibold tabular-nums">
            ${trip.fare.total.toFixed(2)}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex flex-col items-center">
            <span className="grid size-2 place-items-center rounded-full bg-status-online" />
            <span className="my-0.5 h-3 w-px bg-border" />
            <span className="grid size-2 place-items-center rounded-full bg-destructive" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-muted-foreground">{trip.pickup.primary}</div>
            <div className="truncate font-medium">{trip.dropoff.primary}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{new Date(trip.startedAt ?? trip.completedAt ?? 0).toLocaleString()}</span>
          <button type="button" className="flex items-center gap-1 font-medium text-foreground hover:underline">
            Details
            <ArrowRightIcon className="size-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
