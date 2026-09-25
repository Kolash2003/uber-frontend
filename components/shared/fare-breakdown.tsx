import { cn } from "cn";
import { ReceiptIcon } from "lucide-react";
import type { FareEstimate } from "@/types";

export function FareBreakdown({
  estimate,
  tip,
  className,
}: {
  estimate: FareEstimate;
  tip?: number;
  className?: string;
}) {
  const rows = [
    { label: "Base", value: estimate.base },
    { label: `Distance (${estimate.estimatedDistanceMiles.toFixed(1)} mi)`, value: estimate.distanceFare },
    { label: `Time (${estimate.estimatedDurationMinutes} min)`, value: estimate.timeFare },
  ];
  if (estimate.surge !== 1) {
    rows.push({ label: `Surge ×${estimate.surge.toFixed(2)}`, value: 0 });
  }
  const total = tip ? estimate.total + tip : estimate.total;
  return (
    <div className={cn("rounded-xl bg-card ring-1 ring-foreground/10", className)}>
      <div className="flex items-center gap-2 border-b p-3 text-sm font-medium">
        <ReceiptIcon className="size-4 text-muted-foreground" />
        Fare breakdown
      </div>
      <div className="space-y-2 p-3 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-muted-foreground">
            <span>{r.label}</span>
            <span className="font-mono tabular-nums">${r.value.toFixed(2)}</span>
          </div>
        ))}
        {tip !== undefined && tip > 0 && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Tip</span>
            <span className="font-mono tabular-nums">${tip.toFixed(2)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t pt-2 text-base font-semibold">
          <span>Total</span>
          <span className="font-mono tabular-nums">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
