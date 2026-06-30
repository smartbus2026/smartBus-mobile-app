// app/(admin)/reports.tsx
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Modal, Platform, ScrollView,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {
  Bus, Calendar, CheckCircle, Clock,
  Filter, MapPin, Users, X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';

interface DashboardData {
  totalUsers: number; totalTrips: number; activeTrips: number; totalBookings: number;
}

export default function AdminReportsScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();

  const [dashData, setDashData]           = useState<DashboardData | null>(null);
  const [isDashLoading, setIsDashLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];
  const [filters, setFilters]             = useState({ date: todayStr, routeId: '', busId: '', timeSlot: '', specificReturnTime: '' });
  const [tempFilters, setTempFilters]     = useState(filters);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [routes, setRoutes]               = useState<any[]>([]);
  const [buses, setBuses]                 = useState<any[]>([]);
  const [bookings, setBookings]           = useState<any[]>([]);
  const [stats, setStats]                 = useState({ completed: 0, missed: 0, total: 0, rate: 0 });
  const [isReportLoading, setIsReportLoading] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [dashRes, rRes, bRes] = await Promise.all([
          api.get('/reports/dashboard-stats'),
          api.get('/routes').catch(() => ({ data: { data: [] } })),
          api.get('/tracking/buses').catch(() => ({ data: { data: { buses: [] } } })),
        ]);
        setDashData(dashRes.data);
        setRoutes(rRes.data?.data || rRes.data || []);
        setBuses(bRes.data?.data?.buses || bRes.data?.buses || bRes.data?.data || []);
      } catch (err) { console.log('Failed to fetch initial data', err); }
      finally { setIsDashLoading(false); }
    };
    fetchInitialData();
  }, []);

  const fetchReport = useCallback(async () => {
    setIsReportLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date) params.set('date', filters.date);
      if (filters.routeId) params.set('routeId', filters.routeId);
      if (filters.busId) params.set('busId', filters.busId);
      if (filters.timeSlot) params.set('timeSlot', filters.timeSlot);
      if (filters.timeSlot === 'Return' && filters.specificReturnTime) params.set('specificReturnTime', filters.specificReturnTime);
      const res = await api.get(`/reports/attendance?${params.toString()}`);
      setBookings(res.data?.data?.bookings || []);
      setStats(res.data?.data?.stats || { completed: 0, missed: 0, total: 0, rate: 0 });
    } catch { setBookings([]); }
    finally { setIsReportLoading(false); }
  }, [filters]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const applyFilters  = () => { setFilters(tempFilters); setIsFilterModalOpen(false); };
  const clearFilters  = () => {
    const cleared = { date: todayStr, routeId: '', busId: '', timeSlot: '', specificReturnTime: '' };
    setTempFilters(cleared); setFilters(cleared); setIsFilterModalOpen(false);
  };
  const activeFiltersCount = Object.values(filters).filter(v => v !== '' && v !== todayStr).length + (filters.date ? 1 : 0);

  if (isDashLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar title="System Reports" showMenu showSettings onSettingsPress={() => router.push('/(admin)/settings' as any)} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>LOADING...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="System Reports" showMenu showSettings onSettingsPress={() => router.push('/(admin)/settings' as any)} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, color: colors.text }}>
            SYSTEM{' '}<Text style={{ color: colors.tint }}>REPORTS</Text>
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginTop: 2 }}>
            ANALYTICS & ATTENDANCE
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
          {[
            { title: 'Total Students', value: dashData?.totalUsers    || 0, icon: <Users    size={20} color={colors.tint} /> },
            { title: 'Total Trips',    value: dashData?.totalTrips    || 0, icon: <MapPin   size={20} color={colors.tint} /> },
            { title: 'Active Trips',   value: dashData?.activeTrips   || 0, icon: <Clock    size={20} color={colors.tint} /> },
            { title: 'Total Bookings', value: dashData?.totalBookings || 0, icon: <CheckCircle size={20} color={colors.tint} /> },
          ].map((s, i) => (
            <View key={i} style={{ width: '48%', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, flex: 1, paddingRight: 4 }}>{s.title}</Text>
                <View style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33` }}>
                  {s.icon}
                </View>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text }}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Attendance Panel */}
        <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' }}>

          {/* Header */}
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>ATTENDANCE REPORT</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.icon, marginTop: 4 }}>{stats.total} records found</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsFilterModalOpen(true)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
                backgroundColor: activeFiltersCount > 0 ? colors.tint : colors.background,
                borderColor: activeFiltersCount > 0 ? colors.tint : colors.border,
              }}
            >
              <Filter size={14} color={activeFiltersCount > 0 ? '#000' : colors.text} />
              <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: activeFiltersCount > 0 ? '#000' : colors.text }}>
                FILTERS {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }}>
            {[
              { label: 'Total',     value: stats.total,     color: colors.text },
              { label: 'Completed', value: stats.completed, color: colors.success || '#22c55e' },
              { label: 'Missed',    value: stats.missed,    color: '#ef4444' },
              { label: 'Rate',      value: `${stats.rate}%`, color: stats.rate >= 75 ? (colors.success || '#22c55e') : '#ef4444' },
            ].map((s, i) => (
              <View key={i} style={{
                width: '25%', padding: 14, alignItems: 'center',
                borderRightWidth: i !== 3 ? 1 : 0, borderRightColor: colors.border,
                backgroundColor: i === 1 ? `${colors.success || '#22c55e'}0D` : i === 2 ? 'rgba(239,68,68,0.05)' : 'transparent',
              }}>
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, marginBottom: 4 }}>{s.label}</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: s.color }}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* Bookings */}
          <View style={{ padding: 12 }}>
            {isReportLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
                <ActivityIndicator color={colors.tint} />
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon }}>SYNCING DATA...</Text>
              </View>
            ) : bookings.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
                <View style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33` }}>
                  <Users size={24} color={colors.tint} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>No records match filters</Text>
              </View>
            ) : (
              bookings.map((b: any) => {
                const isCompleted = b.attendanceStatus === 'completed';
                const statusColor = isCompleted ? (colors.success || '#22c55e') : '#ef4444';
                return (
                  <View key={b._id} style={{
                    flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 8,
                    borderRadius: 14, borderWidth: 1, borderLeftWidth: 3,
                    backgroundColor: colors.background, borderColor: colors.border,
                    borderLeftColor: statusColor,
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: colors.text, marginBottom: 2 }}>{b.user?.name || '—'}</Text>
                      <Text style={{ fontSize: 10, color: colors.icon, marginBottom: 8 }}>{b.user?.email || '—'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <MapPin size={10} color={colors.tint} />
                          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.icon }}>{b.route?.name || '—'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Bus size={10} color={colors.text} />
                          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text }}>{b.busId?.busCode || '—'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} color={colors.icon} />
                          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.icon }}>{b.timeSlot} {b.specificReturnTime ? `(${b.specificReturnTime})` : ''}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ backgroundColor: `${statusColor}1A`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: `${statusColor}33` }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: statusColor }}>
                        {isCompleted ? 'Present' : 'Missed'}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <Modal visible={isFilterModalOpen} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%', paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>REPORT FILTERS</Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}
                style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
              {/* Date */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>SELECT DATE</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                {[{ label: 'Today', val: todayStr }, { label: 'Yesterday', val: new Date(Date.now() - 86400000).toISOString().split('T')[0] }].map(opt => (
                  <TouchableOpacity key={opt.label} onPress={() => setTempFilters(f => ({ ...f, date: opt.val }))}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: tempFilters.date === opt.val ? colors.tint : colors.border, backgroundColor: tempFilters.date === opt.val ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: tempFilters.date === opt.val ? colors.tint : colors.text }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52, backgroundColor: colors.background, borderColor: colors.border, justifyContent: 'center', marginBottom: 24 }}>
                <TextInput style={{ fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center' }} value={tempFilters.date} onChangeText={t => setTempFilters(f => ({ ...f, date: t }))} placeholder="YYYY-MM-DD" placeholderTextColor={colors.icon} />
              </View>

              {/* Route */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>ROUTE</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <TouchableOpacity onPress={() => setTempFilters(f => ({ ...f, routeId: '' }))}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: tempFilters.routeId === '' ? colors.tint : colors.border, backgroundColor: tempFilters.routeId === '' ? `${colors.tint}1A` : colors.background }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: tempFilters.routeId === '' ? colors.tint : colors.text }}>All</Text>
                </TouchableOpacity>
                {routes.map(r => (
                  <TouchableOpacity key={r._id} onPress={() => setTempFilters(f => ({ ...f, routeId: r._id }))}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: tempFilters.routeId === r._id ? colors.tint : colors.border, backgroundColor: tempFilters.routeId === r._id ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: tempFilters.routeId === r._id ? colors.tint : colors.text }}>{r.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bus */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>BUS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <TouchableOpacity onPress={() => setTempFilters(f => ({ ...f, busId: '' }))}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: tempFilters.busId === '' ? colors.tint : colors.border, backgroundColor: tempFilters.busId === '' ? `${colors.tint}1A` : colors.background }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: tempFilters.busId === '' ? colors.tint : colors.text }}>All</Text>
                </TouchableOpacity>
                {buses.map(b => (
                  <TouchableOpacity key={b._id} onPress={() => setTempFilters(f => ({ ...f, busId: b._id }))}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: tempFilters.busId === b._id ? colors.tint : colors.border, backgroundColor: tempFilters.busId === b._id ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: tempFilters.busId === b._id ? colors.tint : colors.text }}>{b.busCode}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time Slot */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>TIME SLOT</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: tempFilters.timeSlot === 'Return' ? 12 : 24 }}>
                {[{ label: 'All', val: '' }, { label: 'Morning', val: 'Morning' }, { label: 'Return', val: 'Return' }].map(slot => (
                  <TouchableOpacity key={slot.label} onPress={() => setTempFilters(f => ({ ...f, timeSlot: slot.val, specificReturnTime: '' }))}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: tempFilters.timeSlot === slot.val ? colors.tint : colors.border, backgroundColor: tempFilters.timeSlot === slot.val ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: tempFilters.timeSlot === slot.val ? colors.tint : colors.text }}>{slot.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {tempFilters.timeSlot === 'Return' && (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                  {['3:30 PM', '7:00 PM'].map(time => (
                    <TouchableOpacity key={time} onPress={() => setTempFilters(f => ({ ...f, specificReturnTime: f.specificReturnTime === time ? '' : time }))}
                      style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: tempFilters.specificReturnTime === time ? colors.tint : colors.border, backgroundColor: tempFilters.specificReturnTime === time ? `${colors.tint}1A` : colors.background }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: tempFilters.specificReturnTime === time ? colors.tint : colors.text }}>{time}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={clearFilters}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.text }}>CLEAR</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={applyFilters}
                style={{ flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.tint }}>
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#000' }}>SHOW RESULTS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}