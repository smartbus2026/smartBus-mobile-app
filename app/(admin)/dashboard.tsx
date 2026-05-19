import { useRouter } from "expo-router";
import {
  BarChart2, Bell, Bus, Calendar, CheckCircle, Clock,
  Download, MapPin, Plus, Route, Users, AlertCircle
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useThemeColor } from "../../constants/theme";
import api from "../../src/services/api";
import TopBar from "../../src/components/TopBar";

export default function AdminDashboard() {
  const colors = useThemeColor();
  const router = useRouter();

  // ── Shared Dashboard State ──
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalStudents: 0,
    activeTripsCount: 0,
    totalRoutes: 0,
    totalBookings: 0,
    tickets: [] as any[],
    routesList: [] as any[]
  });

  // ── Demand State ──
  const [demandDate, setDemandDate] = useState<"today" | "tomorrow">("tomorrow");
  const [demands, setDemands] = useState<any[]>([]);
  const [demandLoading, setDemandLoading] = useState(true);

  // ── Dispatch State ──
  const [buses, setBuses] = useState<any[]>([]);
  const [dispatchForm, setDispatchForm] = useState<{ busId: string; timeSlot: string; specificReturnTime?: string; routeIds: string[] }>({
    busId: "",
    timeSlot: "Morning",
    specificReturnTime: "",
    routeIds: []
  });
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchMessage, setDispatchMessage] = useState({ type: "", text: "" });

  // ── Today's Trips State ──
  const [assignedTrips, setAssignedTrips] = useState<any[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);

  // 1. Fetch Dashboard Main Data
  const fetchDashboardData = async () => {
    try {
      const [usersRes, tripsRes, routesRes, bookingsRes, supportRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/trips').catch(() => ({ data: { data: [] } })),
        api.get('/routes').catch(() => ({ data: { data: [] } })),
        api.get('/bookings').catch(() => ({ data: { data: [] } })),
        api.get('/support').catch(() => ({ data: { data: { tickets: [] } } })),
      ]);

      const users = usersRes.data || [];
      const trips = tripsRes.data?.data || tripsRes.data || [];
      const routes = routesRes.data?.data || routesRes.data || [];
      const bookings = bookingsRes.data?.data || bookingsRes.data || [];
      const supportTickets = supportRes.data?.data?.tickets || supportRes.data?.tickets || [];

      const studentCount = Array.isArray(users) ? users.filter((u: any) => u.role === 'student').length : 0;
      const activeTripsList = Array.isArray(trips) ? trips.filter((t: any) => t.status === 'active') : [];
      const pendingTickets = supportTickets.filter((t: any) => t.status === 'open' || t.status === 'pending');

      setData({
        totalStudents: studentCount,
        activeTripsCount: activeTripsList.length,
        totalRoutes: Array.isArray(routes) ? routes.length : 0,
        totalBookings: Array.isArray(bookings) ? bookings.length : 0,
        tickets: pendingTickets.slice(0, 5),
        routesList: Array.isArray(routes) ? routes : []
      });
    } catch (err) {
      console.log("Dashboard Stats Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Assigned Trips
  const fetchAssignedTrips = async () => {
    setTripsLoading(true);
    try {
      const res = await api.get('/bookings/admin/assigned-trips');
      let tData = res.data?.data?.assignedTrips || res.data?.assignedTrips || res.data?.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      tData = tData.filter((t: any) => {
        const d = new Date(t.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
      setAssignedTrips(tData);
    } catch (err) {
      console.log("Assigned Trips Error:", err);
    } finally {
      setTripsLoading(false);
    }
  };

  // 3. Fetch Buses
  const fetchBuses = async () => {
    try {
      const busesRes = await api.get('/tracking/buses');
      setBuses(busesRes.data?.data?.buses || busesRes.data?.buses || busesRes.data?.data || []);
    } catch (err) {
      console.log("Fetch Buses Error:", err);
    }
  };

  // 4. Fetch Demands
  const fetchDemands = async () => {
    setDemandLoading(true);
    try {
      const target = new Date();
      if (demandDate === "tomorrow") target.setDate(target.getDate() + 1);
      const dateStr = target.toISOString().split("T")[0];
      const res = await api.get(`/bookings/admin/demand?date=${dateStr}`);
      setDemands(res.data?.data?.demands || []);
    } catch (err) {
      console.log("Fetch Demands Error:", err);
      setDemands([]);
    } finally {
      setDemandLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAssignedTrips();
    fetchBuses();
  }, []);

  useEffect(() => {
    fetchDemands();
  }, [demandDate]);

  // Actions
  const handleResolveTicket = async (id: string) => {
    try {
      await api.put(`/support/${id}/status`, { status: "resolved" });
      setData(prev => ({ ...prev, tickets: prev.tickets.filter((t: any) => t._id !== id) }));
    } catch (err) {
      console.log("Resolve ticket error:", err);
    }
  };

  const handleDispatch = async () => {
    if (!dispatchForm.busId || dispatchForm.routeIds.length === 0) {
      setDispatchMessage({ type: "error", text: "Select a bus and at least 1 route." });
      return;
    }
    if (dispatchForm.timeSlot === "Return" && !dispatchForm.specificReturnTime) {
      setDispatchMessage({ type: "error", text: "Select return time." });
      return;
    }

    setDispatchLoading(true);
    setDispatchMessage({ type: "", text: "" });

    try {
      const targetDate = new Date();
      if (demandDate === "tomorrow") targetDate.setDate(targetDate.getDate() + 1);

      const payload: any = {
        busId: dispatchForm.busId,
        date: targetDate.toISOString().split("T")[0],
        timeSlot: dispatchForm.timeSlot,
        routeIds: dispatchForm.routeIds
      };
      if (dispatchForm.timeSlot === "Return" && dispatchForm.specificReturnTime) {
        payload.specificReturnTime = dispatchForm.specificReturnTime;
      }

      await api.post('/bookings/admin/dispatch', payload);
      setDispatchMessage({ type: "success", text: "Bus dispatched successfully!" });
      setDispatchForm({ busId: "", timeSlot: "Morning", specificReturnTime: "", routeIds: [] });
      
      fetchAssignedTrips();
      fetchDemands();
    } catch (err: any) {
      setDispatchMessage({ type: "error", text: err.response?.data?.message || "Dispatch failed." });
    } finally {
      setDispatchLoading(false);
    }
  };

  const stats = [
    { title: "Total Students", value: loading ? "..." : data.totalStudents.toLocaleString(), trend: "Registered accounts", icon: <Users size={20} color={colors.tint} /> },
    { title: "Active Trips", value: loading ? "..." : data.activeTripsCount.toString(), trend: "Currently en route", icon: <Bus size={20} color={colors.tint} /> },
    { title: "Available Routes", value: loading ? "..." : data.totalRoutes.toString(), trend: "Active paths", icon: <MapPin size={20} color={colors.tint} /> },
    { title: "Total Bookings", value: loading ? "..." : data.totalBookings.toLocaleString(), trend: "System wide", icon: <Calendar size={20} color={colors.tint} /> },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Dashboard" showMenu showSettings onSettingsPress={() => router.push('/(admin)/settings' as any)} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        
        {/* ── Stats Grid ── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
          {stats.map((stat, i) => (
            <View key={i} style={{ width: '48%', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>{stat.title}</Text>
                <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.tint}1A` }}>
                  {stat.icon}
                </View>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 4, color: colors.text }}>{stat.value}</Text>
              <Text style={{ fontSize: 8, fontWeight: '800', color: colors.success || "#22c55e" }}>{stat.trend}</Text>
            </View>
          ))}
        </View>

        {/* ── Live Booking Demands ── */}
        <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginBottom: 24, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.text }}>Live Demands</Text>
            <View style={{ flexDirection: 'row', gap: 4, backgroundColor: colors.background, padding: 4, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}>
              {(["today", "tomorrow"] as const).map(d => (
                <TouchableOpacity key={d} onPress={() => setDemandDate(d)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: demandDate === d ? colors.tint : 'transparent' }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', color: demandDate === d ? '#fff' : colors.icon }}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {demandLoading ? (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <ActivityIndicator color={colors.tint} />
            </View>
          ) : demands.length === 0 ? (
            <View style={{ padding: 30, alignItems: 'center', opacity: 0.5 }}>
              <Calendar size={24} color={colors.icon} style={{ marginBottom: 10 }} />
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: colors.text }}>No pending demands</Text>
            </View>
          ) : (
            <View style={{ padding: 16, gap: 12 }}>
              {demands.map((d, i) => {
                const isHigh = d.totalStudents > 45;
                const isMedium = d.totalStudents > 30 && !isHigh;
                return (
                  <View key={i} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, backgroundColor: colors.background }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 }}>{d.routeName}</Text>
                      {isHigh && <Text style={{ fontSize: 9, fontWeight: '800', color: '#ef4444', backgroundColor: '#ef444420', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>OVERLOADED</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <Clock size={12} color={colors.icon} />
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.icon }}>{d.timeSlot} {d.specificReturnTime ? `- ${d.specificReturnTime}` : ''}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 10, color: colors.icon }}>Booked</Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text }}>{d.totalStudents} <Text style={{ color: colors.icon }}>/ 45</Text></Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${Math.min((d.totalStudents / 45) * 100, 100)}%`, backgroundColor: isHigh ? '#ef4444' : isMedium ? '#eab308' : colors.tint }} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Dispatch Form (Minimalist Mobile Version) ── */}
        <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginBottom: 24, padding: 16 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.text, marginBottom: 16 }}>Assign Bus & Dispatch</Text>
          
          {/* Buses (Horizontal Scroll) */}
          <Text style={{ fontSize: 9, fontWeight: '800', color: colors.icon, marginBottom: 8, textTransform: 'uppercase' }}>1. Select Bus</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {buses.map(b => (
              <TouchableOpacity key={b._id} onPress={() => setDispatchForm(prev => ({ ...prev, busId: b._id }))}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginRight: 8, borderColor: dispatchForm.busId === b._id ? colors.tint : colors.border, backgroundColor: dispatchForm.busId === b._id ? colors.tint : colors.background }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: dispatchForm.busId === b._id ? '#fff' : colors.text }}>{b.busCode}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Time Slot */}
          <Text style={{ fontSize: 9, fontWeight: '800', color: colors.icon, marginBottom: 8, textTransform: 'uppercase' }}>2. Time Slot</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: dispatchForm.timeSlot === 'Return' ? 8 : 16 }}>
            {['Morning', 'Return'].map(slot => (
              <TouchableOpacity key={slot} onPress={() => setDispatchForm(prev => ({ ...prev, timeSlot: slot, specificReturnTime: '' }))}
                style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: dispatchForm.timeSlot === slot ? colors.tint : colors.border, backgroundColor: dispatchForm.timeSlot === slot ? `${colors.tint}1A` : colors.background }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: dispatchForm.timeSlot === slot ? colors.tint : colors.text }}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Return Time Options */}
          {dispatchForm.timeSlot === 'Return' && (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
               {['3:30 PM', '7:00 PM'].map(time => (
                <TouchableOpacity key={time} onPress={() => setDispatchForm(prev => ({ ...prev, specificReturnTime: time }))}
                  style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: dispatchForm.specificReturnTime === time ? colors.tint : colors.border, backgroundColor: dispatchForm.specificReturnTime === time ? `${colors.tint}1A` : colors.background }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: dispatchForm.specificReturnTime === time ? colors.tint : colors.text }}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Target Routes */}
          <Text style={{ fontSize: 9, fontWeight: '800', color: colors.icon, marginBottom: 8, textTransform: 'uppercase' }}>3. Target Routes</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {data.routesList.map(r => {
              const isSelected = dispatchForm.routeIds.includes(r._id);
              return (
                <TouchableOpacity key={r._id} onPress={() => setDispatchForm(prev => ({ ...prev, routeIds: isSelected ? prev.routeIds.filter(id => id !== r._id) : [...prev.routeIds, r._id] }))}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: isSelected ? colors.tint : colors.border, backgroundColor: isSelected ? colors.tint : colors.background }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: isSelected ? '#fff' : colors.text }}>{r.name}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {dispatchMessage.text ? <Text style={{ fontSize: 10, fontWeight: '700', textAlign: 'center', marginBottom: 12, color: dispatchMessage.type === 'error' ? '#ef4444' : (colors.success || '#22c55e') }}>{dispatchMessage.text}</Text> : null}

          <TouchableOpacity onPress={handleDispatch} disabled={dispatchLoading} style={{ backgroundColor: colors.tint, padding: 14, borderRadius: 12, alignItems: 'center', opacity: dispatchLoading ? 0.7 : 1 }}>
            <Text style={{ color: '#000', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>{dispatchLoading ? 'Dispatching...' : 'Assign & Notify'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Pending Tickets ── */}
        <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 12 }}>Pending Tickets</Text>
        {data.tickets.length === 0 ? (
          <Text style={{ fontSize: 11, color: colors.icon, textAlign: 'center', marginVertical: 20 }}>No pending tickets.</Text>
        ) : (
          data.tickets.map((t, i) => (
            <View key={t._id || i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginBottom: 10 }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text, marginBottom: 4 }}>{t.subject}</Text>
                <Text style={{ fontSize: 10, color: colors.icon }} numberOfLines={1}>{t.description}</Text>
              </View>
              <TouchableOpacity onPress={() => handleResolveTicket(t._id)} style={{ backgroundColor: `${colors.success || '#22c55e'}1A`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: colors.success || '#22c55e', textTransform: 'uppercase' }}>Resolve</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* ── Today's Trips Log ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 12 }}>
          <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon }}>Today's Active Fleet Log</Text>
        </View>
        <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', padding: 12, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ flex: 2, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', color: colors.icon }}>Route</Text>
            <Text style={{ flex: 1, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', color: colors.icon }}>Bus</Text>
            <Text style={{ flex: 1, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', color: colors.icon, textAlign: 'right' }}>Time</Text>
          </View>
          
          {tripsLoading ? (
            <ActivityIndicator style={{ padding: 20 }} color={colors.tint} />
          ) : assignedTrips.length === 0 ? (
            <Text style={{ fontSize: 11, color: colors.icon, textAlign: 'center', padding: 20 }}>No trips dispatched today.</Text>
          ) : (
            assignedTrips.map((trip, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: i === assignedTrips.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin size={12} color={colors.tint} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text }} numberOfLines={1}>{trip.route?.name || "Unknown"}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 10, fontWeight: '800', color: colors.text }}>{trip.bus?.busCode || "Unassigned"}</Text>
                <Text style={{ flex: 1, fontSize: 9, fontWeight: '600', color: colors.icon, textAlign: 'right' }}>
                  {trip.timeSlot} {trip.specificReturnTime ? `\n${trip.specificReturnTime}` : ""}
                </Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}