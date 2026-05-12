import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Modal
} from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Bus, Calendar, Users, ArrowLeft, CheckCircle, Clock, ChevronDown } from "lucide-react-native";
import api from "../../src/services/api";
import Appbar from "../../src/components/bar";


// 1. التعديل عشان يطابق الويبسايت (route_id بدلاً من route)
const tripSchema = z.object({
  route_id: z.string().min(1, "Please select a route"),
  departure_time: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  time_slot: z.enum(["morning", "return_1530", "return_1900"]),
  bus_number: z.string().min(2, "Bus number is required"),
  total_seats: z.string().min(1, "Total seats are required"),
});

type TripForm = z.infer<typeof tripSchema>;

interface RouteOption {
  _id: string;
  name: string;
}

export default function CreateTripScreen() {
  const [loading, setLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  
  // للـ Dropdown Custom Modal عشان مفيش select صريح في React Native
  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      time_slot: "morning"
    }
  });

  const selectedTimeSlot = watch("time_slot");
  const selectedRouteId = watch("route_id");
  
  // عشان نظهر اسم المسار بدل الـ ID
  const selectedRouteName = routes.find(r => r._id === selectedRouteId)?.name || "Select a route";

  // جلب المسارات زي الويبسايت بالظبط
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await api.get("/routes");
        setRoutes(res.data.data || res.data || []);
      } catch (err) {
        console.error("Failed to fetch routes", err);
      } finally {
        setRoutesLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const onSubmit = async (data: TripForm) => {
    setLoading(true);
    setServerError(null);
    setSuccess(false);

    try {
      // تجهيز الداتا زي الويبسايت بالظبط
      const payload = {
        route_id: data.route_id,
        departure_time: data.departure_time,
        time_slot: data.time_slot,
        bus_number: data.bus_number,
        total_seats: Number(data.total_seats),
      };

      await api.post("/trips", payload); 
      
      setSuccess(true);
      reset(); 
      
      setTimeout(() => {
        router.back();
      }, 2000);

    } catch (error: any) {
      console.error("Error creating trip:", error);
      setServerError(error.response?.data?.message || "Failed to create trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
   
      
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Trip</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>Deploy new fleet schedules</Text>

          {/* Alert Messages */}
          {serverError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{serverError}</Text>
            </View>
          )}
          {success && (
            <View style={styles.successBox}>
              <CheckCircle size={16} color="#22c55e" style={{ marginRight: 6 }} />
              <Text style={styles.successText}>Trip Created Successfully!</Text>
            </View>
          )}

          {/* حقل: Route ID (Custom Dropdown) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>SELECT ROUTE</Text>
            <TouchableOpacity 
              style={[styles.inputWrapper, { paddingVertical: 14, paddingHorizontal: 10 }, errors.route_id && styles.inputError]}
              onPress={() => setRouteModalVisible(true)}
              disabled={routesLoading}
            >
              <MapPin size={18} color="#8a8d91" style={styles.inputIcon} />
              <Text style={[styles.input, { color: selectedRouteId ? "#fff" : "#3a3d42", flex: 1, marginLeft: 10 }]}>
                {routesLoading ? "Loading routes..." : selectedRouteName}
              </Text>
              <ChevronDown size={18} color="#8a8d91" style={{ marginRight: 10 }} />
            </TouchableOpacity>
            {errors.route_id && <Text style={styles.fieldError}>{errors.route_id.message}</Text>}
          </View>

          {/* Route Selection Modal */}
          <Modal
            visible={routeModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setRouteModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Route</Text>
                <ScrollView>
                  {routes.map((r) => (
                    <TouchableOpacity
                      key={r._id}
                      style={styles.modalOption}
                      onPress={() => {
                        setValue("route_id", r._id, { shouldValidate: true });
                        setRouteModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalOptionText}>{r.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setRouteModalVisible(false)}>
                  <Text style={styles.modalCloseText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* حقل: Trip Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>TRIP DATE (YYYY-MM-DD)</Text>
            <View style={[styles.inputWrapper, errors.departure_time && styles.inputError]}>
              <Calendar size={18} color="#8a8d91" style={styles.inputIcon} />
              <Controller
                control={control}
                name="departure_time"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 2026-05-12"
                    placeholderTextColor="#3a3d42"
                    value={value}
                    onChangeText={onChange}
                    editable={!loading}
                  />
                )}
              />
            </View>
            {errors.departure_time && <Text style={styles.fieldError}>{errors.departure_time.message}</Text>}
          </View>

          {/* حقل: Time Slot (أزرار اختيار) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>TIME SLOT</Text>
            <View style={styles.slotContainer}>
              {[
                { id: "morning", label: "Morning" },
                { id: "return_1530", label: "03:30 PM" },
                { id: "return_1900", label: "07:00 PM" }
              ].map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[styles.slotBtn, selectedTimeSlot === slot.id && styles.slotBtnActive]}
                  onPress={() => setValue("time_slot", slot.id as any)}
                >
                  <Clock size={14} color={selectedTimeSlot === slot.id ? "#0f1115" : "#8a8d91"} />
                  <Text style={[styles.slotText, selectedTimeSlot === slot.id && styles.slotTextActive]}>
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* حقل: رقم الباص و السعة */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1.5 }]}>
              <Text style={styles.label}>BUS NUMBER</Text>
              <View style={[styles.inputWrapper, errors.bus_number && styles.inputError]}>
                <Bus size={18} color="#8a8d91" style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="bus_number"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Bus 101"
                      placeholderTextColor="#3a3d42"
                      value={value}
                      onChangeText={onChange}
                      editable={!loading}
                    />
                  )}
                />
              </View>
              {errors.bus_number && <Text style={styles.fieldError}>{errors.bus_number.message}</Text>}
            </View>

            <View style={{ width: 12 }} />

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>TOTAL SEATS</Text>
              <View style={[styles.inputWrapper, errors.total_seats && styles.inputError]}>
                <Users size={18} color="#8a8d91" style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="total_seats"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="40"
                      placeholderTextColor="#3a3d42"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                      editable={!loading}
                    />
                  )}
                />
              </View>
              {errors.total_seats && <Text style={styles.fieldError}>{errors.total_seats.message}</Text>}
            </View>
          </View>

          {/* زرار الإرسال */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#0f1115" />
            ) : (
              <Text style={styles.submitText}>Create Schedule</Text>
            )}
          </TouchableOpacity>

        </View>

      </ScrollView>
      
    </KeyboardAvoidingView>

    
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1115" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20,
    backgroundColor: "#1c1e26", borderBottomWidth: 1, borderBottomColor: "#2d3036",
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 60 },
  card: {
    backgroundColor: "#1c1e26", borderWidth: 1,
    borderColor: "#2d3036", borderRadius: 32, padding: 28,
  },
  cardSubtitle: { fontSize: 11, color: "#8a8d91", marginBottom: 24, textAlign: "center", fontWeight: "600", textTransform: "uppercase", letterSpacing: 2 },

  errorBox: {
    backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)", borderRadius: 12,
    padding: 12, marginBottom: 16,
  },
  errorText: { color: "#f87171", fontSize: 12, textAlign: "center" },
  
  successBox: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.1)", borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)", borderRadius: 12,
    padding: 12, marginBottom: 16,
  },
  successText: { color: "#22c55e", fontSize: 12, fontWeight: "700" },

  fieldGroup: { marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  label: { fontSize: 10, color: "#8a8d91", fontWeight: "700", letterSpacing: 1.5, marginBottom: 6, marginLeft: 4, textTransform: "uppercase" },
  
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#262a33", borderWidth: 1,
    borderColor: "#2d3036", borderRadius: 14,
  },
  inputError: { borderColor: "rgba(239,68,68,0.5)" },
  inputIcon: { marginLeft: 14 },
  input: { flex: 1, color: "#fff", fontSize: 14, paddingVertical: 14, paddingHorizontal: 10 },
  fieldError: { color: "#f87171", fontSize: 10, marginTop: 4, marginLeft: 4, fontWeight: "500" },

  slotContainer: { flexDirection: "row", gap: 8 },
  slotBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#262a33", borderWidth: 1, borderColor: "#2d3036",
    paddingVertical: 12, borderRadius: 12,
  },
  slotBtnActive: { backgroundColor: "#f7a01b", borderColor: "#f7a01b" },
  slotText: { color: "#8a8d91", fontSize: 11, fontWeight: "700" },
  slotTextActive: { color: "#0f1115", fontWeight: "900" },

  submitBtn: {
    backgroundColor: "#f7a01b", borderRadius: 16,
    paddingVertical: 16, alignItems: "center", marginTop: 12,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: "#0f1115", fontSize: 14, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },

  // Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(15,17,21,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1c1e26", borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, maxHeight: "70%",
    borderTopWidth: 1, borderColor: "#2d3036",
  },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#fff", marginBottom: 16, textAlign: "center" },
  modalOption: {
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#2d3036",
  },
  modalOptionText: { fontSize: 14, color: "#fff", fontWeight: "600" },
  modalCloseBtn: {
    marginTop: 16, paddingVertical: 14, alignItems: "center",
    backgroundColor: "#262a33", borderRadius: 12,
  },
  modalCloseText: { color: "#8a8d91", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
});