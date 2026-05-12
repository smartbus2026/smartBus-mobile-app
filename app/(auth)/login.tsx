import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [serverError, setServerError]   = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // نفس لوجيك الرياكت بالظبط
  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setServerError(null);
    try {
      const response = await Api.post('/auth/login', data);
      const { token, user } = response.data;
      if (token) {
        await login(token, user.role);
        // الـ navigation بيتعمل تلقائي من _layout حسب الـ role
      }
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={s.logoWrap}>
          <TouchableOpacity style={s.logoBox} onPress={() => router.push('/(auth)/welcome')}>
            <Text style={s.logoIcon}>🚌</Text>
          </TouchableOpacity>
          <Text style={s.logoTitle}>SmartBus</Text>
          <Text style={s.logoSub}>WELCOME BACK</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Sign In</Text>
          <Text style={s.cardSub}>Access your institutional portal</Text>

          {serverError && (
            <View style={s.errorBox}>
              <Text style={s.errorBoxText}>{serverError}</Text>
            </View>
          )}

          {/* Email */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>INSTITUTIONAL EMAIL</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[s.input, errors.email && s.inputErr]}
                  placeholder="name@university.edu"
                  placeholderTextColor="#555"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  editable={!loading}
                />
              )}
            />
            {errors.email && <Text style={s.fieldErr}>{errors.email.message}</Text>}
          </View>

          {/* Password */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>PASSWORD</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <View>
                  <TextInput
                    style={[s.input, s.passInput, errors.password && s.inputErr]}
                    placeholder="••••••••••••"
                    placeholderTextColor="#555"
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChange}
                    editable={!loading}
                  />
                  <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                    <Text style={s.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && <Text style={s.fieldErr}>{errors.password.message}</Text>}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={s.btnText}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>SmartBus Transportation System © 2026</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#0f1115' },
  scroll:       { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  logoWrap:     { alignItems: 'center', marginBottom: 32 },
  logoBox:      { width: 64, height: 64, backgroundColor: '#f7a01b', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoIcon:     { fontSize: 28 },
  logoTitle:    { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  logoSub:      { fontSize: 10, color: '#8a8d91', letterSpacing: 3, marginTop: 4, fontWeight: '600' },

  card:         { width: '100%', maxWidth: 420, backgroundColor: '#1c1e26', borderWidth: 1, borderColor: '#2d3036', borderRadius: 32, padding: 28 },
  cardTitle:    { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardSub:      { fontSize: 13, color: '#8a8d91', marginBottom: 24, fontWeight: '500' },

  errorBox:     { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorBoxText: { color: '#f87171', fontSize: 12, textAlign: 'center', fontWeight: '500' },

  fieldWrap:    { marginBottom: 16 },
  label:        { fontSize: 10, color: '#8a8d91', fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  input:        { backgroundColor: '#262a33', borderWidth: 1, borderColor: '#2d3036', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, color: '#fff', fontSize: 14 },
  inputErr:     { borderColor: '#ef4444' },
  fieldErr:     { color: '#f87171', fontSize: 10, marginTop: 4, fontWeight: '500' },

  passInput:    { paddingRight: 48 },
  eyeBtn:       { position: 'absolute', right: 14, top: 14 },
  eyeIcon:      { fontSize: 16 },

  btn:          { backgroundColor: '#f7a01b', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled:  { opacity: 0.7 },
  btnText:      { color: '#000', fontWeight: '700', fontSize: 15 },

  footer:       { marginTop: 32, color: '#8a8d91', fontSize: 10, fontWeight: '700', letterSpacing: 3, opacity: 0.4 },
});