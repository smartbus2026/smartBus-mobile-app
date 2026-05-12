import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView,
  Modal, KeyboardAvoidingView, Platform
} from "react-native";
import { Search, X, Edit2, Trash2, Shield, User as UserIcon, Plus } from "lucide-react-native";
import { router } from "expo-router";
import api from "../../src/services/api";
import Appbar from "../../src/components/bar";
import { useThemeColor } from "../../constants/theme"; // استدعاء الهوك بتاع الألوان

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
  const colors = useThemeColor(); // سحب الألوان الديناميكية
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        role: editingUser.role
      });
      setToast({ msg: 'Student updated successfully', type: 'success' });
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
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
    } catch (error) {
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>

      {/* Toast */}
      {toast.msg ? (
        <View
          className="absolute top-15 self-center z-50 py-2.5 px-5 rounded-[20px] border"
          style={{
            backgroundColor: toast.type === 'success' ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            borderColor: toast.type === 'success' ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"
          }}
        >
          <Text
            className="text-[11px] font-extrabold uppercase tracking-widest"
            style={{ color: toast.type === 'success' ? colors.success : colors.error }}
          >
            {toast.msg}
          </Text>
        </View>
      ) : null}

      {/* Header */}
      <View className="p-5 pt-15" style={{ backgroundColor: colors.background }}>
        <View className="flex-row justify-between items-center mb-5">
          <Text className="text-[28px] font-black tracking-tighter" style={{ color: colors.text }}>
            Directory
          </Text>
          <View className="flex-row items-center gap-2.5">
            <View className="px-3 py-1.5 rounded-xl border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <Text className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: colors.icon }}>
                {users.length} Users
              </Text>
            </View>
            <TouchableOpacity
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.tint }}
              onPress={() => router.push("/(admin)/create-user" as any)}
            >
              <Plus size={20} color={colors.background} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center rounded-2xl px-4 h-12" style={{ backgroundColor: colors.card }}>
          <Search size={16} color={colors.icon} />
          <TextInput
            className="flex-1 text-[13px] font-semibold ml-2.5"
            style={{ color: colors.text }}
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

      {/* Users List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : filteredUsers.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-sm font-semibold" style={{ color: colors.icon }}>No records found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {filteredUsers.map((user) => (
            <View key={user._id} className="flex-row items-center py-4 border-b" style={{ borderBottomColor: colors.border }}>

              <View
                className="w-11 h-11 rounded-full items-center justify-center mr-3.5 border"
                style={{
                  backgroundColor: user.role === 'admin' ? colors.tint : "transparent",
                  borderColor: user.role === 'admin' ? colors.tint : colors.border
                }}
              >
                <Text
                  className="text-lg font-black"
                  style={{ color: user.role === 'admin' ? colors.background : colors.tint }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View className="flex-1 justify-center">
                <Text className="text-[15px] font-bold mb-1 tracking-tight" style={{ color: colors.text }} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text className="text-xs font-medium" style={{ color: colors.icon }} numberOfLines={1}>
                  {user.student_id ? `ID: ${user.student_id}` : user.email}
                </Text>
              </View>

              <View className="items-end justify-center gap-2">
                <View
                  className="px-2 py-1 rounded-md border"
                  style={{
                    backgroundColor: user.role === 'admin' ? `${colors.tint}1A` : colors.card,
                    borderColor: user.role === 'admin' ? `${colors.tint}4D` : colors.border
                  }}
                >
                  <Text
                    className="text-[8px] font-black tracking-wider"
                    style={{ color: user.role === 'admin' ? colors.tint : colors.icon }}
                  >
                    {user.role === 'admin' ? 'ADMIN' : 'STUDENT'}
                  </Text>
                </View>
                <View className="flex-row gap-3 items-center">
                  <TouchableOpacity className="p-1" onPress={() => setEditingUser(user)}>
                    <Edit2 size={16} color={colors.icon} />
                  </TouchableOpacity>
                  <TouchableOpacity className="p-1" onPress={() => setConfirmDelete(user)}>
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          ))}
        </ScrollView>
      )}

      {/* Edit Modal */}
      <Modal visible={!!editingUser} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="rounded-t-[32px] max-h-[85%]" style={{ backgroundColor: colors.card }}>

            <View className="flex-row justify-between items-center p-6 border-b" style={{ borderBottomColor: colors.border }}>
              <Text className="text-lg font-extrabold" style={{ color: colors.text }}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditingUser(null)} className="p-2 rounded-xl" style={{ backgroundColor: colors.background }}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {editingUser && (
              <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
                <Text className="text-[10px] font-extrabold tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>FULL NAME</Text>
                <TextInput
                  className="border rounded-2xl p-4 text-sm"
                  style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                  value={editingUser.name}
                  onChangeText={t => setEditingUser({ ...editingUser, name: t })}
                />

                <Text className="text-[10px] font-extrabold tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>PHONE NUMBER</Text>
                <TextInput
                  className="border rounded-2xl p-4 text-sm"
                  style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                  value={editingUser.phone_number}
                  onChangeText={t => setEditingUser({ ...editingUser, phone_number: t })}
                  keyboardType="phone-pad"
                />

                <Text className="text-[10px] font-extrabold tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>SYSTEM ROLE</Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 border py-4 rounded-2xl"
                    style={{
                      backgroundColor: editingUser.role === 'student' ? `${colors.tint}0D` : colors.background,
                      borderColor: editingUser.role === 'student' ? colors.tint : colors.border
                    }}
                    onPress={() => setEditingUser({ ...editingUser, role: 'student' })}
                  >
                    <UserIcon size={16} color={editingUser.role === 'student' ? colors.tint : colors.icon} />
                    <Text className="text-xs font-bold" style={{ color: editingUser.role === 'student' ? colors.tint : colors.icon }}>Student</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 border py-4 rounded-2xl"
                    style={{
                      backgroundColor: editingUser.role === 'admin' ? `${colors.tint}0D` : colors.background,
                      borderColor: editingUser.role === 'admin' ? colors.tint : colors.border
                    }}
                    onPress={() => setEditingUser({ ...editingUser, role: 'admin' })}
                  >
                    <Shield size={16} color={editingUser.role === 'admin' ? colors.tint : colors.icon} />
                    <Text className="text-xs font-bold" style={{ color: editingUser.role === 'admin' ? colors.tint : colors.icon }}>Admin</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            <View className="p-6 border-t" style={{ borderTopColor: colors.border, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
              <TouchableOpacity
                className="py-4 rounded-2xl items-center"
                style={{ backgroundColor: colors.tint }}
                onPress={handleUpdate}
                disabled={isSubmitting}
              >
                <Text className="text-[13px] font-extrabold tracking-widest" style={{ color: colors.background }}>
                  {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
                </Text>
              </TouchableOpacity>
            </View>

          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={!!confirmDelete} transparent animationType="fade">
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
          <View className="rounded-[28px] p-6 m-6 border items-center w-[85%]" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <View className="w-14 h-14 rounded-full items-center justify-center mb-4" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
              <Trash2 size={24} color={colors.error} />
            </View>
            <Text className="text-lg font-extrabold mb-2" style={{ color: colors.text }}>Remove User</Text>
            <Text className="text-[13px] text-center leading-5 mb-6" style={{ color: colors.icon }}>
              Are you sure you want to delete{" "}
              <Text className="font-black" style={{ color: colors.text }}>{confirmDelete?.name}</Text>? This cannot be undone.
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-2xl items-center"
                style={{ backgroundColor: colors.background }}
                onPress={() => setConfirmDelete(null)}
              >
                <Text className="text-[11px] font-extrabold tracking-widest" style={{ color: colors.icon }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-2xl items-center"
                style={{ backgroundColor: colors.error }}
                onPress={executeDelete}
                disabled={isSubmitting}
              >
                <Text className="text-[11px] font-extrabold tracking-widest text-white">
                  {isSubmitting ? "..." : "DELETE"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Appbar />
    </View>
  );
}