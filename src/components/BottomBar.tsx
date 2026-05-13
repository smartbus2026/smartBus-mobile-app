import React from "react";
import { View, TouchableOpacity, Text, Platform, StyleSheet } from "react-native";
import { Home, Route, Bell, User, Menu } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import { useThemeColor } from "../../constants/theme";
import { useDrawerStatus } from "@react-navigation/drawer";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";

interface BottomBarProps {
  role: "admin" | "student";
}

const ADMIN_TABS = [
  { id: "dashboard",     label: "Home",    icon: Home,  path: "/(admin)/dashboard" },
  { id: "trips",         label: "Trips",   icon: Route, path: "/(admin)/trips" },
  { id: "notifications", label: "Alerts",  icon: Bell,  path: "/(admin)/notifications" },
];

const STUDENT_TABS = [
  { id: "dashboard",     label: "Home",    icon: Home,  path: "/(student)/dashboard" },
  { id: "my-trips",      label: "Trips",   icon: Route, path: "/(student)/my-trips" },
  { id: "notifications", label: "Alerts",  icon: Bell,  path: "/(student)/notifications" },
  { id: "settings",      label: "Profile", icon: User,  path: "/(student)/settings" },
];

export default function BottomBar({ role }: BottomBarProps) {
  const colors   = useThemeColor();
  const router   = useRouter();
  const pathname = usePathname();
  const navigation = useNavigation();

  const isActive = (id: string) => pathname.includes(id.toLowerCase());
  const tabs = role === "admin" ? ADMIN_TABS : STUDENT_TABS;

  const openDrawer = () => {
    // بنجرب نفتح الـ drawer من كل الـ parents المحتملة
    const nav = navigation as any;
    try { nav.dispatch(DrawerActions.openDrawer()); return; } catch {}
    try { nav.getParent()?.dispatch(DrawerActions.openDrawer()); return; } catch {}
    try { nav.getParent()?.getParent()?.dispatch(DrawerActions.openDrawer()); return; } catch {}
    try { nav.getParent()?.getParent()?.getParent()?.dispatch(DrawerActions.openDrawer()); } catch {}
  };

  return (
    <View style={[s.bar, {
      backgroundColor: colors.card,
      borderTopColor:  colors.border,
      height:          Platform.OS === "ios" ? 85 : 70,
      paddingBottom:   Platform.OS === "ios" ? 25 : 10,
    }]}>
      {tabs.map((tab) => {
        const Icon   = tab.icon;
        const active = isActive(tab.id);
        return (
          <TouchableOpacity
            key={tab.id}
            style={s.tab}
            onPress={() => router.push(tab.path as any)}
            activeOpacity={0.7}
          >
            <Icon size={22} color={active ? colors.tint : colors.icon} />
            <Text style={[s.label, { color: active ? colors.tint : colors.icon }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Menu Button → يفتح الـ Drawer */}
      <TouchableOpacity style={s.tab} onPress={openDrawer} activeOpacity={0.7}>
        <Menu size={22} color={colors.icon} />
        <Text style={[s.label, { color: colors.icon }]}>Menu</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection:  "row",
    justifyContent: "space-around",
    alignItems:     "center",
    position:       "absolute",
    bottom: 0, left: 0, right: 0,
    borderTopWidth: 1,
    paddingTop:     10,
  },
  tab:   { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  label: { fontSize: 10, fontWeight: "700" },
});