import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import Api from '../../src/services/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => { fetchNotifs(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchNotifs(); };

  const handleMarkRead = async (id: string) => {
    try {
      await Api.put(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#f7a01b" />
        <Text style={s.loadingTxt}>Loading Notifications...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f7a01b" />}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerSub}>STUDENT PORTAL</Text>
        <Text style={s.headerTitle}>
          My <Text style={s.accent}>Alerts</Text>
        </Text>
        {unreadCount > 0 && (
          <View style={s.unreadBadge}>
            <Text style={s.unreadTxt}>{unreadCount} UNREAD</Text>
          </View>
        )}
      </View>

      {/* ── Empty State ── */}
      {notifs.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyIcon}>🔔</Text>
          <Text style={s.emptyTitle}>No Notifications Yet</Text>
          <Text style={s.emptyDesc}>You're all caught up! Check back later.</Text>
        </View>
      ) : (
        notifs.map((n) => (
          <TouchableOpacity
            key={n._id}
            style={[s.card, n.read && s.cardRead]}
            onPress={() => !n.read && handleMarkRead(n._id)}
            activeOpacity={0.85}
          >
            {/* Left: Icon */}
            <View style={[s.iconWrap, n.read && s.iconWrapRead]}>
              <Text style={s.iconTxt}>🔔</Text>
            </View>

            {/* Center: Content */}
            <View style={s.content}>
              {/* Title row */}
              <View style={s.titleRow}>
                <Text style={[s.title, n.read && s.titleRead]} numberOfLines={1}>
                  {n.title}
                </Text>
                <View style={s.typeBadge}>
                  <Text style={s.typeTxt}>{n.type}</Text>
                </View>
              </View>

              {/* Message */}
              <Text style={s.message} numberOfLines={2}>{n.message}</Text>

              {/* Footer */}
              <View style={s.footer}>
                <Text style={s.time}>
                  {new Date(n.createdAt).toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
                <View style={[s.statusBadge, n.read ? s.statusRead : s.statusUnread]}>
                  <Text style={[s.statusTxt, n.read ? s.statusTxtRead : s.statusTxtUnread]}>
                    {n.read ? '✓ Read' : 'Tap to mark read'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Right: Unread dot */}
            {!n.read && <View style={s.dot} />}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const C = {
  bg: '#0f1115', card: '#1c1e26', card2: '#262a33',
  border: '#2d3036', am: '#f7a01b', mu: '#8a8d91',
  mu2: '#555', ok: '#22c55e', white: '#ffffff',
};

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },
  scroll:         { padding: 20, paddingBottom: 48 },
  center:         { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:     { color: C.mu, fontSize: 11, fontWeight: '700', letterSpacing: 2 },

  header:         { marginBottom: 24 },
  headerSub:      { fontSize: 9, color: C.mu, fontWeight: '700', letterSpacing: 3, marginBottom: 4 },
  headerTitle:    { fontSize: 28, fontWeight: '800', color: C.white, letterSpacing: -0.5 },
  accent:         { color: C.am },
  unreadBadge:    { alignSelf: 'flex-start', marginTop: 8, backgroundColor: 'rgba(247,160,27,0.1)', borderWidth: 1, borderColor: 'rgba(247,160,27,0.3)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  unreadTxt:      { fontSize: 9, fontWeight: '700', color: C.am, letterSpacing: 1 },

  emptyWrap:      { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:      { fontSize: 48, marginBottom: 16 },
  emptyTitle:     { fontSize: 14, fontWeight: '800', color: C.white, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  emptyDesc:      { fontSize: 12, color: C.mu, fontWeight: '500', textAlign: 'center' },

  card:           { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 16, marginBottom: 10 },
  cardRead:       { opacity: 0.65 },

  iconWrap:       { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(247,160,27,0.1)', borderWidth: 1, borderColor: 'rgba(247,160,27,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconWrapRead:   { backgroundColor: C.card2, borderColor: C.border },
  iconTxt:        { fontSize: 18 },

  content:        { flex: 1, gap: 4 },
  titleRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title:          { fontSize: 13, fontWeight: '700', color: C.white, flex: 1 },
  titleRead:      { color: C.mu },
  typeBadge:      { backgroundColor: C.card2, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  typeTxt:        { fontSize: 9, fontWeight: '700', color: C.mu, textTransform: 'uppercase', letterSpacing: 0.5 },

  message:        { fontSize: 12, color: C.mu, lineHeight: 18, fontWeight: '400' },

  footer:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  time:           { fontSize: 10, color: C.mu2, fontWeight: '600' },
  statusBadge:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusUnread:   { backgroundColor: 'rgba(34,197,94,0.08)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  statusRead:     { backgroundColor: C.card2 },
  statusTxt:      { fontSize: 9, fontWeight: '700' },
  statusTxtUnread:{ color: C.ok },
  statusTxtRead:  { color: C.mu2 },

  dot:            { width: 8, height: 8, borderRadius: 4, backgroundColor: C.am, marginTop: 4, flexShrink: 0 },
});