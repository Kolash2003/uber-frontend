import Link from "next/link";
import { ArrowRightIcon, MapPinIcon, NavigationIcon, ShieldCheckIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function MarketingPage() {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-background to-muted" />
      <div
        className="absolute inset-0 -z-10 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          color: "var(--foreground)",
        }}
      />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2 text-base font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-brand font-bold text-brand-foreground shadow-sm">
            R
          </span>
          Ride
        </div>
        <nav className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Sign in
          </Link>
          <Link href="/signup" className={buttonVariants({ size: "sm" })}>
            Get started
            <ArrowRightIcon />
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 pt-16 pb-24 md:grid-cols-2 md:items-center md:gap-16 md:pt-24">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-status-online" />
            Live in your city
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            Get there. <span className="text-brand-accent">Live.</span>
          </h1>
          <p className="max-w-md text-base text-muted-foreground md:text-lg">
            Request a ride in seconds, watch your driver approach in real time, and pay in-app.
            Built for one hand and a busy street.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Sign up to ride
              <ArrowRightIcon />
            </Link>
            <Link
              href="/signup?role=driver"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Drive with us
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-6 text-xs text-muted-foreground md:gap-6 md:text-sm">
            <FeaturePill icon={MapPinIcon} label="Door to door" />
            <FeaturePill icon={NavigationIcon} label="Live tracking" />
            <FeaturePill icon={ShieldCheckIcon} label="Verified drivers" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-tr from-brand/20 to-status-arrived/20 blur-2xl" />
          <div className="rounded-3xl bg-card p-3 ring-1 ring-foreground/10 shadow-2xl">
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted/40 p-3">
              <div className="col-span-2 space-y-2">
                <div className="rounded-xl bg-background p-3 ring-1 ring-foreground/10">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">From</div>
                  <div className="text-sm font-medium">Civic Center BART</div>
                </div>
                <div className="rounded-xl bg-background p-3 ring-1 ring-foreground/10">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">To</div>
                  <div className="text-sm font-medium">SFO Airport</div>
                </div>
                <div className="rounded-xl bg-foreground p-3 text-background">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide opacity-70">Comfort</div>
                      <div className="text-sm font-medium">5 min away</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wide opacity-70">Total</div>
                      <div className="font-mono text-base font-semibold tabular-nums">$36.50</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-1 rounded-xl bg-foreground/5 p-2">
                <div className="grid h-full place-items-center text-center text-muted-foreground">
                  <div>
                    <div className="mx-auto mb-1 grid size-10 place-items-center rounded-full bg-brand/15">
                      <NavigationIcon className="size-5 text-brand-accent" />
                    </div>
                    <div className="text-xs font-medium text-foreground">4:32</div>
                    <div className="text-[10px]">away</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-6 pb-8 text-xs text-muted-foreground">
        <div>© {new Date().getFullYear()} Ride Inc.</div>
        <div className="flex items-center gap-4">
          <Link href="#" className="hover:text-foreground">Privacy</Link>
          <Link href="#" className="hover:text-foreground">Terms</Link>
          <Link href="#" className="hover:text-foreground">Help</Link>
        </div>
      </footer>
    </main>
  );
}

function FeaturePill({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-brand-accent" />
      <span>{label}</span>
    </div>
  );
}
