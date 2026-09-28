"use client";

import { CarFrontIcon, UserRoundIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "cn";

/** The two roles a person can hold an account as. `admin` is not self-serve. */
export type AccountRole = "rider" | "driver";

const OPTIONS = [
  { value: "rider", label: "Rider", hint: "Book rides", icon: UserRoundIcon },
  { value: "driver", label: "Driver", hint: "Earn driving", icon: CarFrontIcon },
] as const satisfies readonly { value: AccountRole; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }[];

export function RoleSelector({
  value,
  onChange,
  idPrefix = "role",
  label = "I'm signing in as",
}: {
  value: AccountRole;
  onChange: (role: AccountRole) => void;
  idPrefix?: string;
  label?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as AccountRole)}
        className="grid grid-cols-2 gap-2"
      >
        {OPTIONS.map((option) => {
          const id = `${idPrefix}-${option.value}`;
          const selected = value === option.value;
          const Icon = option.icon;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/60",
                selected
                  ? "border-brand bg-brand-subtle ring-1 ring-brand/25"
                  : "border-border hover:bg-secondary/50"
              )}
            >
              <RadioGroupItem value={option.value} id={id} className="sr-only" />
              <Icon
                className={cn("size-5 shrink-0", selected ? "text-brand-accent" : "text-muted-foreground")}
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
