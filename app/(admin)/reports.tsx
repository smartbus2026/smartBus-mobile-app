import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Modal, Platform
} from "react-native";
import { Users, CheckCircle, XCircle, Clock, ChevronDown, X } from "lucide-react-native";
import api from "../../src/services/api";
import Appbar from "../../src/components/bar";
import { useThemeColor } from "../../constants/theme"; // 🟢 استدعاء الهوك

interface Booking {
  _id: string;
  user: { name: string; email: string };
  trip: { _id: string; time_slot: string; route?: { name: string }; date: string };
  seat_number: number;
  attended: boolean;
  status: string;
}

interface TripInfo {
  _id: string;
  date: string;
  time_slot: string;
  route?: { name: string };
  total_seats: number;
  booked_seats: number;
}

const TIME_SLOT_LABEL: Record<string, string> = {
  morning: "Morning",
  return_1530: "3:30 PM",
  return_1900: "7:00 PM",
};

const FILTERS = ["all", "present", "absent", "pending"] as const;

export default function AdminReports() {
  const colors = useThemeColor(); // 🟢 سحب الألوان الديناميكية
  const [attendance, setAttendance] = useState<any>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allTrips, setAllTrips] = useState<TripInfo[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedTripId, setSelectedTripId] = useState<string>("all");
  const [filter, setFilter] = useState<typeof FILTERS[number]>("all");

  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [closingTrip, setClosingTrip] = useState<string | null>(null);
  const [closeModal, setCloseModal] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dashRes, bookingsRes, tripsRes] = await Promise.all([
        api.get("/reports/dashboard-stats"),
        api.get("/bookings"),
        api.get("/trips"),
      ]);
      setTotalUsers(dashRes.data.totalUsers || 0);
      const bookings = bookingsRes.data.data?.bookings || bookingsRes.data || [];
      const trips = tripsRes.data.data || tripsRes.data || [];
      setAllBookings(Array.isArray(bookings) ? bookings : []);
      setAllTrips(Array.isArray(trips) ? trips : []);

      const active = bookings.filter((b: Booking) => b.status !== "cancelled");
      const present = active.filter((b: Booking) => b.attended).length;
      const absent = active.filter((b: Booking) => b.status === "missed").length;
      const pending = active.filter((b: Booking) => !b.attended && b.status !== "missed").length;
      const total = active.length || 1;
      setAttendance({
        present, absent, pending, total,
        presentPct: Math.round(present / total * 100),
        absentPct: Math.round(absent / total * 100),
        pendingPct: Math.round(pending / total * 100),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCloseTrip = async () => {
    if (!selectedTripId || selectedTripId === "all") return;
    setClosingTrip(selectedTripId);
    try {
      await api.patch(`/bookings/trip/${selectedTripId}/close`);
      await fetchAll();
    } catch (e) {
      console.error(e);
    } finally {
      setClosingTrip(null);
      setCloseModal(false);
    }
  };

  const uniqueDates = [...new Set(allTrips.map(t => t.date.slice(0, 10)))].sort().reverse();

  const tripsForDate = selectedDate === "all"
    ? allTrips
    : allTrips.filter(t => t.date.slice(0, 10) === selectedDate);

  const bookingsForSelection = allBookings.filter(b => {
    if (b.status === "cancelled") return false;
    if (selectedDate !== "all" && b.trip?.date?.slice(0, 10) !== selectedDate) return false;
    if (selectedTripId !== "all" && b.trip?._id !== selectedTripId) return false;
    return true;
  });

  const filteredBookings = bookingsForSelection.filter(b => {
    if (filter === "present") return b.attended;
    if (filter === "absent") return b.status === "missed";
    if (filter === "pending") return !b.attended && b.status !== "missed";
    return true;
  });

  const pendingCount = bookingsForSelection.filter(
    b => !b.attended && b.status !== "missed"
  ).length;

  const selectedTripInfo = allTrips.find(t => t._id === selectedTripId);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text className="text-2xl font-black uppercase tracking-tight mb-5" style={{ color: colors.text }}>
          System Reports
        </Text>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between mb-5">
          {[
            { title: "Total Students", value: totalUsers, color: colors.tint, pct: 100 },
            { title: "Present", value: attendance?.present ?? 0, color: colors.success || "#22c55e", pct: attendance?.presentPct ?? 0 },
            { title: "Absent", value: attendance?.absent ?? 0, color: colors.error || "#ef4444", pct: attendance?.absentPct ?? 0 },
            { title: "Pending", value: attendance?.pending ?? 0, color: colors.icon, pct: attendance?.pendingPct ?? 0 },
          ].map((s, i) => (
            <View key={i} className="w-[48%] rounded-3xl p-4 mb-3 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <Text className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: colors.icon }}>{s.title}</Text>
              <Text className="text-3xl font-black mb-2" style={{ color: s.color }}>{s.value}</Text>
              <View className="h-1 rounded-full overflow-hidden mb-1" style={{ backgroundColor: colors.background }}>
                <View className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
              </View>
              <Text className="text-[9px] font-black" style={{ color: s.color }}>{s.pct}%</Text>
            </View>
          ))}
        </View>

        {/* Attendance Card */}
        <View className="rounded-[28px] p-5 border mb-4" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <Text className="text-base font-black uppercase tracking-widest mb-1" style={{ color: colors.text }}>Attendance Management</Text>
          <Text className="text-[10px] font-bold mb-4" style={{ color: colors.icon }}>
            {bookingsForSelection.length} students · {bookingsForSelection.filter(b => b.attended).length} present · {pendingCount} pending
          </Text>

          {/* Dropdown Filters */}
          <View className="flex-row gap-2.5 mb-3">
            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-between rounded-xl px-3 py-2.5 border"
              style={{ backgroundColor: colors.background, borderColor: colors.border }}
              onPress={() => setDateModalVisible(true)}
            >
              <Text className="text-xs font-bold" style={{ color: colors.text }} numberOfLines={1}>
                {selectedDate === "all" ? "All Dates" : selectedDate}
              </Text>
              <ChevronDown size={14} color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-between rounded-xl px-3 py-2.5 border"
              style={{ backgroundColor: colors.background, borderColor: colors.border }}
              onPress={() => setTripModalVisible(true)}
            >
              <Text className="text-xs font-bold" style={{ color: colors.text }} numberOfLines={1}>
                {selectedTripId === "all" ? "All Trips" : TIME_SLOT_LABEL[selectedTripInfo?.time_slot || ""] || "Trip"}
              </Text>
              <ChevronDown size={14} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Status Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {FILTERS.map((f) => {
              const count = f === "all" ? bookingsForSelection.length
                : f === "present" ? bookingsForSelection.filter(b => b.attended).length
                : f === "absent" ? bookingsForSelection.filter(b => b.status === "missed").length
                : pendingCount;
              const isActive = filter === f;
              return (
                <TouchableOpacity
                  key={f}
                  className="px-3.5 py-2 rounded-full mr-2 border"
                  style={{ backgroundColor: isActive ? `${colors.tint}1A` : colors.background, borderColor: isActive ? colors.tint : colors.border }}
                  onPress={() => setFilter(f)}
                >
                  <Text className="text-[9px] font-black tracking-widest uppercase" style={{ color: isActive ? colors.tint : colors.icon }}>
                    {f} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* End Trip Action */}
          {selectedTripId !== "all" && pendingCount > 0 && (
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5 mb-4"
              style={{ backgroundColor: colors.error || "#ef4444" }}
              onPress={() => setCloseModal(true)}
            >
              <X size={14} color="#fff" />
              <Text className="text-xs font-black uppercase tracking-widest text-white">
                End Trip · Mark {pendingCount} Absent
              </Text>
            </TouchableOpacity>
          )}

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <View className="items-center py-10 gap-3">
              <Users size={32} color={colors.border} />
              <Text className="text-[11px] font-bold uppercase" style={{ color: colors.icon }}>No students found</Text>
            </View>
          ) : (
            filteredBookings.map((b) => (
              <View
                key={b._id}
                className="flex-row items-center justify-between py-3.5 border-b border-l-4 pl-3"
                style={{ borderBottomColor: colors.border, borderLeftColor: b.attended ? (colors.success || "#22c55e") : b.status === "missed" ? (colors.error || "#ef4444") : colors.tint }}
              >
                <View className="flex-1">
                  <Text className="text-sm font-black" style={{ color: colors.text }}>{b.user?.name || "—"}</Text>
                  <Text className="text-[10px] font-bold mb-1" style={{ color: colors.icon }}>{b.user?.email || "—"}</Text>
                  <Text className="text-[10px] font-medium" style={{ color: colors.icon }}>
                    {b.trip?.route?.name || "—"} · Seat #{b.seat_number}
                  </Text>
                </View>
                <View className="rounded-lg px-2 py-1 border" style={{ 
                  backgroundColor: b.attended ? "rgba(34,197,94,0.1)" : b.status === "missed" ? "rgba(239,68,68,0.1)" : "rgba(247,160,27,0.1)",
                  borderColor: b.attended ? "rgba(34,197,94,0.2)" : b.status === "missed" ? "rgba(239,68,68,0.2)" : "rgba(247,160,27,0.2)"
                }}>
                  <Text className="text-[8px] font-black" style={{ color: b.attended ? (colors.success || "#22c55e") : b.status === "missed" ? (colors.error || "#ef4444") : colors.tint }}>
                    {b.attended ? "PRESENT" : b.status === "missed" ? "ABSENT" : "PENDING"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* 🟢 Modals & Alerts with Dynamic Theme */}
      <Modal visible={dateModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
          <View className="rounded-t-[32px] max-h-[70%] p-6" style={{ backgroundColor: colors.card }}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black" style={{ color: colors.text }}>Select Date</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)} className="p-1">
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity className="py-4 border-b" style={{ borderBottomColor: colors.border }} onPress={() => { setSelectedDate("all"); setSelectedTripId("all"); setDateModalVisible(false); }}>
                <Text className="font-bold" style={{ color: selectedDate === "all" ? colors.tint : colors.text }}>All Dates</Text>
              </TouchableOpacity>
              {uniqueDates.map((d) => (
                <TouchableOpacity key={d} className="py-4 border-b" style={{ borderBottomColor: colors.border }} onPress={() => { setSelectedDate(d); setSelectedTripId("all"); setDateModalVisible(false); }}>
                  <Text className="font-bold" style={{ color: selectedDate === d ? colors.tint : colors.text }}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ... (Trip Modal & Close Trip Modal follow the same Tailwind pattern) ... */}
      
      <Appbar />
    </View>
  );
}