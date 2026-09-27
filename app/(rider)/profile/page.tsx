"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useSavedPlaces, usePaymentMethods, useTrips } from "@/hooks/use-trip-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowRightIcon, BriefcaseIcon, CreditCardIcon, HomeIcon, LogOutIcon, MapPinIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const PLACE_ICONS = { home: HomeIcon, work: BriefcaseIcon, recent: MapPinIcon } as const;

export default function RiderProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { data: saved = [] } = useSavedPlaces();
  const { data: methods = [] } = usePaymentMethods();
  const { data: trips = [] } = useTrips();
  const totalTrips = trips.length;

  async function onSignOut() {
    await authClient.signOut();
    signOut();
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
          <div className="text-lg font-semibold">
            {user?.firstName} {user?.lastName}
          </div>
          {user?.phoneNumber && (
            <div className="text-sm text-muted-foreground">{user.phoneNumber}</div>
          )}
          {user?.email && (
            <div className="text-xs text-muted-foreground">{user.email}</div>
          )}
        </div>
      </header>

      <Card size="sm" className="mb-6">
        <CardContent className="grid grid-cols-3 divide-x p-0">
          <Stat label="Trips" value={String(totalTrips)} />
          <Stat label="Member" value={user?.id ? user.id.slice(-4) : "—"} />
          <Stat label="Saved" value={String(saved.length)} />
        </CardContent>
      </Card>

      <Section title="Saved places">
        <div className="space-y-1">
          {saved.map((p) => {
            const Icon = PLACE_ICONS[p.id as keyof typeof PLACE_ICONS] ?? MapPinIcon;
            return (
              <RowLink
                key={p.id}
                icon={<Icon className="size-4 text-muted-foreground" />}
                label={p.label}
                value={p.primary}
              />
            );
          })}
        </div>
      </Section>

      <Section title="Payment">
        <div className="space-y-1">
          {methods.slice(0, 2).map((pm) => (
            <RowLink
              key={pm.id}
              icon={<CreditCardIcon className="size-4 text-muted-foreground" />}
              label={`${pm.brand.toUpperCase()} •••• ${pm.last4}`}
              value={`Exp ${pm.expMonth.toString().padStart(2, "0")}/${pm.expYear}`}
              onClick={() => router.push("/payment-methods")}
            />
          ))}
          <RowLink
            icon={<CreditCardIcon className="size-4 text-muted-foreground" />}
            label="Manage payment methods"
            value=""
            onClick={() => router.push("/payment-methods")}
            showChevron
          />
        </div>
      </Section>

      <Section title="Account">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onSignOut}
        >
          <LogOutIcon />
          Sign out
        </Button>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <Card size="sm">
        <CardContent className="p-2">{children}</CardContent>
      </Card>
    </section>
  );
}

function RowLink({
  icon,
  label,
  value,
  onClick,
  showChevron,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  showChevron?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
        onClick && "hover:bg-secondary/60"
      )}
    >
      {icon}
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        {value && <div className="truncate text-xs text-muted-foreground">{value}</div>}
      </div>
      {showChevron && <ArrowRightIcon className="size-4 text-muted-foreground" />}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <div className="text-base font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
