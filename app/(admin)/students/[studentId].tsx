import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle, ArrowLeft, Calendar,
  CheckCircle, Clock, MapPin, TrendingUp, Users,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, ScrollView,
  Text, TouchableOpacity, View,
} from "react-native";
import { useThemeColor } from "../../../constants/theme";
import api from "../../../src/services/api";
import TopBar from "../../../src/components/TopBar";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BookingRecord {
  _id: string;
  date: string;
  timeSlot: string;
  specificReturnTime?: string;
  attendanceStatus: string;
  route?: { name: string };
}

interface StudentData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  student_id?: string;
  createdAt?: string;
}

interface Stats {
  completed: number;
  missed: number;
  total: number;
}

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  completed: { label: 'PRESENT',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)'   },
  missed:    { label: 'MISSED',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)'   },
  assigned:  { label: 'ASSIGNED', color: '#f7a01b', bg: 'rgba(247,160,27,0.1)',  border: 'rgba(247,160,27,0.3)'  },
  pending:   { label: 'PENDING',  color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)' },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: string | number;
  color: string;
  colors: any;
}> = ({ label, value, color, colors }) => (
  <View style={{
    flex: 1, borderRadius: 18, borderWidth: 1, padding: 16,
    backgroundColor: colors.card, borderColor: colors.border,
    alignItems: 'center',
  }}>
    <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 8, textAlign: 'center' }}>
      {label}
    </Text>
    <Text style={{ fontSize: 26, fontWeight: '900', color }}>
      {value}
    </Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StudentProfileScreen() {
  const colors              = useThemeColor();
  const router              = useRouter();
  const { studentId }       = useLocalSearchParams<{ studentId: string }>();

  const [student, setStudent]         = useState<StudentData | null>(null);
  const [bookings, setBookings]       = useState<BookingRecord[]>([]);
  const [stats, setStats]             = useState<Stats>({ completed: 0, missed: 0, total: 0 });
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!studentId) return;
    const load = async () => {
      try {
        const res = await api.get(`/users/${studentId}/attendance-history`);
        const { student: s, bookings: b, stats: st } = res.data.data;
        setStudent(s);
        setBookings(b || []);
        setStats(st || { completed: 0, missed: 0, total: 0 });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load student');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [studentId]);

  const filteredBookings = filterStatus === 'all'
    ? bookings
    : bookings.filter(b => b.attendanceStatus === filterStatus);

  const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const rateColor = rate >= 75 ? '#22c55e' : '#ef4444';

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar title="Student Profile" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>
            LOADING STUDENT...
          </Text>
        </View>
      </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !student) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar title="Student Profile" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 }}>
          <Users size={48} color={colors.icon} style={{ opacity: 0.3 }} />
          <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.error || '#ef4444', textAlign: 'center' }}>
            {error || 'Student not found'}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} color={colors.tint} />
            <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.tint }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const FILTERS = [
    { key: 'all',       label: 'All'       },
    { key: 'completed', label: 'Present'   },
    { key: 'missed',    label: 'Missed'    },
    { key: 'assigned',  label: 'Assigned'  },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Student Profile" showBack />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* ── Profile Card ── */}
        <View style={{
          borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 16,
          backgroundColor: colors.card, borderColor: colors.border,
          flexDirection: 'row', alignItems: 'center', gap: 16,
        }}>
          {/* Avatar */}
          <View style={{
            width: 64, height: 64, borderRadius: 20,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
          }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: colors.tint }}>
              {student.name?.charAt(0)?.toUpperCase()}
            </Text>
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.text, marginBottom: 4 }} numberOfLines={1}>
              {student.name}
            </Text>
            <Text style={{ fontSize: 11, color: colors.icon, marginBottom: 2 }} numberOfLines={1}>
              {student.email}
            </Text>
            {student.phone && (
              <Text style={{ fontSize: 11, color: colors.icon, marginBottom: 2 }}>{student.phone}</Text>
            )}
            {student.student_id && (
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.tint }}>ID: {student.student_id}</Text>
            )}
            {student.createdAt && (
              <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, marginTop: 4 }}>
                Joined {new Date(student.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <StatCard label="Total"     value={stats.total}     color={colors.icon}  colors={colors} />
          <StatCard label="Present"   value={stats.completed} color="#22c55e"      colors={colors} />
          <StatCard label="Missed"    value={stats.missed}    color="#ef4444"      colors={colors} />
          <StatCard label="Rate"      value={`${rate}%`}      color={rateColor}    colors={colors} />
        </View>

        {/* ── Attendance Rate Bar ── */}
        <View style={{
          borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 16,
          backgroundColor: colors.card, borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} color={colors.icon} />
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon }}>
                Attendance Rate
              </Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: rateColor }}>{rate}%</Text>
          </View>

          {/* Bar */}
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden', marginBottom: 10 }}>
            <View style={{ height: '100%', width: `${rate}%`, borderRadius: 4, backgroundColor: rateColor }} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {rate >= 75
              ? <CheckCircle size={12} color="#22c55e" />
              : <AlertCircle size={12} color="#ef4444" />
            }
            <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: rate >= 75 ? '#22c55e' : '#ef4444' }}>
              {rate >= 75 ? 'Good standing' : 'Below 75% threshold'}
            </Text>
          </View>
        </View>

        {/* ── Attendance History ── */}
        <View style={{
          borderRadius: 20, borderWidth: 1, overflow: 'hidden',
          backgroundColor: colors.card, borderColor: colors.border,
        }}>
          {/* Header + Filter */}
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Calendar size={14} color={colors.icon} />
              <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.text }}>
                Attendance History
              </Text>
            </View>
            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {FILTERS.map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setFilterStatus(key)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
                      backgroundColor: filterStatus === key ? colors.tint : colors.background,
                      borderColor:     filterStatus === key ? colors.tint : colors.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1,
                      color: filterStatus === key ? colors.background : colors.icon,
                    }}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Records */}
          {filteredBookings.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.icon }}>No records found</Text>
            </View>
          ) : (
            filteredBookings.map((b, i) => {
              const cfg = STATUS_CONFIG[b.attendanceStatus] || STATUS_CONFIG.pending;
              return (
                <View
                  key={b._id}
                  style={{
                    padding: 16,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                  }}
                >
                  {/* Date */}
                  <View style={{
                    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: colors.tint }}>
                      {new Date(b.date).getDate()}
                    </Text>
                    <Text style={{ fontSize: 8, fontWeight: '700', textTransform: 'uppercase', color: colors.icon }}>
                      {new Date(b.date).toLocaleString('default', { month: 'short' })}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                      <MapPin size={11} color={colors.tint} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                        {b.route?.name || '—'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Clock size={11} color={colors.icon} />
                      <Text style={{ fontSize: 11, color: colors.icon }}>
                        {b.timeSlot}{b.specificReturnTime ? ` (${b.specificReturnTime})` : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View style={{
                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
                    backgroundColor: cfg.bg, borderColor: cfg.border,
                  }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1, color: cfg.color }}>
                      {cfg.label}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
}