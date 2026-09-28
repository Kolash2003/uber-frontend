"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

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
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const { data, error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        if (error.code === "EMAIL_NOT_VERIFIED") {
          await authClient.sendVerificationEmail({
            email: values.email,
            callbackURL: "/email-verified",
          });
          toast.error("Verify your email", {
            description: "We sent you a new verification link.",
          });
          return;
        }
        toast.error(error.message ?? "Couldn't sign you in");
        return;
      }

      const role = (data?.user as { role?: string } | undefined)?.role ?? "rider";
      toast.success("Welcome back");
      router.push(next ?? (role === "driver" ? "/driver/dashboard" : "/home"));
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-5" noValidate>
        <div className="space-y-2 pb-1">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to Ride</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to continue.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
          />
          <FieldError>{form.formState.errors.password?.message}</FieldError>
        </Field>

        <div className="-mt-2 flex justify-end">
          <a
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            href="/forgot-password"
          >
            Forgot password?
          </a>
        </div>

        <div className="mt-auto pt-6">
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRightIcon />
              </>
            )}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            New to Ride?{" "}
            <a className="font-medium text-foreground underline-offset-4 hover:underline" href="/signup">
              Create an account
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
