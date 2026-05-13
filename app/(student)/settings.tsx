import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { User, Map, Shield, Check, Save } from 'lucide-react-native';
import Api from '../../src/services/api';
import { useThemeColor } from '../../constants/theme';

interface Form {
  name: string; email: string; phone: string;
  curPass: string; newPass: string; confPass: string;
}

export default function ProfilePage() {
  const colors = useThemeColor();
  const [userId, setUserId]       = useState('');
  const [initials, setInitials]   = useState('?');
  const [form, setForm]           = useState<Form>({ name: '', email: '', phone: '', curPass: '', newPass: '', confPass: '' });
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await Api.get('/users/profile');
        const u = res.data;
        setUserId(u._id || u.id || '');
        setInitials((u.name || '?').charAt(0).toUpperCase());
        setForm(f => ({ ...f, name: u.name || '', email: u.email || '', phone: u.phone_number || '' }));
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const set = (k: keyof Form) => (val: string) => setForm(f => ({ ...f, [k]: val }));

  const save = async () => {
    setSaveError(null);
    try {
      const payload: any = { name: form.name, email: form.email, phone_number: form.phone };
      if (form.newPass) {
        if (form.newPass !== form.confPass) { setSaveError('New passwords do not match.'); return; }
        payload.password = form.newPass;
      }
      await Api.put(`/users/${userId}`, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Failed to save profile.');
    }
  };

  const inputStyle = [s.input, { backgroundColor: colors.background === '#f8f9fa' ? '#f0f1f3' : '#262a33', borderColor: colors.border, color: colors.text }];

  return (
    <ScrollView style={[s.root, { backgroundColor: colors.background }]} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

      {/* Avatar Card */}
      <View style={[s.avatarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={s.avatarInfo}>
          <Text style={[s.avatarName, { color: colors.text }]} numberOfLines={1}>
            {isLoading ? 'Loading...' : form.name}
          </Text>
          <Text style={[s.avatarEmail, { color: colors.icon }]}>{form.email}</Text>
          <View style={s.activeBadge}>
            <View style={s.activeDot} />
            <Text style={s.activeText}>Active Account</Text>
          </View>
        </View>
      </View>

      {/* Personal Info */}
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.sectionHeader}>
          <User size={18} color="#f7a01b" />
          <Text style={[s.sectionTitle, { color: colors.text }]}>Personal Information</Text>
        </View>

        <View style={s.fieldWrap}>
          <Text style={[s.label, { color: colors.icon }]}>FULL NAME</Text>
          <TextInput style={inputStyle} value={form.name} onChangeText={set('name')} placeholder="Full Name" placeholderTextColor={colors.icon} />
        </View>

        <View style={s.fieldWrap}>
          <Text style={[s.label, { color: colors.icon }]}>EMAIL ADDRESS</Text>
          <TextInput style={inputStyle} value={form.email} onChangeText={set('email')} placeholder="Email" placeholderTextColor={colors.icon} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={s.fieldWrap}>
          <Text style={[s.label, { color: colors.icon }]}>PHONE NUMBER</Text>
          <View style={s.phoneRow}>
            <View style={[s.phonePrefix, { backgroundColor: colors.background === '#f8f9fa' ? '#f0f1f3' : '#262a33', borderColor: colors.border }]}>
              <Text style={[s.phonePrefixText, { color: colors.icon }]}>+20</Text>
            </View>
            <TextInput
              style={[inputStyle, s.phoneInput]}
              value={form.phone}
              onChangeText={set('phone')}
              placeholder="01xxxxxxxxx"
              placeholderTextColor={colors.icon}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </View>

      {/* Route Preferences */}
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.sectionHeader}>
          <Map size={18} color="#f7a01b" />
          <Text style={[s.sectionTitle, { color: colors.text }]}>Route Preferences</Text>
        </View>
        <Text style={[s.infoText, { color: colors.icon }]}>
          Route and pickup point are selected per booking. Visit{' '}
          <Text style={{ color: '#f7a01b', fontWeight: '700' }}>Book Trip</Text>
          {' '}to register for tomorrow's trip.
        </Text>
      </View>

      {/* Security */}
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.sectionHeader}>
          <Shield size={18} color="#f7a01b" />
          <Text style={[s.sectionTitle, { color: colors.text }]}>Security & Password</Text>
        </View>

        <View style={s.fieldWrap}>
          <Text style={[s.label, { color: colors.icon }]}>CURRENT PASSWORD</Text>
          <TextInput style={inputStyle} value={form.curPass} onChangeText={set('curPass')} placeholder="••••••••" placeholderTextColor={colors.icon} secureTextEntry />
        </View>

        <View style={s.fieldWrap}>
          <Text style={[s.label, { color: colors.icon }]}>NEW PASSWORD</Text>
          <TextInput style={inputStyle} value={form.newPass} onChangeText={set('newPass')} placeholder="Leave blank to keep" placeholderTextColor={colors.icon} secureTextEntry />
        </View>

        <View style={s.fieldWrap}>
          <Text style={[s.label, { color: colors.icon }]}>CONFIRM NEW PASSWORD</Text>
          <TextInput style={inputStyle} value={form.confPass} onChangeText={set('confPass')} placeholder="Confirm your new password" placeholderTextColor={colors.icon} secureTextEntry />
        </View>
      </View>

      {/* Error */}
      {saveError && (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{saveError}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={[s.actions, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => { setSaveError(null); setForm(f => ({ ...f, curPass: '', newPass: '', confPass: '' })); }}
          activeOpacity={0.7}
        >
          <Text style={[s.discardText, { color: colors.icon }]}>Discard Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.saveBtn, saved && s.saveBtnOk]}
          onPress={save}
          activeOpacity={0.85}
        >
          {saved
            ? <><Check size={16} color="#fff" /><Text style={s.saveBtnText}>Saved!</Text></>
            : <><Save size={16} color="#000" /><Text style={[s.saveBtnText, { color: '#000' }]}>Save Profile</Text></>
          }
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1 },
  scroll:          { padding: 20, gap: 14 },

  // Avatar
  avatarCard:      { flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderRadius: 20, padding: 20 },
  avatar:          { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(247,160,27,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(247,160,27,0.3)' },
  avatarText:      { fontSize: 28, fontWeight: '900', color: '#f7a01b' },
  avatarInfo:      { flex: 1 },
  avatarName:      { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  avatarEmail:     { fontSize: 11, fontWeight: '500', marginBottom: 8 },
  activeBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  activeDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  activeText:      { fontSize: 9, fontWeight: '800', color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1 },

  // Card
  card:            { borderWidth: 1, borderRadius: 20, padding: 20 },
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  sectionTitle:    { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  // Fields
  fieldWrap:       { marginBottom: 14 },
  label:           { fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  input:           { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13 },
  phoneRow:        { flexDirection: 'row' },
  phonePrefix:     { borderWidth: 1, borderRightWidth: 0, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, paddingHorizontal: 12, justifyContent: 'center' },
  phonePrefixText: { fontSize: 12, fontWeight: '700' },
  phoneInput:      { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },

  infoText:        { fontSize: 12, fontWeight: '500', lineHeight: 18 },

  // Error
  errorBox:        { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 12, padding: 12 },
  errorText:       { color: '#f87171', fontSize: 12, fontWeight: '500' },

  // Actions
  actions:         { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, borderTopWidth: 1, paddingTop: 20 },
  discardText:     { fontSize: 13, fontWeight: '700' },
  saveBtn:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f7a01b', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  saveBtnOk:       { backgroundColor: '#22c55e' },
  saveBtnText:     { fontSize: 13, fontWeight: '700', color: '#fff' },
});