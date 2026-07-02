import React from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { useThemeColor } from '../../constants/theme';
import { useTranslation } from 'react-i18next'; // استدعاء الهوك

export default function ScreenWrapper({ children }: { children: React.ReactNode }) {
  const colors = useThemeColor();
  const { i18n } = useTranslation(); 
  
  
  const isRTL = i18n.language === 'ar'; 

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === 'ios' ? 55 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 30,
   
      direction: isRTL ? 'rtl' : 'ltr', 
    }}>
      {children}
    </View>
  );
}