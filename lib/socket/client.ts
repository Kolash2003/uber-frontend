"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { useConnectivityStore } from "@/stores/connectivity-store";
import { useAuthStore } from "@/stores/auth-store";
import { queryKeys } from "@/hooks/use-trip-queries";
import { toast } from "sonner";
import type { Driver, TripStatus, Vehicle } from "@/types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4001";

export type SocketEventHandlers = {
  onStatusChange?: (
    tripId: string,
    status: TripStatus,
    message?: string,
    extra?: { driver?: Driver & { vehicle?: Vehicle } }
  ) => void;
  onDriverLocation?: (tripId: string, lat: number, lng: number) => void;
  onEta?: (tripId: string, etaSeconds: number) => void;
  onTripComplete?: (tripId: string) => void;
  onIncomingRequest?: (req: {
    tripId: string;
    pickupLabel: string;
    dropoffLabel: string;
    fareTotal: number;
    secondsRemaining: number;
  }) => void;
  onRequestTick?: (tripId: string, secondsRemaining: number) => void;
  onRequestCancelled?: () => void;
};

type SocketState = {
  status: "connecting" | "connected" | "disconnected";
  send: (event: string, payload?: unknown) => void;
  subscribe: (event: string, handler: (payload: unknown) => void) => () => void;
};

// ---- Mock socket (demo mode, no server) ----
let _mockSocket: MockSocket | null = null;

class MockSocket {
  private listeners = new Map<string, Set<(p: unknown) => void>>();
  private status: "connecting" | "connected" | "disconnected" = "disconnected";
  private simulationTimers: Array<ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>> = [];

  constructor() {
    this.connect();
  }

  connect() {
    if (this.status === "connected" || this.status === "connecting") return;
    this.status = "connecting";
    setTimeout(() => {
      this.status = "connected";
      this.notifyStatus();
      this.emit("connection:ready", { ok: true });
    }, 600);
  }

  disconnect() {
    this.status = "disconnected";
    this.notifyStatus();
    this.clearSimulations();
  }

  send(event: string, payload: unknown) {
    if (this.status !== "connected") return;
    this.emit(`${event}:ack`, { ok: true, payload });
  }

  subscribe(event: string, handler: (p: unknown) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  emit(event: string, payload: unknown) {
    this.listeners.get(event)?.forEach((h) => h(payload));
    this.listeners.get("*")?.forEach((h) => h({ event, payload }));
  }

  startTripSimulation(tripId: string, opts: { pickup: { lat: number; lng: number }; dropoff: { lat: number; lng: number } }) {
    this.clearSimulations();

    let step = 0;
    const totalSteps = 30;
    const statusSequence: Array<{ status: TripStatus; message: string; delay: number }> = [
      { status: "searching", message: "Finding your driver", delay: 0 },
      { status: "matched", message: "Driver accepted", delay: 1500 },
      { status: "en_route", message: "Driver is on the way", delay: 4000 },
      { status: "arrived", message: "Driver has arrived", delay: 12000 },
      { status: "in_progress", message: "Trip in progress", delay: 14000 },
      { status: "completed", message: "Trip complete", delay: 25000 },
    ];

    statusSequence.forEach(({ status, message, delay }) => {
      const t = setTimeout(() => {
        this.emit("trip:status", { tripId, status, message });
      }, delay);
      this.simulationTimers.push(t);
    });

    const moveInterval = setInterval(() => {
      step = Math.min(step + 1, totalSteps);
      const t = step / totalSteps;
      const lat = opts.pickup.lat + (opts.dropoff.lat - opts.pickup.lat) * t;
      const lng = opts.pickup.lng + (opts.dropoff.lng - opts.pickup.lng) * t;
      this.emit("trip:driver-location", { tripId, lat, lng });
      const remaining = Math.max(0, Math.round((1 - t) * 600));
      this.emit("trip:eta", { tripId, etaSeconds: remaining });
    }, 1000);
    this.simulationTimers.push(moveInterval);
  }

  startDriverIncomingRequest() {
    this.clearSimulations();
    const req = {
      tripId: `trip_${Date.now()}`,
      pickupLabel: "1455 Market St, San Francisco",
      dropoffLabel: "SFO Airport, Terminal 2",
      fareTotal: 38.5,
      secondsRemaining: 15,
    };
    this.emit("driver:incoming-request", req);

    const t = setInterval(() => {
      req.secondsRemaining -= 1;
      if (req.secondsRemaining <= 0) {
        this.emit("driver:request-expired", { tripId: req.tripId });
        clearInterval(t);
        return;
      }
      this.emit("driver:incoming-request-tick", req);
    }, 1000);
    this.simulationTimers.push(t);
  }

  private clearSimulations() {
    this.simulationTimers.forEach((t) => clearTimeout(t));
    this.simulationTimers.forEach((t) => clearInterval(t));
    this.simulationTimers = [];
  }

  private notifyStatus() {
    this.emit("connection:status", { status: this.status });
  }
}

function getMockSocket(): MockSocket | null {
  if (typeof window === "undefined") return null;
  if (!_mockSocket) _mockSocket = new MockSocket();
  return _mockSocket;
}

// ---- Real socket (relayed by uberSocketServer) ----
let _realSocket: Socket | null = null;

function getRealSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (!_realSocket) {
    _realSocket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
  }
  return _realSocket;
}

type AnySocket = MockSocket | Socket;

function subscribeEvent(
  socket: AnySocket,
  event: string,
  handler: (p: unknown) => void
): () => void {
  if (socket instanceof MockSocket) {
    return socket.subscribe(event, handler);
  }
  const real = socket as Socket;
  real.on(event, handler);
  return () => {
    real.off(event, handler);
  };
}

