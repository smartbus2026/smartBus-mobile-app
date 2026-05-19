import React from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { useThemeColor } from '../../constants/theme';

export default function ScreenWrapper({ children }: { children: React.ReactNode }) {
  const colors = useThemeColor();
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === 'ios' ? 55 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 30,
    }}>
      {children}
    </View>
  );
}