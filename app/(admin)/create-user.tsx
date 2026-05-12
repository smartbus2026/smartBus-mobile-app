import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { User, Phone, Hash, ShieldCheck, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react-native';
import Api from '../../src/services/api'; // تأكدي من المسار
import { RegisterPayload } from '../../src/types/index'; // تأكدي من المسار لملف الـ types
import { useRouter } from 'expo-router';
import Appbar from '../../src/components/bar';

export default function CreateUserPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });

  const { control, handleSubmit, watch } = useForm<RegisterPayload & { role: 'student' | 'admin' }>({
    defaultValues: { 
      role: 'student',
      name: '',
      email: '',
      password: '',
      phone_number: '',
      student_id: ''
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (toast.msg) {
      const t = setTimeout(() => setToast({ msg: '', type: null }), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const onSubmit = async (data: any) => {
    // Validation يدوي سريع
    if (!data.name || !data.email || !data.password) {
      setToast({ msg: 'Name, Email and Password are required', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await Api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone_number: data.phone_number,
        ...(data.role === 'student' ? { student_id: data.student_id } : {}),
      });
      
      setToast({ msg: ' User added successfully', type: 'success' });
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      setToast({ msg: error.response?.data?.message || 'Registration failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {toast.msg && (
        <View style={[styles.customToast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          {toast.type === 'success' ? <CheckCircle size={16} color="#22c55e" /> : <AlertCircle size={16} color="#ef4444" />}
          <Text style={[styles.toastText, { color: toast.type === 'success' ? "#22c55e" : "#ef4444" }]}>{toast.msg}</Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>New <Text style={{ color: '#f7a01b' }}>Identity</Text></Text>
              <Text style={styles.headerSubtitle}>Create a new system account</Text>
            </View>
          </View>

          {/* Role Selection */}
          <Text style={styles.sectionLabel}>Authority Level</Text>
          <View style={styles.roleContainer}>
            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <View style={styles.roleRow}>
                  {['student', 'admin'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleOption, value === role && styles.roleActive]}
                      onPress={() => onChange(role)}
                    >
                      <Text style={[styles.roleText, value === role && styles.roleTextActive]}>{role.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Form Fields */}
          <View style={styles.card}>
            <CustomInput control={control} name="name" label="Full Name" placeholder="e.g. Ahmed Mohamed" icon={User} />
            <CustomInput control={control} name="email" label="Institutional Email" placeholder="name@university.edu" icon={ShieldCheck} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <CustomInput control={control} name="phone_number" label="Phone" placeholder="01xxxx" icon={Phone} />
              </View>
              {selectedRole === 'student' && (
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <CustomInput control={control} name="student_id" label="ID Number" placeholder="ID#" icon={Hash} />
                </View>
              )}
            </View>

            <CustomInput 
              control={control} name="password" label="Security Key" 
              placeholder="••••••••" icon={Lock} secure={!showPassword}
              rightIcon={showPassword ? Eye : EyeOff}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />
            
            <TouchableOpacity 
              style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#0f1115" /> : <Text style={styles.submitBtnText}>PROVISION ACCOUNT</Text>}
            </TouchableOpacity>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <Appbar />
    </View>
  );
}

const CustomInput = ({ control, name, label, placeholder, icon: Icon, secure, rightIcon: RightIcon, onRightIconPress }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Icon size={16} color="#8a8d91" style={{ marginRight: 12 }} />
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#4b4e5a"
            secureTextEntry={secure}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            autoCapitalize="none"
          />
        )}
      />
      {RightIcon && (
        <TouchableOpacity onPress={onRightIconPress}>
          <RightIcon size={16} color="#8a8d91" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1115" },
  scrollContent: { padding: 24 },
  customToast: {
    position: "absolute", top: 60, alignSelf: "center", zIndex: 1000,
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25,
    borderWidth: 1, backgroundColor: "#1c1e26",
  },
  toastSuccess: { borderColor: "rgba(34,197,94,0.3)" },
  toastError: { borderColor: "rgba(239,68,68,0.3)" },
  toastText: { fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 32, marginTop: 20 },
  backBtn: { width: 40, height: 40, backgroundColor: '#1c1e26', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2d3036' },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#fff" },
  headerSubtitle: { fontSize: 11, fontWeight: "700", color: "#4b4e5a", textTransform: "uppercase", marginTop: 4 },
  sectionLabel: { fontSize: 9, fontWeight: "900", color: "#4b4e5a", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 },
  roleContainer: { marginBottom: 24 },
  roleRow: { flexDirection: 'row', backgroundColor: '#1c1e26', padding: 4, borderRadius: 16, borderWidth: 1, borderColor: '#2d3036' },
  roleOption: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  roleActive: { backgroundColor: '#f7a01b' },
  roleText: { fontSize: 10, fontWeight: '900', color: '#8a8d91' },
  roleTextActive: { color: '#0f1115' },
  card: { backgroundColor: "#1c1e26", borderRadius: 28, padding: 24, borderWidth: 1, borderColor: "#2d3036" },
  inputGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 9, fontWeight: "900", color: "#8a8d91", textTransform: "uppercase", marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#0f1115", borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: "#2d3036" },
  input: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "600" },
  row: { flexDirection: 'row', gap: 12 },
  submitBtn: { backgroundColor: "#f7a01b", height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center", marginTop: 10 },
  submitBtnText: { fontSize: 13, fontWeight: "900", color: "#0f1115", letterSpacing: 1 }
});