import type { FareEstimate, Trip } from "@/types";
import {
  GEOCODE_RESULTS,
  MOCK_EARNINGS,
  MOCK_TRIPS,
  RIDE_TYPES,
  SAVED_PAYMENT_METHODS,
  SAVED_PLACES,
} from "@/lib/mock/data";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const [pathname] = path.split("?");
  if (USE_MOCK) {
    const handler = (mockRoutes as Record<string, (p: string) => Promise<unknown>>)[
      pathname
    ];
    if (!handler) {
      throw new Error(`Mock route not found: ${path}`);
    }
    return (await handler(path)) as T;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    let message = `API error ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      else if (body?.message) message = body.message;
    } catch {
      // ignore non-JSON error body
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

const mockRoutes = {
  "/me": async () => {
    await wait(150);
    return {
      id: "user_001",
      phoneNumber: "+14155551234",
      firstName: "Aneesh",
      lastName: "R",
      email: "aneesh@example.com",
      role: "rider" as const,
    };
  },
  "/saved-places": async () => {
    await wait(200);
    return SAVED_PLACES;
  },
  "/payment-methods": async () => {
    await wait(200);
    return SAVED_PAYMENT_METHODS;
  },
  "/trips": async () => {
    await wait(250);
    return MOCK_TRIPS;
  },
  "/trips/active": async () => {
    await wait(150);
    return null as Trip | null;
  },
  "/earnings": async () => {
    await wait(200);
    return MOCK_EARNINGS;
  },
  "/geocode": async (path: string) => {
    await wait(300);
    const q =
      new URLSearchParams(path.split("?")[1] ?? "").get("q")?.trim() ?? "";
    if (!q) return GEOCODE_RESULTS;
    const ql = q.toLowerCase();
    return GEOCODE_RESULTS.filter((r) =>
      `${r.label} ${r.primary} ${r.secondary ?? ""}`.toLowerCase().includes(ql)
    );
  },
  "/fare/estimate": async () => {
    await wait(400);
    const estimates: FareEstimate[] = RIDE_TYPES.map((rideType) => {
      const base = 2.5;
      const distanceFare = 9.8 * rideType.multiplier;
      const timeFare = 6.4 * rideType.multiplier;
      const total = (base + distanceFare + timeFare) * 1;
      return {
        rideType: rideType.id,
        base,
        distanceFare: round(distanceFare),
        timeFare: round(timeFare),
        surge: 1,
        total: round(total),
        currency: "USD" as const,
        estimatedDistanceMiles: 3.1,
        estimatedDurationMinutes: 14,
      };
    });
    return estimates;
  },
  "/trip/request": async () => {
    await wait(800);
    return {
      tripId: `trip_${Date.now()}`,
    };
  },
};

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export type ApiClient = typeof api;
