import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../constants/theme';
import Api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';

interface BusRoute {
  id: string;
  code: string;
  name: string;
  distance: string;
  duration: string;
  stops: string[];
  driver?: string;
  time?: string;
  bus?: string;
}

export default function RouteDetailsPage() {
  const colors  = useThemeColor();
  const router  = useRouter();
  const [routes, setRoutes]       = useState<BusRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await Api.get('/routes');
        const data = res.data?.data || res.data || [];
        const mapped = data.map((r: any, i: number) => ({
          id:       r._id,
          code:     `R-${String(i + 1).padStart(3, '0')}`,
          name:     r.name,
          distance: r.distance || '—',
          duration: r.duration || '—',
          stops:    r.stops ? r.stops.map((s: any) => s.name || s) : [],
          driver:   r.driver || 'Pending',
          time:     r.time || 'TBA',
          bus:      r.bus || r.code || 'BUS-01',
        }));
        setRoutes(mapped);
      } catch (err) {
        console.error('Failed to fetch routes', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <View style={[s.loadWrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[s.loadText, { color: colors.icon }]}>Loading Routes Data...</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      <TopBar
        title="Route Details"
        showMenu
        showSettings
        onSettingsPress={() => router.push('/(student)/settings' as any)}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {routes.map((r) => (
          <View key={r.id} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

            {/* Header */}
            <View style={s.cardHeader}>
              <Text style={[s.routeName, { color: colors.text }]}>{r.name}</Text>
              <View style={[s.busTag, { backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}33` }]}>
                <Text style={[s.busTagText, { color: colors.tint }]}>{r.bus}</Text>
              </View>
            </View>

            {/* Route Timeline */}
            <View style={s.timeline}>
              {r.stops.map((stop, i) => {
                const isFirst = i === 0;
                const isLast  = i === r.stops.length - 1;
                const isEnd   = isFirst || isLast;
                return (
                  <View key={stop + i} style={s.stopRow}>
                    <View style={s.dotCol}>
                      <View style={[
                        s.dot,
                        isEnd
                          ? { backgroundColor: colors.tint }
                          : { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
                      ]} />
                      {!isLast && <View style={[s.line, { backgroundColor: colors.border }]} />}
                    </View>
                    <Text style={[
                      s.stopName,
                      { color: isEnd ? colors.text : colors.icon },
                      isEnd ? s.stopNameEnd : s.stopNameMid,
                      !isLast && { marginBottom: 16 },
                    ]}>
                      {stop}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Footer */}
            <View style={s.footer}>
              <View style={[s.footerBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[s.footerLabel, { color: colors.icon }]}>DRIVER</Text>
                <View style={s.driverRow}>
                  <View style={s.driverDot} />
                  <Text style={[s.footerValue, { color: colors.text }]}>{r.driver}</Text>
                </View>
              </View>
              <View style={[s.footerBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[s.footerLabel, s.footerLabelRight, { color: colors.icon }]}>DEPARTURE</Text>
                <Text style={[s.departure, { color: colors.tint }]}>{r.time}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1 },
  scroll:           { padding: 16, gap: 14 },

  loadWrap:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadText:         { fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  card:             { borderWidth: 1, borderRadius: 20, padding: 20 },
  cardHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  routeName:        { fontSize: 15, fontWeight: '800', flex: 1, marginRight: 10 },
  busTag:           { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  busTagText:       { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  timeline:         { marginBottom: 16 },
  stopRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dotCol:           { alignItems: 'center', width: 12 },
  dot:              { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  line:             { width: 1.5, height: 20, marginTop: 2 },
  stopName:         { fontSize: 12, flex: 1, lineHeight: 18 },
  stopNameEnd:      { fontWeight: '700' },
  stopNameMid:      { fontWeight: '500' },

  footer:           { flexDirection: 'row', gap: 10 },
  footerBox:        { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12 },
  footerLabel:      { fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  footerLabelRight: { textAlign: 'right' },
  driverRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  driverDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  footerValue:      { fontSize: 11, fontWeight: '700' },
  departure:        { fontSize: 13, fontWeight: '800', textAlign: 'right' },
});
import { BOTTOM_BAR_HEIGHT } from '../../src/hooks/useBottomBarHeight';

// في الـ styles
<View style={{ flex: 1, paddingBottom: BOTTOM_BAR_HEIGHT }}></View>