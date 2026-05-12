import { Platform } from 'react-native';
import { useTheme } from '../src/context/ThemeContext';
const tintColorLight = '#f7a01b'; // الأصفر بتاعك (Amber)
const tintColorDark = '#f7a01b';

export const Colors = {
  light: {
    text: '#5da2cb',
    background: '#f8f9fa', // لون فاتح للخلفية
    card: '#ffffff', // لون الكروت
    border: '#e5e7eb',
    tint: tintColorLight,
    icon: '#687076',
    error: '#ef4444',
    success: '#22c55e',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0f1115', // الأسود اللي استخدمناه في الخريطة
    card: '#1c1e26', // لون الكروت الغامق
    border: '#2d3036',
    tint: tintColorDark,
    icon: '#9BA1A6',
    error: '#ef4444',
    success: '#22c55e',
  },
};



export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export function useThemeColor() {
  const { theme } = useTheme();
  return Colors[theme];
}
