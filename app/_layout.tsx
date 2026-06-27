import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';

function RootGuard() {
  const { token, userRole, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const checkOnboarding = async () => {
      const onboarded = await AsyncStorage.getItem("onboarded");
      const inAuth = segments[0] === '(auth)';

      if (!token) {
        if (!onboarded) {
          router.replace('/(auth)/onboarding');
        } else if (!inAuth) {
          router.replace('/(auth)/login');
        }
      } else if (token && inAuth) {
        router.replace(
          userRole === 'admin'  ? '/(admin)/dashboard'  :
          userRole === 'driver' ? '/(driver)/dashboard' :
          '/(student)/dashboard'
        );
      }
    };

    checkOnboarding();
  }, [token, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1115' }}>
        <ActivityIndicator size="large" color="#f7a01b" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(student)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(driver)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootGuard />
      </AuthProvider>
    </ThemeProvider>
  );
}