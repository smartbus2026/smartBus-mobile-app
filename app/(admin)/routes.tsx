import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView,
  Modal, KeyboardAvoidingView, Platform
} from "react-native";
import { 
  Search, X, Trash2, MapPin, Plus, 
  ChevronDown, ChevronUp, Map as MapIcon, Route as RouteIcon
} from "lucide-react-native";
import MapView, { Marker } from 'react-native-maps';
import api from "../../src/services/api";
import Appbar from "../../src/components/bar";
import { useThemeColor } from "../../constants/theme"; // 🟢 استدعاء الهوك

const ASWAN_CENTER = {
  latitude: 24.0889,
  longitude: 32.8998,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function ManageRoutesScreen() {
  const colors = useThemeColor(); // 🟢 سحب الألوان
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      
      {/* Toast */}
      {toast.msg ? (
        <View 
          className="absolute top-15 self-center z-50 py-3 px-6 rounded-[30px] border"
          style={{
            backgroundColor: toast.type === 'success' ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            borderColor: toast.type === 'success' ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"
          }}
        >
          <Text 
            className="text-[11px] font-black uppercase tracking-widest"
            style={{ color: toast.type === 'success' ? (colors.success || "#22c55e") : (colors.error || "#ef4444") }}
          >
            {toast.msg}
          </Text>
        </View>
      ) : null}

      {/* --- Header --- */}
      <View className="p-6 pt-15 z-10" style={{ backgroundColor: colors.background }}>
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-[28px] font-black tracking-tighter" style={{ color: colors.text }}>Network Routes</Text>
            <Text className="text-[10px] font-extrabold uppercase tracking-widest mt-1" style={{ color: colors.icon }}>
              Manage operating sectors
            </Text>
          </View>
          <TouchableOpacity 
            className="w-12 h-12 rounded-full items-center justify-center shadow-lg"
            style={{ backgroundColor: colors.tint, shadowColor: colors.tint, elevation: 5 }}
            onPress={() => setIsModalOpen(true)}
          >
            <Plus size={20} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Main Content --- */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : routes.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <RouteIcon size={48} color={colors.icon} style={{ opacity: 0.3, marginBottom: 16 }} />
          <Text className="text-[13px] font-semibold" style={{ color: colors.icon }}>No routes mapped yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {routes.map((route) => {
            const isExpanded = expandedRouteId === route._id;
            const startStop = route.stops?.[0]?.name || route.stops?.[0] || 'Start';
            const endStop = route.stops?.[route.stops?.length - 1]?.name || route.stops?.[route.stops?.length - 1] || 'End';

            return (
              <View 
                key={route._id} 
                className="mb-4 border rounded-[24px] overflow-hidden"
                style={{ 
                  backgroundColor: colors.card, 
                  borderColor: isExpanded ? `${colors.tint}4D` : colors.border 
                }}
              >
                
                {/* Minimal Card Header (Always Visible) */}
                <TouchableOpacity 
                  className="flex-row items-center p-5"
                  onPress={() => toggleExpand(route._id)}
                  activeOpacity={0.7}
                >
                  <View 
                    className="rounded-xl px-3 py-2 mr-4 border"
                    style={{ backgroundColor: colors.background, borderColor: colors.border }}
                  >
                    <Text className="text-xs font-black" style={{ color: colors.tint }}>{route.startTime || '07:30'}</Text>
                  </View>
                  
                  <View className="flex-1 mr-2.5">
                    <Text className="text-[15px] font-black uppercase tracking-tight mb-1" style={{ color: colors.text }} numberOfLines={1}>
                      {route.name}
                    </Text>
                    <Text className="text-[11px] font-bold" style={{ color: colors.icon }} numberOfLines={1}>
                      {startStop} <Text style={{ color: colors.tint }}>→</Text> {endStop}
                    </Text>
                  </View>

                  <View className="p-1">
                    {isExpanded ? <ChevronUp size={20} color={colors.icon} /> : <ChevronDown size={20} color={colors.icon} />}
                  </View>
                </TouchableOpacity>

                {/* Collapsible Content (Stops & Actions) */}
                {isExpanded && (
                  <View className="border-t" style={{ borderTopColor: colors.border, backgroundColor: colors.background }}>
                    
                    <View className="p-5">
                      <Text className="text-[9px] font-black uppercase tracking-widest mb-4" style={{ color: colors.icon }}>
                        STATIONS TIMELINE
                      </Text>
                      
                      {route.stops?.map((stop: any, i: number) => {
                        const isFirst = i === 0;
                        const isLast = i === (route.stops.length - 1);
                        
                        // ديناميكية ألوان النقط
                        let dotBg = colors.border;
                        let dotBorder = 'transparent';
                        if (isFirst) { dotBg = colors.success || "#22c55e"; dotBorder = `${colors.success || "#22c55e"}4D`; }
                        if (isLast) { dotBg = colors.error || "#ef4444"; dotBorder = `${colors.error || "#ef4444"}4D`; }

                        return (
                          <View key={stop._id || i} className="flex-row min-h-[44px]">
                            <View className="w-[30px] items-center">
                              <View 
                                className={`w-2.5 h-2.5 rounded-full z-10 ${isFirst || isLast ? 'border-2' : ''}`} 
                                style={{ backgroundColor: dotBg, borderColor: dotBorder }} 
                              />
                              {!isLast && <View className="flex-1 w-[2px] -mt-1 -mb-1" style={{ backgroundColor: colors.border }} />}
                            </View>
                            
                            <View className="flex-1 flex-row justify-between items-start pb-4 -mt-1">
                              <Text 
                                className={`text-[13px] font-extrabold uppercase ${(isFirst || isLast) ? '' : 'opacity-70'}`}
                                style={{ color: (isFirst || isLast) ? colors.text : colors.icon }}
                              >
                                {stop.name || stop}
                              </Text>
                              <TouchableOpacity 
                                onPress={() => setConfirmDelete({ type: 'stop', routeId: route._id, stopId: stop._id, stopName: stop.name || stop })}
                                className="p-1"
                              >
                                <X size={14} color={colors.error || "#ef4444"} style={{ opacity: 0.7 }} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}

                      {/* Quick Add Stop */}
                      {quickAddId === route._id ? (
                        <View className="flex-row items-center mt-2">
                          <View className="w-[30px] items-center">
                            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.tint }} />
                          </View>
                          <TextInput 
                            className="flex-1 border rounded-xl text-[11px] font-extrabold px-3 py-2.5 h-10"
                            style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                            placeholder="NEW STATION..."
                            placeholderTextColor={colors.icon}
                            value={newStopName}
                            onChangeText={setNewStopName}
                            autoFocus
                          />
                          <TouchableOpacity 
                            className="rounded-xl px-3.5 h-10 justify-center ml-2"
                            style={{ backgroundColor: colors.tint }}
                            onPress={() => handleQuickAddStop(route._id)}
                          >
                            <Text className="text-[10px] font-black" style={{ color: colors.background }}>ADD</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity className="flex-row items-center gap-2 mt-3 pl-[30px]" onPress={() => setQuickAddId(route._id)}>
                          <Plus size={14} color={colors.tint} />
                          <Text className="text-[10px] font-black tracking-widest" style={{ color: colors.tint }}>ADD STATION</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Card Actions Footer */}
                    <View className="px-5 pb-5 pt-0">
                      <TouchableOpacity 
                        className="flex-row items-center justify-center gap-2 py-3.5 rounded-xl border"
                        style={{ backgroundColor: `${colors.error || "#ef4444"}0D`, borderColor: `${colors.error || "#ef4444"}1A` }}
                        onPress={() => setConfirmDelete({ type: 'route', routeId: route._id })}
                      >
                        <Trash2 size={14} color={colors.error || "#ef4444"} />
                        <Text className="text-[10px] font-black tracking-widest" style={{ color: colors.error || "#ef4444" }}>
                          DELETE ENTIRE ROUTE
                        </Text>
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
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          
          {/* Map acts as background */}
          <MapView 
            style={{ ...Platform.select({ ios: { flex: 1 }, android: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } }) }} 
            initialRegion={ASWAN_CENTER}
            onPress={(e) => setForm({...form, startLocation: e.nativeEvent.coordinate})}
            customMapStyle={darkMapStyle}
          >
            <Marker coordinate={form.startLocation}>
              <View className="p-2.5 rounded-3xl border-2" style={{ backgroundColor: `${colors.tint}33`, borderColor: colors.tint }}>
                <MapPin size={24} color={colors.tint} />
              </View>
            </Marker>
          </MapView>

          <TouchableOpacity 
            className="absolute top-12 left-5 p-3 rounded-2xl z-50"
            style={{ backgroundColor: "rgba(15,17,21,0.8)" }}
            onPress={() => setIsModalOpen(false)}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>

          {/* Floating Form Bottom Sheet */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            className="absolute bottom-0 w-full h-[65%] rounded-t-[32px] shadow-2xl"
            style={{ backgroundColor: colors.card, shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.3 }}
          >
            <View className="w-10 h-1 rounded-full self-center mt-3 mb-5" style={{ backgroundColor: colors.border }} />
            <Text className="text-xl font-black px-6 mb-4" style={{ color: colors.text }}>New Route Sector</Text>
            
            <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
              <Text className="text-[9px] font-black uppercase tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>ROUTE DESIGNATION</Text>
              <TextInput 
                className="border rounded-2xl p-4 text-[13px] font-bold"
                style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                placeholder="e.g. Aswan Univ. Route"
                placeholderTextColor={colors.icon}
                value={form.name} 
                onChangeText={t => setForm({...form, name: t})}
              />

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-[9px] font-black uppercase tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>START TIME</Text>
                  <TextInput 
                    className="border rounded-2xl p-4 text-[13px] font-bold"
                    style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                    value={form.startTime} 
                    onChangeText={t => setForm({...form, startTime: t})}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[9px] font-black uppercase tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>DISTANCE (KM)</Text>
                  <TextInput 
                    className="border rounded-2xl p-4 text-[13px] font-bold"
                    style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                    keyboardType="numeric"
                    value={form.distance} 
                    onChangeText={t => setForm({...form, distance: t})}
                  />
                </View>
              </View>

              <Text className="text-[9px] font-black uppercase tracking-widest mb-2 mt-4" style={{ color: colors.icon }}>STATIONS SEQUENCE</Text>
              {form.stops.map((s, i) => (
                <View key={i} className="flex-row items-center gap-3 mb-3">
                  <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: colors.border }}>
                    <Text className="text-[10px] font-black" style={{ color: colors.icon }}>{i + 1}</Text>
                  </View>
                  <TextInput 
                    className="flex-1 border rounded-2xl p-4 text-[13px] font-bold"
                    style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                    placeholder="Station Name"
                    placeholderTextColor={colors.icon}
                    value={s} 
                    onChangeText={val => {
                      const ns = [...form.stops];
                      ns[i] = val;
                      setForm({...form, stops: ns});
                    }}
                  />
                </View>
              ))}
              
              <TouchableOpacity 
                className="flex-row items-center gap-2 self-start mt-3 mb-8 py-2"
                onPress={() => setForm({...form, stops: [...form.stops, '']})}
              >
                <Plus size={14} color={colors.tint} />
                <Text className="text-[10px] font-black tracking-widest" style={{ color: colors.tint }}>ADD STATION</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="py-[18px] rounded-2xl items-center"
                style={{ backgroundColor: colors.tint }}
                onPress={handleDeploy} 
                disabled={isDeploying}
              >
                <Text className="text-xs font-black tracking-widest" style={{ color: colors.background }}>
                  {isDeploying ? "PROCESSING..." : "DEPLOY TO NETWORK"}
                </Text>
              </TouchableOpacity>
              <View style={{height: 40}} />
            </ScrollView>
          </KeyboardAvoidingView>

        </View>
      </Modal>

      {/* --- Delete Confirmation Alert --- */}
      <Modal visible={!!confirmDelete} transparent animationType="fade">
        <View className="flex-1 justify-center items-center p-5" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
          <View className="rounded-[28px] p-6 border items-center w-full max-w-[340px]" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <View className="w-14 h-14 rounded-full items-center justify-center mb-4" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
              <Trash2 size={24} color={colors.error || "#ef4444"} />
            </View>
            <Text className="text-lg font-black mb-2" style={{ color: colors.text }}>Confirm Action</Text>
            <Text className="text-xs text-center leading-5 mb-6" style={{ color: colors.icon }}>
              {confirmDelete?.type === 'route' ? 'Delete this route completely?' : `Remove station "${confirmDelete?.stopName}"?`}
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity 
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: colors.background }}
                onPress={() => setConfirmDelete(null)}
              >
                <Text className="text-[11px] font-black tracking-widest" style={{ color: colors.icon }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: colors.error || "#ef4444" }}
                onPress={executeDelete}
              >
                <Text className="text-[11px] font-black tracking-widest text-white">DELETE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Appbar />
    </View>
  );
}

// Dark Map Style remains the same (Can be updated dynamically if needed later)
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
];