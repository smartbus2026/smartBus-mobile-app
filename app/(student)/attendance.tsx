import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Api from '../../src/services/api';
import { useThemeColor } from '../../constants/theme';
import TopBar from '../../src/components/TopBar';

interface BookingRecord {
  _id: string;
  attended: boolean;
  status: string;
  trip: {
    date: string;
    time_slot: string;
    route?: { name: string };
  };
}

const timeSlotMap: Record<string, string> = {
  morning:     'Morning',
  return_1530: '3:30 PM',
  return_1900: '7:00 PM',
};

export default function AttendancePage() {
  const colors = useThemeColor();
  const router = useRouter();
  const [bookings, setBookings]   = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await Api.get('/bookings/my');
        setBookings(res.data?.data?.bookings || []);
      } catch (err) {
        console.error('Failed to fetch bookings', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allBookings = bookings.filter(b => b.status !== 'cancelled');

  const todayBookings = allBookings.filter(b => {
    const d = new Date(b.trip?.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() && b.status !== 'completed' && b.status !== 'missed';
  });

  const pastBookings = allBookings.filter(b => {
    const d = new Date(b.trip?.date);
    d.setHours(0, 0, 0, 0);
    return d < today || b.status === 'completed' || b.status === 'missed';
  });

  const present = pastBookings.filter(b => b.attended).length;
  const missed  = pastBookings.filter(b => !b.attended).length;
  const total   = pastBookings.length;
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

  const groupedByDate: Record<string, BookingRecord[]> = {};
  pastBookings.forEach(b => {
    const key = new Date(b.trip?.date).toDateString();
    if (!groupedByDate[key]) groupedByDate[key] = [];
    groupedByDate[key].push(b);
  });
  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (isLoading) {
    return (
      <View style={[s.loadWrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[s.loadText, { color: colors.icon }]}>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      <TopBar
        title="Attendance"
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(student)/settings' as any)}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={s.statsRow}>
          {[
            { l: 'Total',   v: String(total),   color: colors.icon },
            { l: 'Present', v: String(present), color: '#22c55e' },
            { l: 'Missed',  v: String(missed),  color: '#ef4444' },
            { l: 'Rate',    v: `${pct}%`,       color: pct >= 75 ? '#22c55e' : '#ef4444' },
          ].map(item => (
            <View key={item.l} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.statLabel, { color: colors.icon }]}>{item.l}</Text>
              <Text style={[s.statValue, { color: item.color }]}>{item.v}</Text>
            </View>
          ))}
        </View>

        {/* Progress Bar */}
        <View style={[s.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.progressHeader}>
            <Text style={[s.progressLabel, { color: colors.icon }]}>ATTENDANCE RATE</Text>
            <Text style={[s.progressPct, { color: colors.tint }]}>{pct}%</Text>
          </View>
          <View style={[s.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[
              s.progressFill,
              { width: `${pct}%` as any, backgroundColor: pct >= 75 ? '#22c55e' : '#ef4444' }
            ]} />
          </View>
          <Text style={[s.progressHint, { color: colors.icon }]}>
            {pct >= 75 ? '✓ Good attendance, keep it up!' : '⚠ Your attendance is below 75%'}
          </Text>
        </View>

        {/* Today's Trips */}
        {todayBookings.length > 0 && (
          <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>TODAY'S TRIPS</Text>
            {todayBookings.map(b => (
              <View key={b._id} style={[s.tripRow, { backgroundColor: colors.background }]}>
                <View>
                  <Text style={[s.tripName, { color: colors.text }]}>{b.trip?.route?.name || '—'}</Text>
                  <Text style={[s.tripSlot, { color: colors.icon }]}>{timeSlotMap[b.trip?.time_slot] || b.trip?.time_slot}</Text>
                </View>
                {b.attended
                  ? <View style={[s.badge, s.badgeGreen]}><Text style={[s.badgeText, { color: '#22c55e' }]}>✓ Present</Text></View>
                  : <View style={[s.badge, s.badgeOrange]}><Text style={[s.badgeText, { color: colors.tint }]}>Pending</Text></View>
                }
              </View>
            ))}
          </View>
        )}

        {/* Trip History */}
        <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>TRIP HISTORY</Text>

          {sortedDates.length === 0 ? (
            <Text style={[s.emptyText, { color: colors.icon }]}>No past trips yet</Text>
          ) : (
            sortedDates.map(dateKey => (
              <View key={dateKey} style={s.dateGroup}>
                <View style={s.dateRow}>
                  <Text style={[s.dateText, { color: colors.tint }]}>{dateKey}</Text>
                  <View style={[s.dateLine, { backgroundColor: colors.border }]} />
                  <Text style={[s.dateCount, { color: colors.icon }]}>
                    {groupedByDate[dateKey].filter(b => b.attended).length}/{groupedByDate[dateKey].length} present
                  </Text>
                </View>

                {groupedByDate[dateKey].map(b => (
                  <View key={b._id} style={[s.historyRow, { backgroundColor: colors.background }]}>
                    <View style={s.historyLeft}>
                      <View style={[s.dot, { backgroundColor: b.attended ? '#22c55e' : '#ef4444' }]} />
                      <View>
                        <Text style={[s.tripName, { color: colors.text }]}>{b.trip?.route?.name || '—'}</Text>
                        <Text style={[s.tripSlot, { color: colors.icon }]}>{timeSlotMap[b.trip?.time_slot] || b.trip?.time_slot}</Text>
                      </View>
                    </View>
                    {b.attended
                      ? <View style={[s.badge, s.badgeGreen]}><Text style={[s.badgeText, { color: '#22c55e' }]}>Present</Text></View>
                      : <View style={[s.badge, s.badgeRed]}><Text style={[s.badgeText, { color: '#ef4444' }]}>Missed</Text></View>
                    }
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1 },
  scroll:         { padding: 20, paddingTop: 16 },
  loadWrap:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadText:       { fontSize: 13, fontWeight: '700' },

  statsRow:       { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard:       { flex: 1, borderWidth: 1, borderRadius: 18, padding: 14, alignItems: 'center' },
  statLabel:      { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase' },
  statValue:      { fontSize: 22, fontWeight: '900' },

  progressCard:   { borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressLabel:  { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  progressPct:    { fontSize: 24, fontWeight: '900' },
  progressTrack:  { height: 10, borderRadius: 99, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 99 },
  progressHint:   { marginTop: 10, fontSize: 10, fontWeight: '700' },

  sectionCard:    { borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 14 },
  sectionTitle:   { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  emptyText:      { textAlign: 'center', fontSize: 12, fontWeight: '700', paddingVertical: 24, textTransform: 'uppercase' },

  tripRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 8 },
  tripName:       { fontSize: 13, fontWeight: '700' },
  tripSlot:       { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },

  badge:          { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  badgeText:      { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  badgeGreen:     { backgroundColor: 'rgba(34,197,94,0.1)',  borderColor: 'rgba(34,197,94,0.2)' },
  badgeOrange:    { backgroundColor: 'rgba(247,160,27,0.1)', borderColor: 'rgba(247,160,27,0.2)' },
  badgeRed:       { backgroundColor: 'rgba(239,68,68,0.1)',  borderColor: 'rgba(239,68,68,0.2)' },

  dateGroup:      { marginBottom: 20 },
  dateRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dateText:       { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  dateLine:       { flex: 1, height: 1 },
  dateCount:      { fontSize: 9, fontWeight: '700' },

  historyRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 6 },
  historyLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:            { width: 8, height: 8, borderRadius: 4 },
});
import { BOTTOM_BAR_HEIGHT } from '../../src/hooks/useBottomBarHeight';

// في الـ styles
<View style={{ flex: 1, paddingBottom: BOTTOM_BAR_HEIGHT }}></View>