// app/(student)/notifications.tsx
import { useRouter } from 'expo-router';
import { Bell, Check } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  Text, TouchableOpacity, View,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import Api from '../../src/services/api';
import socket from '../../src/services/socket';
import TopBar from '../../src/components/TopBar';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  icon: React.ReactNode; title: string; subtitle: string;
  children: React.ReactNode; colors: any;
}> = ({ icon, title, subtitle, children, colors }) => (
  <View style={{
    borderRadius: 24, borderWidth: 1, padding: 24, marginBottom: 16,
    backgroundColor: colors.card, borderColor: colors.border,
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
      <View style={{
        width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
      }}>
        {icon}
      </View>
      <View>
        <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>
          {title}
        </Text>
        <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
    </View>
    {children}
  </View>
);

// ─── Notification Card ────────────────────────────────────────────────────────
const NotifCard: React.FC<{
  n: Notification; colors: any; onPress: () => void;
}> = ({ n, colors, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={{
      flexDirection: 'row', alignItems: 'flex-start', gap: 14,
      borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 10,
      backgroundColor: colors.card, borderColor: colors.border,
      opacity: n.read ? 0.65 : 1,
    }}
  >
    {/* Icon */}
    <View style={{
      width: 44, height: 44, borderRadius: 14, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      backgroundColor: n.read ? colors.background : `${colors.tint}1A`,
      borderColor:     n.read ? colors.border      : `${colors.tint}33`,
    }}>
      <Bell size={20} color={n.read ? colors.icon : colors.tint} />
    </View>

    {/* Content */}
    <View style={{ flex: 1, gap: 4 }}>
      {/* Title row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', flex: 1, color: n.read ? colors.icon : colors.text }} numberOfLines={1}>
          {n.title}
        </Text>
        <View style={{ borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: colors.background }}>
          <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.icon }}>
            {n.type}
          </Text>
        </View>
      </View>

      {/* Message */}
      <Text style={{ fontSize: 12, lineHeight: 18, fontWeight: '400', color: colors.icon }} numberOfLines={2}>
        {n.message}
      </Text>

      {/* Footer */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: '600', color: colors.icon }}>
          {new Date(n.createdAt).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </Text>
        <View style={{
          borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
          ...(n.read
            ? { backgroundColor: colors.background }
            : { backgroundColor: 'rgba(34,197,94,0.08)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' }),
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {n.read && <Check size={9} color={colors.icon} />}
            <Text style={{ fontSize: 9, fontWeight: '700', color: n.read ? colors.icon : '#22c55e' }}>
              {n.read ? 'Read' : 'Tap to mark read'}
            </Text>
          </View>
        </View>
      </View>
    </View>

    {/* Unread dot */}
    {!n.read && (
      <View style={{
        width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0,
        backgroundColor: colors.tint,
      }} />
    )}
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];

  const [notifs, setNotifs]         = useState<Notification[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await Api.get('/notifications');
      setNotifs(res.data?.data?.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  useEffect(() => {
    const handleNewNotif = (notif: any) => {
      setNotifs(prev => [{
        _id:       notif._id       || Date.now().toString(),
        title:     notif.title     || 'New Alert',
        message:   notif.message   || '',
        type:      notif.type      || 'general',
        read:      false,
        createdAt: notif.createdAt || new Date().toISOString(),
      }, ...prev]);
    };
    socket.on('newNotification',  handleNewNotif);
    socket.on('new_notification', handleNewNotif);
    return () => {
      socket.off('newNotification',  handleNewNotif);
      socket.off('new_notification', handleNewNotif);
    };
  }, []);

  const onRefresh = () => { setRefreshing(true); fetchNotifs(); };

  const handleMarkRead = async (id: string) => {
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    try {
      await Api.put(`/notifications/${id}/read`);
    } catch {
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: false } : n));
    }
  };

  const handleReadAll = async () => {
    const hasUnread = notifs.some(n => !n.read);
    if (!hasUnread) return;
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await Api.put('/notifications/read-all');
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar title="Notifications" showMenu showSettings onSettingsPress={() => router.push('/(student)/settings' as any)} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>
            LOADING...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar
        title="Notifications"
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(student)/settings' as any)}
      />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, color: colors.text }}>
                YOUR{' '}
                <Text style={{ color: colors.tint }}>ALERTS</Text>
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginTop: 2 }}>
                NOTIFICATIONS & UPDATES
              </Text>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={handleReadAll}
                activeOpacity={0.8}
                style={{
                  borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7,
                  backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}33`,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.tint }}>
                  Mark All Read
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <View style={{
              alignSelf: 'flex-start', marginTop: 12, borderWidth: 1, borderRadius: 20,
              paddingHorizontal: 10, paddingVertical: 4,
              backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}4D`,
            }}>
              <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1, color: colors.tint }}>
                {unreadCount} UNREAD
              </Text>
            </View>
          )}
        </View>

        {/* Empty State */}
        {notifs.length === 0 ? (
          <SectionCard
            icon={<Bell size={22} color={colors.icon} />}
            title="No Notifications"
            subtitle="You're all caught up"
            colors={colors}
          >
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Bell size={48} color={colors.icon} style={{ opacity: 0.3, marginBottom: 16 }} />
              <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, textAlign: 'center' }}>
                Check back later for updates
              </Text>
            </View>
          </SectionCard>
        ) : (
          <SectionCard
            icon={<Bell size={22} color={colors.tint} />}
            title="Notifications"
            subtitle={`${notifs.length} total · ${unreadCount} unread`}
            colors={colors}
          >
            {notifs.map(n => (
              <NotifCard
                key={n._id}
                n={n}
                colors={colors}
                onPress={() => !n.read && handleMarkRead(n._id)}
              />
            ))}
          </SectionCard>
        )}

      </ScrollView>
    </View>
  );
}