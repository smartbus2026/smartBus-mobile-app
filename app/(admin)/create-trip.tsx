import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Modal
} from "react-native";
import { router } from "expo-router";
import { Bus, Users, Clock, CheckCircle, Plus, ChevronDown, Save } from "lucide-react-native";
import api from "../../src/services/api";
import { useThemeColor } from "../../constants/theme";
import TopBar from "../../src/components/TopBar";

interface BookingSettings {
  booking_open_hour: number;
  booking_open_minute: number;
  booking_close_hour: number;
  booking_close_minute: number;
}

export default function CreateBusScreen() {
  const colors = useThemeColor();
  
  // ── States ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  const [busForm, setBusForm] = useState({
    busCode: '',
    driverName: '',
    capacity: '45'
  });

  const [settings, setSettings] = useState<BookingSettings>({
    booking_open_hour: 20,
    booking_open_minute: 0,
    booking_close_hour: 23,
    booking_close_minute: 0,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalState, setModalState] = useState({ type: "success", message: "" });

  // Custom Dropdown State for Times
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerData, setPickerData] = useState<{ options: (number | string)[], type: string }>({ options: [], type: '' });

  // ── Fetch Settings ──
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.data?.settings) {
          setSettings(res.data.data.settings);
        }
      } catch (err) {
        console.log("Failed to fetch settings", err);
      }
    };
    fetchSettings();
  }, []);

  // ── Handlers ──
  const handleCreateBus = async () => {
    if (!busForm.busCode || !busForm.driverName || !busForm.capacity) {
      setModalState({ type: "error", message: "Please fill all bus fields." });
      setModalVisible(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/buses', {
        ...busForm,
        capacity: parseInt(busForm.capacity) || 45
      });
      setModalState({ type: "success", message: "Bus created successfully!" });
      setBusForm({ busCode: '', driverName: '', capacity: '45' });
      setModalVisible(true);
    } catch (err: any) {
      setModalState({ type: "error", message: err.response?.data?.message || "Failed to create bus." });
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await api.put('/settings', settings);
      setModalState({ type: "success", message: "Booking window updated successfully!" });
      setModalVisible(true);
    } catch (err: any) {
      setModalState({ type: "error", message: err.response?.data?.message || "Failed to save settings." });
      setModalVisible(true);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ── Helpers for 12h/24h format ──
  const formatHour12 = (h24: number) => {
    if (h24 === 0) return 12;
    if (h24 > 12) return h24 - 12;
    return h24;
  };

  const getAmPm = (h24: number) => h24 >= 12 ? "PM" : "AM";

  const updateHour = (type: 'open' | 'close', value: number | string) => {
    if (typeof value === 'string') { // AM or PM
      const isPM = value === 'PM';
      setSettings(prev => {
        const currentH = type === 'open' ? prev.booking_open_hour : prev.booking_close_hour;
        const h12 = currentH % 12;
        const newH = isPM ? (h12 === 0 ? 12 : h12 + 12) : (h12 === 0 ? 0 : h12);
        return { ...prev, [type === 'open' ? 'booking_open_hour' : 'booking_close_hour']: newH };
      });
    } else { // Hour number (1-12)
      setSettings(prev => {
        const currentH = type === 'open' ? prev.booking_open_hour : prev.booking_close_hour;
        const isPM = currentH >= 12;
        const newH = isPM ? (value === 12 ? 12 : value + 12) : (value === 12 ? 0 : value);
        return { ...prev, [type === 'open' ? 'booking_open_hour' : 'booking_close_hour']: newH };
      });
    }
    setPickerVisible(false);
  };

  const updateMinute = (type: 'open' | 'close', value: number) => {
    setSettings(prev => ({ ...prev, [type === 'open' ? 'booking_open_minute' : 'booking_close_minute']: value as number }));
    setPickerVisible(false);
  };

  const openPicker = (type: string, options: (number | string)[]) => {
    setPickerData({ type, options });
    setPickerVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Create Trip" showMenu showSettings onSettingsPress={() => router.push('/(admin)/settings' as any)} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          {/* ── 1. Create Bus Card ── */}
          <View style={{ borderWidth: 1, borderRadius: 24, padding: 20, backgroundColor: colors.card, borderColor: colors.border, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <View style={{ backgroundColor: `${colors.tint}1A`, padding: 10, borderRadius: 14 }}>
                <Plus size={20} color={colors.tint} />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>Create Bus</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.icon }}>ADD NEW VEHICLES TO FLEET</Text>
              </View>
            </View>

            {/* Bus Fields */}
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, color: colors.icon }}>Bus Number / Plate</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border }}>
                  <Bus size={18} color={colors.icon} />
                  <TextInput
                    style={{ flex: 1, fontSize: 13, fontWeight: '700', paddingVertical: 14, paddingHorizontal: 10, color: colors.text }}
                    placeholder="e.g. Bus 101"
                    placeholderTextColor={colors.icon}
                    value={busForm.busCode}
                    onChangeText={(t) => setBusForm(prev => ({ ...prev, busCode: t }))}
                  />
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, color: colors.icon }}>Driver Name</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border }}>
                  <Users size={18} color={colors.icon} />
                  <TextInput
                    style={{ flex: 1, fontSize: 13, fontWeight: '700', paddingVertical: 14, paddingHorizontal: 10, color: colors.text }}
                    placeholder="e.g. Ahmed Ali"
                    placeholderTextColor={colors.icon}
                    value={busForm.driverName}
                    onChangeText={(t) => setBusForm(prev => ({ ...prev, driverName: t }))}
                  />
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, color: colors.icon }}>Total Seats Capacity</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border }}>
                  <Users size={18} color={colors.icon} />
                  <TextInput
                    style={{ flex: 1, fontSize: 13, fontWeight: '700', paddingVertical: 14, paddingHorizontal: 10, color: colors.text }}
                    placeholder="45"
                    keyboardType="numeric"
                    placeholderTextColor={colors.icon}
                    value={busForm.capacity}
                    onChangeText={(t) => setBusForm(prev => ({ ...prev, capacity: t }))}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleCreateBus}
                disabled={isSubmitting}
                style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 10, backgroundColor: colors.tint, opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? <ActivityIndicator color="#000" /> : <Text style={{ fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: '#000' }}>Create Bus</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── 2. Booking Window Settings Card ── */}
          <View style={{ borderWidth: 1, borderRadius: 24, padding: 20, backgroundColor: colors.card, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <View style={{ backgroundColor: `${colors.tint}1A`, padding: 10, borderRadius: 14 }}>
                <Clock size={20} color={colors.tint} />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>Booking Window</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.icon }}>CONTROL REGISTRATION TIMES</Text>
              </View>
            </View>

            {/* Time Pickers */}
            {(['open', 'close'] as const).map((type) => (
              <View key={type} style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, color: colors.icon }}>
                  Booking {type === 'open' ? 'Opens At' : 'Closes At'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  
                  {/* Hour */}
                  <TouchableOpacity onPress={() => openPicker(`${type}Hour`, [12,1,2,3,4,5,6,7,8,9,10,11])}
                    style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, padding: 14, borderRadius: 14 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{String(formatHour12(type === 'open' ? settings.booking_open_hour : settings.booking_close_hour)).padStart(2, '0')}</Text>
                    <ChevronDown size={14} color={colors.icon} />
                  </TouchableOpacity>

                  {/* Minute */}
                  <TouchableOpacity onPress={() => openPicker(`${type}Minute`, [0, 15, 30, 45])}
                    style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, padding: 14, borderRadius: 14 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{String(type === 'open' ? settings.booking_open_minute : settings.booking_close_minute).padStart(2, '0')}</Text>
                    <ChevronDown size={14} color={colors.icon} />
                  </TouchableOpacity>

                  {/* AM/PM */}
                  <TouchableOpacity onPress={() => openPicker(`${type}Period`, ['AM', 'PM'])}
                    style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.tint, padding: 14, borderRadius: 14 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: colors.tint }}>{getAmPm(type === 'open' ? settings.booking_open_hour : settings.booking_close_hour)}</Text>
                    <ChevronDown size={14} color={colors.tint} />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 10, fontWeight: '800', marginTop: 8, color: type === 'open' ? (colors.success || '#22c55e') : '#ef4444' }}>
                  {type === 'open' ? 'OPENS:' : 'CLOSES:'} {formatHour12(type === 'open' ? settings.booking_open_hour : settings.booking_close_hour)}:{String(type === 'open' ? settings.booking_open_minute : settings.booking_close_minute).padStart(2, '0')} {getAmPm(type === 'open' ? settings.booking_open_hour : settings.booking_close_hour)}
                </Text>
              </View>
            ))}

            <TouchableOpacity
              onPress={handleSaveSettings}
              disabled={isSavingSettings}
              style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4, flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.tint, opacity: isSavingSettings ? 0.7 : 1 }}
            >
              {isSavingSettings ? <ActivityIndicator color={colors.tint} /> : (
                <>
                  <Save size={16} color={colors.tint} />
                  <Text style={{ fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: colors.tint }}>Save Settings</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Success/Error Modal (Mimics Web) ── */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "rgba(0,0,0,0.6)", padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 320, backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2,
              backgroundColor: modalState.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              borderColor: modalState.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'
            }}>
              {modalState.type === 'success' ? <CheckCircle size={32} color="#22c55e" /> : <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#ef4444' }}>!</Text>}
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', textTransform: 'uppercase', color: colors.text, marginBottom: 8 }}>
              {modalState.type === 'success' ? 'Success!' : 'Action Failed'}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.icon, textAlign: 'center', marginBottom: 24 }}>{modalState.message}</Text>
            
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: colors.text }}>Close</Text>
              </TouchableOpacity>
              {modalState.type === 'success' && (
                <TouchableOpacity onPress={() => { setModalVisible(false); router.push('/(admin)/dashboard' as any); }} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.tint, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: '#000' }}>Dashboard</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Custom Dropdown Picker Modal ── */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '50%' }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', color: colors.icon }}>Select Option</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {pickerData.options.map((opt, i) => (
                <TouchableOpacity key={i} style={{ padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' }}
                  onPress={() => {
                    const isOpen = pickerData.type.startsWith('open');
                    if (pickerData.type.includes('Hour') || pickerData.type.includes('Period')) updateHour(isOpen ? 'open' : 'close', opt);
                    if (pickerData.type.includes('Minute')) updateMinute(isOpen ? 'open' : 'close', opt as number);
                  }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>{String(opt).padStart(2, '0')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setPickerVisible(false)} style={{ padding: 16, alignItems: 'center', marginTop: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#ef4444', textTransform: 'uppercase' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}