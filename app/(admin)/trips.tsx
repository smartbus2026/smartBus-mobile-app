import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, StyleSheet,
  Modal, KeyboardAvoidingView, Platform
} from "react-native";
import { 
  Plus, Calendar, Clock, Bus, 
  Settings, X, Trash2, Edit2, Users
} from "lucide-react-native";
import api from "../../src/services/api";
import Appbar from "../../src/components/bar";


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
        date: t.date ? new Date(t.date).toLocaleDateString('en-GB') : 'N/A', // e.g. 12/05/2026
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
      case 'active': return "#22c55e"; // Green
      case 'completed': return "#f7a01b"; // Orange
      case 'cancelled': return "#ef4444"; // Red
      default: return "#3b82f6"; // Blue for Scheduled
    }
  };

  return (
    <View style={styles.container}>

      {/* --- Toast --- */}
      {toast.msg ? (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={[styles.toastText, toast.type === 'success' ? {color: "#22c55e"} : {color: "#ef4444"}]}>
            {toast.msg}
          </Text>
        </View>
      ) : null}

      {/* --- Header --- */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Timeline</Text>
            <Text style={styles.headerSubtitle}>Daily Fleet Operations</Text>
          </View>
          <TouchableOpacity style={styles.createBtn}>
            <Plus size={18} color="#0f1115" />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Main Content (Timeline) --- */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#f7a01b" />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.centerContainer}>
          <Clock size={40} color="#8a8d91" style={{ opacity: 0.3, marginBottom: 16 }} />
          <Text style={styles.emptyText}>No schedules available.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.timelineContainer} showsVerticalScrollIndicator={false}>
          {trips.map((trip, index) => {
            const statusColor = getStatusColor(trip.status);
            const fillPercentage = Math.min((trip.bookedSeats / trip.totalSeats) * 100, 100);
            const isFull = fillPercentage >= 100;
            const isLast = index === trips.length - 1;

            return (
              <View key={trip.id} style={styles.timelineRow}>
                
                {/* 1. The Timeline Graphic (Left) */}
                <View style={styles.timelineGraphic}>
                  <View style={[styles.dotOuter, { borderColor: `${statusColor}40` }]}>
                    <View style={[styles.dotInner, { backgroundColor: statusColor }]} />
                  </View>
                  {!isLast && <View style={styles.line} />}
                </View>

                {/* 2. The Content Card (Right) */}
                <View style={styles.cardContent}>
                  
                  <View style={styles.cardHeader}>
                    <Text style={styles.timeText}>{trip.timeSlot}</Text>
                    <View style={styles.actionIcons}>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => setEditingTrip(trip)}>
                        <Edit2 size={14} color="#8a8d91" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => setDeletingTripId(trip.id)}>
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.routeName} numberOfLines={1}>{trip.routeName}</Text>

                  <View style={styles.infoChips}>
                    <View style={styles.chip}>
                      <Calendar size={10} color="#8a8d91" />
                      <Text style={styles.chipText}>{trip.date}</Text>
                    </View>
                    <View style={styles.chip}>
                      <Bus size={10} color="#f7a01b" />
                      <Text style={styles.chipText}>{trip.busNumber}</Text>
                    </View>
                    <View style={styles.chip}>
                      <Users size={10} color={isFull ? "#ef4444" : "#3b82f6"} />
                      <Text style={[styles.chipText, isFull && {color: "#ef4444"}]}>
                        {trip.bookedSeats}/{trip.totalSeats}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{trip.status}</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.alertModal}>
            <View style={styles.alertIcon}>
              <Trash2 size={24} color="#ef4444" />
            </View>
            <Text style={styles.alertTitle}>Delete Trip</Text>
            <Text style={styles.alertMessage}>
              Are you sure you want to delete this trip permanently?
            </Text>
            <View style={styles.alertActions}>
              <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setDeletingTripId(null)}>
                <Text style={styles.alertCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.alertDeleteBtn} onPress={handleDeleteConfirm} disabled={isDeleting}>
                <Text style={styles.alertDeleteText}>{isDeleting ? "..." : "DELETE"}</Text>
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
      <View style={styles.modalOverlayFlexEnd}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.bottomSheet}>
          
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Edit Trip Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.routeHeader}>{trip.routeName}</Text>
            
            <Text style={styles.inputLabel}>TRIP DATE (YYYY-MM-DD)</Text>
            <TextInput 
              style={styles.input} 
              value={formData.date} 
              onChangeText={t => setFormData({...formData, date: t})}
              placeholderTextColor="#8a8d91"
            />

            <Text style={styles.inputLabel}>TIME SLOT</Text>
            <View style={styles.slotContainer}>
              {[
                { id: "morning", label: "Morning" },
                { id: "return_1530", label: "03:30 PM" },
                { id: "return_1900", label: "07:00 PM" }
              ].map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[styles.slotBtn, formData.time_slot === slot.id && styles.slotBtnActive]}
                  onPress={() => setFormData({...formData, time_slot: slot.id})}
                >
                  <Text style={[styles.slotText, formData.time_slot === slot.id && styles.slotTextActive]}>
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>BUS NUMBER</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.bus_number} 
                  onChangeText={t => setFormData({...formData, bus_number: t})}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>TOTAL SEATS</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="numeric"
                  value={formData.total_seats} 
                  onChangeText={t => setFormData({...formData, total_seats: t})}
                />
              </View>
                 

            </View>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={isSubmitting}>
              <Text style={styles.saveBtnText}>{isSubmitting ? "SAVING..." : "SAVE CHANGES"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        
      </View>
      
    </Modal>
  );
};

