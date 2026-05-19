import { useRouter } from 'expo-router';
import { Moon, Sun } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import TopBar from '../../src/components/TopBar';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      <TopBar
        title="Settings"
        showBack
      />

      <View style={s.content}>
        <Text style={[s.sectionTitle, { color: colors.icon }]}>Preferences</Text>

        <View style={[s.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.settingInfo}>
            {theme === 'dark'
              ? <Moon size={20} color={colors.tint} />
              : <Sun size={20} color={colors.tint} />
            }
            <Text style={[s.settingText, { color: colors.text }]}>
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#767577', true: colors.tint }}
            thumbColor={theme === 'dark' ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleTheme}
            value={theme === 'dark'}
          />
        </View>
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  content:      { padding: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, marginLeft: 5 },
  settingRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1 },
  settingInfo:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText:  { fontSize: 16, fontWeight: '700' },
});