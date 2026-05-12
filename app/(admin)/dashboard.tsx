import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from "react-native";
import { 
  Users, Bus, BarChart2, CheckCircle, 
  Bell, Download, MapPin, Plus, Route 
} from "lucide-react-native";
import { useRouter } from "expo-router";
import api from "../../src/services/api";
import Appbar from "../../src/components/bar";

export default function AdminDashboard() {
  const router = useRouter();
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalRoutes, setTotalRoutes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/reports/dashboard-stats");
        setTotalStudents(res.data.totalStudents || 0);
        setTotalRoutes(res.data.totalRoutes || 0);
      } catch (e) {
        console.log("Stats error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // قسم الأفعال السريعة
  const quickActions = [
    { label: "Create Trip", icon: <Plus size={20} color="#fff" />, path: "/(admin)/create-trip", color: "#f7a01b" },
    { label: "Add Route", icon: <Route size={20} color="#fff" />, path: "/(admin)/routes", color: "#3b82f6" },
    { label: "Users", icon: <Users size={20} color="#fff" />, path: "/(admin)/users", color: "#22c55e" },
  ];

  const stats = [
    { title: "Total Students", value: loading ? "..." : totalStudents.toLocaleString(), trend: "+12% from last week", icon: <Users size={22} color="#f7a01b" />, positive: true },
    { title: "Active Routes", value: loading ? "..." : totalRoutes.toString(), trend: "Fully operational", icon: <Bus size={22} color="#f7a01b" />, positive: true },
    { title: "Occupancy Rate", value: "84%", trend: "+5% from yesterday", icon: <BarChart2 size={22} color="#f7a01b" />, positive: true },
    { title: "System Status", value: "Stable", trend: "All systems online", icon: <CheckCircle size={22} color="#f7a01b" />, positive: true },
  ];

  const alerts = [
    { t: "Registration closing", m: "Window closes in 2h", color: "#f7a01b", time: "5 MIN AGO" },
    { t: "Fleet Update", m: "Bus #3 reached Stadium", color: "#22c55e", time: "17 MIN AGO" },
    { t: "New User", m: "Student ID #924 verified", color: "#3b82f6", time: "29 MIN AGO" },
  ];

  return (
    <View style={styles.mainWrapper}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header البديل للتوب بار القديم */}
        <View style={styles.pageHeader}>
            <View>
                <Text style={styles.welcomeText}>System Overview</Text>
                <Text style={styles.dateText}>Admin Command Center</Text>
            </View>
            <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>ADMIN PANEL</Text>
            </View>
        </View>

        {/* قسم الأفعال السريعة - Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.actionCard}
              onPress={() => router.push(action.path as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                {action.icon}
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 12 }]}>System Performance</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={styles.statTop}>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <View style={styles.iconBox}>{stat.icon}</View>
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={[styles.statTrend, { color: stat.positive ? "#22c55e" : "#8a8d91" }]}>
                {stat.trend}
              </Text>
            </View>
          ))}
        </View>

        {/* Live Tracking Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fleet Live Tracking</Text>
          <Text style={styles.sectionLink}>NETWORK_SATELLITE ↗</Text>
        </View>
        <View style={styles.mapCard}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveCircle} />
            <Text style={styles.liveText}>Aswan_Fleet_Active</Text>
          </View>
          <Text style={styles.mapPlaceholder}>[ Live Map ]</Text>
        </View>

        {/* Alerts */}
        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>System Intelligence</Text>
        {alerts.map((alert, i) => (
          <TouchableOpacity key={i} style={styles.alertCard} activeOpacity={0.8}>
            <View style={styles.alertTop}>
              <Bell size={14} color={alert.color} />
              <Text style={styles.alertTitle}>{alert.t}</Text>
            </View>
            <Text style={styles.alertMsg}>{alert.m}</Text>
            <Text style={styles.alertTime}>{alert.time}</Text>
          </TouchableOpacity>
        ))}

        {/* Operational Load */}
        <View style={styles.loadCard}>
          <View style={styles.loadHeader}>
            <Text style={styles.loadTitle}>Operational Load</Text>
            <View style={styles.loadBadge}>
              <Text style={styles.loadBadgeText}>OPTIMIZED</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.loadFooter}>
            {totalStudents} Verified Students On-Board
          </Text>
        </View>

        {/* Fleet Table */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Fleet Log</Text>
          <TouchableOpacity style={styles.exportBtn}>
            <Download size={12} color="#8a8d91" />
            <Text style={styles.exportText}>EXPORT</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHead, { flex: 1 }]}>Fleet ID</Text>
            <Text style={[styles.tableHead, { flex: 2 }]}>Route</Text>
            <Text style={[styles.tableHead, { flex: 1 }]}>Seats</Text>
            <Text style={[styles.tableHead, { flex: 1, textAlign: "right" }]}>Status</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1, color: "#fff" }]}>T-ASW-001</Text>
            <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MapPin size={12} color="#f7a01b" />
              <Text style={[styles.tableCell, { color: "#8a8d91" }]}>Aqaleem → Stadium</Text>
            </View>
            <Text style={[styles.tableCell, { flex: 1, color: "#f7a01b" }]}>32/40</Text>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>DEPLOYED</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* الـ Bottom Bar يتحط هنا عشان يفضل ثابت تحت */}
      <Appbar />
            {/* <Appbar /> */}

    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: "#0f1115" },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 }, // مساحة كافية للـ Bottom Bar

  pageHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    marginTop: 40, 
    marginBottom: 25 
  },
  welcomeText: { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  dateText: { fontSize: 12, color: "#8a8d91", fontWeight: "600", marginTop: 2 },
  adminBadge: { backgroundColor: "rgba(247,160,27,0.1)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: "rgba(247,160,27,0.2)" },
  adminBadgeText: { fontSize: 8, fontWeight: "900", color: "#f7a01b", letterSpacing: 1 },

  // ستايل الكروت السريعة
  quickActionsGrid: { 
    flexDirection: "row", 
    gap: 12, 
    marginBottom: 25, 
    marginTop: 12 
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#1c1e26",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2d3036",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  statCard: {
    width: "47%", backgroundColor: "#1c1e26",
    borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: "#2d3036",
  },
  statTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  statTitle: { fontSize: 9, fontWeight: "900", color: "#8a8d91", letterSpacing: 1.5, textTransform: "uppercase", flex: 1 },
  iconBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(247,160,27,0.1)",
    borderWidth: 1, borderColor: "rgba(247,160,27,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  statValue: { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -1, marginBottom: 4 },
  statTrend: { fontSize: 8, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 9, fontWeight: "900", color: "#8a8d91", letterSpacing: 2, textTransform: "uppercase" },
  sectionLink: { fontSize: 8, color: "#f7a01b", fontWeight: "900", letterSpacing: 2 },

  mapCard: {
    height: 200, backgroundColor: "#1c1e26",
    borderRadius: 32, borderWidth: 1, borderColor: "#2d3036",
    marginBottom: 24, alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  liveIndicator: {
    position: "absolute", top: 16, left: 16,
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(28,30,38,0.9)", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(34,197,94,0.3)",
  },
  liveCircle: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  liveText: { fontSize: 8, color: "#22c55e", fontWeight: "900", letterSpacing: 2 },
  mapPlaceholder: { color: "#2d3036", fontSize: 13, fontWeight: "700" },

  alertCard: {
    backgroundColor: "#1c1e26", borderWidth: 1, borderColor: "#2d3036",
    borderRadius: 24, padding: 18, marginBottom: 10,
  },
  alertTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  alertTitle: { fontSize: 9, fontWeight: "900", color: "#fff", textTransform: "uppercase", letterSpacing: 1.5 },
  alertMsg: { fontSize: 11, color: "#8a8d91", fontWeight: "700", marginBottom: 6 },
  alertTime: { fontSize: 8, color: "#444", fontWeight: "900", textTransform: "uppercase" },

  loadCard: {
    backgroundColor: "#f7a01b", borderRadius: 28,
    padding: 24, marginVertical: 16,
  },
  loadHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  loadTitle: { fontSize: 9, fontWeight: "900", color: "rgba(0,0,0,0.7)", textTransform: "uppercase", letterSpacing: 2 },
  loadBadge: { backgroundColor: "rgba(0,0,0,0.1)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  loadBadgeText: { fontSize: 8, fontWeight: "900", color: "rgba(0,0,0,0.7)" },
  progressBar: { height: 8, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 4, marginBottom: 14, overflow: "hidden" },
  progressFill: { height: "100%", width: "78%", backgroundColor: "#0f1115", borderRadius: 4 },
  loadFooter: { fontSize: 10, fontWeight: "900", color: "#0f1115", textTransform: "uppercase", letterSpacing: 1 },

  tableCard: {
    backgroundColor: "#1c1e26", borderRadius: 24,
    borderWidth: 1, borderColor: "#2d3036", overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row", backgroundColor: "#0f1115",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#2d3036",
  },
  tableHead: { fontSize: 8, fontWeight: "900", color: "#8a8d91", textTransform: "uppercase", letterSpacing: 1.5 },
  tableRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  tableCell: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  statusBadge: {
    backgroundColor: "rgba(34,197,94,0.1)", borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: "rgba(34,197,94,0.2)",
  },
  statusText: { fontSize: 7, fontWeight: "900", color: "#22c55e", letterSpacing: 1.5 },

  exportBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#1c1e26", borderWidth: 1, borderColor: "#2d3036",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  },
  exportText: { fontSize: 8, fontWeight: "900", color: "#8a8d91" },
});