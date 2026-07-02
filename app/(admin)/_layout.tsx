import { DrawerContentScrollView } from "@react-navigation/drawer";
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
import { useTranslation } from "react-i18next";
import { useThemeColor } from "../../constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { isCurrentLanguageRTL } from "../../src/i18n";

const ADMIN_NAV = [
  { name: "dashboard",     labelKey: "nav_dashboard",     icon: LayoutGrid },
  { name: "create-trip",   labelKey: "nav_createTrip",    icon: Plus },
  { name: "users",         labelKey: "nav_users",         icon: Users },
  { name: "routes",        labelKey: "nav_manageRoutes",  icon: Route },
  { name: "trips",         labelKey: "nav_manageTrips",   icon: Route },
  { name: "live-tracking", labelKey: "nav_liveTracking",  icon: Target },
  { name: "notifications", labelKey: "nav_notifications", icon: Bell },
  { name: "support",       labelKey: "nav_supportInbox",  icon: MessageCircle },
  { name: "reports",       labelKey: "nav_systemReports", icon: BarChart2 },
  { name: "settings",      labelKey: "nav_settings",      icon: Settings },
];

const BOTTOM_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 70;

function AdminDrawerContent(props: any) {
  const colors     = useThemeColor();
  const { logout } = useAuth();
  const insets     = useSafeAreaInsets();
  const { t }      = useTranslation();
  const current    = props.state?.routeNames[props.state?.index];

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>

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
            <Text style={{ fontSize: 7, fontWeight: "900", letterSpacing: 2, color: colors.tint }}>{t('role_admin').toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 3, textTransform: "uppercase", paddingHorizontal: 20, marginTop: 20, marginBottom: 8, color: colors.icon }}>
        {t('operational_command')}
      </Text>

      <View style={{ flex: 1 }}>
        <DrawerContentScrollView
          {...props}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
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
                <Text style={{ fontSize: 13, fontWeight: "700", color: isActive ? colors.tint : colors.icon }}>{t(item.labelKey)}</Text>
                {isActive && (
                  <View
                    style={{
                      position: "absolute",
                      ...(isCurrentLanguageRTL() ? { right: 0 } : { left: 0 }),
                      width: 3, height: 20, borderRadius: 2, backgroundColor: colors.tint,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </DrawerContentScrollView>
      </View>

      <View style={{
        borderTopWidth: 1, borderTopColor: colors.border,
        paddingTop: 12,
        paddingBottom: BOTTOM_BAR_HEIGHT + 8,
        paddingHorizontal: 8,
      }}>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.08)' }}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={18} color="#ef4444" />
          <Text style={{ fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 2, color: "#ef4444" }}>{t('sign_out').toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

function AdminBottomBar() {
  const colors   = useThemeColor();
  const pathname = usePathname();
  const { t }    = useTranslation();

  const isActive = (route: string) => pathname.includes(route.toLowerCase());

  const tabs = [
    { id: "dashboard",     labelKey: "nav_home",    icon: LayoutGrid, path: "/(admin)/dashboard" },
    { id: "trips",         labelKey: "nav_trips",   icon: Route,      path: "/(admin)/trips" },
    { id: "notifications", labelKey: "nav_alerts",  icon: Bell,       path: "/(admin)/notifications" },
    { id: "reports",       labelKey: "nav_reports", icon: BarChart2,  path: "/(admin)/reports" },
  ];

  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: colors.card,
      borderTopWidth: 1, borderTopColor: colors.border,
      height: BOTTOM_BAR_HEIGHT,
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
              {t(tab.labelKey)}
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