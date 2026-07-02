// app/(admin)/create-bus.tsx
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal,
  Platform, ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Bus, CheckCircle, ChevronDown, Plus, Save, Timer, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';

interface BookingSettings {
  booking_open_hour: number; booking_open_minute: number;
  booking_close_hour: number; booking_close_minute: number;
}

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  icon: React.ReactNode; title: string; subtitle: string;
  children: React.ReactNode; colors: any;
}> = ({ icon, title, subtitle, children, colors }) => (
  <View style={{
    borderRadius: 24, borderWidth: 1, padding: 24, marginBottom: 16,
    backgroundColor: colors.card, borderColor: colors.border,
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
      <View style={{
        width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
      }}>
        {icon}
      </View>
      <View>
        <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>
          {title}
        </Text>
        <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
    </View>
    {children}
  </View>
);

export default function CreateBusScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [busForm, setBusForm]                   = useState({ busCode: '', capacity: '45' });
  const [settings, setSettings]                 = useState<BookingSettings>({
    booking_open_hour: 20, booking_open_minute: 0,
    booking_close_hour: 23, booking_close_minute: 0,
  });
  const [quota, setQuota]                 = useState({ used: 0, total: 308 });
  const [modalVisible, setModalVisible]   = useState(false);
  const [modalState, setModalState]       = useState({ type: 'success', message: '' });
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerData, setPickerData]       = useState<{ options: (number | string)[]; type: string }>({ options: [], type: '' });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const settingsRes = await api.get('/settings');
        if (settingsRes.data?.data?.settings) setSettings(settingsRes.data.data.settings);
      } catch (err) { console.log('Failed to fetch settings', err); }
      try {
        const quotaRes = await api.get('/buses/quota');
        if (quotaRes.data) setQuota({ used: quotaRes.data.usedCapacity || 0, total: quotaRes.data.totalCapacity || 308 });
      } catch (err) { console.log('Failed to fetch fleet quota', err); }
    };
    fetchAllData();
  }, []);

  const quotaPercentage = Math.min((quota.used / quota.total) * 100, 100);
  const quotaColor = quotaPercentage < 70 ? (colors.success || '#10b981') : quotaPercentage < 85 ? '#f59e0b' : '#ef4444';

  const handleCreateBus = async () => {
    if (!busForm.busCode || !busForm.capacity) {
      setModalState({ type: 'error', message: t('fill_bus_fields') });
      setModalVisible(true); return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/buses', { busCode: busForm.busCode, capacity: parseInt(busForm.capacity) || 45 });
      setModalState({ type: 'success', message: t('bus_created') });
      setBusForm({ busCode: '', capacity: '45' });
      setModalVisible(true);
    } catch (err: any) {
      setModalState({ type: 'error', message: err.response?.data?.message || t('bus_create_failed') });
      setModalVisible(true);
    } finally { setIsSubmitting(false); }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await api.put('/settings', settings);
      setModalState({ type: 'success', message: t('booking_window_updated') });
      setModalVisible(true);
    } catch (err: any) {
      setModalState({ type: 'error', message: err.response?.data?.message || t('failed_save_settings') });
      setModalVisible(true);
    } finally { setIsSavingSettings(false); }
  };

  const formatHour12 = (h24: number) => { if (h24 === 0) return 12; if (h24 > 12) return h24 - 12; return h24; };
  const getAmPm = (h24: number) => h24 >= 12 ? 'PM' : 'AM';

  const updateHour = (type: 'open' | 'close', value: number | string) => {
    if (typeof value === 'string') {
      const isPM = value === 'PM';
      setSettings(prev => {
        const currentH = type === 'open' ? prev.booking_open_hour : prev.booking_close_hour;
        const h12 = currentH % 12;
        const newH = isPM ? (h12 === 0 ? 12 : h12 + 12) : (h12 === 0 ? 0 : h12);
        return { ...prev, [type === 'open' ? 'booking_open_hour' : 'booking_close_hour']: newH };
      });
    } else {
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
    setSettings(prev => ({ ...prev, [type === 'open' ? 'booking_open_minute' : 'booking_close_minute']: value }));
    setPickerVisible(false);
  };

  const openPicker = (type: string, options: (number | string)[]) => {
    setPickerData({ type, options });
    setPickerVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title={t('create_bus')} showMenu showSettings onSettingsPress={() => router.push('/(admin)/settings' as any)} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, color: colors.text }}>
              {t('fleet_management_part1')}{' '}<Text style={{ color: colors.tint }}>{t('fleet_management_part2')}</Text>
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginTop: 2 }}>
              {t('create_buses_booking_settings')}
            </Text>
          </View>

          {/* ── 1. Quota ── */}
          <SectionCard icon={<Bus size={22} color={colors.tint} />} title={t('monthly_fleet_quota')} subtitle={t('in_service_capacity')} colors={colors}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.icon }}>
                {quota.used} / {quota.total} {t('in_service')}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '900', color: quotaColor }}>
                {Math.round(quotaPercentage)}%
              </Text>
            </View>
            <View style={{ height: 12, backgroundColor: `${colors.text}10`, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
              <View style={{ height: '100%', width: `${quotaPercentage}%`, backgroundColor: quotaColor, borderRadius: 6 }} />
            </View>
          </SectionCard>

          {/* ── 2. Create Bus ── */}
          <SectionCard icon={<Plus size={22} color={colors.tint} />} title={t('create_bus')} subtitle={t('add_vehicles_fleet')} colors={colors}>
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 8 }}>
                  {t('bus_number_plate')}
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, height: 52,
                  backgroundColor: colors.background, borderColor: colors.border,
                }}>
                  <Bus size={16} color={colors.icon} />
                  <TextInput
                    style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text }}
                    placeholder={t('bus_placeholder')}
                    placeholderTextColor={colors.icon}
                    value={busForm.busCode}
                    onChangeText={v => setBusForm(prev => ({ ...prev, busCode: v }))}
                  />
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 8 }}>
                  {t('total_seats_capacity')}
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, height: 52,
                  backgroundColor: colors.background, borderColor: colors.border,
                }}>
                  <Users size={16} color={colors.icon} />
                  <TextInput
                    style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text }}
                    placeholder="45"
                    keyboardType="numeric"
                    placeholderTextColor={colors.icon}
                    value={busForm.capacity}
                    onChangeText={v => setBusForm(prev => ({ ...prev, capacity: v }))}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleCreateBus} disabled={isSubmitting} activeOpacity={0.85}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  paddingVertical: 14, borderRadius: 14, marginTop: 8,
                  backgroundColor: colors.tint, opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting
                  ? <ActivityIndicator color="#000" />
                  : <><Plus size={16} color="#000" /><Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#000' }}>{t('create_bus_btn')}</Text></>
                }
              </TouchableOpacity>
            </View>
          </SectionCard>

          {/* ── 3. Booking Window ── */}
          <SectionCard icon={<Timer size={22} color={colors.tint} />} title={t('booking_window')} subtitle={t('control_registration_times')} colors={colors}>
            {(['open', 'close'] as const).map(type => (
              <View key={type} style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 10 }}>
                  {type === 'open' ? t('booking_opens_at') : t('booking_closes_at')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => openPicker(`${type}Hour`, [12,1,2,3,4,5,6,7,8,9,10,11])}
                    style={{
                      flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
                      backgroundColor: colors.background, borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                      {String(formatHour12(type === 'open' ? settings.booking_open_hour : settings.booking_close_hour)).padStart(2, '0')}
                    </Text>
                    <ChevronDown size={14} color={colors.icon} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openPicker(`${type}Minute`, [0, 15, 30, 45])}
                    style={{
                      flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
                      backgroundColor: colors.background, borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                      {String(type === 'open' ? settings.booking_open_minute : settings.booking_close_minute).padStart(2, '0')}
                    </Text>
                    <ChevronDown size={14} color={colors.icon} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openPicker(`${type}Period`, ['AM', 'PM'])}
                    style={{
                      flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
                      backgroundColor: colors.background, borderColor: colors.tint,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '900', color: colors.tint }}>
                      {getAmPm(type === 'open' ? settings.booking_open_hour : settings.booking_close_hour)}
                    </Text>
                    <ChevronDown size={14} color={colors.tint} />
                  </TouchableOpacity>
                </View>
                <Text style={{
                  fontSize: 10, fontWeight: '800', marginTop: 10, letterSpacing: 1,
                  color: type === 'open' ? (colors.success || '#10b981') : '#ef4444',
                }}>
                  {type === 'open' ? t('opens_label') : t('closes_label')}{' '}
                  {formatHour12(type === 'open' ? settings.booking_open_hour : settings.booking_close_hour)}:
                  {String(type === 'open' ? settings.booking_open_minute : settings.booking_close_minute).padStart(2, '0')}{' '}
                  {getAmPm(type === 'open' ? settings.booking_open_hour : settings.booking_close_hour)}
                </Text>
              </View>
            ))}

            <TouchableOpacity
              onPress={handleSaveSettings} disabled={isSavingSettings} activeOpacity={0.85}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                paddingVertical: 14, borderRadius: 14, borderWidth: 1,
                backgroundColor: colors.background, borderColor: colors.tint,
                opacity: isSavingSettings ? 0.7 : 1,
              }}
            >
              {isSavingSettings
                ? <ActivityIndicator color={colors.tint} />
                : <><Save size={16} color={colors.tint} /><Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.tint }}>{t('save_settings')}</Text></>
              }
            </TouchableOpacity>
          </SectionCard>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Success/Error Modal ── */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 }}>
          <View style={{
            width: '100%', maxWidth: 320, borderRadius: 24, padding: 24,
            alignItems: 'center', borderWidth: 1,
            backgroundColor: colors.card, borderColor: colors.border,
          }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1,
              backgroundColor: modalState.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              borderColor: modalState.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
            }}>
              {modalState.type === 'success'
                ? <CheckCircle size={32} color="#10b981" />
                : <Text style={{ fontSize: 32, fontWeight: '900', color: '#ef4444' }}>!</Text>
              }
            </View>
            <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text, marginBottom: 8 }}>
              {modalState.type === 'success' ? t('success_exclamation') : t('action_failed')}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.icon, textAlign: 'center', marginBottom: 24 }}>
              {modalState.message}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border }}
              >
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', color: colors.text }}>{t('close')}</Text>
              </TouchableOpacity>
              {modalState.type === 'success' && (
                <TouchableOpacity
                  onPress={() => { setModalVisible(false); router.push('/(admin)/dashboard' as any); }}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.tint }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', color: '#000' }}>{t('dashboard')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Picker Modal ── */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '50%' }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>
                {t('select_option')}
              </Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {pickerData.options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={{ padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' }}
                  onPress={() => {
                    const isOpen = pickerData.type.startsWith('open');
                    if (pickerData.type.includes('Hour') || pickerData.type.includes('Period')) updateHour(isOpen ? 'open' : 'close', opt);
                    if (pickerData.type.includes('Minute')) updateMinute(isOpen ? 'open' : 'close', opt as number);
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>{String(opt).padStart(2, '0')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setPickerVisible(false)} style={{ padding: 16, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#ef4444' }}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}