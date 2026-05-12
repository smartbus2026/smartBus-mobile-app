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
import { MapPin, Bus, Calendar, Users, ArrowLeft, CheckCircle, Clock, ChevronDown } from "lucide-react-native";
import api from "../../src/services/api";
import { useThemeColor } from "../../constants/theme"; // 🟢 استدعاء الهوك

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
  const colors = useThemeColor(); // 🟢 سحب الألوان
  const [loading, setLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  
  // للـ Dropdown Custom Modal
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
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View 
        className="flex-row items-center justify-between px-5 pt-[60px] pb-5 border-b"
        style={{ backgroundColor: colors.card, borderBottomColor: colors.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2" activeOpacity={0.7}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-black tracking-wide" style={{ color: colors.text }}>Create Trip</Text>
        <View className="w-10" /> 
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        <View 
          className="rounded-[32px] p-7 border shadow-sm"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text className="text-[11px] font-semibold text-center uppercase tracking-widest mb-6" style={{ color: colors.icon }}>
            Deploy new fleet schedules
          </Text>

          {/* Alert Messages */}
          {serverError && (
            <View 
              className="rounded-xl p-3 mb-4 border"
              style={{ backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.2)" }}
            >
              <Text className="text-xs text-center" style={{ color: colors.error || "#ef4444" }}>{serverError}</Text>
            </View>
          )}
          {success && (
            <View 
              className="flex-row justify-center items-center rounded-xl p-3 mb-4 border"
              style={{ backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.2)" }}
            >
              <CheckCircle size={16} color={colors.success || "#22c55e"} style={{ marginRight: 6 }} />
              <Text className="text-xs font-bold" style={{ color: colors.success || "#22c55e" }}>Trip Created Successfully!</Text>
            </View>
          )}

          {/* Field: Route ID */}
          <View className="mb-4">
            <Text className="text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1" style={{ color: colors.icon }}>SELECT ROUTE</Text>
            <TouchableOpacity 
              className="flex-row items-center rounded-2xl px-3 py-3.5 border"
              style={{ 
                backgroundColor: colors.background, 
                borderColor: errors.route_id ? (colors.error || "#ef4444") : colors.border 
              }}
              onPress={() => setRouteModalVisible(true)}
              disabled={routesLoading}
              activeOpacity={0.7}
            >
              <MapPin size={18} color={colors.icon} style={{ marginLeft: 4 }} />
              <Text className="flex-1 text-[13px] font-bold ml-2.5" style={{ color: selectedRouteId ? colors.text : colors.icon }}>
                {routesLoading ? "Loading routes..." : selectedRouteName}
              </Text>
              <ChevronDown size={18} color={colors.icon} style={{ marginRight: 4 }} />
            </TouchableOpacity>
            {errors.route_id && <Text className="text-[10px] font-medium mt-1 ml-1" style={{ color: colors.error || "#ef4444" }}>{errors.route_id.message}</Text>}
          </View>

          {/* Route Selection Modal */}
          <Modal
            visible={routeModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setRouteModalVisible(false)}
          >
            <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
              <View className="rounded-t-[32px] max-h-[70%] border-t" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                <View className="p-6 border-b" style={{ borderBottomColor: colors.border }}>
                  <Text className="text-lg font-black text-center" style={{ color: colors.text }}>Select Route</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {routes.map((r) => (
                    <TouchableOpacity
                      key={r._id}
                      className="py-4 px-6 border-b"
                      style={{ borderBottomColor: colors.border }}
                      onPress={() => {
                        setValue("route_id", r._id, { shouldValidate: true });
                        setRouteModalVisible(false);
                      }}
                    >
                      <Text className="textsm font-bold" style={{ color: colors.text }}>{r.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View className="p-6 pb-8">
                  <TouchableOpacity 
                    className="py-3.5 items-center rounded-xl"
                    style={{ backgroundColor: colors.background }}
                    onPress={() => setRouteModalVisible(false)}
                  >
                    <Text className="text-xs font-black tracking-widest" style={{ color: colors.icon }}>CANCEL</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Field: Trip Date */}
          <View className="mb-4">
            <Text className="text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1" style={{ color: colors.icon }}>TRIP DATE (YYYY-MM-DD)</Text>
            <View 
              className="flex-row items-center rounded-2xl px-3 border"
              style={{ 
                backgroundColor: colors.background, 
                borderColor: errors.departure_time ? (colors.error || "#ef4444") : colors.border 
              }}
            >
              <Calendar size={18} color={colors.icon} style={{ marginLeft: 4 }} />
              <Controller
                control={control}
                name="departure_time"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="flex-1 text-[13px] font-bold p-4"
                    style={{ color: colors.text }}
                    placeholder="e.g. 2026-05-12"
                    placeholderTextColor={colors.icon}
                    value={value}
                    onChangeText={onChange}
                    editable={!loading}
                  />
                )}
              />
            </View>
            {errors.departure_time && <Text className="text-[10px] font-medium mt-1 ml-1" style={{ color: colors.error || "#ef4444" }}>{errors.departure_time.message}</Text>}
          </View>

          {/* Field: Time Slot */}
          <View className="mb-4">
            <Text className="text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1" style={{ color: colors.icon }}>TIME SLOT</Text>
            <View className="flex-row gap-2">
              {[
                { id: "morning", label: "Morning" },
                { id: "return_1530", label: "03:30 PM" },
                { id: "return_1900", label: "07:00 PM" }
              ].map((slot) => {
                const isActive = selectedTimeSlot === slot.id;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    className="flex-1 flex-row items-center justify-center gap-1.5 border py-3.5 rounded-xl"
                    style={{ 
                      backgroundColor: isActive ? `${colors.tint}1A` : colors.background, 
                      borderColor: isActive ? colors.tint : colors.border 
                    }}
                    onPress={() => setValue("time_slot", slot.id as any)}
                    activeOpacity={0.7}
                  >
                    <Clock size={12} color={isActive ? colors.tint : colors.icon} />
                    <Text className="text-[10px] font-black tracking-widest" style={{ color: isActive ? colors.tint : colors.icon }}>
                      {slot.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Fields: Bus Number & Total Seats */}
          <View className="flex-row gap-3 mb-2">
            <View className="flex-[1.5]">
              <Text className="text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1" style={{ color: colors.icon }}>BUS NUMBER</Text>
              <View 
                className="flex-row items-center rounded-2xl px-3 border"
                style={{ 
                  backgroundColor: colors.background, 
                  borderColor: errors.bus_number ? (colors.error || "#ef4444") : colors.border 
                }}
              >
                <Bus size={18} color={colors.icon} style={{ marginLeft: 4 }} />
                <Controller
                  control={control}
                  name="bus_number"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="flex-1 text-[13px] font-bold p-4"
                      style={{ color: colors.text }}
                      placeholder="e.g. Bus 101"
                      placeholderTextColor={colors.icon}
                      value={value}
                      onChangeText={onChange}
                      editable={!loading}
                    />
                  )}
                />
              </View>
              {errors.bus_number && <Text className="text-[10px] font-medium mt-1 ml-1" style={{ color: colors.error || "#ef4444" }}>{errors.bus_number.message}</Text>}
            </View>

            <View className="flex-1">
              <Text className="text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1" style={{ color: colors.icon }}>TOTAL SEATS</Text>
              <View 
                className="flex-row items-center rounded-2xl px-3 border"
                style={{ 
                  backgroundColor: colors.background, 
                  borderColor: errors.total_seats ? (colors.error || "#ef4444") : colors.border 
                }}
              >
                <Users size={18} color={colors.icon} style={{ marginLeft: 4 }} />
                <Controller
                  control={control}
                  name="total_seats"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="flex-1 text-[13px] font-bold p-4"
                      style={{ color: colors.text }}
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
              {errors.total_seats && <Text className="text-[10px] font-medium mt-1 ml-1" style={{ color: colors.error || "#ef4444" }}>{errors.total_seats.message}</Text>}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className="rounded-2xl py-[18px] items-center mt-5"
            style={{ backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 }}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-[13px] font-black tracking-widest uppercase" style={{ color: colors.background }}>
                Create Schedule
              </Text>
            )}
          </TouchableOpacity>

        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}