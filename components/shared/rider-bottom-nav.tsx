"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, User2 } from "lucide-react";
import { cn } from "cn";

const TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/trips", label: "Trips", icon: History },
  { href: "/profile", label: "Profile", icon: User2 },
] as const;

export function RiderBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Rider navigation"
      className="sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-safe"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-4 pt-1">
        {TABS.map((t) => {
          const active =
            pathname === t.href || (t.href !== "/home" && pathname.startsWith(t.href));
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-md py-2 text-xs transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
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
