import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import en from './locales/en.json';
import ar from './locales/ar.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const initI18n = async () => {
  try {
    // حاول تجيب اللغة المحفوظة
    const savedLanguage = await AsyncStorage.getItem('app_lang');
    
    // لو مفيش لغة محفوظة، هات لغة الجهاز
    const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
    const initialLang = savedLanguage || deviceLanguage;

    // تفعيل أو تعطيل الـ RTL بناءً على اللغة
    const isRTL = initialLang === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
      // لاحظ: تغيير اتجاه الـ RTL بيحتاج ريستارت للتطبيق عشان يطبق
    }

    await i18n
      .use(initReactI18next)
      .init({
        // compatibilityJSON: 'v3',
        resources,
        lng: initialLang,
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
        },
      });
  } catch (error) {
    console.error('Error initializing i18n', error);
  }
};

initI18n();

export default i18n;