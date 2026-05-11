import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  LayoutGrid, Plus, Users, Route, Target,
  Bell, MessageCircle, BarChart2, Settings, LogOut, Bus
} from "lucide-react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { router } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";

const ADMIN_NAV = [
  { name: "dashboard",     label: "Dashboard",        icon: LayoutGrid },
  { name: "create-trip",   label: "Create Trip",      icon: Plus },
  { name: "users",         label: "Users",            icon: Users },
  { name: "routes",        label: "Manage Routes",    icon: Route },
  { name: "trips",         label: "Manage Trips",     icon: Route },
  { name: "live-tracking", label: "Live Tracking",    icon: Target },
  { name: "notifications", label: "Notifications",    icon: Bell },
  { name: "support",       label: "Support Inbox",    icon: MessageCircle },
  { name: "reports",       label: "System Reports",   icon: BarChart2 },
  { name: "settings",      label: "Settings",         icon: Settings },
];

function AdminDrawerContent(props: any) {
  const { logout } = useAuth();
  const current = props.state?.routeNames[props.state?.index];

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.drawer}>
      <View style={styles.drawerLogo}>
        <View style={styles.logoBox}>
          <Bus size={20} color="#fff" />
        </View>
        <View>
          <Text style={styles.logoText}>
            Smart<Text style={{ color: "#f7a01b" }}>Bus</Text>
          </Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>
      </View>

      <Text style={styles.menuLabel}>Operational Command</Text>

      <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false}>
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => router.push(`/(admin)/${item.name}` as any)}
            >
              <Icon size={18} color={isActive ? "#f7a01b" : "#8a8d91"} />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
              {isActive && <View style={styles.activePill} />}
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      <View style={styles.drawerBottom}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <AdminDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: { backgroundColor: "#1c1e26", width: 280 },
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawer: { flex: 1, backgroundColor: "#1c1e26", paddingBottom: 20 },
  drawerLogo: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 20, paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: "#2d3036",
  },
  logoBox: {
    width: 36, height: 36, backgroundColor: "#f7a01b",
    borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 18, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  adminBadge: {
    backgroundColor: "rgba(247,160,27,0.1)", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, marginTop: 2,
    borderWidth: 1, borderColor: "rgba(247,160,27,0.2)",
    alignSelf: "flex-start",
  },
  adminBadgeText: { fontSize: 7, fontWeight: "900", color: "#f7a01b", letterSpacing: 1.5 },
  menuLabel: {
    fontSize: 9, fontWeight: "900", color: "#8a8d91",
    letterSpacing: 3, textTransform: "uppercase",
    paddingHorizontal: 20, marginTop: 20, marginBottom: 8,
  },
  navItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 16, marginHorizontal: 8, marginBottom: 2,
    position: "relative",
  },
  navItemActive: { backgroundColor: "rgba(247,160,27,0.1)" },
  navLabel: { fontSize: 13, fontWeight: "700", color: "#8a8d91" },
  navLabelActive: { color: "#f7a01b" },
  activePill: {
    position: "absolute", left: 0, width: 3,
    height: 20, backgroundColor: "#f7a01b", borderRadius: 2,
  },
  drawerBottom: {
    borderTopWidth: 1, borderTopColor: "#2d3036",
    paddingTop: 12, paddingHorizontal: 8,
  },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16,
  },
  logoutText: { fontSize: 11, fontWeight: "900", color: "#ef4444", textTransform: "uppercase", letterSpacing: 2 },
});