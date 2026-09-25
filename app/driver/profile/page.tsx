"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useTrips } from "@/hooks/use-trip-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOutIcon, StarIcon, CarIcon, BadgeCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DriverProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { data: trips = [] } = useTrips();
  const avgRating =
    trips.filter((t) => t.rating != null).reduce((s, t) => s + (t.rating ?? 0), 0) /
    Math.max(trips.filter((t) => t.rating != null).length, 1);

  function onSignOut() {
    signOut();
    document.cookie = "uber-ride-auth=; path=/; max-age=0";
    document.cookie = "uber-ride-role=; path=/; max-age=0";
    toast("Signed out");
    router.push("/login");
  }

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-safe">
      <header className="mb-6 flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-lg font-semibold">
            {user?.firstName} {user?.lastName}
            <BadgeCheckIcon className="size-4 text-status-completed" />
          </div>
          <div className="text-sm text-muted-foreground">{user?.phoneNumber}</div>
          <div className="mt-1 flex items-center gap-1 text-xs">
            <StarIcon className="size-3 fill-status-searching text-status-searching" />
            <span className="font-medium">{avgRating.toFixed(2)}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{trips.length} trips</span>
          </div>
        </div>
      </header>

      <Card size="sm" className="mb-6">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-lg bg-secondary">
              <CarIcon className="size-6" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Silver Toyota Camry</div>
              <div className="font-mono text-xs text-muted-foreground">8XYZ123</div>
            </div>
            <span className="rounded-full bg-status-completed/15 px-2 py-0.5 text-[10px] font-medium text-status-completed">
              Verified
            </span>
          </div>
          <Separator />
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <Stat label="License" value="Active" />
            <Stat label="Insurance" value="Active" />
            <Stat label="Vehicle" value="2022" />
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={onSignOut}
      >
        <LogOutIcon />
        Sign out
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="font-medium text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
