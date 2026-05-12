// app/_layout.tsx
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider } from "../src/context/ThemeContext"; // استدعاء الثيم
import { View, ActivityIndicator } from "react-native";
import { Stack, router } from "expo-router";
import { useEffect } from "react";

function RootLayoutNav() {
  const { token, role, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.replace("/(auth)/login");
    } else if (role === "admin") {
      router.replace("/(admin)/dashboard");
    } else {
      router.replace("/(student)/dashboard");
    }
  }, [token, role, isLoading]);

  if (isLoading) {
    return (
      // عدلتلك ألوان شاشة التحميل عشان تليق مع ألوان الأبلكيشن (الأسود والأصفر)
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f1115" }}>
        <ActivityIndicator size="large" color="#f7a01b" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(student)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    // تغليف التطبيق بالكامل بالـ ThemeProvider عشان كل الصفحات تشوف المود الحالي
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}