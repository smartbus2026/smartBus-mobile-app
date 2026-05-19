import {
  Bus, Calendar, Clock,
  Edit2, Plus, Trash2, Users, X
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal,
  Platform, ScrollView, Text, TextInput, TouchableOpacity, View
} from "react-native";
import { useThemeColor } from "../../constants/theme";
import api from "../../src/services/api";
import TopBar from "../../src/components/TopBar";
import { useRouter } from "expo-router";
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
  const colors = useThemeColor();
  const [trips, setTrips]                   = useState<TripData[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [toast, setToast]                   = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });
  const [editingTrip, setEditingTrip]       = useState<TripData | null>(null);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting]         = useState(false);
  const router = useRouter(); // ← أضفها هنا

  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/trips");
      const rawTrips = res.data?.data || res.data || [];
      const departureTimeMap: Record<string, string> = {
        'morning': '08:00 AM',
        'return_1530': '03:30 PM',
        'return_1900': '07:00 PM',
      };
      const mappedTrips: TripData[] = rawTrips.map((t: any) => ({
        id: t._id,
        routeName:   t.route?.name || 'Unknown Route',
        date:        t.date ? new Date(t.date).toLocaleDateString('en-GB') : 'N/A',
        timeSlot:    departureTimeMap[t.time_slot] || t.time_slot,
        busNumber:   t.bus_number || t.route?.code || 'Bus #01',
        bookedSeats: t.booked_seats || 0,
        totalSeats:  t.total_seats || 40,
        status:      t.status || 'scheduled',
        rawDate:     t.date,
        rawTimeSlot: t.time_slot,
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

  const handleDeleteConfirm = async () => {
    if (!deletingTripId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/trips/${deletingTripId}`);
      setTrips(prev => prev.filter(t => t.id !== deletingTripId));
      setToast({ msg: 'Trip deleted successfully', type: 'success' });
    } catch {
      setToast({ msg: 'Failed to delete trip', type: 'error' });
    } finally {
      setIsDeleting(false);
      setDeletingTripId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':    return colors.success || "#22c55e";
      case 'completed': return colors.tint    || "#f7a01b";
      case 'cancelled': return colors.error   || "#ef4444";
      default:          return "#3b82f6";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Top Bar ── */}
<TopBar
  title="Trips"
  showMenu
  showSettings
  onSettingsPress={() => router.push('/(admin)/settings' as any)}
/>
      {/* ── Toast ── */}
      {toast.msg ? (
        <View style={{
          position: 'absolute', top: 70, alignSelf: 'center', zIndex: 50,
          paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1,
          backgroundColor: toast.type === 'success' ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          borderColor:     toast.type === 'success' ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
        }}>
          <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: toast.type === 'success' ? (colors.success || "#22c55e") : (colors.error || "#ef4444") }}>
            {toast.msg}
          </Text>
        </View>
      ) : null}

      {/* ── Title ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: colors.text }}>Timeline</Text>
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4, color: colors.icon }}>
            Daily Fleet Operations
          </Text>
        </View>
        <TouchableOpacity
          style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tint }}
        >
          <Plus size={18} color={colors.background} />
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : trips.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Clock size={40} color={colors.icon} style={{ opacity: 0.3, marginBottom: 16 }} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.icon }}>No schedules available.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {trips.map((trip, index) => {
            const statusColor    = getStatusColor(trip.status);
            const fillPercentage = Math.min((trip.bookedSeats / trip.totalSeats) * 100, 100);
            const isFull         = fillPercentage >= 100;
            const isLast         = index === trips.length - 1;

            return (
              <View key={trip.id} style={{ flexDirection: 'row', minHeight: 100 }}>

                {/* Timeline Graphic */}
                <View style={{ width: 40, alignItems: 'center' }}>
                  <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 4, borderColor: `${statusColor}40`, backgroundColor: colors.background }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor }} />
                  </View>
                  {!isLast && <View style={{ flex: 1, width: 2, marginVertical: 4, backgroundColor: colors.border }} />}
                </View>

                {/* Content Card */}
                <View style={{ flex: 1, borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>{trip.timeSlot}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={{ padding: 6, borderRadius: 10, borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border }}
                        onPress={() => setEditingTrip(trip)}
                      >
                        <Edit2 size={14} color={colors.icon} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ padding: 6, borderRadius: 10, borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border }}
                        onPress={() => setDeletingTripId(trip.id)}
                      >
                        <Trash2 size={14} color={colors.error || "#ef4444"} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 16, color: colors.icon }} numberOfLines={1}>
                    {trip.routeName}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.background }}>
                      <Calendar size={10} color={colors.icon} />
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.text }}>{trip.date}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.background }}>
                      <Bus size={10} color={colors.tint} />
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.text }}>{trip.busNumber}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.background }}>
                      <Users size={10} color={isFull ? (colors.error || "#ef4444") : "#3b82f6"} />
                      <Text style={{ fontSize: 10, fontWeight: '800', color: isFull ? (colors.error || "#ef4444") : colors.text }}>
                        {trip.bookedSeats}/{trip.totalSeats}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: statusColor }}>
                      {trip.status}
                    </Text>
                  </View>
                </View>

              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Edit Modal ── */}
      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onSuccess={() => { setEditingTrip(null); fetchTrips(); setToast({ msg: 'Updated successfully', type: 'success' }); }}
        />
      )}

      {/* ── Delete Modal ── */}
      <Modal visible={!!deletingTripId} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: "rgba(0,0,0,0.7)" }}>
          <View style={{ borderRadius: 28, padding: 24, width: '100%', alignItems: 'center', borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: "rgba(239,68,68,0.1)" }}>
              <Trash2 size={24} color={colors.error || "#ef4444"} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8, color: colors.text }}>Delete Trip</Text>
            <Text style={{ fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24, color: colors.icon }}>
              Are you sure you want to delete this trip permanently?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: colors.background }}
                onPress={() => setDeletingTripId(null)}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: colors.error || "#ef4444" }}
                onPress={handleDeleteConfirm}
                disabled={isDeleting}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: '#fff' }}>
                  {isDeleting ? "..." : "DELETE"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ── Edit Trip Modal ──
const EditTripModal = ({ trip, onClose, onSuccess }: any) => {
  const colors        = useThemeColor();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formattedDate = trip.rawDate ? new Date(trip.rawDate).toISOString().split('T')[0] : '';
  const [formData, setFormData] = useState({
    date:        formattedDate,
    time_slot:   trip.rawTimeSlot,
    bus_number:  trip.busNumber,
    total_seats: trip.totalSeats.toString(),
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.put(`/trips/${trip.id}`, { ...formData, total_seats: Number(formData.total_seats) });
      onSuccess();
    } catch {
      alert("Failed to update trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal transparent animationType="slide" visible>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: "rgba(0,0,0,0.7)" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%', backgroundColor: colors.card }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Edit Trip Details</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 8, borderRadius: 12, backgroundColor: colors.background }}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 15, fontWeight: '900', marginBottom: 20, color: colors.tint }}>{trip.routeName}</Text>

            <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginTop: 16, color: colors.icon }}>TRIP DATE (YYYY-MM-DD)</Text>
            <TextInput
              style={{ borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 13, backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
              value={formData.date}
              onChangeText={t => setFormData({ ...formData, date: t })}
              placeholderTextColor={colors.icon}
            />

            <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginTop: 16, color: colors.icon }}>TIME SLOT</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { id: "morning",     label: "Morning"   },
                { id: "return_1530", label: "03:30 PM"  },
                { id: "return_1900", label: "07:00 PM"  },
              ].map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1, backgroundColor: formData.time_slot === slot.id ? `${colors.tint}0D` : colors.background, borderColor: formData.time_slot === slot.id ? colors.tint : colors.border }}
                  onPress={() => setFormData({ ...formData, time_slot: slot.id })}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: formData.time_slot === slot.id ? colors.tint : colors.icon }}>{slot.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginTop: 16, color: colors.icon }}>BUS NUMBER</Text>
                <TextInput
                  style={{ borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 13, backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                  value={formData.bus_number}
                  onChangeText={t => setFormData({ ...formData, bus_number: t })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginTop: 16, color: colors.icon }}>TOTAL SEATS</Text>
                <TextInput
                  style={{ borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 13, backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                  keyboardType="numeric"
                  value={formData.total_seats}
                  onChangeText={t => setFormData({ ...formData, total_seats: t })}
                />
              </View>
            </View>
          </ScrollView>

          <View style={{ padding: 24, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
            <TouchableOpacity
              style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: colors.tint }}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.background }}>
                {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};