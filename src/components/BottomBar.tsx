// src/components/Topbar.tsx
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { Home, Search, Bell, User } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";

export default function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();

  // فنكشن عشان نعرف إحنا في أنهي صفحة وننور الأيقونة بتاعتها
  const isActive = (route: string) => pathname.includes(route);

  return (
    <View style={styles.container}>
      {/* Home */}
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => router.push("/(admin)/dashboard")}
      >
        <Home size={24} color={isActive('dashboard') ? "#f7a01b" : "#8a8d91"} />
        <Text style={[styles.tabText, isActive('dashboard') && styles.activeText]}>Home</Text>
      </TouchableOpacity>

      {/* Search */}
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => router.push("/search")}
      >
        <Search size={24} color={isActive('search') ? "#f7a01b" : "#8a8d91"} />
        <Text style={[styles.tabText, isActive('search') && styles.activeText]}>Search</Text>
      </TouchableOpacity>

      {/* Notifications */}
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => router.push("/notifications")}
      >
        <Bell size={24} color={isActive('notifications') ? "#f7a01b" : "#8a8d91"} />
        <Text style={[styles.tabText, isActive('notifications') && styles.activeText]}>Alerts</Text>
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => router.push("/settings")} // أو صفحة البروفايل لو عملتيها
      >
        <User size={24} color={isActive('settings') ? "#f7a01b" : "#8a8d91"} />
        <Text style={[styles.tabText, isActive('settings') && styles.activeText]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#1c1e26",
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "#2d3036",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 10, // عشان الـ Home Indicator في الآيفون
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8a8d91",
  },
  activeText: {
    color: "#f7a01b",
  },
});