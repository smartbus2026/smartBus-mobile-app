import { useRouter } from 'expo-router';
import { Bus, Calendar, CheckCircle, Eye, EyeOff, Lock, Moon, Save, Shield, Sun, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';

const SectionCard: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode; colors: any }> = ({ icon, title, subtitle, children, colors }) => (
  <View style={{ borderRadius: 24, borderWidth: 1, padding: 24, marginBottom: 16, backgroundColor: colors.card, borderColor: colors.border }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
      <View style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33` }}>
        {icon}
      </View>
      <View>
        <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>{title}</Text>
        <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, marginTop: 2 }}>{subtitle}</Text>
      </View>
    </View>
    {children}
  </View>
);

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; keyboardType?: any; secureTextEntry?: boolean; rightIcon?: React.ReactNode; colors: any; dot?: string }> = ({ label, value, onChange, placeholder, keyboardType, secureTextEntry, rightIcon, colors, dot }) => (
  <View style={{ marginBottom: 16 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      {dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dot }} />}
      <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon }}>{label}</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52, backgroundColor: colors.background, borderColor: colors.border }}>
      <TextInput style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text }} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.icon} keyboardType={keyboardType} secureTextEntry={secureTextEntry} autoCapitalize="none" />
      {rightIcon}
    </View>
  </View>
);

const SaveBtn: React.FC<{ onPress: () => void; loading: boolean; label: string; colors: any }> = ({ onPress, loading, label, colors }) => (
  <TouchableOpacity onPress={onPress} disabled={loading} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 8, backgroundColor: colors.tint, opacity: loading ? 0.6 : 1 }}>
    {loading
      ? <ActivityIndicator size="small" color={colors.background} />
      : <><Save size={16} color={colors.background} /><Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.background }}>{label}</Text></>
    }
  </TouchableOpacity>
);

export default function AdminSettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const colors = Colors[theme];

  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [savingQuota, setSavingQuota] = useState(false);
  const [savingPass, setSavingPass]   = useState(false);
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [bookingWindow, setBookingWindow] = useState({ start: '08:00', end: '14:00' });
  const [quotaSettings, setQuotaSettings] = useState({ defaultShiftLimit: '7', monthlyBusQuota: '280' });
  const [passForm, setPassForm]       = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [res, quotaRes] = await Promise.all([api.get('/settings'), api.get('/admin/settings')]);
        const settings = res.data?.data?.settings;
        if (settings) {
          const fmt = (h: number, m: number) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          setBookingWindow({ start: fmt(settings.booking_open_hour, settings.booking_open_minute), end: fmt(settings.booking_close_hour, settings.booking_close_minute) });
        }
        const sys = quotaRes.data?.data?.settings;
        if (sys) setQuotaSettings({ defaultShiftLimit: String(sys.defaultShiftLimit ?? 7), monthlyBusQuota: String(sys.monthlyBusQuota ?? 280) });
      } catch { showToast(t('failed_load_admin_settings'), 'error'); }
      finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (toast) { const timer = setTimeout(() => setToast(null), 3000); return () => clearTimeout(timer); }
  }, [toast]);

  const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type });

  const handleUpdateBookingWindow = async () => {
    setSaving(true);
    try {
      const [openH, openM]   = bookingWindow.start.split(':').map(Number);
      const [closeH, closeM] = bookingWindow.end.split(':').map(Number);
      await api.put('/settings', { booking_open_hour: openH, booking_open_minute: openM, booking_close_hour: closeH, booking_close_minute: closeM });
      showToast(t('booking_window_updated'), 'success');
    } catch { showToast(t('failed_update_booking_window'), 'error'); }
    finally { setSaving(false); }
  };

  const handleUpdateQuota = async () => {
    setSavingQuota(true);
    try {
      await api.put('/admin/settings', { defaultShiftLimit: Number(quotaSettings.defaultShiftLimit), monthlyBusQuota: Number(quotaSettings.monthlyBusQuota) });
      showToast(t('fleet_quota_updated'), 'success');
    } catch (err: any) { showToast(err?.response?.data?.message || t('update_failed'), 'error'); }
    finally { setSavingQuota(false); }
  };

  const handleUpdatePassword = async () => {
    if (passForm.newPass !== passForm.confirm) { showToast(t('passwords_mismatch'), 'error'); return; }
    if (passForm.newPass.length < 6) { showToast(t('error'), 'error'); return; }
    setSavingPass(true);
    try {
      const profileRes = await api.get('/users/profile');
      await api.put(`/users/${profileRes.data._id}`, { password: passForm.newPass });
      showToast(t('password_updated'), 'success');
      setPassForm({ current: '', newPass: '', confirm: '' });
    } catch { showToast(t('failed_update_password'), 'error'); }
    finally { setSavingPass(false); }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar title={t('settings')} showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>{t('loading_system_config')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title={t('settings')} showBack />

      {toast && (
        <View style={{ position: 'absolute', top: 80, alignSelf: 'center', zIndex: 50, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, backgroundColor: toast.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', borderColor: toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }}>
          {toast.type === 'success' ? <CheckCircle size={14} color="#22c55e" /> : <XCircle size={14} color="#ef4444" />}
          <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: toast.type === 'success' ? '#22c55e' : '#ef4444' }}>{toast.msg}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, color: colors.text }}>{t('control_center')}</Text>
          <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginTop: 2 }}>{t('system_security_config')}</Text>
        </View>

        {/* Booking Window */}
        <SectionCard icon={<Calendar size={22} color={colors.tint} />} title={t('system_settings')} subtitle={t('global_booking_window')} colors={colors}>
          <Field label={t('registration_start')} dot="#22c55e" value={bookingWindow.start} onChange={v => setBookingWindow({ ...bookingWindow, start: v })} placeholder="08:00" keyboardType="numbers-and-punctuation" colors={colors} />
          <Field label={t('registration_end')} dot="#ef4444" value={bookingWindow.end} onChange={v => setBookingWindow({ ...bookingWindow, end: v })} placeholder="14:00" keyboardType="numbers-and-punctuation" colors={colors} />
          <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, backgroundColor: `${colors.tint}0A`, borderColor: `${colors.tint}33` }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.icon, lineHeight: 18 }}>
              <Text style={{ fontWeight: '900', color: colors.text }}>{t('note_label')} </Text>
              {t('booking_window_note')}
            </Text>
          </View>
          <SaveBtn onPress={handleUpdateBookingWindow} loading={saving} label={t('update_booking_window')} colors={colors} />
        </SectionCard>

        {/* Fleet Quota */}
        <SectionCard icon={<Bus size={22} color={colors.tint} />} title={t('fleet_quota')} subtitle={t('monthly_renewal_shift')} colors={colors}>
          <Field label={t('max_buses_per_shift')} value={quotaSettings.defaultShiftLimit} onChange={v => setQuotaSettings({ ...quotaSettings, defaultShiftLimit: v })} placeholder="7" keyboardType="numeric" colors={colors} />
          <Field label={t('total_monthly_bus_quota')} value={quotaSettings.monthlyBusQuota} onChange={v => setQuotaSettings({ ...quotaSettings, monthlyBusQuota: v })} placeholder="280" keyboardType="numeric" colors={colors} />
          <SaveBtn onPress={handleUpdateQuota} loading={savingQuota} label={t('update_fleet_quota')} colors={colors} />
        </SectionCard>

        {/* Security */}
        <SectionCard icon={<Shield size={22} color={colors.icon} />} title={t('security')} subtitle={t('admin_authentication')} colors={colors}>
          <Field label={t('current_password')} value={passForm.current} onChange={v => setPassForm({ ...passForm, current: v })} placeholder="••••••••" secureTextEntry={!showCurrent} colors={colors}
            rightIcon={<TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>{showCurrent ? <Eye size={16} color={colors.icon} /> : <EyeOff size={16} color={colors.icon} />}</TouchableOpacity>}
          />
          <Field label={t('new_password')} value={passForm.newPass} onChange={v => setPassForm({ ...passForm, newPass: v })} placeholder="••••••••" secureTextEntry={!showNew} colors={colors}
            rightIcon={<TouchableOpacity onPress={() => setShowNew(!showNew)}>{showNew ? <Eye size={16} color={colors.icon} /> : <EyeOff size={16} color={colors.icon} />}</TouchableOpacity>}
          />
          <Field label={t('confirm_password')} value={passForm.confirm} onChange={v => setPassForm({ ...passForm, confirm: v })} placeholder="••••••••" secureTextEntry={!showConfirm} colors={colors}
            rightIcon={<TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>{showConfirm ? <Eye size={16} color={colors.icon} /> : <EyeOff size={16} color={colors.icon} />}</TouchableOpacity>}
          />
          <TouchableOpacity onPress={handleUpdatePassword} disabled={savingPass} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 8, borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border, opacity: savingPass ? 0.6 : 1 }}>
            {savingPass ? <ActivityIndicator size="small" color={colors.tint} /> : <><Lock size={16} color={colors.text} /><Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.text }}>{t('change_password_btn')}</Text></>}
          </TouchableOpacity>
        </SectionCard>

        {/* Theme */}
        <SectionCard icon={theme === 'dark' ? <Moon size={22} color={colors.icon} /> : <Sun size={22} color={colors.icon} />} title={t('preferences')} subtitle={t('interface_appearance')} colors={colors}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 14, borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>{theme === 'dark' ? t('settings') : t('settings')}</Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.icon, marginTop: 2 }}>{t('theme_toggle_desc')}</Text>
            </View>
            <Switch trackColor={{ false: colors.border, true: colors.tint }} thumbColor="#fff" ios_backgroundColor={colors.border} onValueChange={toggleTheme} value={theme === 'dark'} />
          </View>
        </SectionCard>
      </ScrollView>
    </View>
  );
}