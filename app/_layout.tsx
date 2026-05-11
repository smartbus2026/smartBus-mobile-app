// app/_layout.tsx
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { View, Text, ActivityIndicator } from "react-native";
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#fff" />
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
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}