"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { CircleCheckIcon, Loader2Icon } from "lucide-react";

type SessionUser = { role?: string | null };

export default function EmailVerifiedPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"checking" | "redirecting" | "signed-out">(
    "checking"
  );

  useEffect(() => {
    let cancelled = false;

    authClient
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        const user = data?.user as unknown as SessionUser | undefined;
        if (!user) {
          setPhase("signed-out");
          return;
        }
        const role = user.role ?? "rider";
        document.cookie = `uber-ride-role=${role}; path=/; max-age=86400`;
        setPhase("redirecting");
        router.replace(role === "driver" ? "/driver/dashboard" : "/home");
      })
      .catch(() => {
        if (!cancelled) setPhase("signed-out");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (phase === "signed-out") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-secondary">
          <CircleCheckIcon className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Email verified</h1>
          <p className="text-sm text-muted-foreground">
            Your email is confirmed. You can sign in now.
          </p>
        </div>
        <Button className="mx-auto" onClick={() => router.push("/login")}>
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {phase === "checking" ? "Verifying…" : "Signing you in…"}
      </p>
    </div>
  );
}
