import React from "react";
import { View, TouchableOpacity, StyleSheet, Text, Platform } from "react-native";
import { Home, Search, Bell, Menu } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";

export default function Appbar() {
  const router = useRouter();
  const pathname = usePathname();
  const navigation = useNavigation();

  const isActive = (route: string) => pathname.includes(route);

  const tabs = [
    { id: "dashboard", label: "Home", icon: Home, path: "/(admin)/dashboard" },
    { id: "search", label: "Search", icon: Search, path: "/search" },
    { id: "notifications", label: "Alerts", icon: Bell, path: "/(admin)/notifications" },
  ];

  const openDrawer = () => {
    // بنجرب كل المستويات
    try {
      navigation.dispatch(DrawerActions.openDrawer());
    } catch {
      try {
        navigation.getParent()?.dispatch(DrawerActions.openDrawer());
      } catch {
        navigation.getParent()?.getParent()?.dispatch(DrawerActions.openDrawer());
      }
    }
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.id);
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => router.push(tab.path as any)}
            activeOpacity={0.7}
          >
            <Icon size={22} color={active ? "#f7a01b" : "#8a8d91"} />
            <Text style={[styles.tabLabel, active && styles.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.tab} onPress={openDrawer} activeOpacity={0.7}>
        <Menu size={22} color="#8a8d91" />
        <Text style={styles.tabLabel}>Menu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#1c1e26",
    height: Platform.OS === "ios" ? 105 : 90,
    borderTopWidth: 1,
    borderTopColor: "#2d3036",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === "ios" ? 35 : 25,
    paddingTop: 8,
  },
  tab: { alignItems: "center", justifyContent: "center", flex: 1 },
  tabLabel: { fontSize: 10, fontWeight: "700", color: "#8a8d91", marginTop: 4 },
  activeLabel: { color: "#f7a01b" },
});