import BottomBar from "@/src/components/sidebar";
import { ChevronDown, Users, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator, Modal,
    ScrollView,
    Text, TouchableOpacity,
    View
} from "react-native";
import { useThemeColor } from "../../constants/theme";
import api from "../../src/services/api";
import TopBar from "../../src/components/TopBar";
import { useRouter } from "expo-router";
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
  const colors = useThemeColor();
  const [attendance, setAttendance]       = useState<any>(null);
  const [allBookings, setAllBookings]     = useState<Booking[]>([]);
  const [allTrips, setAllTrips]           = useState<TripInfo[]>([]);
  const [totalUsers, setTotalUsers]       = useState(0);
  const [loading, setLoading]             = useState(true);
  const [selectedDate, setSelectedDate]   = useState<string>("all");
  const [selectedTripId, setSelectedTripId] = useState<string>("all");
  const [filter, setFilter]               = useState<typeof FILTERS[number]>("all");
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [closingTrip, setClosingTrip]     = useState<string | null>(null);
  const [closeModal, setCloseModal]       = useState(false);
const router = useRouter();
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
      const trips    = tripsRes.data.data || tripsRes.data || [];
      setAllBookings(Array.isArray(bookings) ? bookings : []);
      setAllTrips(Array.isArray(trips) ? trips : []);

      const active   = bookings.filter((b: Booking) => b.status !== "cancelled");
      const present  = active.filter((b: Booking) => b.attended).length;
      const absent   = active.filter((b: Booking) => b.status === "missed").length;
      const pending  = active.filter((b: Booking) => !b.attended && b.status !== "missed").length;
      const total    = active.length || 1;
      setAttendance({
        present, absent, pending, total,
        presentPct: Math.round(present / total * 100),
        absentPct:  Math.round(absent  / total * 100),
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
    if (filter === "absent")  return b.status === "missed";
    if (filter === "pending") return !b.attended && b.status !== "missed";
    return true;
  });

  const pendingCount     = bookingsForSelection.filter(b => !b.attended && b.status !== "missed").length;
  const selectedTripInfo = allTrips.find(t => t._id === selectedTripId);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Top Bar ── */}
      
<TopBar
        title="Reports"
  showMenu
  showSettings
  onSettingsPress={() => router.push('/(admin)/settings' as any)}
