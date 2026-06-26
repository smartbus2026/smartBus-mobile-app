import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
  Image, Switch, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { User, Shield, Bell, Save, Camera, Sun, Moon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';
import { BOTTOM_BAR_HEIGHT } from '../../src/hooks/useBottomBarHeight';

// استخدام ThemeContext تماماً كما في نسخة الأدمن
import { useTheme } from '../../src/context/ThemeContext';
import { Colors } from '../../constants/theme';

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  student_id: string;
  role: string;
}

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
  const [prefs, setPrefs] = useState({ bookingAlerts: true });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await Api.get('/users/profile');
        const data = res.data;
        setProfile(data);
        setName(data.name || '');
        setPhone(data.phone || '');
        setPreview(data.profilePicture || null);
      } catch (err) {
        console.error('Failed to fetch profile', err);
        Alert.alert('Error', 'Failed to load profile data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPreview(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (passForm.newPass && passForm.newPass !== passForm.confirm) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (!profile) return;
    setIsSaving(true);

    try {
      const payload: any = { name, phone };
      
      if (passForm.newPass) {
        payload.password = passForm.newPass;
      }

      await Api.put(`/users/${profile._id}`, payload);
      Alert.alert('Success', 'Settings saved successfully!');
      setPassForm({ current: '', newPass: '', confirm: '' });
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[s.centerWrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[s.loadText, { color: colors.icon }]}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      
      <TopBar 
        title="Settings" 
        showMenu={true} 
        showSettings={false} 
      />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: BOTTOM_BAR_HEIGHT + 24 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Avatar Header ── */}
          <View style={s.avatarContainer}>
            <View style={s.avatarWrap}>
              <View style={[s.avatarRing, { borderColor: colors.border, backgroundColor: colors.card }]}>
                {preview ? (
                  <Image source={{ uri: preview }} style={s.avatarImg} />
                ) : (
                  <Text style={[s.avatarInitial, { color: colors.icon }]}>
                    {profile?.name?.charAt(0) || '?'}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[s.editAvatarBtn, { backgroundColor: colors.tint, borderColor: colors.background }]}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <Camera size={14} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={[s.headerName, { color: colors.text }]}>{profile?.name}</Text>
            <Text style={[s.headerRole, { color: colors.tint }]}>{profile?.role?.toUpperCase()}</Text>
          </View>

          {/* ── Account Information ── */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardHeader}>
              <User size={16} color={colors.tint} />
              <Text style={[s.cardTitle, { color: colors.text }]}>Account Information</Text>
            </View>

            <View style={s.inputGroup}>
              <Text style={[s.label, { color: colors.icon }]}>FULL NAME</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.icon}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={[s.label, { color: colors.icon }]}>PHONE NUMBER</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone"
                placeholderTextColor={colors.icon}
                keyboardType="phone-pad"
              />
            </View>

            {/* Readonly Fields */}
            <View style={s.row}>
              <View style={[s.inputGroup, { flex: 1 }]}>
                <Text style={[s.label, { color: colors.icon }]}>STUDENT ID</Text>
                <TextInput
                  style={[s.input, s.inputDisabled, { backgroundColor: colors.background, borderColor: colors.border, color: colors.icon }]}
                  value={profile?.student_id}
                  editable={false}
                />
              </View>
              <View style={[s.inputGroup, { flex: 1 }]}>
                <Text style={[s.label, { color: colors.icon }]}>EMAIL ADDRESS</Text>
                <TextInput
                  style={[s.input, s.inputDisabled, { backgroundColor: colors.background, borderColor: colors.border, color: colors.icon }]}
                  value={profile?.email}
                  editable={false}
                />
              </View>
            </View>
          </View>

          {/* ── Preferences / Theme ── */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardHeader}>
              {theme === 'dark' ? <Moon size={16} color={colors.tint} /> : <Sun size={16} color={colors.tint} />}
              <Text style={[s.cardTitle, { color: colors.text }]}>Preferences</Text>
            </View>

            <View style={s.switchRow}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={[s.switchTitle, { color: colors.text }]}>
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Text style={[s.switchDesc, { color: colors.icon }]}>Toggle interface appearance.</Text>
              </View>
              <Switch
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor="#fff"
                ios_backgroundColor={colors.border}
                onValueChange={toggleTheme}
                value={theme === 'dark'}
              />
            </View>
          </View>

          {/* ── Security / Password ── */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardHeader}>
              <Shield size={16} color={colors.tint} />
              <Text style={[s.cardTitle, { color: colors.text }]}>Change Password</Text>
            </View>

            <View style={s.inputGroup}>
              <Text style={[s.label, { color: colors.icon }]}>CURRENT PASSWORD</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={passForm.current}
                onChangeText={(t) => setPassForm(p => ({ ...p, current: t }))}
                placeholder="Enter current password"
                placeholderTextColor={colors.icon}
                secureTextEntry
              />
            </View>

            <View style={s.row}>
              <View style={[s.inputGroup, { flex: 1 }]}>
                <Text style={[s.label, { color: colors.icon }]}>NEW PASSWORD</Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={passForm.newPass}
                  onChangeText={(t) => setPassForm(p => ({ ...p, newPass: t }))}
                  placeholder="New password"
                  placeholderTextColor={colors.icon}
                  secureTextEntry
                />
              </View>
              <View style={[s.inputGroup, { flex: 1 }]}>
                <Text style={[s.label, { color: colors.icon }]}>CONFIRM</Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={passForm.confirm}
                  onChangeText={(t) => setPassForm(p => ({ ...p, confirm: t }))}
                  placeholder="Confirm new"
                  placeholderTextColor={colors.icon}
                  secureTextEntry
                />
              </View>
            </View>
          </View>

          {/* ── Notifications ── */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardHeader}>
              <Bell size={16} color={colors.tint} />
              <Text style={[s.cardTitle, { color: colors.text }]}>Notifications</Text>
            </View>

            <View style={s.switchRow}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={[s.switchTitle, { color: colors.text }]}>Booking Alerts</Text>
                <Text style={[s.switchDesc, { color: colors.icon }]}>Receive push notifications for bus assignments and delays.</Text>
              </View>
              <Switch
                value={prefs.bookingAlerts}
                onValueChange={(val) => setPrefs(p => ({ ...p, bookingAlerts: val }))}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : prefs.bookingAlerts ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* ── Save Button ── */}
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: colors.tint }, isSaving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Save size={16} color="#000" />
                <Text style={s.saveBtnText}>SAVE CHANGES</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1 },
  scroll:         { padding: 20, gap: 16 },

  centerWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadText:       { fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },

  // Avatar Section
  avatarContainer:{ alignItems: 'center', marginBottom: 10 },
  avatarWrap:     { position: 'relative', marginBottom: 12 },
  avatarRing:     { width: 96, height: 96, borderRadius: 48, borderWidth: 3, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImg:      { width: '100%', height: '100%' },
  avatarInitial:  { fontSize: 36, fontWeight: '900' },
  editAvatarBtn:  { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  headerName:     { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  headerRole:     { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 4 },

  // Cards
  card:           { borderWidth: 1, borderRadius: 24, padding: 20 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  cardTitle:      { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },

  // Forms
  row:            { flexDirection: 'row', gap: 12 },
  inputGroup:     { marginBottom: 16 },
  label:          { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
  input:          { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 48, fontSize: 13, fontWeight: '600' },
  inputDisabled:  { opacity: 0.6 },

  // Switch
  switchRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchTitle:    { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  switchDesc:     { fontSize: 11, lineHeight: 16, fontWeight: '500' },

  // Save Button
  saveBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 16, marginTop: 10, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveBtnText:    { color: '#000', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
});