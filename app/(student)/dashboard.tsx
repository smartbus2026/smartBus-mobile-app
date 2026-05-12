import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import Api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────
const SLOT_MAP: Record<string, string> = {
  morning: 'Morning',
  return_1530: '3:30 PM',
  return_1900: '7:00 PM',
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <View style={s.statCard}>
    <Text style={s.statLabel}>{label}</Text>
    <Text style={[s.statValue, { color }]}>{value}</Text>
  </View>
);

// ── Detail Item ───────────────────────────────────────────────────────────────
const DetailItem = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <View style={s.detailItem}>
    <Text style={s.detailLabel}>{label}</Text>
    <Text style={[s.detailValue, highlight && { color: C.am }]}>{value}</Text>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState({ name: '...', initials: '?' });

  const fetchData = async () => {
    try {
      const [bookRes, profileRes] = await Promise.all([
        Api.get('/bookings/my'),
        Api.get('/users/profile').catch(() => null),
      ]);
      const data = bookRes.data?.data?.bookings || [];
      setBookings(Array.isArray(data) ? data : []);
      if (profileRes) {
        const u = profileRes.data;
        const initials = (u.name || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
        setUser({ name: u.name || 'Student', initials });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const nextBooking = bookings.find(b => {
    const d = b.trip?.date ? new Date(b.trip.date) : null;
    return d && d >= today && b.status !== 'cancelled';
  }) || null;

  const stats = [
    { label: 'Total',     value: bookings.length,                                                                         color: C.am },
    { label: 'Active',    value: bookings.filter(b => b.status === 'active').length,                                      color: C.ok },
    { label: 'Upcoming',  value: bookings.filter(b => { const d = b.trip?.date ? new Date(b.trip.date) : null; return d && d >= today && b.status !== 'cancelled'; }).length, color: '#60a5fa' },
    { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length,                                   color: C.err },
  ];

  const quickActions = [
    { label: 'Book Trip',     icon: '🚌', route: '/(student)/book-trip' },
    { label: 'My Trips',      icon: '📅', route: '/(student)/my-trips' },
    { label: 'Attendance',    icon: '✅', route: '/(student)/attendance' },
    { label: 'Notifications', icon: '🔔', route: '/(student)/notifications' },
  ];

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#f7a01b" />
        <Text style={s.loadingTxt}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f7a01b" />}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>STUDENT PORTAL</Text>
          <Text style={s.headerTitle}>
            My <Text style={s.accent}>Dashboard</Text>
          </Text>
        </View>
        <View style={s.avatarCircle}>
          <Text style={s.avatarTxt}>{user.initials}</Text>
        </View>
      </View>

      {/* ── Stats ── */}
      <View style={s.statsRow}>
        {stats.map(st => <StatCard key={st.label} {...st} />)}
      </View>

      {/* ── Next Trip ── */}
      {nextBooking ? (
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={[s.statusBadge, {
              backgroundColor: nextBooking.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(247,160,27,0.1)',
              borderColor: nextBooking.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(247,160,27,0.2)',
            }]}>
              <Text style={[s.statusTxt, { color: nextBooking.status === 'active' ? C.ok : C.am }]}>
                {nextBooking.status?.toUpperCase()}
              </Text>
            </View>
            <Text style={s.cardTitle} numberOfLines={1}>
              {nextBooking.trip?.route?.name || 'Selected Route'}
            </Text>
          </View>

          <View style={s.detailsGrid}>
            <DetailItem
              label="Date"
              value={nextBooking.trip?.date
                ? new Date(nextBooking.trip.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                : 'TBA'}
            />
            <DetailItem
              label="Time"
              value={SLOT_MAP[nextBooking.trip?.time_slot] || nextBooking.trip?.time_slot || 'TBA'}
              highlight
            />
            <DetailItem label="Seat" value={`#${nextBooking.seat_number || '0'}`} />
            <DetailItem label="Bus" value="Standard" />
          </View>

          <TouchableOpacity
            style={s.trackBtn}
            onPress={() => router.push('/(student)/track-bus')}
          >
            <Text style={s.trackTxt}>Track Live →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[s.card, s.emptyCard]}>
          <Text style={s.emptyIcon}>🚌</Text>
          <Text style={s.emptyTitle}>No Active Trips</Text>
          <Text style={s.emptyDesc}>You don't have any upcoming trips.</Text>
          <TouchableOpacity style={s.bookBtn} onPress={() => router.push('/(student)/book-trip')}>
            <Text style={s.bookBtnTxt}>+ Book a Trip</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Recent Bookings ── */}
      <View style={s.card}>
        <View style={s.cardHeaderRow}>
          <Text style={s.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => router.push('/(student)/my-trips')}>
            <Text style={s.viewAll}>View All →</Text>
          </TouchableOpacity>
        </View>

        {bookings.length === 0 ? (
          <Text style={s.emptyDesc}>No bookings yet</Text>
        ) : (
          bookings.slice(0, 4).map(b => (
            <View key={b._id} style={s.bookingRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.bookingRoute}>{b.trip?.route?.name || 'Unknown Route'}</Text>
                <Text style={s.bookingMeta}>
                  {SLOT_MAP[b.trip?.time_slot] || b.trip?.time_slot || '—'}
                  {b.trip?.date ? ` · ${new Date(b.trip.date).toLocaleDateString('en-GB')}` : ''}
                </Text>
              </View>
              <View style={s.bookingRight}>
                <Text style={s.bookingSeat}>#{b.seat_number || '—'}</Text>
                <View style={[s.statusBadge, {
                  backgroundColor: b.status === 'active' ? 'rgba(34,197,94,0.1)' :
                    b.status === 'cancelled' ? 'rgba(239,68,68,0.1)' : 'rgba(247,160,27,0.1)',
                  borderColor: b.status === 'active' ? 'rgba(34,197,94,0.2)' :
                    b.status === 'cancelled' ? 'rgba(239,68,68,0.2)' : 'rgba(247,160,27,0.2)',
                }]}>
                  <Text style={[s.statusTxt, {
                    color: b.status === 'active' ? C.ok : b.status === 'cancelled' ? C.err : C.am
                  }]}>
                    {b.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ── Quick Actions ── */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          {quickActions.map(a => (
            <TouchableOpacity
              key={a.label}
              style={s.actionBtn}
              onPress={() => router.push(a.route as any)}
              activeOpacity={0.8}
            >
              <Text style={s.actionIcon}>{a.icon}</Text>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Book New Trip CTA ── */}
      <TouchableOpacity
        style={s.bookNewBtn}
        onPress={() => router.push('/(student)/book-trip')}
        activeOpacity={0.85}
      >
        <Text style={s.bookNewTxt}>🚌  Book New Trip</Text>
      </TouchableOpacity>

      {/* ── Sign Out ── */}
      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Text style={s.logoutTxt}>Sign Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const C = {
  bg: '#0f1115', card: '#1c1e26', card2: '#262a33',
  border: '#2d3036', am: '#f7a01b', mu: '#8a8d91',
  mu2: '#555', ok: '#22c55e', err: '#ef4444', white: '#ffffff',
};

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },
  scroll:         { padding: 20, paddingBottom: 48 },
  center:         { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:     { color: C.mu, fontSize: 11, fontWeight: '700', letterSpacing: 2 },

  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerSub:      { fontSize: 9, color: C.mu, fontWeight: '700', letterSpacing: 3, marginBottom: 4 },
  headerTitle:    { fontSize: 26, fontWeight: '800', color: C.white, letterSpacing: -0.5 },
  accent:         { color: C.am },
  avatarCircle:   { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(247,160,27,0.1)', borderWidth: 1, borderColor: 'rgba(247,160,27,0.3)', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:      { fontSize: 15, fontWeight: '800', color: C.am },

  statsRow:       { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:       { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, alignItems: 'center' },
  statLabel:      { fontSize: 9, color: C.mu, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  statValue:      { fontSize: 22, fontWeight: '800' },

  card:           { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 24, padding: 18, marginBottom: 14 },
  cardHeaderRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardTitle:      { fontSize: 13, fontWeight: '700', color: C.white, textTransform: 'uppercase', flex: 1 },
  sectionTitle:   { fontSize: 11, fontWeight: '800', color: C.white, textTransform: 'uppercase', letterSpacing: 1.5, flex: 1 },
  viewAll:        { fontSize: 11, color: C.am, fontWeight: '700' },

  statusBadge:    { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  statusTxt:      { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  detailsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 14 },
  detailItem:     { minWidth: '42%' },
  detailLabel:    { fontSize: 9, color: C.mu, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 },
  detailValue:    { fontSize: 13, fontWeight: '700', color: C.white, textTransform: 'uppercase' },

  trackBtn:       { borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  trackTxt:       { color: C.mu, fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  emptyCard:      { alignItems: 'center', paddingVertical: 28 },
  emptyIcon:      { fontSize: 36, marginBottom: 12 },
  emptyTitle:     { fontSize: 13, fontWeight: '800', color: C.white, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  emptyDesc:      { fontSize: 11, color: C.mu, textAlign: 'center', marginBottom: 4 },

  bookBtn:        { backgroundColor: C.am, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, marginTop: 12 },
  bookBtnTxt:     { color: '#000', fontWeight: '700', fontSize: 13 },

  bookingRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  bookingRoute:   { fontSize: 13, fontWeight: '700', color: C.white, marginBottom: 3 },
  bookingMeta:    { fontSize: 10, color: C.mu, fontWeight: '500', textTransform: 'uppercase' },
  bookingRight:   { alignItems: 'flex-end', gap: 6 },
  bookingSeat:    { fontSize: 12, fontWeight: '800', color: C.white },

  actionsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  actionBtn:      { width: '47%', backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, alignItems: 'center', gap: 8 },
  actionIcon:     { fontSize: 26 },
  actionLabel:    { fontSize: 10, fontWeight: '700', color: C.white, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },

  bookNewBtn:     { backgroundColor: C.am, borderRadius: 20, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  bookNewTxt:     { color: '#000', fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 },

  logoutBtn:      { borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  logoutTxt:      { color: C.err, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
});