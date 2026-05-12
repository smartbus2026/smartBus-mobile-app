// app/(admin)/settings.tsx
import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Moon, Sun, Settings as SettingsIcon, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { Colors } from '../../constants/theme';
import { useRouter } from 'expo-router';
import Appbar from "../../src/components/bar";


export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  // بنجيب الألوان المناسبة للمود الحالي (سواء لايت أو دارك)
  const activeColors = Colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: activeColors.border }]}>
          <ChevronLeft size={24} color={activeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeColors.text }]}>
          Settings
        </Text>
        <View style={{ width: 40 }} /> {/* مساحة فاضية عشان التوسيط */}
      </View>

      {/* Settings Options */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: activeColors.icon }]}>Preferences</Text>
        
        {/* زرار التحكم في الدارك مود */}
        <View style={[styles.settingRow, { backgroundColor: activeColors.card, borderColor: activeColors.border }]}>
          <View style={styles.settingInfo}>
            {theme === 'dark' ? (
              <Moon size={20} color={activeColors.tint} />
            ) : (
              <Sun size={20} color={activeColors.tint} />
            )}
            <Text style={[styles.settingText, { color: activeColors.text }]}>
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </View>
          
          <Switch
            trackColor={{ false: '#767577', true: activeColors.tint }}
            thumbColor={theme === 'dark' ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleTheme}
            value={theme === 'dark'}
          />
        </View>
      </View>
            <Appbar />
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '700',
  },
});