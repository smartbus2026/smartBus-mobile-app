import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bus, Calendar, CheckCircle, Bell,
  MapPin, ArrowRight, LogOut, Route,
  Shield, X,
} from 'lucide-react-native';
import Api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useThemeColor } from '../../constants/theme';
import TopBar from '../../src/components/TopBar';

const SLOT_MAP: Record<string, string> = {
  morning:     'Morning',
  return_1530: '3:30 PM',
  return_1900: '7:00 PM',
};

const StatCard = ({
  label, value, icon, color, bg, colors,
}: {
  label: string; value: string; icon: React.ReactNode;
  color: string; bg: string; colors: any;
}) => (
  <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={s.statCardTop}>
      <Text style={[s.statLabel, { color: colors.icon }]}>{label}</Text>
      <View style={[s.statIconWrap, { backgroundColor: bg }]}>
        {icon}
      </View>
    </View>
    <Text style={[s.statValue, { color }]}>{value}</Text>
  </View>
);

const DetailItem = ({
  label, value, highlight, colors,
}: {
  label: string; value: string; highlight?: boolean; colors: any;
}) => (
  <View style={s.detailItem}>
    <Text style={[s.detailLabel, { color: colors.icon }]}>{label}</Text>
    <Text style={[s.detailValue, { color: highlight ? colors.tint : colors.text }]}>{value}</Text>
  </View>
);

