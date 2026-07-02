// app/(student)/settings.tsx
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView,
  Platform, ScrollView, Switch, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { Bell, Camera, Lock, Moon, Save, Sun, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import Api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';
import { BOTTOM_BAR_HEIGHT } from '../../src/hooks/useBottomBarHeight';

interface ProfileData {
  _id: string; name: string; email: string;
  phone: string; student_id: string; role: string;
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

// ─── Field ────────────────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; secureTextEntry?: boolean; editable?: boolean;
  keyboardType?: any; colors: any;
}> = ({ label, value, onChange, placeholder, secureTextEntry, editable = true, keyboardType, colors }) => (
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
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];

  const [profile, setProfile]   = useState<ProfileData | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);

  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
  const [prefs, setPrefs] = useState({ bookingAlerts: true });

  useEffect(() => {
    Api.get('/users/profile')
      .then(res => {
        const data = res.data;
        setProfile(data);
        setName(data.name || '');
        setPhone(data.phone || '');
        setPreview(data.profilePicture || null);
      })
      .catch(() => Alert.alert('Error', 'Failed to load profile data.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setPreview(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (passForm.newPass && passForm.newPass !== passForm.confirm) {
      Alert.alert('Error', 'New passwords do not match.'); return;
    }
    if (!profile) return;
    setIsSaving(true);
    try {
      const payload: any = { name, phone };
      if (passForm.newPass) payload.password = passForm.newPass;
      await Api.put(`/users/${profile._id}`, payload);
      Alert.alert(t('settings_saved'), '');
      setPassForm({ current: '', newPass: '', confirm: '' });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Removed handleLanguageChange as language is now centralized via TopBar

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar title="Settings" showMenu />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>
            LOADING...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Settings" showMenu />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: BOTTOM_BAR_HEIGHT + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, color: colors.text }}>
              MY{' '}<Text style={{ color: colors.tint }}>SETTINGS</Text>
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginTop: 2 }}>
              PROFILE & SECURITY
            </Text>
          </View>

          {/* Avatar */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ position: 'relative', marginBottom: 12 }}>
              <View style={{
                width: 80, height: 80, borderRadius: 28,
                alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                backgroundColor: `${colors.tint}1A`, borderWidth: 2, borderColor: `${colors.tint}33`,
              }}>
                {preview
                  ? <Image source={{ uri: preview }} style={{ width: '100%', height: '100%' }} />
                  : <Text style={{ fontSize: 32, fontWeight: '900', color: colors.tint }}>
                      {profile?.name?.charAt(0) || '?'}
                    </Text>
                }
              </View>
              <TouchableOpacity
                onPress={handlePickImage} activeOpacity={0.8}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 28, height: 28, borderRadius: 10,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: colors.tint, borderWidth: 2, borderColor: colors.background,
                }}
              >
                <Camera size={13} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>{profile?.name}</Text>
            <View style={{
              borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6,
              backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
            }}>
              <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 2, color: colors.tint }}>
                {profile?.role?.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* ── 1. Account Info ── */}
          <SectionCard icon={<User size={22} color={colors.tint} />} title="Account Information" subtitle="Personal Details" colors={colors}>
            <Field label="Full Name"     value={name}  onChange={setName}  placeholder="Enter your name"  colors={colors} />
            <Field label="Phone Number"  value={phone} onChange={setPhone} placeholder="Enter your phone" keyboardType="phone-pad" colors={colors} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Student ID"     value={profile?.student_id || ''} onChange={() => {}} editable={false} colors={colors} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Email Address"  value={profile?.email || ''}      onChange={() => {}} editable={false} colors={colors} />
              </View>
            </View>
          </SectionCard>

          {/* ── 2. Password ── */}
          <SectionCard icon={<Lock size={22} color={colors.icon} />} title="Security" subtitle="Change Password" colors={colors}>
            <Field label="Current Password" value={passForm.current} onChange={v => setPassForm(p => ({ ...p, current: v }))} placeholder="••••••••" secureTextEntry colors={colors} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="New Password"     value={passForm.newPass} onChange={v => setPassForm(p => ({ ...p, newPass: v }))} placeholder="••••••••" secureTextEntry colors={colors} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Confirm"          value={passForm.confirm} onChange={v => setPassForm(p => ({ ...p, confirm: v }))} placeholder="••••••••" secureTextEntry colors={colors} />
              </View>
            </View>
          </SectionCard>

          {/* ── 3. Theme ── */}
          <SectionCard
            icon={theme === 'dark' ? <Moon size={22} color={colors.icon} /> : <Sun size={22} color={colors.icon} />}
            title="Preferences" subtitle="Interface Appearance" colors={colors}
          >
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              padding: 16, borderRadius: 14, borderWidth: 1,
              backgroundColor: colors.background, borderColor: colors.border,
            }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>
                  {theme === 'dark' ? 'DARK MODE' : 'LIGHT MODE'}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.icon, marginTop: 2 }}>Toggle interface appearance</Text>
              </View>
              <Switch trackColor={{ false: colors.border, true: colors.tint }} thumbColor="#fff" ios_backgroundColor={colors.border} onValueChange={toggleTheme} value={theme === 'dark'} />
            </View>
          </SectionCard>

          {/* ── 4. Notifications ── */}
          <SectionCard icon={<Bell size={22} color={colors.tint} />} title="Notifications" subtitle="Alert Preferences" colors={colors}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              padding: 16, borderRadius: 14, borderWidth: 1,
              backgroundColor: colors.background, borderColor: colors.border,
            }}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>
                  BOOKING ALERTS
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.icon, marginTop: 2, lineHeight: 16 }}>
                  Push notifications for bus assignments and delays
                </Text>
              </View>
              <Switch
                value={prefs.bookingAlerts}
                onValueChange={val => setPrefs(p => ({ ...p, bookingAlerts: val }))}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : prefs.bookingAlerts ? '#fff' : '#f4f3f4'}
              />
            </View>
          </SectionCard>

          {/* ── Save Button ── */}
          <TouchableOpacity
            onPress={handleSave} disabled={isSaving} activeOpacity={0.8}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              paddingVertical: 14, borderRadius: 14, marginTop: 8,
              backgroundColor: colors.tint, opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving
              ? <ActivityIndicator size="small" color="#000" />
              : <>
                  <Save size={16} color="#000" />
                  <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#000' }}>
                    SAVE CHANGES
                  </Text>
                </>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
