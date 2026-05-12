import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, StyleSheet,
  Modal, KeyboardAvoidingView, Platform
} from "react-native";
import { 
  Search, X, Trash2, MapPin, Plus, 
  ChevronDown, ChevronUp, Map as MapIcon, Route as RouteIcon
} from "lucide-react-native";
import MapView, { Marker } from 'react-native-maps';
import api from "../../src/services/api";
import Appbar from "../../src/components/bar";


const ASWAN_CENTER = {
  latitude: 24.0889,
  longitude: 32.8998,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function ManageRoutesScreen() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'route' | 'stop'; routeId: string; stopId?: string; stopName?: string } | null>(null);
  
  const [quickAddId, setQuickAddId] = useState<string | null>(null);
  const [newStopName, setNewStopName] = useState('');

  // UX Improvement: Track expanded cards
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', distance: '', duration: '', startTime: '07:30',
    startLocation: { latitude: ASWAN_CENTER.latitude, longitude: ASWAN_CENTER.longitude },
    stops: ['']
  });

  useEffect(() => { fetchRoutes(); }, []);

  useEffect(() => {
    if (toast.msg) {
      const t = setTimeout(() => setToast({ msg: '', type: null }), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchRoutes = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/routes');
      setRoutes(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!form.name.trim() || form.stops.some(s => !s.trim())) {
      setToast({ msg: 'Please fill all required fields', type: 'error' });
      return;
    }
    setIsDeploying(true);
    try {
      const payload = {
        ...form,
        startLocation: { lat: form.startLocation.latitude, lng: form.startLocation.longitude }
      };
      await api.post('/routes', payload);
      await fetchRoutes();
      setIsModalOpen(false);
      setForm({ name: '', distance: '', duration: '', startTime: '07:30', startLocation: { latitude: ASWAN_CENTER.latitude, longitude: ASWAN_CENTER.longitude }, stops: [''] });
      setToast({ msg: 'Route deployed successfully', type: 'success' });
    } catch (e) { 
      setToast({ msg: 'Deployment failed', type: 'error' }); 
    } finally { 
      setIsDeploying(false); 
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === 'route') {
        await api.delete(`/routes/${confirmDelete.routeId}`);
        setRoutes(prev => prev.filter(r => r._id !== confirmDelete.routeId));
        setToast({ msg: 'Route deleted', type: 'success' });
      } else {
        await api.delete(`/routes/${confirmDelete.routeId}/remove-stop/${confirmDelete.stopId}`);
        await fetchRoutes();
        setToast({ msg: `Stop removed`, type: 'success' });
      }
    } catch (e) { 
      setToast({ msg: 'Delete failed', type: 'error' }); 
    } finally { 
      setConfirmDelete(null); 
    }
  };

  const handleQuickAddStop = async (routeId: string) => {
    if (!newStopName.trim()) return;
    try {
      await api.post(`/routes/${routeId}/stops`, { stop_name: newStopName, lat: 0, lng: 0 });
      await fetchRoutes();
      setNewStopName('');
      setQuickAddId(null);
      setToast({ msg: 'Stop added', type: 'success' });
    } catch (e) { 
      setToast({ msg: 'Failed to add stop', type: 'error' }); 
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRouteId(expandedRouteId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      
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
          <View>
            <Text style={styles.headerTitle}>Network Routes</Text>
            <Text style={styles.headerSubtitle}>Manage operating sectors</Text>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={() => setIsModalOpen(true)}>
            <Plus size={20} color="#0f1115" />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Main Content --- */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#f7a01b" />
        </View>
      ) : routes.length === 0 ? (
        <View style={styles.centerContainer}>
          <RouteIcon size={48} color="#8a8d91" style={{ opacity: 0.3, marginBottom: 16 }} />
          <Text style={styles.emptyText}>No routes mapped yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {routes.map((route) => {
            const isExpanded = expandedRouteId === route._id;
            const startStop = route.stops?.[0]?.name || route.stops?.[0] || 'Start';
            const endStop = route.stops?.[route.stops?.length - 1]?.name || route.stops?.[route.stops?.length - 1] || 'End';

            return (
              <View key={route._id} style={[styles.routeCard, isExpanded && styles.routeCardExpanded]}>
                
                {/* Minimal Card Header (Always Visible) */}
                <TouchableOpacity 
                  style={styles.cardHeader} 
                  onPress={() => toggleExpand(route._id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>{route.startTime || '07:30'}</Text>
                  </View>
                  
                  <View style={styles.cardInfo}>
                    <Text style={styles.routeName} numberOfLines={1}>{route.name}</Text>
                    <Text style={styles.routeSummary} numberOfLines={1}>
                      {startStop} <Text style={{color: "#f7a01b"}}>→</Text> {endStop}
                    </Text>
                  </View>

                  <View style={styles.expandIcon}>
                    {isExpanded ? <ChevronUp size={20} color="#8a8d91" /> : <ChevronDown size={20} color="#8a8d91" />}
                  </View>
                </TouchableOpacity>

                {/* Collapsible Content (Stops & Actions) */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    
                    <View style={styles.stopsSection}>
                      <Text style={styles.stopsTitle}>STATIONS TIMELINE</Text>
                      
                      {route.stops?.map((stop: any, i: number) => {
                        const isFirst = i === 0;
                        const isLast = i === (route.stops.length - 1);
                        return (
                          <View key={stop._id || i} style={styles.stopRow}>
                            <View style={styles.timelineGraphic}>
                              <View style={[styles.stopDot, isFirst && styles.stopDotFirst, isLast && styles.stopDotLast]} />
                              {!isLast && <View style={styles.stopLine} />}
                            </View>
                            
                            <View style={styles.stopInfo}>
                              <Text style={[styles.stopName, (isFirst || isLast) && {color: "#fff"}]}>
                                {stop.name || stop}
                              </Text>
                              <TouchableOpacity 
                                onPress={() => setConfirmDelete({ type: 'stop', routeId: route._id, stopId: stop._id, stopName: stop.name || stop })}
                                style={{padding: 4}}
                              >
                                <X size={14} color="#ef4444" style={{opacity: 0.7}} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}

                      {/* Quick Add Stop */}
                      {quickAddId === route._id ? (
                        <View style={styles.quickAddForm}>
                          <View style={styles.timelineGraphic}>
                            <View style={[styles.stopDot, {backgroundColor: "#f7a01b"}]} />
                          </View>
                          <TextInput 
                            style={styles.quickAddInput}
                            placeholder="NEW STATION..."
                            placeholderTextColor="#8a8d91"
                            value={newStopName}
                            onChangeText={setNewStopName}
                            autoFocus
                          />
                          <TouchableOpacity style={styles.quickAddBtn} onPress={() => handleQuickAddStop(route._id)}>
                            <Text style={styles.quickAddBtnText}>ADD</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.addStopBtn} onPress={() => setQuickAddId(route._id)}>
                          <Plus size={14} color="#f7a01b" />
                          <Text style={styles.addStopText}>ADD STATION</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Card Actions Footer */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity 
                        style={styles.deleteRouteBtn} 
                        onPress={() => setConfirmDelete({ type: 'route', routeId: route._id })}
                      >
                        <Trash2 size={14} color="#ef4444" />
                        <Text style={styles.deleteRouteText}>DELETE ENTIRE ROUTE</Text>
                      </TouchableOpacity>
                    </View>

                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* --- Create Route Modal (Full Map with Bottom Sheet) --- */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlayFull}>
          
          {/* Map acts as background */}
          <MapView 
            style={styles.fullMap} 
            initialRegion={ASWAN_CENTER}
            onPress={(e) => setForm({...form, startLocation: e.nativeEvent.coordinate})}
            customMapStyle={darkMapStyle}
          >
            <Marker coordinate={form.startLocation}>
              <View style={styles.customMarker}>
                <MapPin size={24} color="#f7a01b" />
              </View>
            </Marker>
          </MapView>

          <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeMapBtn}>
            <X size={24} color="#fff" />
          </TouchableOpacity>

          {/* Floating Form Bottom Sheet */}
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.floatingSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>New Route Sector</Text>
            
            <ScrollView style={styles.formBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>ROUTE DESIGNATION</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Aswan Univ. Route"
                placeholderTextColor="#6b7280"
                value={form.name} 
                onChangeText={t => setForm({...form, name: t})}
              />

              <View style={{flexDirection: "row", gap: 12}}>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>START TIME</Text>
                  <TextInput 
                    style={styles.input} 
                    value={form.startTime} 
                    onChangeText={t => setForm({...form, startTime: t})}
                  />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>DISTANCE (KM)</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric"
                    value={form.distance} 
                    onChangeText={t => setForm({...form, distance: t})}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>STATIONS SEQUENCE</Text>
              {form.stops.map((s, i) => (
                <View key={i} style={styles.stationInputRow}>
                  <View style={styles.stationNumber}><Text style={styles.stationNumberText}>{i + 1}</Text></View>
                  <TextInput 
                    style={[styles.input, {flex: 1, marginBottom: 0}]} 
                    placeholder="Station Name"
                    placeholderTextColor="#6b7280"
                    value={s} 
                    onChangeText={val => {
                      const ns = [...form.stops];
                      ns[i] = val;
                      setForm({...form, stops: ns});
                    }}
                  />
                </View>
              ))}
              
              <TouchableOpacity style={styles.addStopFormBtn} onPress={() => setForm({...form, stops: [...form.stops, '']})}>
                <Plus size={14} color="#f7a01b" />
                <Text style={styles.addStopFormText}>ADD STATION</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deployBtn} onPress={handleDeploy} disabled={isDeploying}>
                <Text style={styles.deployBtnText}>{isDeploying ? "PROCESSING..." : "DEPLOY TO NETWORK"}</Text>
              </TouchableOpacity>
              <View style={{height: 40}} />
            </ScrollView>
          </KeyboardAvoidingView>

        </View>
      </Modal>

      {/* --- Delete Confirmation Alert --- */}
      <Modal visible={!!confirmDelete} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertModal}>
            <View style={styles.alertIcon}>
              <Trash2 size={24} color="#ef4444" />
            </View>
            <Text style={styles.alertTitle}>Confirm Action</Text>
            <Text style={styles.alertMessage}>
              {confirmDelete?.type === 'route' ? 'Delete this route completely?' : `Remove station "${confirmDelete?.stopName}"?`}
            </Text>
            <View style={styles.alertActions}>
              <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setConfirmDelete(null)}>
                <Text style={styles.alertCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.alertDeleteBtn} onPress={executeDelete}>
                <Text style={styles.alertDeleteText}>DELETE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
  <Appbar />
    </View>
  );
}

// ==========================================
// --- STYLES ---
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1115" },
  
  toast: { position: "absolute", top: 60, alignSelf: "center", zIndex: 100, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, borderWidth: 1 },
  toastSuccess: { backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)" },
  toastError: { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" },
  toastText: { fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },

  header: { padding: 24, paddingTop: 60, backgroundColor: "#0f1115", zIndex: 10 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 10, fontWeight: "800", color: "#8a8d91", textTransform: "uppercase", letterSpacing: 2, marginTop: 4 },
  createBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#f7a01b", alignItems: "center", justifyContent: "center", shadowColor: "#f7a01b", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: {width: 0, height: 4} },

  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#6b7280", fontSize: 13, fontWeight: "600" },

  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  
  // Clean Collapsible Cards
  routeCard: { backgroundColor: "#1c1e26", borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: "#2d3036", overflow: "hidden" },
  routeCardExpanded: { borderColor: "rgba(247,160,27,0.3)" },
  
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 20 },
  timeBadge: { backgroundColor: "#0f1115", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginRight: 16, borderWidth: 1, borderColor: "#2d3036" },
  timeBadgeText: { color: "#f7a01b", fontSize: 12, fontWeight: "900" },
  
  cardInfo: { flex: 1, marginRight: 10 },
  routeName: { fontSize: 15, fontWeight: "900", color: "#fff", textTransform: "uppercase", letterSpacing: -0.3, marginBottom: 4 },
  routeSummary: { fontSize: 11, fontWeight: "700", color: "#8a8d91" },
  
  expandIcon: { padding: 4 },

  expandedContent: { borderTopWidth: 1, borderTopColor: "#2d3036", backgroundColor: "#171920" },
  
  stopsSection: { padding: 20 },
  stopsTitle: { fontSize: 9, fontWeight: "900", color: "#6b7280", letterSpacing: 2, marginBottom: 16 },
  
  stopRow: { flexDirection: "row", minHeight: 44 },
  timelineGraphic: { width: 30, alignItems: "center" },
  stopDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#2d3036", zIndex: 2 },
  stopDotFirst: { backgroundColor: "#22c55e", borderWidth: 2, borderColor: "rgba(34,197,94,0.3)" },
  stopDotLast: { backgroundColor: "#ef4444", borderWidth: 2, borderColor: "rgba(239,68,68,0.3)" },
  stopLine: { flex: 1, width: 2, backgroundColor: "#2d3036", marginTop: -4, marginBottom: -4 },
  
  stopInfo: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 16, marginTop: -3 },
  stopName: { fontSize: 13, fontWeight: "800", color: "#8a8d91", textTransform: "uppercase" },

  addStopBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, paddingLeft: 30 },
  addStopText: { fontSize: 10, fontWeight: "900", color: "#f7a01b", letterSpacing: 1 },

  quickAddForm: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  quickAddInput: { flex: 1, backgroundColor: "#0f1115", borderWidth: 1, borderColor: "#2d3036", borderRadius: 12, color: "#fff", fontSize: 11, fontWeight: "800", paddingHorizontal: 12, paddingVertical: 10, height: 40 },
  quickAddBtn: { backgroundColor: "#f7a01b", borderRadius: 10, paddingHorizontal: 14, height: 40, justifyContent: "center", marginLeft: 8 },
  quickAddBtnText: { color: "#0f1115", fontSize: 10, fontWeight: "900" },

  cardActions: { padding: 20, paddingTop: 0 },
  deleteRouteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(239,68,68,0.05)", paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: "rgba(239,68,68,0.1)" },
  deleteRouteText: { color: "#ef4444", fontSize: 10, fontWeight: "900", letterSpacing: 1 },

  // Map Modal
  modalOverlayFull: { flex: 1, backgroundColor: "#0f1115" },
  fullMap: { ...StyleSheet.absoluteFillObject },
  closeMapBtn: { position: "absolute", top: 50, left: 20, backgroundColor: "rgba(15,17,21,0.8)", padding: 12, borderRadius: 20, zIndex: 100 },
  customMarker: { backgroundColor: "rgba(247,160,27,0.2)", padding: 10, borderRadius: 24, borderWidth: 2, borderColor: "#f7a01b" },

  floatingSheet: { position: "absolute", bottom: 0, width: "100%", height: "65%", backgroundColor: "#1c1e26", borderTopLeftRadius: 32, borderTopRightRadius: 32, shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  sheetHandle: { width: 40, height: 4, backgroundColor: "#2d3036", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: "900", color: "#fff", paddingHorizontal: 24, marginBottom: 16 },
  
  formBody: { paddingHorizontal: 24 },
  inputLabel: { fontSize: 9, fontWeight: "900", color: "#8a8d91", letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: "#0f1115", borderWidth: 1, borderColor: "#2d3036", borderRadius: 16, color: "#fff", padding: 16, fontSize: 13, fontWeight: "700" },
  
  stationInputRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  stationNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#2d3036", alignItems: "center", justifyContent: "center" },
  stationNumberText: { color: "#8a8d91", fontSize: 10, fontWeight: "900" },

  addStopFormBtn: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", marginTop: 12, marginBottom: 32, paddingVertical: 8 },
  addStopFormText: { color: "#f7a01b", fontSize: 10, fontWeight: "900", letterSpacing: 1 },

  deployBtn: { backgroundColor: "#f7a01b", paddingVertical: 18, borderRadius: 16, alignItems: "center" },
  deployBtnText: { color: "#0f1115", fontSize: 12, fontWeight: "900", letterSpacing: 2 },

  // Alert Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", padding: 20 },
  alertModal: { backgroundColor: "#1c1e26", borderRadius: 28, padding: 24, borderWidth: 1, borderColor: "#2d3036", alignItems: "center" },
  alertIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  alertTitle: { fontSize: 18, fontWeight: "900", color: "#fff", marginBottom: 8 },
  alertMessage: { fontSize: 12, color: "#8a8d91", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  alertActions: { flexDirection: "row", gap: 12, width: "100%" },
  alertCancelBtn: { flex: 1, backgroundColor: "#262a33", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  alertCancelText: { color: "#8a8d91", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  alertDeleteBtn: { flex: 1, backgroundColor: "#ef4444", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  alertDeleteText: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
});

// Dark Map Style remains the same
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
];