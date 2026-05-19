import { usePathname, useRouter } from 'expo-router';
import {
  BarChart2, Bell,
  Bus,
  Calendar,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Map,
  MessageCircle, Plus,
  Route,
  Settings,
  Target,
  Users
} from 'lucide-react-native';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '../../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext2';

// ─── Nav lists (mirrors the web Sidebar) ────────────────────────────────────

const STUDENT_NAV = [
  { id: 'dashboard',     path: '/(student)/dashboard',      label: 'Dashboard',      Icon: LayoutGrid },
  { id: 'book-trip',     path: '/(student)/book-trip',      label: 'Book Trip',      Icon: Calendar },
  { id: 'my-trips',      path: '/(student)/my-trips',       label: 'My Trips',       Icon: Route },
  { id: 'route-details', path: '/(student)/route-details',  label: 'Route Details',  Icon: Map },
  { id: 'track-bus',     path: '/(student)/track-bus',      label: 'Track Bus',      Icon: Target },
  { id: 'attendance',    path: '/(student)/attendance',     label: 'Attendance',     Icon: BarChart2 },
  { id: 'notifications', path: '/(student)/notifications',  label: 'Notifications',  Icon: Bell },
  { id: 'route-chat',    path: '/(student)/route-chat',     label: 'Live Chat',      Icon: MessageCircle },
];

const ADMIN_NAV = [
  { id: 'dashboard',     path: '/(admin)/dashboard',        label: 'Dashboard',      Icon: LayoutGrid },
  { id: 'create-trip',   path: '/(admin)/create-trip',      label: 'Create Trip',    Icon: Plus },
  { id: 'users',         path: '/(admin)/users',            label: 'Users',          Icon: Users },
  { id: 'routes',        path: '/(admin)/routes',           label: 'Manage Routes',  Icon: Route },
  { id: 'trips',         path: '/(admin)/trips',            label: 'Manage Trips',   Icon: Calendar },
  { id: 'live-tracking', path: '/(admin)/live-tracking',    label: 'Live Tracking',  Icon: Target },
  { id: 'notifications', path: '/(admin)/notifications',    label: 'Notifications',  Icon: Bell },
  { id: 'support',       path: '/(admin)/support',          label: 'Support Inbox',  Icon: MessageCircle },
];

const STUDENT_BOTTOM = [
  { id: 'support',  path: '/(student)/support',  label: 'Support Center',   Icon: HelpCircle },
  { id: 'settings', path: '/(student)/settings', label: 'Profile Settings', Icon: Settings },
];

const ADMIN_BOTTOM = [
  { id: 'reports',  path: '/(admin)/reports',  label: 'System Reports', Icon: BarChart2 },
  { id: 'settings', path: '/(admin)/settings', label: 'Settings',       Icon: Settings },
];

// ─── Single nav item ─────────────────────────────────────────────────────────

function NavItem({
  item, colors, onPress, active,
}: {
  item: { id: string; path: string; label: string; Icon: any };
  colors: any;
  onPress: () => void;
  active: boolean;
}) {
  const { Icon } = item;
  return (
    <TouchableOpacity
      style={[
        s.navItem,
        active
          ? { backgroundColor: `${colors.tint}1A` }
          : { backgroundColor: 'transparent' },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* left accent bar */}
      {active && (
        <View style={[s.accentBar, { backgroundColor: colors.tint }]} />
      )}
      <Icon size={18} color={active ? colors.tint : colors.icon} strokeWidth={active ? 2.5 : 2} />
      <Text style={[s.navLabel, { color: active ? colors.tint : colors.icon }, active && s.navLabelActive]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  role: 'student' | 'admin' | null;
}

export default function Sidebar({ role }: SidebarProps) {
  const colors   = useThemeColor();
  const router   = useRouter();
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();
  const { logout } = useAuth();

  const NAV        = role === 'admin' ? ADMIN_NAV    : STUDENT_NAV;
  const BOTTOM_NAV = role === 'admin' ? ADMIN_BOTTOM : STUDENT_BOTTOM;

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

      {/* ── Backdrop ── */}
      <Pressable
        style={[s.backdrop]}
        onPress={closeSidebar}
      />

      {/* ── Drawer ── */}
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
            {role === 'admin' && (
              <Text style={[s.adminBadge, { color: colors.tint }]}> ADMIN</Text>
            )}
          </Text>
        </View>

        {/* Main Nav */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.navScroll}
          showsVerticalScrollIndicator={false}
        >
          {NAV.map(item => (
            <NavItem
              key={item.id}
              item={item}
              colors={colors}
              active={isActive(item.id)}
              onPress={() => navigate(item.path)}
            />
          ))}
        </ScrollView>

        {/* Bottom Nav + Logout */}
        <View style={[s.bottomSection, { borderTopColor: colors.border }]}>
          {BOTTOM_NAV.map(item => (
            <NavItem
              key={item.id}
              item={item}
              colors={colors}
              active={isActive(item.id)}
              onPress={() => navigate(item.path)}
            />
          ))}

          {/* Logout */}
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
            <LogOut size={18} color="#ef4444" />
            <Text style={s.logoutTxt}>Sign Out</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const DRAWER_WIDTH = 272;

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 72,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  adminBadge: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Nav
  navScroll: {
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    marginBottom: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    width: 3,
    height: 20,
    borderRadius: 2,
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  navLabelActive: {
    fontWeight: '800',
  },

  // Bottom
  bottomSection: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    gap: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 4,
  },
  logoutTxt: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#ef4444',
  },
});