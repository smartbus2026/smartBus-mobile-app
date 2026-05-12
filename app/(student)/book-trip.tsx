import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Api from '../../src/services/api';

// ── Types ────────────────────────────────────────────────────────────────────
interface Stop { _id: string; name: string; }
interface Route { _id: string; name: string; stops: Stop[]; }
interface Trip {
  _id: string; date: string; time_slot: string;
  route?: Route; booked_seats: number; total_seats: number; bus_number?: string;
}
interface BookingSettings {
  booking_open_hour: number; booking_open_minute: number;
  booking_close_hour: number; booking_close_minute: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const SLOT_MAP: Record<string, string> = {
  return_1530: '3:30 PM',
  return_1900: '7:00 PM',
};

const formatTime = (h: number, m: number) => {
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const calcWindow = (s: BookingSettings) => {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const open = s.booking_open_hour * 60 + s.booking_open_minute;
  const close = s.booking_close_hour * 60 + s.booking_close_minute;
  const isOpen = cur >= open && cur <= close;
  const diffMs = isOpen ? (close - cur) * 60000 : 0;
  const dh = Math.floor(diffMs / 3600000);
  const dm = Math.floor((diffMs % 3600000) / 60000);
  const timeLeft = isOpen
    ? `${String(dh).padStart(2, '0')}h ${String(dm).padStart(2, '0')}m`
    : '00h 00m';
  const winMs = (close - open) * 60000;
  const progress = isOpen && winMs > 0
    ? Math.round(((close - cur) * 60000 / winMs) * 100)
    : 0;
  return { isOpen, timeLeft, progress };
};

// ── Section Header ────────────────────────────────────────────────────────────
const SectionLabel = ({ icon, text }: { icon: string; text: string }) => (
  <Text style={s.sectionLabel}>{icon}  {text}</Text>
);

// ── Option Button ─────────────────────────────────────────────────────────────
const OptionBtn = ({
  label, sublabel, selected, onPress,
}: {
  label: string; sublabel?: string; selected: boolean; onPress: () => void;
}) => (
  <TouchableOpacity
    style={[s.optBtn, selected && s.optBtnActive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={{ flex: 1 }}>
      <Text style={[s.optLabel, selected && s.optLabelActive]}>{label}</Text>
      {sublabel ? <Text style={s.optSub}>{sublabel}</Text> : null}
    </View>
    {selected && (
      <View style={s.checkCircle}>
        <Text style={s.checkText}>✓</Text>
      </View>
    )}
  </TouchableOpacity>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function BookTripScreen() {
  const router = useRouter();
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedPickupId, setSelectedPickupId] = useState('');
  const [selectedReturn, setSelectedReturn] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [settings, setSettings] = useState<BookingSettings>({
    booking_open_hour: 20, booking_open_minute: 0,
    booking_close_hour: 23, booking_close_minute: 0,
  });
  const [win, setWin] = useState({ isOpen: false, timeLeft: '00h 00m', progress: 0 });
  const [modal, setModal] = useState({ open: false, type: 'success', msg: '' });
  const timer = useRef<any>(null);

  // Fetch data
  useEffect(() => {
    (async () => {
      try {
        const [tripsRes, settingsRes] = await Promise.all([
          Api.get('/trips?date=tomorrow&status=scheduled'),
          Api.get('/settings'),
        ]);
        setAllTrips(tripsRes?.data?.data || tripsRes?.data || []);
        const cfg = settingsRes.data?.data?.settings;
        if (cfg) { setSettings(cfg); setWin(calcWindow(cfg)); }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Timer tick
  useEffect(() => {
    timer.current = setInterval(() => setWin(calcWindow(settings)), 60000);
    return () => clearInterval(timer.current);
  }, [settings]);

  const morningTrips = allTrips.filter(t => t?.time_slot === 'morning');
  const currentTrip  = morningTrips.find(t => t?._id === selectedTripId);
  const pickups      = currentTrip?.route?.stops || [];
  const returns      = currentTrip?.route?._id
    ? allTrips.filter(t => t?.route?._id === currentTrip.route?._id && t?.time_slot !== 'morning')
    : [];

  const handleBook = async () => {
    if (!selectedPickupId || !selectedReturn || isBooking) return;
    setIsBooking(true);
    try {
      const res = await Api.post('/bookings', {
        trip_id: selectedTripId,
        pickup_point: selectedPickupId,
        return_time: selectedReturn,
      });
      setModal({ open: true, type: 'success', msg: res?.data?.message || 'Your seat has been reserved!' });
      setSelectedTripId(''); setSelectedPickupId(''); setSelectedReturn('');
      setTimeout(() => { setModal(m => ({ ...m, open: false })); router.push('/(student)/my-trips'); }, 2200);
    } catch (err: any) {
      setModal({ open: true, type: 'error', msg: err?.response?.data?.message || 'Failed to book trip.' });
    } finally {
      setIsBooking(false);
    }
  };

  const canBook = !!selectedPickupId && !!selectedReturn && !isBooking && win.isOpen;

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#f7a01b" />
        <Text style={s.loadingTxt}>Loading Trips...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerSub}>STUDENT PORTAL</Text>
        <Text style={s.headerTitle}>Book <Text style={s.accent}>Trip</Text></Text>
        <Text style={s.headerDesc}>Reserve your seat for tomorrow's trips</Text>
      </View>

      {/* ── Booking Window Card ── */}
      <View style={s.card}>
        <View style={s.cardTopRow}>
          <SectionLabel icon="📅" text="BOOKING WINDOW" />
          <View style={[s.badge, win.isOpen ? s.badgeOpen : s.badgeClosed]}>
            <Text style={[s.badgeTxt, win.isOpen ? s.badgeTxtOpen : s.badgeTxtClosed]}>
              {win.isOpen ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>
        </View>
        <View style={s.winRow}>
          <View>
            <Text style={s.winState}>{win.isOpen ? 'Time remaining' : 'Currently closed'}</Text>
            <Text style={s.winHours}>
              {formatTime(settings.booking_open_hour, settings.booking_open_minute)}
              {' — '}
              {formatTime(settings.booking_close_hour, settings.booking_close_minute)}
            </Text>
          </View>
          <Text style={s.timeLeft}>{win.timeLeft}</Text>
        </View>
        <View style={s.progBg}>
          <View style={[s.progFill, { width: `${win.progress}%` as any }]} />
        </View>
      </View>

      {/* ── Select Route ── */}
      <View style={s.card}>
        <SectionLabel icon="🚌" text="SELECT ROUTE" />
        {morningTrips.length === 0 ? (
          <Text style={s.emptyTxt}>No trips available for tomorrow</Text>
        ) : (
          morningTrips.map(trip => (
            <OptionBtn
              key={trip._id}
              label={trip?.route?.name || 'Unknown Route'}
              sublabel={
                [trip?.bus_number, trip?.date ? new Date(trip.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '']
                  .filter(Boolean).join(' · ')
              }
              selected={selectedTripId === trip._id}
              onPress={() => { setSelectedTripId(trip._id); setSelectedPickupId(''); setSelectedReturn(''); }}
            />
          ))
        )}
      </View>

      {/* ── Select Pickup ── */}
      <View style={s.card}>
        <SectionLabel icon="📍" text="SELECT PICKUP POINT" />
        {!selectedTripId ? (
          <Text style={s.emptyTxt}>Please select a route first</Text>
        ) : pickups.length === 0 ? (
          <Text style={s.emptyTxt}>No pickup points found</Text>
        ) : (
          pickups.map(p => (
            <OptionBtn
              key={p._id}
              label={p.name}
              selected={selectedPickupId === p._id}
              onPress={() => setSelectedPickupId(p._id)}
            />
          ))
        )}
      </View>

      {/* ── Select Return ── */}
      <View style={s.card}>
        <SectionLabel icon="🔄" text="SELECT RETURN TIME" />
        {!selectedTripId ? (
          <Text style={s.emptyTxt}>Please select a route first</Text>
        ) : returns.length === 0 ? (
          <Text style={s.emptyTxt}>No return trips available</Text>
        ) : (
          returns.map(rt => (
            <OptionBtn
              key={rt._id}
              label={SLOT_MAP[rt.time_slot] || rt.time_slot}
              selected={selectedReturn === rt.time_slot}
              onPress={() => setSelectedReturn(rt.time_slot)}
            />
          ))
        )}
      </View>

      {/* ── Confirm Button ── */}
      <TouchableOpacity
        style={[s.confirmBtn, !canBook && s.confirmDisabled]}
        onPress={handleBook}
        disabled={!canBook}
        activeOpacity={0.85}
      >
        {isBooking
          ? <ActivityIndicator color="#000" />
          : <Text style={[s.confirmTxt, !canBook && s.confirmTxtDisabled]}>
              {!win.isOpen ? '🔒  Booking Closed' : '🚌  Confirm Booking'}
            </Text>
        }
      </TouchableOpacity>

      {/* ── Modal ── */}
      <Modal visible={modal.open} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <View style={[s.modalIconWrap, modal.type === 'success' ? s.iconOk : s.iconErr]}>
              <Text style={s.modalIconTxt}>{modal.type === 'success' ? '✓' : '!'}</Text>
            </View>
            <Text style={s.modalTitle}>
              {modal.type === 'success' ? 'Booking Confirmed!' : 'Action Failed'}
            </Text>
            <Text style={s.modalMsg}>{modal.msg}</Text>
            <TouchableOpacity
              style={[s.modalBtn, modal.type === 'error' && s.modalBtnErr]}
              onPress={() => {
                setModal(m => ({ ...m, open: false }));
                if (modal.type === 'success') router.push('/(student)/my-trips');
              }}
            >
              <Text style={[s.modalBtnTxt, modal.type === 'error' && { color: '#fff' }]}>
                {modal.type === 'success' ? 'View My Trips' : 'Close & Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const C = {
  bg:       '#0f1115',
  card:     '#1c1e26',
  card2:    '#262a33',
  border:   '#2d3036',
  am:       '#f7a01b',
  mu:       '#8a8d91',
  mu2:      '#555',
  ok:       '#22c55e',
  err:      '#ef4444',
  white:    '#ffffff',
};

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: C.bg },
  scroll:           { padding: 20, paddingBottom: 48 },
  center:           { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:       { color: C.mu, fontSize: 11, fontWeight: '700', letterSpacing: 2 },

  // Header
  header:           { marginBottom: 24 },
  headerSub:        { fontSize: 9, color: C.mu, fontWeight: '700', letterSpacing: 3, marginBottom: 4 },
  headerTitle:      { fontSize: 28, fontWeight: '800', color: C.white, letterSpacing: -0.5 },
  accent:           { color: C.am },
  headerDesc:       { fontSize: 12, color: C.mu, marginTop: 4, fontWeight: '500' },

  // Card
  card:             { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 24, padding: 20, marginBottom: 14 },
  cardTopRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },

  // Section label
  sectionLabel:     { fontSize: 10, color: C.am, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 },

  // Badge
  badge:            { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeOpen:        { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)' },
  badgeClosed:      { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' },
  badgeTxt:         { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  badgeTxtOpen:     { color: C.ok },
  badgeTxtClosed:   { color: C.err },

  // Window
  winRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  winState:         { fontSize: 10, color: C.mu, fontWeight: '700', textTransform: 'uppercase', marginBottom: 3 },
  winHours:         { fontSize: 10, color: C.mu2, fontWeight: '600' },
  timeLeft:         { fontSize: 30, fontWeight: '800', color: C.am },
  progBg:           { height: 6, backgroundColor: C.card2, borderRadius: 10, overflow: 'hidden' },
  progFill:         { height: '100%', backgroundColor: C.am, borderRadius: 10 },

  // Option button
  optBtn:           { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8 },
  optBtnActive:     { backgroundColor: 'rgba(247,160,27,0.08)', borderColor: 'rgba(247,160,27,0.5)' },
  optLabel:         { fontSize: 13, fontWeight: '600', color: C.mu },
  optLabelActive:   { color: C.am, fontWeight: '700' },
  optSub:           { fontSize: 10, color: C.mu2, marginTop: 2, fontWeight: '500' },
  checkCircle:      { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(247,160,27,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(247,160,27,0.4)' },
  checkText:        { color: C.am, fontSize: 12, fontWeight: '700' },

  // Empty
  emptyTxt:         { fontSize: 11, color: C.mu2, fontWeight: '600', textAlign: 'center', paddingVertical: 14, textTransform: 'uppercase', letterSpacing: 1 },

  // Confirm button
  confirmBtn:       { backgroundColor: C.am, borderRadius: 20, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  confirmDisabled:  { backgroundColor: C.card2, borderWidth: 1, borderColor: C.border },
  confirmTxt:       { color: '#000', fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 },
  confirmTxtDisabled: { color: C.mu },

  // Modal
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard:        { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 28, padding: 28, width: '100%', maxWidth: 380, alignItems: 'center' },
  modalIconWrap:    { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 3 },
  iconOk:           { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  iconErr:          { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  modalIconTxt:     { fontSize: 28, fontWeight: '800', color: C.white },
  modalTitle:       { fontSize: 18, fontWeight: '800', color: C.white, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
  modalMsg:         { fontSize: 13, color: C.mu, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalBtn:         { backgroundColor: C.am, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  modalBtnErr:      { backgroundColor: '#2a1a1a', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  modalBtnTxt:      { color: '#000', fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
});