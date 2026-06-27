import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bus, Clock, Calendar, Users, Route,
  CheckCircle, X, Navigation, MapPin,
  Shield, Play, Square,
} from 'lucide-react-native';
import { useDriverContext, DriverTrip } from '../../src/context/DriverContext';
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
    return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)',  text: '#22c55e' };
  if (status === 'scheduled')
    return { bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)', text: '#60a5fa' };
  if (status === 'completed')
    return { bg: 'rgba(247,160,27,0.1)', border: 'rgba(247,160,27,0.25)', text: '#f7a01b' };
  if (status === 'cancelled')
    return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  text: '#ef4444' };
  return     { bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)', text: '#9ca3af' };
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

// ─── Sub-components ───────────────────────────────────────────────────────────
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

const StopDot = ({ idx, total }: { idx: number; total: number }) => {
  if (idx === 0)         return <View style={[s.stopDot, { backgroundColor: '#f7a01b', borderColor: '#f7a01b' }]} />;
  if (idx === total - 1) return <View style={[s.stopDot, { backgroundColor: '#22c55e', borderColor: '#22c55e' }]} />;
  return <View style={[s.stopDot, { backgroundColor: 'transparent', borderColor: '#4b5563' }]} />;
};

// ─── Trip Card ────────────────────────────────────────────────────────────────
const TripCard = ({ trip, colors }: { trip: DriverTrip; colors: any }) => {
  const { activeTrip, actionLoading, geo, handleStartTrip, handleEndTrip } = useDriverContext();
  const router = useRouter();

  const isThisActive  = trip.status === 'active' || trip.status === 'in-progress' || trip.status === 'in_progress';
  const isBtnLoading  = actionLoading === trip._id;
  const sc            = getStatusColors(trip.status);
  const stops         = trip.route?.stops ?? [];
  const firstStop     = stops[0]?.name ?? 'Origin';
  const lastStop      = stops[stops.length - 1]?.name ?? 'Destination';
  const canStart      = canStartTrip(trip);
  const startDisabled = isBtnLoading || !!activeTrip || !canStart;
  const passengerCount = trip.usersCount ?? trip.booked_seats;

  const departureTime = (() => {
    try {
      return new Date(trip.scheduled_time ?? trip.date).toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return '—'; }
  })();

  const tripDate = (() => {
    try {
      return new Date(trip.date).toLocaleDateString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return '—'; }
  })();

  return (
    <View style={[
      s.tripCard,
      { backgroundColor: colors.card, borderColor: isThisActive ? 'rgba(34,197,94,0.35)' : colors.border },
    ]}>
      {/* Active accent bar */}
      {isThisActive && <View style={s.activeAccentBar} />}

      <View style={s.tripCardInner}>

        {/* Card Header */}
        <View style={s.tripCardHeader}>
          <View style={[s.tripIconWrap, { backgroundColor: isThisActive ? 'rgba(34,197,94,0.12)' : 'rgba(247,160,27,0.1)' }]}>
            <Bus size={20} color={isThisActive ? '#22c55e' : '#f7a01b'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.tripRouteName, { color: colors.text }]} numberOfLines={1}>
              {trip.route?.name ?? '—'}
            </Text>
            <Text style={[s.tripStopsLine, { color: colors.icon }]} numberOfLines={1}>
              {firstStop} → {lastStop}
            </Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[s.statusTxt, { color: sc.text }]}>{trip.status.replace('_', '-').toUpperCase()}</Text>
          </View>
        </View>

        {/* Info Rows */}
        <View style={[s.infoBlock, { borderColor: colors.border }]}>
          <InfoRow icon={<Bus size={13} color="#f7a01b" />}      label="BUS"       value={trip.bus_number}                 colors={colors} />
          <InfoRow icon={<Clock size={13} color="#f7a01b" />}    label="TIME SLOT" value={TIME_SLOT_LABEL[trip.time_slot] ?? trip.time_slot} colors={colors} />
          <InfoRow icon={<Calendar size={13} color="#f7a01b" />} label="DATE"      value={tripDate}                        colors={colors} />
          <InfoRow icon={<Clock size={13} color="#f7a01b" />}    label="DEPARTURE" value={departureTime}                   colors={colors} />
          <InfoRow icon={<Users size={13} color="#f7a01b" />}    label="STUDENTS"  value={`${passengerCount} passengers`}  colors={colors} />
        </View>

        {/* Stops */}
        {stops.length > 0 && (
          <View style={[s.stopsBlock, { borderTopColor: colors.border }]}>
            <View style={s.stopsLabelRow}>
              <Route size={11} color={colors.icon} />
              <Text style={[s.stopsLabel, { color: colors.icon }]}>ROUTE STOPS</Text>
            </View>
            <View style={s.stopsList}>
              {/* Vertical line */}
              <View style={[s.stopsLine, { backgroundColor: colors.border }]} />
              {stops.map((stop, idx) => (
                <View key={stop._id ?? idx} style={s.stopRow}>
                  <StopDot idx={idx} total={stops.length} />
                  <Text style={[
                    s.stopName,
                    { color: (idx === 0 || idx === stops.length - 1) ? colors.text : colors.icon },
                  ]} numberOfLines={1}>
                    {stop.name}
                  </Text>
                  {idx === 0 && (
                    <Text style={s.stopTag}>START</Text>
                  )}
                  {idx === stops.length - 1 && (
                    <Text style={[s.stopTag, { color: '#22c55e' }]}>END</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* GPS Status (when this trip is active) */}
        {isThisActive && (
          <View style={[s.gpsBar, { backgroundColor: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.2)' }]}>
            <View style={s.gpsPulseDot}>
              <View style={s.gpsPulseRing} />
              <View style={s.gpsDot} />
            </View>
            <Text style={s.gpsBroadcastTxt}>GPS BROADCASTING LIVE</Text>
            {geo.lat !== null && (
              <TouchableOpacity onPress={() => router.push('/(driver)/live-tracking' as any)}>
                <View style={s.gpsViewMapBtn}>
                  <MapPin size={11} color="#22c55e" />
                  <Text style={s.gpsViewMapTxt}>MAP</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Buttons */}

        {/* SCHEDULED — Start */}
        {trip.status === 'scheduled' && (
          <View style={s.actionBlock}>
            <TouchableOpacity
              disabled={startDisabled}
              onPress={() => handleStartTrip(trip._id)}
              style={[
                s.actionBtn,
                startDisabled
                  ? [s.actionBtnDisabled, { backgroundColor: colors.background, borderColor: colors.border }]
                  : s.actionBtnStart,
              ]}
              activeOpacity={0.8}
            >
              {isBtnLoading ? (
                <ActivityIndicator size="small" color={startDisabled ? colors.icon : '#000'} />
              ) : (
                <Play size={14} color={startDisabled ? colors.icon : '#000'} />
              )}
              <Text style={[
                s.actionBtnTxt,
                { color: startDisabled ? colors.icon : '#000' },
              ]}>
                {isBtnLoading ? 'STARTING...' : 'START TRIP'}
              </Text>
            </TouchableOpacity>

            {!canStart && (
              <Text style={[s.actionHint, { color: colors.icon }]}>
                Unlocks 1 hour before departure
              </Text>
            )}
            {!!activeTrip && !isThisActive && (
              <Text style={[s.actionHint, { color: '#ef4444' }]}>
                End your active trip first
              </Text>
            )}
          </View>
        )}

        {/* ACTIVE — End */}
        {isThisActive && (
          <TouchableOpacity
            disabled={isBtnLoading}
            onPress={() => {
              Alert.alert(
                'End Trip',
                'Are you sure you want to end this trip?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'End Trip', style: 'destructive', onPress: () => handleEndTrip(trip._id) },
                ]
              );
            }}
            style={[s.actionBtn, s.actionBtnEnd, isBtnLoading && { opacity: 0.6 }]}
            activeOpacity={0.8}
          >
            {isBtnLoading ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Square size={14} color="#ef4444" />
            )}
            <Text style={[s.actionBtnTxt, { color: '#ef4444' }]}>
              {isBtnLoading ? 'ENDING...' : 'END TRIP'}
            </Text>
          </TouchableOpacity>
        )}

        {/* COMPLETED */}
        {trip.status === 'completed' && (
          <View style={[s.actionBtn, s.actionBtnCompleted, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <CheckCircle size={14} color={colors.icon} />
            <Text style={[s.actionBtnTxt, { color: colors.icon }]}>COMPLETED</Text>
          </View>
        )}

        {/* CANCELLED */}
        {trip.status === 'cancelled' && (
          <View style={[s.actionBtn, s.actionBtnCompleted, { backgroundColor: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }]}>
            <X size={14} color="#ef4444" />
            <Text style={[s.actionBtnTxt, { color: '#ef4444' }]}>CANCELLED</Text>
          </View>
        )}

      </View>
    </View>
  );
};

// ─── Dashboard Screen ─────────────────────────────────────────────────────────
export default function DriverDashboardScreen() {
  const router  = useRouter();
  const colors  = useThemeColor();
  const { trips, isLoading, activeTrip, geo, toast, fetchTrips } = useDriverContext();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  };

  // Stats
  const total     = trips.length;
  const scheduled = trips.filter(t => t.status === 'scheduled').length;
  const active    = trips.filter(t => t.status === 'active' || t.status === 'in-progress' || t.status === 'in_progress').length;
  const completed = trips.filter(t => t.status === 'completed').length;

  if (isLoading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[s.loadingTxt, { color: colors.icon }]}>Loading Trips...</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      <TopBar
        title="Dashboard"
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(driver)/settings' as any)}
      />

      {/* Toast */}
      {toast && (
        <View style={[
          s.toast,
          { backgroundColor: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor:      toast.type === 'success' ? 'rgba(34,197,94,0.4)'  : 'rgba(239,68,68,0.4)' },
        ]}>
          <Text style={[s.toastTxt, { color: toast.type === 'success' ? '#22c55e' : '#ef4444' }]}>
            {toast.msg.toUpperCase()}
          </Text>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
      >

        {/* Header */}
        <View style={s.pageHeader}>
          <View style={[s.pageIconWrap, { backgroundColor: 'rgba(247,160,27,0.1)', borderColor: 'rgba(247,160,27,0.2)' }]}>
            <Bus size={22} color="#f7a01b" />
          </View>
          <View>
            <Text style={[s.pageTitle, { color: colors.text }]}>
              DRIVER{' '}
              <Text style={{ color: colors.tint }}>DASHBOARD</Text>
            </Text>
            <Text style={[s.pageSubtitle, { color: colors.icon }]}>COMMAND CENTER</Text>
          </View>
        </View>

        {/* GPS Live Status Bar */}
        {activeTrip && (
          <View style={[s.gpsStatusBar, { backgroundColor: colors.card, borderColor: 'rgba(34,197,94,0.25)' }]}>
            <View style={s.gpsPulseDot}>
              <View style={s.gpsPulseRing} />
              <View style={s.gpsDot} />
            </View>
            <Text style={s.gpsBroadcastTxt}>GPS BROADCASTING LIVE</Text>
            <View style={{ flex: 1 }} />
            {geo.error ? (
              <Text style={s.gpsErrorTxt}>⚠ {geo.error}</Text>
            ) : geo.lat !== null ? (
              <TouchableOpacity onPress={() => router.push('/(driver)/live-tracking' as any)}>
                <View style={s.gpsViewMapBtn}>
                  <Navigation size={11} color="#22c55e" />
                  <Text style={s.gpsViewMapTxt}>VIEW MAP</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <Text style={[s.gpsAcquiringTxt, { color: colors.icon }]}>Acquiring GPS…</Text>
            )}
          </View>
        )}

        {/* Stats Row */}
        <View style={s.statsRow}>
          {[
            { label: 'TOTAL',     value: total,     color: colors.tint,  bg: `${colors.tint}1A` },
            { label: 'SCHEDULED', value: scheduled, color: '#60a5fa',    bg: 'rgba(96,165,250,0.1)' },
            { label: 'ACTIVE',    value: active,    color: '#22c55e',    bg: 'rgba(34,197,94,0.1)' },
            { label: 'DONE',      value: completed, color: '#f7a01b',    bg: 'rgba(247,160,27,0.1)' },
          ].map(st => (
            <View key={st.label} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.statLabel, { color: colors.icon }]}>{st.label}</Text>
              <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
            </View>
          ))}
        </View>

        {/* Section Title */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>
            MY <Text style={{ color: colors.tint }}>TRIPS</Text>
          </Text>
          <View style={[s.sectionDivider, { backgroundColor: colors.border }]} />
          <Text style={[s.sectionCount, { color: colors.icon }]}>
            <Text style={{ color: colors.text }}>{trips.length}</Text> ASSIGNED
          </Text>
        </View>

        {/* Trip Cards */}
        {trips.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Bus size={48} color={colors.tint} style={{ marginBottom: 14, opacity: 0.5 }} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>No Upcoming Trips</Text>
            <Text style={[s.emptyDesc, { color: colors.icon }]}>Contact your admin to get assigned trips.</Text>
          </View>
        ) : (
          trips.map(trip => (
            <TripCard key={trip._id} trip={trip} colors={colors} />
          ))
        )}

        {/* System Status */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.systemRow}>
            <View style={[s.systemIcon, { backgroundColor: `${colors.tint}1A` }]}>
              <Shield size={16} color={colors.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.systemSub, { color: colors.icon }]}>SYSTEM STATUS</Text>
              <Text style={[s.systemTitle, { color: colors.text }]}>All Operations Normal</Text>
            </View>
            <View style={s.pulseDot} />
          </View>
          <Text style={[s.systemNote, { color: colors.icon }]}>
            GPS broadcasts automatically every{' '}
            <Text style={{ color: colors.tint, fontWeight: '800' }}>30 seconds</Text>{' '}
            while your trip is active.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:       { flex: 1 },
  scroll:     { padding: 20, paddingTop: 16 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },

  // Toast
  toast:    { marginHorizontal: 16, marginTop: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
  toastTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' },

  // Page header
  pageHeader:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  pageIconWrap: { width: 48, height: 48, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pageTitle:    { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 9, fontWeight: '700', letterSpacing: 4, marginTop: 2 },

  // GPS bar (top level)
  gpsStatusBar:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  gpsBroadcastTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 2, color: '#22c55e' },
  gpsErrorTxt:   { fontSize: 9, fontWeight: '700', color: '#ef4444' },
  gpsAcquiringTxt: { fontSize: 9, fontWeight: '700' },
  gpsViewMapBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  gpsViewMapTxt: { fontSize: 9, fontWeight: '800', color: '#22c55e', letterSpacing: 1 },

  // GPS pulse dot
  gpsPulseDot: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  gpsPulseRing:{ position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(34,197,94,0.3)' },
  gpsDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },

  // Stats
  statsRow:  { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard:  { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 7, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center' },
  statValue: { fontSize: 22, fontWeight: '900' },

  // Section header
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionTitle:   { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  sectionDivider: { flex: 1, height: 1 },
  sectionCount:   { fontSize: 9, fontWeight: '700', letterSpacing: 2 },

  // Trip Card
  tripCard:      { borderWidth: 1, borderRadius: 28, overflow: 'hidden', marginBottom: 16 },
  tripCardInner: { padding: 20, gap: 16 },
  activeAccentBar: { height: 3, backgroundColor: '#22c55e' },

  tripCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tripIconWrap:   { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tripRouteName:  { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  tripStopsLine:  { fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusTxt:   { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

  // Info rows
  infoBlock:  { borderWidth: 1, borderRadius: 16, overflow: 'hidden', borderColor: 'transparent' },
  infoRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  infoLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel:  { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  infoValue:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', maxWidth: '55%' },

  // Stops
  stopsBlock:   { paddingTop: 14, borderTopWidth: 1, gap: 10 },
  stopsLabelRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  stopsLabel:   { fontSize: 9, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  stopsList:    { paddingLeft: 16, gap: 8, position: 'relative' },
  stopsLine:    { position: 'absolute', left: 19, top: 8, bottom: 8, width: 1 },
  stopRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stopDot:      { width: 8, height: 8, borderRadius: 4, borderWidth: 2, marginLeft: -4 },
  stopName:     { fontSize: 10, fontWeight: '700', flex: 1 },
  stopTag:      { fontSize: 8, fontWeight: '900', color: '#f7a01b', letterSpacing: 1.5 },

  // GPS bar inside card
  gpsBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },

  // Action buttons
  actionBlock:         { gap: 6 },
  actionBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 18, borderWidth: 1, borderColor: 'transparent' },
  actionBtnStart:      { backgroundColor: '#f7a01b' },
  actionBtnDisabled:   { opacity: 0.5 },
  actionBtnEnd:        { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' },
  actionBtnCompleted:  {},
  actionBtnTxt:        { fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  actionHint:          { fontSize: 9, fontWeight: '700', textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase' },

  // Generic card
  card: { borderWidth: 1, borderRadius: 24, padding: 18, marginBottom: 14 },

  // System Status
  systemRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  systemIcon:  { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  systemSub:   { fontSize: 9, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 },
  systemTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  systemNote:  { fontSize: 10, lineHeight: 16 },
  pulseDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },

  // Empty
  emptyCard:  { borderWidth: 1, borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  emptyDesc:  { fontSize: 11, textAlign: 'center', lineHeight: 18 },
});