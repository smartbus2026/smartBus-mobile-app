import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform
} from "react-native";
import { Bell, Send, Calendar, Bus, Map, Clock, Users, Trash2, CheckCircle, AlertCircle } from "lucide-react-native";
import api from "../../src/services/api";
import Appbar from "../../src/components/bar";

interface NotifHistory {
  id: string;
  title: string;
  message: string;
  target: string;
  time: string;
}

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("All Users");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<NotifHistory[]>([]);
  
  // شيلنا الـ Alert وضفنا الـ Toast State
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });

  const templates = [
    { icon: Calendar, label: "Registration", msg: "Don't forget to register for tomorrow's bus. Window closes at 2:00 PM." },
    { icon: Bus,      label: "Trip Delay",   msg: "Your bus is delayed. Please wait at the pickup point." },
    { icon: Map,      label: "Route Change", msg: "Route has been changed due to road conditions. Please check the new route." },
    { icon: Bell,     label: "Alert",        msg: "Important announcement from SmartBus administration." },
  ];

  useEffect(() => {
    if (toast.msg) {
      const t = setTimeout(() => setToast({ msg: '', type: null }), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleSend = async () => {
    if (!title || !message) {
      setToast({ msg: "Please fill all fields", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await api.post("/notifications/broadcast", { title, message, target });
      const newNotif: NotifHistory = {
        id: `MSG-${Date.now()}`,
        title, message, target,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => [newNotif, ...prev]);
      setTitle("");
      setMessage("");
      setToast({ msg: "Broadcast dispatched successfully", type: "success" });
    } catch (e) {
      setToast({ msg: "System broadcast failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* --- الـ Custom Toast الجديد --- */}
      {toast.msg && (
        <View style={[styles.customToast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          {toast.type === 'success' ? <CheckCircle size={16} color="#22c55e" /> : <AlertCircle size={16} color="#ef4444" />}
          <Text style={[styles.toastText, toast.type === 'success' ? {color: "#22c55e"} : {color: "#ef4444"}]}>
            {toast.msg}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Broadcast Center</Text>
              <Text style={styles.headerSubtitle}>Notify active fleet & students</Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>ON-AIR</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Quick Presets</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
            {templates.map((t) => {
              const Icon = t.icon;
              return (
                <TouchableOpacity key={t.label} style={styles.templateChip} onPress={() => { setTitle(t.label); setMessage(t.msg); }}>
                  <Icon size={14} color="#f7a01b" />
                  <Text style={styles.templateLabel}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Subject</Text>
              <TextInput style={styles.input} placeholder="e.g. Delay Alert" placeholderTextColor="#4b4e5a" value={title} onChangeText={setTitle} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Message Details</Text>
              <TextInput style={[styles.input, styles.textarea]} placeholder="Write your announcement..." placeholderTextColor="#4b4e5a" value={message} onChangeText={setMessage} multiline numberOfLines={4} />
            </View>

            <View style={styles.targetContainer}>
              {["All Users", "Students Only"].map((opt) => (
                <TouchableOpacity key={opt} style={[styles.targetOption, target === opt && styles.targetActive]} onPress={() => setTarget(opt)}>
                  <Users size={14} color={target === opt ? "#0f1115" : "#8a8d91"} />
                  <Text style={[styles.targetText, target === opt && styles.targetTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.sendBtn, loading && { opacity: 0.7 }]} onPress={handleSend} disabled={loading}>
              {loading ? <ActivityIndicator color="#0f1115" /> : (
                <>
                  <Text style={styles.sendBtnText}>DISPATCH BROADCAST</Text>
                  <Send size={16} color="#0f1115" strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.historyHeader}>
            <Text style={styles.sectionLabel}>Recent Activity</Text>
            <TouchableOpacity onPress={() => setHistory([])}><Trash2 size={16} color="#4b4e5a" /></TouchableOpacity>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={32} color="#1c1e26" />
              <Text style={styles.emptyText}>No recent logs</Text>
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              {history.map((notif, idx) => (
                <View key={notif.id} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineDot} />
                    {idx !== history.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.historyBody}>
                    <View style={styles.historyMeta}>
                      <Text style={styles.historyTitle}>{notif.title}</Text>
                      <Text style={styles.historyTime}>{notif.time}</Text>
                    </View>
                    <Text style={styles.historyMsg}>{notif.message}</Text>
                    <View style={styles.badgeRow}>
                        <View style={styles.miniTag}><Text style={styles.miniTagText}>{notif.target}</Text></View>
                        <Text style={styles.statusText}>SENT</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <Appbar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1115" },
  content: { padding: 24 },

  // Toast Styles
  customToast: {
    position: "absolute", top: 60, alignSelf: "center", zIndex: 1000,
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25,
    borderWidth: 1, backgroundColor: "#1c1e26",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  toastSuccess: { borderColor: "rgba(34,197,94,0.3)" },
  toastError: { borderColor: "rgba(239,68,68,0.3)" },
  toastText: { fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32, marginTop: 20 },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 11, fontWeight: "700", color: "#4b4e5a", textTransform: "uppercase", marginTop: 4 },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(34,197,94,0.1)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e" },
  liveText: { fontSize: 8, fontWeight: "900", color: "#22c55e", letterSpacing: 1.5 },

  sectionLabel: { fontSize: 9, fontWeight: "900", color: "#4b4e5a", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 },
  templatesScroll: { marginBottom: 24 },
  templateChip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1c1e26", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: "#2d3036" },
  templateLabel: { fontSize: 11, fontWeight: "800", color: "#fff" },

  card: { backgroundColor: "#1c1e26", borderRadius: 28, padding: 24, borderWidth: 1, borderColor: "#2d3036" },
  inputGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 9, fontWeight: "900", color: "#8a8d91", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 },
  input: { backgroundColor: "#0f1115", borderRadius: 16, padding: 16, color: "#fff", fontSize: 14, fontWeight: "600", borderWidth: 1, borderColor: "#2d3036" },
  textarea: { minHeight: 120, textAlignVertical: "top" },

  targetContainer: { flexDirection: "row", gap: 10, marginBottom: 24 },
  targetOption: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#0f1115", paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: "#2d3036" },
  targetActive: { backgroundColor: "#f7a01b", borderColor: "#f7a01b" },
  targetText: { fontSize: 11, fontWeight: "800", color: "#8a8d91" },
  targetTextActive: { color: "#0f1115" },

  sendBtn: { backgroundColor: "#f7a01b", paddingVertical: 18, borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  sendBtnText: { fontSize: 13, fontWeight: "900", color: "#0f1115", letterSpacing: 1 },

  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40, marginBottom: 20 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: "#1c1e26", fontSize: 12, fontWeight: "800", textTransform: "uppercase", marginTop: 12 },

  timelineContainer: { paddingLeft: 10 },
  timelineItem: { flexDirection: "row", gap: 20, marginBottom: 0 },
  timelineLeft: { alignItems: "center", width: 20 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#f7a01b", zIndex: 2, marginTop: 6 },
  timelineLine: { width: 2, flex: 1, backgroundColor: "#1c1e26", marginVertical: 4 },
  
  historyBody: { flex: 1, marginBottom: 30 },
  historyMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  historyTitle: { fontSize: 15, fontWeight: "900", color: "#fff" },
  historyTime: { fontSize: 10, fontWeight: "700", color: "#4b4e5a" },
  historyMsg: { fontSize: 13, color: "#8a8d91", lineHeight: 20, marginBottom: 12 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  miniTag: { backgroundColor: "#1c1e26", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  miniTagText: { fontSize: 8, fontWeight: "900", color: "#f7a01b", textTransform: "uppercase" },
  statusText: { fontSize: 9, fontWeight: "900", color: "#22c55e", letterSpacing: 1 }
});