// app/(admin)/notifications.tsx
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  RefreshControl, ScrollView, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import {
  Bell, Bus, Calendar, CheckCircle, Map as MapIcon,
  RefreshCw, Send,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';

interface Notification {
  _id: string; title: string; message: string;
  type: string; read: boolean; createdAt: string;
}
interface NotifHistory {
  id: string; title: string; message: string; target: string; time: string;
}

const templates = [
  { icon: Calendar, label: 'Registration Reminder', msg: "Don't forget to register for tomorrow's bus. Window closes at 2:00 PM." },
  { icon: Bus,      label: 'Trip Delay',            msg: 'Your bus is delayed. Please wait at the pickup point.' },
  { icon: MapIcon,  label: 'Route Change',          msg: 'Route has been changed due to road conditions. Please check the new route.' },
  { icon: Bell,     label: 'General Announcement',  msg: 'Important announcement from SmartBus administration.' },
];

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

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();

  const [activeTab, setActiveTab]       = useState<'inbox' | 'compose'>('inbox');
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [title, setTitle]               = useState('');
  const [message, setMessage]           = useState('');
  const [target, setTarget]             = useState('All Users');
  const [isSending, setIsSending]       = useState(false);
  const [history, setHistory]           = useState<NotifHistory[]>([]);

  useEffect(() => {
    if (toast.msg) {
      const t = setTimeout(() => setToast({ msg: '', type: null }), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data?.data?.notifications || res.data?.notifications || []);
    } catch (err) { console.log('Failed to fetch notifications', err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const handleMarkRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    try { await api.put(`/notifications/${id}/read`); }
    catch { setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: false } : n)); }
  };

  const handleReadAll = async () => {
    const hasUnread = notifications.some(n => !n.read);
    if (!hasUnread) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await api.put('/notifications/read-all'); }
    catch { console.log('Failed to mark all as read'); }
  };

  const handleSend = async () => {
    if (!title || !message) { setToast({ msg: 'Please enter title and message', type: 'error' }); return; }
    setIsSending(true);
    try {
      await api.post('/notifications/broadcast', { title, message, target });
      setHistory([{
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        title, message, target,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }, ...history]);
      setTitle(''); setMessage(''); setTarget('All Users');
      setToast({ msg: 'Delivered successfully', type: 'success' });
      fetchNotifications();
    } catch { setToast({ msg: 'Failed to send notification', type: 'error' }); }
    finally { setIsSending(false); }
  };

  const clearForm = () => { setTitle(''); setMessage(''); setTarget('All Users'); };
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Notification Center" showMenu showSettings onSettingsPress={() => router.push('/(admin)/settings' as any)} />

      {/* Toast */}
      {toast.msg && (
        <View style={{
          position: 'absolute', top: 80, alignSelf: 'center', zIndex: 50,
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1,
          backgroundColor: toast.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          borderColor: toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
        }}>
          <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: toast.type === 'success' ? '#22c55e' : '#ef4444' }}>
            {toast.msg}
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, color: colors.text }}>
          BROADCAST &{' '}<Text style={{ color: colors.tint }}>INBOX</Text>
        </Text>
        <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginTop: 2 }}>
          MANAGE ALERTS
        </Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}>
        {([['inbox', `INBOX${unreadCount > 0 ? ` (${unreadCount})` : ''}`], ['compose', 'COMPOSE']] as const).map(([tab, label]) => (
          <TouchableOpacity
            key={tab} onPress={() => setActiveTab(tab as any)}
            style={{
              flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1,
              borderColor: activeTab === tab ? colors.tint : colors.border,
              backgroundColor: activeTab === tab ? `${colors.tint}1A` : colors.card,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: activeTab === tab ? colors.tint : colors.icon }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── INBOX ── */}
      {activeTab === 'inbox' ? (
        isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>LOADING...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon }}>
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleReadAll}
                  style={{ borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}33` }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.tint }}>MARK ALL READ</Text>
                </TouchableOpacity>
              )}
            </View>

            {notifications.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <View style={{
                  width: 72, height: 72, borderRadius: 24, marginBottom: 16,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
                }}>
                  <Bell size={32} color={colors.tint} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>
                  YOUR INBOX IS EMPTY
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.icon, marginTop: 6 }}>Pull down to refresh</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {notifications.map(n => (
                  <TouchableOpacity
                    key={n._id} onPress={() => !n.read && handleMarkRead(n._id)}
                    activeOpacity={n.read ? 1 : 0.7}
                    style={{
                      flexDirection: 'row', gap: 14, padding: 16,
                      borderRadius: 24, borderWidth: 1,
                      backgroundColor: colors.card,
                      borderColor: n.read ? colors.border : `${colors.tint}33`,
                      opacity: n.read ? 0.6 : 1,
                    }}
                  >
                    <View style={{
                      width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: n.read ? colors.background : `${colors.tint}1A`,
                      borderWidth: 1, borderColor: n.read ? colors.border : `${colors.tint}33`,
                    }}>
                      <Bell size={20} color={n.read ? colors.icon : colors.tint} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 2 }}>{n.title}</Text>
                          <Text style={{ fontSize: 9, fontWeight: '600', color: colors.icon }}>{new Date(n.createdAt).toLocaleString()}</Text>
                        </View>
                        <View style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>{n.type}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text, lineHeight: 18 }}>{n.message}</Text>
                      {!n.read && (
                        <Text style={{ fontSize: 10, fontWeight: '800', color: colors.tint, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                          Tap to mark as read
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        )

      /* ── COMPOSE ── */
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

            {/* Compose Form */}
            <SectionCard icon={<Send size={22} color={colors.tint} />} title="Compose New" subtitle="Send a Broadcast" colors={colors}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
                <TouchableOpacity onPress={clearForm}
                  style={{ padding: 10, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                  <RefreshCw size={14} color={colors.icon} />
                </TouchableOpacity>
              </View>

              {/* Title */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 8 }}>SUBJECT</Text>
                <View style={{ borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 52, backgroundColor: colors.background, borderColor: colors.border, justifyContent: 'center' }}>
                  <TextInput style={{ fontSize: 14, fontWeight: '700', color: colors.text }} placeholder="Enter title..." placeholderTextColor={colors.icon} value={title} onChangeText={setTitle} />
                </View>
              </View>

              {/* Message */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 8 }}>MESSAGE BODY</Text>
                <View style={{ borderRadius: 14, borderWidth: 1, padding: 16, minHeight: 100, backgroundColor: colors.background, borderColor: colors.border }}>
                  <TextInput style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlignVertical: 'top' }} placeholder="Type your announcement..." placeholderTextColor={colors.icon} value={message} onChangeText={setMessage} multiline numberOfLines={4} />
                </View>
              </View>

              {/* Recipients */}
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 10 }}>RECIPIENT GROUP</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {['All Users', 'Students Only'].map(a => (
                  <TouchableOpacity key={a} onPress={() => setTarget(a)}
                    style={{
                      flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center',
                      backgroundColor: target === a ? `${colors.tint}1A` : colors.background,
                      borderColor: target === a ? colors.tint : colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: target === a ? colors.tint : colors.icon }}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleSend} disabled={!title || !message || isSending} activeOpacity={0.85}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  paddingVertical: 14, borderRadius: 14,
                  backgroundColor: colors.tint, opacity: (!title || !message || isSending) ? 0.5 : 1,
                }}
              >
                {isSending
                  ? <ActivityIndicator color="#000" />
                  : <><Send size={16} color="#000" /><Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: '#000' }}>SEND NOTIFICATION</Text></>
                }
              </TouchableOpacity>
            </SectionCard>

            {/* Presets */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 12 }}>PRESETS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {templates.map((t, idx) => {
                  const Icon = t.icon;
                  return (
                    <TouchableOpacity key={idx} onPress={() => { setTitle(t.label); setMessage(t.msg); }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 10,
                        paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, marginRight: 10,
                        borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border,
                      }}
                    >
                      <Icon size={14} color={colors.tint} />
                      <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: colors.text }}>{t.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* History */}
            <SectionCard icon={<Bell size={22} color={colors.icon} />} title="Broadcast History" subtitle="This Session" colors={colors}>
              {history.length > 0 && (
                <TouchableOpacity onPress={() => setHistory([])} style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>CLEAR LOG</Text>
                </TouchableOpacity>
              )}

              {history.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>
                    No active broadcasts in session
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {history.map((notif, idx) => (
                    <View key={notif.id + idx} style={{
                      borderWidth: 1, borderRadius: 20, padding: 16,
                      backgroundColor: colors.background, borderColor: colors.border, overflow: 'hidden',
                    }}>
                      <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: colors.card, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 8, fontWeight: '900', color: colors.icon }}>{notif.id}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 14 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33` }}>
                          <Bell size={20} color={colors.tint} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, paddingRight: 20 }}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 }}>{notif.title}</Text>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ fontSize: 8, fontWeight: '800', color: colors.icon, marginBottom: 4 }}>{notif.time}</Text>
                              <View style={{ backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.tint }}>{notif.target}</Text>
                              </View>
                            </View>
                          </View>
                          <Text style={{ fontSize: 11, fontWeight: '500', color: colors.icon, lineHeight: 18, marginBottom: 12 }}>{notif.message}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' }}>
                              <CheckCircle size={8} color="#fff" />
                            </View>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1 }}>Delivered successfully</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>

          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}