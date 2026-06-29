// src/components/Sidebar.tsx
import { usePathname, useRouter } from 'expo-router';
import {
  BarChart2, Bell, Bus, Calendar, HelpCircle,
  LayoutGrid, LogOut, Map, MessageCircle,
  Navigation, Plus, Route, Settings, Target, Users,
} from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '../../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext2';

// Nav items use translation keys for labels
const STUDENT_NAV = [
  { id: 'dashboard',     path: '/(student)/dashboard',     labelKey: 'nav_dashboard',     Icon: LayoutGrid },
  { id: 'book-trip',     path: '/(student)/book-trip',     labelKey: 'nav_bookTrip',      Icon: Calendar },
  { id: 'my-trips',      path: '/(student)/my-trips',      labelKey: 'nav_myTrips',       Icon: Route },
  { id: 'route-details', path: '/(student)/route-details', labelKey: 'nav_routeDetails',  Icon: Map },
  { id: 'track-bus',     path: '/(student)/track-bus',     labelKey: 'nav_trackBus',      Icon: Target },
  { id: 'attendance',    path: '/(student)/attendance',    labelKey: 'nav_attendance',    Icon: BarChart2 },
  { id: 'notifications', path: '/(student)/notifications', labelKey: 'nav_notifications', Icon: Bell },
  { id: 'route-chat',    path: '/(student)/route-chat',    labelKey: 'nav_liveChat',      Icon: MessageCircle },
];

const ADMIN_NAV = [
  { id: 'dashboard',     path: '/(admin)/dashboard',     labelKey: 'nav_dashboard',     Icon: LayoutGrid },
  { id: 'create-trip',   path: '/(admin)/create-trip',   labelKey: 'nav_createTrip',    Icon: Plus },
  { id: 'users',         path: '/(admin)/users',         labelKey: 'nav_users',         Icon: Users },
  { id: 'routes',        path: '/(admin)/routes',        labelKey: 'nav_manageRoutes',  Icon: Route },
  { id: 'trips',         path: '/(admin)/trips',         labelKey: 'nav_manageTrips',   Icon: Calendar },
  { id: 'live-tracking', path: '/(admin)/live-tracking', labelKey: 'nav_liveTracking',  Icon: Target },
  { id: 'notifications', path: '/(admin)/notifications', labelKey: 'nav_notifications', Icon: Bell },
  { id: 'support',       path: '/(admin)/support',       labelKey: 'nav_supportInbox',  Icon: MessageCircle },
];

const DRIVER_NAV = [
  { id: 'dashboard',     path: '/(driver)/dashboard',     labelKey: 'nav_dashboard',    Icon: LayoutGrid },
  { id: 'my-trips',      path: '/(driver)/my-trips',      labelKey: 'nav_myTrips',      Icon: Route },
  { id: 'live-tracking', path: '/(driver)/live-tracking', labelKey: 'nav_liveTracking', Icon: Navigation },
  { id: 'history',       path: '/(driver)/history',       labelKey: 'nav_history',      Icon: BarChart2 },
];

const STUDENT_BOTTOM = [
  { id: 'support',  path: '/(student)/support',  labelKey: 'nav_supportCenter',   Icon: HelpCircle },
  { id: 'settings', path: '/(student)/settings', labelKey: 'nav_profileSettings', Icon: Settings },
];

const ADMIN_BOTTOM = [
  { id: 'reports',  path: '/(admin)/reports',  labelKey: 'nav_systemReports', Icon: BarChart2 },
  { id: 'settings', path: '/(admin)/settings', labelKey: 'nav_settings',      Icon: Settings },
];

const DRIVER_BOTTOM = [
  { id: 'settings', path: '/(driver)/settings', labelKey: 'nav_profileSettings', Icon: Settings },
];

