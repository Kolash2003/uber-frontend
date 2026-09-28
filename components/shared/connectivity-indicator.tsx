"use client";

import { useEffect, useState } from "react";
import { WifiIcon, WifiOffIcon, RefreshCwIcon } from "lucide-react";
import { useConnectivityStore } from "@/stores/connectivity-store";
import { cn } from "cn";

export function ConnectivityIndicator({ className }: { className?: string }) {
  const state = useConnectivityStore((s) => s.state);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  if (!mounted) return null;

  const meta = {
    online: {
      icon: WifiIcon,
      label: "Live",
      tone: "text-status-completed",
    },
    reconnecting: {
      icon: RefreshCwIcon,
      label: "Connecting…",
      tone: "text-status-searching",
    },
    offline: {
      icon: WifiOffIcon,
      label: "Offline",
      tone: "text-status-cancelled",
    },
  }[state];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-foreground/5 px-2 py-1 text-xs font-medium",
        meta.tone,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className={cn("size-3.5", state === "reconnecting" && "animate-spin")} />
      <span>{meta.label}</span>
    </div>
  );
}
