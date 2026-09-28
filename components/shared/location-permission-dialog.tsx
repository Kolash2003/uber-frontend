"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { getBrowserLocation, reverseGeocode } from "@/lib/geo";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { Loader2Icon, MapPinIcon } from "lucide-react";

export function LocationPermissionDialog() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = Boolean(user) && !user?.hasLocation && !dismissed;

  async function onAllow() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const { lat, lng } = await getBrowserLocation();
      const address = await reverseGeocode(lat, lng);
      await api.post("/me/location", {
        latitude: lat,
        longitude: lng,
        address,
      });
      setUser({
        ...user,
        hasLocation: true,
        lastLat: lat,
        lastLng: lng,
        lastAddress: address ?? user.lastAddress,
      });
      toast.success("Location saved");
      setDismissed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your location");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setDismissed(true);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPinIcon className="size-4" />
            Set your location
          </DialogTitle>
          <DialogDescription>
            We use your location to suggest nearby pickup spots and show drivers
            around you. It&apos;s saved to your account and only used in the app.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setDismissed(true)} disabled={busy}>
            Not now
          </Button>
          <Button onClick={onAllow} disabled={busy}>
            {busy ? <Loader2Icon className="animate-spin" /> : "Allow location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
