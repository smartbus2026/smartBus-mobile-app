import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from "react-native";
import { 
  Bell, Send, Calendar, Bus, Map as MapIcon, 
  Clock, Users, Trash2, CheckCircle, AlertTriangle, Globe, Zap 
} from "lucide-react-native";
import api from "../../src/services/api";
import Appbar from "../../src/components/bar";
import { useThemeColor } from "../../constants/theme"; 

interface NotifHistory {
  id: string;
  title: string;
  message: string;
  target: string;
  time: string;
}

export default function AdminNotifications() {
  const colors = useThemeColor(); 
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("Everyone");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<NotifHistory[]>([]);
  
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });

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
      const newNotif: NotifHistory = {
        id: `MSG-${Date.now()}`,
        title, message, target,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => [newNotif, ...prev]);
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      
      {/* --- Toast --- */}
      {toast.msg && (
        <View 
          className="absolute top-15 self-center z-50 flex-row items-center gap-2.5 py-3 px-6 rounded-full border shadow-2xl"
          style={{
            backgroundColor: colors.card,
            borderColor: toast.type === 'success' ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
            shadowColor: toast.type === 'success' ? "#22c55e" : "#ef4444", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15
          }}
        >
          {toast.type === 'success' ? <CheckCircle size={16} color={colors.success || "#22c55e"} /> : <AlertTriangle size={16} color={colors.error || "#ef4444"} />}
          <Text 
            className="text-[11px] font-black uppercase tracking-widest"
            style={{ color: toast.type === 'success' ? (colors.success || "#22c55e") : (colors.error || "#ef4444") }}
          >
            {toast.msg}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          {/* --- Header --- */}
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-3xl font-black tracking-tighter" style={{ color: colors.text }}>Send Notification</Text>
              <Text className="text-[10px] font-extrabold uppercase tracking-widest mt-1.5" style={{ color: colors.icon }}>Notify students and drivers</Text>
            </View>
            <View 
              className="flex-row items-center gap-2 px-3 py-2 rounded-xl border"
              style={{ backgroundColor: `${colors.success || "#22c55e"}1A`, borderColor: `${colors.success || "#22c55e"}33` }}
            >
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.success || "#22c55e" }} />
              <Text className="text-[9px] font-black tracking-widest" style={{ color: colors.success || "#22c55e" }}>ONLINE</Text>
            </View>
          </View>

     {/* 🟢 Quick Messages Section */}
          <View className="mb-8">
            <View className="flex-row items-center gap-2 mb-4 ml-1">
              <Zap size={14} color={colors.tint} fill={colors.tint} />
              <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.icon }}>Quick Messages</Text>
            </View>
            {/* 🟢 التعديل هنا: ضفنا paddingBottom للـ contentContainerStyle */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 4 }} 
            >
              {templates.map((t) => {
                const Icon = t.icon;
                return (
                  <TouchableOpacity 
                    key={t.label} 
                    className="flex-row items-center gap-3 px-5 py-3.5 rounded-[20px] mr-3 border"
                    style={{ 
                      backgroundColor: colors.card, 
                      borderColor: colors.border,
                      shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, elevation: 4 // 🟢 زودنا الضل شوية
                    }}
                    onPress={() => { setTitle(t.label); setMessage(t.msg); }}
                    activeOpacity={0.7}
                  >
                    <View className="p-1.5 rounded-full" style={{ backgroundColor: `${colors.tint}1A` }}>
                      <Icon size={14} color={colors.tint} />
                    </View>
                    <Text className="text-xs font-black" style={{ color: colors.text }}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* --- Form Card --- */}
          <View 
            className="rounded-[32px] p-6 border shadow-sm"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <View className="mb-5">
              <Text className="text-[9px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.icon }}>Notification Title</Text>
              <TextInput 
                className="rounded-2xl p-4 text-[13px] font-bold border"
                style={{ backgroundColor: colors.background, color: colors.text, borderColor: colors.border }}
                placeholder="e.g. Bus Delay" 
                placeholderTextColor={colors.icon} 
                value={title} 
                onChangeText={setTitle} 
              />
            </View>

            <View className="mb-6">
              <Text className="text-[9px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.icon }}>Message Content</Text>
              <TextInput 
                className="rounded-2xl p-4 text-[13px] font-bold border min-h-[120px]"
                style={{ backgroundColor: colors.background, color: colors.text, borderColor: colors.border, textAlignVertical: "top" }}
                placeholder="Type your message here..." 
                placeholderTextColor={colors.icon} 
                value={message} 
                onChangeText={setMessage} 
                multiline 
                numberOfLines={4} 
              />
            </View>

            <Text className="text-[9px] font-black uppercase tracking-widest mb-3 ml-1" style={{ color: colors.icon }}>Send To</Text>
            <View className="flex-row gap-3 mb-8">
              {[
                { id: "Everyone", icon: Globe }, 
                { id: "Students Only", icon: Users }
              ].map((opt) => {
                const OptIcon = opt.icon;
                const isActive = target === opt.id;
                return (
                  <TouchableOpacity 
                    key={opt.id} 
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-4 px-1 rounded-xl border"
                    style={{ 
                      backgroundColor: isActive ? `${colors.tint}1A` : colors.background, 
                      borderColor: isActive ? colors.tint : colors.border 
                    }}
                    onPress={() => setTarget(opt.id)}
                    activeOpacity={0.7}
                  >
                    <OptIcon size={12} color={isActive ? colors.tint : colors.icon} />
                    <Text 
                      className="text-[9px] font-black tracking-wider uppercase text-center"
                      style={{ color: isActive ? colors.tint : colors.icon }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {opt.id}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity 
              className="py-5 rounded-[20px] flex-row items-center justify-center"
              style={{ backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 }}
              onPress={handleSend} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator color={colors.background} /> : (
                <View className="flex-row items-center justify-center gap-3">
                  <Text className="text-[13px] font-black tracking-widest" style={{ color: colors.background }}>SEND NOTIFICATION</Text>
                  <Send size={16} color={colors.background} strokeWidth={2.5} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* --- History Section --- */}
          <View className="flex-row justify-between items-center mt-12 mb-6 ml-1">
            <Text className="text-[9px] font-black uppercase tracking-widest" style={{ color: colors.icon }}>Recent Notifications</Text>
            <TouchableOpacity onPress={() => setHistory([])} className="flex-row items-center gap-1.5 opacity-70 p-1">
              <Trash2 size={12} color={colors.icon} />
              <Text className="text-[9px] font-bold uppercase" style={{ color: colors.icon }}>Clear</Text>
            </TouchableOpacity>
          </View>

          {history.length === 0 ? (
            <View className="items-center py-12 px-6 border border-dashed rounded-[32px]" style={{ borderColor: colors.border }}>
              <Bell size={32} color={colors.icon} style={{ opacity: 0.3 }} />
              <Text className="text-[11px] font-extrabold uppercase mt-4 tracking-widest" style={{ color: colors.icon, opacity: 0.5 }}>No recent notifications</Text>
            </View>
          ) : (
            <View className="pl-3">
              {history.map((notif, idx) => (
                <View key={notif.id} className="flex-row gap-5 mb-0">
                  <View className="items-center w-5">
                    <View className="w-3 h-3 rounded-full mt-1.5 z-10 border-2" style={{ backgroundColor: colors.background, borderColor: colors.tint }} />
                    {idx !== history.length - 1 && <View className="w-0.5 flex-1 my-1" style={{ backgroundColor: colors.border }} />}
                  </View>
                  <View className="flex-1 mb-8 bg-transparent">
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="text-[15px] font-black flex-1 mr-4" style={{ color: colors.text }}>{notif.title}</Text>
                      <Text className="text-[9px] font-bold mt-1" style={{ color: colors.icon }}>{notif.time}</Text>
                    </View>
                    <Text className="text-[13px] font-medium leading-5 mb-4" style={{ color: colors.text, opacity: 0.8 }}>{notif.message}</Text>
                    <View className="flex-row items-center gap-3">
                        <View className="px-2.5 py-1.5 rounded-lg border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                          <Text className="text-[8px] font-black uppercase tracking-widest" style={{ color: colors.tint }}>{notif.target}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <CheckCircle size={10} color={colors.success || "#22c55e"} />
                          <Text className="text-[9px] font-black tracking-widest" style={{ color: colors.success || "#22c55e" }}>DELIVERED</Text>
                        </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
          
        </ScrollView>
      </KeyboardAvoidingView>
      <Appbar />
    </View>
  );
}