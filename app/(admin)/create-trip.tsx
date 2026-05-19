import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Modal
} from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Bus, Calendar, Users, CheckCircle, Clock, ChevronDown } from "lucide-react-native";
import api from "../../src/services/api";
import { useThemeColor } from "../../constants/theme";
import TopBar from "../../src/components/TopBar";

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
  const colors = useThemeColor();
  const [loading, setLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    defaultValues: { time_slot: "morning" }
  });

  const selectedTimeSlot = watch("time_slot");
  const selectedRouteId  = watch("route_id");
  const selectedRouteName = routes.find(r => r._id === selectedRouteId)?.name || "Select a route";

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/routes");
        setRoutes(res.data.data || res.data || []);
      } catch (err) {
        console.error("Failed to fetch routes", err);
      } finally {
        setRoutesLoading(false);
      }
    })();
  }, []);

  const onSubmit = async (data: TripForm) => {
    setLoading(true);
    setServerError(null);
    setSuccess(false);
    try {
      await api.post("/trips", {
        route_id:     data.route_id,
        departure_time: data.departure_time,
        time_slot:    data.time_slot,
        bus_number:   data.bus_number,
        total_seats:  Number(data.total_seats),
      });
      setSuccess(true);
      reset();
      setTimeout(() => router.back(), 2000);
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Failed to create trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Top Bar ── */}
   <TopBar
  title="Create Trip"
  showMenu
  showSettings
  onSettingsPress={() => router.push('/(admin)/settings' as any)}
/>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Card ── */}
          <View style={{
            borderWidth: 1, borderRadius: 24, padding: 18,
            backgroundColor: colors.card, borderColor: colors.border,
          }}>

            <Text style={{
              fontSize: 9, fontWeight: '700', letterSpacing: 3,
              textTransform: 'uppercase', textAlign: 'center',
              color: colors.icon, marginBottom: 20,
            }}>
              Deploy new fleet schedules
            </Text>

            {/* Alert Messages */}
            {serverError && (
              <View style={{
                borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1,
                backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.2)",
              }}>
                <Text style={{ fontSize: 11, textAlign: 'center', color: "#ef4444" }}>{serverError}</Text>
              </View>
            )}
            {success && (
              <View style={{
                flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1,
                backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.2)",
              }}>
                <CheckCircle size={16} color="#22c55e" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: "#22c55e" }}>Trip Created Successfully!</Text>
              </View>
            )}

            {/* ── Route ── */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, color: colors.icon }}>
                SELECT ROUTE
              </Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1,
                  backgroundColor: colors.background,
                  borderColor: errors.route_id ? "#ef4444" : colors.border,
                }}
                onPress={() => setRouteModalVisible(true)}
                disabled={routesLoading}
                activeOpacity={0.7}
              >
                <MapPin size={18} color={colors.icon} />
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', marginLeft: 10, color: selectedRouteId ? colors.text : colors.icon }}>
                  {routesLoading ? "Loading routes..." : selectedRouteName}
                </Text>
                <ChevronDown size={18} color={colors.icon} />
              </TouchableOpacity>
              {errors.route_id && (
                <Text style={{ fontSize: 10, marginTop: 4, color: "#ef4444" }}>{errors.route_id.message}</Text>
              )}
            </View>

            {/* ── Route Modal ── */}
            <Modal
              visible={routeModalVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setRouteModalVisible(false)}
            >
              <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: "rgba(0,0,0,0.7)" }}>
                <View style={{
                  borderTopLeftRadius: 32, borderTopRightRadius: 32,
                  maxHeight: '70%', borderTopWidth: 1,
                  backgroundColor: colors.card, borderColor: colors.border,
                }}>
                  <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', textAlign: 'center', color: colors.text }}>Select Route</Text>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {routes.map((r) => (
                      <TouchableOpacity
                        key={r._id}
                        style={{ paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}
                        onPress={() => { setValue("route_id", r._id, { shouldValidate: true }); setRouteModalVisible(false); }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{r.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <View style={{ padding: 20 }}>
                    <TouchableOpacity
                      style={{ paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: colors.background }}
                      onPress={() => setRouteModalVisible(false)}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 2, color: colors.icon }}>CANCEL</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* ── Date ── */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, color: colors.icon }}>
                TRIP DATE (YYYY-MM-DD)
              </Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                borderRadius: 12, paddingHorizontal: 14, borderWidth: 1,
                backgroundColor: colors.background,
                borderColor: errors.departure_time ? "#ef4444" : colors.border,
              }}>
                <Calendar size={18} color={colors.icon} />
                <Controller
                  control={control}
                  name="departure_time"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={{ flex: 1, fontSize: 13, fontWeight: '700', paddingVertical: 14, paddingHorizontal: 10, color: colors.text }}
                      placeholder="e.g. 2026-05-12"
                      placeholderTextColor={colors.icon}
                      value={value}
                      onChangeText={onChange}
                      editable={!loading}
                    />
                  )}
                />
              </View>
              {errors.departure_time && (
                <Text style={{ fontSize: 10, marginTop: 4, color: "#ef4444" }}>{errors.departure_time.message}</Text>
              )}
            </View>

            {/* ── Time Slot ── */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, color: colors.icon }}>
                TIME SLOT
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { id: "morning",     label: "Morning"  },
                  { id: "return_1530", label: "03:30 PM" },
                  { id: "return_1900", label: "07:00 PM" },
                ].map((slot) => {
                  const isActive = selectedTimeSlot === slot.id;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={{
                        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        gap: 6, borderWidth: 1, paddingVertical: 14, borderRadius: 12,
                        backgroundColor: isActive ? `${colors.tint}1A` : colors.background,
                        borderColor: isActive ? colors.tint : colors.border,
                      }}
                      onPress={() => setValue("time_slot", slot.id as any)}
                      activeOpacity={0.7}
                    >
                      <Clock size={12} color={isActive ? colors.tint : colors.icon} />
                      <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: isActive ? colors.tint : colors.icon }}>
                        {slot.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Bus Number & Seats ── */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 6 }}>

              {/* Bus Number */}
              <View style={{ flex: 1.5 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, color: colors.icon }}>
                  BUS NUMBER
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  borderRadius: 12, paddingHorizontal: 14, borderWidth: 1,
                  backgroundColor: colors.background,
                  borderColor: errors.bus_number ? "#ef4444" : colors.border,
                }}>
                  <Bus size={18} color={colors.icon} />
                  <Controller
                    control={control}
                    name="bus_number"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={{ flex: 1, fontSize: 13, fontWeight: '700', paddingVertical: 14, paddingHorizontal: 10, color: colors.text }}
                        placeholder="e.g. Bus 101"
                        placeholderTextColor={colors.icon}
                        value={value}
                        onChangeText={onChange}
                        editable={!loading}
                      />
                    )}
                  />
                </View>
                {errors.bus_number && (
                  <Text style={{ fontSize: 10, marginTop: 4, color: "#ef4444" }}>{errors.bus_number.message}</Text>
                )}
              </View>

              {/* Total Seats */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, color: colors.icon }}>
                  SEATS
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  borderRadius: 12, paddingHorizontal: 14, borderWidth: 1,
                  backgroundColor: colors.background,
                  borderColor: errors.total_seats ? "#ef4444" : colors.border,
                }}>
                  <Users size={18} color={colors.icon} />
                  <Controller
                    control={control}
                    name="total_seats"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={{ flex: 1, fontSize: 13, fontWeight: '700', paddingVertical: 14, paddingHorizontal: 10, color: colors.text }}
                        placeholder="40"
                        placeholderTextColor={colors.icon}
                        keyboardType="numeric"
                        value={value}
                        onChangeText={onChange}
                        editable={!loading}
                      />
                    )}
                  />
                </View>
                {errors.total_seats && (
                  <Text style={{ fontSize: 10, marginTop: 4, color: "#ef4444" }}>{errors.total_seats.message}</Text>
                )}
              </View>
            </View>

            {/* ── Submit ── */}
            <TouchableOpacity
              style={{
                borderRadius: 20, paddingVertical: 18, alignItems: 'center', marginTop: 20,
                backgroundColor: colors.tint, opacity: loading ? 0.7 : 1,
              }}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={{ fontSize: 13, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', color: '#000' }}>
                  Create Schedule
                </Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}