/>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Welcome ── */}
        <Text style={{ fontSize: 22, fontWeight: '800', textTransform: 'uppercase', letterSpacing: -0.5, marginBottom: 20, color: colors.text }}>
          System Reports
        </Text>

        {/* ── Stats Grid ── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 }}>
          {[
            { title: "Total Students", value: totalUsers,               color: colors.tint,              pct: 100 },
            { title: "Present",        value: attendance?.present ?? 0, color: colors.success || "#22c55e", pct: attendance?.presentPct ?? 0 },
            { title: "Absent",         value: attendance?.absent  ?? 0, color: colors.error  || "#ef4444", pct: attendance?.absentPct  ?? 0 },
            { title: "Pending",        value: attendance?.pending ?? 0, color: colors.icon,              pct: attendance?.pendingPct ?? 0 },
          ].map((s, i) => (
            <View key={i} style={{
              width: '48%', borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1,
              backgroundColor: colors.card, borderColor: colors.border,
            }}>
              <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, color: colors.icon }}>
                {s.title}
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '800', marginBottom: 8, color: s.color }}>{s.value}</Text>
              <View style={{ height: 4, borderRadius: 99, overflow: 'hidden', marginBottom: 4, backgroundColor: colors.background }}>
                <View style={{ height: '100%', borderRadius: 99, width: `${s.pct}%`, backgroundColor: s.color }} />
              </View>
              <Text style={{ fontSize: 9, fontWeight: '800', color: s.color }}>{s.pct}%</Text>
            </View>
          ))}
        </View>

        {/* ── Attendance Card ── */}
        <View style={{ borderRadius: 28, padding: 20, borderWidth: 1, marginBottom: 16, backgroundColor: colors.card, borderColor: colors.border }}>
          <Text style={{ fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, color: colors.text }}>
            Attendance Management
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '700', marginBottom: 16, color: colors.icon }}>
            {bookingsForSelection.length} students · {bookingsForSelection.filter(b => b.attended).length} present · {pendingCount} pending
          </Text>

          {/* Dropdown Filters */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1,
                backgroundColor: colors.background, borderColor: colors.border,
              }}
              onPress={() => setDateModalVisible(true)}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                {selectedDate === "all" ? "All Dates" : selectedDate}
              </Text>
              <ChevronDown size={14} color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1,
                backgroundColor: colors.background, borderColor: colors.border,
              }}
              onPress={() => setTripModalVisible(true)}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                {selectedTripId === "all" ? "All Trips" : TIME_SLOT_LABEL[selectedTripInfo?.time_slot || ""] || "Trip"}
              </Text>
              <ChevronDown size={14} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Status Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {FILTERS.map((f) => {
              const count = f === "all"     ? bookingsForSelection.length
                : f === "present" ? bookingsForSelection.filter(b => b.attended).length
                : f === "absent"  ? bookingsForSelection.filter(b => b.status === "missed").length
                : pendingCount;
              const isActive = filter === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginRight: 8, borderWidth: 1,
                    backgroundColor: isActive ? `${colors.tint}1A` : colors.background,
                    borderColor: isActive ? colors.tint : colors.border,
                  }}
                  onPress={() => setFilter(f)}
                >
                  <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: isActive ? colors.tint : colors.icon }}>
                    {f} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* End Trip Action */}
          {selectedTripId !== "all" && pendingCount > 0 && (
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                borderRadius: 18, paddingVertical: 14, marginBottom: 16,
                backgroundColor: colors.error || "#ef4444",
              }}
              onPress={() => setCloseModal(true)}
            >
              <X size={14} color="#fff" />
              <Text style={{ fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: '#fff' }}>
                End Trip · Mark {pendingCount} Absent
              </Text>
            </TouchableOpacity>
          )}

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
              <Users size={32} color={colors.border} />
              <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: colors.icon }}>No students found</Text>
            </View>
          ) : (
            filteredBookings.map((b) => (
              <View
                key={b._id}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: 14, borderBottomWidth: 1, borderLeftWidth: 4, paddingLeft: 12,
                  borderBottomColor: colors.border,
                  borderLeftColor: b.attended ? (colors.success || "#22c55e") : b.status === "missed" ? (colors.error || "#ef4444") : colors.tint,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{b.user?.name || "—"}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', marginBottom: 4, color: colors.icon }}>{b.user?.email || "—"}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '500', color: colors.icon }}>
                    {b.trip?.route?.name || "—"} · Seat #{b.seat_number}
                  </Text>
                </View>
                <View style={{
                  borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1,
                  backgroundColor: b.attended ? "rgba(34,197,94,0.1)" : b.status === "missed" ? "rgba(239,68,68,0.1)" : "rgba(247,160,27,0.1)",
                  borderColor:     b.attended ? "rgba(34,197,94,0.2)" : b.status === "missed" ? "rgba(239,68,68,0.2)" : "rgba(247,160,27,0.2)",
                }}>
                  <Text style={{
                    fontSize: 8, fontWeight: '800',
                    color: b.attended ? (colors.success || "#22c55e") : b.status === "missed" ? (colors.error || "#ef4444") : colors.tint,
                  }}>
                    {b.attended ? "PRESENT" : b.status === "missed" ? "ABSENT" : "PENDING"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* ── Date Modal ── */}
      <Modal visible={dateModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: "rgba(0,0,0,0.7)" }}>
          <View style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '70%', padding: 24, backgroundColor: colors.card }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>Select Date</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)} style={{ padding: 4 }}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
                onPress={() => { setSelectedDate("all"); setSelectedTripId("all"); setDateModalVisible(false); }}
              >
                <Text style={{ fontWeight: '700', color: selectedDate === "all" ? colors.tint : colors.text }}>All Dates</Text>
              </TouchableOpacity>
              {uniqueDates.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
                  onPress={() => { setSelectedDate(d); setSelectedTripId("all"); setDateModalVisible(false); }}
                >
                  <Text style={{ fontWeight: '700', color: selectedDate === d ? colors.tint : colors.text }}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Trip Modal ── */}
      <Modal visible={tripModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: "rgba(0,0,0,0.7)" }}>
          <View style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '70%', padding: 24, backgroundColor: colors.card }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>Select Trip</Text>
              <TouchableOpacity onPress={() => setTripModalVisible(false)} style={{ padding: 4 }}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
                onPress={() => { setSelectedTripId("all"); setTripModalVisible(false); }}
              >
                <Text style={{ fontWeight: '700', color: selectedTripId === "all" ? colors.tint : colors.text }}>All Trips</Text>
              </TouchableOpacity>
              {tripsForDate.map((t) => (
                <TouchableOpacity
                  key={t._id}
                  style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
                  onPress={() => { setSelectedTripId(t._id); setTripModalVisible(false); }}
                >
                  <Text style={{ fontWeight: '700', color: selectedTripId === t._id ? colors.tint : colors.text }}>
                    {TIME_SLOT_LABEL[t.time_slot] || t.time_slot} · {t.date.slice(0, 10)}
                  </Text>
                  <Text style={{ fontSize: 11, marginTop: 2, color: colors.icon }}>
                    {t.route?.name || "Unknown Route"} · {t.booked_seats}/{t.total_seats} seats
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Close Trip Confirm Modal ── */}
      <Modal visible={closeModal} transparent animationType="fade">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: "rgba(0,0,0,0.7)", padding: 24 }}>
          <View style={{ borderRadius: 28, padding: 24, width: '100%', backgroundColor: colors.card }}>
            <Text style={{ fontSize: 16, fontWeight: '900', marginBottom: 8, color: colors.text }}>End Trip?</Text>
            <Text style={{ fontSize: 13, marginBottom: 24, lineHeight: 20, color: colors.icon }}>
              This will mark {pendingCount} pending student(s) as absent. This action cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background }}
                onPress={() => setCloseModal(false)}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.icon }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.error || "#ef4444", opacity: closingTrip ? 0.7 : 1 }}
                onPress={handleCloseTrip}
                disabled={!!closingTrip}
              >
                {closingTrip
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>CONFIRM</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomBar role="admin" />
    </View>
  );
}