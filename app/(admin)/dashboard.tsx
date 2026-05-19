import { useRouter } from "expo-router";
import {
  BarChart2, Bell, Bus, CheckCircle,
  Download, MapPin, Plus, Route, Users
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useThemeColor } from "../../constants/theme";
import api from "../../src/services/api";
import TopBar from "../../src/components/TopBar";

export default function AdminDashboard() {
  const colors = useThemeColor();
  const router = useRouter();
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalRoutes, setTotalRoutes]     = useState(0);
  const [loading, setLoading]             = useState(true);

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

  const quickActions = [
    { label: "Create Trip", icon: <Plus size={20} color={colors.background} />,  path: "/(admin)/create-trip", color: colors.tint },
    { label: "Add Route",   icon: <Route size={20} color="#fff" />,              path: "/(admin)/routes",      color: "#3b82f6" },
    { label: "Users",       icon: <Users size={20} color="#fff" />,              path: "/(admin)/users",       color: colors.success || "#22c55e" },
  ];

  const stats = [
    { title: "Total Students", value: loading ? "..." : totalStudents.toLocaleString(), trend: "+12% from last week", icon: <Users size={22} color={colors.tint} />,       positive: true },
    { title: "Active Routes",  value: loading ? "..." : totalRoutes.toString(),         trend: "Fully operational",   icon: <Bus size={22} color={colors.tint} />,          positive: true },
    { title: "Occupancy Rate", value: "84%",                                            trend: "+5% from yesterday",  icon: <BarChart2 size={22} color={colors.tint} />,    positive: true },
    { title: "System Status",  value: "Stable",                                         trend: "All systems online",  icon: <CheckCircle size={22} color={colors.tint} />,  positive: true },
  ];

  const alerts = [
    { t: "Registration closing", m: "Window closes in 2h",     color: colors.tint,                time: "5 MIN AGO"  },
    { t: "Fleet Update",         m: "Bus #3 reached Stadium",  color: colors.success || "#22c55e", time: "17 MIN AGO" },
    { t: "New User",             m: "Student ID #924 verified", color: "#3b82f6",                  time: "29 MIN AGO" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      <TopBar
        title="Dashboard"
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(admin)/settings' as any)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 120 }}
      >
        {/* Welcome */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: colors.text }}>System Overview</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', marginTop: 4, color: colors.icon }}>Admin Command Center</Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}33` }}>
            <Text style={{ fontSize: 8, fontWeight: '800', letterSpacing: 2, color: colors.tint }}>ADMIN PANEL</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12, color: colors.icon }}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={{ flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}
              onPress={() => router.push(action.path as any)}
              activeOpacity={0.8}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8, backgroundColor: action.color }}>
                {action.icon}
              </View>
              <Text style={{ fontSize: 10, fontWeight: '800', textAlign: 'center', color: colors.text }}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12, color: colors.icon }}>System Performance</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
          {stats.map((stat, i) => (
            <View key={i} style={{ width: '48%', borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, flex: 1, marginRight: 8, color: colors.icon }}>{stat.title}</Text>
                <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}26` }}>
                  {stat.icon}
                </View>
              </View>
              <Text style={{ fontSize: 28, fontWeight: '800', letterSpacing: -1, marginBottom: 4, color: colors.text }}>{stat.value}</Text>
              <Text style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: stat.positive ? (colors.success || "#22c55e") : colors.icon }}>{stat.trend}</Text>
            </View>
          ))}
        </View>

        {/* Live Tracking */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>Fleet Live Tracking</Text>
          <Text style={{ fontSize: 8, fontWeight: '800', letterSpacing: 1, color: colors.tint }}>NETWORK_SATELLITE ↗</Text>
        </View>
        <View style={{ height: 200, borderRadius: 32, borderWidth: 1, marginBottom: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: colors.card, borderColor: colors.border }}>
          <View style={{ position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, backgroundColor: "rgba(0,0,0,0.6)", borderColor: "rgba(34,197,94,0.3)" }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success || "#22c55e" }} />
            <Text style={{ fontSize: 8, fontWeight: '800', letterSpacing: 1, color: colors.success || "#22c55e" }}>Aswan_Fleet_Active</Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.border }}>[ Live Map Placeholder ]</Text>
        </View>

        {/* Alerts */}
        <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12, color: colors.icon }}>System Intelligence</Text>
        {alerts.map((alert, i) => (
          <TouchableOpacity key={i} style={{ borderRadius: 24, padding: 18, marginBottom: 10, borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Bell size={14} color={alert.color} />
              <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>{alert.t}</Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '700', marginBottom: 6, color: colors.icon }}>{alert.m}</Text>
            <Text style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', opacity: 0.7, color: colors.icon }}>{alert.time}</Text>
          </TouchableOpacity>
        ))}

        {/* Operational Load */}
        <View style={{ borderRadius: 28, padding: 24, marginVertical: 16, backgroundColor: colors.tint }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.background }}>Operational Load</Text>
            <View style={{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "rgba(0,0,0,0.1)" }}>
              <Text style={{ fontSize: 8, fontWeight: '800', color: colors.background }}>OPTIMIZED</Text>
            </View>
          </View>
          <View style={{ height: 8, borderRadius: 99, marginBottom: 14, overflow: 'hidden', backgroundColor: "rgba(0,0,0,0.15)" }}>
            <View style={{ height: '100%', width: '78%', borderRadius: 99, backgroundColor: colors.background }} />
          </View>
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.background }}>{totalStudents} Verified Students On-Board</Text>
        </View>

        {/* Fleet Table */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>Active Fleet Log</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}>
            <Download size={12} color={colors.icon} />
            <Text style={{ fontSize: 8, fontWeight: '800', color: colors.icon }}>EXPORT</Text>
          </TouchableOpacity>
        </View>
        <View style={{ borderRadius: 24, borderWidth: 1, overflow: 'hidden', backgroundColor: colors.card, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, backgroundColor: colors.background, borderBottomColor: colors.border }}>
            <Text style={{ flex: 1, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>Fleet ID</Text>
            <Text style={{ flex: 2, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>Route</Text>
            <Text style={{ flex: 1, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>Seats</Text>
            <Text style={{ flex: 1, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right', color: colors.icon }}>Status</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: colors.text }}>T-ASW-001</Text>
            <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} color={colors.tint} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.icon }}>Aqaleem → Stadium</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: colors.tint }}>32/40</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.2)" }}>
                <Text style={{ fontSize: 7, fontWeight: '800', letterSpacing: 1, color: colors.success || "#22c55e" }}>DEPLOYED</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

    </View>
  );
}