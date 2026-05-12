import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  StyleSheet, Dimensions,
} from 'react-native';
import Api from '../../src/services/api';

const { width } = Dimensions.get('window');

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
  morning:      'Morning',
  return_1530:  '3:30 PM',
  return_1900:  '7:00 PM',
};

export default function AttendancePage() {
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

  const allBookings  = bookings.filter(b => b.status !== 'cancelled');

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
      <View style={s.loadWrap}>
        <ActivityIndicator size="large" color="#f7a01b" />
        <Text style={s.loadText}>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>
          My <Text style={s.headerAccent}>Attendance</Text>
        </Text>
        <Text style={s.headerSub}>Your trip attendance record</Text>
      </View>

      {/* Stats Cards */}
      <View style={s.statsRow}>
        {[
          { l: 'Total',   v: String(total),   color: '#8a8d91' },
          { l: 'Present', v: String(present), color: '#22c55e' },
          { l: 'Missed',  v: String(missed),  color: '#ef4444' },
          { l: 'Rate',    v: `${pct}%`,       color: pct >= 75 ? '#22c55e' : '#ef4444' },
        ].map(item => (
          <View key={item.l} style={s.statCard}>
            <Text style={s.statLabel}>{item.l}</Text>
            <Text style={[s.statValue, { color: item.color }]}>{item.v}</Text>
          </View>
        ))}
      </View>

      {/* Progress Bar */}
      <View style={s.progressCard}>
        <View style={s.progressHeader}>
          <Text style={s.progressLabel}>ATTENDANCE RATE</Text>
          <Text style={[s.progressPct, { color: '#f7a01b' }]}>{pct}%</Text>
        </View>
        <View style={s.progressTrack}>
          <View style={[
            s.progressFill,
            { width: `${pct}%` as any, backgroundColor: pct >= 75 ? '#22c55e' : '#ef4444' }
          ]} />
        </View>
        <Text style={s.progressHint}>
          {pct >= 75 ? '✓ Good attendance, keep it up!' : '⚠ Your attendance is below 75%'}
        </Text>
      </View>

      {/* Today's Trips */}
      {todayBookings.length > 0 && (
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>TODAY'S TRIPS</Text>
          {todayBookings.map(b => (
            <View key={b._id} style={s.tripRow}>
              <View>
                <Text style={s.tripName}>{b.trip?.route?.name || '—'}</Text>
                <Text style={s.tripSlot}>{timeSlotMap[b.trip?.time_slot] || b.trip?.time_slot}</Text>
              </View>
              {b.attended
                ? <View style={[s.badge, s.badgeGreen]}><Text style={[s.badgeText, { color: '#22c55e' }]}>✓ Present</Text></View>
                : <View style={[s.badge, s.badgeOrange]}><Text style={[s.badgeText, { color: '#f7a01b' }]}>Pending</Text></View>
              }
            </View>
          ))}
        </View>
      )}

      {/* Trip History */}
      <View style={s.sectionCard}>
        <Text style={s.sectionTitle}>TRIP HISTORY</Text>

        {sortedDates.length === 0 ? (
          <Text style={s.emptyText}>No past trips yet</Text>
        ) : (
          sortedDates.map(dateKey => (
            <View key={dateKey} style={s.dateGroup}>

              {/* Date Header */}
              <View style={s.dateRow}>
                <Text style={s.dateText}>{dateKey}</Text>
                <View style={s.dateLine} />
                <Text style={s.dateCount}>
                  {groupedByDate[dateKey].filter(b => b.attended).length}/{groupedByDate[dateKey].length} present
                </Text>
              </View>

              {/* Trips */}
              {groupedByDate[dateKey].map(b => (
                <View key={b._id} style={s.historyRow}>
                  <View style={s.historyLeft}>
                    <View style={[s.dot, { backgroundColor: b.attended ? '#22c55e' : '#ef4444' }]} />
                    <View>
                      <Text style={s.tripName}>{b.trip?.route?.name || '—'}</Text>
                      <Text style={s.tripSlot}>{timeSlotMap[b.trip?.time_slot] || b.trip?.time_slot}</Text>
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

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#0f1115' },
  scroll:         { padding: 20 },

  loadWrap:       { flex: 1, backgroundColor: '#0f1115', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadText:       { color: '#8a8d91', fontSize: 13, fontWeight: '700' },

  // Header
  header:         { marginBottom: 20 },
  headerTitle:    { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerAccent:   { color: '#f7a01b' },
  headerSub:      { fontSize: 12, color: '#8a8d91', fontWeight: '500', marginTop: 4 },

  // Stats
  statsRow:       { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard:       { flex: 1, backgroundColor: '#1c1e26', borderWidth: 1, borderColor: '#2d3036', borderRadius: 16, padding: 14 },
  statLabel:      { fontSize: 9, color: '#8a8d91', fontWeight: '700', letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase' },
  statValue:      { fontSize: 22, fontWeight: '900' },

  // Progress
  progressCard:   { backgroundColor: '#1c1e26', borderWidth: 1, borderColor: '#2d3036', borderRadius: 20, padding: 20, marginBottom: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressLabel:  { fontSize: 10, color: '#8a8d91', fontWeight: '800', letterSpacing: 2 },
  progressPct:    { fontSize: 24, fontWeight: '900' },
  progressTrack:  { height: 10, backgroundColor: '#262a33', borderRadius: 99, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 99 },
  progressHint:   { marginTop: 10, fontSize: 10, color: '#8a8d91', fontWeight: '700' },

  // Section Cards
  sectionCard:    { backgroundColor: '#1c1e26', borderWidth: 1, borderColor: '#2d3036', borderRadius: 20, padding: 20, marginBottom: 14 },
  sectionTitle:   { fontSize: 11, color: '#fff', fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  emptyText:      { textAlign: 'center', color: '#8a8d91', fontSize: 12, fontWeight: '700', paddingVertical: 24, textTransform: 'uppercase' },

  // Trip Row (today)
  tripRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#262a33', borderRadius: 12, padding: 12, marginBottom: 8 },
  tripName:       { fontSize: 13, fontWeight: '700', color: '#fff' },
  tripSlot:       { fontSize: 10, color: '#8a8d91', fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },

  // Badges
  badge:          { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  badgeText:      { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  badgeGreen:     { backgroundColor: 'rgba(34,197,94,0.1)',  borderColor: 'rgba(34,197,94,0.2)' },
  badgeOrange:    { backgroundColor: 'rgba(247,160,27,0.1)', borderColor: 'rgba(247,160,27,0.2)' },
  badgeRed:       { backgroundColor: 'rgba(239,68,68,0.1)',  borderColor: 'rgba(239,68,68,0.2)' },

  // History
  dateGroup:      { marginBottom: 20 },
  dateRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dateText:       { fontSize: 11, fontWeight: '800', color: '#f7a01b', textTransform: 'uppercase' },
  dateLine:       { flex: 1, height: 1, backgroundColor: '#2d3036' },
  dateCount:      { fontSize: 9, fontWeight: '700', color: '#8a8d91' },

  historyRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(38,42,51,0.5)', borderRadius: 12, padding: 12, marginBottom: 6 },
  historyLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:            { width: 8, height: 8, borderRadius: 4 },
});