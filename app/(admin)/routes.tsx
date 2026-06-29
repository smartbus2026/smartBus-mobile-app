// app/(admin)/manage-routes.tsx
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal,
  Platform, ScrollView, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import {
  ChevronDown, ChevronUp, MapPin, Plus,
  Route as RouteIcon, Trash2, X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';

const ASWAN_CENTER = { latitude: 24.0889, longitude: 32.8998, latitudeDelta: 0.05, longitudeDelta: 0.05 };

const darkMapStyle = [
  { elementType: 'geometry',           stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
];

export default function ManageRoutesScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();

  const [routes, setRoutes]               = useState<any[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [isDeploying, setIsDeploying]     = useState(false);
  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'route' | 'stop'; routeId: string; stopId?: string; stopName?: string } | null>(null);
  const [quickAddId, setQuickAddId]       = useState<string | null>(null);
  const [newStopName, setNewStopName]     = useState('');
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', distance: '', duration: '', startTime: '07:30',
    startLocation: { latitude: ASWAN_CENTER.latitude, longitude: ASWAN_CENTER.longitude },
    stops: [''],
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
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleDeploy = async () => {
    if (!form.name.trim() || form.stops.some(s => !s.trim())) { setToast({ msg: 'Please fill all required fields', type: 'error' }); return; }
    setIsDeploying(true);
    try {
      await api.post('/routes', { ...form, startLocation: { lat: form.startLocation.latitude, lng: form.startLocation.longitude } });
      await fetchRoutes();
      setIsModalOpen(false);
      setForm({ name: '', distance: '', duration: '', startTime: '07:30', startLocation: { latitude: ASWAN_CENTER.latitude, longitude: ASWAN_CENTER.longitude }, stops: [''] });
      setToast({ msg: 'Route deployed successfully', type: 'success' });
    } catch { setToast({ msg: 'Deployment failed', type: 'error' }); }
    finally { setIsDeploying(false); }
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
        setToast({ msg: 'Stop removed', type: 'success' });
      }
    } catch { setToast({ msg: 'Delete failed', type: 'error' }); }
    finally { setConfirmDelete(null); }
  };

  const handleQuickAddStop = async (routeId: string) => {
    if (!newStopName.trim()) return;
    try {
      await api.post(`/routes/${routeId}/stops`, { stop_name: newStopName, lat: 0, lng: 0 });
      await fetchRoutes();
      setNewStopName(''); setQuickAddId(null);
      setToast({ msg: 'Stop added', type: 'success' });
    } catch { setToast({ msg: 'Failed to add stop', type: 'error' }); }
  };

  const toggleExpand = (id: string) => setExpandedRouteId(expandedRouteId === id ? null : id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Routes" showMenu showSettings onSettingsPress={() => router.push('/(admin)/settings' as any)} />

      {/* Toast */}
      {toast.msg && (
        <View style={{
          position: 'absolute', top: 80, alignSelf: 'center', zIndex: 50,
          paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1,
          backgroundColor: toast.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          borderColor: toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
        }}>
          <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: toast.type === 'success' ? '#22c55e' : '#ef4444' }}>
            {toast.msg}
          </Text>
        </View>
      )}

      {/* Header Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, color: colors.text }}>
            NETWORK{' '}<Text style={{ color: colors.tint }}>ROUTES</Text>
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginTop: 2 }}>
            MANAGE OPERATING SECTORS
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsModalOpen(true)}
          style={{
            width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
            backgroundColor: colors.tint,
          }}
        >
          <Plus size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>LOADING...</Text>
        </View>
      ) : routes.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33` }}>
            <RouteIcon size={32} color={colors.tint} />
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>No routes mapped yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {routes.map(route => {
            const isExpanded = expandedRouteId === route._id;
            const startStop  = route.stops?.[0]?.name || route.stops?.[0] || 'Start';
            const endStop    = route.stops?.[route.stops?.length - 1]?.name || route.stops?.[route.stops?.length - 1] || 'End';

            return (
              <View key={route._id} style={{
                marginBottom: 14, borderWidth: 1, borderRadius: 24, overflow: 'hidden',
                backgroundColor: colors.card,
                borderColor: isExpanded ? `${colors.tint}4D` : colors.border,
              }}>
                {/* Card Header */}
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}
                  onPress={() => toggleExpand(route._id)} activeOpacity={0.7}
                >
                  <View style={{
                    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginRight: 16,
                    backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: colors.tint }}>{route.startTime || '07:30'}</Text>
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, color: colors.text }} numberOfLines={1}>
                      {route.name}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.icon }} numberOfLines={1}>
                      {startStop} <Text style={{ color: colors.tint }}>→</Text> {endStop}
                    </Text>
                  </View>
                  {isExpanded ? <ChevronUp size={20} color={colors.icon} /> : <ChevronDown size={20} color={colors.icon} />}
                </TouchableOpacity>

                {/* Expanded */}
                {isExpanded && (
                  <View style={{ borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background }}>
                    <View style={{ padding: 20 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, color: colors.icon }}>
                        STATIONS TIMELINE
                      </Text>

                      {route.stops?.map((stop: any, i: number) => {
                        const isFirst = i === 0;
                        const isLast  = i === route.stops.length - 1;
                        const dotColor = isFirst ? '#22c55e' : isLast ? '#ef4444' : colors.border;
                        return (
                          <View key={stop._id || i} style={{ flexDirection: 'row', minHeight: 44 }}>
                            <View style={{ width: 30, alignItems: 'center' }}>
                              <View style={{ width: 10, height: 10, borderRadius: 5, zIndex: 10, backgroundColor: dotColor, borderWidth: (isFirst || isLast) ? 2 : 0, borderColor: isFirst ? 'rgba(34,197,94,0.3)' : isLast ? 'rgba(239,68,68,0.3)' : 'transparent' }} />
                              {!isLast && <View style={{ flex: 1, width: 2, marginTop: -1, marginBottom: -1, backgroundColor: colors.border }} />}
                            </View>
                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, marginTop: -1 }}>
                              <Text style={{ fontSize: 13, fontWeight: '700', textTransform: 'uppercase', color: (isFirst || isLast) ? colors.text : colors.icon, opacity: (isFirst || isLast) ? 1 : 0.7 }}>
                                {stop.name || stop}
                              </Text>
                              <TouchableOpacity onPress={() => setConfirmDelete({ type: 'stop', routeId: route._id, stopId: stop._id, stopName: stop.name || stop })} style={{ padding: 4 }}>
                                <X size={14} color="#ef4444" style={{ opacity: 0.7 }} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}

                      {quickAddId === route._id ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                          <View style={{ width: 30, alignItems: 'center' }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.tint }} />
                          </View>
                          <View style={{ flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 40, justifyContent: 'center', backgroundColor: colors.background, borderColor: colors.tint }}>
                            <TextInput style={{ fontSize: 11, fontWeight: '700', color: colors.text }} placeholder="NEW STATION..." placeholderTextColor={colors.icon} value={newStopName} onChangeText={setNewStopName} autoFocus />
                          </View>
                          <TouchableOpacity onPress={() => handleQuickAddStop(route._id)}
                            style={{ borderRadius: 12, paddingHorizontal: 14, height: 40, justifyContent: 'center', marginLeft: 8, backgroundColor: colors.tint }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: '#000' }}>ADD</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingLeft: 30 }} onPress={() => setQuickAddId(route._id)}>
                          <Plus size={14} color={colors.tint} />
                          <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: colors.tint }}>ADD STATION</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                      <TouchableOpacity
                        onPress={() => setConfirmDelete({ type: 'route', routeId: route._id })}
                        style={{
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                          paddingVertical: 14, borderRadius: 12, borderWidth: 1,
                          backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)',
                        }}
                      >
                        <Trash2 size={14} color="#ef4444" />
                        <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: '#ef4444' }}>DELETE ENTIRE ROUTE</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Create Route Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <MapView
            style={Platform.select({ ios: { flex: 1 }, android: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } })}
            initialRegion={ASWAN_CENTER}
            onPress={e => setForm({ ...form, startLocation: e.nativeEvent.coordinate })}
            customMapStyle={darkMapStyle}
          >
            <Marker coordinate={form.startLocation}>
              <View style={{ padding: 10, borderRadius: 24, borderWidth: 2, backgroundColor: `${colors.tint}33`, borderColor: colors.tint }}>
                <MapPin size={24} color={colors.tint} />
              </View>
            </Marker>
          </MapView>

          <TouchableOpacity
            onPress={() => setIsModalOpen(false)}
            style={{ position: 'absolute', top: 48, left: 20, padding: 12, borderRadius: 16, zIndex: 50, backgroundColor: 'rgba(15,17,21,0.8)' }}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{
              position: 'absolute', bottom: 0, width: '100%', height: '65%',
              borderTopLeftRadius: 32, borderTopRightRadius: 32,
              backgroundColor: colors.card,
              shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.3, elevation: 20,
            }}
          >
            <View style={{ width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20, backgroundColor: colors.border }} />
            <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 24, marginBottom: 16, color: colors.text }}>
              NEW ROUTE{' '}<Text style={{ color: colors.tint }}>SECTOR</Text>
            </Text>

            <ScrollView style={{ paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, color: colors.icon }}>ROUTE DESIGNATION</Text>
              <View style={{ borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52, justifyContent: 'center', backgroundColor: colors.background, borderColor: colors.border, marginBottom: 16 }}>
                <TextInput style={{ fontSize: 14, fontWeight: '700', color: colors.text }} placeholder="e.g. Aswan Univ. Route" placeholderTextColor={colors.icon} value={form.name} onChangeText={t => setForm({ ...form, name: t })} />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, color: colors.icon }}>START TIME</Text>
                  <View style={{ borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52, justifyContent: 'center', backgroundColor: colors.background, borderColor: colors.border }}>
                    <TextInput style={{ fontSize: 14, fontWeight: '700', color: colors.text }} value={form.startTime} onChangeText={t => setForm({ ...form, startTime: t })} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, color: colors.icon }}>DISTANCE (KM)</Text>
                  <View style={{ borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52, justifyContent: 'center', backgroundColor: colors.background, borderColor: colors.border }}>
                    <TextInput style={{ fontSize: 14, fontWeight: '700', color: colors.text }} keyboardType="numeric" value={form.distance} onChangeText={t => setForm({ ...form, distance: t })} />
                  </View>
                </View>
              </View>

              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, color: colors.icon }}>STATIONS SEQUENCE</Text>
              {form.stops.map((stop, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33` }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: colors.tint }}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52, justifyContent: 'center', backgroundColor: colors.background, borderColor: colors.border }}>
                    <TextInput style={{ fontSize: 14, fontWeight: '700', color: colors.text }} placeholder="Station Name" placeholderTextColor={colors.icon} value={stop} onChangeText={val => { const ns = [...form.stops]; ns[i] = val; setForm({ ...form, stops: ns }); }} />
                  </View>
                </View>
              ))}

              <TouchableOpacity onPress={() => setForm({ ...form, stops: [...form.stops, ''] })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 4, marginBottom: 24, paddingVertical: 8 }}>
                <Plus size={14} color={colors.tint} />
                <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: colors.tint }}>ADD STATION</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDeploy} disabled={isDeploying} activeOpacity={0.85}
                style={{ paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tint, opacity: isDeploying ? 0.7 : 1, marginBottom: 40 }}>
                <Text style={{ fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: '#000' }}>
                  {isDeploying ? 'PROCESSING...' : 'DEPLOY TO NETWORK'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal visible={!!confirmDelete} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <View style={{ borderRadius: 24, padding: 24, borderWidth: 1, alignItems: 'center', width: '100%', maxWidth: 340, backgroundColor: colors.card, borderColor: colors.border }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}>
              <Trash2 size={28} color="#ef4444" />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, color: colors.text }}>CONFIRM ACTION</Text>
            <Text style={{ fontSize: 12, textAlign: 'center', lineHeight: 20, marginBottom: 24, color: colors.icon }}>
              {confirmDelete?.type === 'route' ? 'Delete this route completely?' : `Remove station "${confirmDelete?.stopName}"?`}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity onPress={() => setConfirmDelete(null)}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={executeDelete}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#ef4444' }}>
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#fff' }}>DELETE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}