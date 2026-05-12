import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView,
  Modal, KeyboardAvoidingView, Platform
} from "react-native";
import { 
  Plus, Calendar, Clock, Bus, 
  X, Trash2, Edit2, Users
} from "lucide-react-native";
import api from "../../src/services/api";
import Appbar from "../../src/components/bar";
import { useThemeColor } from "../../constants/theme"; // 🟢 استدعاء الهوك

// --- Types ---
interface TripData {
  id: string;
  routeName: string;
  date: string;
  timeSlot: string;
  busNumber: string;
  bookedSeats: number;
  totalSeats: number;
  status: string;
  rawDate: string;
  rawTimeSlot: string;
}

export default function ManageTripsScreen() {
  const colors = useThemeColor(); // 🟢 سحب الألوان
  const [trips, setTrips] = useState<TripData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });

  const [editingTrip, setEditingTrip] = useState<TripData | null>(null);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Fetch Trips ---
  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/trips");
      const rawTrips = res.data?.data || res.data || [];

      const departureTimeMap: Record<string, string> = {
        'morning': '08:00 AM',
        'return_1530': '03:30 PM',
        'return_1900': '07:00 PM'
      };

      const mappedTrips: TripData[] = rawTrips.map((t: any) => ({
        id: t._id,
        routeName: t.route?.name || 'Unknown Route',
        date: t.date ? new Date(t.date).toLocaleDateString('en-GB') : 'N/A', 
        timeSlot: departureTimeMap[t.time_slot] || t.time_slot,
        busNumber: t.bus_number || t.route?.code || 'Bus #01',
        bookedSeats: t.booked_seats || 0,
        totalSeats: t.total_seats || 40,
        status: t.status || 'scheduled',
        rawDate: t.date,
        rawTimeSlot: t.time_slot
      }));

      setTrips(mappedTrips);
    } catch (err) {
      console.error("Failed to fetch trips", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  useEffect(() => {
    if (toast.msg) {
      const t = setTimeout(() => setToast({ msg: '', type: null }), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // --- Delete Handler ---
  const handleDeleteConfirm = async () => {
    if (!deletingTripId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/trips/${deletingTripId}`);
      setTrips(prev => prev.filter(t => t.id !== deletingTripId));
      setToast({ msg: 'Trip deleted successfully', type: 'success' });
    } catch (err: any) {
      setToast({ msg: 'Failed to delete trip', type: 'error' });
    } finally {
      setIsDeleting(false);
      setDeletingTripId(null);
    }
  };

  // Timeline UI Helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success || "#22c55e"; 
      case 'completed': return colors.tint || "#f7a01b"; 
      case 'cancelled': return colors.error || "#ef4444"; 
      default: return "#3b82f6"; 
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>

      {/* --- Toast --- */}
      {toast.msg ? (
        <View 
          className="absolute top-15 self-center z-50 py-2.5 px-5 rounded-[20px] border"
          style={{
            backgroundColor: toast.type === 'success' ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            borderColor: toast.type === 'success' ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"
          }}
        >
          <Text 
            className="text-[11px] font-extrabold uppercase tracking-widest"
            style={{ color: toast.type === 'success' ? (colors.success || "#22c55e") : (colors.error || "#ef4444") }}
          >
            {toast.msg}
          </Text>
        </View>
      ) : null}

      {/* --- Header --- */}
      <View className="p-5 pt-15" style={{ backgroundColor: colors.background }}>
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-[28px] font-black tracking-tighter" style={{ color: colors.text }}>Timeline</Text>
            <Text className="text-[10px] font-extrabold uppercase tracking-widest mt-1" style={{ color: colors.icon }}>
              Daily Fleet Operations
            </Text>
          </View>
          <TouchableOpacity 
            className="w-11 h-11 rounded-2xl items-center justify-center"
            style={{ backgroundColor: colors.tint }}
          >
            <Plus size={18} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Main Content (Timeline) --- */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : trips.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Clock size={40} color={colors.icon} style={{ opacity: 0.3, marginBottom: 16 }} />
          <Text className="text-[13px] font-semibold" style={{ color: colors.icon }}>No schedules available.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
          {trips.map((trip, index) => {
            const statusColor = getStatusColor(trip.status);
            const fillPercentage = Math.min((trip.bookedSeats / trip.totalSeats) * 100, 100);
            const isFull = fillPercentage >= 100;
            const isLast = index === trips.length - 1;

            return (
              <View key={trip.id} className="flex-row min-h-[100px]">
                
                {/* 1. The Timeline Graphic (Left) */}
                <View className="w-10 items-center">
                  <View 
                    className="w-4 h-4 rounded-full border-2 items-center justify-center mt-1"
                    style={{ borderColor: `${statusColor}40`, backgroundColor: colors.background }}
                  >
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
                  </View>
                  {!isLast && <View className="flex-1 w-[2px] my-1" style={{ backgroundColor: colors.border }} />}
                </View>

                {/* 2. The Content Card (Right) */}
                <View 
                  className="flex-1 rounded-[20px] p-4 mb-5 border"
                  style={{ backgroundColor: colors.card, borderColor: colors.border }}
                >
                  
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-lg font-black tracking-tight" style={{ color: colors.text }}>{trip.timeSlot}</Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity 
                        className="p-1.5 rounded-lg border"
                        style={{ backgroundColor: colors.background, borderColor: colors.border }} 
                        onPress={() => setEditingTrip(trip)}
                      >
                        <Edit2 size={14} color={colors.icon} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="p-1.5 rounded-lg border"
                        style={{ backgroundColor: colors.background, borderColor: colors.border }} 
                        onPress={() => setDeletingTripId(trip.id)}
                      >
                        <Trash2 size={14} color={colors.error || "#ef4444"} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text className="text-[13px] font-bold mb-4 tracking-wide" style={{ color: colors.icon }} numberOfLines={1}>
                    {trip.routeName}
                  </Text>

                  <View className="flex-row gap-2 mb-4 flex-wrap">
                    <View className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <Calendar size={10} color={colors.icon} />
                      <Text className="text-[10px] font-extrabold" style={{ color: colors.text }}>{trip.date}</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <Bus size={10} color={colors.tint} />
                      <Text className="text-[10px] font-extrabold" style={{ color: colors.text }}>{trip.busNumber}</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <Users size={10} color={isFull ? (colors.error || "#ef4444") : "#3b82f6"} />
                      <Text className="text-[10px] font-extrabold" style={{ color: isFull ? (colors.error || "#ef4444") : colors.text }}>
                        {trip.bookedSeats}/{trip.totalSeats}
                      </Text>
                    </View>
                  </View>

                  <View 
                    className="self-start px-3 py-1.5 rounded-lg border"
                    style={{ backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` }}
                  >
                    <Text className="text-[9px] font-black uppercase tracking-widest" style={{ color: statusColor }}>
                      {trip.status}
                    </Text>
                  </View>

                </View>
                
              </View>
            );
          })}
          
        </ScrollView>
      )}

      {/* --- Edit Modal (Bottom Sheet) --- */}
      {editingTrip && (
        <EditTripModal 
          trip={editingTrip} 
          onClose={() => setEditingTrip(null)} 
          onSuccess={() => { setEditingTrip(null); fetchTrips(); setToast({msg: 'Updated successfully', type: 'success'}); }} 
        />
      )}

      {/* --- Delete Alert Modal --- */}
      <Modal visible={!!deletingTripId} transparent animationType="fade">
        <View className="flex-1 justify-center items-center p-5" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
          <View className="rounded-[28px] p-6 border items-center w-full max-w-[340px]" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <View className="w-14 h-14 rounded-full items-center justify-center mb-4" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
              <Trash2 size={24} color={colors.error || "#ef4444"} />
            </View>
            <Text className="text-lg font-extrabold mb-2" style={{ color: colors.text }}>Delete Trip</Text>
            <Text className="text-[13px] text-center leading-5 mb-6" style={{ color: colors.icon }}>
              Are you sure you want to delete this trip permanently?
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity 
                className="flex-1 py-3.5 rounded-2xl items-center"
                style={{ backgroundColor: colors.background }} 
                onPress={() => setDeletingTripId(null)}
              >
                <Text className="text-[11px] font-extrabold tracking-widest" style={{ color: colors.icon }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 py-3.5 rounded-2xl items-center"
                style={{ backgroundColor: colors.error || "#ef4444" }} 
                onPress={handleDeleteConfirm} 
                disabled={isDeleting}
              >
                <Text className="text-[11px] font-extrabold tracking-widest text-white">
                  {isDeleting ? "..." : "DELETE"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Appbar />

    </View>
  );
}

