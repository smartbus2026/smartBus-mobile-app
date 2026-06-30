// app/(student)/support.tsx
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { Check, ChevronDown, HelpCircle, MessageCircle, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import Api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';
import { BOTTOM_BAR_HEIGHT } from '../../src/hooks/useBottomBarHeight';

const FAQS = [
  { q: 'How do I book a trip?',         a: 'Go to Book Trip from the menu, select your route and time slot, then confirm your booking.' },
  { q: 'How do I cancel a booking?',    a: 'Go to My Trips, find the booking you want to cancel, and tap the Cancel button.' },
  { q: 'How do I track my bus?',        a: 'Go to Track Bus from the menu to see the live location of your bus.' },
  { q: 'What if I miss my bus?',        a: 'If you miss your bus, your booking will be marked as missed. Contact support for assistance.' },
  { q: 'How is attendance calculated?', a: 'Attendance is calculated based on your confirmed boardings vs total bookings.' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  resolved: { bg: 'rgba(34,197,94,0.1)',   text: '#22c55e', border: 'rgba(34,197,94,0.2)' },
  open:     { bg: 'rgba(247,160,27,0.1)',  text: '#f7a01b', border: 'rgba(247,160,27,0.2)' },
  pending:  { bg: 'rgba(139,142,145,0.1)', text: '#8a8d91', border: 'rgba(139,142,145,0.2)' },
};

interface Ticket {
  _id: string; subject: string;
  description: string; status: 'open' | 'pending' | 'resolved'; createdAt: string;
}

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  icon: React.ReactNode; title: string; subtitle: string;
  children: React.ReactNode; colors: any;
}> = ({ icon, title, subtitle, children, colors }) => (
  <View style={{
    borderRadius: 24, borderWidth: 1, padding: 24, marginBottom: 16,
    backgroundColor: colors.card, borderColor: colors.border,
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
      <View style={{
        width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
      }}>
        {icon}
      </View>
      <View>
        <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>
          {title}
        </Text>
        <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
    </View>
    {children}
  </View>
);

export default function SupportPage() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();

  const [openFaq, setOpenFaq]     = useState<number | null>(0);
  const [subject, setSubject]     = useState('');
  const [desc, setDesc]           = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [tickets, setTickets]     = useState<Ticket[]>([]);
  const [loading, setLoading]     = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await Api.get('/support/my');
      setTickets(res.data.data.tickets || []);
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleSubmit = async () => {
    if (!subject.trim()) return;
    setLoading(true);
    try {
      await Api.post('/support', { subject, description: desc });
      setSubmitted(true);
      fetchTickets();
    } catch {
      Alert.alert('Error', 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Support" showMenu showSettings onSettingsPress={() => router.push('/(student)/settings' as any)} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: BOTTOM_BAR_HEIGHT + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, color: colors.text }}>
            HELP &{' '}<Text style={{ color: colors.tint }}>SUPPORT</Text>
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginTop: 2 }}>
            FAQ & TICKET SYSTEM
          </Text>
        </View>

        {/* ── FAQ ── */}
        <SectionCard icon={<HelpCircle size={22} color={colors.tint} />} title="FAQ" subtitle="Common Questions" colors={colors}>
          {FAQS.map((f, i) => (
            <View key={i} style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', flex: 1, paddingRight: 10, lineHeight: 18, color: colors.text }}>
                  {f.q}
                </Text>
                <ChevronDown
                  size={13} color={colors.icon}
                  style={{ transform: [{ rotate: openFaq === i ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
              {openFaq === i && (
                <Text style={{ fontSize: 12, lineHeight: 18, paddingBottom: 12, color: colors.icon }}>
                  {f.a}
                </Text>
              )}
            </View>
          ))}
        </SectionCard>

        {/* ── Submit Ticket ── */}
        <SectionCard icon={<MessageCircle size={22} color={colors.tint} />} title="Submit a Ticket" subtitle="Get Help from Support" colors={colors}>
          {submitted ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <View style={{
                width: 64, height: 64, borderRadius: 20, marginBottom: 16,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
              }}>
                <Check size={28} color="#22c55e" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text, marginBottom: 6 }}>
                Ticket Submitted!
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.icon, marginBottom: 20 }}>
                We'll respond within 24 hours.
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => { setSubmitted(false); setSubject(''); setDesc(''); }}
                style={{
                  borderWidth: 1, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10,
                  backgroundColor: colors.background, borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: colors.text }}>
                  Send Another Report
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {/* Subject */}
              <View>
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 8 }}>
                  SUBJECT
                </Text>
                <View style={{
                  borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52,
                  backgroundColor: colors.background, borderColor: colors.border,
                }}>
                  <TextInput
                    style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text, height: '100%' }}
                    placeholder="What's the problem?"
                    placeholderTextColor={colors.icon}
                    value={subject}
                    onChangeText={setSubject}
                  />
                </View>
              </View>

              {/* Description */}
              <View>
                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginBottom: 8 }}>
                  DESCRIPTION
                </Text>
                <View style={{
                  borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
                  backgroundColor: colors.background, borderColor: colors.border,
                }}>
                  <TextInput
                    style={{ fontSize: 14, fontWeight: '600', color: colors.text, height: 100, textAlignVertical: 'top' }}
                    placeholder="Describe the issue in detail..."
                    placeholderTextColor={colors.icon}
                    value={desc}
                    onChangeText={setDesc}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>

              {/* Submit Btn */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!subject.trim() || loading}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  paddingVertical: 14, borderRadius: 14,
                  backgroundColor: colors.tint,
                  opacity: (!subject.trim() || loading) ? 0.5 : 1,
                }}
              >
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <>
                      <Send size={15} color="#000" />
                      <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#000' }}>
                        SUBMIT TICKET
                      </Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          )}
        </SectionCard>

        {/* ── Previous Tickets ── */}
        <SectionCard icon={<HelpCircle size={22} color={colors.icon} />} title="Previous Tickets" subtitle="Your Support History" colors={colors}>
          {tickets.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, textAlign: 'center' }}>
                No tickets submitted yet
              </Text>
            </View>
          ) : (
            tickets.map(t => {
              const sc = STATUS_COLORS[t.status] || STATUS_COLORS.pending;
              return (
                <View
                  key={t._id}
                  style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8,
                    backgroundColor: colors.background, borderColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 3 }} numberOfLines={1}>
                      {t.subject}
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: colors.icon }}>
                      {t._id.slice(-6).toUpperCase()} • {new Date(t.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{
                    borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
                    backgroundColor: sc.bg, borderColor: sc.border,
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: sc.text }}>
                      {t.status}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </SectionCard>

      </ScrollView>
    </View>
  );
}