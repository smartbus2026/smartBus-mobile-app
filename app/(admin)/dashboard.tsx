// app/(admin)/dashboard.tsx
import { useRouter } from 'expo-router';
import {
  BarChart2, Bell, Bus, Calendar, CheckCircle, Clock,
  Download, MapPin, Plus, Route, Users, AlertCircle, Info, Trash2, ChevronDown,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';

// ─── CustomSelect ─────────────────────────────────────────────────────────────
function CustomSelect({ label, value, options, onSelect, placeholder, colors }: any) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o: any) => o.value === value);

  return (
    <View style={{ marginBottom: 12, flex: 1 }}>
      {label && (
        <Text style={{ fontSize: 10, fontWeight: '800', color: colors.icon, marginBottom: 6, textTransform: 'uppercase' }}>
          {label}
        </Text>
      )}
      <TouchableOpacity
        activeOpacity={0.7} onPress={() => setOpen(!open)}
        style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          minHeight: 48, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1,
          borderColor: open ? colors.tint : colors.border, backgroundColor: colors.background,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: selectedOption ? colors.text : colors.icon }}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={18} color={open ? colors.tint : colors.icon} />
      </TouchableOpacity>

      {open && (
        <View style={{ marginTop: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' }}>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {options.length === 0 ? (
              <Text style={{ padding: 16, textAlign: 'center', color: colors.icon, fontSize: 12 }}>No options available</Text>
            ) : (
              options.map((opt: any) => (
                <TouchableOpacity
                  key={opt.value} activeOpacity={0.7}
                  onPress={() => { onSelect(opt.value); setOpen(false); }}
                  style={{
                    minHeight: 48, justifyContent: 'center', paddingHorizontal: 16,
                    borderBottomWidth: 1, borderBottomColor: colors.border,
                    backgroundColor: value === opt.value ? `${colors.tint}1A` : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: value === opt.value ? colors.tint : colors.text }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalStudents: 0, activeTripsCount: 0, totalRoutes: 0, totalBookings: 0,
    tickets: [] as any[], routesList: [] as any[],
  });

  const [demandDate, setDemandDate]     = useState<'today' | 'tomorrow'>('tomorrow');
  const [demands, setDemands]           = useState<any[]>([]);
  const [demandLoading, setDemandLoading] = useState(true);
  const [filterShift, setFilterShift]   = useState<'morning' | 'return'>('morning');
  const [filterTime, setFilterTime]     = useState<string>('3:30');

  const [buses, setBuses]       = useState<any[]>([]);
  const [drivers, setDrivers]   = useState<any[]>([]);
  const [dispatchForm, setDispatchForm] = useState<{ timeSlot: string; specificReturnTime?: string; routeIds: string[] }>({ timeSlot: 'Morning', specificReturnTime: '', routeIds: [] });
  const [assignments, setAssignments]   = useState([{ busId: '', driverId: '' }]);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchMessage, setDispatchMessage] = useState({ type: '', text: '' });

  const [assignedTrips, setAssignedTrips]     = useState<any[]>([]);
  const [tripsLoading, setTripsLoading]       = useState(true);
  const [selectedShift, setSelectedShift]     = useState<'Morning' | 'Return'>('Morning');
  const [selectedTime, setSelectedTime]       = useState<string>('');
  const [tripRouteFilter, setTripRouteFilter] = useState<string>('');

  const [pendingProposal, setPendingProposal]     = useState<any>(null);
  const [timeRemaining, setTimeRemaining]         = useState<string>('');
  const [proposalLoading, setProposalLoading]     = useState(false);
  const [editMode, setEditMode]                   = useState(false);
  const [editedAssignments, setEditedAssignments] = useState<any[]>([]);
  const [generatingAI, setGeneratingAI]           = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, tripsRes, routesRes, bookingsRes, supportRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/trips').catch(() => ({ data: { data: [] } })),
        api.get('/routes').catch(() => ({ data: { data: [] } })),
        api.get('/bookings').catch(() => ({ data: { data: [] } })),
        api.get('/support').catch(() => ({ data: { data: { tickets: [] } } })),
      ]);
      const users    = usersRes.data || [];
      const trips    = tripsRes.data?.data || tripsRes.data || [];
      const routes   = routesRes.data?.data || routesRes.data || [];
      const bookings = bookingsRes.data?.data || bookingsRes.data || [];
      const supportTickets = supportRes.data?.data?.tickets || supportRes.data?.tickets || [];
      setData({
        totalStudents:   Array.isArray(users)    ? users.filter((u: any) => u.role === 'student').length : 0,
        activeTripsCount: Array.isArray(trips)   ? trips.filter((t: any) => t.status === 'active' || t.status === 'in-progress').length : 0,
        totalRoutes:     Array.isArray(routes)   ? routes.length : 0,
        totalBookings:   Array.isArray(bookings) ? bookings.length : 0,
        tickets: supportTickets.filter((t: any) => t.status === 'open' || t.status === 'pending').slice(0, 5),
        routesList: Array.isArray(routes) ? routes : [],
      });
    } catch (err) { console.log('Dashboard Stats Error:', err); }
    finally { setLoading(false); }
  };

  const fetchAssignedTrips = async () => {
    setTripsLoading(true);
    try {
      const res = await api.get('/bookings/admin/assigned-trips');
      let tData = res.data?.data?.assignedTrips || res.data?.assignedTrips || res.data?.trips || res.data?.data?.trips || res.data?.data || [];
      if (!Array.isArray(tData)) tData = [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      setAssignedTrips(tData.filter((t: any) => new Date(t.date).setHours(0,0,0,0) === today.getTime()));
    } catch (err) { console.log('Assigned Trips Error:', err); }
    finally { setTripsLoading(false); }
  };

  const fetchBusesAndDrivers = async () => {
    try {
      const [busesRes, driversRes] = await Promise.all([
        api.get('/tracking/buses').catch(() => ({ data: { data: { buses: [] } } })),
        api.get('/admin/drivers').catch(() => ({ data: [] })),
      ]);
      setBuses(busesRes.data?.data?.buses || busesRes.data?.buses || busesRes.data?.data || []);
      setDrivers(driversRes.data || []);
    } catch (err) { console.log('Fetch Buses/Drivers Error:', err); }
  };

  const fetchDemands = async () => {
    setDemandLoading(true);
    try {
      const target = new Date();
      if (demandDate === 'tomorrow') target.setDate(target.getDate() + 1);
      const res = await api.get(`/bookings/admin/demand?date=${target.toISOString().split('T')[0]}`);
      setDemands(res.data?.data?.demands || []);
    } catch { setDemands([]); }
    finally { setDemandLoading(false); }
  };

  const fetchPendingProposal = async (overrideType?: string) => {
    try {
      const activeType = overrideType || selectedShift || 'Morning';
      const res = await api.get(`/admin/proposals/pending?tripType=${activeType}`);
      const proposals = res.data?.data || [];
      if (proposals.length > 0) { setPendingProposal(proposals[0]); setEditedAssignments(proposals[0].assignments); }
      else setPendingProposal(null);
    } catch (err) { console.log('Fetch Pending Proposal Error', err); }
  };

  const handleGenerateAI = async () => {
    if (filterShift === 'return' && !filterTime) { alert('Please select a return time before generating a dispatch plan.'); return; }
    setGeneratingAI(true);
    try {
      const targetDate = new Date(); targetDate.setDate(targetDate.getDate() + 1);
      await api.post('/admin/dispatch/generate', { targetDate: targetDate.toISOString().split('T')[0], shift: filterShift, time: filterShift === 'return' ? filterTime : null });
      fetchPendingProposal(filterShift.charAt(0).toUpperCase() + filterShift.slice(1));
    } catch (err: any) { alert(`AI Engine Notice:\n${err.response?.data?.error || err.response?.data?.message || 'Failed to generate AI proposal.'}`); }
    finally { setGeneratingAI(false); }
  };

  const handleApproveProposal = async () => {
    const finalAssignments = editMode ? editedAssignments : pendingProposal.assignments;
    if (finalAssignments.some((a: any) => !a.busId || !a.driverId)) { alert('You MUST assign a physical Bus and Driver to each group.'); if (!editMode) setEditMode(true); return; }
    setProposalLoading(true);
    try {
      await api.post(`/admin/proposals/${pendingProposal._id}/approve`, { assignments: finalAssignments });
      setPendingProposal(null); setEditMode(false); fetchAssignedTrips();
    } catch (err: any) { alert(err.response?.data?.message || 'Confirmation failed.'); }
    finally { setProposalLoading(false); }
  };

  const handleSaveEdits = async () => {
    setProposalLoading(true);
    try { await api.put(`/admin/proposals/${pendingProposal._id}/edit`, { assignments: editedAssignments }); setEditMode(false); fetchPendingProposal(); }
    catch (err) { console.log('Save Edits Error', err); }
    finally { setProposalLoading(false); }
  };

  const handleResolveTicket = async (id: string) => {
    try { await api.put(`/support/${id}/status`, { status: 'resolved' }); setData(prev => ({ ...prev, tickets: prev.tickets.filter((t: any) => t._id !== id) })); }
    catch (err) { console.log('Resolve ticket error:', err); }
  };

  const handleDispatch = async () => {
    if (assignments.some(a => !a.busId || !a.driverId) || dispatchForm.routeIds.length === 0) { setDispatchMessage({ type: 'error', text: 'Select a bus, driver, and at least 1 route.' }); return; }
    if (dispatchForm.timeSlot === 'Return' && !dispatchForm.specificReturnTime) { setDispatchMessage({ type: 'error', text: 'Select a return time.' }); return; }
    setDispatchLoading(true); setDispatchMessage({ type: '', text: '' });
    try {
      const targetDate = new Date(); if (demandDate === 'tomorrow') targetDate.setDate(targetDate.getDate() + 1);
      const payload: any = { assignments, date: targetDate.toISOString().split('T')[0], timeSlot: dispatchForm.timeSlot, routeIds: dispatchForm.routeIds };
      if (dispatchForm.timeSlot === 'Return') payload.specificReturnTime = dispatchForm.specificReturnTime;
      await api.post('/bookings/admin/dispatch', payload);
      setDispatchMessage({ type: 'success', text: 'Bus dispatched successfully!' });
      setDispatchForm({ timeSlot: 'Morning', specificReturnTime: '', routeIds: [] });
      setAssignments([{ busId: '', driverId: '' }]);
      fetchAssignedTrips(); fetchDemands();
    } catch (err: any) { setDispatchMessage({ type: 'error', text: err.response?.data?.message || 'Dispatch failed.' }); }
    finally { setDispatchLoading(false); }
  };

  useEffect(() => { fetchDashboardData(); fetchAssignedTrips(); fetchBusesAndDrivers(); }, []);
  useEffect(() => { fetchDemands(); }, [demandDate]);
  useEffect(() => { fetchPendingProposal(); }, [selectedShift]);

  useEffect(() => {
    if (!pendingProposal) return;
    const interval = setInterval(() => {
      const diff = new Date(pendingProposal.deadline).getTime() - new Date().getTime();
      if (diff <= 0) { setTimeRemaining('Deadline Passed'); clearInterval(interval); return; }
      const h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
      const m = Math.floor((diff % (1000*60*60)) / (1000*60));
      const s = Math.floor((diff % (1000*60)) / 1000);
      setTimeRemaining(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingProposal]);

  const stats = [
    { title: 'Total Students',   value: loading ? '...' : data.totalStudents.toLocaleString(),  trend: 'Registered accounts',   icon: <Users   size={22} color={colors.tint} /> },
    { title: 'Active Trips',     value: loading ? '...' : data.activeTripsCount.toString(),      trend: 'Currently en route',    icon: <Bus     size={22} color={colors.tint} /> },
    { title: 'Available Routes', value: loading ? '...' : data.totalRoutes.toString(),           trend: 'Active service paths',  icon: <MapPin  size={22} color={colors.tint} /> },
    { title: 'Total Bookings',   value: loading ? '...' : data.totalBookings.toLocaleString(),   trend: 'System wide',           icon: <Calendar size={22} color={colors.tint} /> },
  ];

  const busOptions    = buses.map(b   => ({ label: `${b.busCode} (Cap: ${b.capacity || 45})`, value: b._id }));
  const driverOptions = drivers.map(d => ({ label: d.name, value: d._id }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Dashboard" showMenu showSettings onSettingsPress={() => router.push('/(admin)/settings' as any)} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>

        {/* ── 1. AI Proposal Alert ── */}
        {pendingProposal && (
          <View style={{ backgroundColor: '#fffbeb', borderColor: '#f59e0b', borderWidth: 2, borderRadius: 24, padding: 20, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(217,119,6,0.15)' }}>
                  <Info size={22} color="#d97706" />
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#d97706', textTransform: 'uppercase', letterSpacing: 1 }}>
                    AI BUS ASSIGNMENT PROPOSAL
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#92400e', marginTop: 2 }}>
                    For {pendingProposal.tripType} on {new Date(pendingProposal.targetDate).toDateString()}
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#fde68a' }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#b45309', textTransform: 'uppercase' }}>Auto-Approve Deadline</Text>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#92400e' }}>{timeRemaining}</Text>
              </View>
            </View>

            <View style={{ gap: 14, marginBottom: 16 }}>
              {(editMode ? editedAssignments : pendingProposal.assignments).map((assignment: any, idx: number) => (
                <View key={idx} style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>Bus {assignment.busNumber}</Text>
                    <View style={{ backgroundColor: `${colors.tint}1A`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: `${colors.tint}33` }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.tint }}>{assignment.studentBookings?.length || 0} Students</Text>
                    </View>
                  </View>
                  {editMode ? (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      <CustomSelect colors={colors} value={assignment.busId} options={busOptions} placeholder="Choose Bus" onSelect={(val: string) => { const updated = [...editedAssignments]; updated[idx].busId = val; setEditedAssignments(updated); }} />
                      <CustomSelect colors={colors} value={assignment.driverId} options={driverOptions} placeholder="Choose Driver" onSelect={(val: string) => { const updated = [...editedAssignments]; updated[idx].driverId = val; setEditedAssignments(updated); }} />
                    </View>
                  ) : (
                    <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                      {assignment.studentBookings?.map((booking: any, bIdx: number) => (
                        <View key={bIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: `${colors.border}60` }}>
                          <Text style={{ fontSize: 12, color: colors.text, flex: 1, fontWeight: '500' }} numberOfLines={1}>{booking.user?.name || 'Unknown'}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.icon }}>{booking.route?.name || 'No Route'}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              {editMode ? (
                <>
                  <TouchableOpacity onPress={() => { setEditMode(false); setEditedAssignments(pendingProposal.assignments); }}
                    style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', color: colors.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveEdits} disabled={proposalLoading}
                    style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#f59e0b' }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#fff' }}>{proposalLoading ? 'Saving...' : 'Save Modifications'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity onPress={() => setEditMode(true)}
                    style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', color: colors.text }}>Modify</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleApproveProposal} disabled={proposalLoading}
                    style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.success || '#10b981' }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#fff' }}>Confirm AI Mapping</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        {/* ── 2. Stats Grid ── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
          {stats.map((stat, i) => (
            <View key={i} style={{ width: '48%', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, flex: 1, paddingRight: 4 }}>{stat.title}</Text>
                <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33` }}>
                  {stat.icon}
                </View>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 4 }}>{stat.value}</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.success || '#10b981' }}>{stat.trend}</Text>
            </View>
          ))}
        </View>

        {/* ── 3. Live Booking Demands ── */}
        <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginBottom: 24, overflow: 'hidden' }}>
          <View style={{ padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>
                LIVE BOOKING DEMANDS
              </Text>
              <View style={{ flexDirection: 'row', backgroundColor: colors.background, padding: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                {(['today', 'tomorrow'] as const).map(d => (
                  <TouchableOpacity key={d} onPress={() => setDemandDate(d)}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: demandDate === d ? colors.tint : 'transparent' }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: demandDate === d ? '#000' : colors.icon }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={handleGenerateAI} disabled={generatingAI}
              style={{ backgroundColor: '#d97706', minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, opacity: generatingAI ? 0.6 : 1 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {generatingAI ? 'CONFIGURING...' : 'GENERATE AUTO-ASSIGN'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', padding: 12, backgroundColor: `${colors.background}60`, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 }}>
            {(['morning', 'return'] as const).map(s => (
              <TouchableOpacity key={s} onPress={() => setFilterShift(s)}
                style={{ flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: filterShift === s ? colors.tint : 'transparent' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: filterShift === s ? '#000' : colors.text }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {filterShift === 'return' && (
            <View style={{ flexDirection: 'row', padding: 12, gap: 8, justifyContent: 'center' }}>
              {['3:30', '7:00'].map(t => (
                <TouchableOpacity key={t} onPress={() => setFilterTime(t)}
                  style={{ minWidth: 100, minHeight: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: filterTime === t ? colors.tint : colors.border, backgroundColor: filterTime === t ? `${colors.tint}1A` : colors.background }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: filterTime === t ? colors.tint : colors.text }}>{t} PM</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {demandLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.tint} /></View>
          ) : demands.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center', opacity: 0.5 }}>
              <Calendar size={32} color={colors.icon} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>No Pending Demands</Text>
            </View>
          ) : (
            <View style={{ padding: 16, gap: 14 }}>
              {demands
                .filter((d: any) => {
                  const shiftMatch = (d.timeSlot || '').toLowerCase() === filterShift;
                  const timeMatch  = filterShift === 'morning' || (d.specificReturnTime || '').toLowerCase().startsWith(filterTime);
                  return shiftMatch && timeMatch;
                })
                .map((d, i) => {
                  const isHigh = d.totalStudents > 45;
                  const progressColor = isHigh ? '#ef4444' : d.totalStudents > 30 ? '#eab308' : colors.tint;
                  return (
                    <View key={i} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, backgroundColor: colors.background }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, flex: 1 }}>{d.routeName}</Text>
                        {isHigh && (
                          <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}>
                            <Text style={{ fontSize: 9, fontWeight: '900', color: '#ef4444', letterSpacing: 1 }}>OVERLOADED</Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 12, color: colors.icon, fontWeight: '600' }}>Booked</Text>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>{d.totalStudents} <Text style={{ color: colors.icon }}>/ 45</Text></Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{ height: '100%', width: `${Math.min((d.totalStudents / 45) * 100, 100)}%`, backgroundColor: progressColor, borderRadius: 4 }} />
                      </View>
                    </View>
                  );
                })
              }
            </View>
          )}
        </View>

        {/* ── 4. Assign Bus & Dispatch ── */}
        <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginBottom: 24, padding: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text, marginBottom: 20 }}>
            ASSIGN BUS & DISPATCH
          </Text>

          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: colors.icon, marginBottom: 10 }}>
            Assign Buses & Drivers
          </Text>

          {assignments.map((assignment, index) => (
            <View key={index} style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <CustomSelect colors={colors} value={assignment.busId} options={busOptions} placeholder="Choose Bus" onSelect={(val: string) => { const next = [...assignments]; next[index].busId = val; setAssignments(next); }} />
                <CustomSelect colors={colors} value={assignment.driverId} options={driverOptions} placeholder="Choose Driver" onSelect={(val: string) => { const next = [...assignments]; next[index].driverId = val; setAssignments(next); }} />
              </View>
              {index > 0 && (
                <TouchableOpacity activeOpacity={0.6} onPress={() => setAssignments(assignments.filter((_, i) => i !== index))} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity activeOpacity={0.7} onPress={() => setAssignments([...assignments, { busId: '', driverId: '' }])} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.tint }}>+ Add Another Bus</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: colors.icon, marginBottom: 10 }}>Time Slot</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: dispatchForm.timeSlot === 'Return' ? 12 : 20 }}>
            {['Morning', 'Return'].map(slot => (
              <TouchableOpacity key={slot} activeOpacity={0.7} onPress={() => setDispatchForm(prev => ({ ...prev, timeSlot: slot, specificReturnTime: '' }))}
                style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: dispatchForm.timeSlot === slot ? colors.tint : colors.border, backgroundColor: dispatchForm.timeSlot === slot ? `${colors.tint}1A` : colors.background }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: dispatchForm.timeSlot === slot ? colors.tint : colors.text }}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {dispatchForm.timeSlot === 'Return' && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {['3:30 PM', '7:00 PM'].map(time => (
                <TouchableOpacity key={time} activeOpacity={0.7} onPress={() => setDispatchForm(prev => ({ ...prev, specificReturnTime: time }))}
                  style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: dispatchForm.specificReturnTime === time ? colors.tint : colors.border, backgroundColor: dispatchForm.specificReturnTime === time ? `${colors.tint}1A` : colors.background }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: dispatchForm.specificReturnTime === time ? colors.tint : colors.text }}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: colors.icon, marginBottom: 10 }}>Select Target Routes</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {data.routesList.map(r => {
              const isSelected = dispatchForm.routeIds.includes(r._id);
              return (
                <TouchableOpacity key={r._id} activeOpacity={0.7} onPress={() => setDispatchForm(prev => ({ ...prev, routeIds: isSelected ? prev.routeIds.filter(id => id !== r._id) : [...prev.routeIds, r._id] }))}
                  style={{ minHeight: 40, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: isSelected ? colors.tint : colors.border, backgroundColor: isSelected ? colors.tint : colors.background }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: isSelected ? '#000' : colors.text }}>{r.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {dispatchMessage.text ? (
            <Text style={{ fontSize: 12, fontWeight: '800', textAlign: 'center', marginBottom: 14, color: dispatchMessage.type === 'error' ? '#ef4444' : colors.tint }}>
              {dispatchMessage.text}
            </Text>
          ) : null}

          <TouchableOpacity activeOpacity={0.8} onPress={handleDispatch} disabled={dispatchLoading}
            style={{ backgroundColor: colors.tint, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', opacity: dispatchLoading ? 0.7 : 1 }}>
            <Text style={{ color: '#000', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              {dispatchLoading ? 'DISPATCHING...' : 'ASSIGN BUS & NOTIFY'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 5. Pending Tickets ── */}
        <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginBottom: 24, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>PENDING TICKETS</Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/support' as any)}>
              <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.tint }}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 12 }}>
            {loading ? (
              <ActivityIndicator style={{ padding: 20 }} color={colors.tint} />
            ) : data.tickets.length === 0 ? (
              <Text style={{ fontSize: 12, color: colors.icon, textAlign: 'center', padding: 20 }}>No pending tickets.</Text>
            ) : (
              data.tickets.map((t, i) => (
                <View key={t._id || i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, backgroundColor: colors.background, marginBottom: 10 }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 4 }}>{t.subject}</Text>
                    <Text style={{ fontSize: 11, color: colors.icon }} numberOfLines={1}>{t.description}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleResolveTicket(t._id)}
                    style={{ backgroundColor: `${colors.success || '#10b981'}1A`, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: `${colors.success || '#10b981'}33` }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.success || '#10b981' }}>RESOLVE</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* ── 6. Today's Trips ── */}
        <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text, marginBottom: 14 }}>
          TODAY'S TRIPS
        </Text>

        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 12, marginBottom: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['Morning', 'Return'] as const).map(s => (
              <TouchableOpacity key={s} onPress={() => { setSelectedShift(s); setSelectedTime(''); }}
                style={{ flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: selectedShift === s ? colors.tint : colors.border, backgroundColor: selectedShift === s ? `${colors.tint}1A` : 'transparent' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: selectedShift === s ? colors.tint : colors.text }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedShift === 'Return' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['', '3:30 PM', '7:00 PM'].map((rt, i) => (
                <TouchableOpacity key={i} onPress={() => setSelectedTime(rt)}
                  style={{ paddingHorizontal: 16, minHeight: 38, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: selectedTime === rt ? colors.tint : colors.border, backgroundColor: selectedTime === rt ? `${colors.tint}1A` : 'transparent', marginRight: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: selectedTime === rt ? colors.tint : colors.text }}>{rt === '' ? 'Any Time' : rt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', padding: 16, backgroundColor: `${colors.background}80`, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ flex: 2, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>Route</Text>
            <Text style={{ flex: 1.5, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>Bus & Driver</Text>
          </View>
          {tripsLoading ? (
            <ActivityIndicator style={{ padding: 30 }} size="large" color={colors.tint} />
          ) : (() => {
            const filteredTrips = assignedTrips.filter(t =>
              t.timeSlot === selectedShift &&
              (!selectedTime || t.specificReturnTime === selectedTime) &&
              (!tripRouteFilter || t.route?._id === tripRouteFilter)
            );
            if (filteredTrips.length === 0) {
              return <Text style={{ fontSize: 12, fontWeight: '600', color: colors.icon, textAlign: 'center', padding: 30 }}>No trips match filters.</Text>;
            }
            return filteredTrips.map((trip, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: i === filteredTrips.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
                <View style={{ flex: 2, gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }} numberOfLines={1}>{trip.route?.name || 'System Route'}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: colors.icon }}>{trip.timeSlot} {trip.specificReturnTime ? `(${trip.specificReturnTime})` : ''}</Text>
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: colors.tint }}>{trip.busNumber || trip.bus?.busCode || 'Unassigned'}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: colors.icon }} numberOfLines={1}>{trip.driverName || 'No Driver'}</Text>
                </View>
              </View>
            ));
          })()}
        </View>

      </ScrollView>
    </View>
  );
}