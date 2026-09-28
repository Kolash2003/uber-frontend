"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: FormValues) {
    if (!token) {
      toast.error("This reset link is invalid or has expired.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword: values.password,
        token,
      });
      if (error) {
        toast.error(error.message ?? "Couldn't reset your password");
        return;
      }
      toast.success("Password updated. Sign in to continue.");
      router.push("/login");
    } catch {
      toast.error("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-xl font-semibold">Link invalid or expired</h1>
        <p className="text-sm text-muted-foreground">
          Request a new password reset link to continue.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-5"
        noValidate
      >
        <div className="space-y-2 pb-1">
          <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
          <p className="text-sm text-muted-foreground">
            Enter a new password for your account.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
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

        <div className="mt-auto pt-6">
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <Loader2Icon className="animate-spin" /> : "Update password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
