import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Bus, MapPin, RefreshCw, Lock, Route } from 'lucide-react-native';
import Api from '../../src/services/api';
import { useThemeColor } from '../../constants/theme';
import TopBar from '../../src/components/TopBar';

interface Stop { _id: string; name: string; }
interface Route { _id: string; name: string; stops: Stop[]; }
interface BookingSettings {
  booking_open_hour: number;
  booking_open_minute: number;
  booking_close_hour: number;
  booking_close_minute: number;
  returnTimeOptions?: string[];
}

const formatTime = (h: number, m: number) => {
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const calcWindow = (s: BookingSettings) => {
  const now   = new Date();
  const cur   = now.getHours() * 60 + now.getMinutes();
  const open  = s.booking_open_hour  * 60 + s.booking_open_minute;
  const close = s.booking_close_hour * 60 + s.booking_close_minute;
  const isOpen  = cur >= open && cur <= close;
  const diffMs  = isOpen ? (close - cur) * 60000 : 0;
  const dh      = Math.floor(diffMs / 3600000);
  const dm      = Math.floor((diffMs % 3600000) / 60000);
  const timeLeft = isOpen ? `${String(dh).padStart(2, '0')}h ${String(dm).padStart(2, '0')}m` : '00h 00m';
  const winMs    = (close - open) * 60000;
  const progress = isOpen && winMs > 0 ? Math.round(((close - cur) * 60000 / winMs) * 100) : 0;
  return { isOpen, timeLeft, progress };
};

const SECTION_ICONS: Record<string, any> = {
  'BOOKING WINDOW':    Calendar,
  'SELECT ROUTE':      Route,
  'SELECT TIME SLOT':  Calendar,
  'SELECT RETURN TIME': RefreshCw,
};

const SectionLabel = ({ text, tint }: { text: string; tint: string }) => {
  const Icon = SECTION_ICONS[text];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      {Icon && <Icon size={14} color={tint} />}
      <Text style={[s.sectionLabel, { color: tint }]}>{text}</Text>
    </View>
  );
};

