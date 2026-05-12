import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, StyleSheet,
  Modal, KeyboardAvoidingView, Platform
} from "react-native";
import { Search, X, Edit2, Trash2, Shield, User as UserIcon, MoreVertical } from "lucide-react-native";
import api from "../../src/services/api";
import Appbar from "../../src/components/bar";


// --- Types ---
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
    <View style={styles.container}>
      
      {/* --- Toast --- */}
      {toast.msg ? (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={[styles.toastText, toast.type === 'success' ? {color: "#22c55e"} : {color: "#ef4444"}]}>
            {toast.msg}
          </Text>
        </View>
      ) : null}

      {/* --- Header --- */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Directory</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{users.length} Users</Text>
          </View>
        </View>
        
        <View style={styles.searchBox}>
          <Search size={16} color="#8a8d91" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or ID..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color="#8a8d91" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* --- Users List (Clean Layout) --- */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#f7a01b" />
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No records found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredUsers.map((user) => (
            <View key={user._id} style={styles.userRow}>
              
              {/* Avatar */}
              <View style={[styles.avatar, user.role === 'admin' ? styles.avatarAdmin : styles.avatarStudent]}>
                <Text style={[styles.avatarText, user.role === 'admin' ? {color: "#0f1115"} : {color: "#f7a01b"}]}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                <Text style={styles.userSub} numberOfLines={1}>
                  {user.student_id ? `ID: ${user.student_id}` : user.email}
                </Text>
              </View>

              {/* Actions & Role */}
              <View style={styles.actionColumn}>
                <View style={[styles.roleBadge, user.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeStudent]}>
                  <Text style={[styles.roleText, user.role === 'admin' ? {color: "#f7a01b"} : {color: "#8a8d91"}]}>
                    {user.role === 'admin' ? 'ADMIN' : 'STUDENT'}
                  </Text>
                </View>
                
                <View style={styles.actionIcons}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => setEditingUser(user)}>
                    <Edit2 size={16} color="#8a8d91" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => setConfirmDelete(user)}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          ))}
        </ScrollView>
      )}

      {/* --- Edit Modal (Same clean logic) --- */}
      <Modal visible={!!editingUser} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditingUser(null)} style={styles.closeBtn}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {editingUser && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <TextInput
                  style={styles.input}
                  value={editingUser.name}
                  onChangeText={t => setEditingUser({...editingUser, name: t})}
                />

                <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                <TextInput
                  style={styles.input}
                  value={editingUser.phone_number}
                  onChangeText={t => setEditingUser({...editingUser, phone_number: t})}
                  keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>SYSTEM ROLE</Text>
                <View style={styles.roleSelector}>
                  <TouchableOpacity 
                    style={[styles.roleOption, editingUser.role === 'student' && styles.roleOptionActive]}
                    onPress={() => setEditingUser({...editingUser, role: 'student'})}
                  >
                    <UserIcon size={16} color={editingUser.role === 'student' ? "#f7a01b" : "#8a8d91"} />
                    <Text style={[styles.roleOptionText, editingUser.role === 'student' && {color: "#f7a01b"}]}>Student</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleOption, editingUser.role === 'admin' && styles.roleOptionActive]}
                    onPress={() => setEditingUser({...editingUser, role: 'admin'})}
                  >
                    <Shield size={16} color={editingUser.role === 'admin' ? "#f7a01b" : "#8a8d91"} />
                    <Text style={[styles.roleOptionText, editingUser.role === 'admin' && {color: "#f7a01b"}]}>Admin</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleUpdate}
                disabled={isSubmitting}
              >
                <Text style={styles.saveBtnText}>{isSubmitting ? "SAVING..." : "SAVE CHANGES"}</Text>
              </TouchableOpacity>
            </View>

          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* --- Delete Alert --- */}
      <Modal visible={!!confirmDelete} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertModal}>
            <View style={styles.alertIcon}>
              <Trash2 size={24} color="#ef4444" />
            </View>
            <Text style={styles.alertTitle}>Remove User</Text>
            <Text style={styles.alertMessage}>
              Are you sure you want to delete <Text style={{color: "#fff", fontWeight: "900"}}>{confirmDelete?.name}</Text>? This cannot be undone.
            </Text>
            
            <View style={styles.alertActions}>
              <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setConfirmDelete(null)}>
                <Text style={styles.alertCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.alertDeleteBtn} onPress={executeDelete} disabled={isSubmitting}>
                <Text style={styles.alertDeleteText}>{isSubmitting ? "..." : "DELETE"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Appbar />

    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1115" },
  
  // Toast
  toast: { position: "absolute", top: 60, alignSelf: "center", zIndex: 100, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1 },
  toastSuccess: { backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)" },
  toastError: { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" },
  toastText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },

  // Header
  header: { padding: 20, paddingTop: 60, backgroundColor: "#0f1115" },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  countBadge: { backgroundColor: "#1c1e26", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: "#2d3036" },
  countText: { color: "#8a8d91", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#1c1e26", borderRadius: 16, paddingHorizontal: 16, height: 50 },
  searchInput: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "600", marginLeft: 10 },

  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#6b7280", fontSize: 14, fontWeight: "600" },

  // List Layout
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  userRow: { 
    flexDirection: "row", alignItems: "center", paddingVertical: 16, 
    borderBottomWidth: 1, borderBottomColor: "rgba(45,48,54,0.6)" 
  },
  
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", marginRight: 14 },
  avatarStudent: { backgroundColor: "rgba(247,160,27,0.1)", borderWidth: 1, borderColor: "rgba(247,160,27,0.2)" },
  avatarAdmin: { backgroundColor: "#f7a01b" },
  avatarText: { fontSize: 18, fontWeight: "900" },
  
  userInfo: { flex: 1, justifyContent: "center" },
  userName: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 4, letterSpacing: -0.3 },
  userSub: { color: "#8a8d91", fontSize: 12, fontWeight: "500" },

  actionColumn: { alignItems: "flex-end", justifyContent: "center", gap: 8 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  roleBadgeAdmin: { backgroundColor: "rgba(247,160,27,0.1)", borderColor: "rgba(247,160,27,0.3)" },
  roleBadgeStudent: { backgroundColor: "#1c1e26", borderColor: "#2d3036" },
  roleText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  
  actionIcons: { flexDirection: "row", gap: 12, alignItems: "center" },
  iconBtn: { padding: 4 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#1c1e26", borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24, borderBottomWidth: 1, borderBottomColor: "#2d3036" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  closeBtn: { backgroundColor: "#262a33", padding: 8, borderRadius: 12 },
  
  modalBody: { padding: 24 },
  inputLabel: { fontSize: 10, fontWeight: "800", color: "#8a8d91", letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: "#0f1115", borderWidth: 1, borderColor: "#2d3036", borderRadius: 16, color: "#fff", padding: 16, fontSize: 14 },
  
  roleSelector: { flexDirection: "row", gap: 12 },
  roleOption: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#0f1115", borderWidth: 1, borderColor: "#2d3036", paddingVertical: 16, borderRadius: 16 },
  roleOptionActive: { borderColor: "#f7a01b", backgroundColor: "rgba(247,160,27,0.05)" },
  roleOptionText: { fontSize: 12, fontWeight: "700", color: "#8a8d91" },

  modalFooter: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopWidth: 1, borderTopColor: "#2d3036" },
  saveBtn: { backgroundColor: "#f7a01b", paddingVertical: 18, borderRadius: 16, alignItems: "center" },
  saveBtnText: { color: "#0f1115", fontSize: 13, fontWeight: "800", letterSpacing: 1 },

  // Alert Modal
  alertModal: { backgroundColor: "#1c1e26", borderRadius: 28, padding: 24, margin: 24, borderWidth: 1, borderColor: "#2d3036", alignItems: "center" },
  alertIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  alertTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 8 },
  alertMessage: { fontSize: 13, color: "#8a8d91", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  alertActions: { flexDirection: "row", gap: 12, width: "100%" },
  alertCancelBtn: { flex: 1, backgroundColor: "#262a33", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  alertCancelText: { color: "#8a8d91", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  alertDeleteBtn: { flex: 1, backgroundColor: "#ef4444", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  alertDeleteText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
});