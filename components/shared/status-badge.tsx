import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import {
  CarIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  ClockIcon,
  FlagIcon,
  MapPinIcon,
  NavigationIcon,
  XCircleIcon,
} from "lucide-react";
import type { TripStatus } from "@/types";

const STATUS_META: Record<
  TripStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  idle: { label: "Idle", icon: CircleDotIcon, tone: "bg-status-idle/10 text-status-idle" },
  searching: { label: "Finding driver", icon: ClockIcon, tone: "bg-status-searching/15 text-status-searching" },
  matched: { label: "Driver matched", icon: CheckCircle2Icon, tone: "bg-status-matched/15 text-status-matched" },
  en_route: { label: "En route to pickup", icon: NavigationIcon, tone: "bg-status-en-route/15 text-status-en-route" },
  arrived: { label: "Driver arrived", icon: MapPinIcon, tone: "bg-status-arrived/15 text-status-arrived" },
  in_progress: { label: "In progress", icon: CarIcon, tone: "bg-status-in-progress/15 text-status-in-progress" },
  completed: { label: "Completed", icon: FlagIcon, tone: "bg-status-completed/15 text-status-completed" },
  cancelled: { label: "Cancelled", icon: XCircleIcon, tone: "bg-status-cancelled/15 text-status-cancelled" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: TripStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent px-2.5 py-0.5 text-xs font-medium [&>svg]:size-3.5",
        meta.tone,
        className
      )}
      role="status"
      aria-label={`Trip status: ${meta.label}`}
    >
      <Icon aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

export function statusLabel(status: TripStatus): string {
  return STATUS_META[status].label;
}
