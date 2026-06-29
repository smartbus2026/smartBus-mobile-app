// app/(student)/track-bus.tsx
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Platform, ScrollView,
  Text, TouchableOpacity, View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Bus, Navigation, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import api, { BASE_URL } from '../../src/services/api';

const SOCKET_URL = BASE_URL.replace('/api', '');

interface Stop {
  _id: string; name: string; location: { lat: number; lng: number };
}
interface Booking {
  _id: string; pickup_point: string; status: string; route?: any;
  trip: {
    _id: string; bus_number: string; driver?: string; status: string;
    bus?: { _id: string }; current_location?: { lat: number; lng: number };
    route?: { stops: Stop[] };
  };
}

// ─── Stop Item ────────────────────────────────────────────────────────────────
function StopItem({ stop, isPickup, index, colors }: { stop: Stop; isPickup: boolean; index: number; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, opacity: isPickup ? 1 : 0.5 }}>
      <View style={{
        width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        backgroundColor: isPickup ? colors.tint : colors.card,
        borderWidth: isPickup ? 0 : 1, borderColor: colors.border,
      }}>
        <Text style={{ fontSize: 11, fontWeight: '900', color: isPickup ? '#000' : colors.icon }}>
          {index + 1}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', textTransform: 'uppercase', color: isPickup ? colors.tint : colors.text }}>
          {stop.name}
        </Text>
        {isPickup && (
          <Text style={{ fontSize: 10, fontWeight: '600', color: colors.icon, marginTop: 2 }}>
            Your Pickup Point
          </Text>
        )}
      </View>
      {isPickup && (
        <View style={{
          borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
          backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
        }}>
          <Text style={{ fontSize: 7, fontWeight: '900', color: colors.tint, letterSpacing: 1 }}>
            STAND HERE
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TrackBusScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const [booking, setBooking]       = useState<Booking | null>(null);
  const [loading, setLoading]       = useState(true);
  const [eta, setEta]               = useState(12);
  const [activeBuses, setActiveBuses] = useState<Record<string, { lat: number; lng: number }>>({});

  const socketRef = useRef<Socket | null>(null);
  const mapRef    = useRef<MapView>(null);

  useEffect(() => {
    api.get('/bookings/my')
      .then(res => {
        const bookings = res.data?.data?.bookings || [];
        const active = bookings.find((b: any) =>
          b.status !== 'cancelled' &&
          b.trip &&
          ['scheduled', 'active', 'in_progress', 'in-progress'].includes(b.trip.status)
        );
        setBooking(active || null);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!booking?.trip?._id) return;
    const studentRouteId = booking.route?._id || booking.route;

    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current.emit('join_trip_room', booking.trip._id);
    if (studentRouteId) socketRef.current.emit('join-route-room', studentRouteId);

    socketRef.current.on('bus_location_updated', (data: any) => {
      if (data.lat !== undefined && data.lng !== undefined) {
        const legacyBusId = booking.trip?.bus?._id || booking.trip?.bus_number || 'legacy-bus';
        setActiveBuses(prev => ({ ...prev, [legacyBusId]: data }));
        setEta(prev => (prev > 1 ? prev - 1 : 1));
        mapRef.current?.animateToRegion({ latitude: data.lat, longitude: data.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      }
    });

    socketRef.current.on('bus_location_update', (data: any) => {
      if (data.lat !== undefined && data.lng !== undefined && data.busId) {
        setActiveBuses(prev => ({ ...prev, [data.busId]: data }));
        if (data.tripId && String(data.tripId) === String(booking.trip?._id)) {
          setEta(prev => (prev > 1 ? prev - 1 : 1));
          mapRef.current?.animateToRegion({ latitude: data.lat, longitude: data.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        }
      }
    });

    return () => {
      socketRef.current?.emit('leave-trip-room', booking.trip._id);
      if (studentRouteId) socketRef.current?.emit('leave-route-room', studentRouteId);
      socketRef.current?.disconnect();
    };
  }, [booking]);

  // ── Loading ──
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>
          CONNECTING TO GPS...
        </Text>
      </View>
    );
  }

  // ── No Active Trip ──
  if (!booking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background }}>
        <View style={{
          borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, width: '100%',
          backgroundColor: colors.card, borderColor: colors.border,
        }}>
          <View style={{
            width: 72, height: 72, borderRadius: 24, marginBottom: 20,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
          }}>
            <Bus size={32} color={colors.tint} />
          </View>
          <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text, marginBottom: 8, textAlign: 'center' }}>
            NO ACTIVE{' '}<Text style={{ color: colors.tint }}>TRIPS</Text>
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 20, color: colors.icon, marginBottom: 24 }}>
            You have no active trips to track. Please book a seat first.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(student)/book-trip' as any)}
            style={{
              width: '100%', alignItems: 'center', justifyContent: 'center',
              paddingVertical: 14, borderRadius: 14, backgroundColor: colors.tint,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#000' }}>
              BOOK A SEAT
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const stops      = booking.trip?.route?.stops || [];
  const busNumber  = booking.trip?.bus_number || 'AWAITING ASSIGNMENT';
  const driverName = booking.trip?.driver || 'Pending Driver';
  const activeBusList = Object.values(activeBuses);
  const firstBusPos   = activeBusList[0];
  const pickupStop    = stops.find(s => s._id === booking.pickup_point);
  const centerLat = firstBusPos?.lat || booking.trip?.current_location?.lat || pickupStop?.location?.lat || 24.0889;
  const centerLng = firstBusPos?.lng || booking.trip?.current_location?.lng || pickupStop?.location?.lng || 32.8998;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
        backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 44, height: 44, borderRadius: 14,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
          }}
        >
          <ArrowLeft size={20} color={colors.tint} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>
            LIVE MOVEMENT
          </Text>
          <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 2, color: '#22c55e' }}>
            GPS CONNECTED
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>
            Arrival In
          </Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.tint }}>
            {eta} <Text style={{ fontSize: 10 }}>MIN</Text>
          </Text>
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={{ height: '40%', width: '100%' }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{ latitude: centerLat, longitude: centerLng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {Object.entries(activeBuses).map(([id, bus]) => (
          <Marker key={id} coordinate={{ latitude: bus.lat, longitude: bus.lng }} title={busNumber}>
            <View style={{
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: colors.tint, borderWidth: 3, borderColor: '#fff',
              shadowColor: colors.tint, shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8, shadowRadius: 8, elevation: 8,
            }} />
          </Marker>
        ))}
        {activeBusList.length === 0 && (
          <Marker coordinate={{ latitude: centerLat, longitude: centerLng }} title={busNumber}>
            <View style={{
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: colors.tint, borderWidth: 3, borderColor: '#fff',
              shadowColor: colors.tint, shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8, shadowRadius: 8, elevation: 8,
            }} />
          </Marker>
        )}
      </MapView>

      {/* Bottom Sheet */}
      <View style={{ flex: 1, padding: 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>

        {/* Bus Info Card */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 20,
          backgroundColor: colors.background, borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
              backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
            }}>
              <Bus size={20} color={colors.tint} />
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '900', textTransform: 'uppercase', color: colors.text }}>
                {busNumber}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.icon }}>
                Driver: {driverName} • 42 km/h
              </Text>
            </View>
          </View>
          <Navigation size={20} color={colors.tint} />
        </View>

        {/* Stops */}
        <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon, marginBottom: 14 }}>
          ROUTE STOPS
        </Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {stops.length === 0 ? (
            <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', marginTop: 20, color: colors.icon }}>
              No stops found for this route.
            </Text>
          ) : (
            stops.map((stop, idx) => (
              <StopItem
                key={stop._id} stop={stop} index={idx}
                isPickup={stop._id === booking.pickup_point}
                colors={colors}
              />
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

    </View>
  );
}