const OptionBtn = ({
  label, sublabel, selected, onPress, colors,
}: {
  label: string; sublabel?: string; selected: boolean; onPress: () => void; colors: any;
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
    <View style={{ flex: 1 }}>
      <Text style={[s.optLabel, { color: colors.icon }, selected && { color: colors.tint, fontWeight: '700' }]}>
        {label}
      </Text>
      {sublabel ? <Text style={[s.optSub, { color: colors.icon }]}>{sublabel}</Text> : null}
    </View>
    {selected && (
      <View style={[s.checkCircle, { backgroundColor: `${colors.tint}26`, borderColor: `${colors.tint}66` }]}>
        <Text style={[s.checkText, { color: colors.tint }]}>✓</Text>
      </View>
    )}
  </TouchableOpacity>
);

export default function BookTripScreen() {
  const router  = useRouter();
  const colors  = useThemeColor();

  const [allRoutes, setAllRoutes]                         = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId]             = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot]           = useState('');
  const [selectedSpecificReturn, setSelectedSpecificReturn] = useState('');
  const [returnTimeOptions, setReturnTimeOptions]         = useState<string[]>([]);
  const [isLoading, setIsLoading]                         = useState(true);
  const [isBooking, setIsBooking]                         = useState(false);
  const [settings, setSettings]                           = useState<BookingSettings>({
    booking_open_hour: 20, booking_open_minute: 0,
    booking_close_hour: 23, booking_close_minute: 0,
  });
  const [win, setWin]     = useState({ isOpen: false, timeLeft: '00h 00m', progress: 0 });
  const [modal, setModal] = useState({ open: false, type: 'success', msg: '' });
  const timer             = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const [routesRes, settingsRes] = await Promise.all([
          Api.get('/routes'),
          Api.get('/settings'),
        ]);
        const fetchedRoutes: Route[] = routesRes?.data?.data || routesRes?.data || [];
        setAllRoutes(fetchedRoutes);
        const cfg = settingsRes.data?.data?.settings;
        if (cfg) {
          setSettings(cfg);
          setReturnTimeOptions(cfg.returnTimeOptions || ['3:30 PM', '7:00 PM']);
          setWin(calcWindow(cfg));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    timer.current = setInterval(() => setWin(calcWindow(settings)), 60000);
    return () => clearInterval(timer.current);
  }, [settings]);

  const handleConfirm = async () => {
    if (isBooking) return;
    setIsBooking(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const payload = {
        routeId:            selectedRouteId,
        date:               dateString,
        timeSlot:           selectedTimeSlot,
        specificReturnTime: selectedTimeSlot === 'Return' ? selectedSpecificReturn : undefined,
      };
      const res = await Api.post('/bookings', payload);
      setModal({ open: true, type: 'success', msg: res?.data?.message || 'Your booking demand is registered. You will be notified of your bus assignment once the booking window closes.' });
      setSelectedRouteId('');
      setSelectedTimeSlot('');
      setSelectedSpecificReturn('');
      setTimeout(() => { setModal(m => ({ ...m, open: false })); router.push('/(student)/my-trips'); }, 2200);
    } catch (err: any) {
      setModal({ open: true, type: 'error', msg: err?.response?.data?.message || 'Failed to submit booking demand. Please try again.' });
    } finally {
      setIsBooking(false);
    }
  };

  const canBook =
    !!selectedRouteId &&
    !!selectedTimeSlot &&
    (selectedTimeSlot === 'Morning' || !!selectedSpecificReturn) &&
    !isBooking &&
    win.isOpen;

  if (isLoading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[s.loadingTxt, { color: colors.icon }]}>Loading...</Text>
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
          <Text style={[s.headerTitle, { color: colors.text }]}>
            Book <Text style={{ color: colors.tint }}>Route</Text>
          </Text>
          <Text style={[s.headerSub, { color: colors.icon }]}>Register your demand for tomorrow's buses</Text>
        </View>

        {/* Booking Window */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.cardTopRow}>
            <SectionLabel text="BOOKING WINDOW" tint={colors.tint} />
            <View style={[s.badge, win.isOpen ? s.badgeOpen : s.badgeClosed]}>
              <Text style={[s.badgeTxt, win.isOpen ? { color: '#22c55e' } : { color: '#ef4444' }]}>
                {win.isOpen ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>
          </View>
          <View style={s.winRow}>
            <View>
              <Text style={[s.winState, { color: colors.icon }]}>{win.isOpen ? 'Time remaining' : 'Currently closed'}</Text>
              <Text style={[s.winHours, { color: colors.icon }]}>
                {formatTime(settings.booking_open_hour, settings.booking_open_minute)}
                {' — '}
                {formatTime(settings.booking_close_hour, settings.booking_close_minute)}
              </Text>
            </View>
            <Text style={[s.timeLeft, { color: colors.tint }]}>{win.timeLeft}</Text>
          </View>
          <View style={[s.progBg, { backgroundColor: colors.background }]}>
            <View style={[s.progFill, { width: `${win.progress}%` as any, backgroundColor: colors.tint }]} />
          </View>
        </View>

        {/* Select Route */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SectionLabel text="SELECT ROUTE" tint={colors.tint} />
          {allRoutes.length === 0 ? (
            <Text style={[s.emptyTxt, { color: colors.icon }]}>No routes available</Text>
          ) : (
            allRoutes.map(route => (
              <OptionBtn
                key={route._id}
                label={route.name}
                selected={selectedRouteId === route._id}
                onPress={() => {
                  setSelectedRouteId(route._id);
                  setSelectedTimeSlot('');
                  setSelectedSpecificReturn('');
                }}
                colors={colors}
              />
            ))
          )}
        </View>

        {/* Select Time Slot */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SectionLabel text="SELECT TIME SLOT" tint={colors.tint} />
          <View style={s.slotRow}>
            {['Morning', 'Return'].map(slot => (
              <TouchableOpacity
                key={slot}
                style={[
                  s.slotBtn,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  selectedTimeSlot === slot && { backgroundColor: `${colors.tint}14`, borderColor: `${colors.tint}80` },
                ]}
                onPress={() => { setSelectedTimeSlot(slot); setSelectedSpecificReturn(''); }}
                activeOpacity={0.8}
              >
                <Text style={[
                  s.slotTxt,
                  { color: colors.icon },
                  selectedTimeSlot === slot && { color: colors.tint, fontWeight: '700' },
                ]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Select Return Time (shown only when Return is selected) */}
          {selectedTimeSlot === 'Return' && (
            <View style={[s.returnSection, { borderTopColor: colors.border }]}>
              <SectionLabel text="SELECT RETURN TIME" tint={colors.tint} />
              {returnTimeOptions.length === 0 ? (
                <Text style={[s.emptyTxt, { color: colors.icon }]}>No return times available</Text>
              ) : (
                returnTimeOptions.map(rt => (
                  <OptionBtn
                    key={rt}
                    label={rt}
                    selected={selectedSpecificReturn === rt}
                    onPress={() => setSelectedSpecificReturn(rt)}
                    colors={colors}
                  />
                ))
              )}
            </View>
          )}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            s.confirmBtn,
            { backgroundColor: colors.tint },
            !canBook && { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
          ]}
          onPress={handleConfirm}
          disabled={!canBook}
          activeOpacity={0.85}
        >
          {isBooking ? (
            <ActivityIndicator color="#000" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {!win.isOpen
                ? <><Lock size={14} color={colors.icon} /><Text style={[s.confirmTxt, { color: colors.icon }]}>Booking Closed</Text></>
                : <><Bus size={14} color="#000" /><Text style={s.confirmTxt}>Register Booking Demand</Text></>
              }
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal */}
      <Modal visible={modal.open} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.modalIconWrap, modal.type === 'success' ? s.iconOk : s.iconErr]}>
              <Text style={[s.modalIconTxt, { color: colors.text }]}>{modal.type === 'success' ? '✓' : '!'}</Text>
            </View>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              {modal.type === 'success' ? 'Demand Registered!' : 'Action Failed'}
            </Text>
            <Text style={[s.modalMsg, { color: colors.icon }]}>{modal.msg}</Text>
            <TouchableOpacity
              style={[
                s.modalBtn,
                { backgroundColor: colors.tint },
                modal.type === 'error' && { backgroundColor: colors.background, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
              ]}
              onPress={() => {
                setModal(m => ({ ...m, open: false }));
                if (modal.type === 'success') router.push('/(student)/my-trips');
              }}
            >
              <Text style={[s.modalBtnTxt, modal.type === 'error' && { color: '#ef4444' }]}>
                {modal.type === 'success' ? 'View My Trips' : 'Close & Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },
  scroll:        { padding: 20, paddingTop: 16 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:    { fontSize: 11, fontWeight: '700', letterSpacing: 2 },

  header:        { marginBottom: 20 },
  headerTitle:   { fontSize: 24, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5 },
  headerSub:     { fontSize: 12, fontWeight: '500', marginTop: 4 },

  card:          { borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 14 },
  cardTopRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionLabel:  { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },

  badge:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeOpen:     { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)' },
  badgeClosed:   { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' },
  badgeTxt:      { fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  winRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  winState:      { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 3 },
  winHours:      { fontSize: 10, fontWeight: '600' },
  timeLeft:      { fontSize: 30, fontWeight: '800' },
  progBg:        { height: 6, borderRadius: 10, overflow: 'hidden' },
  progFill:      { height: '100%', borderRadius: 10 },

  optBtn:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8 },
  optLabel:      { fontSize: 13, fontWeight: '600' },
  optSub:        { fontSize: 10, marginTop: 2, fontWeight: '500' },
  checkCircle:   { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  checkText:     { fontSize: 12, fontWeight: '700' },
  emptyTxt:      { fontSize: 11, fontWeight: '600', textAlign: 'center', paddingVertical: 14, textTransform: 'uppercase', letterSpacing: 1 },

  slotRow:       { flexDirection: 'row', gap: 10 },
  slotBtn:       { flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  slotTxt:       { fontSize: 13, fontWeight: '600' },

  returnSection: { borderTopWidth: 1, marginTop: 16, paddingTop: 16 },

  confirmBtn:    { borderRadius: 20, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  confirmTxt:    { color: '#000', fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 },

  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard:     { borderWidth: 1, borderRadius: 28, padding: 28, width: '100%', maxWidth: 380, alignItems: 'center' },
  modalIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 3 },
  iconOk:        { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  iconErr:       { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  modalIconTxt:  { fontSize: 28, fontWeight: '800' },
  modalTitle:    { fontSize: 18, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
  modalMsg:      { fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalBtn:      { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  modalBtnTxt:   { color: '#000', fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
});