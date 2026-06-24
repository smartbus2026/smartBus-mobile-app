import { useRouter } from "expo-router";
import { MapPin, Navigation, Target, TrendingUp, Bus, CheckCircle } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { io, Socket } from "socket.io-client";
import { useThemeColor } from "../../constants/theme";
import api from "../../src/services/api";
import TopBar from "../../src/components/TopBar";
const BACKEND_URL = 'http://192.168.1.11:5001'; // نفس IP الـ backend

// ─── Types ────────────────────────────────────────────────────────────────────
interface TripStop {
  name: string;
  time: string;
  isCompleted: boolean;
}

interface ActiveTrip {
  id: string;
  routeName: string;
  busId: string;
  busNumber: string;
  driverName: string;
  status: string;
  progress: number;
  lastStop: string | null;
  nextStop: string | null;
  stops: TripStop[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTripProgress = (stops: TripStop[]): number => {
  if (!stops || stops.length === 0) return 0;
  const completed = stops.filter((s) => s.isCompleted).length;
  return Math.round((completed / stops.length) * 100);
};

const getLastCompleted = (stops: TripStop[]): string | null => {
  const done = stops.filter((s) => s.isCompleted);
  return done.length ? done[done.length - 1].name : null;
};

const getNextStop = (stops: TripStop[]): string | null => {
  const next = stops.find((s) => !s.isCompleted);
  return next ? next.name : null;
};

const MAP_CENTER = { latitude: 24.0889, longitude: 32.8998 };

// ─── Trip Card ────────────────────────────────────────────────────────────────
const TripCard: React.FC<{
  trip: ActiveTrip;
  location?: [number, number];
  colors: any;
  onViewOnMap: () => void;
}> = ({ trip, location, colors }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{
      borderRadius: 28, borderWidth: 1, overflow: 'hidden', marginBottom: 16,
      backgroundColor: colors.card, borderColor: colors.border,
    }}>
      {/* Card Header */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border,
        backgroundColor: `${colors.tint}0A`,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <View style={{ padding: 10, borderRadius: 14, backgroundColor: `${colors.tint}1A` }}>
            <Bus size={18} color={colors.tint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 }} numberOfLines={1}>
              {trip.routeName}
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.icon, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
              {trip.busNumber} • {trip.driverName}
            </Text>
          </View>
        </View>
        {/* Live badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Animated.View style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: colors.success || '#22C55E',
            opacity: pulseAnim,
          }} />
          <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.success || '#22C55E' }}>
            LIVE
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={{ padding: 20, gap: 16 }}>

        {/* Current Location */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          padding: 16, borderRadius: 18, borderWidth: 1,
          backgroundColor: colors.background, borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <MapPin size={18} color={colors.icon} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 4 }}>
                CURRENT LOCATION
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                {location
                  ? `${location[0].toFixed(4)}, ${location[1].toFixed(4)}`
                  : 'Locating...'}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress */}
        <View style={{
          padding: 16, borderRadius: 18, borderWidth: 1,
          backgroundColor: colors.background, borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon }}>
              ROUTE PROGRESS
            </Text>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.tint }}>
              {trip.progress}%
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden', marginBottom: 14 }}>
            <View style={{ height: '100%', width: `${trip.progress}%`, borderRadius: 3, backgroundColor: colors.tint }} />
          </View>

          {/* Last / Next Stop */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <CheckCircle size={12} color={colors.success || '#22C55E'} />
              <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }} numberOfLines={1}>
                {'PASSED '}
                <Text style={{ color: colors.text }}>{trip.lastStop || 'None'}</Text>
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
              <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, textAlign: 'right' }} numberOfLines={1}>
                {'NEXT '}
                <Text style={{ color: colors.tint }}>{trip.nextStop || 'Arriving'}</Text>
              </Text>
              <Target size={12} color={colors.tint} />
            </View>
          </View>
        </View>

        {/* Stops Timeline */}
        {trip.stops.length > 0 && (
          <View style={{ gap: 0 }}>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 12 }}>
              STOPS TIMELINE
            </Text>
            {trip.stops.map((stop, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                {/* Line + dot */}
                <View style={{ alignItems: 'center', width: 20 }}>
                  <View style={{
                    width: 12, height: 12, borderRadius: 6, borderWidth: 2,
                    backgroundColor: stop.isCompleted ? colors.tint : colors.background,
                    borderColor: stop.isCompleted ? colors.tint : colors.border,
                    marginTop: 2,
                  }} />
                  {i < trip.stops.length - 1 && (
                    <View style={{ width: 2, flex: 1, minHeight: 20, backgroundColor: stop.isCompleted ? `${colors.tint}4D` : colors.border, marginVertical: 2 }} />
                  )}
                </View>
                <View style={{ flex: 1, paddingBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: stop.isCompleted ? colors.text : colors.icon }}>
                    {stop.name}
                  </Text>
                  {stop.time !== 'TBA' && (
                    <Text style={{ fontSize: 10, color: colors.icon, marginTop: 2 }}>{stop.time}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LiveTrackingScreen() {
  const colors  = useThemeColor();
  const router  = useRouter();
  const mapRef  = useRef<MapView>(null);

  const [activeTrips, setActiveTrips]     = useState<ActiveTrip[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [busLocations, setBusLocations]   = useState<Record<string, [number, number]>>({});
  const [selectedTrip, setSelectedTrip]   = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // ── Fetch trips ────────────────────────────────────────────────────────────
  const fetchActiveTrips = async () => {
    try {
      const res = await api.get('/trips');
      const allTrips = res.data?.data || res.data || [];

      const activeRaw = allTrips.filter((t: any) =>
        ['active', 'in-progress', 'in_progress'].includes(t.status)
      );

      const mapped: ActiveTrip[] = activeRaw.map((trip: any) => {
        const stops: TripStop[] = (trip.route?.stops || []).map((stop: any, i: number) => ({
          name: typeof stop === 'string' ? stop : stop.name || 'Stop',
          time: 'TBA',
          isCompleted: i === 0,
        }));

        return {
          id: trip._id,
          routeName: trip.route?.name || 'Unknown Route',
          busId: trip.bus?._id || trip.bus_number || 'unknown',
          busNumber: trip.bus_number || 'Unknown Bus',
          driverName: trip.driver?.name || 'Pending',
          status: trip.status || 'active',
          progress: getTripProgress(stops),
          lastStop: getLastCompleted(stops),
          nextStop: getNextStop(stops),
          stops,
        };
      });

      setActiveTrips(mapped);
    } catch (err) {
      console.error('Failed to fetch trips', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTrips();
    const interval = setInterval(fetchActiveTrips, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Socket.io ──────────────────────────────────────────────────────────────
  useEffect(() => {
    socketRef.current = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    socketRef.current.emit('join-admin-tracking');

    socketRef.current.on('bus_location_update', (data: any) => {
      if (data.busId && data.lat !== undefined && data.lng !== undefined) {
        setBusLocations(prev => ({ ...prev, [data.busId]: [data.lat, data.lng] }));
      } else if (data.tripId && data.location) {
        setBusLocations(prev => ({ ...prev, [data.tripId]: [data.location.lat, data.location.lng] }));
      }
    });

    socketRef.current.on('trip_status_update', (data: any) => {
      if (data.tripId && data.status === 'completed') {
        setBusLocations(prev => { const n = { ...prev }; delete n[data.tripId]; return n; });
        setActiveTrips(prev => prev.filter(t => t.id !== data.tripId));
      }
    });

    return () => {
      socketRef.current?.emit('leave-admin-tracking');
      socketRef.current?.disconnect();
    };
  }, []);

  const tripsWithLocations = activeTrips.filter(t => busLocations[t.busId] || busLocations[t.id]);
  const hasEmittingBuses   = tripsWithLocations.length > 0;

  const focusOnTrip = (trip: ActiveTrip) => {
    const loc = busLocations[trip.busId] || busLocations[trip.id];
    if (loc && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: loc[0], longitude: loc[1],
        latitudeDelta: 0.01, longitudeDelta: 0.01,
      }, 600);
    }
    setSelectedTrip(trip.id === selectedTrip ? null : trip.id);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar title="Live Tracking" showMenu showSettings onSettingsPress={() => router.push('/(admin)/settings' as any)} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>
            LOCATING FLEET...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar
        title="Live Tracking"
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(admin)/settings' as any)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: -0.5 }}>
            Live Tracking
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.icon, textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>
            Real-time fleet monitoring
          </Text>
        </View>

        {/* ── Empty State ── */}
        {(!hasEmittingBuses || activeTrips.length === 0) ? (
          <View style={{ marginHorizontal: 20, marginTop: 20 }}>
            <View style={{
              borderRadius: 28, borderWidth: 1, padding: 48,
              alignItems: 'center', gap: 16,
              backgroundColor: colors.card, borderColor: colors.border,
            }}>
              <View style={{
                width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center',
                backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
              }}>
                <Target size={36} color={colors.tint} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text, textAlign: 'center' }}>
                No Active Trips
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.icon, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', lineHeight: 18 }}>
                Waiting for drivers to start their routes
              </Text>
              <TouchableOpacity
                onPress={fetchActiveTrips}
                style={{ marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33` }}
              >
                <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.tint }}>
                  REFRESH
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* ── Map ── */}
            <View style={{
              marginHorizontal: 20, marginBottom: 20, height: 300,
              borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
            }}>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}
                initialRegion={{ ...MAP_CENTER, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
                customMapStyle={mapDarkStyle}
              >
                {tripsWithLocations.map(trip => {
                  const loc = busLocations[trip.busId] || busLocations[trip.id];
                  if (!loc) return null;
                  return (
                    <Marker
                      key={trip.id}
                      coordinate={{ latitude: loc[0], longitude: loc[1] }}
                      onPress={() => focusOnTrip(trip)}
                    >
                      {/* Custom Bus Dot */}
                      <View style={{
                        width: 18, height: 18, borderRadius: 9, borderWidth: 3,
                        backgroundColor: colors.tint, borderColor: '#fff',
                        shadowColor: colors.tint, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8,
                      }} />
                      <Callout tooltip>
                        <View style={{
                          backgroundColor: colors.card, borderRadius: 14, padding: 12,
                          borderWidth: 1, borderColor: colors.border, minWidth: 140,
                        }}>
                          <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, marginBottom: 4 }}>ROUTE</Text>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.tint, marginBottom: 6 }}>{trip.routeName}</Text>
                          <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, marginBottom: 4 }}>BUS</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>{trip.busNumber}</Text>
                        </View>
                      </Callout>
                    </Marker>
                  );
                })}
              </MapView>

              {/* Fleet Count Badge */}
              <View style={{
                position: 'absolute', top: 16, left: 16, zIndex: 10,
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
                backgroundColor: `${colors.card}E6`, borderWidth: 1, borderColor: colors.border,
              }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.tint }} />
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>
                  {tripsWithLocations.length} Active {tripsWithLocations.length === 1 ? 'Bus' : 'Buses'}
                </Text>
              </View>
            </View>

            {/* ── Trip Selector (horizontal tabs if multiple) ── */}
            {tripsWithLocations.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {tripsWithLocations.map(trip => (
                    <TouchableOpacity
                      key={trip.id}
                      onPress={() => focusOnTrip(trip)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1,
                        backgroundColor: selectedTrip === trip.id ? colors.tint : colors.card,
                        borderColor: selectedTrip === trip.id ? colors.tint : colors.border,
                        flexDirection: 'row', alignItems: 'center', gap: 8,
                      }}
                    >
                      <Navigation size={12} color={selectedTrip === trip.id ? colors.background : colors.tint} />
                      <Text style={{
                        fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1,
                        color: selectedTrip === trip.id ? colors.background : colors.text,
                      }}>
                        {trip.busNumber}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* ── Trip Cards ── */}
            <View style={{ paddingHorizontal: 20 }}>
              {tripsWithLocations.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  location={busLocations[trip.busId] || busLocations[trip.id]}
                  colors={colors}
                  onViewOnMap={() => focusOnTrip(trip)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Google Maps Dark Style ───────────────────────────────────────────────────
const mapDarkStyle = [
  { elementType: 'geometry',            stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#242f3e' }] },
  { featureType: 'road',                elementType: 'geometry',         stylers: [{ color: '#2c2c54' }] },
  { featureType: 'road',                elementType: 'geometry.stroke',  stylers: [{ color: '#212a37' }] },
  { featureType: 'road.highway',        elementType: 'geometry',         stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway',        elementType: 'geometry.stroke',  stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway',        elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'water',               elementType: 'geometry',         stylers: [{ color: '#17263c' }] },
  { featureType: 'water',               elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'poi',                 stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',             stylers: [{ visibility: 'off' }] },
];