"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ArrowLeftIcon, Loader2Icon, MailCheckIcon } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: "/reset-password",
      });
      if (error) {
        toast.error(error.message ?? "Couldn't send the reset link");
        return;
      }
      setSentTo(values.email);
    } catch {
      toast.error("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <MailCheckIcon className="size-10 text-muted-foreground" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for {sentTo}, we sent a link to reset your password.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          Back to sign in
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
          <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-sm text-muted-foreground">
            Enter the email for your account and we&apos;ll send you a reset link.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </Field>

        <div className="mt-auto pt-6">
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <Loader2Icon className="animate-spin" /> : "Send reset link"}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
            >
              <ArrowLeftIcon className="size-3" />
              Back to sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
