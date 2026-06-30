// src/context/DriverContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import * as Location from "expo-location";
import Api from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DriverTrip {
  _id: string;
  route: { _id: string; name: string; stops?: any[]; startTime?: string };
  bus_number: string;
  date: string;
  scheduled_time: string;
  time_slot: "morning" | "return_1530" | "return_1900";
  status: "scheduled" | "active" | "in-progress" | "in_progress" | "completed" | "cancelled";
  booked_seats: number;
  total_seats: number;
  usersCount: number;
  driver?: any;
  bus?: any;
}

export interface GeoState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
}

export interface Toast { msg: string; type: "success" | "error" }

interface DriverContextType {
  trips: DriverTrip[];
  isLoading: boolean;
  activeTrip: string | null;
  geo: GeoState;
  actionLoading: string | null;
  toast: Toast | null;
  fetchTrips: () => Promise<void>;
  handleStartTrip: (tripId: string) => Promise<void>;
  handleEndTrip: (tripId: string) => Promise<void>;
}

const DriverContext = createContext<DriverContextType | null>(null);

export function useDriverContext() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error("useDriverContext must be used inside DriverProvider");
  return ctx;
}

const SOCKET_URL = "http://192.168.x.x:5001"; // ← غير ده لـ IP بتاعك

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips]             = useState<DriverTrip[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [activeTrip, setActiveTrip]   = useState<string | null>(null);
  const [geo, setGeo]                 = useState<GeoState>({ lat: null, lng: null, accuracy: null, error: null });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast]             = useState<Toast | null>(null);

  const socketRef           = useRef<Socket | null>(null);
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  // Socket
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  // GPS Helpers
  const stopGpsTracking = useCallback(() => {
    if (trackingIntervalRef.current) { clearInterval(trackingIntervalRef.current); trackingIntervalRef.current = null; }
    setGeo({ lat: null, lng: null, accuracy: null, error: null });
  }, []);

  const startGpsTracking = useCallback(async (tripId: string, busId: string, driverId: string, routeId: string) => {
    if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") { setGeo(g => ({ ...g, error: "Location permission denied" })); return; }

    const emit = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude, accuracy } = loc.coords;
        setGeo({ lat: latitude, lng: longitude, accuracy: accuracy ?? null, error: null });
        socketRef.current?.emit("bus_location_update", { busId, driverId, routeId, lat: latitude, lng: longitude, tripId });
      } catch { setGeo(g => ({ ...g, error: "GPS update failed" })); }
    };

    emit();
    trackingIntervalRef.current = setInterval(emit, 30_000);
  }, []);

  // Cleanup
  useEffect(() => () => { if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current); }, []);

  // Fetch trips
  const fetchTrips = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await Api.get("/driver/trips");
      const data: DriverTrip[] = res.data?.data ?? res.data ?? [];
      setTrips(data);
      const active = data.find(t => ["active", "in-progress", "in_progress"].includes(t.status));
      if (active) {
        setActiveTrip(active._id);
        startGpsTracking(active._id, active.bus?._id || active.bus || "", active.driver?._id || active.driver || "", active.route?._id || "");
      }
    } catch { setToast({ msg: "Failed to load trips", type: "error" }); }
    finally { setIsLoading(false); }
  }, [startGpsTracking]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  // Start trip
  const handleStartTrip = useCallback(async (tripId: string) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") { setToast({ msg: "Enable location to start trip", type: "error" }); return; }
    setActionLoading(tripId);
    try {
      await Api.patch(`/trips/${tripId}/start`);
      setTrips(prev => prev.map(t => t._id === tripId ? { ...t, status: "in-progress" } : t));
      setActiveTrip(tripId);
      const trip = trips.find(t => t._id === tripId);
      startGpsTracking(tripId, trip?.bus?._id || trip?.bus || "", trip?.driver?._id || trip?.driver || "", trip?.route?._id || "");
      setToast({ msg: "Trip started — GPS broadcasting", type: "success" });
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || "Failed to start trip", type: "error" });
    } finally { setActionLoading(null); }
  }, [trips, startGpsTracking]);

  // End trip
  const handleEndTrip = useCallback(async (tripId: string) => {
    setActionLoading(tripId);
    try {
      await Api.patch(`/trips/${tripId}/end`);
      stopGpsTracking();
      setActiveTrip(null);
      setTrips(prev => prev.map(t => t._id === tripId ? { ...t, status: "completed" } : t));
      setToast({ msg: "Trip completed — GPS stopped", type: "success" });
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || "Failed to end trip", type: "error" });
    } finally { setActionLoading(null); }
  }, [stopGpsTracking]);

  return (
    <DriverContext.Provider value={{ trips, isLoading, activeTrip, geo, actionLoading, toast, fetchTrips, handleStartTrip, handleEndTrip }}>
      {children}
    </DriverContext.Provider>
  );
}