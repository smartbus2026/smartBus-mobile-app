import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Camera } from 'react-native-maps';
import { useRouter } from 'expo-router';
import {
  Navigation, MapPin, Bus, Signal, AlertTriangle,
} from 'lucide-react-native';
import { useDriverContext } from './_layout';
import { useThemeColor } from '../../constants/theme';
import TopBar from '../../src/components/TopBar';

// ─── Map dark style (matches app dark theme) ──────────────────────────────────
const DARK_MAP_STYLE = [
  { elementType: 'geometry',                              stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill',                     stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke',                   stylers: [{ color: '#242f3e' }] },
  { featureType: 'road',        elementType: 'geometry', stylers: [{ color: '#2b2b3b' }] },
  { featureType: 'road',        elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road',        elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'water',       elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water',       elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'poi',         elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',     elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#57585d' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
];

// ─── Stat Pill ─────────────────────────────────────────────────────────────────
const StatPill = ({
  label, value, color, colors,
}: {
  label: string; value: string; color: string; colors: any;
}) => (
  <View style={[s.statPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Text style={[s.statPillLabel, { color: colors.icon }]}>{label}</Text>
    <Text style={[s.statPillValue, { color }]}>{value}</Text>
  </View>
);

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function DriverLiveTrackingScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { activeTrip, geo, trips } = useDriverContext();

  const mapRef = useRef<MapView>(null);

  const currentTrip = trips.find(
    t => t._id === activeTrip &&
      (t.status === 'active' || t.status === 'in-progress' || t.status === 'in_progress')
  );

  // Auto-fly map to new GPS coords
  useEffect(() => {
    if (geo.lat !== null && geo.lng !== null && mapRef.current) {
      const camera: Camera = {
        center: { latitude: geo.lat, longitude: geo.lng },
        zoom: 16,
        pitch: 45,
        heading: 0,
        altitude: 500,
      };
      mapRef.current.animateCamera(camera, { duration: 800 });
    }
  }, [geo.lat, geo.lng]);

  // ── No active trip ────────────────────────────────────────────────────────
  if (!activeTrip) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <TopBar
          title="Live Tracking"
          showMenu
          showSettings
          onSettingsPress={() => router.push('/(driver)/settings' as any)}
        />
        <View style={[s.emptyWrap, { backgroundColor: colors.background }]}>
          <View style={[s.emptyIcon, { backgroundColor: 'rgba(247,160,27,0.08)', borderColor: 'rgba(247,160,27,0.15)' }]}>
            <Navigation size={40} color="#f7a01b" style={{ opacity: 0.5 }} />
          </View>
          <Text style={[s.emptyTitle, { color: colors.text }]}>MAP INACTIVE</Text>
          <Text style={[s.emptyDesc, { color: colors.icon }]}>
            Start a trip from the dashboard to begin GPS broadcasting and see your live location here.
          </Text>
          <TouchableOpacity
            style={[s.goBtn, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/(driver)/dashboard' as any)}
            activeOpacity={0.85}
          >
            <Bus size={16} color="#000" />
            <Text style={s.goBtnTxt}>GO TO DASHBOARD</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── GPS acquiring ─────────────────────────────────────────────────────────
  if (geo.lat === null || geo.lng === null) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <TopBar
          title="Live Tracking"
          showMenu
          showSettings
          onSettingsPress={() => router.push('/(driver)/settings' as any)}
        />
        <View style={[s.emptyWrap, { backgroundColor: colors.background }]}>
          {geo.error ? (
            <>
              <View style={[s.emptyIcon, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.15)' }]}>
                <AlertTriangle size={40} color="#ef4444" />
              </View>
              <Text style={[s.emptyTitle, { color: colors.text }]}>GPS ERROR</Text>
              <Text style={[s.emptyDesc, { color: '#ef4444' }]}>{geo.error}</Text>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={colors.tint} style={{ marginBottom: 20 }} />
              <Text style={[s.emptyTitle, { color: colors.text }]}>ACQUIRING GPS</Text>
              <Text style={[s.emptyDesc, { color: colors.icon }]}>
                Getting your location… make sure GPS is enabled on your device.
              </Text>
            </>
          )}
        </View>
      </View>
    );
  }

  // ── Live map ──────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <TopBar
        title="Live Tracking"
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(driver)/settings' as any)}
      />

      {/* Full-screen Map */}
      <View style={s.mapWrap}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={s.map}
          customMapStyle={DARK_MAP_STYLE}
          initialRegion={{
            latitude:      geo.lat,
            longitude:     geo.lng,
            latitudeDelta:  0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={false}
          showsCompass={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          rotateEnabled={false}
        >
          {/* Bus Marker */}
          <Marker
            coordinate={{ latitude: geo.lat, longitude: geo.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={s.busMarker}>
              <View style={s.busMarkerRing} />
              <View style={s.busMarkerInner}>
                <Text style={s.busMarkerEmoji}>🚌</Text>
              </View>
            </View>
          </Marker>
        </MapView>

        {/* Overlay: GPS live badge */}
        <View style={[s.liveBadge, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
          <View style={s.liveDot} />
          <Text style={s.liveBadgeTxt}>LIVE</Text>
        </View>

        {/* Overlay: Stats */}
        <View style={s.statsOverlay}>
          <StatPill
            label="LAT"
            value={geo.lat.toFixed(5)}
            color={colors.tint}
            colors={colors}
          />
          <StatPill
            label="LNG"
            value={geo.lng.toFixed(5)}
            color={colors.tint}
            colors={colors}
          />
          {geo.accuracy !== null && (
            <StatPill
              label="ACC"
              value={`±${Math.round(geo.accuracy)}m`}
              color={geo.accuracy < 20 ? '#22c55e' : geo.accuracy < 50 ? '#f7a01b' : '#ef4444'}
              colors={colors}
            />
          )}
        </View>

        {/* Overlay: Recenter button */}
        <TouchableOpacity
          style={[s.recenterBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {
            if (geo.lat !== null && geo.lng !== null && mapRef.current) {
              mapRef.current.animateCamera({
                center: { latitude: geo.lat, longitude: geo.lng },
                zoom: 16, pitch: 45, heading: 0, altitude: 500,
              }, { duration: 600 });
            }
          }}
          activeOpacity={0.8}
        >
          <MapPin size={18} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {/* Bottom Info Panel */}
      {currentTrip && (
        <View style={[s.infoPanel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={s.infoPanelRow}>
            <View style={[s.infoBusIcon, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
              <Bus size={18} color="#22c55e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.infoPanelRoute, { color: colors.text }]} numberOfLines={1}>
                {currentTrip.route?.name ?? '—'}
              </Text>
              <Text style={[s.infoPanelBus, { color: colors.icon }]}>
                {currentTrip.bus_number}  ·  {currentTrip.usersCount ?? currentTrip.booked_seats} passengers
              </Text>
            </View>
            <View style={s.infoSignal}>
              <Signal size={14} color="#22c55e" />
              <Text style={s.infoSignalTxt}>ACTIVE</Text>
            </View>
          </View>

          {/* Stops quick view */}
          {(currentTrip.route?.stops ?? []).length > 0 && (
            <View style={[s.stopsQuick, { borderTopColor: colors.border }]}>
              <Text style={[s.stopsQuickLabel, { color: colors.icon }]}>ROUTE</Text>
              <Text style={[s.stopsQuickValue, { color: colors.text }]} numberOfLines={1}>
                {(currentTrip.route?.stops ?? []).map(s => s.name).join('  →  ')}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1 },

  // Empty / loading states
  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon:  { width: 90, height: 90, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' },
  emptyDesc:  { fontSize: 12, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  goBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 18 },
  goBtnTxt:   { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },

  // Map
  mapWrap: { flex: 1, position: 'relative' },
  map:     { ...StyleSheet.absoluteFillObject },

  // Bus marker
  busMarker:      { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  busMarkerRing:  { position: 'absolute', width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(247,160,27,0.25)', borderWidth: 2, borderColor: 'rgba(247,160,27,0.5)' },
  busMarkerInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f7a01b', borderWidth: 3, borderColor: '#1c1c1c', alignItems: 'center', justifyContent: 'center', shadowColor: '#f7a01b', shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  busMarkerEmoji: { fontSize: 18 },

  // Live badge
  liveBadge:    { position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  liveDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  liveBadgeTxt: { fontSize: 10, fontWeight: '900', color: '#22c55e', letterSpacing: 2 },

  // Stats overlay
  statsOverlay: { position: 'absolute', top: 16, right: 16, gap: 6 },
  statPill:     { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14, borderWidth: 1, alignItems: 'center', minWidth: 80 },
  statPillLabel:{ fontSize: 7, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 },
  statPillValue:{ fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },

  // Recenter
  recenterBtn: { position: 'absolute', bottom: 16, right: 16, width: 46, height: 46, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },

  // Info panel
  infoPanel:    { borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  infoPanelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  infoBusIcon:  { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  infoPanelRoute: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  infoPanelBus:   { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  infoSignal:   { alignItems: 'center', gap: 4 },
  infoSignalTxt:{ fontSize: 8, fontWeight: '900', color: '#22c55e', letterSpacing: 1 },

  stopsQuick:      { borderTopWidth: 1, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  stopsQuickLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', width: 40 },
  stopsQuickValue: { flex: 1, fontSize: 10, fontWeight: '600' },
});