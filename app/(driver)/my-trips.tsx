import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bus, Clock, Calendar, Users, Route,
  CheckCircle, X, Play, Square,
} from 'lucide-react-native';
import { useDriverContext, DriverTrip } from './_layout';
import { useThemeColor } from '../../constants/theme';
import TopBar from '../../src/components/TopBar';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TIME_SLOT_LABEL: Record<string, string> = {
  morning:     'Morning Departure',
  return_1530: 'Return — 3:30 PM',
  return_1900: 'Return — 7:00 PM',
};

const getStatusColors = (status: string) => {
  if (status === 'active' || status === 'in-progress' || status === 'in_progress')
    return { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',  text: '#22c55e' };
  if (status === 'scheduled')
    return { bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)', text: '#60a5fa' };
  if (status === 'completed')
    return { bg: 'rgba(247,160,27,0.1)',  border: 'rgba(247,160,27,0.25)', text: '#f7a01b' };
  if (status === 'cancelled')
    return { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',  text: '#ef4444' };
  return       { bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)', text: '#9ca3af' };
};

const canStartTrip = (trip: DriverTrip): boolean => {
  const d = new Date(trip.date);
  let timeStr = '08:30';
  if (trip.time_slot === 'return_1530') timeStr = '15:30';
  if (trip.time_slot === 'return_1900') timeStr = '19:00';
  const [h, m] = timeStr.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return (d.getTime() - Date.now()) <= 60 * 60 * 1000;
};

// ─── InfoRow ──────────────────────────────────────────────────────────────────
const InfoRow = ({
  icon, label, value, colors,
}: {
  icon: React.ReactNode; label: string; value: string; colors: any;
}) => (
  <View style={[s.infoRow, { borderBottomColor: colors.border }]}>
    <View style={s.infoLeft}>
      {icon}
      <Text style={[s.infoLabel, { color: colors.icon }]}>{label}</Text>
    </View>
    <Text style={[s.infoValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
  </View>
);

// ─── Stop Dot ─────────────────────────────────────────────────────────────────
const StopDot = ({ idx, total }: { idx: number; total: number }) => {
  if (idx === 0)         return <View style={[s.stopDot, { backgroundColor: '#f7a01b', borderColor: '#f7a01b' }]} />;
  if (idx === total - 1) return <View style={[s.stopDot, { backgroundColor: '#22c55e', borderColor: '#22c55e' }]} />;
  return                        <View style={[s.stopDot, { backgroundColor: 'transparent', borderColor: '#4b5563' }]} />;
};

// ─── Trip Card ────────────────────────────────────────────────────────────────
const TripCard = ({ trip, colors }: { trip: DriverTrip; colors: any }) => {
  const { activeTrip, actionLoading, handleStartTrip, handleEndTrip } = useDriverContext();

  const isThisActive   = trip.status === 'active' || trip.status === 'in-progress' || trip.status === 'in_progress';
  const isBtnLoading   = actionLoading === trip._id;
  const sc             = getStatusColors(trip.status);
  const stops          = trip.route?.stops ?? [];
  const firstStop      = stops[0]?.name ?? 'Origin';
  const lastStop       = stops[stops.length - 1]?.name ?? 'Destination';
  const canStart       = canStartTrip(trip);
  const startDisabled  = isBtnLoading || !!activeTrip || !canStart;
  const passengerCount = trip.usersCount ?? trip.booked_seats;

  const tripDate = (() => {
    try {
      return new Date(trip.date).toLocaleDateString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return '—'; }
  })();

  return (
    <View style={[
      s.card,
      { backgroundColor: colors.card, borderColor: isThisActive ? 'rgba(34,197,94,0.35)' : colors.border },
    ]}>
      {/* Active accent bar */}
      {isThisActive && <View style={s.activeBar} />}

      <View style={s.cardInner}>

        {/* Header */}
        <View style={s.cardHeader}>
          <View style={[s.cardIcon, {
            backgroundColor: isThisActive ? 'rgba(34,197,94,0.12)' : 'rgba(247,160,27,0.1)',
          }]}>
            <Bus size={20} color={isThisActive ? '#22c55e' : '#f7a01b'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.routeName, { color: colors.text }]} numberOfLines={1}>
              {trip.route?.name ?? '—'}
            </Text>
            <Text style={[s.routeStops, { color: colors.icon }]} numberOfLines={1}>
              {firstStop} → {lastStop}
            </Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[s.statusTxt, { color: sc.text }]}>
              {trip.status.replace('_', '-').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Info rows */}
        <View style={[s.infoBlock, { borderColor: colors.border }]}>
          <InfoRow icon={<Bus size={13} color="#f7a01b" />}      label="BUS"        value={trip.bus_number}                          colors={colors} />
          <InfoRow icon={<Clock size={13} color="#f7a01b" />}    label="TIME SLOT"  value={TIME_SLOT_LABEL[trip.time_slot] ?? trip.time_slot} colors={colors} />
          <InfoRow icon={<Calendar size={13} color="#f7a01b" />} label="DATE"       value={tripDate}                                 colors={colors} />
          <InfoRow icon={<Users size={13} color="#f7a01b" />}    label="STUDENTS"   value={`${passengerCount} passengers`}           colors={colors} />
        </View>

        {/* Stops */}
        {stops.length > 0 && (
          <View style={[s.stopsBlock, { borderTopColor: colors.border }]}>
            <View style={s.stopsLabelRow}>
              <Route size={11} color={colors.icon} />
              <Text style={[s.stopsLabel, { color: colors.icon }]}>ROUTE STOPS</Text>
            </View>
            <View style={s.stopsList}>
              <View style={[s.stopsLine, { backgroundColor: colors.border }]} />
              {stops.map((stop, idx) => (
                <View key={stop._id ?? idx} style={s.stopRow}>
                  <StopDot idx={idx} total={stops.length} />
                  <Text
                    style={[
                      s.stopName,
                      { color: (idx === 0 || idx === stops.length - 1) ? colors.text : colors.icon },
                    ]}
                    numberOfLines={1}
                  >
                    {stop.name}
                  </Text>
                  {idx === 0 && (
                    <Text style={[s.stopTag, { color: '#f7a01b' }]}>START</Text>
                  )}
                  {idx === stops.length - 1 && (
                    <Text style={[s.stopTag, { color: '#22c55e' }]}>END</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Action: SCHEDULED → Start ── */}
        {trip.status === 'scheduled' && (
          <View style={s.actionBlock}>
            <TouchableOpacity
              disabled={startDisabled}
              onPress={() => handleStartTrip(trip._id)}
              style={[
                s.actionBtn,
                startDisabled
                  ? [s.btnDisabled, { backgroundColor: colors.background, borderColor: colors.border }]
                  : s.btnStart,
              ]}
              activeOpacity={0.8}
            >
              {isBtnLoading
                ? <ActivityIndicator size="small" color={startDisabled ? colors.icon : '#000'} />
                : <Play size={14} color={startDisabled ? colors.icon : '#000'} />
              }
              <Text style={[s.actionBtnTxt, { color: startDisabled ? colors.icon : '#000' }]}>
                {isBtnLoading ? 'STARTING...' : 'START TRIP'}
              </Text>
            </TouchableOpacity>

            {!canStart && (
              <Text style={[s.hintTxt, { color: colors.icon }]}>
                Unlocks 1 hour before departure
              </Text>
            )}
            {!!activeTrip && !isThisActive && (
              <Text style={[s.hintTxt, { color: '#ef4444' }]}>
                End your active trip first
              </Text>
            )}
          </View>
        )}

        {/* ── Action: ACTIVE → End ── */}
        {isThisActive && (
          <TouchableOpacity
            disabled={isBtnLoading}
            onPress={() =>
              Alert.alert(
                'End Trip',
                'Are you sure you want to end this trip?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'End Trip', style: 'destructive', onPress: () => handleEndTrip(trip._id) },
                ]
              )
            }
            style={[s.actionBtn, s.btnEnd, isBtnLoading && { opacity: 0.6 }]}
            activeOpacity={0.8}
          >
            {isBtnLoading
              ? <ActivityIndicator size="small" color="#ef4444" />
              : <Square size={14} color="#ef4444" />
            }
            <Text style={[s.actionBtnTxt, { color: '#ef4444' }]}>
              {isBtnLoading ? 'ENDING...' : 'END TRIP'}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Action: COMPLETED ── */}
        {trip.status === 'completed' && (
          <View style={[s.actionBtn, s.btnCompleted, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <CheckCircle size={14} color={colors.icon} />
            <Text style={[s.actionBtnTxt, { color: colors.icon }]}>COMPLETED</Text>
          </View>
        )}

        {/* ── Action: CANCELLED ── */}
        {trip.status === 'cancelled' && (
          <View style={[s.actionBtn, s.btnCompleted, {
            backgroundColor: 'rgba(239,68,68,0.06)',
            borderColor: 'rgba(239,68,68,0.2)',
          }]}>
            <X size={14} color="#ef4444" />
            <Text style={[s.actionBtnTxt, { color: '#ef4444' }]}>CANCELLED</Text>
          </View>
        )}

      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DriverMyTripsScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { trips, isLoading, fetchTrips } = useDriverContext();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <TopBar
        title="My Trips"
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(driver)/settings' as any)}
      />

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[s.loadingTxt, { color: colors.icon }]}>Loading Trips...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
          }
        >
          {/* Section header */}
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>
              MY <Text style={{ color: colors.tint }}>TRIPS</Text>
            </Text>
            <View style={[s.sectionDivider, { backgroundColor: colors.border }]} />
            <Text style={[s.sectionCount, { color: colors.icon }]}>
              <Text style={{ color: colors.text }}>{trips.length}</Text> ASSIGNED
            </Text>
          </View>

          {/* Empty */}
          {trips.length === 0 ? (
            <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Bus size={48} color={colors.tint} style={{ marginBottom: 14, opacity: 0.4 }} />
              <Text style={[s.emptyTitle, { color: colors.text }]}>No Upcoming Trips</Text>
              <Text style={[s.emptyDesc, { color: colors.icon }]}>
                Contact your admin to get assigned trips.
              </Text>
            </View>
          ) : (
            trips.map(trip => (
              <TripCard key={trip._id} trip={trip} colors={colors} />
            ))
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { padding: 20, paddingTop: 16 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },

  // Section header
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle:   { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  sectionDivider: { flex: 1, height: 1 },
  sectionCount:   { fontSize: 9, fontWeight: '700', letterSpacing: 2 },

  // Empty
  emptyCard:  { borderWidth: 1, borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  emptyDesc:  { fontSize: 11, textAlign: 'center', lineHeight: 18 },

  // Card
  card:      { borderWidth: 1, borderRadius: 28, overflow: 'hidden', marginBottom: 16 },
  cardInner: { padding: 20, gap: 16 },
  activeBar: { height: 3, backgroundColor: '#22c55e' },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon:   { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  routeName:  { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  routeStops: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusTxt:   { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

  // Info rows
  infoBlock: { gap: 0 },
  infoRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  infoLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  infoValue: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', maxWidth: '55%' },

  // Stops
  stopsBlock:   { paddingTop: 14, borderTopWidth: 1, gap: 10 },
  stopsLabelRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  stopsLabel:   { fontSize: 9, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  stopsList:    { paddingLeft: 16, gap: 8, position: 'relative' },
  stopsLine:    { position: 'absolute', left: 19, top: 8, bottom: 8, width: 1 },
  stopRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stopDot:      { width: 8, height: 8, borderRadius: 4, borderWidth: 2, marginLeft: -4 },
  stopName:     { fontSize: 10, fontWeight: '700', flex: 1 },
  stopTag:      { fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },

  // Actions
  actionBlock:  { gap: 6 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 18, borderWidth: 1, borderColor: 'transparent' },
  btnStart:     { backgroundColor: '#f7a01b' },
  btnDisabled:  { opacity: 0.5 },
  btnEnd:       { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' },
  btnCompleted: {},
  actionBtnTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  hintTxt:      { fontSize: 9, fontWeight: '700', textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase' },
});