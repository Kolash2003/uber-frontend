import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-8 pb-safe sm:max-w-lg">
      <Link
        href="/"
        className="mb-6 flex items-center gap-2 text-base font-semibold"
        aria-label="Ride home"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background">R</span>
        Ride
      </Link>
      <div className="flex flex-1 flex-col">{children}</div>
    </main>
  );
}
