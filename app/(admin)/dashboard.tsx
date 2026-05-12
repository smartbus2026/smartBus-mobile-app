import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator
} from "react-native";
import { 
  Users, Bus, BarChart2, CheckCircle, 
  Bell, Download, MapPin, Plus, Route 
} from "lucide-react-native";
import { useRouter } from "expo-router";
import api from "../../src/services/api";
import Appbar from "../../src/components/bar";
import { useThemeColor } from "../../constants/theme"; // 🟢 استدعاء الهوك بتاعنا

export default function AdminDashboard() {
  const colors = useThemeColor(); // 🟢 سحب الألوان
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
    { label: "Create Trip", icon: <Plus size={20} color={colors.background} />, path: "/(admin)/create-trip", color: colors.tint },
    { label: "Add Route", icon: <Route size={20} color="#fff" />, path: "/(admin)/routes", color: "#3b82f6" },
    { label: "Users", icon: <Users size={20} color="#fff" />, path: "/(admin)/users", color: colors.success || "#22c55e" },
  ];

  const stats = [
    { title: "Total Students", value: loading ? "..." : totalStudents.toLocaleString(), trend: "+12% from last week", icon: <Users size={22} color={colors.tint} />, positive: true },
    { title: "Active Routes", value: loading ? "..." : totalRoutes.toString(), trend: "Fully operational", icon: <Bus size={22} color={colors.tint} />, positive: true },
    { title: "Occupancy Rate", value: "84%", trend: "+5% from yesterday", icon: <BarChart2 size={22} color={colors.tint} />, positive: true },
    { title: "System Status", value: "Stable", trend: "All systems online", icon: <CheckCircle size={22} color={colors.tint} />, positive: true },
  ];

  const alerts = [
    { t: "Registration closing", m: "Window closes in 2h", color: colors.tint, time: "5 MIN AGO" },
    { t: "Fleet Update", m: "Bus #3 reached Stadium", color: colors.success || "#22c55e", time: "17 MIN AGO" },
    { t: "New User", m: "Student ID #924 verified", color: "#3b82f6", time: "29 MIN AGO" },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120 }} // 🟢 ظبطنا البادينج من فوق وتحت
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
            <View>
                <Text className="text-[22px] font-black tracking-tight" style={{ color: colors.text }}>System Overview</Text>
                <Text className="text-xs font-semibold mt-1" style={{ color: colors.icon }}>Admin Command Center</Text>
            </View>
            <View 
              className="px-2.5 py-1.5 rounded-lg border" 
              style={{ backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}33` }}
            >
                <Text className="text-[8px] font-black tracking-widest" style={{ color: colors.tint }}>ADMIN PANEL</Text>
            </View>
        </View>

        {/* Quick Actions */}
        <Text className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: colors.icon }}>Quick Actions</Text>
        <View className="flex-row gap-3 mb-6">
          {quickActions.map((action, i) => (
            <TouchableOpacity 
              key={i} 
              className="flex-1 rounded-[20px] p-4 items-center border"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
              onPress={() => router.push(action.path as any)}
              activeOpacity={0.8}
            >
              <View className="w-10 h-10 rounded-[12px] items-center justify-center mb-2" style={{ backgroundColor: action.color }}>
                {action.icon}
              </View>
              <Text className="text-[10px] font-extrabold text-center" style={{ color: colors.text }}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <Text className="text-[9px] font-black uppercase tracking-widest mt-2 mb-3" style={{ color: colors.icon }}>System Performance</Text>
        <View className="flex-row flex-wrap justify-between mb-6">
          {stats.map((stat, i) => (
            <View 
              key={i} 
              className="w-[48%] rounded-[24px] p-5 mb-3 border"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <View className="flex-row justify-between items-start mb-3">
                <Text className="text-[9px] font-black uppercase tracking-widest flex-1 mr-2" style={{ color: colors.icon }}>{stat.title}</Text>
                <View 
                  className="w-11 h-11 rounded-[14px] items-center justify-center border"
                  style={{ backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}26` }}
                >
                  {stat.icon}
                </View>
              </View>
              <Text className="text-[28px] font-black tracking-tighter mb-1" style={{ color: colors.text }}>{stat.value}</Text>
              <Text className="text-[8px] font-black uppercase tracking-widest" style={{ color: stat.positive ? (colors.success || "#22c55e") : colors.icon }}>
                {stat.trend}
              </Text>
            </View>
          ))}
        </View>

        {/* Live Tracking Card */}
        <View className="flex-row justify-between items-center mb-3 px-1">
          <Text className="text-[9px] font-black uppercase tracking-widest" style={{ color: colors.icon }}>Fleet Live Tracking</Text>
          <Text className="text-[8px] font-black tracking-widest" style={{ color: colors.tint }}>NETWORK_SATELLITE ↗</Text>
        </View>
        <View 
          className="h-[200px] rounded-[32px] border mb-6 items-center justify-center overflow-hidden"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View 
            className="absolute top-4 left-4 flex-row items-center gap-2 rounded-xl px-3 py-1.5 border"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", borderColor: "rgba(34,197,94,0.3)" }}
          >
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.success || "#22c55e" }} />
            <Text className="text-[8px] font-black tracking-widest" style={{ color: colors.success || "#22c55e" }}>Aswan_Fleet_Active</Text>
          </View>
          <Text className="text-[13px] font-bold" style={{ color: colors.border }}>[ Live Map Placeholder ]</Text>
        </View>

        {/* Alerts */}
        <Text className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: colors.icon }}>System Intelligence</Text>
        {alerts.map((alert, i) => (
          <TouchableOpacity 
            key={i} 
            className="rounded-[24px] p-[18px] mb-2.5 border"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center gap-2 mb-1.5">
              <Bell size={14} color={alert.color} />
              <Text className="text-[9px] font-black uppercase tracking-widest" style={{ color: colors.text }}>{alert.t}</Text>
            </View>
            <Text className="text-[11px] font-bold mb-1.5" style={{ color: colors.icon }}>{alert.m}</Text>
            <Text className="text-[8px] font-black uppercase" style={{ color: colors.icon, opacity: 0.7 }}>{alert.time}</Text>
          </TouchableOpacity>
        ))}

        {/* Operational Load */}
        <View className="rounded-[28px] p-6 my-4" style={{ backgroundColor: colors.tint }}>
          <View className="flex-row justify-between items-center mb-3.5">
            <Text className="text-[9px] font-black uppercase tracking-widest" style={{ color: colors.background }}>Operational Load</Text>
            <View className="rounded-lg px-2 py-1" style={{ backgroundColor: "rgba(0,0,0,0.1)" }}>
              <Text className="text-[8px] font-black" style={{ color: colors.background }}>OPTIMIZED</Text>
            </View>
          </View>
          <View className="h-2 rounded-full mb-3.5 overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.15)" }}>
            <View className="h-full w-[78%] rounded-full" style={{ backgroundColor: colors.background }} />
          </View>
          <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.background }}>
            {totalStudents} Verified Students On-Board
          </Text>
        </View>

        {/* Fleet Table */}
        <View className="flex-row justify-between items-center mb-3 mt-2 px-1">
          <Text className="text-[9px] font-black uppercase tracking-widest" style={{ color: colors.icon }}>Active Fleet Log</Text>
          <TouchableOpacity 
            className="flex-row items-center gap-1.5 rounded-xl px-3 py-2 border"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Download size={12} color={colors.icon} />
            <Text className="text-[8px] font-black" style={{ color: colors.icon }}>EXPORT</Text>
          </TouchableOpacity>
        </View>

        <View className="rounded-[24px] border overflow-hidden" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <View className="flex-row px-4 py-3 border-b" style={{ backgroundColor: colors.background, borderBottomColor: colors.border }}>
            <Text className="text-[8px] font-black uppercase tracking-widest" style={{ flex: 1, color: colors.icon }}>Fleet ID</Text>
            <Text className="text-[8px] font-black uppercase tracking-widest" style={{ flex: 2, color: colors.icon }}>Route</Text>
            <Text className="text-[8px] font-black uppercase tracking-widest" style={{ flex: 1, color: colors.icon }}>Seats</Text>
            <Text className="text-[8px] font-black uppercase tracking-widest text-right" style={{ flex: 1, color: colors.icon }}>Status</Text>
          </View>
          <View className="flex-row items-center px-4 py-3.5">
            <Text className="text-[10px] font-black uppercase" style={{ flex: 1, color: colors.text }}>T-ASW-001</Text>
            <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MapPin size={12} color={colors.tint} />
              <Text className="text-[10px] font-bold" style={{ color: colors.icon }}>Aqaleem → Stadium</Text>
            </View>
            <Text className="text-[10px] font-black uppercase" style={{ flex: 1, color: colors.tint }}>32/40</Text>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <View 
                className="rounded-full px-2 py-1 border"
                style={{ backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.2)" }}
              >
                <Text className="text-[7px] font-black tracking-widest" style={{ color: colors.success || "#22c55e" }}>DEPLOYED</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Appbar ثابت تحت */}
      <Appbar />
    </View>
  );
}