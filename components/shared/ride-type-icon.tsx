"use client";

import { CarIcon, CrownIcon, TruckIcon } from "lucide-react";
import type { RideType } from "@/types";
import { cn } from "cn";

export function RideTypeIcon({
  rideType,
  className,
}: {
  rideType: RideType;
  className?: string;
}) {
  const map = {
    economy: CarIcon,
    comfort: CarIcon,
    premium: CrownIcon,
    xl: TruckIcon,
  } as const;
  const Icon = map[rideType];
  return <Icon className={cn("size-5", className)} />;
}
