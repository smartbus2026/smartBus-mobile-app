// app/(driver)/settings.tsx
import { useRouter } from 'expo-router';
import {
  Bus, Eye, EyeOff, Lock, Moon, Save, Sun, User, XCircle, CheckCircle,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, Switch,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';

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

// ─── Field ────────────────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; secureTextEntry?: boolean;
  rightIcon?: React.ReactNode; colors: any; editable?: boolean;
}> = ({ label, value, onChange, placeholder, secureTextEntry, rightIcon, colors, editable = true }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 8 }}>
      {label}
    </Text>
    <View style={{
      flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14,
      paddingHorizontal: 16, height: 52,
      backgroundColor: editable ? colors.background : `${colors.border}33`,
      borderColor: colors.border,
    }}>
      <TextInput
        style={{ flex: 1, fontSize: 14, fontWeight: '700', color: editable ? colors.text : colors.icon }}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.icon}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        editable={editable}
      />
      {rightIcon}
    </View>
  </View>
);

// ─── Save Button ──────────────────────────────────────────────────────────────
const SaveBtn: React.FC<{
  onPress: () => void; loading: boolean; label: string; colors: any;
}> = ({ onPress, loading, label, colors }) => (
  <TouchableOpacity
    onPress={onPress} disabled={loading}
    style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      paddingVertical: 14, borderRadius: 14, marginTop: 8,
      backgroundColor: colors.tint, opacity: loading ? 0.6 : 1,
    }}
  >
    {loading
      ? <ActivityIndicator size="small" color={colors.background} />
      : <>
          <Save size={16} color={colors.background} />
          <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.background }}>
            {label}
          </Text>
        </>
    }
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DriverSettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();

  const [loading, setLoading]           = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass]       = useState(false);
  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Profile
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', licenseNumber: '' });

  // Password
  const [passForm, setPassForm]       = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Fetch Profile ─────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/users/profile')
      .then(res => {
        const d = res.data;
        setProfile({
          name:          d.name          ?? '',
          email:         d.email         ?? '',
          phone:         d.phone         ?? '',
          licenseNumber: d.licenseNumber ?? '',
        });
      })
      .catch(() => showToast(t('failed_load_profile'), 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type });

  // ── Save Profile ──────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const profileRes = await api.get('/users/profile');
      const id = profileRes.data._id;
      await api.put(`/users/${id}`, { name: profile.name, phone: profile.phone });
      showToast(t('profile_updated'), 'success');
    } catch {
      showToast(t('failed_update_profile'), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change Password ───────────────────────────────────────────────────────
  const handleUpdatePassword = async () => {
    if (passForm.newPass !== passForm.confirm) { showToast(t('passwords_do_not_match'), 'error'); return; }
    if (passForm.newPass.length < 6)           { showToast(t('min_6_characters'), 'error'); return; }
    setSavingPass(true);
    try {
      const profileRes = await api.get('/users/profile');
      const id = profileRes.data._id;
      await api.put(`/users/${id}`, { password: passForm.newPass });
      showToast(t('password_updated'), 'success');
      setPassForm({ current: '', newPass: '', confirm: '' });
    } catch {
      showToast(t('failed_update_password'), 'error');
    } finally {
      setSavingPass(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar title={t('settings')} showMenu />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>
            {t('loading').toUpperCase()}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title={t('settings')} showMenu />

      {/* Toast */}
      {toast && (
        <View style={{
          position: 'absolute', top: 80, alignSelf: 'center', zIndex: 50,
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1,
          backgroundColor: toast.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          borderColor:     toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
        }}>
          {toast.type === 'success'
            ? <CheckCircle size={14} color="#22c55e" />
            : <XCircle    size={14} color="#ef4444" />
          }
          <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: toast.type === 'success' ? '#22c55e' : '#ef4444' }}>
            {toast.msg}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, color: colors.text }}>
            {t('settings_title_part1').toUpperCase()}{' '}
            <Text style={{ color: colors.tint }}>{t('settings_title_part2').toUpperCase()}</Text>
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginTop: 2 }}>
            {t('profile_and_security').toUpperCase()}
          </Text>
        </View>

        {/* Avatar */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
            backgroundColor: `${colors.tint}1A`, borderWidth: 2, borderColor: `${colors.tint}33`,
          }}>
            <Bus size={36} color={colors.tint} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text, marginTop: 12 }}>{profile.name}</Text>
          <View style={{
            borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6,
            backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
          }}>
            <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 2, color: colors.tint }}>
              {t('role_driver').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── 1. Profile ── */}
        <SectionCard
          icon={<User size={22} color={colors.tint} />}
          title={t('my_profile')}
          subtitle={t('personal_information')}
          colors={colors}
        >
          <Field label={t('full_name')}  value={profile.name}  onChange={v => setProfile({ ...profile, name: v })}  placeholder={t('your_name')}  colors={colors} />
          <Field label={t('email')}      value={profile.email} onChange={() => {}} editable={false} colors={colors} />
          <Field label={t('phone')}      value={profile.phone} onChange={v => setProfile({ ...profile, phone: v })} placeholder="+20 1xx" colors={colors} />
          {profile.licenseNumber !== '' && (
            <Field label={t('license_no')} value={profile.licenseNumber} onChange={() => {}} editable={false} colors={colors} />
          )}
          <SaveBtn onPress={handleSaveProfile} loading={savingProfile} label={t('save_profile')} colors={colors} />
        </SectionCard>

        {/* ── 2. Password ── */}
        <SectionCard
          icon={<Lock size={22} color={colors.icon} />}
          title={t('security')}
          subtitle={t('change_password')}
          colors={colors}
        >
          <Field
            label={t('current_password')} value={passForm.current} secureTextEntry={!showCurrent}
            onChange={v => setPassForm({ ...passForm, current: v })} placeholder="••••••••" colors={colors}
            rightIcon={<TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>{showCurrent ? <Eye size={16} color={colors.icon} /> : <EyeOff size={16} color={colors.icon} />}</TouchableOpacity>}
          />
          <Field
            label={t('new_password')} value={passForm.newPass} secureTextEntry={!showNew}
            onChange={v => setPassForm({ ...passForm, newPass: v })} placeholder="••••••••" colors={colors}
            rightIcon={<TouchableOpacity onPress={() => setShowNew(!showNew)}>{showNew ? <Eye size={16} color={colors.icon} /> : <EyeOff size={16} color={colors.icon} />}</TouchableOpacity>}
          />
          <Field
            label={t('confirm_password')} value={passForm.confirm} secureTextEntry={!showConfirm}
            onChange={v => setPassForm({ ...passForm, confirm: v })} placeholder="••••••••" colors={colors}
            rightIcon={<TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>{showConfirm ? <Eye size={16} color={colors.icon} /> : <EyeOff size={16} color={colors.icon} />}</TouchableOpacity>}
          />
          <TouchableOpacity
            onPress={handleUpdatePassword} disabled={savingPass}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              paddingVertical: 14, borderRadius: 14, marginTop: 8, borderWidth: 1,
              backgroundColor: colors.background, borderColor: colors.border,
              opacity: savingPass ? 0.6 : 1,
            }}
          >
            {savingPass
              ? <ActivityIndicator size="small" color={colors.tint} />
              : <><Lock size={16} color={colors.text} /><Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.text }}>{t('change_password').toUpperCase()}</Text></>
            }
          </TouchableOpacity>
        </SectionCard>

        {/* ── 3. Theme ── */}
        <SectionCard
          icon={theme === 'dark' ? <Moon size={22} color={colors.icon} /> : <Sun size={22} color={colors.icon} />}
          title={t('preferences')}
          subtitle={t('interface_appearance')}
          colors={colors}
        >
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            padding: 16, borderRadius: 14, borderWidth: 1,
            backgroundColor: colors.background, borderColor: colors.border,
          }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>
                {theme === 'dark' ? t('dark_mode').toUpperCase() : t('light_mode').toUpperCase()}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.icon, marginTop: 2 }}>
                {t('toggle_theme')}
              </Text>
            </View>
            <Switch
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#fff"
              ios_backgroundColor={colors.border}
              onValueChange={toggleTheme}
              value={theme === 'dark'}
            />
          </View>
        </SectionCard>

      </ScrollView>
    </View>
  );
}