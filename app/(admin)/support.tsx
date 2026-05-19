import { AlertCircle, CheckCircle, ChevronRight, MessageCircle, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Modal, ScrollView,
  StyleSheet, Text, TouchableOpacity, View
} from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "../../constants/theme";
import api from "../../src/services/api";
import TopBar from "../../src/components/TopBar";

interface Ticket {
  _id: string;
  user: { name: string; email: string; student_id?: string };
  subject: string;
  description: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: string;
}

const FILTERS = ["all", "open", "in-progress", "resolved"] as const;

export default function SupportScreen() {
  const colors = useThemeColor();
  const router = useRouter();

  const STATUS_CONFIG = {
    "open":        { label: "OPEN",        color: colors.error   || "#ef4444", bg: `${colors.error   || "#ef4444"}1A`, border: `${colors.error   || "#ef4444"}4D` },
    "in-progress": { label: "IN PROGRESS", color: colors.tint    || "#f7a01b", bg: `${colors.tint    || "#f7a01b"}1A`, border: `${colors.tint    || "#f7a01b"}4D` },
    "resolved":    { label: "RESOLVED",    color: colors.success || "#22c55e", bg: `${colors.success || "#22c55e"}1A`, border: `${colors.success || "#22c55e"}4D` },
  };

  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<typeof FILTERS[number]>("all");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast]       = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get("/support");
      const data = res.data?.data?.tickets || res.data?.tickets || res.data?.data || res.data || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdating(true);
    try {
      await api.put(`/support/${id}`, { status });
      setTickets(prev => prev.map(t => t._id === id ? { ...t, status: status as any } : t));
      if (selected) setSelected({ ...selected, status: status as any });
      setToast({ msg: "Status updated successfully", type: "success" });
    } catch {
      setToast({ msg: "Failed to update status", type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60)   return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      <TopBar
        title="Support Inbox"
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(admin)/settings' as any)}
      />

      {/* Toast */}
      {toast && (
        <View style={[s.toast, {
          backgroundColor: toast.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          borderColor:     toast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
        }]}>
          {toast.type === "success"
            ? <CheckCircle size={14} color="#22c55e" />
            : <AlertCircle size={14} color="#ef4444" />
          }
          <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: toast.type === "success" ? "#22c55e" : "#ef4444" }}>
            {toast.msg}
          </Text>
        </View>
      )}

      {/* Header Row */}
      <View style={[s.headerRow, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: colors.text }}>Support Inbox</Text>
        <View style={[s.openBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.error || "#ef4444" }}>
            {tickets.filter(t => t.status === "open").length} Open
          </Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filters}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, { backgroundColor: filter === f ? `${colors.tint}1A` : colors.card, borderColor: filter === f ? colors.tint : colors.border }]}
            onPress={() => setFilter(f)}
          >
            <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: filter === f ? colors.tint : colors.icon }}>
              {f.replace("-", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <MessageCircle size={40} color={colors.icon} />
          <Text style={{ fontSize: 13, fontWeight: '600', marginTop: 12, color: colors.icon }}>No tickets found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
          {filtered.map((ticket) => {
            const sc = STATUS_CONFIG[ticket.status];
            return (
              <TouchableOpacity
                key={ticket._id}
                style={[s.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setSelected(ticket)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={[s.avatar, { backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}33` }]}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: colors.tint }}>
                      {ticket.user?.name?.charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 2, color: colors.text }} numberOfLines={1}>{ticket.user?.name || "Unknown"}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', marginBottom: 2, color: colors.icon }} numberOfLines={1}>{ticket.subject}</Text>
                    <Text style={{ fontSize: 10, color: colors.icon }} numberOfLines={1}>{ticket.description}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <View style={[s.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                    <Text style={{ fontSize: 7, fontWeight: '800', letterSpacing: 1, color: sc.color }}>{sc.label}</Text>
                  </View>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: colors.icon }}>{timeAgo(ticket.createdAt)}</Text>
                  <ChevronRight size={14} color={colors.icon} />
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Detail Bottom Sheet */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: "rgba(0,0,0,0.7)" }}>
          <View style={[s.bottomSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>

            <View style={[s.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Ticket Details</Text>
              <TouchableOpacity onPress={() => setSelected(null)} style={[s.closeBtn, { backgroundColor: colors.background }]}>
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selected && (
              <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>

                {/* User Info */}
                <View style={[s.userRow, { backgroundColor: colors.background }]}>
                  <View style={[s.userAvatar, { backgroundColor: colors.tint }]}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: colors.background }}>
                      {selected.user?.name?.charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', marginBottom: 2, color: colors.text }}>{selected.user?.name}</Text>
                    <Text style={{ fontSize: 11, marginBottom: 2, color: colors.icon }}>{selected.user?.email}</Text>
                    {selected.user?.student_id && (
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.tint }}>ID: {selected.user.student_id}</Text>
                    )}
                  </View>
                </View>

                <Text style={[s.fieldLabel, { color: colors.icon, marginTop: 16 }]}>SUBJECT</Text>
                <View style={[s.fieldBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 13, lineHeight: 20, color: colors.text }}>{selected.subject}</Text>
                </View>

                <Text style={[s.fieldLabel, { color: colors.icon, marginTop: 16 }]}>DESCRIPTION</Text>
                <View style={[s.fieldBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 13, lineHeight: 20, color: colors.text }}>{selected.description}</Text>
                </View>

                <Text style={[s.fieldLabel, { color: colors.icon, marginTop: 16 }]}>CURRENT STATUS</Text>
                <View style={[s.currentStatus, { backgroundColor: STATUS_CONFIG[selected.status].bg, borderColor: STATUS_CONFIG[selected.status].border }]}>
                  <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 2, color: STATUS_CONFIG[selected.status].color }}>
                    {STATUS_CONFIG[selected.status].label}
                  </Text>
                </View>

                <Text style={[s.fieldLabel, { color: colors.icon, marginTop: 16 }]}>UPDATE STATUS</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(["open", "in-progress", "resolved"] as const).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[s.statusBtn, { backgroundColor: colors.background, borderColor: STATUS_CONFIG[st].border, opacity: selected.status === st ? 0.4 : 1 }]}
                      onPress={() => handleUpdateStatus(selected._id, st)}
                      disabled={updating || selected.status === st}
                    >
                      {updating && selected.status !== st ? (
                        <ActivityIndicator size="small" color={STATUS_CONFIG[st].color} />
                      ) : (
                        <Text style={{ fontSize: 8, fontWeight: '800', letterSpacing: 1, color: STATUS_CONFIG[st].color }}>
                          {STATUS_CONFIG[st].label}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toast:         { position: 'absolute', top: 80, alignSelf: 'center', zIndex: 50, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1 },
  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  openBadge:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  filters:       { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  filterBtn:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  ticketCard:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 10 },
  avatar:        { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statusBadge:   { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  bottomSheet:   { borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%', borderTopWidth: 1 },
  sheetHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1 },
  closeBtn:      { padding: 8, borderRadius: 12 },
  userRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, borderRadius: 16, padding: 16 },
  userAvatar:    { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  fieldLabel:    { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  fieldBox:      { borderRadius: 16, padding: 14, borderWidth: 1 },
  currentStatus: { borderRadius: 12, padding: 12, borderWidth: 1, alignItems: 'center', marginBottom: 4 },
  statusBtn:     { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
});