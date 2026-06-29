import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert, Modal, TextInput
} from 'react-native';
import {
  Calendar, MapPin, Bus, Clock, Check, X, Route, Info
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Api from '../../src/services/api';
import { useThemeColor } from '../../constants/theme';
import TopBar from '../../src/components/TopBar';
import socket from '../../src/services/socket';

type TripStatus = 'upcoming' | 'completed' | 'missed' | 'cancelled';

const OptionBtn = ({
  label, selected, onPress, colors,
}: {
  label: string; selected: boolean; onPress: () => void; colors: any;
}) => (
  <TouchableOpacity
    style={[
      s.optBtn,
      { backgroundColor: colors.background, borderColor: colors.border },
      selected && { backgroundColor: `${colors.tint}14`, borderColor: `${colors.tint}80` },
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[s.optLabel, { color: colors.icon }, selected && { color: colors.tint, fontWeight: '700' }]}>
      {label}
    </Text>
    {selected && (
      <View style={[s.checkCircle, { backgroundColor: `${colors.tint}26`, borderColor: `${colors.tint}66` }]}>
        <Text style={[s.checkText, { color: colors.tint }]}>✓</Text>
      </View>
    )}
  </TouchableOpacity>
);

export default function MyTripsScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { t }  = useTranslation();

  const [tab, setTab]               = useState<TripStatus>('upcoming');
  const [filterDate, setFilterDate] = useState<string>('');
  const [bookings, setBookings]     = useState<any[]>([]);
  const [routes, setRoutes]         = useState<any[]>([]);
  const [settings, setSettings]     = useState<any>(null);
  const [isLoading, setIsLoading]   = useState(true);

  const [editModal, setEditModal]           = useState<{ open: boolean; booking: any | null }>({ open: false, booking: null });
  const [editRouteId, setEditRouteId]       = useState('');
  const [editTimeSlot, setEditTimeSlot]     = useState('');
  const [editReturnTime, setEditReturnTime] = useState('');
  const [editSaving, setEditSaving]         = useState(false);
  const [editError, setEditError]           = useState('');

  const [attendanceLoading, setAttendanceLoading] = useState<string | null>(null);
  const [toast, setToast]                         = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [bRes, rRes, sRes] = await Promise.all([
        Api.get('/bookings/my'),
        Api.get('/routes'),
        Api.get('/settings'),
      ]);

      let fetchedBookings = bRes.data?.data?.bookings ||
                            bRes.data?.bookings ||
                            bRes.data?.data ||
                            bRes.data || [];

      if (!Array.isArray(fetchedBookings)) {
        fetchedBookings = [];
      }

      setBookings(fetchedBookings);
      setRoutes(rRes.data?.data || []);

      const cfg = sRes.data?.data?.settings || sRes.data?.settings;
      if (cfg) setSettings(cfg);
    } catch (err) {
      console.error('Failed to fetch', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const handleBusAssigned = (payload: any) => {
      if (!payload?.bookingIds || !payload?.busDetails) return;
      setBookings(prev =>
        prev.map(b =>
          payload.bookingIds.includes(b._id)
            ? { ...b, status: 'assigned', busId: payload.busDetails }
            : b
        )
      );
    };
    socket.on('bookingAssigned', handleBusAssigned);
    return () => { socket.off('bookingAssigned', handleBusAssigned); };
  }, []);

  const isWindowOpen = () => {
    if (!settings) return false;
    const now   = new Date();
    const cur   = now.getHours() * 60 + now.getMinutes();
    const open  = settings.booking_open_hour  * 60 + settings.booking_open_minute;
    const close = settings.booking_close_hour * 60 + settings.booking_close_minute;
    return cur >= open && cur <= close;
  };

  const parseTimeToMinutes = (t: string): number => {
    if (!t) return 0;
    const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return 0;
    let h = parseInt(m[1]);
    const min = parseInt(m[2]);
    if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  };

  const isAttendanceUnlocked = (b: any): boolean => {
    if (!settings) return false;
    const bd    = new Date(b.date);
    const today = new Date();
    if (bd.toDateString() !== today.toDateString()) return false;
    const nowM = today.getHours() * 60 + today.getMinutes();
    if (b.timeSlot === 'Morning') return nowM >= parseTimeToMinutes(settings.morningStartTime || '08:30 AM');
    return nowM >= parseTimeToMinutes(b.specificReturnTime || '');
  };

  const handleCancel = (id: string) => {
    Alert.alert(t('cancel_booking'), t('confirm_cancel_booking'), [
      { text: t('no'), style: 'cancel' },
      {
        text: t('yes_cancel'), style: 'destructive',
        onPress: async () => {
          try {
            await Api.put(`/bookings/${id}/cancel`);
            fetchAll();
          } catch (err: any) {
            Alert.alert(t('error'), err.response?.data?.message || t('failed_to_cancel'));
          }
        },
      },
    ]);
  };

  const handleAttendance = async (id: string, status: 'completed' | 'missed') => {
    setAttendanceLoading(id);
    try {
      await Api.patch(`/bookings/${id}/attendance`, { attendanceStatus: status });
      setBookings(prev =>
        prev.map(b =>
          b._id === id
            ? { ...b, attendanceStatus: status, status, attended: status === 'completed' }
            : b
        )
      );
      setToast({ message: `${t('trip_marked_as')} ${status}!`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || t('failed_mark_attendance'), type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setAttendanceLoading(null);
    }
  };

  const openEdit = (booking: any) => {
    setEditModal({ open: true, booking });
    setEditRouteId(booking.route?._id || '');
    setEditTimeSlot(booking.timeSlot || '');
    setEditReturnTime(booking.specificReturnTime || '');
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!editModal.booking) return;
    setEditSaving(true);
    setEditError('');
    try {
      const payload: any = { routeId: editRouteId, timeSlot: editTimeSlot };
      if (editTimeSlot === 'Return') payload.specificReturnTime = editReturnTime;
      await Api.patch(`/bookings/${editModal.booking._id}`, payload);
      setEditModal({ open: false, booking: null });
      fetchAll();
    } catch (err: any) {
      setEditError(err.response?.data?.message || t('failed_to_update'));
    } finally {
      setEditSaving(false);
    }
  };

  const mappedTrips = bookings.map(b => {
    const bd = b.date ? new Date(b.date) : null;
    let currentStatus: TripStatus = 'upcoming';

    if (b.status === "completed" || b.attendanceStatus === "completed") {
      currentStatus = "completed";
    } else if (b.status === "missed" || b.attendanceStatus === "missed") {
      currentStatus = "missed";
    } else if (b.status === "cancelled" || b.status === "cancelled_by_admin") {
      currentStatus = "cancelled";
    } else if (["pending", "booked", "assigned", "active", "in-progress"].includes(b.status)) {
      currentStatus = "upcoming";
    }

    return {
      raw: b, id: b._id, status: currentStatus,
      date: bd ? bd.toDateString() : 'TBA',
      from: b.route?.name || t('route'),
      timeSlot: b.timeSlot,
      returnTime: b.timeSlot === 'Return' ? (b.specificReturnTime || 'TBA') : 'N/A',
      bookingStatus: b.status,
      attendanceStatus: b.attendanceStatus,
    };
  });

  const dateFilteredTrips = mappedTrips.filter(trip => {
    if (!filterDate) return true;
    return trip.raw.date && new Date(trip.raw.date).toISOString().split('T')[0] === filterDate;
  });

  const counts = {
    upcoming:  dateFilteredTrips.filter(trip => trip.status === 'upcoming').length,
    completed: dateFilteredTrips.filter(trip => trip.status === 'completed').length,
    missed:    dateFilteredTrips.filter(trip => trip.status === 'missed').length,
    cancelled: dateFilteredTrips.filter(trip => trip.status === 'cancelled').length,
  };

  const list = dateFilteredTrips.filter(trip => trip.status === tab);

  const getBookingBadge = (status: string, colors: any) => {
    if (status === 'pending')   return { bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)',  text: '#60a5fa',  label: `⏳ ${t('pending')}` };
    if (status === 'booked')    return { bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)',  text: '#60a5fa',  label: `⏳ ${t('booked')}` };
    if (status === 'assigned')  return { bg: `${colors.tint}1A`,      border: `${colors.tint}33`,      text: colors.tint, label: `🚌 ${t('bus_assigned')}` };
    if (status === 'active')    return { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)',   text: '#22c55e',  label: `✓ ${t('active')}` };
    if (status === 'completed') return { bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)',  text: '#60a5fa',  label: `✓ ${t('done')}` };
    if (status === 'missed')    return { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   text: '#ef4444',  label: `✗ ${t('missed')}` };
    return                             { bg: 'rgba(115,115,115,0.1)', border: 'rgba(115,115,115,0.2)', text: '#737373',  label: t('cancelled') };
  };

  const getCardBorderColor = (status: TripStatus) => {
    if (status === 'completed') return 'rgba(59,130,246,0.3)';
    if (status === 'missed')    return 'rgba(239,68,68,0.3)';
    if (status === 'cancelled') return 'rgba(115,115,115,0.2)';
    return colors.border;
  };

  if (isLoading) {
    return (
      <View style={[s.loadWrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[s.loadText, { color: colors.icon }]}>{t('loading_trips')}</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      <TopBar
        title={t('nav_myTrips')}
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(student)/settings' as any)}
      />

      {toast && (
        <View style={[
          s.toast,
          toast.type === 'success'
            ? { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.3)' }
            : { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' },
        ]}>
          {toast.type === 'success'
            ? <Check size={14} color="#22c55e" />
            : <X size={14} color="#ef4444" />
          }
          <Text style={[s.toastText, { color: toast.type === 'success' ? '#22c55e' : '#ef4444' }]}>
            {toast.message}
          </Text>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.topControls}>
          <View style={[s.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(['upcoming', 'completed', 'missed', 'cancelled'] as TripStatus[]).map(tabKey => (
              <TouchableOpacity
                key={tabKey}
                style={[
                  s.tab,
                  tab === tabKey && { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
                ]}
                onPress={() => setTab(tabKey)}
                activeOpacity={0.7}
              >
                <Text style={[s.tabText, { color: colors.icon }, tab === tabKey && { color: colors.tint }]}>
                  {t(tabKey)}
                  <Text style={s.tabCount}> ({counts[tabKey]})</Text>
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.filterRow}>
            <TextInput
              style={[s.dateInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder={t('filter_by_date')}
              placeholderTextColor={colors.icon}
              value={filterDate}
              onChangeText={setFilterDate}
            />
            {!!filterDate && (
              <TouchableOpacity style={s.clearBtn} onPress={() => setFilterDate('')}>
                <X size={14} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {list.map(trip => {
          const unlocked      = isAttendanceUnlocked(trip.raw);
          const alreadyMarked = trip.attendanceStatus === 'completed' || trip.attendanceStatus === 'missed';
          const windowOpen    = isWindowOpen();
          const badge         = getBookingBadge(trip.bookingStatus, colors);

          return (
            <View key={trip.id} style={[s.card, { backgroundColor: colors.card, borderColor: getCardBorderColor(trip.status) }, trip.status === 'cancelled' && { opacity: 0.75 }]}>

              <View style={s.cardHeader}>
                <View style={s.dateWrap}>
                  <Calendar size={12} color={colors.icon} />
                  <Text style={[s.dateText, { color: colors.icon }]}>{trip.date}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                  <Text style={[s.badgeText, { color: badge.text }]}>{badge.label}</Text>
                </View>
              </View>

              <View style={s.routeRow}>
                <MapPin size={15} color={colors.tint} />
                <Text style={[s.routeFrom, { color: colors.text }]} numberOfLines={1}>{trip.from}</Text>
                <Text style={[s.routeArrow, { color: colors.icon }]}>→</Text>
                <Text style={[s.routeTo, { color: colors.text }]} numberOfLines={1}>{t('campus')}</Text>
              </View>

              <View style={s.infoGrid}>
                <View style={[s.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[s.infoLabel, { color: colors.icon }]}>{t('slot').toUpperCase()}</Text>
                  <Text style={[s.infoValue, { color: colors.text }]}>{trip.timeSlot || '—'}</Text>
                </View>
                <View style={[s.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[s.infoLabel, { color: colors.icon }]}>{t('return').toUpperCase()}</Text>
                  <Text style={[s.infoValue, { color: trip.timeSlot === 'Return' ? colors.tint : colors.icon }]}>{trip.returnTime}</Text>
                </View>
              </View>

              {trip.status === 'upcoming' && (
                <View style={s.actionsWrap}>

                  {alreadyMarked ? (
                    <View style={[
                      s.markedRow,
                      trip.attendanceStatus === 'completed'
                        ? { backgroundColor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.2)' }
                        : { backgroundColor: 'rgba(239,68,68,0.1)',  borderColor: 'rgba(239,68,68,0.2)' },
                    ]}>
                      {trip.attendanceStatus === 'completed'
                        ? <><Check size={12} color="#60a5fa" /><Text style={[s.markedText, { color: '#60a5fa' }]}>{t('trip_completed').toUpperCase()}</Text></>
                        : <><X size={12} color="#ef4444" /><Text style={[s.markedText, { color: '#ef4444' }]}>{t('marked_as_missed').toUpperCase()}</Text></>
                      }
                    </View>
                  ) : (
                    <View style={s.rowGap}>
                      <TouchableOpacity
                        style={[s.actionBtn, s.actionGreen, (!unlocked || attendanceLoading === trip.id) && s.btnDisabled]}
                        onPress={() => handleAttendance(trip.id, 'completed')}
                        disabled={!unlocked || attendanceLoading === trip.id}
                        activeOpacity={0.8}
                      >
                        <Check size={12} color="#22c55e" />
                        <Text style={[s.actionText, { color: '#22c55e' }]}>
                          {attendanceLoading === trip.id ? t('saving') : t('completed')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.actionBtn, s.actionYellow, (!unlocked || attendanceLoading === trip.id) && s.btnDisabled]}
                        onPress={() => handleAttendance(trip.id, 'missed')}
                        disabled={!unlocked || attendanceLoading === trip.id}
                        activeOpacity={0.8}
                      >
                        <X size={12} color="#eab308" />
                        <Text style={[s.actionText, { color: '#eab308' }]}>
                          {attendanceLoading === trip.id ? t('saving') : t('missed')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {['pending', 'booked'].includes(trip.bookingStatus) ? (
                    <View style={s.rowGap}>
                      <TouchableOpacity
                        style={[s.actionBtn, s.actionAmber, !windowOpen && s.btnDisabled]}
                        onPress={() => windowOpen && openEdit(trip.raw)}
                        disabled={!windowOpen}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.actionText, { color: colors.tint }]}>✎ {t('edit')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.actionBtn, s.actionRed]}
                        onPress={() => handleCancel(trip.id)}
                        activeOpacity={0.8}
                      >
                        <X size={12} color="#ef4444" />
                        <Text style={[s.actionText, { color: '#ef4444' }]}>{t('cancel')}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[s.disabledActionBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Info size={12} color={colors.icon} />
                      <Text style={[s.disabledActionText, { color: colors.icon }]}>{t('edit_disabled_assigned')}</Text>
                    </View>
                  )}

                </View>
              )}
            </View>
          );
        })}

        {list.length === 0 && (
          <View style={s.emptyWrap}>
            <View style={[s.emptyIcon, { backgroundColor: colors.card }]}>
              <Route size={32} color={colors.icon} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.text }]}>{t('no_trips_in_tab', { tab: t(tab) })}</Text>
            <Text style={[s.emptySub,   { color: colors.icon }]}>{t('no_bookings_category')}</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={editModal.open} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text }]}>{t('edit_booking').toUpperCase()}</Text>
              <TouchableOpacity onPress={() => setEditModal({ open: false, booking: null })}>
                <X size={18} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {!!editError && (
              <View style={s.editError}>
                <Text style={s.editErrorText}>{editError}</Text>
              </View>
            )}

            <Text style={[s.fieldLabel, { color: colors.icon }]}>{t('route').toUpperCase()}</Text>
            {routes.map((r: any) => (
              <OptionBtn key={r._id} label={r.name} selected={editRouteId === r._id} onPress={() => setEditRouteId(r._id)} colors={colors} />
            ))}

            <Text style={[s.fieldLabel, { color: colors.icon, marginTop: 12 }]}>{t('time_slot').toUpperCase()}</Text>
            <View style={s.rowGap}>
              {['Morning', 'Return'].map(slot => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    s.slotBtn,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editTimeSlot === slot && { backgroundColor: `${colors.tint}14`, borderColor: `${colors.tint}80` },
                  ]}
                  onPress={() => { setEditTimeSlot(slot); if (slot === 'Morning') setEditReturnTime(''); }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.slotTxt, { color: colors.icon }, editTimeSlot === slot && { color: colors.tint, fontWeight: '700' }]}>
                    {slot === 'Morning' ? t('morning') : t('return')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {editTimeSlot === 'Return' && (
              <View style={{ marginTop: 12 }}>
                <Text style={[s.fieldLabel, { color: colors.icon }]}>{t('return_time').toUpperCase()}</Text>
                {(settings?.returnTimeOptions || []).map((rt: string) => (
                  <OptionBtn key={rt} label={rt} selected={editReturnTime === rt} onPress={() => setEditReturnTime(rt)} colors={colors} />
                ))}
              </View>
            )}

            <View style={[s.rowGap, { marginTop: 16 }]}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => setEditModal({ open: false, booking: null })}
              >
                <Text style={[s.modalBtnTxt, { color: colors.icon }]}>{t('cancel').toUpperCase()}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.modalBtn,
                  { backgroundColor: colors.tint },
                  (editSaving || !editRouteId || !editTimeSlot || (editTimeSlot === 'Return' && !editReturnTime)) && s.btnDisabled,
                ]}
                onPress={handleEditSave}
                disabled={editSaving || !editRouteId || !editTimeSlot || (editTimeSlot === 'Return' && !editReturnTime)}
              >
                <Text style={[s.modalBtnTxt, { color: '#000' }]}>
                  {editSaving ? t('saving') : t('save_changes')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:               { flex: 1 },
  scroll:             { padding: 20, paddingTop: 16 },
  loadWrap:           { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadText:           { fontSize: 13, fontWeight: '700' },
  toast:              { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginTop: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1 },
  toastText:          { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  topControls:        { marginBottom: 20 },
  tabBar:             { flexDirection: 'row', borderWidth: 1, borderRadius: 14, padding: 4, marginBottom: 12, gap: 4 },
  tab:                { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabText:            { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  tabCount:           { fontSize: 9, opacity: 0.5 },
  filterRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateInput:          { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 12, fontWeight: '600' },
  clearBtn:           { padding: 10, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  card:               { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 14 },
  cardHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  dateWrap:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText:           { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  badge:              { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText:          { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  routeRow:           { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  routeFrom:          { flex: 1, fontSize: 14, fontWeight: '900' },
  routeArrow:         { fontSize: 14, opacity: 0.3 },
  routeTo:            { flex: 1, fontSize: 14, fontWeight: '900' },
  infoGrid:           { flexDirection: 'row', gap: 8, marginBottom: 14 },
  infoBox:            { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12 },
  infoLabel:          { fontSize: 8, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  infoValue:          { fontSize: 11, fontWeight: '700' },
  actionsWrap:        { gap: 8 },
  rowGap:             { flexDirection: 'row', gap: 8 },
  markedRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  markedText:         { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  actionBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, borderWidth: 1 },
  actionText:         { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  actionGreen:        { backgroundColor: 'rgba(34,197,94,0.1)',   borderColor: 'rgba(34,197,94,0.2)' },
  actionYellow:       { backgroundColor: 'rgba(234,179,8,0.1)',   borderColor: 'rgba(234,179,8,0.2)' },
  actionAmber:        { backgroundColor: 'rgba(247,160,27,0.1)',  borderColor: 'rgba(247,160,27,0.2)' },
  actionRed:          { backgroundColor: 'rgba(239,68,68,0.05)',  borderColor: 'rgba(239,68,68,0.2)' },
  btnDisabled:        { opacity: 0.3 },
  disabledActionBox:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, borderWidth: 1, opacity: 0.8 },
  disabledActionText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  emptyWrap:          { alignItems: 'center', justifyContent: 'center', paddingTop: 80, opacity: 0.4 },
  emptyIcon:          { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:         { fontSize: 16, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 },
  emptySub:           { fontSize: 12, textAlign: 'center' },
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalCard:          { borderWidth: 1, borderRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:         { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  editError:          { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 12, padding: 12, marginBottom: 12 },
  editErrorText:      { color: '#ef4444', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  fieldLabel:         { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  optBtn:             { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  optLabel:           { flex: 1, fontSize: 13, fontWeight: '600' },
  checkCircle:        { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  checkText:          { fontSize: 11, fontWeight: '700' },
  slotBtn:            { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  slotTxt:            { fontSize: 13, fontWeight: '600' },
  modalBtn:           { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalBtnTxt:        { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});