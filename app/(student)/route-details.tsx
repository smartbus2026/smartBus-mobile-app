// app/(student)/route-details.tsx
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Map } from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { useRoutes } from '../../src/hooks/useRoutes';
import TopBar from '../../src/components/TopBar';
import { BOTTOM_BAR_HEIGHT } from '../../src/hooks/useBottomBarHeight';

export default function RouteDetailsPage() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { routes, isLoading } = useRoutes();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar title="Route Details" showMenu showSettings onSettingsPress={() => router.push('/(student)/settings' as any)} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>
            LOADING ROUTES...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Route Details" showMenu showSettings onSettingsPress={() => router.push('/(student)/settings' as any)} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: BOTTOM_BAR_HEIGHT + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, color: colors.text }}>
            ROUTE{' '}
            <Text style={{ color: colors.tint }}>DETAILS</Text>
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.icon, marginTop: 2 }}>
            STOPS & SCHEDULE
          </Text>
        </View>

        {routes?.map((r: any) => {
          const busLabel = r.bus || r.code || 'BUS-01';
          return (
            <View
              key={r._id || r.name}
              style={{
                borderRadius: 24, borderWidth: 1, padding: 24, marginBottom: 16,
                backgroundColor: colors.card, borderColor: colors.border,
              }}
            >
              {/* Card Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <View style={{
                  width: 48, height: 48, borderRadius: 16,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
                }}>
                  <Map size={22} color={colors.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>
                    {r.name}
                  </Text>
                  <View style={{
                    alignSelf: 'flex-start', marginTop: 4,
                    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
                    backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
                  }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 2, color: colors.tint }}>
                      {busLabel}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Timeline */}
              <View style={{ marginBottom: 16 }}>
                {r.stops?.map((stop: any, i: number) => {
                  const isFirst  = i === 0;
                  const isLast   = i === r.stops.length - 1;
                  const isEnd    = isFirst || isLast;
                  const stopName = typeof stop === 'string' ? stop : stop.name;
                  return (
                    <View key={(stopName || '') + i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <View style={{ alignItems: 'center', width: 12 }}>
                        <View style={{
                          width: 10, height: 10, borderRadius: 5, marginTop: 3,
                          ...(isEnd
                            ? { backgroundColor: colors.tint }
                            : { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border }),
                        }} />
                        {!isLast && (
                          <View style={{ width: 1.5, height: 20, marginTop: 2, backgroundColor: colors.border }} />
                        )}
                      </View>
                      <Text style={{
                        fontSize: 12, flex: 1, lineHeight: 18,
                        fontWeight: isEnd ? '800' : '500',
                        color: isEnd ? colors.text : colors.icon,
                        ...(!isLast && { marginBottom: 16 }),
                      }}>
                        {stopName}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Footer */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Driver */}
                <View style={{
                  flex: 1, borderWidth: 1, borderRadius: 14, padding: 12,
                  backgroundColor: colors.background, borderColor: colors.border,
                }}>
                  <Text style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: colors.icon, marginBottom: 6 }}>
                    DRIVER
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>
                      {r.driver || 'Pending'}
                    </Text>
                  </View>
                </View>

                {/* Departure */}
                <View style={{
                  flex: 1, borderWidth: 1, borderRadius: 14, padding: 12,
                  backgroundColor: colors.background, borderColor: colors.border,
                }}>
                  <Text style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: colors.icon, marginBottom: 6, textAlign: 'right' }}>
                    DEPARTURE
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '900', textAlign: 'right', color: colors.tint }}>
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