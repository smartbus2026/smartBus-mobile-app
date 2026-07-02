// app/(student)/_layout.tsx
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Home, Bell, User, Bus, LogOut,
  Map, BookOpen, Navigation, MessageCircle,
  HelpCircle, Calendar, Route,
} from "lucide-react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { router, usePathname } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { Colors } from "../../constants/theme";
import { useTheme } from "../../src/context/ThemeContext";
import { isCurrentLanguageRTL } from "../../src/i18n";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Chatbot from "../../src/components/Chatbot";

const STUDENT_NAV = [
  { name: "dashboard",     label: "Home",          icon: Home },
  { name: "my-trips",      label: "My Trips",      icon: Route },
  { name: "book-trip",     label: "Book a Trip",   icon: BookOpen },
  { name: "attendance",    label: "Attendance",    icon: Calendar },
  { name: "track-bus",     label: "Track Bus",     icon: Navigation },
  { name: "route-details", label: "Route Details", icon: Map },
  { name: "route-chat",    label: "Route Chat",    icon: MessageCircle },
  { name: "notifications", label: "Notifications", icon: Bell },
  { name: "support",       label: "Support",       icon: HelpCircle },
  { name: "settings",      label: "Profile",       icon: User },
];

const BOTTOM_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 70;

// ─── Drawer Content ───────────────────────────────────────────────────────────
function StudentDrawerContent(props: any) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const current = props.state?.routeNames[props.state?.index];
  const isRTL = isCurrentLanguageRTL();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>

      {/* Brand Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 20, paddingVertical: 20,
        paddingTop: insets.top + 10,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <View style={{
          width: 48, height: 48, borderRadius: 16,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: `${colors.tint}1A`,
          borderWidth: 1, borderColor: `${colors.tint}33`,
        }}>
          <Bus size={22} color={colors.tint} />
        </View>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>
            Smart<Text style={{ color: colors.tint }}>Bus</Text>
          </Text>
          <View style={{
            alignSelf: 'flex-start', marginTop: 4,
            borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
            backgroundColor: `${colors.tint}1A`,
            borderWidth: 1, borderColor: `${colors.tint}33`,
          }}>
            <Text style={{ fontSize: 7, fontWeight: '900', letterSpacing: 2, color: colors.tint }}>
              STUDENT
            </Text>
          </View>
        </View>
      </View>

      {/* Nav Label */}
      <Text style={{
        fontSize: 9, fontWeight: '800', letterSpacing: 3,
        textTransform: 'uppercase', color: colors.icon,
        paddingHorizontal: 20, marginTop: 20, marginBottom: 8,
      }}>
        Navigation
      </Text>

      {/* Nav Items */}
      <View style={{ flex: 1 }}>
        <DrawerContentScrollView
          {...props}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {STUDENT_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = current === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                activeOpacity={0.7}
                onPress={() => router.push(`/(student)/${item.name}` as any)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 16, paddingVertical: 10,
                  borderRadius: 16, marginHorizontal: 8, marginBottom: 2,
                  backgroundColor: isActive ? `${colors.tint}1A` : 'transparent',
                }}
              >
                {isActive && (
                  <View style={[{
                    position: 'absolute',
                    width: 3, height: 20, borderRadius: 2,
                    backgroundColor: colors.tint,
                  }, isRTL ? { right: 0 } : { left: 0 }]} />
                )}
                <Icon size={18} color={isActive ? colors.tint : colors.icon} />
                <Text style={{
                  fontSize: 13, fontWeight: '700',
                  color: isActive ? colors.tint : colors.icon,
                }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </DrawerContentScrollView>
      </View>

      {/* Logout */}
      <View style={{
        borderTopWidth: 1, borderTopColor: colors.border,
        paddingTop: 8, paddingHorizontal: 8,
        paddingBottom: BOTTOM_BAR_HEIGHT + 8,
      }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleLogout}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            paddingHorizontal: 16, paddingVertical: 14,
            borderRadius: 16, borderWidth: 1,
            backgroundColor: 'rgba(239,68,68,0.08)',
            borderColor: 'rgba(239,68,68,0.2)',
          }}
        >
          <LogOut size={18} color="#ef4444" />
          <Text style={{
            fontSize: 11, fontWeight: '900',
            textTransform: 'uppercase', letterSpacing: 2,
            color: '#ef4444',
          }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Bottom Bar ───────────────────────────────────────────────────────────────
function StudentBottomBar() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const pathname = usePathname();
  const isActive = (route: string) => pathname.includes(route.toLowerCase());

  const tabs = [
    { id: "dashboard",     label: "Home",    icon: Home,  path: "/(student)/dashboard" },
    { id: "my-trips",      label: "Trips",   icon: Route, path: "/(student)/my-trips" },
    { id: "notifications", label: "Alerts",  icon: Bell,  path: "/(student)/notifications" },
    { id: "settings",      label: "Profile", icon: User,  path: "/(student)/settings" },
  ];

  return (
    <View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
      height: BOTTOM_BAR_HEIGHT,
      paddingBottom: Platform.OS === 'ios' ? 25 : 30,
      paddingTop: 20,
      backgroundColor: colors.card,
      borderTopWidth: 1, borderTopColor: colors.border,
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.id);
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.7}
            onPress={() => router.push(tab.path as any)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon size={22} color={active ? colors.tint : colors.icon} />
            <Text style={{
              fontSize: 10, fontWeight: '700', marginTop: 4,
              color: active ? colors.tint : colors.icon,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function StudentLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <StudentDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: { backgroundColor: colors.card, width: 280 },
        }}
      />
      <StudentBottomBar />
      <Chatbot />
    </GestureHandlerRootView>
  );
}