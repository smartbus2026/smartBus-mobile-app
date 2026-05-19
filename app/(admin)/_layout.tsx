import { DrawerContentScrollView } from "@react-navigation/drawer";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { router, usePathname } from "expo-router";
import { Drawer } from "expo-router/drawer";
import {
  BarChart2, Bell, Bus, LayoutGrid, LogOut,
  MessageCircle, Plus, Route, Settings, Target, Users,
} from "lucide-react-native";
import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "../../constants/theme";
import { useAuth } from "../../src/context/AuthContext";

const ADMIN_NAV = [
  { name: "dashboard",     label: "Dashboard",      icon: LayoutGrid },
  { name: "create-trip",   label: "Create Trip",    icon: Plus },
  { name: "users",         label: "Users",          icon: Users },
  { name: "routes",        label: "Manage Routes",  icon: Route },
  { name: "trips",         label: "Manage Trips",   icon: Route },
  { name: "live-tracking", label: "Live Tracking",  icon: Target },
  { name: "notifications", label: "Notifications",  icon: Bell },
  { name: "support",       label: "Support Inbox",  icon: MessageCircle },
  { name: "reports",       label: "System Reports", icon: BarChart2 },
  { name: "settings",      label: "Settings",       icon: Settings },
];

function AdminDrawerContent(props: any) {
  const colors     = useThemeColor();
  const { logout } = useAuth();
  const insets     = useSafeAreaInsets();
  const current    = props.state?.routeNames[props.state?.index];

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, paddingBottom: 20, backgroundColor: colors.card }}>

      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 10,
        paddingHorizontal: 20, paddingVertical: 20,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        paddingTop: insets.top + 10,
      }}>
        <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.tint }}>
          <Bus size={18} color={colors.background} />
        </View>
        <View>
          <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text }}>
            Smart<Text style={{ color: colors.tint }}>Bus</Text>
          </Text>
          <View style={{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2, alignSelf: "flex-start", backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33` }}>
            <Text style={{ fontSize: 7, fontWeight: "900", letterSpacing: 2, color: colors.tint }}>ADMIN</Text>
          </View>
        </View>
      </View>

      <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 3, textTransform: "uppercase", paddingHorizontal: 20, marginTop: 20, marginBottom: 8, color: colors.icon }}>
        Operational Command
      </Text>

      {/* Nav Links */}
      <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false}>
        {ADMIN_NAV.map((item) => {
          const Icon     = item.icon;
          const isActive = current === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, marginHorizontal: 8, marginBottom: 2, backgroundColor: isActive ? `${colors.tint}1A` : "transparent" }}
              onPress={() => router.push(`/(admin)/${item.name}` as any)}
              activeOpacity={0.7}
            >
              <Icon size={18} color={isActive ? colors.tint : colors.icon} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: isActive ? colors.tint : colors.icon }}>{item.label}</Text>
              {isActive && <View style={{ position: "absolute", left: 0, width: 3, height: 20, borderRadius: 2, backgroundColor: colors.tint }} />}
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* ✅ Logout */}
      <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, paddingHorizontal: 8 }}>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16 }}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={18} color="#ef4444" />
          <Text style={{ fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 2, color: "#ef4444" }}>Sign Out</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

function AdminBottomBar() {
  const colors    = useThemeColor();
  const pathname  = usePathname();

  const isActive = (route: string) => pathname.includes(route.toLowerCase());

  // ✅ بدون زر Menu
  const tabs = [
    { id: "dashboard",     label: "Home",    icon: LayoutGrid, path: "/(admin)/dashboard" },
    { id: "trips",         label: "Trips",   icon: Route,      path: "/(admin)/trips" },
    { id: "notifications", label: "Alerts",  icon: Bell,       path: "/(admin)/notifications" },
    { id: "reports",       label: "Reports", icon: BarChart2,  path: "/(admin)/reports" },
  ];

  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: colors.card,
      borderTopWidth: 1, borderTopColor: colors.border,
      height: Platform.OS === 'ios' ? 85 : 70,
      paddingBottom: Platform.OS === 'ios' ? 25 : 10,
      paddingTop: 10,
      zIndex: 999,
      elevation: 10,
    }}>
      {tabs.map((tab) => {
        const Icon   = tab.icon;
        const active = isActive(tab.id);
        return (
          <TouchableOpacity
            key={tab.id}
            style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}
            onPress={() => router.push(tab.path as any)}
            activeOpacity={0.7}
          >
            <Icon size={22} color={active ? colors.tint : colors.icon} />
            <Text style={{ fontSize: 10, fontWeight: '700', marginTop: 4, color: active ? colors.tint : colors.icon }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AdminLayout() {
  const colors = useThemeColor();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <AdminDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: { backgroundColor: colors.card, width: 280 },
        }}
      />
      <AdminBottomBar />
    </GestureHandlerRootView>
  );
}