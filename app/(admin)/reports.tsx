import { useRouter } from "expo-router";
import {
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  MapPin,
  Users,
  X,
  Bus
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useThemeColor } from "../../constants/theme";
import api from "../../src/services/api";
import TopBar from "../../src/components/TopBar";

interface DashboardData {
  totalUsers: number;
  totalTrips: number;
  activeTrips: number;
  totalBookings: number;
}

export default function AdminReportsScreen() {
  const colors = useThemeColor();
  const router = useRouter();

  // ── Dashboard State ──
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [isDashLoading, setIsDashLoading] = useState(true);

  // ── Attendance Report State ──
  const todayStr = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState({ date: todayStr, routeId: '', busId: '', timeSlot: '', specificReturnTime: '' });
  const [tempFilters, setTempFilters] = useState(filters);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [routes, setRoutes] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState({ completed: 0, missed: 0, total: 0, rate: 0 });
  const [isReportLoading, setIsReportLoading] = useState(false);

  // 1. Fetch Dashboard Stats & Dropdown Options
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [dashRes, rRes, bRes] = await Promise.all([
          api.get('/reports/dashboard-stats'),
          api.get('/routes').catch(() => ({ data: { data: [] } })),
          api.get('/tracking/buses').catch(() => ({ data: { data: { buses: [] } } }))
        ]);
        setDashData(dashRes.data);
        setRoutes(rRes.data?.data || rRes.data || []);
        setBuses(bRes.data?.data?.buses || bRes.data?.buses || bRes.data?.data || []);
      } catch (err) {
        console.log("Failed to fetch initial data", err);
      } finally {
        setIsDashLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Fetch Attendance Report
  const fetchReport = useCallback(async () => {
    setIsReportLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date) params.set('date', filters.date);
      if (filters.routeId) params.set('routeId', filters.routeId);
      if (filters.busId) params.set('busId', filters.busId);
      if (filters.timeSlot) params.set('timeSlot', filters.timeSlot);
      if (filters.timeSlot === 'Return' && filters.specificReturnTime) {
        params.set('specificReturnTime', filters.specificReturnTime);
      }

      const res = await api.get(`/reports/attendance?${params.toString()}`);
      setBookings(res.data?.data?.bookings || []);
      setStats(res.data?.data?.stats || { completed: 0, missed: 0, total: 0, rate: 0 });
    } catch (err) {
      console.log('Failed to fetch attendance report', err);
      setBookings([]);
    } finally {
      setIsReportLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ── Handlers ──
  const applyFilters = () => {
    setFilters(tempFilters);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    const cleared = { date: todayStr, routeId: '', busId: '', timeSlot: '', specificReturnTime: '' };
    setTempFilters(cleared);
    setFilters(cleared);
    setIsFilterModalOpen(false);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '' && v !== todayStr).length + (filters.date ? 1 : 0);

  if (isDashLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar title="System Reports" showMenu showSettings onSettingsPress={() => router.push('/(admin)/settings' as any)} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginTop: 12, color: colors.icon }}>Loading Dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="System Reports" showMenu showSettings onSettingsPress={() => router.push('/(admin)/settings' as any)} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* ── Dashboard Stats ── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
          {[
            { title: "Total Students", value: dashData?.totalUsers || 0,    icon: <Users size={20} color={colors.tint} /> },
            { title: "Total Trips",    value: dashData?.totalTrips || 0,    icon: <MapPin size={20} color={colors.success || '#22c55e'} /> },
            { title: "Active Trips",   value: dashData?.activeTrips || 0,   icon: <Clock size={20} color={colors.text} /> },
            { title: "Total Bookings", value: dashData?.totalBookings || 0, icon: <CheckCircle size={20} color={colors.icon} /> },
          ].map((s, i) => (
            <View key={i} style={{ width: '48%', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, flex: 1, paddingRight: 4 }}>{s.title}</Text>
                <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                  {s.icon}
                </View>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text }}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Attendance Report Panel ── */}
        <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' }}>
          
          {/* Header & Filter Trigger */}
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: 'rgba(0,0,0,0.02)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>Attendance Report</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.icon, marginTop: 4 }}>{stats.total} records found</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setIsFilterModalOpen(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, backgroundColor: activeFiltersCount > 0 ? colors.tint : colors.background, borderColor: activeFiltersCount > 0 ? colors.tint : colors.border }}
            >
              <Filter size={14} color={activeFiltersCount > 0 ? '#000' : colors.text} />
              <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: activeFiltersCount > 0 ? '#000' : colors.text }}>
                Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Report Stats Row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background }}>
            {[
              { label: 'Total',     value: stats.total,     color: colors.text, bg: colors.background },
              { label: 'Completed', value: stats.completed, color: colors.success || '#22c55e', bg: `${colors.success || '#22c55e'}1A` },
              { label: 'Missed',    value: stats.missed,    color: colors.error || '#ef4444', bg: `${colors.error || '#ef4444'}1A` },
              { label: 'Rate',      value: `${stats.rate}%`,color: stats.rate >= 75 ? (colors.success || '#22c55e') : (colors.error || '#ef4444'), bg: colors.background },
            ].map((s, i) => (
              <View key={i} style={{ width: '25%', padding: 12, alignItems: 'center', backgroundColor: s.bg, borderRightWidth: i !== 3 ? 1 : 0, borderRightColor: colors.border }}>
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', color: colors.icon, marginBottom: 4 }}>{s.label}</Text>
                <Text style={{ fontSize: 14, fontWeight: '900', color: s.color }}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* Bookings List */}
          <View style={{ padding: 12 }}>
            {isReportLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator color={colors.tint} />
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginTop: 12, color: colors.icon }}>Syncing Data...</Text>
              </View>
            ) : bookings.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center', opacity: 0.5 }}>
                <Users size={32} color={colors.icon} style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>No records match filters</Text>
              </View>
            ) : (
              bookings.map((b: any) => {
                const isCompleted = b.attendanceStatus === 'completed';
                return (
                  <View key={b._id} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, borderLeftWidth: 3, borderLeftColor: isCompleted ? (colors.success || '#22c55e') : (colors.error || '#ef4444'), backgroundColor: colors.background, marginBottom: 8, borderRadius: 12 }}>
                    
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

                    <View style={{ backgroundColor: isCompleted ? `${colors.success || '#22c55e'}1A` : `${colors.error || '#ef4444'}1A`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: isCompleted ? `${colors.success || '#22c55e'}33` : `${colors.error || '#ef4444'}33` }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: isCompleted ? (colors.success || '#22c55e') : (colors.error || '#ef4444') }}>
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

      {/* ── Filters Bottom Sheet Modal ── */}
      <Modal visible={isFilterModalOpen} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%', paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>Report Filters</Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)} style={{ padding: 8, borderRadius: 12, backgroundColor: colors.background }}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
              
              {/* Date Filter */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>Select Date</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                {[{ label: 'Today', val: todayStr }, { label: 'Yesterday', val: new Date(Date.now() - 86400000).toISOString().split('T')[0] }].map(opt => (
                  <TouchableOpacity key={opt.label} onPress={() => setTempFilters(f => ({ ...f, date: opt.val }))}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: tempFilters.date === opt.val ? colors.tint : colors.border, backgroundColor: tempFilters.date === opt.val ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: tempFilters.date === opt.val ? colors.tint : colors.text }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={{ borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 13, backgroundColor: colors.background, borderColor: colors.border, color: colors.text, marginBottom: 24, textAlign: 'center', fontWeight: '700' }}
                value={tempFilters.date}
                onChangeText={t => setTempFilters(f => ({ ...f, date: t }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.icon}
              />

              {/* Route Filter */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>Route</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <TouchableOpacity onPress={() => setTempFilters(f => ({ ...f, routeId: '' }))}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: tempFilters.routeId === '' ? colors.text : colors.border, backgroundColor: tempFilters.routeId === '' ? colors.text : colors.background }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: tempFilters.routeId === '' ? colors.background : colors.text }}>All</Text>
                </TouchableOpacity>
                {routes.map(r => (
                  <TouchableOpacity key={r._id} onPress={() => setTempFilters(f => ({ ...f, routeId: r._id }))}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: tempFilters.routeId === r._id ? colors.tint : colors.border, backgroundColor: tempFilters.routeId === r._id ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: tempFilters.routeId === r._id ? colors.tint : colors.text }}>{r.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bus Filter */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>Bus</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <TouchableOpacity onPress={() => setTempFilters(f => ({ ...f, busId: '' }))}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: tempFilters.busId === '' ? colors.text : colors.border, backgroundColor: tempFilters.busId === '' ? colors.text : colors.background }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: tempFilters.busId === '' ? colors.background : colors.text }}>All</Text>
                </TouchableOpacity>
                {buses.map(b => (
                  <TouchableOpacity key={b._id} onPress={() => setTempFilters(f => ({ ...f, busId: b._id }))}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: tempFilters.busId === b._id ? colors.tint : colors.border, backgroundColor: tempFilters.busId === b._id ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: tempFilters.busId === b._id ? colors.tint : colors.text }}>{b.busCode}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time Slot Filter */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>Time Slot</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: tempFilters.timeSlot === 'Return' ? 12 : 24 }}>
                {[{ label: 'All', val: '' }, { label: 'Morning', val: 'Morning' }, { label: 'Return', val: 'Return' }].map(slot => (
                  <TouchableOpacity key={slot.label} onPress={() => setTempFilters(f => ({ ...f, timeSlot: slot.val, specificReturnTime: '' }))}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: tempFilters.timeSlot === slot.val ? colors.tint : colors.border, backgroundColor: tempFilters.timeSlot === slot.val ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: tempFilters.timeSlot === slot.val ? colors.tint : colors.text }}>{slot.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Specific Return Time */}
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

            <View style={{ padding: 24, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={clearFilters} style={{ flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.text }}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={applyFilters} style={{ flex: 2, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: colors.tint }}>
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#000' }}>Show Results</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}