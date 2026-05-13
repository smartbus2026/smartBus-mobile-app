import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import {
  Calendar, MapPin, ArrowRight, Bus,
  Clock, CheckCircle, XCircle, Route,
  Check, X,
} from 'lucide-react-native';
import Api from '../../src/services/api';

type TripStatus = 'upcoming' | 'completed' | 'missed';

const timeSlotMap: Record<string, string> = {
  morning:      'Morning',
  return_1530:  '3:30 PM',
  return_1900:  '7:00 PM',
};

export default function MyTripsPage() {
  const [tab, setTab]           = useState<TripStatus>('upcoming');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyBookings = async () => {
    try {
      const res = await Api.get('/bookings/my');
      setBookings(res.data?.data?.bookings || []);
    } catch (err) {
      console.error('Failed to fetch my bookings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMyBookings(); }, []);

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel', style: 'destructive',
          onPress: async () => {
            try {
              await Api.put(`/bookings/${bookingId}/cancel`);
              fetchMyBookings();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handleMarkAttend = (bookingId: string) => {
    Alert.alert(
      'Confirm Boarding',
      'Confirm that you have boarded the bus?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Boarded',
          onPress: async () => {
            try {
              await Api.patch(`/bookings/${bookingId}/attend`);
              fetchMyBookings();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to mark attendance');
            }
          },
        },
      ]
    );
  };

  const mappedTrips = bookings.map((b) => {
    const tripDate = b.trip?.date ? new Date(b.trip.date) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = tripDate ? tripDate < today : false;

    let currentStatus: TripStatus = 'upcoming';
    if (b.status === 'cancelled')                        currentStatus = 'missed';
    else if (b.status === 'completed' || b.attended)     currentStatus = 'completed';
    else if (b.status === 'missed')                      currentStatus = 'missed';
    else if (isPast && b.status === 'active')            currentStatus = 'missed';

    return {
      id:         b._id,
      status:     currentStatus,
      attended:   b.attended,
      date:       b.trip?.date ? new Date(b.trip.date).toDateString() : 'TBA',
      from:       b.trip?.route?.name || 'Selected Route',
      to:         'Campus',
      pickup:     timeSlotMap[b.trip?.time_slot] || b.trip?.time_slot || '—',
      bus:        b.trip?.bus_number || 'Bus System',
      returnTime: b.trip?.time_slot === 'morning' ? 'N/A' : (timeSlotMap[b.trip?.time_slot] || b.trip?.time_slot || 'N/A'),
    };
  });

  const counts = {
    upcoming:  mappedTrips.filter(t => t.status === 'upcoming').length,
    completed: mappedTrips.filter(t => t.status === 'completed').length,
    missed:    mappedTrips.filter(t => t.status === 'missed').length,
  };

  const list = mappedTrips.filter(t => t.status === tab);

  const getBorderColor = (status: TripStatus) => {
    if (status === 'completed') return 'rgba(59,130,246,0.3)';
    if (status === 'missed')    return 'rgba(239,68,68,0.3)';
    return '#2d3036';
  };

  if (isLoading) {
    return (
      <View style={s.loadWrap}>
        <ActivityIndicator size="large" color="#f7a01b" />
        <Text style={s.loadText}>Loading your trips...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

      {/* Tabs */}
      <View style={s.tabBar}>
        {(['upcoming', 'completed', 'missed'] as TripStatus[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tab, tab === t && s.tabActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <Text style={s.tabCount}> ({counts[t]})</Text>
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trip Cards */}
      {list.map(t => (
        <View key={t.id} style={[s.card, { borderColor: getBorderColor(t.status as TripStatus) }]}>

          {/* Card Header */}
          <View style={s.cardHeader}>
            <View style={s.dateWrap}>
              <Calendar size={12} color="#8a8d91" />
              <Text style={s.dateText}>{t.date}</Text>
            </View>
            {/* Badge */}
            {t.status === 'upcoming'  && <View style={[s.badge, s.badgeGreen]}><Text style={[s.badgeText, { color: '#22c55e' }]}>Confirmed</Text></View>}
            {t.status === 'completed' && <View style={[s.badge, s.badgeBlue]}><Text style={[s.badgeText, { color: '#60a5fa' }]}>✓ Attended</Text></View>}
            {t.status === 'missed'    && <View style={[s.badge, s.badgeRed]}><Text style={[s.badgeText, { color: '#ef4444' }]}>Missed</Text></View>}
          </View>

          {/* Route */}
          <View style={s.routeRow}>
            <MapPin size={15} color="#f7a01b" />
            <Text style={s.routeFrom} numberOfLines={1}>{t.from}</Text>
            <ArrowRight size={13} color="#555" />
            <Text style={s.routeTo} numberOfLines={1}>{t.to}</Text>
          </View>

          {/* Info Grid */}
          <View style={s.infoGrid}>
            {[
              { label: 'PICKUP',  value: t.pickup,     highlight: false, Icon: Clock },
              { label: 'BUS',     value: t.bus,        highlight: false, Icon: Bus   },
              { label: 'RETURN',  value: t.returnTime, highlight: true,  Icon: ArrowRight },
            ].map((item, i) => (
              <View key={i} style={s.infoBox}>
                <Text style={s.infoLabel}>{item.label}</Text>
                <Text style={[s.infoValue, item.highlight && { color: '#f7a01b' }]}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          {t.status === 'upcoming' && (
            <View style={s.actions}>
              <TouchableOpacity
                style={[s.actionBtn, s.actionGreen]}
                onPress={() => handleMarkAttend(t.id)}
                activeOpacity={0.8}
              >
                <Check size={14} color="#22c55e" />
                <Text style={[s.actionText, { color: '#22c55e' }]}>BOARDED</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, s.actionRed]}
                onPress={() => handleCancelBooking(t.id)}
                activeOpacity={0.8}
              >
                <X size={14} color="#ef4444" />
                <Text style={[s.actionText, { color: '#ef4444' }]}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      {/* Empty State */}
      {list.length === 0 && (
        <View style={s.emptyWrap}>
          <View style={s.emptyIcon}>
            <Route size={32} color="#8a8d91" />
          </View>
          <Text style={s.emptyTitle}>No {tab} trips</Text>
          <Text style={s.emptySub}>You don't have any bookings in this category.</Text>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#0f1115' },
  scroll:        { padding: 20 },

  loadWrap:      { flex: 1, backgroundColor: '#0f1115', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadText:      { color: '#8a8d91', fontSize: 13, fontWeight: '700' },

  // Tabs
  tabBar:        { flexDirection: 'row', backgroundColor: '#1c1e26', borderWidth: 1, borderColor: '#2d3036', borderRadius: 14, padding: 4, marginBottom: 24, gap: 4 },
  tab:           { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabActive:     { backgroundColor: '#262a33', borderWidth: 1, borderColor: '#2d3036' },
  tabText:       { fontSize: 11, fontWeight: '700', color: '#8a8d91', textTransform: 'capitalize' },
  tabTextActive: { color: '#f7a01b' },
  tabCount:      { fontSize: 10, opacity: 0.5 },

  // Card
  card:          { backgroundColor: '#1c1e26', borderWidth: 1, borderRadius: 20, padding: 20, marginBottom: 14 },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateWrap:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText:      { fontSize: 11, fontWeight: '700', color: '#8a8d91', textTransform: 'uppercase' },

  // Badges
  badge:         { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  badgeText:     { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  badgeGreen:    { backgroundColor: 'rgba(34,197,94,0.1)',  borderColor: 'rgba(34,197,94,0.2)' },
  badgeBlue:     { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)' },
  badgeRed:      { backgroundColor: 'rgba(239,68,68,0.1)',  borderColor: 'rgba(239,68,68,0.2)' },

  // Route
  routeRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  routeFrom:     { flex: 1, fontSize: 15, fontWeight: '900', color: '#fff' },
  routeTo:       { flex: 1, fontSize: 15, fontWeight: '900', color: '#fff' },

  // Info Grid
  infoGrid:      { flexDirection: 'row', gap: 8, marginBottom: 16 },
  infoBox:       { flex: 1, backgroundColor: 'rgba(38,42,51,0.5)', borderWidth: 1, borderColor: '#2d3036', borderRadius: 12, padding: 12 },
  infoLabel:     { fontSize: 8, fontWeight: '800', color: '#8a8d91', letterSpacing: 1.5, marginBottom: 6 },
  infoValue:     { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Actions
  actions:       { flexDirection: 'row', gap: 10 },
  actionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  actionText:    { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  actionGreen:   { backgroundColor: 'rgba(34,197,94,0.1)',  borderColor: 'rgba(34,197,94,0.2)' },
  actionRed:     { backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' },

  // Empty
  emptyWrap:     { alignItems: 'center', justifyContent: 'center', paddingTop: 80, opacity: 0.4 },
  emptyIcon:     { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1c1e26', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:    { fontSize: 16, fontWeight: '800', color: '#fff', textTransform: 'uppercase', marginBottom: 6 },
  emptySub:      { fontSize: 12, color: '#8a8d91', textAlign: 'center' },
});