import { useRouter } from "expo-router";
import {
  Bus, Calendar, ChevronDown, ChevronUp, Clock, Filter, Users, X
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Modal, Platform, ScrollView,
  Text, TextInput, TouchableOpacity, View
} from "react-native";
import { useThemeColor } from "../../constants/theme";
import api from "../../src/services/api";
import TopBar from "../../src/components/TopBar";

interface Student {
  _id: string;
  name: string;
  email: string;
  bookingId: string;
}

interface AssignedTripData {
  id: string;
  routeId: string;
  routeName: string;
  busId: string;
  busNumber: string;
  driverName: string;
  timeSlot: string;
  specificReturnTime: string | null;
  passengerCount: number;
  students: Student[];
  date: string;
  status: string;
}

export default function ManageTripsScreen() {
  const colors = useThemeColor();
  const router = useRouter();

  // ── State ──
  const [trips, setTrips] = useState<AssignedTripData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Filters State ──
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [filterRoute, setFilterRoute] = useState('');
  const [filterBus, setFilterBus] = useState('');
  const [filterTimeSlot, setFilterTimeSlot] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempDate, setTempDate] = useState(todayStr);

  // ── Fetch Logic ──
  const fetchTrips = useCallback(async (date: string) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/bookings/admin/assigned-trips?date=${date}`);
      const rawTrips = res.data?.data?.trips || res.data?.trips || [];
      
      const mappedTrips = rawTrips.map((t: any) => ({
        ...t,
        driverName: t.driverName || t.bus?.driver || 'Unassigned',
        busNumber: t.busNumber || t.bus?.busCode || 'Unknown Bus',
      }));
      setTrips(mappedTrips);
    } catch (err) {
      console.log("Failed to fetch assigned trips", err);
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips(selectedDate);
  }, [selectedDate, fetchTrips]);

  // ── Derived Data for Filters ──
  const uniqueRoutes = Array.from(new Set(trips.map(t => t.routeName))).filter(Boolean);
  const uniqueBuses  = Array.from(new Set(trips.map(t => t.busNumber))).filter(Boolean);

  // ── Apply Filters ──
  const filteredTrips = trips.filter(t => {
    if (filterRoute && t.routeName !== filterRoute) return false;
    if (filterBus && t.busNumber !== filterBus) return false;
    if (filterTimeSlot && t.timeSlot !== filterTimeSlot) return false;
    return true;
  });

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'assigned': return { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' };
      case 'active':   return { color: colors.success || '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' };
      case 'completed':return { color: colors.tint, bg: `${colors.tint}1A`, border: `${colors.tint}4D` };
      default:         return { color: colors.icon, bg: colors.background, border: colors.border };
    }
  };

  const handleApplyFilters = () => {
    setSelectedDate(tempDate);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilterRoute('');
    setFilterBus('');
    setFilterTimeSlot('');
    setTempDate(todayStr);
    setSelectedDate(todayStr);
    setIsFilterModalOpen(false);
  };

  const isFiltered = filterRoute !== '' || filterBus !== '' || filterTimeSlot !== '' || selectedDate !== todayStr;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Assigned Trips" showMenu showSettings onSettingsPress={() => router.push('/(admin)/settings' as any)} />

      {/* ── Header & Filter Trigger ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', letterSpacing: -0.5, textTransform: 'uppercase', color: colors.text }}>Overview</Text>
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4, color: colors.icon }}>
            Dispatched Fleet Schedules
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsFilterModalOpen(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, backgroundColor: isFiltered ? colors.tint : colors.card, borderColor: isFiltered ? colors.tint : colors.border }}
        >
          <Filter size={14} color={isFiltered ? '#000' : colors.text} />
          <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: isFiltered ? '#000' : colors.text }}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginTop: 12, color: colors.icon }}>Loading Trips...</Text>
        </View>
      ) : filteredTrips.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
          <Bus size={48} color={colors.icon} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>No assigned trips found</Text>
          <Text style={{ fontSize: 10, marginTop: 4, color: colors.icon }}>Try adjusting your filters or date.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, marginBottom: 16 }}>
            Showing {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''} for <Text style={{ color: colors.tint }}>{selectedDate === todayStr ? 'Today' : selectedDate}</Text>
          </Text>

          {filteredTrips.map((trip) => {
            const statusStyle = getStatusStyle(trip.status);
            const isExpanded = expandedId === trip.id;

            return (
              <View key={trip.id} style={{ borderRadius: 24, marginBottom: 20, borderWidth: 1, backgroundColor: colors.card, borderColor: isExpanded ? colors.tint : colors.border, overflow: 'hidden' }}>
                
                {/* ── Card Header ── */}
                <View style={{ padding: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text, marginBottom: 6 }}>{trip.routeName}</Text>
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

                  {/* ── Details Grid ── */}
                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: `${colors.border}80` }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>Time Slot</Text>
                      <Text style={{ fontSize: 12, fontWeight: '800', textTransform: 'uppercase', color: colors.text }}>
                        {trip.timeSlot} {trip.specificReturnTime && trip.specificReturnTime !== 'none' ? `(${trip.specificReturnTime})` : ''}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: `${colors.border}80` }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>Bus</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Bus size={12} color={colors.tint} />
                        <Text style={{ fontSize: 12, fontWeight: '800', textTransform: 'uppercase', color: colors.text }}>{trip.busNumber}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: `${colors.border}80` }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>Driver</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>{trip.driverName}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>Passengers</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Users size={12} color={colors.tint} />
                        <Text style={{ fontSize: 12, fontWeight: '900', color: colors.text }}>{trip.passengerCount}</Text>
                      </View>
                    </View>
                  </View>

                  {/* ── Expand Button ── */}
                  {trip.students && trip.students.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setExpandedId(isExpanded ? null : trip.id)}
                      style={{ marginTop: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: colors.background }}
                    >
                      {isExpanded ? <ChevronUp size={14} color={colors.text} /> : <ChevronDown size={14} color={colors.text} />}
                      <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>
                        {isExpanded ? 'Hide Students' : `View ${trip.students.length} Student${trip.students.length !== 1 ? 's' : ''}`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* ── Students List (Expanded State) ── */}
                {isExpanded && trip.students && (
                  <View style={{ borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: 'rgba(0,0,0,0.2)', padding: 20 }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.tint, marginBottom: 12 }}>Assigned Students</Text>
                    {trip.students.map((s, i) => (
                      <View key={s._id || i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i === trip.students.length - 1 ? 0 : 1, borderBottomColor: `${colors.border}80` }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${colors.tint}1A`, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.tint }}>{s.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text, marginBottom: 2 }}>{s.name}</Text>
                            <Text style={{ fontSize: 10, color: colors.icon }} numberOfLines={1}>{s.email}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: colors.icon, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                          #{s.bookingId?.toString().slice(-5).toUpperCase()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Filters & Date Bottom Sheet Modal ── */}
      <Modal visible={isFilterModalOpen} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%', paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>Filters & Date</Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)} style={{ padding: 8, borderRadius: 12, backgroundColor: colors.background }}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
              
              {/* Date Filter */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>Select Date</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                {[{ label: 'Today', val: todayStr }, { label: 'Tomorrow', val: new Date(Date.now() + 86400000).toISOString().split('T')[0] }].map(opt => (
                  <TouchableOpacity key={opt.label} onPress={() => setTempDate(opt.val)}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: tempDate === opt.val ? colors.tint : colors.border, backgroundColor: tempDate === opt.val ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: tempDate === opt.val ? colors.tint : colors.text }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={{ borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 13, backgroundColor: colors.background, borderColor: colors.border, color: colors.text, marginBottom: 24, textAlign: 'center', fontWeight: '700' }}
                value={tempDate}
                onChangeText={setTempDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.icon}
              />

              {/* Route Filter */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>Route</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <TouchableOpacity onPress={() => setFilterRoute('')}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: filterRoute === '' ? colors.text : colors.border, backgroundColor: filterRoute === '' ? colors.text : colors.background }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: filterRoute === '' ? colors.background : colors.text }}>All</Text>
                </TouchableOpacity>
                {uniqueRoutes.map(r => (
                  <TouchableOpacity key={r} onPress={() => setFilterRoute(r)}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: filterRoute === r ? colors.tint : colors.border, backgroundColor: filterRoute === r ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: filterRoute === r ? colors.tint : colors.text }}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bus Filter */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>Bus Number</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <TouchableOpacity onPress={() => setFilterBus('')}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: filterBus === '' ? colors.text : colors.border, backgroundColor: filterBus === '' ? colors.text : colors.background }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: filterBus === '' ? colors.background : colors.text }}>All</Text>
                </TouchableOpacity>
                {uniqueBuses.map(b => (
                  <TouchableOpacity key={b} onPress={() => setFilterBus(b)}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: filterBus === b ? colors.tint : colors.border, backgroundColor: filterBus === b ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: filterBus === b ? colors.tint : colors.text }}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time Slot Filter */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, color: colors.icon }}>Time Slot</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[{ label: 'All', val: '' }, { label: 'Morning', val: 'Morning' }, { label: 'Return', val: 'Return' }].map(slot => (
                  <TouchableOpacity key={slot.label} onPress={() => setFilterTimeSlot(slot.val)}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: filterTimeSlot === slot.val ? colors.tint : colors.border, backgroundColor: filterTimeSlot === slot.val ? `${colors.tint}1A` : colors.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: filterTimeSlot === slot.val ? colors.tint : colors.text }}>{slot.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={{ padding: 24, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={clearFilters} style={{ flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.text }}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleApplyFilters} style={{ flex: 2, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: colors.tint }}>
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#000' }}>Apply Filters</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}