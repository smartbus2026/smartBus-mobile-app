import BottomBar from "@/src/components/sidebar";
import {
    AlertTriangle,
    Bell,
    Calendar,
    CheckCircle,
    Clock,
    Globe,
    Map as MapIcon,
    Send,
    Trash2,
    Users,
    Zap
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator, KeyboardAvoidingView, Platform,
    ScrollView,
    Text, TextInput, TouchableOpacity,
    View
} from "react-native";
import { useThemeColor } from "../../constants/theme";
import api from "../../src/services/api";
import TopBar from "../../src/components/TopBar";
import { useRouter } from "expo-router";

interface NotifHistory {
  id: string;
  title: string;
  message: string;
  target: string;
  time: string;
}

export default function AdminNotifications() {
  const colors = useThemeColor();

  const [title, setTitle]     = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget]   = useState("Everyone");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<NotifHistory[]>([]);
  const [toast, setToast]     = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });
const router = useRouter();
  const templates = [
    { icon: Calendar,      label: "Booking Reminder", msg: "Don't forget to book your seat for tomorrow's trip before 2:00 PM." },
    { icon: Clock,         label: "Bus Delay",        msg: "Sorry, the bus is delayed by about 15 minutes. Please wait at your stop." },
    { icon: MapIcon,       label: "Route Changed",    msg: "The bus route has changed due to traffic. Please check the live map." },
    { icon: AlertTriangle, label: "System Update",    msg: "The app will be under maintenance tonight at midnight." },
  ];

  useEffect(() => {
    if (toast.msg) {
      const t = setTimeout(() => setToast({ msg: '', type: null }), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleSend = async () => {
    if (!title || !message) {
      setToast({ msg: "Please enter a title and message", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await api.post("/notifications/broadcast", { title, message, target });
      setHistory(prev => [{
        id: `MSG-${Date.now()}`,
        title, message, target,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }, ...prev]);
      setTitle("");
      setMessage("");
      setToast({ msg: "Notification sent successfully", type: "success" });
    } catch (e) {
      setToast({ msg: "Failed to send notification", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Top Bar ── */}
   
      
<TopBar
   title="Notifications"
  showMenu
  showSettings
  onSettingsPress={() => router.push('/(admin)/settings' as any)}
/>
      {/* ── Toast ── */}
      {toast.msg && (
        <View style={{
          position: 'absolute', top: 80, alignSelf: 'center', zIndex: 50,
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingVertical: 12, paddingHorizontal: 24,
          borderRadius: 999, borderWidth: 1,
          backgroundColor: colors.card,
          borderColor: toast.type === 'success' ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
          shadowColor: toast.type === 'success' ? "#22c55e" : "#ef4444",
          shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15,
        }}>
          {toast.type === 'success'
            ? <CheckCircle size={16} color="#22c55e" />
            : <AlertTriangle size={16} color="#ef4444" />
          }
          <Text style={{
            fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2,
            color: toast.type === 'success' ? "#22c55e" : "#ef4444",
          }}>
            {toast.msg}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Welcome ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: colors.text }}>
                Send Notification
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginTop: 6, color: colors.icon }}>
                Notify students and drivers
              </Text>
            </View>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
              backgroundColor: `${colors.success || "#22c55e"}1A`,
              borderColor: `${colors.success || "#22c55e"}33`,
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success || "#22c55e" }} />
              <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 2, color: colors.success || "#22c55e" }}>ONLINE</Text>
            </View>
          </View>

          {/* ── Quick Messages ── */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, marginLeft: 4 }}>
              <Zap size={14} color={colors.tint} fill={colors.tint} />
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon }}>
                Quick Messages
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 4 }}>
              {templates.map((t) => {
                const Icon = t.icon;
                return (
                  <TouchableOpacity
                    key={t.label}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingHorizontal: 20, paddingVertical: 14,
                      borderRadius: 20, marginRight: 12, borderWidth: 1,
                      backgroundColor: colors.card, borderColor: colors.border,
                      shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, elevation: 4,
                    }}
                    onPress={() => { setTitle(t.label); setMessage(t.msg); }}
                    activeOpacity={0.7}
                  >
                    <View style={{ padding: 6, borderRadius: 999, backgroundColor: `${colors.tint}1A` }}>
                      <Icon size={14} color={colors.tint} />
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Form Card ── */}
          <View style={{
            borderWidth: 1, borderRadius: 24, padding: 18,
            backgroundColor: colors.card, borderColor: colors.border,
          }}>

            {/* Title */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginLeft: 4, color: colors.icon }}>
                Notification Title
              </Text>
              <TextInput
                style={{
                  borderRadius: 12, padding: 14, fontSize: 13, fontWeight: '700', borderWidth: 1,
                  backgroundColor: colors.background, color: colors.text, borderColor: colors.border,
                }}
                placeholder="e.g. Bus Delay"
                placeholderTextColor={colors.icon}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Message */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginLeft: 4, color: colors.icon }}>
                Message Content
              </Text>
              <TextInput
                style={{
                  borderRadius: 12, padding: 14, fontSize: 13, fontWeight: '700', borderWidth: 1,
                  minHeight: 120, textAlignVertical: 'top',
                  backgroundColor: colors.background, color: colors.text, borderColor: colors.border,
                }}
                placeholder="Type your message here..."
                placeholderTextColor={colors.icon}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Target */}
            <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, marginLeft: 4, color: colors.icon }}>
              Send To
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              {[
                { id: "Everyone",     icon: Globe },
                { id: "Students Only", icon: Users },
              ].map((opt) => {
                const OptIcon = opt.icon;
                const isActive = target === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={{
                      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      gap: 6, paddingVertical: 16, borderRadius: 12, borderWidth: 1,
                      backgroundColor: isActive ? `${colors.tint}1A` : colors.background,
                      borderColor: isActive ? colors.tint : colors.border,
                    }}
                    onPress={() => setTarget(opt.id)}
                    activeOpacity={0.7}
                  >
                    <OptIcon size={12} color={isActive ? colors.tint : colors.icon} />
                    <Text style={{
                      fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1,
                      color: isActive ? colors.tint : colors.icon,
                    }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {opt.id}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={{
                paddingVertical: 18, borderRadius: 20,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                backgroundColor: colors.tint, opacity: loading ? 0.7 : 1,
              }}
              onPress={handleSend}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', letterSpacing: 2, color: '#000' }}>
                    SEND NOTIFICATION
                  </Text>
                  <Send size={16} color="#000" strokeWidth={2.5} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── History ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 20, marginLeft: 4 }}>
            <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>
              Recent Notifications
            </Text>
            <TouchableOpacity onPress={() => setHistory([])} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.7, padding: 4 }}>
              <Trash2 size={12} color={colors.icon} />
              <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', color: colors.icon }}>Clear</Text>
            </TouchableOpacity>
          </View>

          {history.length === 0 ? (
            <View style={{
              alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24,
              borderWidth: 1, borderStyle: 'dashed', borderRadius: 32, borderColor: colors.border,
            }}>
              <Bell size={32} color={colors.icon} style={{ opacity: 0.3 }} />
              <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginTop: 16, opacity: 0.5, color: colors.icon }}>
                No recent notifications
              </Text>
            </View>
          ) : (
            <View style={{ paddingLeft: 12 }}>
              {history.map((notif, idx) => (
                <View key={notif.id} style={{ flexDirection: 'row', gap: 20, marginBottom: 0 }}>
                  <View style={{ alignItems: 'center', width: 20 }}>
                    <View style={{
                      width: 12, height: 12, borderRadius: 6, marginTop: 6, zIndex: 10, borderWidth: 2,
                      backgroundColor: colors.background, borderColor: colors.tint,
                    }} />
                    {idx !== history.length - 1 && (
                      <View style={{ width: 2, flex: 1, marginVertical: 4, backgroundColor: colors.border }} />
                    )}
                  </View>
                  <View style={{ flex: 1, marginBottom: 32 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', flex: 1, marginRight: 16, color: colors.text }}>{notif.title}</Text>
                      <Text style={{ fontSize: 9, fontWeight: '700', marginTop: 4, color: colors.icon }}>{notif.time}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '500', lineHeight: 20, marginBottom: 14, opacity: 0.8, color: colors.text }}>
                      {notif.message}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}>
                        <Text style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.tint }}>{notif.target}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={10} color="#22c55e" />
                        <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 1, color: "#22c55e" }}>DELIVERED</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      <BottomBar role="admin" />
    </View>
  );
}