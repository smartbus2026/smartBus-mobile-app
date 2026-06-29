// app/(admin)/create-user.tsx
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {
  AlertCircle, CheckCircle, Eye, EyeOff,
  Hash, Lock, Phone, ShieldCheck, User, UserPlus,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import Api from '../../src/services/api';
import { RegisterPayload } from '../../src/types/index';
import TopBar from '../../src/components/TopBar';
import BottomBar from '@/src/components/sidebar';

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  icon: React.ReactNode; title: string; subtitle: string;
  children: React.ReactNode; colors: any;
}> = ({ icon, title, subtitle, children, colors }) => (
  <View style={{
    borderRadius: 24, borderWidth: 1, padding: 24, marginBottom: 16,
    backgroundColor: colors.card, borderColor: colors.border,
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
      <View style={{
        width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
      }}>
        {icon}
      </View>
      <View>
        <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>
          {title}
        </Text>
        <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
    </View>
    {children}
  </View>
);

// ─── Field ────────────────────────────────────────────────────────────────────
const Field: React.FC<{
  control: any; name: string; label: string; placeholder: string;
  icon: any; secure?: boolean; rightIcon?: any; onRightIconPress?: () => void; colors: any;
}> = ({ control, name, label, placeholder, icon: Icon, secure, rightIcon: RightIcon, onRightIconPress, colors }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 8 }}>
      {label}
    </Text>
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, height: 52,
      backgroundColor: colors.background, borderColor: colors.border,
    }}>
      <Icon size={16} color={colors.icon} />
      <Controller
        control={control} name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text }}
            placeholder={placeholder} placeholderTextColor={colors.icon}
            secureTextEntry={secure} onBlur={onBlur}
            onChangeText={onChange} value={value} autoCapitalize="none"
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

export default function CreateUserPage() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });

  const { control, handleSubmit, watch } = useForm<RegisterPayload & { role: 'student' | 'admin' }>({
    defaultValues: { role: 'student', name: '', email: '', password: '', phone_number: '', student_id: '' },
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
      setToast({ msg: 'Name, Email and Password are required', type: 'error' }); return;
    }
    setLoading(true);
    try {
      await Api.post('/auth/register', {
        name: data.name, email: data.email, password: data.password, role: data.role,
        phone_number: data.phone_number,
        ...(data.role === 'student' ? { student_id: data.student_id } : {}),
      });
      setToast({ msg: 'User added successfully', type: 'success' });
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      setToast({ msg: error.response?.data?.message || 'Registration failed.', type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Create User" showBack />

      {/* Toast */}
      {toast.msg && (
        <View style={{
          position: 'absolute', top: 80, alignSelf: 'center', zIndex: 50,
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1,
          backgroundColor: toast.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          borderColor: toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
        }}>
          {toast.type === 'success'
            ? <CheckCircle size={14} color="#22c55e" />
            : <AlertCircle size={14} color="#ef4444" />
          }
          <Text style={{
            fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1,
            color: toast.type === 'success' ? '#22c55e' : '#ef4444',
          }}>
            {toast.msg}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, color: colors.text }}>
              CREATE{' '}<Text style={{ color: colors.tint }}>USER</Text>
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginTop: 2 }}>
              PROVISION NEW ACCOUNT
            </Text>
          </View>

          {/* ── Role Selection ── */}
          <SectionCard icon={<ShieldCheck size={22} color={colors.tint} />} title="Authority Level" subtitle="Select User Role" colors={colors}>
            <Controller
              control={control} name="role"
              render={({ field: { onChange, value } }) => (
                <View style={{
                  flexDirection: 'row', padding: 4, borderRadius: 16, borderWidth: 1,
                  backgroundColor: colors.background, borderColor: colors.border,
                }}>
                  {['student', 'admin'].map(role => {
                    const isActive = value === role;
                    return (
                      <TouchableOpacity
                        key={role} activeOpacity={0.8} onPress={() => onChange(role)}
                        style={{
                          flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12,
                          backgroundColor: isActive ? colors.tint : 'transparent',
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: isActive ? '#000' : colors.icon }}>
                          {role.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
          </SectionCard>

          {/* ── Form ── */}
          <SectionCard icon={<UserPlus size={22} color={colors.tint} />} title="Account Details" subtitle="Personal Information" colors={colors}>
            <Field control={control} name="name"         label="Full Name"           placeholder="e.g. Ahmed Mohamed"   icon={User}       colors={colors} />
            <Field control={control} name="email"        label="Institutional Email" placeholder="name@university.edu"  icon={ShieldCheck} colors={colors} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field control={control} name="phone_number" label="Phone"     placeholder="01xxxx" icon={Phone} colors={colors} />
              </View>
              {selectedRole === 'student' && (
                <View style={{ flex: 1 }}>
                  <Field control={control} name="student_id"  label="ID Number" placeholder="ID#"    icon={Hash}  colors={colors} />
                </View>
              )}
            </View>
            <Field
              control={control} name="password" label="Security Key"
              placeholder="••••••••" icon={Lock} secure={!showPassword}
              rightIcon={showPassword ? Eye : EyeOff}
              onRightIconPress={() => setShowPassword(!showPassword)}
              colors={colors}
            />

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)} disabled={loading} activeOpacity={0.85}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                paddingVertical: 14, borderRadius: 14, marginTop: 8,
                backgroundColor: colors.tint, opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? <ActivityIndicator color="#000" />
                : <><UserPlus size={16} color="#000" /><Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#000' }}>PROVISION ACCOUNT</Text></>
              }
            </TouchableOpacity>
          </SectionCard>

        </ScrollView>
      </KeyboardAvoidingView>

      <BottomBar role="admin" />
    </View>
  );
}