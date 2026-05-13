import React, { useState, useEffect } from 'react';
import BottomBar from "@/src/components/bar";
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { 
  User, Phone, Hash, ShieldCheck, Lock, 
  Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft 
} from 'lucide-react-native';
import Api from '../../src/services/api'; 
import { RegisterPayload } from '../../src/types/index'; 
import { useRouter } from 'expo-router';
import Appbar from '../../src/components/bar';
import { useThemeColor } from '../../constants/theme'; // 🟢 استدعاء الهوك

export default function CreateUserPage() {
  const colors = useThemeColor(); // 🟢 سحب الألوان
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      
      {/* Toast */}
      {toast.msg && (
        <View 
          className="absolute top-[60px] self-center z-50 flex-row items-center gap-2.5 py-3 px-5 rounded-full border shadow-lg"
          style={{
            backgroundColor: colors.card,
            borderColor: toast.type === 'success' ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
            shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15
          }}
        >
          {toast.type === 'success' ? <CheckCircle size={16} color={colors.success || "#22c55e"} /> : <AlertCircle size={16} color={colors.error || "#ef4444"} />}
          <Text 
            className="text-[11px] font-black uppercase tracking-widest"
            style={{ color: toast.type === 'success' ? (colors.success || "#22c55e") : (colors.error || "#ef4444") }}
          >
            {toast.msg}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 120 }} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center gap-4 mb-8 mt-2">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="w-10 h-10 rounded-xl items-center justify-center border"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
            <View>
              <Text className="text-[26px] font-black tracking-tight" style={{ color: colors.text }}>
                New <Text style={{ color: colors.tint }}>Identity</Text>
              </Text>
              <Text className="text-[11px] font-bold uppercase mt-1" style={{ color: colors.icon }}>
                Create a new system account
              </Text>
            </View>
          </View>

          {/* Role Selection */}
          <Text className="text-[9px] font-black uppercase tracking-widest mb-3 ml-1" style={{ color: colors.icon }}>
            Authority Level
          </Text>
          <View className="mb-6">
            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <View 
                  className="flex-row p-1 rounded-2xl border"
                  style={{ backgroundColor: colors.card, borderColor: colors.border }}
                >
                  {['student', 'admin'].map((role) => {
                    const isActive = value === role;
                    return (
                      <TouchableOpacity
                        key={role}
                        className="flex-1 py-3 items-center justify-center rounded-xl"
                        style={{ backgroundColor: isActive ? colors.tint : "transparent" }}
                        onPress={() => onChange(role)}
                        activeOpacity={0.8}
                      >
                        <Text 
                          className="text-[10px] font-black tracking-widest"
                          style={{ color: isActive ? colors.background : colors.icon }}
                        >
                          {role.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
          </View>

          {/* Form Fields Card */}
          <View 
            className="rounded-[28px] p-6 border shadow-sm"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <CustomInput control={control} name="name" label="Full Name" placeholder="e.g. Ahmed Mohamed" icon={User} />
            <CustomInput control={control} name="email" label="Institutional Email" placeholder="name@university.edu" icon={ShieldCheck} />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <CustomInput control={control} name="phone_number" label="Phone" placeholder="01xxxx" icon={Phone} />
              </View>
              {selectedRole === 'student' && (
                <View className="flex-1">
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
              className="h-[60px] rounded-[18px] items-center justify-center mt-3"
              style={{ backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 }}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text className="text-[13px] font-black tracking-widest" style={{ color: colors.background }}>
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

// 🟢 CustomInput Component (استخدمنا فيه نفس الهوك عشان يبقى لونه ديناميك)
const CustomInput = ({ control, name, label, placeholder, icon: Icon, secure, rightIcon: RightIcon, onRightIconPress }: any) => {
  const colors = useThemeColor(); // سحب الألوان جوه الكومبوننت الفرعي
  
  return (
    <View className="mb-5">
      <Text className="text-[9px] font-black uppercase tracking-widest mb-2 ml-1" style={{ color: colors.icon }}>
        {label}
      </Text>
      <View 
        className="flex-row items-center rounded-2xl px-4 h-14 border"
        style={{ backgroundColor: colors.background, borderColor: colors.border }}
      >
        <Icon size={16} color={colors.icon} style={{ marginRight: 12 }} />
        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="flex-1 text-[13px] font-bold"
              style={{ color: colors.text }}
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
          <TouchableOpacity onPress={onRightIconPress} className="p-1">
            <RightIcon size={16} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};