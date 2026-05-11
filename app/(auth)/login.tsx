import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet
} from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bus, Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "../../src/context/AuthContext";
import api from "../../src/services/api";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setServerError(null);
    try {
      const response = await api.post("/auth/login", data);
      const { token, user } = response.data;
      if (token) {
        await login(token, user);
        if (user.role === "admin") {
          router.replace("/(admin)/dashboard");
        } else {
          router.replace("/(student)/dashboard");
        }
      }
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <TouchableOpacity
            style={styles.logoBox}
            onPress={() => router.push("/(auth)/welcome")}
          >
            <Bus size={32} color="#0f1115" fill="#0f1115" />
          </TouchableOpacity>
          <Text style={styles.appName}>SmartBus</Text>
          <Text style={styles.welcomeText}>WELCOME BACK</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>Access your institutional portal</Text>

          {/* Server Error */}
          {serverError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{serverError}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>INSTITUTIONAL EMAIL</Text>
            <View style={[
              styles.inputWrapper,
              errors.email && styles.inputError
            ]}>
              <Mail size={18} color="#8a8d91" style={styles.inputIcon} />
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="name@university.edu"
                    placeholderTextColor="#3a3d42"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    editable={!loading}
                  />
                )}
              />
            </View>
            {errors.email && (
              <Text style={styles.fieldError}>{errors.email.message}</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={[
              styles.inputWrapper,
              errors.password && styles.inputError
            ]}>
              <Lock size={18} color="#8a8d91" style={styles.inputIcon} />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, styles.inputPassword]}
                    placeholder="••••••••••••"
                    placeholderTextColor="#3a3d42"
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChange}
                    editable={!loading}
                  />
                )}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword
                  ? <EyeOff size={18} color="#8a8d91" />
                  : <Eye size={18} color="#8a8d91" />
                }
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.fieldError}>{errors.password.message}</Text>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#0f1115" />
              : <Text style={styles.submitText}>Sign In</Text>
            }
          </TouchableOpacity>

          {/* Signup link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to SmartBus? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.copyright}>
          SmartBus Transportation System © 2026
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1115" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },

  logoSection: { alignItems: "center", marginBottom: 32 },
  logoBox: {
    width: 64, height: 64, backgroundColor: "#f7a01b",
    borderRadius: 20, alignItems: "center", justifyContent: "center",
  },
  appName: {
    fontSize: 28, fontWeight: "800", color: "#fff",
    marginTop: 14, letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 10, color: "#8a8d91", letterSpacing: 3,
    marginTop: 4, fontWeight: "600",
  },

  card: {
    backgroundColor: "#1c1e26", borderWidth: 1,
    borderColor: "#2d3036", borderRadius: 32, padding: 28,
  },
  cardTitle: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: "#8a8d91", marginBottom: 24 },

  errorBox: {
    backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)", borderRadius: 12,
    padding: 12, marginBottom: 16,
  },
  errorText: { color: "#f87171", fontSize: 12, textAlign: "center" },

  fieldGroup: { marginBottom: 16 },
  label: {
    fontSize: 10, color: "#8a8d91", fontWeight: "700",
    letterSpacing: 1.5, marginBottom: 6, marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#262a33", borderWidth: 1,
    borderColor: "#2d3036", borderRadius: 14,
  },
  inputError: { borderColor: "rgba(239,68,68,0.5)" },
  inputIcon: { marginLeft: 14 },
  input: {
    flex: 1, color: "#fff", fontSize: 14,
    paddingVertical: 14, paddingHorizontal: 10,
  },
  inputPassword: { paddingRight: 0 },
  eyeBtn: { padding: 14 },
  fieldError: {
    color: "#f87171", fontSize: 10,
    marginTop: 4, marginLeft: 4, fontWeight: "500",
  },

  submitBtn: {
    backgroundColor: "#f7a01b", borderRadius: 16,
    paddingVertical: 16, alignItems: "center",
    marginTop: 8, marginBottom: 8,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: "#0f1115", fontSize: 15, fontWeight: "700" },

  footer: {
    flexDirection: "row", justifyContent: "center",
    alignItems: "center", marginTop: 20,
    paddingTop: 20, borderTopWidth: 1, borderTopColor: "#2d3036",
  },
  footerText: { color: "#8a8d91", fontSize: 13 },
  footerLink: { color: "#f7a01b", fontSize: 13, fontWeight: "700" },

  copyright: {
    color: "#8a8d91", fontSize: 9, textAlign: "center",
    marginTop: 24, letterSpacing: 2, fontWeight: "600", opacity: 0.4,
  },
});