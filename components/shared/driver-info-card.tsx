import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StarIcon, PhoneIcon, MessageSquareIcon } from "lucide-react";
import { cn } from "cn";
import type { Driver, Vehicle } from "@/types";

export function DriverInfoCard({
  driver,
  vehicle,
  className,
  rightAction,
}: {
  driver: Driver;
  vehicle?: Vehicle;
  className?: string;
  rightAction?: React.ReactNode;
}) {
  const initials = `${driver.firstName[0] ?? ""}${driver.lastName[0] ?? ""}`;
  return (
    <div className={cn("flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10", className)}>
      <Avatar className="size-14">
        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">
          {driver.firstName} {driver.lastName}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <StarIcon className="size-3 fill-status-searching text-status-searching" />
          <span className="font-medium">{driver.rating.toFixed(2)}</span>
          <span>·</span>
          <span>{driver.totalTrips.toLocaleString()} trips</span>
        </div>
        {vehicle && (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {vehicle.color} {vehicle.make} {vehicle.model}
            <span className="mx-1">·</span>
            <span className="font-mono">{vehicle.licensePlate}</span>
          </div>
        )}
      </div>
      {rightAction ?? (
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
            aria-label="Call driver"
          >
            <PhoneIcon className="size-4" />
          </button>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
            aria-label="Message driver"
          >
            <MessageSquareIcon className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
