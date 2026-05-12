import { View, Text, TouchableOpacity } from "react-native";
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  LayoutGrid, Plus, Users, Route, Target,
  Bell, MessageCircle, BarChart2, Settings, LogOut, Bus
} from "lucide-react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { router } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
// ضفنا الاستدعاء بتاع البار هنا
import Appbar from "../../src/components/bar"; 
import { useThemeColor } from "../../constants/theme"; // 🟢 استدعاء الهوك

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
  const colors = useThemeColor(); // 🟢 سحب الألوان
  const { logout } = useAuth();
  const current = props.state?.routeNames[props.state?.index];

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View className="flex-1 pb-5" style={{ backgroundColor: colors.card }}>
      
      {/* Drawer Logo Header */}
      <View 
        className="flex-row items-center gap-2.5 px-5 py-5 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <View 
          className="w-9 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: colors.tint }}
        >
          <Bus size={20} color={colors.background} />
        </View>
        <View>
          <Text className="text-lg font-black tracking-tight" style={{ color: colors.text }}>
            Smart<Text style={{ color: colors.tint }}>Bus</Text>
          </Text>
          <View 
            className="rounded-md px-1.5 py-0.5 mt-0.5 border self-start"
            style={{ backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}33` }}
          >
            <Text className="text-[7px] font-black tracking-widest" style={{ color: colors.tint }}>ADMIN</Text>
          </View>
        </View>
      </View>

      <Text className="text-[9px] font-black tracking-[3px] uppercase px-5 mt-5 mb-2" style={{ color: colors.icon }}>
        Operational Command
      </Text>

      {/* Navigation Links */}
      <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false}>
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              className="flex-row items-center gap-3 px-4 py-3 rounded-2xl mx-2 mb-0.5 relative"
              style={{ backgroundColor: isActive ? `${colors.tint}1A` : "transparent" }}
              onPress={() => router.push(`/(admin)/${item.name}` as any)}
              activeOpacity={0.7}
            >
              <Icon size={18} color={isActive ? colors.tint : colors.icon} />
              <Text className="text-[13px] font-bold" style={{ color: isActive ? colors.tint : colors.icon }}>
                {item.label}
              </Text>
              {isActive && (
                <View className="absolute left-0 w-[3px] h-5 rounded-sm" style={{ backgroundColor: colors.tint }} />
              )}
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* Logout Button */}
      <View className="border-t pt-3 px-2" style={{ borderTopColor: colors.border }}>
        <TouchableOpacity 
          className="flex-row items-center gap-3 px-4 py-3.5 rounded-2xl"
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={18} color={colors.error || "#ef4444"} />
          <Text className="text-[11px] font-black uppercase tracking-widest" style={{ color: colors.error || "#ef4444" }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

export default function AdminLayout() {
  const colors = useThemeColor(); // 🟢 سحب الألوان لخصائص الـ Drawer

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
        
        {/* البار الثابت هيترندر هنا مرة واحدة بس ويغطي التطبيق من تحت */}
        {/* <Appbar /> */}
      </View>
    </GestureHandlerRootView>
  );
}