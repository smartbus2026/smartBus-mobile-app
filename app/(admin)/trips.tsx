// app/(admin)/manage-trips.tsx
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Modal, Platform, ScrollView,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {
  Bus, Calendar, ChevronDown, ChevronUp, Filter, Users, X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';

interface Student { _id: string; name: string; email: string; bookingId: string; }
interface AssignedTripData {
  id: string; routeId: string; routeName: string; busId: string; busNumber: string;
  driverName: string; timeSlot: string; specificReturnTime: string | null;
  passengerCount: number; students: Student[]; date: string; status: string;
}

export default function ManageTripsScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();

  const [trips, setTrips]               = useState<AssignedTripData[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [expandedId, setExpandedId]     = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate]         = useState(todayStr);
  const [filterRoute, setFilterRoute]           = useState('');
  const [filterBus, setFilterBus]               = useState('');
  const [filterTimeSlot, setFilterTimeSlot]     = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempDate, setTempDate]                 = useState(todayStr);

  const fetchTrips = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/bookings/admin/assigned-trips?date=${date}`);
      const rawTrips = res.data?.data?.trips || res.data?.trips || [];
      setTrips(rawTrips.map((t: any) => ({
        ...t,
        driverName: t.driverName || t.bus?.driver || 'Unassigned',
        busNumber:  t.busNumber  || t.bus?.busCode || 'Unknown Bus',
      })));
    } catch { setTrips([]); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchTrips(selectedDate); }, [selectedDate, fetchTrips]);

  const uniqueRoutes = Array.from(new Set(trips.map(t => t.routeName))).filter(Boolean);
  const uniqueBuses  = Array.from(new Set(trips.map(t => t.busNumber))).filter(Boolean);

  const filteredTrips = trips.filter(t => {
    if (filterRoute    && t.routeName !== filterRoute)    return false;
    if (filterBus      && t.busNumber !== filterBus)      return false;
    if (filterTimeSlot && t.timeSlot  !== filterTimeSlot) return false;
    return true;
  });

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'assigned':  return { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)' };
      case 'active':    return { color: colors.success || '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' };
      case 'completed': return { color: colors.tint,   bg: `${colors.tint}1A`,  border: `${colors.tint}4D` };
      default:          return { color: colors.icon,   bg: colors.background,   border: colors.border };
    }
  };

  const handleApplyFilters = () => { setSelectedDate(tempDate); setIsFilterModalOpen(false); };
  const clearFilters = () => { setFilterRoute(''); setFilterBus(''); setFilterTimeSlot(''); setTempDate(todayStr); setSelectedDate(todayStr); setIsFilterModalOpen(false); };
  const isFiltered = filterRoute !== '' || filterBus !== '' || filterTimeSlot !== '' || selectedDate !== todayStr;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Assigned Trips" showMenu showSettings onSettingsPress={() => router.push('/(admin)/settings' as any)} />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, color: colors.text }}>
            FLEET{' '}<Text style={{ color: colors.tint }}>OVERVIEW</Text>
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginTop: 2 }}>
            DISPATCHED FLEET SCHEDULES
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsFilterModalOpen(true)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1,
            backgroundColor: isFiltered ? colors.tint : colors.card,
            borderColor: isFiltered ? colors.tint : colors.border,
          }}
        >
          <Filter size={14} color={isFiltered ? '#000' : colors.text} />
          <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', color: isFiltered ? '#000' : colors.text }}>FILTERS</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>LOADING TRIPS...</Text>
        </View>
      ) : filteredTrips.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33` }}>
            <Bus size={32} color={colors.tint} />
          </View>
          <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>No assigned trips found</Text>
          <Text style={{ fontSize: 10, color: colors.icon }}>Try adjusting your filters or date.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, marginBottom: 16 }}>
            Showing {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''} for{' '}
            <Text style={{ color: colors.tint }}>{selectedDate === todayStr ? 'Today' : selectedDate}</Text>
          </Text>

          {filteredTrips.map(trip => {
            const statusStyle = getStatusStyle(trip.status);
            const isExpanded  = expandedId === trip.id;

            return (
              <View key={trip.id} style={{
                borderRadius: 24, marginBottom: 16, borderWidth: 1, overflow: 'hidden',
                backgroundColor: colors.card,
                borderColor: isExpanded ? colors.tint : colors.border,
              }}>
                {/* Card Header */}
                <View style={{ padding: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text, marginBottom: 6 }}>{trip.routeName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Calendar size={12} color={colors.icon} />
                        <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>
                          {new Date(trip.date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, backgroundColor: statusStyle.bg, borderColor: statusStyle.border }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: statusStyle.color }}>{trip.status}</Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={{ gap: 12 }}>
                    {[
                      { label: 'Time Slot', value: `${trip.timeSlot}${trip.specificReturnTime && trip.specificReturnTime !== 'none' ? ` (${trip.specificReturnTime})` : ''}`, icon: null },
                      { label: 'Bus',       value: trip.busNumber, icon: <Bus size={12} color={colors.tint} /> },
                      { label: 'Driver',    value: trip.driverName, icon: null },
                    ].map((item, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: `${colors.border}80` }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>{item.label}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {item.icon}
                          <Text style={{ fontSize: 12, fontWeight: '800', textTransform: 'uppercase', color: colors.text }}>{item.value}</Text>
                        </View>
                      </View>
                    ))}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>Passengers</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Users size={12} color={colors.tint} />
                        <Text style={{ fontSize: 12, fontWeight: '900', color: colors.text }}>{trip.passengerCount}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Expand Button */}
                  {trip.students && trip.students.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setExpandedId(isExpanded ? null : trip.id)}
                      style={{
                        marginTop: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
                        borderColor: colors.tint, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
                        backgroundColor: `${colors.tint}1A`,
                      }}
                    >
                      {isExpanded ? <ChevronUp size={14} color={colors.tint} /> : <ChevronDown size={14} color={colors.tint} />}
                      <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.tint }}>
                        {isExpanded ? 'HIDE STUDENTS' : `VIEW ${trip.students.length} STUDENT${trip.students.length !== 1 ? 'S' : ''}`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Students List */}
                {isExpanded && trip.students && (
                  <View style={{ borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background, padding: 20 }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.tint, marginBottom: 14 }}>ASSIGNED STUDENTS</Text>
                    {trip.students.map((s, i) => (
                      <View key={s._id || i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i === trip.students.length - 1 ? 0 : 1, borderBottomColor: `${colors.border}80` }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.tint }}>{s.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text, marginBottom: 2 }}>{s.name}</Text>
                            <Text style={{ fontSize: 10, color: colors.icon }} numberOfLines={1}>{s.email}</Text>
                          </View>
                        </View>
                        <View style={{ backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: colors.tint, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                            #{s.bookingId?.toString().slice(-5).toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Filters Modal */}
      <Modal visible={isFilterModalOpen} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%', paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>FILTERS & DATE</Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}
                style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
              {/* Date */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>SELECT DATE</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                {[{ label: 'Today', val: todayStr }, { label: 'Tomorrow', val: new Date(Date.now() + 86400000).toISOString().split('T')[0] }].map(opt => (
                  <TouchableOpacity key={opt.label} onPress={() => setTempDate(opt.val)}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: tempDate === opt.val ? colors.tint : colors.border, backgroundColor: tempDate === opt.val ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: tempDate === opt.val ? colors.tint : colors.text }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52, justifyContent: 'center', backgroundColor: colors.background, borderColor: colors.border, marginBottom: 24 }}>
                <TextInput style={{ fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center' }} value={tempDate} onChangeText={setTempDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.icon} />
              </View>

              {/* Route */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>ROUTE</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <TouchableOpacity onPress={() => setFilterRoute('')}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: filterRoute === '' ? colors.tint : colors.border, backgroundColor: filterRoute === '' ? `${colors.tint}1A` : colors.background }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: filterRoute === '' ? colors.tint : colors.text }}>All</Text>
                </TouchableOpacity>
                {uniqueRoutes.map(r => (
                  <TouchableOpacity key={r} onPress={() => setFilterRoute(r)}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: filterRoute === r ? colors.tint : colors.border, backgroundColor: filterRoute === r ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: filterRoute === r ? colors.tint : colors.text }}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bus */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>BUS NUMBER</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <TouchableOpacity onPress={() => setFilterBus('')}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: filterBus === '' ? colors.tint : colors.border, backgroundColor: filterBus === '' ? `${colors.tint}1A` : colors.background }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: filterBus === '' ? colors.tint : colors.text }}>All</Text>
                </TouchableOpacity>
                {uniqueBuses.map(b => (
                  <TouchableOpacity key={b} onPress={() => setFilterBus(b)}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: filterBus === b ? colors.tint : colors.border, backgroundColor: filterBus === b ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: filterBus === b ? colors.tint : colors.text }}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time Slot */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>TIME SLOT</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[{ label: 'All', val: '' }, { label: 'Morning', val: 'Morning' }, { label: 'Return', val: 'Return' }].map(slot => (
                  <TouchableOpacity key={slot.label} onPress={() => setFilterTimeSlot(slot.val)}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: filterTimeSlot === slot.val ? colors.tint : colors.border, backgroundColor: filterTimeSlot === slot.val ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: filterTimeSlot === slot.val ? colors.tint : colors.text }}>{slot.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={clearFilters}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.text }}>CLEAR</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleApplyFilters}
                style={{ flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.tint }}>
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#000' }}>APPLY FILTERS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}