function NavItem({
  item, colors, onPress, active,
}: {
  item: { id: string; path: string; labelKey: string; Icon: any };
  colors: any;
  onPress: () => void;
  active: boolean;
}) {
  const { Icon } = item;
  const { t }    = useTranslation();
  return (
    <TouchableOpacity
      style={[s.navItem, { backgroundColor: active ? `${colors.tint}1A` : 'transparent' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {active && <View style={[s.accentBar, { backgroundColor: colors.tint }]} />}
      <Icon size={18} color={active ? colors.tint : colors.icon} strokeWidth={active ? 2.5 : 2} />
      <Text style={[s.navLabel, { color: active ? colors.tint : colors.icon }, active && s.navLabelActive]}>
        {t(item.labelKey)}
      </Text>
    </TouchableOpacity>
  );
}

interface SidebarProps {
  role: 'student' | 'admin' | 'driver' | null;
}

export default function Sidebar({ role }: SidebarProps) {
  const colors   = useThemeColor();
  const router   = useRouter();
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();
  const { logout } = useAuth();
  const { t }      = useTranslation();

  const NAV        = role === 'admin' ? ADMIN_NAV    : role === 'driver' ? DRIVER_NAV    : STUDENT_NAV;
  const BOTTOM_NAV = role === 'admin' ? ADMIN_BOTTOM : role === 'driver' ? DRIVER_BOTTOM : STUDENT_BOTTOM;

  const isActive = (id: string) => pathname.includes(id);

  const navigate = (path: string) => {
    closeSidebar();
    router.push(path as any);
  };

  const handleLogout = async () => {
    closeSidebar();
    await logout();
    router.replace('/(auth)/login' as any);
  };

  if (!isOpen) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={s.backdrop} onPress={closeSidebar} />

      <SafeAreaView
        edges={['top', 'bottom']}
        style={[s.drawer, { backgroundColor: colors.card, borderRightColor: colors.border }]}
      >
        {/* Logo */}
        <View style={[s.logoRow, { borderBottomColor: colors.border }]}>
          <View style={[s.logoIcon, { backgroundColor: colors.tint, shadowColor: colors.tint }]}>
            <Bus size={18} color="#000" />
          </View>
          <Text style={[s.logoText, { color: colors.text }]}>
            Smart<Text style={{ color: colors.tint }}>Bus</Text>
            {role === 'admin'  && <Text style={[s.roleBadge, { color: colors.tint }]}> {t('role_admin').toUpperCase()}</Text>}
            {role === 'driver' && <Text style={[s.roleBadge, { color: colors.tint }]}> {t('role_driver').toUpperCase()}</Text>}
          </Text>
        </View>

        {/* Main Nav */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.navScroll} showsVerticalScrollIndicator={false}>
          {NAV.map(item => (
            <NavItem key={item.id} item={item} colors={colors} active={isActive(item.id)} onPress={() => navigate(item.path)} />
          ))}
        </ScrollView>

        {/* Bottom Nav + Logout */}
        <View style={[s.bottomSection, { borderTopColor: colors.border }]}>
          {BOTTOM_NAV.map(item => (
            <NavItem key={item.id} item={item} colors={colors} active={isActive(item.id)} onPress={() => navigate(item.path)} />
          ))}
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
            <LogOut size={18} color="#ef4444" />
            <Text style={s.logoutTxt}>{t('sign_out').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    width: 272,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
  },
  logoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    height: 72, paddingHorizontal: 20, borderBottomWidth: 1,
  },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  logoText:      { fontSize: 18, fontWeight: '900', letterSpacing: -0.5, textTransform: 'uppercase' },
  roleBadge:     { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  navScroll:     { paddingHorizontal: 12, paddingTop: 20, paddingBottom: 8, gap: 4 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderRadius: 16, marginBottom: 2,
    position: 'relative', overflow: 'hidden',
  },
  accentBar:     { position: 'absolute', left: 0, width: 3, height: 20, borderRadius: 2 },
  navLabel:      { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  navLabelActive:{ fontWeight: '800' },
  bottomSection: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, gap: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 16, marginTop: 4,
  },
  logoutTxt: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#ef4444' },
});