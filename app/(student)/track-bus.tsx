import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Platform
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Bus, Navigation, ArrowLeft } from "lucide-react-native";
import { router } from "expo-router";
import { io, Socket } from "socket.io-client";
import api, { BASE_URL } from "../../src/services/api";
import { useThemeColor } from "../../constants/theme";

const SOCKET_URL = BASE_URL.replace("/api", "");

interface Stop {
  _id: string;
  name: string;
  location: { lat: number; lng: number };
}

interface Booking {
  _id: string;
  pickup_point: string;
  status: string;
  route?: any;
  trip: {
    _id: string;
    bus_number: string;
    driver?: string;
    status: string;
    bus?: { _id: string };
    current_location?: { lat: number; lng: number };
    route?: { stops: Stop[] };
  };
}

function StopItem({ stop, isPickup, index }: { stop: Stop; isPickup: boolean; index: number }) {
  const colors = useThemeColor();
  return (
    <View style={[styles.stopRow, !isPickup && { opacity: 0.5 }]}>
      <View style={[styles.stopDot, { backgroundColor: isPickup ? "#f7a01b" : colors.card, borderColor: colors.border, borderWidth: isPickup ? 0 : 1 }]}>
        <Text style={[styles.stopNum, { color: isPickup ? "#0f1115" : colors.icon }]}>{index + 1}</Text>
      </View>
      <View style={styles.stopInfo}>
        <Text style={[styles.stopName, { color: isPickup ? "#f7a01b" : colors.text }]}>{stop.name}</Text>
        {isPickup && <Text style={styles.pickupLabel}>Your Pickup Point</Text>}
      </View>
      {isPickup && (
        <View style={styles.standHereBadge}>
          <Text style={styles.standHereText}>STAND HERE</Text>
        </View>
      )}
    </View>
  );
}

