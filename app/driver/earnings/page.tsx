"use client";

import { useEarnings } from "@/hooks/use-trip-queries";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownToLineIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  ReceiptIcon,
} from "lucide-react";
import { cn } from "cn";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  earnings: {
    label: "Earnings",
    color: "var(--brand)",
  },
  trips: {
    label: "Trips",
    color: "var(--status-en-route)",
  },
} satisfies ChartConfig;

export default function DriverEarningsPage() {
  const { data: earnings = [], isLoading } = useEarnings();
  const total = earnings.reduce((s, e) => s + e.earnings, 0);
  const totalTrips = earnings.reduce((s, e) => s + e.trips, 0);
  const totalMinutes = earnings.reduce((s, e) => s + e.onlineMinutes, 0);
  const avgPerHour = total / Math.max(totalMinutes / 60, 1);
  const latest = earnings.at(-1)?.earnings;
  const previous = earnings.at(-2)?.earnings;
  const deltaPct =
    latest != null && previous != null && previous > 0
      ? ((latest - previous) / previous) * 100
      : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-safe">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Earnings</h1>
        <p className="text-sm text-muted-foreground">This week, by day.</p>
      </header>

      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">This week</div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="font-mono text-3xl font-semibold tabular-nums">${total.toFixed(2)}</div>
            {deltaPct != null && (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  deltaPct >= 0 ? "text-status-completed" : "text-status-cancelled"
                )}
                title="Change vs. the previous day"
              >
                {deltaPct >= 0 ? (
                  <TrendingUpIcon className="size-3.5" />
                ) : (
                  <TrendingDownIcon className="size-3.5" />
                )}
                <span>
                  {deltaPct >= 0 ? "+" : ""}
                  {deltaPct.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 divide-x">
            <Stat icon={ReceiptIcon} label="Trips" value={String(totalTrips)} />
            <Stat icon={ClockIcon} label="Online" value={formatHours(totalMinutes)} />
            <Stat icon={TrendingUpIcon} label="$ / hr" value={`$${avgPerHour.toFixed(2)}`} />
          </div>
        </CardContent>
      </Card>

      <div className="mb-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Daily breakdown
        </h2>
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <Card>
            <CardContent className="p-3">
              <ChartContainer config={chartConfig} className="h-56 w-full">
                <BarChart data={earnings} margin={{ left: 0, right: 0, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="earnings" fill="var(--color-earnings)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-secondary">
              <ArrowDownToLineIcon className="size-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Cash out</div>
              <div className="text-xs text-muted-foreground">Instant to your linked account</div>
            </div>
          </div>
          <div className="font-mono text-base font-semibold tabular-nums">
            ${total.toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-2 text-center">
      <Icon className="size-3.5 text-muted-foreground" />
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function formatHours(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
