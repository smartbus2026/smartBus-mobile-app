import React from "react";
import { View, TouchableOpacity, Text, Platform } from "react-native";
import { Home, Route, Bell, Menu } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useThemeColor } from "../../constants/theme"; // 🟢 استدعاء الهوك

export default function Appbar() {
  const colors = useThemeColor(); // 🟢 سحب الألوان
  const router = useRouter();
  const pathname = usePathname();
  const navigation = useNavigation();

  // خليناها toLowerCase عشان تتطابق صح مع اللينكات
  const isActive = (route: string) => pathname.includes(route.toLowerCase());

  const tabs = [
    { id: "dashboard", label: "Home", icon: Home, path: "/(admin)/dashboard" },
    { id: "trips", label: "Trips", icon: Route, path: "/(admin)/trips" }, // 🟢 اتعدلت عشان تماتش الراوتر صح
    { id: "notifications", label: "Alerts", icon: Bell, path: "/(admin)/notifications" },
  ];

  const openDrawer = () => {
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
    <View 
      className="flex-row justify-around items-center absolute bottom-0 left-0 right-0 border-t pt-2"
      style={{ 
        backgroundColor: colors.card, 
        borderTopColor: colors.border,
        height: Platform.OS === "ios" ? 105 : 90,
        paddingBottom: Platform.OS === "ios" ? 35 : 25,
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.id);
        return (
          <TouchableOpacity
            key={tab.id}
            className="items-center justify-center flex-1"
            onPress={() => router.push(tab.path as any)}
            activeOpacity={0.7}
          >
            <Icon size={22} color={active ? colors.tint : colors.icon} />
            <Text 
              className="text-[10px] font-bold mt-1" 
              style={{ color: active ? colors.tint : colors.icon }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity 
        className="items-center justify-center flex-1" 
        onPress={openDrawer} 
        activeOpacity={0.7}
      >
        <Menu size={22} color={colors.icon} />
        <Text className="text-[10px] font-bold mt-1" style={{ color: colors.icon }}>
          Menu
        </Text>
      </TouchableOpacity>
    </View>
  );
}