export default function TrackBusScreen() {
  const colors = useThemeColor();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState(12);
  const [activeBuses, setActiveBuses] = useState<Record<string, { lat: number; lng: number }>>({});
  
  const socketRef = useRef<Socket | null>(null);
  const mapRef = useRef<MapView>(null);

  // Fetch student active booking
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get("/bookings/my");
        const bookings = res.data?.data?.bookings || [];
        
        // Exact logic from web matching trip statuses
        const active = bookings.find((b: any) => 
          b.status !== 'cancelled' && 
          b.trip && 
          ['scheduled', 'active', 'in_progress', 'in-progress'].includes(b.trip.status)
        );
        
        setBooking(active || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, []);

  // Socket connections
  useEffect(() => {
    if (!booking?.trip?._id) return;

    const studentRouteId = booking.route?._id || booking.route;

    socketRef.current = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    
    // Join specific rooms
    socketRef.current.emit("join_trip_room", booking.trip._id);
    if (studentRouteId) {
      socketRef.current.emit("join-route-room", studentRouteId);
    }

    // Legacy listener 
    socketRef.current.on("bus_location_updated", (data: any) => {
      if (data.lat !== undefined && data.lng !== undefined) {
        const legacyBusId = booking.trip?.bus?._id || booking.trip?.bus_number || 'legacy-bus';
        
        setActiveBuses(prev => ({ ...prev, [legacyBusId]: data }));
        setEta(prev => (prev > 1 ? prev - 1 : 1));
        
        mapRef.current?.animateToRegion({
          latitude: data.lat, longitude: data.lng,
          latitudeDelta: 0.01, longitudeDelta: 0.01,
        });
      }
    });

    // Global listener
    socketRef.current.on("bus_location_update", (data: any) => {
      if (data.lat !== undefined && data.lng !== undefined && data.busId) {
        setActiveBuses(prev => ({ ...prev, [data.busId]: data }));
        
        if (data.tripId && String(data.tripId) === String(booking.trip?._id)) {
          setEta(prev => (prev > 1 ? prev - 1 : 1));
          mapRef.current?.animateToRegion({
            latitude: data.lat, longitude: data.lng,
            latitudeDelta: 0.01, longitudeDelta: 0.01,
          });
        }
      }
    });

    return () => {
      socketRef.current?.emit("leave-trip-room", booking.trip._id);
      if (studentRouteId) {
        socketRef.current?.emit("leave-route-room", studentRouteId);
      }
      socketRef.current?.disconnect();
    };
  }, [booking]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#f7a01b" />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Connecting to GPS...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Bus size={28} color={colors.icon} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Trips</Text>
          <Text style={[styles.emptyDesc, { color: colors.icon }]}>
            You have no active trips to track. Please book a seat first.
          </Text>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push("/(student)/book-trip" as any)}
          >
            <Text style={styles.bookBtnText}>Book a Seat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const stops = booking.trip?.route?.stops || [];
  const busNumber = booking.trip?.bus_number || "AWAITING ASSIGNMENT";
  const driverName = booking.trip?.driver || "Pending Driver";
  const pickupStop = stops.find(s => s._id === booking.pickup_point);

  // Fallback Center coordinates
  const activeBusList = Object.values(activeBuses);
  const firstBusPos = activeBusList[0];
  const centerLat = firstBusPos?.lat || booking.trip?.current_location?.lat || pickupStop?.location?.lat || 24.0889;
  const centerLng = firstBusPos?.lng || booking.trip?.current_location?.lng || pickupStop?.location?.lng || 32.8998;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Live Movement</Text>
          <Text style={styles.gpsText}>GPS CONNECTED</Text>
        </View>
        <View style={styles.etaBox}>
          <Text style={[styles.etaLabel, { color: colors.icon }]}>Arrival In</Text>
          <Text style={styles.etaValue}>{eta} <Text style={styles.etaMin}>MIN</Text></Text>
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: centerLat, longitude: centerLng,
          latitudeDelta: 0.01, longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Render markers for all active buses */}
        {Object.entries(activeBuses).map(([id, bus]) => (
          <Marker key={id} coordinate={{ latitude: bus.lat, longitude: bus.lng }} title={busNumber}>
            <View style={styles.busMarker} />
          </Marker>
        ))}

        {/* Fallback marker if no live socket data yet */}
        {activeBusList.length === 0 && (
          <Marker coordinate={{ latitude: centerLat, longitude: centerLng }} title={busNumber}>
            <View style={styles.busMarker} />
          </Marker>
        )}
      </MapView>

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>

        {/* Bus Info */}
        <View style={[styles.busCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.busCardLeft}>
            <View style={styles.busIconBox}>
              <Bus size={20} color="#f7a01b" />
            </View>
            <View>
              <Text style={[styles.busNumber, { color: colors.text }]}>{busNumber}</Text>
              <Text style={[styles.busDriver, { color: colors.icon }]}>Driver: {driverName} • 42 km/h</Text>
            </View>
          </View>
          <Navigation size={20} color="#f7a01b" />
        </View>

        {/* Stops */}
        <Text style={[styles.stopsTitle, { color: colors.text }]}>Route Stops</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.stopsList}>
          {stops.length === 0 ? (
            <Text style={[styles.noStops, { color: colors.icon }]}>No stops found for this route.</Text>
          ) : (
            stops.map((stop, idx) => (
              <StopItem
                key={stop._id}
                stop={stop}
                isPickup={stop._id === booking.pickup_point}
                index={idx}
              />
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },

  loadingText: { marginTop: 12, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 2 },

  emptyCard: { borderRadius: 28, padding: 32, alignItems: "center", borderWidth: 1, width: "100%" },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  emptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  bookBtn: { backgroundColor: "#f7a01b", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, width: "100%", alignItems: "center" },
  bookBtnText: { fontSize: 13, fontWeight: "900", color: "#0f1115", textTransform: "uppercase", letterSpacing: 1 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  gpsText: { fontSize: 9, fontWeight: "800", color: "#22c55e", letterSpacing: 2, textTransform: "uppercase" },
  etaBox: { alignItems: "flex-end" },
  etaLabel: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  etaValue: { fontSize: 24, fontWeight: "900", color: "#f7a01b" },
  etaMin: { fontSize: 10 },

  map: { height: "40%", width: "100%" },
  busMarker: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#f7a01b", borderWidth: 3, borderColor: "#fff", shadowColor: "#f7a01b", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 8 },

  bottomSheet: { flex: 1, borderTopWidth: 1, padding: 20 },
  busCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 16 },
  busCardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  busIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(247,160,27,0.1)", alignItems: "center", justifyContent: "center" },
  busNumber: { fontSize: 14, fontWeight: "900", textTransform: "uppercase" },
  busDriver: { fontSize: 11, fontWeight: "600" },

  stopsTitle: { fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 3, marginBottom: 12 },
  stopsList: { flex: 1 },
  noStops: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", textAlign: "center", marginTop: 20 },

  stopRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  stopDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  stopNum: { fontSize: 11, fontWeight: "900" },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 13, fontWeight: "700", textTransform: "uppercase" },
  pickupLabel: { fontSize: 10, color: "#8a8d91", marginTop: 2 },
  standHereBadge: { backgroundColor: "rgba(247,160,27,0.15)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(247,160,27,0.3)" },
  standHereText: { fontSize: 7, fontWeight: "900", color: "#f7a01b", letterSpacing: 1 },
});