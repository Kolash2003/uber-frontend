"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ArrowRightIcon, Loader2Icon, MailCheckIcon } from "lucide-react";

const schema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email"),
    phoneNumber: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || /^\+?[0-9\s-()]{8,}$/.test(v),
        "Enter a valid phone number"
      )
      .optional(),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
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
  const params = useSearchParams();
  const role = params.get("role") === "driver" ? "driver" : "rider";
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const { error } = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: `${values.firstName} ${values.lastName}`.trim(),
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber?.trim() || undefined,
        role,
        callbackURL: "/email-verified",
      });

      if (error) {
        toast.error(error.message ?? "Couldn't create your account");
        return;
      }

      setSentTo(values.email);
      toast.success("Check your email", {
        description: "We sent you a link to verify your account.",
      });
    } catch {
      toast.error("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-1 flex-col items-start justify-center gap-4 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-secondary">
          <MailCheckIcon className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a verification link to{" "}
            <span className="font-medium text-foreground">{sentTo}</span>. Click it to
            activate your account, then sign in.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="mx-auto"
          onClick={() =>
            authClient.sendVerificationEmail({
              email: sentTo,
              callbackURL: "/email-verified",
            })
          }
        >
          Resend link
        </Button>
        <a
          className="mx-auto text-xs font-medium text-foreground underline-offset-4 hover:underline"
          href="/login"
        >
          Back to sign in
        </a>
      </div>
    );
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
          <FieldDescription>Optional — used for ride updates and receipts.</FieldDescription>
          <FieldError>{form.formState.errors.phoneNumber?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
          <FieldError>{form.formState.errors.password?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
          <FieldError>{form.formState.errors.confirmPassword?.message}</FieldError>
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
