import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal, Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Bus, MapPin, RefreshCw, Lock, Route, ChevronDown } from 'lucide-react-native';
import Api from '../../src/services/api';
import { useThemeColor } from '../../constants/theme';
import TopBar from '../../src/components/TopBar';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stop { _id: string; name: string; }
interface BusRoute { _id: string; name: string; stops: Stop[]; }
interface BookingSettings {
  booking_open_hour: number;
  booking_open_minute: number;
  booking_close_hour: number;
  booking_close_minute: number;
  returnTimeOptions?: string[];
}
interface WindowState {
  isOpen: boolean;
  timeLeft: string;
  progress: number;
}

// ─── calcWindow (Matched with Web Logic) ──────────────────────────────────────
function calcWindow(settings: BookingSettings): WindowState {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = (settings.booking_open_hour || 0) * 60 + (settings.booking_open_minute || 0);
  const closeMinutes = (settings.booking_close_hour || 0) * 60 + (settings.booking_close_minute || 0);

  let isOpen: boolean;
  let minutesRemaining: number;
  let windowDuration: number;

  if (closeMinutes >= openMinutes) {
    isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    minutesRemaining = isOpen ? closeMinutes - currentMinutes : 0;
    windowDuration = closeMinutes - openMinutes;
  } else {
    // Midnight-crossing window
    isOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    if (isOpen) {
      if (currentMinutes >= openMinutes) {
        minutesRemaining = (1440 - currentMinutes) + closeMinutes;
      } else {
        minutesRemaining = closeMinutes - currentMinutes;
      }
    } else {
      minutesRemaining = 0;
    }
    windowDuration = (1440 - openMinutes) + closeMinutes;
  }

  const diffH = Math.floor(minutesRemaining / 60);
  const diffM = minutesRemaining % 60;
  const timeLeft = isOpen
    ? `${String(diffH).padStart(2, '0')}h ${String(diffM).padStart(2, '0')}m`
    : '00h 00m';

  const progress = isOpen && windowDuration > 0
    ? Math.min(100, Math.round((minutesRemaining / windowDuration) * 100))
    : 0;

  return { isOpen, timeLeft, progress };
}

// ─── formatTime ───────────────────────────────────────────────────────────────
function formatTime(hour: number, minute: number): string {
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
}