// ==========================================
// --- EDIT TRIP MODAL COMPONENT ---
// ==========================================
const EditTripModal = ({ trip, onClose, onSuccess }: any) => {
  const colors = useThemeColor(); // 🟢 سحب الألوان للمودال كمان
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formattedDate = trip.rawDate ? new Date(trip.rawDate).toISOString().split('T')[0] : '';
  
  const [formData, setFormData] = useState({
    date: formattedDate,
    time_slot: trip.rawTimeSlot,
    bus_number: trip.busNumber,
    total_seats: trip.totalSeats.toString()
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.put(`/trips/${trip.id}`, {
        ...formData,
        total_seats: Number(formData.total_seats)
      });
      onSuccess();
    } catch (err: any) {
      alert("Failed to update trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal transparent animationType="slide" visible={true}>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="rounded-t-[32px] max-h-[85%]" style={{ backgroundColor: colors.card }}>
          
          <View className="flex-row justify-between items-center p-6 border-b" style={{ borderBottomColor: colors.border }}>
            <Text className="text-lg font-extrabold" style={{ color: colors.text }}>Edit Trip Details</Text>
            <TouchableOpacity onPress={onClose} className="p-2 rounded-xl" style={{ backgroundColor: colors.background }}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
            <Text className="text-[15px] font-black mb-5" style={{ color: colors.tint }}>{trip.routeName}</Text>
            
            <Text className="text-[10px] font-extrabold tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>TRIP DATE (YYYY-MM-DD)</Text>
            <TextInput 
              className="border rounded-2xl p-4 text-sm"
              style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
              value={formData.date} 
              onChangeText={t => setFormData({...formData, date: t})}
              placeholderTextColor={colors.icon}
            />

            <Text className="text-[10px] font-extrabold tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>TIME SLOT</Text>
            <View className="flex-row gap-2">
              {[
                { id: "morning", label: "Morning" },
                { id: "return_1530", label: "03:30 PM" },
                { id: "return_1900", label: "07:00 PM" }
              ].map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  className="flex-1 flex-row items-center justify-center gap-2 border py-3.5 rounded-2xl"
                  style={{ 
                    backgroundColor: formData.time_slot === slot.id ? `${colors.tint}0D` : colors.background,
                    borderColor: formData.time_slot === slot.id ? colors.tint : colors.border
                  }}
                  onPress={() => setFormData({...formData, time_slot: slot.id})}
                >
                  <Text 
                    className="text-[11px] font-extrabold" 
                    style={{ color: formData.time_slot === slot.id ? colors.tint : colors.icon }}
                  >
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-[10px] font-extrabold tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>BUS NUMBER</Text>
                <TextInput 
                  className="border rounded-2xl p-4 text-sm"
                  style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                  value={formData.bus_number} 
                  onChangeText={t => setFormData({...formData, bus_number: t})}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-extrabold tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>TOTAL SEATS</Text>
                <TextInput 
                  className="border rounded-2xl p-4 text-sm"
                  style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                  keyboardType="numeric"
                  value={formData.total_seats} 
                  onChangeText={t => setFormData({...formData, total_seats: t})}
                />
              </View>
            </View>
          </ScrollView>

          <View className="p-6 border-t" style={{ borderTopColor: colors.border, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
            <TouchableOpacity 
              className="py-4 rounded-2xl items-center"
              style={{ backgroundColor: colors.tint }} 
              onPress={handleSubmit} 
              disabled={isSubmitting}
            >
              <Text className="text-[13px] font-extrabold tracking-widest" style={{ color: colors.background }}>
                {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        
      </View>
      
    </Modal>
  );
};