import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Menu, Settings } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '../../constants/theme';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  showMenu?: boolean;
  showSettings?: boolean;
  onSettingsPress?: () => void;
}

export default function TopBar({
  title,
  showBack = false,
  showMenu = false,
  showSettings = false,
  onSettingsPress,
}: TopBarProps) {
  const router     = useRouter();
  const colors     = useThemeColor();
  const navigation = useNavigation();

  const handleMenu = () => {
    try {
      navigation.dispatch(DrawerActions.openDrawer());
    } catch {
      try {
        navigation.getParent()?.dispatch(DrawerActions.openDrawer());
      } catch {
        navigation.getParent()?.getParent()?.dispatch(DrawerActions.openDrawer());
      }
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.card }}>
      <View style={[s.wrapper, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>

        {/* Left */}
        <View style={s.side}>
          {showMenu && (
            <TouchableOpacity style={s.iconBtn} onPress={handleMenu} activeOpacity={0.7}>
              <Menu size={20} color={colors.text} />
            </TouchableOpacity>
          )}
          {showBack && (
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <ChevronLeft size={22} color={colors.text} />
            </TouchableOpacity>
          )}
          {!showMenu && !showBack && <View style={s.iconBtn} />}
        </View>

        {/* Title */}
        <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>
          {title.toUpperCase()}
        </Text>

        {/* Right */}
        <View style={s.side}>
          {showSettings ? (
            <TouchableOpacity style={s.iconBtn} onPress={onSettingsPress} activeOpacity={0.7}>
              <Settings size={20} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={s.iconBtn} />
          )}
        </View>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  side: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
});