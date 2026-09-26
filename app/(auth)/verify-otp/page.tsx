"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpContent />
    </Suspense>
  );
}

function VerifyOtpContent() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const next = params.get("next");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const setAuth = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const code = otp.join("");
  const isComplete = code.length === 6;

  async function onVerify() {
    if (!isComplete || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<{
        token: string;
        user: Parameters<typeof setAuth>[0];
      }>("/auth/verify-otp", { phoneNumber: phone, code });
      setAuth(res.user);
      setSession(res.token);
      toast.success("Verified");
      router.push(next ?? "/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      const res = await api.post<{ emailHint?: string }>("/auth/request-otp", { phoneNumber: phone });
      toast.success("Code resent", {
        description: res.emailHint ? `We emailed ${res.emailHint}` : undefined,
      });
      setCooldown(30);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
        aria-label="Back"
      >
        <ArrowLeftIcon className="size-4" />
        Back
      </button>

      <div className="space-y-2 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Enter the code</h1>
        <p className="text-sm text-muted-foreground">
          Sent to the email on file for{" "}
          <span className="font-medium text-foreground">{phone}</span>.
        </p>
      </div>

      <Field>
        <FieldLabel htmlFor="otp">6-digit code</FieldLabel>
        <InputOTP
          id="otp"
          maxLength={6}
          value={code}
          onChange={(v) => setOtp(v.split("").concat(Array(6 - v.length).fill("")).slice(0, 6))}
          aria-label="Verification code"
        >
          <InputOTPGroup className="w-full gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPSlot key={i} index={i} className="flex-1" />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <FieldDescription>
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            className="font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
            disabled={cooldown > 0 || resending}
            onClick={onResend}
          >
            {resending
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend code"}
          </button>
        </FieldDescription>
        <FieldError>{error}</FieldError>
      </Field>

      <div className="mt-auto pt-6">
        <Button
          size="lg"
          className="w-full"
          disabled={!isComplete || submitting}
          onClick={onVerify}
        >
          {submitting ? <Loader2Icon className="animate-spin" /> : "Verify and continue"}
        </Button>
      </div>
    </div>
  );
}
