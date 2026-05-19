import BottomBar from "@/src/components/sidebar";
import { useRouter } from 'expo-router';
import {
    AlertCircle,
    CheckCircle,
    Eye, EyeOff,
    Hash,
    Lock,
    Phone,
    ShieldCheck,
    User
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator, KeyboardAvoidingView, Platform,
    ScrollView,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { useThemeColor } from '../../constants/theme';
import Api from '../../src/services/api';
import { RegisterPayload } from '../../src/types/index';
import TopBar from '../../src/components/TopBar';

export default function CreateUserPage() {
  const colors = useThemeColor();
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
      setToast({ msg: 'User added successfully', type: 'success' });
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      setToast({ msg: error.response?.data?.message || 'Registration failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Top Bar ── */}
      <TopBar
        title="Create User"
        showBack
      />

      {/* ── Toast ── */}
      {toast.msg && (
        <View style={{
          position: 'absolute', top: 80, alignSelf: 'center', zIndex: 50,
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingVertical: 12, paddingHorizontal: 20,
          borderRadius: 999, borderWidth: 1,
          backgroundColor: colors.card,
          borderColor: toast.type === 'success' ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
          shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15,
        }}>
          {toast.type === 'success'
            ? <CheckCircle size={16} color="#22c55e" />
            : <AlertCircle size={16} color="#ef4444" />
          }
          <Text style={{
            fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2,
            color: toast.type === 'success' ? "#22c55e" : "#ef4444",
          }}>
            {toast.msg}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Role Selection ── */}
          <Text style={{
            fontSize: 9, fontWeight: '800', textTransform: 'uppercase',
            letterSpacing: 3, marginBottom: 10, marginLeft: 4, color: colors.icon,
          }}>
            Authority Level
          </Text>
          <View style={{ marginBottom: 20 }}>
            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <View style={{
                  flexDirection: 'row', padding: 4, borderRadius: 18, borderWidth: 1,
                  backgroundColor: colors.card, borderColor: colors.border,
                }}>
                  {['student', 'admin'].map((role) => {
                    const isActive = value === role;
                    return (
                      <TouchableOpacity
                        key={role}
                        style={{
                          flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14,
                          backgroundColor: isActive ? colors.tint : 'transparent',
                        }}
                        onPress={() => onChange(role)}
                        activeOpacity={0.8}
                      >
                        <Text style={{
                          fontSize: 10, fontWeight: '800', letterSpacing: 2,
                          color: isActive ? '#000' : colors.icon,
                        }}>
                          {role.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
          </View>

          {/* ── Form Card ── */}
          <View style={{
            borderWidth: 1, borderRadius: 24, padding: 18,
            backgroundColor: colors.card, borderColor: colors.border,
          }}>

            <CustomInput control={control} name="name"         label="Full Name"           placeholder="e.g. Ahmed Mohamed"    icon={User} />
            <CustomInput control={control} name="email"        label="Institutional Email" placeholder="name@university.edu"  icon={ShieldCheck} />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <CustomInput control={control} name="phone_number" label="Phone"     placeholder="01xxxx" icon={Phone} />
              </View>
              {selectedRole === 'student' && (
                <View style={{ flex: 1 }}>
                  <CustomInput control={control} name="student_id" label="ID Number" placeholder="ID#"    icon={Hash} />
                </View>
              )}
            </View>

            <CustomInput
              control={control} name="password" label="Security Key"
              placeholder="••••••••" icon={Lock} secure={!showPassword}
              rightIcon={showPassword ? Eye : EyeOff}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {/* ── Submit ── */}
            <TouchableOpacity
              style={{
                height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4,
                backgroundColor: colors.tint, opacity: loading ? 0.7 : 1,
              }}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={{ fontSize: 13, fontWeight: '800', letterSpacing: 2, color: '#000' }}>
                  PROVISION ACCOUNT
                </Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomBar role="admin" />
    </View>
  );
}

// ── CustomInput ──────────────────────────────────────────────────────────────
const CustomInput = ({ control, name, label, placeholder, icon: Icon, secure, rightIcon: RightIcon, onRightIconPress }: any) => {
  const colors = useThemeColor();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{
        fontSize: 9, fontWeight: '800', textTransform: 'uppercase',
        letterSpacing: 2, marginBottom: 6, marginLeft: 4, color: colors.icon,
      }}>
        {label}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, paddingHorizontal: 14, height: 56, borderWidth: 1,
        backgroundColor: colors.background, borderColor: colors.border,
      }}>
        <Icon size={16} color={colors.icon} style={{ marginRight: 12 }} />
        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={{ flex: 1, fontSize: 13, fontWeight: '700', color: colors.text }}
              placeholder={placeholder}
              placeholderTextColor={colors.icon}
              secureTextEntry={secure}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize="none"
            />
          )}
        />
        {RightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={{ padding: 4 }}>
            <RightIcon size={16} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};