export function useSocket(handlers: SocketEventHandlers = {}): SocketState {
  const handlersRef = useRef(handlers);
  const [status, setStatus] = useState<SocketState["status"]>("connecting");
  const queryClient = useQueryClient();
  const setConnectivity = useConnectivityStore((s) => s.setState);
  const incrementAttempts = useConnectivityStore((s) => s.incrementAttempts);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const socket = USE_MOCK ? getMockSocket() : getRealSocket();
    if (!socket) return;

    const unsubs: Array<() => void> = [];

    if (USE_MOCK) {
      unsubs.push(
        subscribeEvent(socket, "connection:status", (p) => {
          const next = (p as { status: SocketState["status"] }).status;
          setStatus(next);
          setConnectivity(
            next === "connected"
              ? "online"
              : next === "connecting"
                ? "reconnecting"
                : "offline"
          );
        })
      );
    } else {
      const real = socket as Socket;
      const onConnect = () => {
        setStatus("connected");
        setConnectivity("online");
      };
      const onDisconnect = () => {
        setStatus("disconnected");
        setConnectivity("offline");
      };
      const onReconnectAttempt = () => {
        incrementAttempts();
        setConnectivity("reconnecting");
      };
      const onConnectError = () => setConnectivity("reconnecting");
      real.on("connect", onConnect);
      real.on("disconnect", onDisconnect);
      real.on("connect_error", onConnectError);
      real.on("reconnect_attempt", onReconnectAttempt);
      unsubs.push(() => {
        real.off("connect", onConnect);
        real.off("disconnect", onDisconnect);
        real.off("connect_error", onConnectError);
        real.off("reconnect_attempt", onReconnectAttempt);
      });
    }

    unsubs.push(
      subscribeEvent(socket, "trip:status", (p) => {
        const { tripId, status: tripStatus, message, driver } = p as {
          tripId: string;
          status: TripStatus;
          message?: string;
          driver?: Driver & { vehicle?: Vehicle };
        };
        handlersRef.current.onStatusChange?.(
          tripId,
          tripStatus,
          message,
          driver ? { driver } : undefined
        );
        if (message) {
          toast(message, {
            description: `Trip ${tripId.slice(0, 8)}`,
          });
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.trip(tripId) });
        if (tripStatus === "completed" || tripStatus === "cancelled") {
          queryClient.invalidateQueries({ queryKey: queryKeys.trips });
        }
      })
    );

    unsubs.push(
      subscribeEvent(socket, "trip:driver-location", (p) => {
        const { tripId, lat, lng } = p as { tripId: string; lat: number; lng: number };
        handlersRef.current.onDriverLocation?.(tripId, lat, lng);
      })
    );

    unsubs.push(
      subscribeEvent(socket, "trip:eta", (p) => {
        const { tripId, etaSeconds } = p as { tripId: string; etaSeconds: number };
        handlersRef.current.onEta?.(tripId, etaSeconds);
      })
    );

    unsubs.push(
      subscribeEvent(socket, "trip:complete", (p) => {
        const { tripId } = p as { tripId: string };
        handlersRef.current.onTripComplete?.(tripId);
      })
    );

    unsubs.push(
      subscribeEvent(socket, "driver:incoming-request", (p) => {
        const req = p as {
          tripId: string;
          pickupLabel: string;
          dropoffLabel: string;
          fareTotal: number;
          secondsRemaining: number;
        };
        handlersRef.current.onIncomingRequest?.(req);
      })
    );

    unsubs.push(
      subscribeEvent(socket, "driver:incoming-request-tick", (p) => {
        const { tripId, secondsRemaining } = p as {
          tripId: string;
          secondsRemaining: number;
        };
        handlersRef.current.onRequestTick?.(tripId, secondsRemaining);
      })
    );

    unsubs.push(
      subscribeEvent(socket, "driver:request-expired", () => {
        handlersRef.current.onRequestCancelled?.();
        toast.warning("Request expired — no driver accepted in time");
      })
    );

    return () => unsubs.forEach((fn) => fn());
  }, [queryClient, setConnectivity, incrementAttempts]);

  useEffect(() => {
    if (USE_MOCK) return;
    const socket = getRealSocket();
    if (!socket || !user?.id) return;
    const isDriver = user.role === "driver";
    const emitLogin = () => {
      if (isDriver) socket.emit("driver-login", { driverId: user.id });
      else socket.emit("rider-login", { riderId: user.id });
    };
    if (socket.connected) emitLogin();
    else socket.once("connect", emitLogin);
    return () => {
      if (socket.connected) {
        if (isDriver) socket.emit("driver-logout", { driverId: user.id });
        else socket.emit("rider-logout", { riderId: user.id });
      }
    };
  }, [user?.id, user?.role]);

  return useMemo(
    () => ({
      status,
      send: (event, payload) => {
        const s = USE_MOCK ? getMockSocket() : getRealSocket();
        if (!s) return;
        if (USE_MOCK) (s as MockSocket).send(event, payload);
        else (s as Socket).emit(event, payload);
      },
      subscribe: (event, handler) => {
        const s = USE_MOCK ? getMockSocket() : getRealSocket();
        if (!s) return () => {};
        return subscribeEvent(s, event, handler);
      },
    }),
    [status]
  );
}

export function startMockTripSimulation(
  tripId: string,
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
) {
  if (!USE_MOCK) return;
  getMockSocket()?.startTripSimulation(tripId, { pickup, dropoff });
}

export function startMockIncomingRequest() {
  if (!USE_MOCK) return;
  getMockSocket()?.startDriverIncomingRequest();
}