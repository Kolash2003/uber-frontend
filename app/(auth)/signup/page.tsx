"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z
    .string()
    .min(8, "Enter a valid phone number")
    .regex(/^\+?[0-9\s-()]+$/, "Use digits, spaces, +, - or ()"),
});

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const params = useSearchParams();
  const role = (params.get("role") ?? "rider") as "rider" | "driver";
  const [submitting, setSubmitting] = useState(false);
  const setAuth = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const res = await api.post<{ token: string; user: { id: string; phoneNumber: string; firstName: string; lastName: string; email?: string; role: "rider" | "driver" } }>(
        "/auth/signup",
        { ...values, role }
      );
      setAuth({ ...res.user, role });
      setSession(res.token);
      toast.success(`Welcome, ${values.firstName}`);
      router.push(role === "driver" ? "/driver/dashboard" : "/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create your account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="space-y-2 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {role === "driver" ? "Sign up to drive" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {role === "driver"
            ? "Tell us a bit about you — we'll verify your license next."
            : "Riders and drivers use the same account — pick one to start."}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-5" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="firstName">First name</FieldLabel>
            <Input id="firstName" autoComplete="given-name" {...form.register("firstName")} />
            <FieldError>{form.formState.errors.firstName?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="lastName">Last name</FieldLabel>
            <Input id="lastName" autoComplete="family-name" {...form.register("lastName")} />
            <FieldError>{form.formState.errors.lastName?.message}</FieldError>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="phoneNumber">Phone number</FieldLabel>
          <Input id="phoneNumber" type="tel" autoComplete="tel" {...form.register("phoneNumber")} />
          <FieldDescription>We&apos;ll send a verification code.</FieldDescription>
          <FieldError>{form.formState.errors.phoneNumber?.message}</FieldError>
        </Field>

        <div className="mt-auto pt-2">
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <>
                Create account
                <ArrowRightIcon />
              </>
            )}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <a className="font-medium text-foreground underline-offset-4 hover:underline" href="/login">
              Sign in
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
