import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bus, Clock, Calendar, Users, MapPin,
  AlertCircle, Filter, X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useThemeColor } from '../../constants/theme';
import TopBar from '../../src/components/TopBar';
import Api from '../../src/services/api';

interface TripRecord {
  _id: string;
  date: string;
  time_slot: string;
  status: string;
  usersCount?: number;
  route?: { name: string };
  bus?: { busCode: string };
  bus_number?: string;
}

const getStatusColors = (status: string) => {
  if (status === 'completed')
    return { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',  text: '#22c55e' };
  if (status === 'active' || status === 'in-progress' || status === 'in_progress')
    return { bg: 'rgba(247,160,27,0.1)',  border: 'rgba(247,160,27,0.25)', text: '#f7a01b' };
  if (status === 'cancelled')
    return { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',  text: '#ef4444' };
  if (status === 'scheduled')
    return { bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)', text: '#60a5fa' };
  return { bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)', text: '#9ca3af' };
};

const FilterChip = ({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: any }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[s.chip, active
      ? { backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}4D` }
      : { backgroundColor: colors.background, borderColor: colors.border }
    ]}
  >
    <Text style={[s.chipTxt, { color: active ? colors.tint : colors.icon }]}>{label}</Text>
  </TouchableOpacity>
);

const TripRow = ({ trip, colors }: { trip: TripRecord; colors: any }) => {
  const { t } = useTranslation();
  const sc = getStatusColors(trip.status);
  const busCode = trip.bus?.busCode || trip.bus_number || '—';

  const TIME_SLOT_LABEL: Record<string, string> = {
    morning:     t('morning_shift'),
    return_1530: t('return_1530_shift'),
    return_1900: t('return_1900_shift'),
  };

  return (
    <View style={[s.tripRow, { borderBottomColor: colors.border }]}>
      <View style={s.tripRowLeft}>
        <Text style={[s.tripDate, { color: colors.text }]}>
          {new Date(trip.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
        <View style={s.tripMeta}>
          <MapPin size={11} color="#f7a01b" />
          <Text style={[s.tripRoute, { color: colors.icon }]} numberOfLines={1}>{trip.route?.name || '—'}</Text>
        </View>
        <View style={s.tripMeta}>
          <Bus size={11} color={colors.icon} />
          <Text style={[s.tripBus, { color: colors.icon }]}>{busCode}</Text>
        </View>
      </View>
      <View style={s.tripRowRight}>
        <View style={[s.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <Text style={[s.statusTxt, { color: sc.text }]}>{trip.status.replace(/[-_]/g, ' ').toUpperCase()}</Text>
        </View>
        <Text style={[s.tripSlot, { color: colors.icon }]} numberOfLines={1}>
          {TIME_SLOT_LABEL[trip.time_slot] ?? trip.time_slot}
        </Text>
        <View style={s.tripMeta}>
          <Users size={11} color={colors.icon} />
          <Text style={[s.tripBus, { color: colors.icon }]}>{trip.usersCount ?? 0} {t('booked_students')}</Text>
        </View>
      </View>
    </View>
  );
};

export default function DriverHistoryScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { t }  = useTranslation();

  const [trips, setTrips]         = useState<TripRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState('');

  const [dateFilter, setDateFilter]               = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker]       = useState(false);
  const [timeSlotFilter, setTimeSlotFilter]       = useState('All');
  const [returnTimeFilter, setReturnTimeFilter]   = useState('All');

  const hasActiveFilter = !!dateFilter || timeSlotFilter !== 'All';

  const TIME_SLOT_OPTIONS = [
    { label: t('all'),             value: 'All' },
    { label: t('morning'),         value: 'Morning' },
    { label: t('return'),          value: 'Return' },
  ];

  const RETURN_TIME_OPTIONS = [
    { label: t('all_times'), value: 'All' },
    { label: t('time_1530'), value: '15:30' },
    { label: t('time_1900'), value: '19:00' },
  ];

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.append('date', dateFilter.toISOString().split('T')[0]);
      if (timeSlotFilter !== 'All') params.append('timeSlot', timeSlotFilter);
      if (timeSlotFilter === 'Return' && returnTimeFilter !== 'All') {
        params.append('specificReturnTime', returnTimeFilter);
      }
      const res = await Api.get(`/trips/my-history?${params.toString()}`);
      setTrips(res.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('load_trips_failed'));
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, timeSlotFilter, returnTimeFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleClearFilters = () => {
    setDateFilter(null);
    setTimeSlotFilter('All');
    setReturnTimeFilter('All');
  };

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selected) setDateFilter(selected);
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <TopBar
        title={t('trip_history')}
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(driver)/settings' as any)}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Page Header */}
        <View style={s.pageHeader}>
          <Text style={[s.pageTitle, { color: colors.text }]}>
            {t('trip_history').split(' ')[0].toUpperCase()}{' '}
            <Text style={{ color: colors.tint }}>{t('trip_history').split(' ').slice(1).join(' ').toUpperCase()}</Text>
          </Text>
          <Text style={[s.pageSubtitle, { color: colors.icon }]}>{t('view_past_trips').toUpperCase()}</Text>
        </View>

        {/* Filters */}
        <View style={[s.filtersCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.filterHeader}>
            <Filter size={13} color={colors.icon} />
            <Text style={[s.filterTitle, { color: colors.icon }]}>{t('clear_filters').toUpperCase()}</Text>
            {hasActiveFilter && (
              <TouchableOpacity onPress={handleClearFilters} style={s.clearBtn} activeOpacity={0.7}>
                <X size={12} color="#ef4444" />
                <Text style={s.clearTxt}>{t('clear_filters').toUpperCase()}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Date */}
          <View style={s.filterSection}>
            <Text style={[s.filterLabel, { color: colors.icon }]}>{t('date').toUpperCase()}</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[s.datePicker, { backgroundColor: colors.background, borderColor: dateFilter ? `${colors.tint}4D` : colors.border }]}
              activeOpacity={0.8}
            >
              <Calendar size={14} color={dateFilter ? colors.tint : colors.icon} />
              <Text style={[s.datePickerTxt, { color: dateFilter ? colors.tint : colors.icon }]}>
                {dateFilter
                  ? dateFilter.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : t('today')}
              </Text>
              {dateFilter && (
                <TouchableOpacity onPress={() => setDateFilter(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={12} color={colors.icon} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker value={dateFilter ?? new Date()} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} />
            )}
          </View>

          {/* Time Slot */}
          <View style={s.filterSection}>
            <Text style={[s.filterLabel, { color: colors.icon }]}>{t('time_slot').toUpperCase()}</Text>
            <View style={s.chipsRow}>
              {TIME_SLOT_OPTIONS.map(opt => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  active={timeSlotFilter === opt.value}
                  colors={colors}
                  onPress={() => { setTimeSlotFilter(opt.value); if (opt.value !== 'Return') setReturnTimeFilter('All'); }}
                />
              ))}
            </View>
          </View>

          {/* Return Time */}
          {timeSlotFilter === 'Return' && (
            <View style={s.filterSection}>
              <Text style={[s.filterLabel, { color: colors.icon }]}>{t('return_time').toUpperCase()}</Text>
              <View style={s.chipsRow}>
                {RETURN_TIME_OPTIONS.map(opt => (
                  <FilterChip key={opt.value} label={opt.label} active={returnTimeFilter === opt.value} colors={colors} onPress={() => setReturnTimeFilter(opt.value)} />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Results */}
        <View style={[s.resultsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {isLoading && (
            <View style={s.stateWrap}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[s.stateTxt, { color: colors.icon }]}>{t('loading_trips').toUpperCase()}</Text>
            </View>
          )}

          {!isLoading && !!error && (
            <View style={s.stateWrap}>
              <AlertCircle size={36} color="#ef4444" style={{ marginBottom: 12, opacity: 0.8 }} />
              <Text style={[s.stateTxt, { color: '#ef4444' }]}>{error}</Text>
            </View>
          )}

          {!isLoading && !error && trips.length === 0 && (
            <View style={[s.stateWrap, { opacity: 0.5 }]}>
              <Clock size={40} color={colors.icon} style={{ marginBottom: 12 }} />
              <Text style={[s.stateTxt, { color: colors.icon }]}>{t('no_trips_found').toUpperCase()}</Text>
            </View>
          )}

          {!isLoading && !error && trips.length > 0 && (
            <>
              <View style={[s.resultsHeader, { borderBottomColor: colors.border }]}>
                <Text style={[s.resultsCount, { color: colors.text }]}>
                  <Text style={{ color: colors.tint }}>{trips.length}</Text> {t('trip_history').toUpperCase()}
                </Text>
              </View>
              <View style={[s.colHeader, { borderBottomColor: colors.border, backgroundColor: `${colors.background}4D` }]}>
                <Text style={[s.colTxt, { color: colors.icon, flex: 1.2 }]}>{t('date').toUpperCase()} / {t('route').toUpperCase()}</Text>
                <Text style={[s.colTxt, { color: colors.icon, flex: 1, textAlign: 'right' }]}>{t('slot').toUpperCase()} / {t('status').toUpperCase()}</Text>
              </View>
              {trips.map(trip => <TripRow key={trip._id} trip={trip} colors={colors} />)}
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { padding: 20, paddingTop: 16 },
  pageHeader:   { marginBottom: 20 },
  pageTitle:    { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  pageSubtitle: { fontSize: 9, fontWeight: '700', letterSpacing: 3 },
  filtersCard:   { borderWidth: 1, borderRadius: 24, padding: 18, marginBottom: 14, gap: 16 },
  filterHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterTitle:   { fontSize: 9, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', flex: 1 },
  clearBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearTxt:      { fontSize: 9, fontWeight: '900', color: '#ef4444', letterSpacing: 1 },
  filterSection: { gap: 8 },
  filterLabel:   { fontSize: 8, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  datePicker:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  datePickerTxt: { fontSize: 12, fontWeight: '700', flex: 1 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipTxt:  { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  resultsCard:   { borderWidth: 1, borderRadius: 24, overflow: 'hidden', marginBottom: 14, minHeight: 200 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  resultsCount:  { fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  colHeader: { flexDirection: 'row', paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 1 },
  colTxt:    { fontSize: 8, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  tripRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  tripRowLeft:  { flex: 1.2, gap: 4 },
  tripRowRight: { flex: 1, alignItems: 'flex-end', gap: 5 },
  tripDate:  { fontSize: 12, fontWeight: '800' },
  tripMeta:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tripRoute: { fontSize: 10, fontWeight: '600', flex: 1 },
  tripBus:   { fontSize: 10, fontWeight: '600' },
  tripSlot:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusTxt:   { fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  stateWrap: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  stateTxt:  { fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' },
});