import type { LatLng } from "@/types";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function getPosition(options: PositionOptions): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      options
    );
  });
}

const DENIED_MESSAGE =
  "Location permission was denied. Enable it in your browser settings and try again.";

async function ipFallback(): Promise<LatLng | null> {
  try {
    const res = await fetch("https://ipwho.is/");
    if (!res.ok) return null;
    const data = (await res.json()) as {
      success?: boolean;
      latitude?: number;
      longitude?: number;
    };
    if (data.success === false) return null;
    if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
      return null;
    }
    return { lat: data.latitude, lng: data.longitude };
  } catch {
    return null;
  }
}

export async function getBrowserLocation(): Promise<LatLng> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    const approx = await ipFallback();
    if (approx) return approx;
    throw new Error("Location isn't supported on this device.");
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    throw new Error(
      "Location needs a secure connection. Use https:// or http://localhost."
    );
  }

  // Try precise GPS first, then a fast network-based fix (which succeeds in
  // cases where high-accuracy positioning times out, e.g. Linux desktops).
  const attempts: PositionOptions[] = [
    { enableHighAccuracy: true, timeout: 8_000, maximumAge: 60_000 },
    { enableHighAccuracy: false, timeout: 15_000, maximumAge: 300_000 },
  ];

  for (const options of attempts) {
    try {
      return await getPosition(options);
    } catch (e) {
      const err = e as GeolocationPositionError;
      if (err.code === err.PERMISSION_DENIED) throw new Error(DENIED_MESSAGE);
    }
  }

  // Last resort: approximate, city-level coordinates derived from IP address.
  const approx = await ipFallback();
  if (approx) return approx;

  throw new Error(
    "We couldn't determine your location. Make sure location services are enabled on your device, or enter your address manually."
  );
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | undefined> {
  if (!MAPBOX_TOKEN) return undefined;
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?limit=1&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = (await res.json()) as { features?: { place_name?: string }[] };
    return data.features?.[0]?.place_name ?? undefined;
  } catch {
    return undefined;
  }
}

/** Fetch the current position, save it to the account, and update the store. */
export async function captureLocation(): Promise<LatLng> {
  const { lat, lng } = await getBrowserLocation();
  const address = await reverseGeocode(lat, lng);
  await api.post("/me/location", { latitude: lat, longitude: lng, address });
  const { user, setUser } = useAuthStore.getState();
  if (user) {
    setUser({
      ...user,
      hasLocation: true,
      lastLat: lat,
      lastLng: lng,
      lastAddress: address ?? user.lastAddress,
    });
  }
  return { lat, lng };
}

/** "granted" without prompting, so callers can refresh silently. */
export async function hasGeolocationPermission(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.permissions) return false;
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state === "granted";
  } catch {
    return false;
  }
}