// ==========================================
// --- STYLES ---
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1115" },
  
  // Toast
  toast: { position: "absolute", top: 60, alignSelf: "center", zIndex: 100, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1 },
  toastSuccess: { backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)" },
  toastError: { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" },
  toastText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },

  // Header
  header: { padding: 20, paddingTop: 60, backgroundColor: "#0f1115" },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 10, fontWeight: "800", color: "#8a8d91", textTransform: "uppercase", letterSpacing: 2, marginTop: 4 },
  createBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: "#f7a01b", alignItems: "center", justifyContent: "center" },
  
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#6b7280", fontSize: 13, fontWeight: "600" },

  // --- Timeline Layout ---
  timelineContainer: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 },
  timelineRow: { flexDirection: "row", minHeight: 100 },
  
  timelineGraphic: { width: 40, alignItems: "center" },
  dotOuter: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: "#0f1115", marginTop: 4 },
  dotInner: { width: 8, height: 8, borderRadius: 4 },
  line: { flex: 1, width: 2, backgroundColor: "#2d3036", marginVertical: 4 },

  cardContent: { flex: 1, backgroundColor: "#1c1e26", borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#2d3036" },
  
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  timeText: { fontSize: 18, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  actionIcons: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 6, backgroundColor: "#0f1115", borderRadius: 8, borderWidth: 1, borderColor: "#2d3036" },
  
  routeName: { fontSize: 13, fontWeight: "700", color: "#8a8d91", marginBottom: 16, letterSpacing: 0.5 },
  
  infoChips: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#0f1115", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  chipText: { fontSize: 10, fontWeight: "800", color: "#fff" },

  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 9, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.5 },

  // Modals Overlay
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 },
  modalOverlayFlexEnd: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },

  // Bottom Sheet Form
  bottomSheet: { backgroundColor: "#1c1e26", borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: "85%" },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24, borderBottomWidth: 1, borderBottomColor: "#2d3036" },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  closeBtn: { backgroundColor: "#262a33", padding: 8, borderRadius: 12 },
  
  sheetBody: { padding: 24 },
  routeHeader: { fontSize: 15, fontWeight: "900", color: "#f7a01b", marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: "800", color: "#8a8d91", letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: "#0f1115", borderWidth: 1, borderColor: "#2d3036", borderRadius: 16, color: "#fff", padding: 16, fontSize: 14 },
  
  slotContainer: { flexDirection: "row", gap: 8 },
  slotBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#0f1115", borderWidth: 1, borderColor: "#2d3036", paddingVertical: 14, borderRadius: 14 },
  slotBtnActive: { borderColor: "#f7a01b", backgroundColor: "rgba(247,160,27,0.05)" },
  slotText: { fontSize: 11, fontWeight: "800", color: "#8a8d91" },
  slotTextActive: { color: "#f7a01b" },

  sheetFooter: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopWidth: 1, borderTopColor: "#2d3036" },
  saveBtn: { backgroundColor: "#f7a01b", paddingVertical: 18, borderRadius: 16, alignItems: "center" },
  saveBtnText: { color: "#0f1115", fontSize: 13, fontWeight: "800", letterSpacing: 1 },

  // Alert Modal
  alertModal: { backgroundColor: "#1c1e26", borderRadius: 28, padding: 24, borderWidth: 1, borderColor: "#2d3036", alignItems: "center" },
  alertIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  alertTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 8 },
  alertMessage: { fontSize: 13, color: "#8a8d91", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  alertActions: { flexDirection: "row", gap: 12, width: "100%" },
  alertCancelBtn: { flex: 1, backgroundColor: "#262a33", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  alertCancelText: { color: "#8a8d91", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  alertDeleteBtn: { flex: 1, backgroundColor: "#ef4444", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  alertDeleteText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
});