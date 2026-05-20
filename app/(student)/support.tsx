import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import {
  HelpCircle, MessageCircle, Send, Check, ChevronDown,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Api from '../../src/services/api';
import { useThemeColor } from '../../constants/theme';
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
  _id: string;
  subject: string;
  description: string;
  status: 'open' | 'pending' | 'resolved';
  createdAt: string;
}

export default function SupportPage() {
  const colors = useThemeColor();
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
    } catch (err) {
      Alert.alert('Error', 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  const inputBg = { backgroundColor: colors.background === '#f8f9fa' ? '#f0f1f3' : '#262a33' };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      <TopBar
        title="Support"
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(student)/settings' as any)}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: BOTTOM_BAR_HEIGHT + 16 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── FAQ ── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.cardHeader}>
            <View style={[s.iconBox, { backgroundColor: `${colors.tint}1A` }]}>
              <HelpCircle size={16} color={colors.tint} />
            </View>
            <Text style={[s.cardTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          </View>

          {FAQS.map((f, i) => (
            <View key={i} style={[s.faqItem, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={s.faqQuestion}
                onPress={() => setOpenFaq(openFaq === i ? null : i)}
                activeOpacity={0.7}
              >
                <Text style={[s.faqQ, { color: colors.text }]}>{f.q}</Text>
                <ChevronDown
                  size={13}
                  color={colors.icon}
                  style={{ transform: [{ rotate: openFaq === i ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
              {openFaq === i && (
                <Text style={[s.faqA, { color: colors.icon }]}>{f.a}</Text>
              )}
            </View>
          ))}
        </View>

        {/* ── Submit Ticket ── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.cardHeader}>
            <View style={[s.iconBox, { backgroundColor: `${colors.tint}1A` }]}>
              <MessageCircle size={16} color={colors.tint} />
            </View>
            <Text style={[s.cardTitle, { color: colors.text }]}>Submit a Ticket</Text>
          </View>

          {submitted ? (
            <View style={s.successWrap}>
              <View style={s.successIcon}>
                <Check size={28} color="#22c55e" />
              </View>
              <Text style={[s.successTitle, { color: colors.text }]}>Ticket Submitted!</Text>
              <Text style={[s.successSub, { color: colors.icon }]}>We'll respond within 24 hours.</Text>
              <TouchableOpacity
                onPress={() => { setSubmitted(false); setSubject(''); setDesc(''); }}
                activeOpacity={0.7}
              >
                <Text style={[s.successLink, { color: colors.tint }]}>Send another report</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.formWrap}>
              <View style={s.fieldWrap}>
                <Text style={[s.label, { color: colors.icon }]}>SUBJECT</Text>
                <TextInput
                  style={[s.input, inputBg, { borderColor: colors.border, color: colors.text }]}
                  placeholder="What's the problem?"
                  placeholderTextColor={colors.icon}
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>
              <View style={s.fieldWrap}>
                <Text style={[s.label, { color: colors.icon }]}>DESCRIPTION</Text>
                <TextInput
                  style={[s.input, s.textArea, inputBg, { borderColor: colors.border, color: colors.text }]}
                  placeholder="Describe the issue in detail..."
                  placeholderTextColor={colors.icon}
                  value={desc}
                  onChangeText={setDesc}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              <TouchableOpacity
                style={[s.submitBtn, { backgroundColor: colors.tint }, (!subject.trim() || loading) && s.submitDisabled]}
                onPress={handleSubmit}
                disabled={!subject.trim() || loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <>
                      <Send size={15} color="#000" />
                      <Text style={s.submitText}>Submit Ticket</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Previous Tickets ── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>PREVIOUS TICKETS</Text>
          {tickets.length === 0 ? (
            <Text style={[s.emptyText, { color: colors.icon }]}>You haven't submitted any tickets yet.</Text>
          ) : (
            tickets.map(t => {
              const sc = STATUS_COLORS[t.status] || STATUS_COLORS.pending;
              return (
                <View key={t._id} style={[s.ticketRow, inputBg, { borderColor: colors.border }]}>
                  <View style={s.ticketLeft}>
                    <Text style={[s.ticketSubject, { color: colors.text }]} numberOfLines={1}>
                      {t.subject}
                    </Text>
                    <Text style={[s.ticketMeta, { color: colors.icon }]}>
                      {t._id.slice(-6).toUpperCase()} • {new Date(t.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                    <Text style={[s.statusText, { color: sc.text }]}>{t.status}</Text>
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

const s = StyleSheet.create({
  root:           { flex: 1 },
  scroll:         { padding: 20, paddingTop: 16, gap: 14 },

  card:           { borderWidth: 1, borderRadius: 20, padding: 20 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  iconBox:        { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle:      { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  faqItem:        { borderTopWidth: 1, paddingVertical: 4 },
  faqQuestion:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  faqQ:           { fontSize: 13, fontWeight: '700', flex: 1, paddingRight: 10, lineHeight: 18 },
  faqA:           { fontSize: 12, lineHeight: 18, paddingBottom: 10 },

  successWrap:    { alignItems: 'center', paddingVertical: 24 },
  successIcon:    { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(34,197,94,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  successTitle:   { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  successSub:     { fontSize: 11, marginBottom: 16 },
  successLink:    { fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },

  formWrap:       { gap: 14 },
  fieldWrap:      { gap: 6 },
  label:          { fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  input:          { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13 },
  textArea:       { height: 100, paddingTop: 12 },

  submitBtn:      { borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitDisabled: { opacity: 0.5 },
  submitText:     { color: '#000', fontWeight: '700', fontSize: 13 },

  sectionTitle:   { fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 },
  emptyText:      { textAlign: 'center', fontSize: 12, paddingVertical: 24, opacity: 0.5 },

  ticketRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  ticketLeft:     { flex: 1, marginRight: 10 },
  ticketSubject:  { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  ticketMeta:     { fontSize: 10, fontWeight: '500' },
  statusBadge:    { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText:     { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
});