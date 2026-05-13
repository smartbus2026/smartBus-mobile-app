import { useState, useEffect } from "react";
import BottomBar from "@/src/components/bar";
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Modal, Platform
} from "react-native";
import { MessageCircle, Clock, CheckCircle, AlertCircle, X, ChevronRight } from "lucide-react-native";
import api from "../../src/services/api";
import Appbar from "../../src/components/bar";
import { useThemeColor } from "../../constants/theme"; // 🟢 استدعاء الهوك

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
  const colors = useThemeColor(); // 🟢 سحب الألوان
  
  // 🟢 ديناميكية الألوان للحالات بناءً على الثيم
  const STATUS_CONFIG = {
    "open":        { label: "OPEN",        color: colors.error || "#ef4444", bg: `${colors.error || "#ef4444"}1A`,    border: `${colors.error || "#ef4444"}4D`    },
    "in-progress": { label: "IN PROGRESS", color: colors.tint || "#f7a01b", bg: `${colors.tint || "#f7a01b"}1A`,   border: `${colors.tint || "#f7a01b"}4D`   },
    "resolved":    { label: "RESOLVED",    color: colors.success || "#22c55e", bg: `${colors.success || "#22c55e"}1A`,    border: `${colors.success || "#22c55e"}4D`    },
  };

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("all");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

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
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>

      {/* Toast */}
      {toast && (
        <View 
          className="absolute top-15 self-center z-50 flex-row items-center gap-2 py-2.5 px-5 rounded-[20px] border"
          style={{
            backgroundColor: toast.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            borderColor: toast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"
          }}
        >
          {toast.type === "success"
            ? <CheckCircle size={14} color={colors.success || "#22c55e"} />
            : <AlertCircle size={14} color={colors.error || "#ef4444"} />
          }
          <Text 
            className="text-[11px] font-extrabold uppercase tracking-widest"
            style={{ color: toast.type === "success" ? (colors.success || "#22c55e") : (colors.error || "#ef4444") }}
          >
            {toast.msg}
          </Text>
        </View>
      )}

      {/* Header */}
      <View className="p-5 pt-15" style={{ backgroundColor: colors.background }}>
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-[28px] font-black tracking-tighter" style={{ color: colors.text }}>
            Support Inbox
          </Text>
          <View 
            className="px-3 py-1.5 rounded-xl border"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Text className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: colors.error || "#ef4444" }}>
              {tickets.filter(t => t.status === "open").length} Open
            </Text>
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-1">
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              className="px-4 py-2 rounded-[20px] mr-2 border"
              style={{ 
                backgroundColor: filter === f ? `${colors.tint}1A` : colors.card, 
                borderColor: filter === f ? colors.tint : colors.border 
              }}
              onPress={() => setFilter(f)}
            >
              <Text 
                className="text-[9px] font-black tracking-widest uppercase"
                style={{ color: filter === f ? colors.tint : colors.icon }}
              >
                {f.replace("-", " ")}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 justify-center items-center gap-3">
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 justify-center items-center gap-3">
          <MessageCircle size={40} color={colors.icon} />
          <Text className="text-[13px] font-bold" style={{ color: colors.icon }}>No tickets found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }}>
          {filtered.map((ticket) => {
            const s = STATUS_CONFIG[ticket.status];
            return (
              <TouchableOpacity
                key={ticket._id}
                className="flex-row items-center justify-between border rounded-[20px] p-4 mb-2.5"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                onPress={() => setSelected(ticket)}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View 
                    className="w-11 h-11 rounded-full border items-center justify-center"
                    style={{ backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}33` }}
                  >
                    <Text className="text-lg font-black" style={{ color: colors.tint }}>
                      {ticket.user?.name?.charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold mb-0.5" style={{ color: colors.text }} numberOfLines={1}>
                      {ticket.user?.name || "Unknown"}
                    </Text>
                    <Text className="text-[11px] font-semibold mb-0.5" style={{ color: colors.icon }} numberOfLines={1}>
                      {ticket.subject}
                    </Text>
                    <Text className="text-[10px] font-medium" style={{ color: colors.icon }} numberOfLines={1}>
                      {ticket.description}
                    </Text>
                  </View>
                </View>
                <View className="items-end gap-1.5">
                  <View 
                    className="px-2 py-1 rounded-lg border"
                    style={{ backgroundColor: s.bg, borderColor: s.border }}
                  >
                    <Text className="text-[7px] font-black tracking-widest" style={{ color: s.color }}>
                      {s.label}
                    </Text>
                  </View>
                  <Text className="text-[9px] font-bold" style={{ color: colors.icon }}>{timeAgo(ticket.createdAt)}</Text>
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
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
          <View className="rounded-t-[32px] max-h-[85%] border-t" style={{ backgroundColor: colors.card, borderColor: colors.border }}>

            <View className="flex-row justify-between items-center p-6 border-b" style={{ borderBottomColor: colors.border }}>
              <Text className="text-lg font-extrabold" style={{ color: colors.text }}>Ticket Details</Text>
              <TouchableOpacity onPress={() => setSelected(null)} className="p-2 rounded-xl" style={{ backgroundColor: colors.background }}>
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selected && (
              <ScrollView className="p-6" showsVerticalScrollIndicator={false}>

                {/* User Info */}
                <View className="flex-row items-center gap-3.5 mb-5 rounded-2xl p-4" style={{ backgroundColor: colors.background }}>
                  <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: colors.tint }}>
                    <Text className="text-xl font-black" style={{ color: colors.background }}>
                      {selected.user?.name?.charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-[15px] font-bold mb-0.5" style={{ color: colors.text }}>{selected.user?.name}</Text>
                    <Text className="text-[11px] mb-0.5" style={{ color: colors.icon }}>{selected.user?.email}</Text>
                    {selected.user?.student_id && (
                      <Text className="text-[10px] font-bold" style={{ color: colors.tint }}>ID: {selected.user.student_id}</Text>
                    )}
                  </View>
                </View>

                {/* Subject */}
                <Text className="text-[9px] font-black uppercase tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>SUBJECT</Text>
                <View className="rounded-2xl p-3.5 border" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
                  <Text className="text-[13px] leading-5 font-medium" style={{ color: colors.text }}>{selected.subject}</Text>
                </View>

                {/* Description */}
                <Text className="text-[9px] font-black uppercase tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>DESCRIPTION</Text>
                <View className="rounded-2xl p-3.5 border" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
                  <Text className="text-[13px] leading-5 font-medium" style={{ color: colors.text }}>{selected.description}</Text>
                </View>

                {/* Current Status */}
                <Text className="text-[9px] font-black uppercase tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>CURRENT STATUS</Text>
                <View 
                  className="rounded-xl p-3 border items-center mb-1"
                  style={{ backgroundColor: STATUS_CONFIG[selected.status].bg, borderColor: STATUS_CONFIG[selected.status].border }}
                >
                  <Text className="text-[11px] font-black tracking-widest" style={{ color: STATUS_CONFIG[selected.status].color }}>
                    {STATUS_CONFIG[selected.status].label}
                  </Text>
                </View>

                {/* Update Status */}
                <Text className="text-[9px] font-black uppercase tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>UPDATE STATUS</Text>
                <View className="flex-row gap-2">
                  {(["open", "in-progress", "resolved"] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      className={`flex-1 py-3 rounded-xl border items-center ${selected.status === s ? "opacity-40" : ""}`}
                      style={{ backgroundColor: colors.background, borderColor: STATUS_CONFIG[s].border }}
                      onPress={() => handleUpdateStatus(selected._id, s)}
                      disabled={updating || selected.status === s}
                    >
                      {updating && selected.status !== s ? (
                        <ActivityIndicator size="small" color={STATUS_CONFIG[s].color} />
                      ) : (
                        <Text className="text-[8px] font-black tracking-widest" style={{ color: STATUS_CONFIG[s].color }}>
                          {STATUS_CONFIG[s].label}
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

<BottomBar role="admin" />
    </View>
  );
}