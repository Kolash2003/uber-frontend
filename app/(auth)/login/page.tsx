"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";

const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(8, "Enter a valid phone number")
    .regex(/^\+?[0-9\s-()]+$/, "Use digits, spaces, +, - or ()"),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const setAuth = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: "" },
  });

  async function onSubmitPhone(values: PhoneFormValues) {
    setSubmitting(true);
    try {
      await api.post("/auth/request-otp", { phoneNumber: values.phoneNumber });
      setPhone(values.phoneNumber);
      setStage("otp");
      toast.success("Code sent", { description: `We texted ${values.phoneNumber}` });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send a code");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitOtp() {
    if (otp.length !== 6) return;
    setSubmitting(true);
    try {
      const res = await api.post<{ token: string; user: Parameters<typeof setAuth>[0] }>(
        "/auth/verify-otp",
        { phoneNumber: phone, code: otp }
      );
      setAuth(res.user);
      setSession(res.token);
      toast.success("Welcome back");
      router.push(next ?? "/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {stage === "phone" ? (
        <form
          onSubmit={form.handleSubmit(onSubmitPhone)}
          className="flex flex-1 flex-col"
          noValidate
        >
          <div className="space-y-2 pb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign in to Ride
            </h1>
            <p className="text-sm text-muted-foreground">
              We&apos;ll text you a code to verify your number.
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="phone">Phone number</FieldLabel>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="+1 415 555 0123"
              {...form.register("phoneNumber")}
            />
            <FieldDescription>
              Used to match you with your rides and receipt.
            </FieldDescription>
            <FieldError>{form.formState.errors.phoneNumber?.message}</FieldError>
          </Field>

          <div className="mt-auto pt-6">
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRightIcon />
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="space-y-2 pb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Enter the code</h1>
            <p className="text-sm text-muted-foreground">
              Sent to <span className="font-medium text-foreground">{phone}</span>.{" "}
              <button
                type="button"
                className="underline-offset-2 hover:underline"
                onClick={() => setStage("phone")}
              >
                Edit
              </button>
            </p>
          </div>
          <Field>
            <FieldLabel htmlFor="otp">Verification code</FieldLabel>
            <InputOTP
              id="otp"
              maxLength={6}
              value={otp}
              onChange={setOtp}
              aria-label="6-digit verification code"
            >
              <InputOTPGroup className="w-full">
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} className="flex-1" />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <FieldDescription>For the demo, enter any 6 digits.</FieldDescription>
          </Field>
          <div className="mt-auto pt-6">
            <Button
              size="lg"
              className="w-full"
              disabled={otp.length !== 6 || submitting}
              onClick={onSubmitOtp}
            >
              {submitting ? <Loader2Icon className="animate-spin" /> : "Verify and continue"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
