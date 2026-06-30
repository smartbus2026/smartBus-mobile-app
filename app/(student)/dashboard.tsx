import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bus, Calendar, CheckCircle, Bell,
  MapPin, ArrowRight, LogOut, Route,
  Shield, X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useThemeColor } from '../../constants/theme';
import TopBar from '../../src/components/TopBar';

const { width } = Dimensions.get('window');
const cardWidth = (width - 40 - 12) / 2;

const StatCard = ({
  label, value, icon, color, bg, colors,
}: {
  label: string; value: string; icon: React.ReactNode;
  color: string; bg: string; colors: any;
}) => (
  <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={s.statCardTop}>
      <Text style={[s.statLabel, { color: colors.icon }]} numberOfLines={1}>{label}</Text>
      <View style={[s.statIconWrap, { backgroundColor: bg }]}>{icon}</View>
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
  const router     = useRouter();
  const { logout } = useAuth();
  const colors     = useThemeColor();
  const { t }      = useTranslation();

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
        setUser({ name: u.name || t('student'), initials });
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

  const todayStr   = new Date().toDateString();
  const activeTrips = bookings
    .filter(b => b.date && new Date(b.date).toDateString() === todayStr && (b.status === 'pending' || b.status === 'assigned'))
    .slice(0, 2);

  const stats = [
    { label: t('total_demands'),  value: String(bookings.length),                                                                                                                                                                       icon: <Route size={16} color="#f7a01b" />,       color: colors.tint,  bg: `${colors.tint}1A` },
    { label: t('assigned'),       value: String(bookings.filter(b => b.status === 'assigned' || b.status === 'active' || b.status === 'in-progress' || b.status === 'in_progress').length), icon: <CheckCircle size={16} color="#22c55e" />, color: '#22c55e',    bg: 'rgba(34,197,94,0.1)' },
    { label: t('pending'),        value: String(bookings.filter(b => b.status === 'pending').length),                                                                                                                                    icon: <Calendar size={16} color="#60a5fa" />,    color: '#60a5fa',   bg: 'rgba(96,165,250,0.1)' },
    { label: t('cancelled'),      value: String(bookings.filter(b => b.status === 'cancelled').length),                                                                                                                                  icon: <X size={16} color="#ef4444" />,           color: '#ef4444',   bg: 'rgba(239,68,68,0.1)' },
  ];

  const quickActions = [
    { label: t('book_new_trip'),  Icon: Bus,      route: '/(student)/book-trip',     color: colors.tint, bg: `${colors.tint}1A` },
    { label: t('route_details'),  Icon: MapPin,   route: '/(student)/route-details', color: '#22c55e',   bg: 'rgba(34,197,94,0.1)' },
    { label: t('nav_myTrips'),    Icon: Calendar, route: '/(student)/my-trips',      color: '#60a5fa',   bg: 'rgba(96,165,250,0.1)' },
    { label: t('notifications'),  Icon: Bell,     route: '/(student)/notifications', color: '#ef4444',   bg: 'rgba(239,68,68,0.1)' },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'active' || status === 'assigned' || status === 'in_progress')
      return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  text: '#22c55e' };
    if (status === 'pending')
      return { bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)', text: '#60a5fa' };
    if (status === 'cancelled' || status === 'missed')
      return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  text: '#ef4444' };
    return   { bg: 'rgba(247,160,27,0.1)', border: 'rgba(247,160,27,0.2)', text: colors.tint };
  };

  const formatTimeSlot = (trip: any) => {
    if (trip.timeSlot === 'Return' && trip.specificReturnTime) {
      return `${trip.specificReturnTime} (${t('return')})`;
    }
    return trip.timeSlot || 'TBA';
  };

  if (isLoading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[s.loadingTxt, { color: colors.icon }]}>{t('loading_dashboard').toUpperCase()}</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      <TopBar
        title={t('nav_dashboard')}
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
            <Text style={[s.welcomeSub, { color: colors.icon }]}>{t('student_portal').toUpperCase()}</Text>
            <Text style={[s.welcomeName, { color: colors.text }]}>
              {t('hey')}, <Text style={{ color: colors.tint }}>{user.name.split(' ')[0]}</Text>
            </Text>
          </View>
          <View style={[s.avatarCircle, { backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}4D` }]}>
            <Text style={[s.avatarTxt, { color: colors.tint }]}>{user.initials}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={s.statsRow}>
          {stats.map(st => <StatCard key={st.label} {...st} colors={colors} />)}
        </View>

        {/* Active Trips */}
        {activeTrips.length > 0 ? (
          activeTrips.map(trip => {
            const sc = getStatusColor(trip.status);
            return (
              <View key={trip._id} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 0, overflow: 'hidden' }]}>
                <View style={[s.cardHeaderRow, { backgroundColor: `${colors.tint}0A`, borderBottomWidth: 1, borderBottomColor: colors.border, padding: 16, marginBottom: 0 }]}>
                  <View style={[s.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                    <Text style={[s.statusTxt, { color: sc.text }]}>{trip.status?.toUpperCase()}</Text>
                  </View>
                  <Text style={[s.cardTitle, { color: colors.text }]} numberOfLines={1}>
                    {trip.route?.name || t('selected_route').toUpperCase()}
                  </Text>
                </View>
                <View style={[s.detailsGrid, { padding: 16, marginBottom: 0 }]}>
                  <DetailItem label={t('date')}      value={trip.date ? new Date(trip.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBA'} colors={colors} />
                  <DetailItem label={t('time_slot')} value={formatTimeSlot(trip)} highlight colors={colors} />
                  <DetailItem label={t('status')}    value={trip.status || 'pending'} colors={colors} />
                  <DetailItem label={t('route')}     value={trip.route?.name || 'TBA'} colors={colors} />
                </View>
                {trip.status === 'assigned' && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <TouchableOpacity
                      style={[s.trackBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                      onPress={() => router.push('/(student)/track-bus')}
                    >
                      <MapPin size={12} color={colors.icon} />
                      <Text style={[s.trackTxt, { color: colors.icon }]}>{t('track_live').toUpperCase()}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={[s.card, s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.emptyIconWrap, { backgroundColor: colors.background }]}>
              <Bus size={28} color={colors.icon} style={{ opacity: 0.6 }} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.text }]}>{t('no_active_trips').toUpperCase()}</Text>
            <Text style={[s.emptyDesc, { color: colors.icon }]}>{t('no_active_trips_desc')}</Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.icon }]}>{t('quick_actions').toUpperCase()}</Text>
          </View>
          <View style={s.actionsList}>
            {quickActions.map(a => (
              <TouchableOpacity
                key={a.label}
                style={[s.actionRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => router.push(a.route as any)}
                activeOpacity={0.7}
              >
                <View style={[s.actionIconWrap, { backgroundColor: a.bg }]}>
                  <a.Icon size={18} color={a.color} />
                </View>
                <Text style={[s.actionLabel, { color: colors.text }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* System Status */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.systemStatusRow, { borderBottomColor: colors.border }]}>
            <View style={[s.statusIconWrap, { backgroundColor: `${colors.tint}1A` }]}>
              <Shield size={16} color={colors.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.systemStatusSub,   { color: colors.icon }]}>{t('system_status').toUpperCase()}</Text>
              <Text style={[s.systemStatusTitle, { color: colors.text }]}>{t('all_operations_normal').toUpperCase()}</Text>
            </View>
            <View style={s.pulseDot} />
          </View>
          <Text style={[s.systemStatusNote, { color: colors.icon }]}>{t('system_status_note')}</Text>
        </View>

        {/* Book New */}
        <TouchableOpacity
          style={[s.bookNewBtn, { backgroundColor: colors.tint, shadowColor: colors.tint }]}
          onPress={() => router.push('/(student)/book-trip')}
          activeOpacity={0.85}
        >
          <Bus size={14} color="#000" />
          <Text style={s.bookNewTxt}>{t('book_new_trip').toUpperCase()}</Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1 },
  scroll:            { padding: 20, paddingTop: 16 },
  center:            { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:        { fontSize: 10, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
  welcome:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  welcomeSub:        { fontSize: 9, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 },
  welcomeName:       { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, textTransform: 'uppercase' },
  avatarCircle:      { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:         { fontSize: 15, fontWeight: '900' },
  statsRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard:          { width: cardWidth, borderWidth: 1, borderRadius: 16, padding: 16 },
  statCardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  statLabel:         { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', flex: 1, marginRight: 8 },
  statIconWrap:      { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue:         { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  card:              { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 16 },
  cardHeaderRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle:         { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  sectionHeader:     { borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.2)', paddingBottom: 12, marginBottom: 12 },
  sectionTitle:      { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  statusBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusTxt:         { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  detailsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  detailItem:        { minWidth: '42%' },
  detailLabel:       { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  detailValue:       { fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  trackBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 10 },
  trackTxt:          { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  emptyCard:         { alignItems: 'center', paddingVertical: 32, borderStyle: 'dashed' },
  emptyIconWrap:     { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:        { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  emptyDesc:         { fontSize: 10, textAlign: 'center', fontWeight: '700', lineHeight: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionsList:       { gap: 8 },
  actionRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12 },
  actionIconWrap:    { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionLabel:       { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
  systemStatusRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, paddingBottom: 12, marginBottom: 12 },
  statusIconWrap:    { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  systemStatusSub:   { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  systemStatusTitle: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  systemStatusNote:  { fontSize: 10, fontWeight: '500', lineHeight: 16 },
  pulseDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  bookNewBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 16, marginBottom: 12, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  bookNewTxt:        { color: '#000', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 },
  logoutBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 16, paddingVertical: 14 },
  logoutTxt:         { color: '#ef4444', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
});