import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  LayoutGrid, Plus, Users, Route, Target,
  Bell, MessageCircle, BarChart2, Settings, LogOut, Bus,
} from "lucide-react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { router } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useThemeColor } from "../../constants/theme";
import BottomBar from "../../src/components/bar";

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
  const colors  = useThemeColor();
  const { logout } = useAuth();
  const current = props.state?.routeNames[props.state?.index];

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
        paddingTop: Platform.OS === "ios" ? 55 : 20,
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: 12,
          alignItems: "center", justifyContent: "center",
          backgroundColor: colors.tint,
        }}>
          <Bus size={18} color={colors.background} />
        </View>
        <View>
          <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text }}>
            Smart<Text style={{ color: colors.tint }}>Bus</Text>
          </Text>
          <View style={{
            borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
            marginTop: 2, alignSelf: "flex-start",
            backgroundColor: `${colors.tint}1A`,
            borderWidth: 1, borderColor: `${colors.tint}33`,
          }}>
            <Text style={{ fontSize: 7, fontWeight: "900", letterSpacing: 2, color: colors.tint }}>
              ADMIN
            </Text>
          </View>
        </View>
      </View>

      <Text style={{
        fontSize: 9, fontWeight: "800", letterSpacing: 3,
        textTransform: "uppercase", paddingHorizontal: 20,
        marginTop: 20, marginBottom: 8, color: colors.icon,
      }}>
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
              style={{
                flexDirection: "row", alignItems: "center", gap: 12,
                paddingHorizontal: 16, paddingVertical: 12,
                borderRadius: 16, marginHorizontal: 8, marginBottom: 2,
                backgroundColor: isActive ? `${colors.tint}1A` : "transparent",
              }}
              onPress={() => router.push(`/(admin)/${item.name}` as any)}
              activeOpacity={0.7}
            >
              <Icon size={18} color={isActive ? colors.tint : colors.icon} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: isActive ? colors.tint : colors.icon }}>
                {item.label}
              </Text>
              {isActive && (
                <View style={{
                  position: "absolute", left: 0,
                  width: 3, height: 20, borderRadius: 2,
                  backgroundColor: colors.tint,
                }} />
              )}
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* Logout */}
      <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, paddingHorizontal: 8 }}>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16 }}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={18} color="#ef4444" />
          <Text style={{ fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 2, color: "#ef4444" }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminLayout() {
  const colors = useThemeColor();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Drawer
          drawerContent={(props) => <AdminDrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerStyle: { backgroundColor: colors.card, width: 280 },
          }}
        />
        <BottomBar role="admin" />
      </View>
    </GestureHandlerRootView>
  );
}