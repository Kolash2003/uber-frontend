"use client";

import { useTrips } from "@/hooks/use-trip-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StarIcon, HistoryIcon } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export default function DriverTripsPage() {
  const { data: trips = [], isLoading } = useTrips();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-safe">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Trip history</h1>
        <p className="text-sm text-muted-foreground">Completed rides and ratings.</p>
      </header>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <Empty className="border py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HistoryIcon />
            </EmptyMedia>
            <EmptyTitle>No trips yet</EmptyTitle>
            <EmptyDescription>
              Go online from the dashboard to start receiving ride requests.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-2">
          {trips.map((t) => (
            <Card key={t.id} size="sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{t.dropoff.primary}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      From {t.pickup.primary}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold tabular-nums">
                      ${t.fare.total.toFixed(2)}
                    </div>
                    {t.rating != null && (
                      <div className="flex items-center justify-end gap-0.5 text-xs text-muted-foreground">
                        <StarIcon className="size-3 fill-status-searching text-status-searching" />
                        {t.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {new Date(t.completedAt ?? t.startedAt ?? 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