// ─── Custom Select Component (To mimic Web <select>) ──────────────────────────
const CustomSelectBox = ({ 
  label, value, options, onSelect, placeholder, colors 
}: { 
  label?: string; value: string; options: { id: string; label: string }[]; 
  onSelect: (id: string) => void; placeholder: string; colors: any; 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.id === value)?.label || placeholder;

  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Text style={[s.inputLabel, { color: colors.icon }]}>{label}</Text>}
      <TouchableOpacity
        style={[s.selectBtn, { backgroundColor: colors.background, borderColor: isOpen ? colors.tint : colors.border }]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
        <Text style={[s.selectBtnTxt, { color: value ? colors.text : colors.icon }]}>
          {selectedLabel}
        </Text>
        <ChevronDown size={18} color={value ? colors.tint : colors.icon} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
      </TouchableOpacity>

      {isOpen && (
        <View style={[s.dropdown, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {options.length === 0 ? (
            <Text style={[s.dropdownItemTxt, { color: colors.icon, padding: 16, textAlign: 'center' }]}>No options available</Text>
          ) : (
            options.map((opt, index) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  s.dropdownItem,
                  index < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  value === opt.id && { backgroundColor: `${colors.tint}1A` }
                ]}
                onPress={() => { onSelect(opt.id); setIsOpen(false); }}
              >
                <Text style={[s.dropdownItemTxt, { color: value === opt.id ? colors.tint : colors.text }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookTripScreen() {
  const router = useRouter();
  const colors = useThemeColor();

  const [allRoutes, setAllRoutes]                         = useState<BusRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId]             = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot]           = useState('');
  const [selectedSpecificReturn, setSelectedSpecificReturn] = useState('');
  const [returnTimeOptions, setReturnTimeOptions]         = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    booking_open_hour: 0, booking_open_minute: 0,
    booking_close_hour: 0, booking_close_minute: 0,
  });

  const [windowState, setWindowState] = useState<WindowState>({
    isOpen: false, timeLeft: '--h --m', progress: 0,
  });

  const [modal, setModal] = useState({ open: false, type: 'success', msg: '' });

  const settingsRef = useRef<BookingSettings>(bookingSettings);
  useEffect(() => { settingsRef.current = bookingSettings; }, [bookingSettings]);

  // 1. Primary Data Fetch (Matches Web: every 30s)
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [routesRes, settingsRes] = await Promise.all([
          Api.get('/routes'),
          Api.get('/settings'),
        ]);
        if (!isMounted) return;

        const fetchedRoutes: BusRoute[] = routesRes?.data?.data || routesRes?.data || [];
        setAllRoutes(fetchedRoutes);

        const raw = settingsRes?.data?.data?.settings;
        if (raw) {
          const s: BookingSettings = {
            booking_open_hour: Number(raw.booking_open_hour) || 0,
            booking_open_minute: Number(raw.booking_open_minute) || 0,
            booking_close_hour: Number(raw.booking_close_hour) || 0,
            booking_close_minute: Number(raw.booking_close_minute) || 0,
            returnTimeOptions: raw.returnTimeOptions || ['3:30 PM', '7:00 PM'],
          };
          setBookingSettings(s);
          setReturnTimeOptions(s.returnTimeOptions || ['3:30 PM', '7:00 PM']);
          setWindowState(calcWindow(s));
        }
      } catch (err) {
        console.error('BookTripPage: failed to fetch data', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    const refetchInterval = setInterval(fetchData, 30000);
    return () => { isMounted = false; clearInterval(refetchInterval); };
  }, []);

  // 2. Clock Tick (Matches Web: every 10s)
  useEffect(() => {
    const tick = setInterval(() => {
      setWindowState(calcWindow(settingsRef.current));
    }, 10000);
    return () => clearInterval(tick);
  }, []);

  const handleConfirm = async () => {
    if (isBooking) return;
    setIsBooking(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const payload = {
        routeId: selectedRouteId,
        date: dateString,
        timeSlot: selectedTimeSlot,
        specificReturnTime: selectedTimeSlot === 'Return' ? selectedSpecificReturn : undefined,
      };
      
      const res = await Api.post('/bookings', payload);
      setModal({ open: true, type: 'success', msg: res?.data?.message || 'Your booking demand is registered successfully.' });
      setSelectedRouteId('');
      setSelectedTimeSlot('');
      setSelectedSpecificReturn('');
    } catch (err: any) {
      setModal({ open: true, type: 'error', msg: err?.response?.data?.message || 'Failed to submit booking demand. Please try again.' });
    } finally {
      setIsBooking(false);
    }
  };

  const canBook =
    !!selectedRouteId &&
    !!selectedTimeSlot &&
    (selectedTimeSlot !== 'Return' || !!selectedSpecificReturn) &&
    !isBooking &&
    windowState.isOpen;

  if (isLoading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[s.loadingTxt, { color: colors.icon }]}>LOADING SYSTEM...</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      <TopBar
        title="Book Trip"
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(student)/settings' as any)}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={[s.headerTitle, { color: colors.text }]}>BOOK ROUTE</Text>
          <Text style={[s.headerSub, { color: colors.icon }]}>Register your demand for tomorrow's buses</Text>
        </View>

        {/* SELECT ROUTE CARD */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <Route size={14} color={colors.tint} />
            <Text style={[s.sectionLabel, { color: colors.tint }]}>SELECT ROUTE</Text>
          </View>
          <CustomSelectBox
            value={selectedRouteId}
            options={allRoutes.map(r => ({ id: r._id, label: r.name }))}
            onSelect={(id) => { setSelectedRouteId(id); setSelectedTimeSlot(''); setSelectedSpecificReturn(''); }}
            placeholder="Choose a route..."
            colors={colors}
          />
        </View>

        {/* SELECT TIME SLOT CARD */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <Calendar size={14} color={colors.text} />
            <Text style={[s.sectionLabel, { color: colors.text }]}>SELECT TIME SLOT</Text>
          </View>
          
          <View style={s.slotGrid}>
            {['Morning', 'Return'].map(slot => {
              const isSel = selectedTimeSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[
                    s.slotBtn,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    isSel && { backgroundColor: `${colors.tint}1A`, borderColor: colors.tint }
                  ]}
                  onPress={() => { setSelectedTimeSlot(slot); setSelectedSpecificReturn(''); }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    s.slotTxt,
                    { color: colors.icon },
                    isSel && { color: colors.tint }
                  ]}>
                    {slot.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedTimeSlot === 'Return' && (
            <View style={[s.returnSection, { borderTopColor: colors.border }]}>
              <View style={s.sectionHeader}>
                <RefreshCw size={14} color={colors.tint} />
                <Text style={[s.sectionLabel, { color: colors.tint }]}>SELECT RETURN TIME</Text>
              </View>
              <CustomSelectBox
                value={selectedSpecificReturn}
                options={returnTimeOptions.map(rt => ({ id: rt, label: rt }))}
                onSelect={(id) => setSelectedSpecificReturn(id)}
                placeholder="Choose return time..."
                colors={colors}
              />
            </View>
          )}
        </View>

        {/* BOOKING WINDOW CARD */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, overflow: 'hidden' }]}>
          {/* Subtle Glow Emulation */}
          <View style={[s.glowCircle, { backgroundColor: `${colors.tint}0A` }]} />
          
          <View style={s.cardTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} color={colors.tint} />
              <Text style={[s.sectionLabel, { color: colors.tint }]}>BOOKING WINDOW</Text>
            </View>
            <View style={[s.badge, windowState.isOpen ? s.badgeOpen : s.badgeClosed]}>
              <Text style={[s.badgeTxt, windowState.isOpen ? { color: '#22c55e' } : { color: '#ef4444' }]}>
                {windowState.isOpen ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>
          </View>

          <View style={s.winRow}>
            <View>
              <Text style={[s.winState, { color: colors.icon }]}>
                {windowState.isOpen ? 'TIME REMAINING' : 'CURRENTLY CLOSED'}
              </Text>
              <Text style={[s.winHours, { color: colors.icon }]}>
                {formatTime(bookingSettings.booking_open_hour, bookingSettings.booking_open_minute)}
                {' — '}
                {formatTime(bookingSettings.booking_close_hour, bookingSettings.booking_close_minute)}
              </Text>
            </View>
            <Text style={[s.timeLeft, { color: colors.tint }]}>{windowState.timeLeft}</Text>
          </View>
          
          <View style={[s.progBg, { backgroundColor: colors.background }]}>
            <View style={[s.progFill, { width: `${windowState.progress}%` as any, backgroundColor: colors.tint }]} />
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            s.confirmBtn,
            { backgroundColor: colors.tint },
            !canBook && { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, opacity: 0.5 },
          ]}
          onPress={handleConfirm}
          disabled={!canBook}
          activeOpacity={0.85}
        >
          {isBooking ? (
            <ActivityIndicator color="#000" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {!windowState.isOpen
                ? <><Lock size={16} color={colors.icon} /><Text style={[s.confirmTxt, { color: colors.icon }]}>BOOKING CLOSED</Text></>
                : <><Bus size={16} color="#000" /><Text style={s.confirmTxt}>REGISTER BOOKING DEMAND</Text></>
              }
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Result Modal */}
      <Modal visible={modal.open} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.modalIconWrap, modal.type === 'success' ? s.iconOk : s.iconErr]}>
              <Text style={[s.modalIconTxt, modal.type === 'success' ? { color: '#22c55e' } : { color: '#ef4444' }]}>
                {modal.type === 'success' ? '✓' : '!'}
              </Text>
            </View>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              {modal.type === 'success' ? 'DEMAND REGISTERED' : 'ACTION FAILED'}
            </Text>
            <Text style={[s.modalMsg, { color: colors.icon }]}>{modal.msg}</Text>
            <TouchableOpacity
              style={[
                s.modalBtn,
                { backgroundColor: modal.type === 'success' ? colors.tint : colors.background, borderColor: modal.type === 'success' ? 'transparent' : 'rgba(239,68,68,0.3)', borderWidth: 1 },
              ]}
              onPress={() => {
                setModal(m => ({ ...m, open: false }));
                if (modal.type === 'success') router.push('/(student)/my-trips');
              }}
            >
              <Text style={[s.modalBtnTxt, modal.type === 'error' && { color: '#ef4444' }]}>
                {modal.type === 'success' ? 'VIEW MY TRIPS' : 'CLOSE & TRY AGAIN'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:          { flex: 1 },
  scroll:        { padding: 20, paddingTop: 16 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:    { fontSize: 10, fontWeight: '900', letterSpacing: 2 },

  header:        { marginBottom: 24 },
  headerTitle:   { fontSize: 28, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5 },
  headerSub:     { fontSize: 11, fontWeight: '600', marginTop: 4 },

  card:          { borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionLabel:  { fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },

  // Dropdown Styles
  inputLabel:    { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  selectBtn:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20 },
  selectBtnTxt:  { fontSize: 13, fontWeight: '800' },
  dropdown:      { borderWidth: 1, borderRadius: 16, marginTop: 8, overflow: 'hidden' },
  dropdownItem:  { paddingVertical: 16, paddingHorizontal: 20 },
  dropdownItemTxt:{ fontSize: 13, fontWeight: '700' },

  // Slot Grid
  slotGrid:      { flexDirection: 'row', gap: 12 },
  slotBtn:       { flex: 1, paddingVertical: 18, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  slotTxt:       { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  returnSection: { borderTopWidth: 1, marginTop: 20, paddingTop: 20 },

  // Booking Window Card
  glowCircle:    { position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 60, opacity: 0.8 },
  cardTopRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  badge:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  badgeOpen:     { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  badgeClosed:   { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  badgeTxt:      { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },

  winRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  winState:      { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 },
  winHours:      { fontSize: 10, fontWeight: '700' },
  timeLeft:      { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  progBg:        { height: 8, borderRadius: 10, overflow: 'hidden' },
  progFill:      { height: '100%', borderRadius: 10 },

  // Confirm Button
  confirmBtn:    { borderRadius: 24, paddingVertical: 20, alignItems: 'center', marginTop: 8 },
  confirmTxt:    { color: '#000', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2.5 },

  // Modal
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard:     { borderWidth: 1, borderRadius: 28, padding: 32, width: '100%', maxWidth: 360, alignItems: 'center' },
  modalIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 4 },
  iconOk:        { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)' },
  iconErr:       { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' },
  modalIconTxt:  { fontSize: 36, fontWeight: '900' },
  modalTitle:    { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, textAlign: 'center' },
  modalMsg:      { fontSize: 12, textAlign: 'center', marginBottom: 28, lineHeight: 20, fontWeight: '500' },
  modalBtn:      { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  modalBtnTxt:   { color: '#000', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
});