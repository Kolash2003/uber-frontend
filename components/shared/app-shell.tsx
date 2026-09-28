"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { ConnectivityIndicator } from "@/components/shared/connectivity-indicator";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export type NavTab = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function AppShell({
  wordmark,
  homeHref,
  tabs,
  navLabel,
  children,
}: {
  wordmark: string;
  homeHref: string;
  tabs: readonly NavTab[];
  navLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="z-30 flex h-(--header-h) shrink-0 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-md">
        <Link
          href={homeHref}
          className="flex items-center gap-2 rounded-md text-sm font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-brand text-xs font-bold text-brand-foreground shadow-sm">
            R
          </span>
          {wordmark}
        </Link>
        <div className="flex items-center gap-1">
          <ConnectivityIndicator />
          <ThemeToggle />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</main>

      <BottomNav tabs={tabs} label={navLabel} homeHref={homeHref} />
    </div>
  );
}

function BottomNav({
  tabs,
  label,
  homeHref,
}: {
  tabs: readonly NavTab[];
  label: string;
  homeHref: string;
}) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={label}
      className="z-30 shrink-0 border-t border-border/70 bg-background/85 backdrop-blur-md pb-safe"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around gap-1 px-3 py-1.5">
        {tabs.map((t) => {
          const active =
            pathname === t.href || (t.href !== homeHref && pathname.startsWith(t.href));
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  active
                    ? "bg-brand-subtle text-brand-accent"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
