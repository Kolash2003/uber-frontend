"use client";

import * as React from "react";
import { cn } from "cn";
import { StarIcon } from "lucide-react";

export function RatingInput({
  value,
  onChange,
  max = 5,
  size = 32,
  className,
  readOnly = false,
  ariaLabel = "Rating",
}: {
  value: number;
  onChange?: (v: number) => void;
  max?: number;
  size?: number;
  className?: string;
  readOnly?: boolean;
  ariaLabel?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const display = hover ?? value;
  return (
    <div
      role={readOnly ? "img" : "radiogroup"}
      aria-label={ariaLabel}
      className={cn("flex items-center gap-1", className)}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: max }).map((_, i) => {
        const index = i + 1;
        const filled = index <= display;
        return (
          <button
            key={i}
            type="button"
            role={readOnly ? undefined : "radio"}
            aria-checked={readOnly ? undefined : index === value}
            aria-label={`${index} ${index === 1 ? "star" : "stars"}`}
            disabled={readOnly}
            className={cn(
              "transition-transform",
              !readOnly && "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded",
              readOnly && "cursor-default"
            )}
            style={{ width: size, height: size }}
            onClick={() => onChange?.(index)}
            onMouseEnter={() => !readOnly && setHover(index)}
          >
            <StarIcon
              className={cn(
                "size-full transition-colors",
                filled
                  ? "fill-status-searching text-status-searching"
                  : "text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
