import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Api from '../../src/services/api';
import { useThemeColor } from "../../constants/theme";

interface BookingRecord {
  _id: string;
  attended: boolean;
  attendanceStatus: string;
  status: string;
  date: string;
  timeSlot: string;
  route?: { name: string };
  specificReturnTime?: string;
}

export default function AttendancePage() {
  const colors = useThemeColor();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAttendance = async (id: string, newStatus: "completed" | "missed") => {
    setLoadingId(id);
    try {
      await Api.patch(`/bookings/${id}/attendance`, { attendanceStatus: newStatus });
      setBookings(prev =>
        prev.map(b =>
          b._id === id
            ? { ...b, attendanceStatus: newStatus, status: newStatus, attended: newStatus === "completed" }
            : b
        )
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update attendance");
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, sRes] = await Promise.all([
          Api.get("/bookings/my"),
          Api.get("/settings"),
        ]);
        setBookings(res.data?.data?.bookings || []);
        setSettings(sRes.data?.data?.settings || null);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const checkTripTiming = (b: BookingRecord) => {
    if (!settings) return { isStarted: false, isExpired: false };

    let timeStr = "";
    if (b.timeSlot === "Morning") {
      timeStr = settings.morningStartTime || "08:30 AM";
    } else {
      timeStr = b.specificReturnTime || "03:30 PM";
    }

    const parseTimeToMinutes = (t: string) => {
      if (!t) return 0;
      const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!m) return 0;
      let h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
      if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
      return h * 60 + min;
    };

    const tripMin = parseTimeToMinutes(timeStr);
    const tripStartTime = new Date(b.date);
    tripStartTime.setHours(Math.floor(tripMin / 60), tripMin % 60, 0, 0);

    const now = new Date();

    if (now < tripStartTime) return { isStarted: false, isExpired: false };

    const expiredTime = new Date(tripStartTime.getTime() + 120 * 60000);
    if (now > expiredTime) return { isStarted: true, isExpired: true };

    return { isStarted: true, isExpired: false };
  };

  const allBookings = bookings.filter(b => b.status !== "cancelled");

  const present = allBookings.filter(b => b.attendanceStatus === "completed").length;
  const missed = allBookings.filter(b => b.attendanceStatus === "missed").length;
  const total = present + missed;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  const groupedByDate: Record<string, BookingRecord[]> = {};
  allBookings.forEach(b => {
    const dateKey = new Date(b.date).toDateString();
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(b);
  });

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (isLoading) {
    return (
      <View style={[s.loadWrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[s.loadText, { color: colors.icon }]}>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={[s.headerTitle, { color: colors.text }]}>
            My <Text style={{ color: colors.tint }}>Attendance</Text>
          </Text>
          <Text style={[s.headerSub, { color: colors.icon }]}>Your trip attendance record</Text>
        </View>

        {/* Stats Cards */}
        <View style={s.statsRow}>
          {[
            { l: "Total Trips", v: String(total),  color: colors.icon },
            { l: "Present",     v: String(present), color: "#22c55e" },
            { l: "Missed",      v: String(missed),  color: "#ef4444" },
            { l: "Rate",        v: `${pct}%`,       color: pct >= 75 ? "#22c55e" : "#ef4444" },
          ].map(item => (
            <View key={item.l} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.statLabel, { color: colors.icon }]}>{item.l}</Text>
              <Text style={[s.statValue, { color: item.color }]}>{item.v}</Text>
            </View>
          ))}
        </View>

        {/* Progress Bar */}
        <View style={[s.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.progressHeader}>
            <Text style={[s.progressLabel, { color: colors.icon }]}>Attendance Rate</Text>
            <Text style={[s.progressPct, { color: colors.tint }]}>{pct}%</Text>
          </View>
          <View style={[s.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                s.progressFill,
                { width: `${pct}%` as any, backgroundColor: pct >= 75 ? "#22c55e" : "#ef4444" },
              ]}
            />
          </View>
          <Text style={[s.progressHint, { color: colors.icon }]}>
            {pct >= 75 ? "✓ Good attendance keep it up!" : "⚠ Your attendance is below 75%"}
          </Text>
        </View>

        {/* Trip Log */}
        <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Trip Log</Text>

          {sortedDates.length === 0 ? (
            <Text style={[s.emptyText, { color: colors.icon }]}>No trip history found</Text>
          ) : (
            sortedDates.map(dateKey => (
              <View key={dateKey} style={s.dateGroup}>
                {/* Date Row */}
                <View style={s.dateRow}>
                  <Text style={[s.dateText, { color: colors.tint }]}>{dateKey}</Text>
                  <View style={[s.dateLine, { backgroundColor: colors.border }]} />
                  <Text style={[s.dateCount, { color: colors.icon }]}>
                    {groupedByDate[dateKey].filter(b => b.attendanceStatus === "completed").length}/
                    {groupedByDate[dateKey].length} present
                  </Text>
                </View>

                {/* Booking Rows */}
                {groupedByDate[dateKey].map(b => {
                  const { isStarted, isExpired } = checkTripTiming(b);

                  const dotColor =
                    b.attendanceStatus === "completed" ? "#22c55e" :
                    b.attendanceStatus === "missed"    ? "#ef4444" :
                    colors.tint;

                  return (
                    <View key={b._id} style={[s.tripRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                      {/* Left Info */}
                      <View style={s.tripLeft}>
                        <View style={[s.dot, { backgroundColor: dotColor }]} />
                        <View>
                          <Text style={[s.tripName, { color: colors.text }]}>{b.route?.name || "—"}</Text>
                          <Text style={[s.tripSlot, { color: colors.icon }]}>
                            {b.timeSlot}{b.specificReturnTime ? ` (${b.specificReturnTime})` : ""}
                          </Text>
                        </View>
                      </View>

                      {/* Right Action / Badge */}
                      {b.status === "assigned" &&
                       b.attendanceStatus !== "completed" &&
                       b.attendanceStatus !== "missed" ? (
                        isExpired ? (
                          <View style={[s.badge, s.badgeRed]}>
                            <Text style={[s.badgeText, { color: "#ef4444" }]}>Expired</Text>
                          </View>
                        ) : (
                          <View style={s.actionRow}>
                            <TouchableOpacity
                              disabled={loadingId === b._id || !isStarted}
                              onPress={() => handleAttendance(b._id, "completed")}
                              style={[
                                s.actionBtn,
                                s.btnGreen,
                                (loadingId === b._id || !isStarted) && s.btnDisabled,
                              ]}
                            >
                              <Text style={[s.actionBtnText, { color: "#22c55e" }]}>
                                {loadingId === b._id ? "..." : "✓ Boarded"}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              disabled={loadingId === b._id || !isStarted}
                              onPress={() => handleAttendance(b._id, "missed")}
                              style={[
                                s.actionBtn,
                                s.btnRed,
                                (loadingId === b._id || !isStarted) && s.btnDisabled,
                              ]}
                            >
                              <Text style={[s.actionBtnText, { color: "#ef4444" }]}>
                                {loadingId === b._id ? "..." : "✗ Missed"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )
                      ) : (
                        <View style={[
                          s.badge,
                          b.attendanceStatus === "completed" ? s.badgeGreen :
                          b.attendanceStatus === "missed"    ? s.badgeRed   :
                          s.badgeOrange,
                        ]}>
                          <Text style={[
                            s.badgeText,
                            { color:
                              b.attendanceStatus === "completed" ? "#22c55e" :
                              b.attendanceStatus === "missed"    ? "#ef4444" :
                              colors.tint
                            },
                          ]}>
                            {b.attendanceStatus === "completed" ? "Present" :
                             b.attendanceStatus === "missed"    ? "Missed"  :
                             b.status}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1 },
  scroll:         { padding: 20, paddingTop: 16 },
  loadWrap:       { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadText:       { fontSize: 13, fontWeight: "700" },

  header:         { marginBottom: 20 },
  headerTitle:    { fontSize: 24, fontWeight: "900", textTransform: "uppercase", letterSpacing: -0.5 },
  headerSub:      { fontSize: 12, fontWeight: "500", marginTop: 4 },

  statsRow:       { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard:       { flex: 1, borderWidth: 1, borderRadius: 18, padding: 14, alignItems: "center" },
  statLabel:      { fontSize: 9, fontWeight: "700", letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" },
  statValue:      { fontSize: 22, fontWeight: "900" },

  progressCard:   { borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 14 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  progressLabel:  { fontSize: 10, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase" },
  progressPct:    { fontSize: 24, fontWeight: "900" },
  progressTrack:  { height: 12, borderRadius: 99, overflow: "hidden" },
  progressFill:   { height: "100%", borderRadius: 99 },
  progressHint:   { marginTop: 10, fontSize: 10, fontWeight: "700" },

  sectionCard:    { borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 14 },
  sectionTitle:   { fontSize: 13, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 },
  emptyText:      { textAlign: "center", fontSize: 12, fontWeight: "700", paddingVertical: 32, textTransform: "uppercase" },

  dateGroup:      { marginBottom: 20 },
  dateRow:        { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  dateText:       { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  dateLine:       { flex: 1, height: 1 },
  dateCount:      { fontSize: 9, fontWeight: "700" },

  tripRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  tripLeft:       { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  dot:            { width: 8, height: 8, borderRadius: 4 },
  tripName:       { fontSize: 12, fontWeight: "700" },
  tripSlot:       { fontSize: 10, fontWeight: "600", textTransform: "uppercase", marginTop: 2 },

  actionRow:      { flexDirection: "row", gap: 8 },
  actionBtn:      { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  actionBtnText:  { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  btnGreen:       { backgroundColor: "rgba(34,197,94,0.1)",  borderColor: "rgba(34,197,94,0.2)" },
  btnRed:         { backgroundColor: "rgba(239,68,68,0.1)",  borderColor: "rgba(239,68,68,0.2)" },
  btnDisabled:    { opacity: 0.5 },

  badge:          { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  badgeText:      { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  badgeGreen:     { backgroundColor: "rgba(34,197,94,0.1)",  borderColor: "rgba(34,197,94,0.2)" },
  badgeRed:       { backgroundColor: "rgba(239,68,68,0.1)",  borderColor: "rgba(239,68,68,0.2)" },
  badgeOrange:    { backgroundColor: "rgba(247,160,27,0.1)", borderColor: "rgba(247,160,27,0.2)" },
});