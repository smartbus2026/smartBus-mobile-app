import { useRouter } from "expo-router";
import { Edit2, Plus, Search, Shield, Trash2, User as UserIcon, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text, TextInput, TouchableOpacity,
  View
} from "react-native";
import { useThemeColor } from "../../constants/theme";
import api from "../../src/services/api";
import TopBar from "../../src/components/TopBar";

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  student_id?: string;
  phone_number?: string;
  createdAt: string;
}

export default function UsersScreen() {
  const colors = useThemeColor();
  const [users, setUsers]               = useState<User[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [searchQuery, setSearchQuery]   = useState("");
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });
  const [editingUser, setEditingUser]   = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter(); // ← أضفها هنا

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
      setToast({ msg: 'Student updated successfully', type: 'success' });
      setEditingUser(null);
      fetchUsers();
    } catch {
      setToast({ msg: 'Update failed', type: 'error' });
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
      setToast({ msg: 'Student removed', type: 'success' });
    } catch {
      setToast({ msg: 'Delete failed', type: 'error' });
    } finally {
      setConfirmDelete(null);
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.student_id && u.student_id.includes(searchQuery))
  );

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
          backgroundColor: toast.type === 'success' ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          borderColor:     toast.type === 'success' ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
        }}>
          <Text style={{
            fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2,
            color: toast.type === 'success' ? colors.success : colors.error,
          }}>
            {toast.msg}
          </Text>
        </View>
      ) : null}

      {/* ── Search + Title ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: colors.text }}>
            Directory
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}>
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon }}>
                {users.length} Users
              </Text>
            </View>
            <TouchableOpacity
              style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tint }}
              onPress={() => router.push("/(admin)/create-user" as any)}
            >
              <Plus size={20} color={colors.background} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 48, backgroundColor: colors.card }}>
          <Search size={16} color={colors.icon} />
          <TextInput
            style={{ flex: 1, fontSize: 13, fontWeight: '600', marginLeft: 10, color: colors.text }}
            placeholder="Search by name or ID..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
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
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredUsers.map((user) => (
            <View
              key={user._id}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 1,
                backgroundColor: user.role === 'admin' ? colors.tint : 'transparent',
                borderColor:     user.role === 'admin' ? colors.tint : colors.border,
              }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: user.role === 'admin' ? colors.background : colors.tint }}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', marginBottom: 4, color: colors.text }} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.icon }} numberOfLines={1}>
                  {user.student_id ? `ID: ${user.student_id}` : user.email}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <View style={{
                  paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
                  backgroundColor: user.role === 'admin' ? `${colors.tint}1A` : colors.card,
                  borderColor:     user.role === 'admin' ? `${colors.tint}4D` : colors.border,
                }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1, color: user.role === 'admin' ? colors.tint : colors.icon }}>
                    {user.role === 'admin' ? 'ADMIN' : 'STUDENT'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setEditingUser(user)}>
                    <Edit2 size={16} color={colors.icon} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setConfirmDelete(user)}>
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── Edit Modal ── */}
      <Modal visible={!!editingUser} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: "rgba(0,0,0,0.7)" }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%', backgroundColor: colors.card }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditingUser(null)} style={{ padding: 8, borderRadius: 12, backgroundColor: colors.background }}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {editingUser && (
              <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginTop: 16, color: colors.icon }}>FULL NAME</Text>
                <TextInput
                  style={{ borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 13, backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                  value={editingUser.name}
                  onChangeText={t => setEditingUser({ ...editingUser, name: t })}
                />

                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginTop: 16, color: colors.icon }}>PHONE NUMBER</Text>
                <TextInput
                  style={{ borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 13, backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                  value={editingUser.phone_number}
                  onChangeText={t => setEditingUser({ ...editingUser, phone_number: t })}
                  keyboardType="phone-pad"
                />

                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginTop: 16, color: colors.icon }}>SYSTEM ROLE</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: editingUser.role === 'student' ? `${colors.tint}0D` : colors.background, borderColor: editingUser.role === 'student' ? colors.tint : colors.border }}
                    onPress={() => setEditingUser({ ...editingUser, role: 'student' })}
                  >
                    <UserIcon size={16} color={editingUser.role === 'student' ? colors.tint : colors.icon} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: editingUser.role === 'student' ? colors.tint : colors.icon }}>Student</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: editingUser.role === 'admin' ? `${colors.tint}0D` : colors.background, borderColor: editingUser.role === 'admin' ? colors.tint : colors.border }}
                    onPress={() => setEditingUser({ ...editingUser, role: 'admin' })}
                  >
                    <Shield size={16} color={editingUser.role === 'admin' ? colors.tint : colors.icon} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: editingUser.role === 'admin' ? colors.tint : colors.icon }}>Admin</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            <View style={{ padding: 24, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
              <TouchableOpacity
                style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: colors.tint }}
                onPress={handleUpdate}
                disabled={isSubmitting}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.background }}>
                  {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal visible={!!confirmDelete} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "rgba(0,0,0,0.7)", padding: 24 }}>
          <View style={{ borderRadius: 28, padding: 24, width: '100%', alignItems: 'center', borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: "rgba(239,68,68,0.1)" }}>
              <Trash2 size={24} color={colors.error} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8, color: colors.text }}>Remove User</Text>
            <Text style={{ fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24, color: colors.icon }}>
              Are you sure you want to delete{" "}
              <Text style={{ fontWeight: '900', color: colors.text }}>{confirmDelete?.name}</Text>? This cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: colors.background }}
                onPress={() => setConfirmDelete(null)}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: colors.error }}
                onPress={executeDelete}
                disabled={isSubmitting}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: '#fff' }}>
                  {isSubmitting ? "..." : "DELETE"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}