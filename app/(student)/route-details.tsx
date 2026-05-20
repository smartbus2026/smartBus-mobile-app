import React from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../constants/theme';
import { useRoutes } from '../../src/hooks/useRoutes';

import TopBar from '../../src/components/TopBar';
import { BOTTOM_BAR_HEIGHT } from '../../src/hooks/useBottomBarHeight';

export default function RouteDetailsPage() {
  const colors              = useThemeColor();
  const router              = useRouter();
  const { routes, isLoading } = useRoutes();

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[s.loadWrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[s.loadText, { color: colors.icon }]}>Loading Routes Data...</Text>
      </View>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────
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
        contentContainerStyle={[s.scroll, { paddingBottom: BOTTOM_BAR_HEIGHT + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {routes?.map((r: any) => {
          const busLabel = r.bus || r.code || 'BUS-01';
          return (
            <View
              key={r._id || r.name}
              style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >

              {/* ── Header ── */}
              <View style={s.cardHeader}>
                <Text style={[s.routeName, { color: colors.text }]}>{r.name}</Text>
                <View style={[s.busTag, { backgroundColor: `${colors.tint}1A`, borderColor: `${colors.tint}33` }]}>
                  <Text style={[s.busTagText, { color: colors.tint }]}>{busLabel}</Text>
                </View>
              </View>

              {/* ── Route Timeline ── */}
              <View style={s.timeline}>
                {r.stops?.map((stop: any, i: number) => {
                  const isFirst  = i === 0;
                  const isLast   = i === r.stops.length - 1;
                  const isEnd    = isFirst || isLast;
                  const stopName = typeof stop === 'string' ? stop : stop.name;

                  return (
                    <View key={(stopName || '') + i} style={s.stopRow}>
                      {/* Dot + Line */}
                      <View style={s.dotCol}>
                        <View style={[
                          s.dot,
                          isEnd
                            ? { backgroundColor: colors.tint }
                            : { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
                        ]} />
                        {!isLast && <View style={[s.line, { backgroundColor: colors.border }]} />}
                      </View>

                      {/* Stop Name */}
                      <Text style={[
                        s.stopName,
                        { color: isEnd ? colors.text : colors.icon },
                        isEnd ? s.stopNameEnd : s.stopNameMid,
                        !isLast && { marginBottom: 16 },
                      ]}>
                        {stopName}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* ── Footer ── */}
              <View style={s.footer}>
                {/* Driver */}
                <View style={[s.footerBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[s.footerLabel, { color: colors.icon }]}>DRIVER</Text>
                  <View style={s.driverRow}>
                    <View style={s.driverDot} />
                    <Text style={[s.footerValue, { color: colors.text }]}>
                      {r.driver || 'Pending'}
                    </Text>
                  </View>
                </View>

                {/* Departure */}
                <View style={[s.footerBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[s.footerLabel, s.footerLabelRight, { color: colors.icon }]}>DEPARTURE</Text>
                  <Text style={[s.departure, { color: colors.tint }]}>
                    {r.time || 'TBA'}
                  </Text>
                </View>
              </View>

            </View>
          );
        })}
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