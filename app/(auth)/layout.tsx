import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-8 pb-safe sm:max-w-lg">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          aria-label="Ride home"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-brand font-bold text-brand-foreground shadow-sm">
            R
          </span>
          Ride
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </main>
  );
}