export default function DashboardScreen() {
  const router       = useRouter();
  const { logout }   = useAuth();
  const colors       = useThemeColor();

  const [bookings, setBookings]     = useState<any[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser]             = useState({ name: '...', initials: '?' });

  const fetchData = async () => {
    try {
      const [bookRes, profileRes] = await Promise.all([
        Api.get('/bookings/my'),
        Api.get('/users/profile').catch(() => null),
      ]);
      const data = bookRes.data?.data?.bookings || bookRes.data?.data || bookRes.data || [];
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

  const todayStr = new Date().toDateString();
  const activeTrips = bookings
    .filter(b => b.date && new Date(b.date).toDateString() === todayStr && (b.status === 'pending' || b.status === 'assigned'))
    .slice(0, 2);

  const stats = [
    { label: 'Total Demands', value: String(bookings.length),                                                                          icon: <Route size={16} color="#f7a01b" />,   color: colors.tint,  bg: `${colors.tint}1A` },
    { label: 'Assigned',      value: String(bookings.filter(b => b.status === 'assigned' || b.status === 'active').length),            icon: <CheckCircle size={16} color="#22c55e" />, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { label: 'Pending',       value: String(bookings.filter(b => b.status === 'pending').length),                                      icon: <Calendar size={16} color="#60a5fa" />,    color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    { label: 'Cancelled',     value: String(bookings.filter(b => b.status === 'cancelled').length),                                    icon: <X size={16} color="#ef4444" />,           color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  ];

  const quickActions = [
    { label: 'Book Trip',     Icon: Bus,         route: '/(student)/book-trip' },
    { label: 'My Trips',      Icon: Calendar,    route: '/(student)/my-trips' },
    { label: 'Attendance',    Icon: CheckCircle, route: '/(student)/attendance' },
    { label: 'Notifications', Icon: Bell,        route: '/(student)/notifications' },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'active' || status === 'assigned')
      return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  text: '#22c55e' };
    if (status === 'pending')
      return { bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)', text: '#60a5fa' };
    if (status === 'cancelled')
      return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  text: '#ef4444' };
    return   { bg: 'rgba(247,160,27,0.1)', border: 'rgba(247,160,27,0.2)', text: colors.tint };
  };

  if (isLoading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[s.loadingTxt, { color: colors.icon }]}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      <TopBar
        title="Dashboard"
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(student)/settings' as any)}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
      >

        {/* Welcome */}
        <View style={s.welcome}>
          <View>
            <Text style={[s.welcomeSub, { color: colors.icon }]}>STUDENT PORTAL</Text>
            <Text style={[s.welcomeName, { color: colors.text }]}>
              Hey, <Text style={{ color: colors.tint }}>{user.name.split(' ')[0]}</Text> 👋
            </Text>
          </View>
          <View style={[s.avatarCircle, { backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}4D` }]}>
            <Text style={[s.avatarTxt, { color: colors.tint }]}>{user.initials}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {stats.map(st => <StatCard key={st.label} {...st} colors={colors} />)}
        </View>

        {/* Active Trips */}
        {activeTrips.length > 0 ? (
          activeTrips.map(trip => {
            const sc = getStatusColor(trip.status);
            return (
              <View key={trip._id} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.cardHeaderRow}>
                  <View style={[s.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                    <Text style={[s.statusTxt, { color: sc.text }]}>{trip.status?.toUpperCase()}</Text>
                  </View>
                  <Text style={[s.cardTitle, { color: colors.text }]} numberOfLines={1}>
                    {trip.route?.name || 'Selected Route'}
                  </Text>
                </View>

                <View style={s.detailsGrid}>
                  <DetailItem label="Date"      value={trip.date ? new Date(trip.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBA'} colors={colors} />
                  <DetailItem label="Time Slot" value={(trip.timeSlot === 'Return' && trip.specificReturnTime) ? `${trip.specificReturnTime} (Return)` : (trip.timeSlot || 'TBA')} highlight colors={colors} />
                  <DetailItem label="Status"    value={trip.status || 'pending'} colors={colors} />
                  <DetailItem label="Route"     value={trip.route?.name || 'TBA'} colors={colors} />
                </View>

                {trip.status === 'assigned' && (
                  <TouchableOpacity
                    style={[s.trackBtn, { borderColor: colors.border }]}
                    onPress={() => router.push('/(student)/track-bus')}
                  >
                    <MapPin size={14} color={colors.icon} />
                    <Text style={[s.trackTxt, { color: colors.icon }]}>Track Live</Text>
                    <ArrowRight size={14} color={colors.icon} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        ) : (
          <View style={[s.card, s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Bus size={40} color={colors.tint} style={{ marginBottom: 12 }} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>No Active Trips</Text>
            <Text style={[s.emptyDesc, { color: colors.icon }]}>
              You don't have any active trips for today. Book a seat to see it here.
            </Text>
            <TouchableOpacity
              style={[s.bookBtn, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/(student)/book-trip')}
            >
              <Text style={s.bookBtnTxt}>+ Book a Trip</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Bookings */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.cardHeaderRow}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => router.push('/(student)/my-trips')}>
              <Text style={[s.viewAll, { color: colors.tint }]}>View All →</Text>
            </TouchableOpacity>
          </View>

          {bookings.length === 0 ? (
            <Text style={[s.emptyDesc, { color: colors.icon }]}>No bookings yet</Text>
          ) : (
            bookings.slice(0, 4).map(b => {
              const sc = getStatusColor(b.status);
              return (
                <View key={b._id} style={[s.bookingRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.bookingRoute, { color: colors.text }]}>{b.route?.name || 'Unknown Route'}</Text>
                    <Text style={[s.bookingMeta, { color: colors.icon }]}>
                      {(b.timeSlot === 'Return' && b.specificReturnTime) ? `${b.specificReturnTime} (Return)` : b.timeSlot}
                      {b.date ? ` · ${new Date(b.date).toLocaleDateString('en-GB')}` : ''}
                    </Text>
                  </View>
                  <View style={s.bookingRight}>
                    <Text style={[s.bookingSeat, { color: colors.text }]}>—</Text>
                    <View style={[s.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                      <Text style={[s.statusTxt, { color: sc.text }]}>{b.status?.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Quick Actions */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={s.actionsGrid}>
            {quickActions.map(a => (
              <TouchableOpacity
                key={a.label}
                style={[s.actionBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => router.push(a.route as any)}
                activeOpacity={0.8}
              >
                <a.Icon size={26} color={colors.tint} />
                <Text style={[s.actionLabel, { color: colors.text }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* System Status */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.systemStatusRow}>
            <View style={[s.statusIconWrap, { backgroundColor: `${colors.tint}1A` }]}>
              <Shield size={16} color={colors.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.systemStatusSub, { color: colors.icon }]}>System Status</Text>
              <Text style={[s.systemStatusTitle, { color: colors.text }]}>All Operations Normal</Text>
            </View>
            <View style={s.pulseDot} />
          </View>
          <Text style={[s.systemStatusNote, { color: colors.icon }]}>
            Ensure you book your return trip before the{' '}
            <Text style={{ color: colors.tint, fontWeight: '800' }}>1:00 PM</Text> deadline daily.
          </Text>
        </View>

        {/* Book New Trip */}
        <TouchableOpacity
          style={[s.bookNewBtn, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/(student)/book-trip')}
          activeOpacity={0.85}
        >
          <Bus size={18} color="#000" />
          <Text style={s.bookNewTxt}>Book New Trip</Text>
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity style={[s.logoutBtn, { borderColor: 'rgba(239,68,68,0.2)' }]} onPress={logout}>
          <LogOut size={16} color="#ef4444" />
          <Text style={s.logoutTxt}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1 },
  scroll:           { padding: 20, paddingTop: 16 },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:       { fontSize: 11, fontWeight: '700', letterSpacing: 2 },

  welcome:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  welcomeSub:       { fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 4 },
  welcomeName:      { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  avatarCircle:     { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:        { fontSize: 15, fontWeight: '800' },

  statsRow:         { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard:         { flex: 1, borderWidth: 1, borderRadius: 18, padding: 12 },
  statCardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  statLabel:        { fontSize: 8, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', flex: 1 },
  statIconWrap:     { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue:        { fontSize: 22, fontWeight: '800' },

  card:             { borderWidth: 1, borderRadius: 24, padding: 18, marginBottom: 14 },
  cardHeaderRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardTitle:        { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', flex: 1 },
  sectionTitle:     { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, flex: 1 },
  viewAll:          { fontSize: 11, fontWeight: '700' },

  statusBadge:      { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  statusTxt:        { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  detailsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 14 },
  detailItem:       { minWidth: '42%' },
  detailLabel:      { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 },
  detailValue:      { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },

  trackBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 14, paddingVertical: 12 },
  trackTxt:         { fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  emptyCard:        { alignItems: 'center', paddingVertical: 28 },
  emptyTitle:       { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  emptyDesc:        { fontSize: 11, textAlign: 'center', marginBottom: 4 },

  bookBtn:          { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, marginTop: 12 },
  bookBtnTxt:       { color: '#000', fontWeight: '700', fontSize: 13 },

  bookingRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  bookingRoute:     { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  bookingMeta:      { fontSize: 10, fontWeight: '500', textTransform: 'uppercase' },
  bookingRight:     { alignItems: 'flex-end', gap: 6 },
  bookingSeat:      { fontSize: 12, fontWeight: '800' },

  actionsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  actionBtn:        { width: '47%', borderWidth: 1, borderRadius: 18, padding: 16, alignItems: 'center', gap: 8 },
  actionLabel:      { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },

  systemStatusRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  statusIconWrap:   { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  systemStatusSub:  { fontSize: 9, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 },
  systemStatusTitle:{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  systemStatusNote: { fontSize: 10, lineHeight: 16 },
  pulseDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },

  bookNewBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 20, paddingVertical: 18, marginBottom: 12 },
  bookNewTxt:       { color: '#000', fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 },

  logoutBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 18, paddingVertical: 14 },
  logoutTxt:        { color: '#ef4444', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
});