import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
  Image,
} from 'react-native';
import { User, MapPin } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../constants/theme';
import Api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';
import { BOTTOM_BAR_HEIGHT } from '../../src/hooks/useBottomBarHeight';

export default function ProfilePage() {
  const colors = useThemeColor();
  const router = useRouter();

  const [profile, setProfile]   = useState<any>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState(false);

  useEffect(() => {
    Api.get('/users/profile')
      .then(res => {
        setProfile(res.data);
        setPreview(res.data.profilePicture || null);
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
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
      // Backend upload would go here:
      // const formData = new FormData();
      // formData.append('image', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
      // await Api.post('/users/profile-picture', formData);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[s.centerWrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[s.loadText, { color: colors.icon }]}>Loading profile...</Text>
      </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <View style={[s.centerWrap, { backgroundColor: colors.background }]}>
        <Text style={[s.errorText, { color: '#f87171' }]}>Failed to load profile</Text>
      </View>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      <TopBar
        title="My Profile"
        showBack
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(student)/settings' as any)}
      />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: BOTTOM_BAR_HEIGHT + 16 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Avatar Card ── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.avatarRow}>

            {/* Avatar + Edit Button */}
            <View style={s.avatarWrap}>
              <View style={[s.avatarRing, { borderColor: colors.border, backgroundColor: colors.card }]}>
                {preview
                  ? <Image source={{ uri: preview }} style={s.avatarImg} />
                  : <Text style={[s.avatarInitial, { color: colors.icon }]}>
                      {profile.name?.charAt(0) || '?'}
                    </Text>
                }
              </View>
              <TouchableOpacity
                style={[s.editBtn, { backgroundColor: colors.tint }]}
                onPress={handlePickImage}
                activeOpacity={0.85}
              >
                <User size={14} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Name / ID / Role */}
            <View style={s.avatarInfo}>
              <Text style={[s.profileName, { color: colors.text }]} numberOfLines={1}>
                {profile.name}
              </Text>
              <Text style={[s.studentId, { color: colors.icon }]}>
                {profile.student_id || 'Student'}
              </Text>
              <View style={[s.roleBadge, { backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}33` }]}>
                <Text style={[s.roleText, { color: colors.tint }]}>
                  {profile.role}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Account Details ── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.cardHeader}>
            <MapPin size={16} color={colors.tint} />
            <Text style={[s.cardTitle, { color: colors.text }]}>Account Details</Text>
          </View>

          <View style={s.detailsGrid}>

            {/* Email */}
            <View style={[s.detailBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[s.detailLabel, { color: colors.icon }]}>EMAIL</Text>
              <Text style={[s.detailValue, { color: colors.text }]} numberOfLines={1}>
                {profile.email}
              </Text>
            </View>

            {/* Phone */}
            <View style={[s.detailBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[s.detailLabel, { color: colors.icon }]}>PHONE</Text>
              <Text style={[s.detailValue, { color: colors.text }]}>
                {profile.phone || 'Not provided'}
              </Text>
            </View>

            {/* Joined — full width */}
            <View style={[s.detailBox, s.detailBoxFull, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[s.detailLabel, { color: colors.icon }]}>JOINED</Text>
              <Text style={[s.detailValue, { color: colors.text }]}>
                {new Date(profile.createdAt).toLocaleDateString()}
              </Text>
            </View>

          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1 },
  scroll:         { padding: 20, gap: 14 },

  centerWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadText:       { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  errorText:      { fontSize: 13, fontWeight: '700' },

  card:           { borderWidth: 1, borderRadius: 20, padding: 20 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle:      { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  avatarRow:      { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatarWrap:     { position: 'relative' },
  avatarRing:     { width: 88, height: 88, borderRadius: 44, borderWidth: 4, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImg:      { width: '100%', height: '100%' },
  avatarInitial:  { fontSize: 32, fontWeight: '900' },
  editBtn:        { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  avatarInfo:     { flex: 1 },
  profileName:    { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  studentId:      { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  roleBadge:      { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  roleText:       { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },

  detailsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailBox:      { flex: 1, minWidth: '45%', borderWidth: 1, borderRadius: 14, padding: 14 },
  detailBoxFull:  { width: '100%', flex: 0 },
  detailLabel:    { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  detailValue:    { fontSize: 13, fontWeight: '700' },
});