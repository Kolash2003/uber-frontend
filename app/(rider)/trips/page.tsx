"use client";

import { useTrips } from "@/hooks/use-trip-queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowRightIcon, CarFrontIcon, HistoryIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

export default function TripsPage() {
  const { data: trips = [], isLoading } = useTrips();
  const upcoming = trips.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled",
  );
  const past = trips.filter(
    (t) => t.status === "completed" || t.status === "cancelled",
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-safe">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Your trips</h1>
        <p className="text-sm text-muted-foreground">
          Past rides and upcoming bookings.
        </p>
      </header>

      <Tabs defaultValue="past">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={CarFrontIcon}
              title="No upcoming trips"
              description="Book a ride and it will show up here until you arrive."
            />
          ) : (
            upcoming.map((t) => <TripCard key={t.id} trip={t} />)
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-4 space-y-3">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : past.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="No past trips yet"
              description="Your completed and cancelled rides will be listed here."
            />
          ) : (
            past.map((t) => <TripCard key={t.id} trip={t} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Empty className="border py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" nativeButton={false} render={<Link href="/home" />}>
          Book a ride
          <ArrowRightIcon />
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function formatTripDate(trip: import("@/types").Trip) {
  const when = trip.completedAt ?? trip.startedAt ?? trip.createdAt;
  return when ? new Date(when).toLocaleString() : "";
}

function TripCard({ trip }: { trip: import("@/types").Trip }) {
  return (
    <Link href={`/trip/${trip.id}`} className="block">
      <Card size="sm" className="transition-colors hover:bg-accent/40">
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
              <div className="truncate text-xs text-muted-foreground">
                {trip.pickup.primary}
              </div>
              <div className="truncate font-medium">{trip.dropoff.primary}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {formatTripDate(trip)}
            </span>
            <span className="flex items-center gap-1 font-medium text-foreground">
              Details
              <ArrowRightIcon className="size-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
