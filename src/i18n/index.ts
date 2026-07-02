import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';
import en from './locales/en';
import ar from './locales/ar';

const LANG_KEY = 'app_language';
const RTL_LANGUAGES = ['ar'];

// Guards against an infinite reload loop: we only ever attempt ONE reload
// per target language. If the native RTL flag still doesn't match after
// that, we stop and log a warning instead of retrying forever.
const RTL_RELOAD_GUARD_KEY = 'rtl_reload_attempted_for';

const isRTLLang = (lang: string) => RTL_LANGUAGES.includes(lang);

/**
 * Makes the native layout direction (LTR/RTL) match the given language.
 *
 * On iOS/Android, RN only fully re-renders in the new direction after a
 * TRUE app restart (not just a JS bundle reload) — this is a native RN
 * limitation, and it's especially unreliable inside Expo Go, where a JS
 * reload does NOT restart the native host. To avoid looping forever when
 * that reload doesn't actually flip the direction, we only try once per
 * target language and then give up gracefully.
 */
const applyDirection = async (lang: string) => {
  const shouldBeRTL = isRTLLang(lang);

  if (Platform.OS === 'web') {
    // Web doesn't need a native reload — just flip the document direction.
    if (typeof document !== 'undefined') {
      document.documentElement.dir = shouldBeRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
    return;
  }

  if (I18nManager.isRTL === shouldBeRTL) {
    // Direction already matches — clear any stale guard and stop.
    try { await AsyncStorage.removeItem(RTL_RELOAD_GUARD_KEY); } catch {}
    return;
  }

  // Direction needs to flip. If we already tried reloading for this exact
  // target language and it still doesn't match, DO NOT try again — that's
  // what was causing the infinite reload loop.
  let alreadyTried: string | null = null;
  try { alreadyTried = await AsyncStorage.getItem(RTL_RELOAD_GUARD_KEY); } catch {}

  if (alreadyTried === lang) {
    console.warn(
      `[i18n] Layout direction still doesn't match "${lang}" after a reload. ` +
      `A JS-only reload isn't always enough to flip native RTL (this is a known ` +
      `limitation, especially in Expo Go). Close the app completely and reopen it, ` +
      `or use a development build for reliable RTL switching.`
    );
    return; // stop — prevents the reload loop
  }

  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);

  try { await AsyncStorage.setItem(RTL_RELOAD_GUARD_KEY, lang); } catch {}

  try {
    // Reload the JS bundle so every screen re-mounts in the new direction.
    const Updates = await import('expo-updates');
    if (Updates?.reloadAsync) {
      await Updates.reloadAsync();
      return;
    }
  } catch {
    // expo-updates isn't available in this environment — fall through.
  }

  try {
    // Fallback for Expo Go / dev-client environments without expo-updates.
    const { DevSettings } = require('react-native');
    DevSettings?.reload?.();
  } catch {
    // If neither is available the direction will take effect on next app launch.
  }
};

/**
 * Use this everywhere the user picks a language (e.g. the language switcher
 * in Settings) INSTEAD of calling i18n.changeLanguage directly. It updates
 * the active language, persists it, and flips LTR/RTL to match — reloading
 * the app if (and only if) the direction actually needs to change.
 */
export const changeAppLanguage = async (lang: 'en' | 'ar') => {
  await i18n.changeLanguage(lang);
  await applyDirection(lang);
};

export const isCurrentLanguageRTL = () => isRTLLang(i18n.language);

const languageDetector: any = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const saved = await AsyncStorage.getItem(LANG_KEY);
      callback(saved ?? 'en');
    } catch {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    try {
      await AsyncStorage.setItem(LANG_KEY, lang);
    } catch {}
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ar: { translation: ar } },
    lng: 'en',           // ← synchronous default so keys resolve immediately
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: {
      useSuspense: false, // ← prevents raw-key flash while async detector runs
    },
  });

// Keeps native layout direction in sync with the active language — this
// fires once right after the saved language is detected on launch, and
// again any time changeAppLanguage() runs.
i18n.on('languageChanged', (lang) => {
  applyDirection(lang);
});

export default i18n;