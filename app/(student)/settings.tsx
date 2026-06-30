import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
  Image, Switch, Alert, KeyboardAvoidingView, Platform, I18nManager
} from 'react-native';
import { User, Shield, Bell, Save, Camera, Sun, Moon, Globe, Palette } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates'; // لعمل إعادة تشغيل للتطبيق لتطبيق الـ RTL
import { useTranslation } from 'react-i18next';

import Api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';
import { BOTTOM_BAR_HEIGHT } from '../../src/hooks/useBottomBarHeight';
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
  const { t, i18n } = useTranslation();
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
        Alert.alert(t('error'), t('failed_load_profile'));
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
      Alert.alert(t('error'), t('passwords_no_match'));
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
      Alert.alert(t('settings_saved'), '');
      setPassForm({ current: '', newPass: '', confirm: '' });
    } catch (err: any) {
      console.error(err);
      Alert.alert(t('error'), err.response?.data?.message || t('failed_save_settings'));
    } finally {
      setIsSaving(false);
    }
  };

  // دالة تغيير اللغة
  const handleLanguageChange = async (lang: 'en' | 'ar') => {
    if (i18n.language === lang) return; // لو نفس اللغة متعملش حاجة

    await AsyncStorage.setItem('app_lang', lang);
    i18n.changeLanguage(lang);

    const isRTL = lang === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
      
      // عمل Reload للتطبيق عشان يعكس اتجاه الشاشة (RTL)
      Alert.alert(
        t('restart_required'),
        t('restart_message'),
        [{ text: t('restart_now'), onPress: () => Updates.reloadAsync() }]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={[s.centerWrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[s.loadText, { color: colors.icon }]}>{t('loading_settings')}</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      
      <TopBar 
        title={t('settings')} 
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
              <Text style={[s.cardTitle, { color: colors.text }]}>{t('account_info')}</Text>
            </View>

            <View style={s.inputGroup}>
              <Text style={[s.label, { color: colors.icon }]}>{t('full_name')}</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder={t('placeholder_name')}
                placeholderTextColor={colors.icon}
                textAlign={I18nManager.isRTL ? 'right' : 'left'}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={[s.label, { color: colors.icon }]}>{t('phone_number')}</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder={t('placeholder_phone')}
                placeholderTextColor={colors.icon}
                keyboardType="phone-pad"
                textAlign={I18nManager.isRTL ? 'right' : 'left'}
              />
            </View>

            {/* Readonly Fields */}
            <View style={s.row}>
              <View style={[s.inputGroup, { flex: 1 }]}>
                <Text style={[s.label, { color: colors.icon }]}>{t('student_id')}</Text>
                <TextInput
                  style={[s.input, s.inputDisabled, { backgroundColor: colors.background, borderColor: colors.border, color: colors.icon }]}
                  value={profile?.student_id}
                  editable={false}
                  textAlign={I18nManager.isRTL ? 'right' : 'left'}
                />
              </View>
              <View style={[s.inputGroup, { flex: 1 }]}>
                <Text style={[s.label, { color: colors.icon }]}>{t('email_address')}</Text>
                <TextInput
                  style={[s.input, s.inputDisabled, { backgroundColor: colors.background, borderColor: colors.border, color: colors.icon }]}
                  value={profile?.email}
                  editable={false}
                  textAlign={I18nManager.isRTL ? 'right' : 'left'}
                />
              </View>
            </View>
          </View>

          {/* ── Preferences & Language ── */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            
            {/* Theme Switch */}
            <View style={s.cardHeader}>
              <Palette size={16} color={colors.tint} />
              <Text style={[s.cardTitle, { color: colors.text }]}>{t('appearance')}</Text>
            </View>

            <View style={[s.switchRow, { marginBottom: 24 }]}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={[s.switchTitle, { color: colors.text }]}>
                  {theme === 'dark' ? t('dark_mode') : t('light_mode')}
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

            {/* Language Selection */}
            <View style={[s.cardHeader, { marginTop: 8 }]}>
              <Globe size={16} color={colors.tint} />
              <Text style={[s.cardTitle, { color: colors.text }]}>{t('language')}</Text>
            </View>

            <View style={s.themeRow}>
              {/* English Button */}
              <TouchableOpacity
                style={[
                  s.themeBtn,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  i18n.language === 'en' && { borderColor: colors.tint, backgroundColor: `${colors.tint}1A` }
                ]}
                onPress={() => handleLanguageChange('en')}
                activeOpacity={0.8}
              >
                <Text style={[
                  s.themeBtnText,
                  { color: colors.icon },
                  i18n.language === 'en' && { color: colors.tint }
                ]}>
                  English
                </Text>
              </TouchableOpacity>

              {/* Arabic Button */}
              <TouchableOpacity
                style={[
                  s.themeBtn,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  i18n.language === 'ar' && { borderColor: colors.tint, backgroundColor: `${colors.tint}1A` }
                ]}
                onPress={() => handleLanguageChange('ar')}
                activeOpacity={0.8}
              >
                <Text style={[
                  s.themeBtnText,
                  { color: colors.icon },
                  i18n.language === 'ar' && { color: colors.tint }
                ]}>
                  العربية
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Security / Password ── */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardHeader}>
              <Shield size={16} color={colors.tint} />
              <Text style={[s.cardTitle, { color: colors.text }]}>{t('change_password')}</Text>
            </View>

            <View style={s.inputGroup}>
              <TextInput
                style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={passForm.current}
                onChangeText={(t) => setPassForm(p => ({ ...p, current: t }))}
                placeholder={t('placeholder_current_password')}
                placeholderTextColor={colors.icon}
                secureTextEntry
                textAlign={I18nManager.isRTL ? 'right' : 'left'}
              />
            </View>

            <View style={s.row}>
              <View style={[s.inputGroup, { flex: 1 }]}>
                <TextInput
                  style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={passForm.newPass}
                  onChangeText={(t) => setPassForm(p => ({ ...p, newPass: t }))}
                  placeholder={t('placeholder_new_password')}
                  placeholderTextColor={colors.icon}
                  secureTextEntry
                  textAlign={I18nManager.isRTL ? 'right' : 'left'}
                />
              </View>
              <View style={[s.inputGroup, { flex: 1 }]}>
                <TextInput
                  style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={passForm.confirm}
                  onChangeText={(t) => setPassForm(p => ({ ...p, confirm: t }))}
                  placeholder={t('placeholder_confirm_password')}
                  placeholderTextColor={colors.icon}
                  secureTextEntry
                  textAlign={I18nManager.isRTL ? 'right' : 'left'}
                />
              </View>
            </View>
          </View>

          {/* ── Notifications ── */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardHeader}>
              <Bell size={16} color={colors.tint} />
              <Text style={[s.cardTitle, { color: colors.text }]}>{t('notifications')}</Text>
            </View>

            <View style={s.switchRow}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={[s.switchTitle, { color: colors.text }]}>{t('booking_alerts')}</Text>
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
                <Text style={s.saveBtnText}>{t('save_changes')}</Text>
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

  avatarContainer:{ alignItems: 'center', marginBottom: 10 },
  avatarWrap:     { position: 'relative', marginBottom: 12 },
  avatarRing:     { width: 96, height: 96, borderRadius: 48, borderWidth: 3, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImg:      { width: '100%', height: '100%' },
  avatarInitial:  { fontSize: 36, fontWeight: '900' },
  editAvatarBtn:  { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  headerName:     { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  headerRole:     { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 4 },

  card:           { borderWidth: 1, borderRadius: 24, padding: 20 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  cardTitle:      { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },

  themeRow:       { flexDirection: 'row', gap: 12 },
  themeBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderWidth: 1, borderRadius: 16 },
  themeBtnText:   { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },

  row:            { flexDirection: 'row', gap: 12 },
  inputGroup:     { marginBottom: 16 },
  label:          { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
  input:          { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 48, fontSize: 13, fontWeight: '600' },
  inputDisabled:  { opacity: 0.6 },

  switchRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchTitle:    { fontSize: 13, fontWeight: '800' },

  saveBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 16, marginTop: 10, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveBtnText:    { color: '#000', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
});