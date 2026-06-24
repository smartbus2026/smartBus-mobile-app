import { useRouter } from "expo-router";
import {
  Edit2, Eye, EyeOff, Hash, Lock, Mail, Phone,
  Plus, Search, Shield, Trash2, User as UserIcon, Users, X
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeColor } from "../../constants/theme";
import api from "../../src/services/api";
import TopBar from "../../src/components/TopBar";

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'driver';
  student_id?: string;
  phone_number?: string;
  createdAt: string;
}

interface AddUserForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone_number: string;
  student_id: string;
  role: 'student' | 'admin' | 'driver';
}

// ─── Add User Modal ───────────────────────────────────────────────────────────
const AddUserModal: React.FC<{
  colors: any;
  onClose: () => void;
  onSuccess: () => void;
  setToast: (t: any) => void;
}> = ({ colors, onClose, onSuccess, setToast }) => {
  const [form, setForm] = useState<AddUserForm>({
    fullName: '', email: '', password: '', confirmPassword: '',
    phone_number: '', student_id: '', role: 'student',
  });
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [serverError, setServerError]     = useState<string | null>(null);
  const [errors, setErrors]               = useState<Partial<Record<keyof AddUserForm, string>>>({});

  const validate = () => {
    const e: Partial<Record<keyof AddUserForm, string>> = {};
    if (!form.fullName.trim())      e.fullName      = 'Name is required';
    if (!form.email.includes('@'))  e.email         = 'Valid email required';
    if (form.password.length < 6)   e.password      = 'Min 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.phone_number.trim())  e.phone_number  = 'Phone is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setServerError(null);
    try {
      const payload: Record<string, any> = {
        name: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        phone_number: form.phone_number,
      };
      if ((form.role === 'student' || form.role === 'driver') && form.student_id) {
        payload.student_id = form.student_id;
      }
      await api.post('/auth/register', payload);
      setToast({ msg: '✅ User added successfully', type: 'success' });
      onSuccess();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Registration failed';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const roles: { key: 'student' | 'admin' | 'driver'; label: string }[] = [
    { key: 'student', label: 'Student' },
    { key: 'admin',   label: 'Admin'   },
    { key: 'driver',  label: 'Driver'  },
  ];

  const Field: React.FC<{
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    error?: string;
    icon: React.ReactNode;
    secureTextEntry?: boolean;
    keyboardType?: any;
    rightIcon?: React.ReactNode;
  }> = ({ label, value, onChange, placeholder, error, icon, secureTextEntry, keyboardType, rightIcon }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14,
        paddingHorizontal: 14, height: 50,
        backgroundColor: colors.background,
        borderColor: error ? colors.error : colors.border,
      }}>
        <View style={{ marginRight: 10 }}>{icon}</View>
        <TextInput
          style={{ flex: 1, fontSize: 13, fontWeight: '600', color: colors.text }}
          placeholder={placeholder}
          placeholderTextColor={colors.icon}
          value={value}
          onChangeText={onChange}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
        {rightIcon}
      </View>
      {error && <Text style={{ fontSize: 10, color: colors.error, marginTop: 4, fontWeight: '700' }}>{error}</Text>}
    </View>
  );

  return (
    <Modal visible transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '92%', backgroundColor: colors.card }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: -0.5 }}>
                Add <Text style={{ color: colors.tint }}>User</Text>
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.icon, textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>
                Create a new account
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
            >
              <X size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>

            {serverError && (
              <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, backgroundColor: `${colors.error}1A`, borderColor: `${colors.error}33`, marginBottom: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.error, textAlign: 'center' }}>{serverError}</Text>
              </View>
            )}

            {/* Role Switcher */}
            <View style={{ flexDirection: 'row', gap: 8, padding: 6, borderRadius: 18, borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border, marginBottom: 20 }}>
              {roles.map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setForm({ ...form, role: key })}
                  style={{
                    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12,
                    backgroundColor: form.role === key ? colors.tint : 'transparent',
                  }}
                >
                  <Text style={{
                    fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1,
                    color: form.role === key ? colors.background : colors.icon,
                  }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Field label="Full Name" value={form.fullName} onChange={v => setForm({ ...form, fullName: v })}
              placeholder="e.g. Ahmed Mohamed" error={errors.fullName}
              icon={<UserIcon size={15} color={colors.icon} />} />

            <Field label="Institutional Email" value={form.email} onChange={v => setForm({ ...form, email: v })}
              placeholder="name@university.edu" error={errors.email}
              icon={<Mail size={15} color={colors.icon} />} keyboardType="email-address" />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Phone" value={form.phone_number} onChange={v => setForm({ ...form, phone_number: v })}
                  placeholder="01xxxxxxxxx" error={errors.phone_number}
                  icon={<Phone size={15} color={colors.icon} />} keyboardType="phone-pad" />
              </View>
              {(form.role === 'student' || form.role === 'driver') && (
                <View style={{ flex: 1 }}>
                  <Field
                    label={form.role === 'student' ? 'Student ID' : 'Driver ID'}
                    value={form.student_id} onChange={v => setForm({ ...form, student_id: v })}
                    placeholder="ID Number" error={errors.student_id}
                    icon={<Hash size={15} color={colors.icon} />} keyboardType="numeric" />
                </View>
              )}
            </View>

            <Field label="Password" value={form.password} onChange={v => setForm({ ...form, password: v })}
              placeholder="••••••••" error={errors.password} secureTextEntry={!showPassword}
              icon={<Lock size={15} color={colors.icon} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <Eye size={15} color={colors.icon} /> : <EyeOff size={15} color={colors.icon} />}
                </TouchableOpacity>
              } />

            <Field label="Confirm Password" value={form.confirmPassword} onChange={v => setForm({ ...form, confirmPassword: v })}
              placeholder="••••••••" error={errors.confirmPassword} secureTextEntry={!showConfirm}
              icon={<Lock size={15} color={colors.icon} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <Eye size={15} color={colors.icon} /> : <EyeOff size={15} color={colors.icon} />}
                </TouchableOpacity>
              } />

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer */}
          <View style={{ flexDirection: 'row', gap: 12, padding: 24, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon }}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.tint, opacity: loading ? 0.6 : 1 }}
            >
              {loading
                ? <ActivityIndicator size="small" color={colors.background} />
                : <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.background }}>ADD USER</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UsersScreen() {
  const colors   = useThemeColor();
  const router   = useRouter();

  const [users, setUsers]                   = useState<User[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedRole, setSelectedRole]     = useState<'all' | 'student' | 'admin' | 'driver'>('all');
  const [toast, setToast]                   = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });
  const [editingUser, setEditingUser]       = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete]   = useState<User | null>(null);
  const [showAddUser, setShowAddUser]       = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (toast.msg) {
      const t = setTimeout(() => setToast({ msg: '', type: null }), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleUpdate = async () => {
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      await api.put(`/users/${editingUser._id}`, {
        name: editingUser.name,
        phone_number: editingUser.phone_number,
        role: editingUser.role,
      });
      setToast({ msg: '✅ User updated successfully', type: 'success' });
      setEditingUser(null);
      fetchUsers();
    } catch {
      setToast({ msg: '❌ Update failed', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/users/${confirmDelete._id}`);
      setUsers(users.filter(u => u._id !== confirmDelete._id));
      setToast({ msg: '🗑️ User removed', type: 'success' });
    } catch {
      setToast({ msg: '❌ Delete failed', type: 'error' });
    } finally {
      setConfirmDelete(null);
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.student_id && u.student_id.includes(searchQuery)) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const roleBadgeColor = (role: string) => {
    if (role === 'admin')  return { bg: `${colors.tint}1A`,  border: `${colors.tint}4D`,  text: colors.tint  };
    if (role === 'driver') return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#F59E0B' };
    return { bg: colors.card, border: colors.border, text: colors.icon };
  };

  const ROLES = [
    { key: 'all',     label: 'All'     },
    { key: 'student', label: 'Student' },
    { key: 'admin',   label: 'Admin'   },
    { key: 'driver',  label: 'Driver'  },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Top Bar ── */}
      <TopBar
        title="Users"
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(admin)/settings' as any)}
      />

      {/* ── Toast ── */}
      {toast.msg ? (
        <View style={{
          position: 'absolute', top: 70, alignSelf: 'center', zIndex: 50,
          paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1,
          backgroundColor: toast.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          borderColor:     toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
        }}>
          <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: toast.type === 'success' ? colors.success : colors.error }}>
            {toast.msg}
          </Text>
        </View>
      ) : null}

      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>

        {/* Title Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '900', letterSpacing: -0.5, color: colors.text, textTransform: 'uppercase' }}>
              Directory
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.icon, textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>
              Manage accounts
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}>
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon }}>
                {users.length} Users
              </Text>
            </View>
            <TouchableOpacity
              style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tint }}
              onPress={() => setShowAddUser(true)}
            >
              <Plus size={20} color={colors.background} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 48, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
          <Search size={16} color={colors.icon} />
          <TextInput
            style={{ flex: 1, fontSize: 13, fontWeight: '600', marginLeft: 10, color: colors.text }}
            placeholder="Search by name, ID or email..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        {/* Role Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {ROLES.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setSelectedRole(key)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
                  backgroundColor: selectedRole === key ? colors.tint : colors.card,
                  borderColor:     selectedRole === key ? colors.tint : colors.border,
                }}
              >
                <Text style={{
                  fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1,
                  color: selectedRole === key ? colors.background : colors.icon,
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* ── Users List ── */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.icon }}>No records found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {filteredUsers.map((user) => {
            const badge = roleBadgeColor(user.role);
            return (
              <View
                key={user._id}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
              >
                {/* Avatar */}
                <View style={{
                  width: 46, height: 46, borderRadius: 14,
                  alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 1,
                  backgroundColor: user.role === 'admin' ? `${colors.tint}1A` : colors.card,
                  borderColor:     user.role === 'admin' ? `${colors.tint}33` : colors.border,
                }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: colors.tint }}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 3 }} numberOfLines={1}>
                    {user.name}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: colors.icon }} numberOfLines={1}>
                    {user.student_id ? `ID: ${user.student_id}` : user.email}
                  </Text>
                </View>

                {/* Right Side */}
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  {/* Badge */}
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, backgroundColor: badge.bg, borderColor: badge.border }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1, color: badge.text, textTransform: 'uppercase' }}>
                      {user.role}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    {/* View Profile — student or driver */}
                    {(user.role === 'student' || user.role === 'driver') && (
                      <TouchableOpacity
                        onPress={() =>
                          router.push(
                            (user.role === 'student'
                              ? `/(admin)/students/${user._id}`
                              : `/(admin)/drivers/${user._id}`) as any
                          )
                        }
                      >
                        <Users size={16} color={colors.tint} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => setEditingUser(user)}>
                      <Edit2 size={16} color={colors.icon} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setConfirmDelete(user)}>
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Add User Modal ── */}
      {showAddUser && (
        <AddUserModal
          colors={colors}
          onClose={() => setShowAddUser(false)}
          onSuccess={fetchUsers}
          setToast={setToast}
        />
      )}

      {/* ── Edit Modal ── */}
      <Modal visible={!!editingUser} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%', backgroundColor: colors.card }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, textTransform: 'uppercase' }}>
                  Edit <Text style={{ color: colors.tint }}>User</Text>
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.icon, textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>
                  Update profile info
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditingUser(null)}
                style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
              >
                <X size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {editingUser && (
              <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>

                {/* Full Name */}
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 8 }}>FULL NAME</Text>
                <TextInput
                  style={{ borderWidth: 1, borderRadius: 14, padding: 16, fontSize: 13, backgroundColor: colors.background, borderColor: colors.border, color: colors.text, marginBottom: 16 }}
                  value={editingUser.name}
                  onChangeText={t => setEditingUser({ ...editingUser, name: t })}
                />

                {/* Phone */}
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 8 }}>PHONE NUMBER</Text>
                <TextInput
                  style={{ borderWidth: 1, borderRadius: 14, padding: 16, fontSize: 13, backgroundColor: colors.background, borderColor: colors.border, color: colors.text, marginBottom: 16 }}
                  value={editingUser.phone_number}
                  onChangeText={t => setEditingUser({ ...editingUser, phone_number: t })}
                  keyboardType="phone-pad"
                />

                {/* Student ID (locked) */}
                {editingUser.student_id && (
                  <>
                    <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 8, opacity: 0.5 }}>
                      {editingUser.role === 'driver' ? 'DRIVER ID (LOCKED)' : 'STUDENT ID (LOCKED)'}
                    </Text>
                    <TextInput
                      style={{ borderWidth: 1, borderRadius: 14, padding: 16, fontSize: 13, backgroundColor: colors.card, borderColor: colors.border, color: colors.icon, marginBottom: 16, opacity: 0.5 }}
                      value={editingUser.student_id}
                      editable={false}
                    />
                  </>
                )}

                {/* System Role */}
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 8 }}>SYSTEM ROLE</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
                  {(['student', 'admin', 'driver'] as const).map((role) => {
                    const Icon = role === 'admin' ? Shield : role === 'driver' ? Users : UserIcon;
                    const active = editingUser.role === role;
                    return (
                      <TouchableOpacity
                        key={role}
                        onPress={() => setEditingUser({ ...editingUser, role })}
                        style={{
                          flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                          borderWidth: 1, paddingVertical: 14, borderRadius: 14,
                          backgroundColor: active ? `${colors.tint}0D` : colors.background,
                          borderColor:     active ? colors.tint : colors.border,
                        }}
                      >
                        <Icon size={14} color={active ? colors.tint : colors.icon} />
                        <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: active ? colors.tint : colors.icon }}>
                          {role}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            <View style={{ padding: 24, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
              <TouchableOpacity
                style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: colors.tint, opacity: isSubmitting ? 0.6 : 1 }}
                onPress={handleUpdate}
                disabled={isSubmitting}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.background }}>
                  {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal visible={!!confirmDelete} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 24 }}>
          <View style={{ borderRadius: 28, padding: 28, width: '100%', alignItems: 'center', borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: 'rgba(239,68,68,0.1)' }}>
              <Trash2 size={24} color={colors.error} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8, color: colors.text }}>Remove User</Text>
            <Text style={{ fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24, color: colors.icon }}>
              Are you sure you want to delete{' '}
              <Text style={{ fontWeight: '900', color: colors.text }}>{confirmDelete?.name}</Text>?{' '}
              This cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                onPress={() => setConfirmDelete(null)}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: colors.error, opacity: isSubmitting ? 0.6 : 1 }}
                onPress={executeDelete}
                disabled={isSubmitting}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: '#fff' }}>
                  {isSubmitting ? '...' : 'DELETE'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}