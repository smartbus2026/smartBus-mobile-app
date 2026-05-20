import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Check } from 'lucide-react-native';
import Api from '../../src/services/api';
import { useThemeColor } from '../../constants/theme';
import TopBar from '../../src/components/TopBar';
import socket from '../../src/services/socket';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const router  = useRouter();
  const colors  = useThemeColor();

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

  // Real-time socket
  useEffect(() => {
    const handleNewNotif = (notif: any) => {
      setNotifs(prev => [{
        _id:       notif._id || Date.now().toString(),
        title:     notif.title   || 'New Alert',
        message:   notif.message || '',
        type:      notif.type    || 'general',
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
    // Optimistic update
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    try {
      await Api.put(`/notifications/${id}/read`);
    } catch {
      // Revert on failure
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
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[s.loadingTxt, { color: colors.icon }]}>Loading Notifications...</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      <TopBar
        title="Notifications"
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(student)/settings' as any)}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >

        {/* Header Row */}
        <View style={s.headerRow}>
          <Text style={[s.headerTitle, { color: colors.text }]}>Your Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={[s.readAllBtn, { backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}33` }]}
              onPress={handleReadAll}
              activeOpacity={0.8}
            >
              <Text style={[s.readAllTxt, { color: colors.tint }]}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <View style={[s.unreadBadge, { backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}4D` }]}>
            <Text style={[s.unreadTxt, { color: colors.tint }]}>{unreadCount} UNREAD</Text>
          </View>
        )}

        {/* Empty State */}
        {notifs.length === 0 ? (
          <View style={s.emptyWrap}>
            <Bell size={48} color={colors.icon} style={{ opacity: 0.3, marginBottom: 16 }} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>No Notifications Yet</Text>
            <Text style={[s.emptyDesc, { color: colors.icon }]}>You're all caught up! Check back later.</Text>
          </View>
        ) : (
          notifs.map(n => (
            <TouchableOpacity
              key={n._id}
              style={[
                s.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                n.read && s.cardRead,
              ]}
              onPress={() => !n.read && handleMarkRead(n._id)}
              activeOpacity={0.85}
            >
              {/* Icon */}
              <View style={[
                s.iconWrap,
                n.read
                  ? { backgroundColor: colors.background, borderColor: colors.border }
                  : { backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}33` },
              ]}>
                <Bell size={20} color={n.read ? colors.icon : colors.tint} />
              </View>

              {/* Content */}
              <View style={s.content}>
                <View style={s.titleRow}>
                  <Text style={[s.title, { color: n.read ? colors.icon : colors.text }]} numberOfLines={1}>
                    {n.title}
                  </Text>
                  <View style={[s.typeBadge, { backgroundColor: colors.background }]}>
                    <Text style={[s.typeTxt, { color: colors.icon }]}>{n.type}</Text>
                  </View>
                </View>

                <Text style={[s.message, { color: colors.icon }]} numberOfLines={2}>
                  {n.message}
                </Text>

                <View style={s.footer}>
                  <Text style={[s.time, { color: colors.icon }]}>
                    {new Date(n.createdAt).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                  <View style={[
                    s.statusBadge,
                    n.read
                      ? { backgroundColor: colors.background }
                      : { backgroundColor: 'rgba(34,197,94,0.08)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
                  ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {n.read && <Check size={9} color={colors.icon} />}
                      <Text style={[s.statusTxt, { color: n.read ? colors.icon : '#22c55e' }]}>
                        {n.read ? 'Read' : 'Tap to mark read'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Unread dot */}
              {!n.read && <View style={[s.dot, { backgroundColor: colors.tint }]} />}
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  scroll:      { padding: 20, paddingTop: 16 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:  { fontSize: 11, fontWeight: '700', letterSpacing: 2 },

  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  readAllBtn:  { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7 },
  readAllTxt:  { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  unreadBadge: { alignSelf: 'flex-start', marginBottom: 16, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  unreadTxt:   { fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  emptyWrap:   { alignItems: 'center', paddingVertical: 60 },
  emptyTitle:  { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  emptyDesc:   { fontSize: 12, fontWeight: '500', textAlign: 'center' },

  card:        { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 10 },
  cardRead:    { opacity: 0.65 },

  iconWrap:    { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  content:     { flex: 1, gap: 4 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title:       { fontSize: 13, fontWeight: '700', flex: 1 },
  typeBadge:   { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  typeTxt:     { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  message:     { fontSize: 12, lineHeight: 18, fontWeight: '400' },

  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  time:        { fontSize: 10, fontWeight: '600' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusTxt:   { fontSize: 9, fontWeight: '700' },

  dot:         { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
});