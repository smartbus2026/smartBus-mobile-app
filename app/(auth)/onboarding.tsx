import { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Dimensions, StatusBar
} from "react-native";
import { router } from "expo-router";
import { Bus, MapPin, Bell, Shield } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useThemeColor } from "../../constants/theme";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: Bus,
    title: "Smart Bus",
    subtitle: "Transportation System",
    desc: "Book your university bus trips easily and efficiently. Never miss a ride again.",
    color: "#f7a01b",
  },
  {
    id: "2",
    icon: MapPin,
    title: "Live Tracking",
    subtitle: "Real-Time Location",
    desc: "Track your bus live on the map. Know exactly when it will arrive at your stop.",
    color: "#22c55e",
  },
  {
    id: "3",
    icon: Bell,
    title: "Stay Updated",
    subtitle: "Smart Notifications",
    desc: "Get instant alerts about trip delays, route changes, and important announcements.",
    color: "#3b82f6",
  },
  {
    id: "4",
    icon: Shield,
    title: "Safe & Secure",
    subtitle: "Your Safety First",
    desc: "Your data is protected. Book with confidence and travel safely every day.",
    color: "#f7a01b",
  },
];

export default function OnboardingScreen() {
  const colors = useThemeColor();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      await AsyncStorage.setItem("onboarded", "true");
      router.replace("/(auth)/login");
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("onboarded", "true");
    router.replace("/(auth)/login");
  };

  const current = SLIDES[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === "#0f1115" ? "light-content" : "dark-content"} />

      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: colors.icon }]}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => {
          const Icon = item.icon;
          return (
            <View style={[styles.slide, { width }]}>
              {/* Icon */}
              <View style={[styles.iconOuter, {
                backgroundColor: `${item.color}15`,
                borderColor: `${item.color}30`,
              }]}>
                <View style={[styles.iconMiddle, { backgroundColor: `${item.color}25` }]}>
                  <View style={[styles.iconInner, { backgroundColor: `${item.color}35` }]}>
                    <Icon size={52} color={item.color} />
                  </View>
                </View>
              </View>

              {/* Text */}
              <Text style={[styles.slideTitle, { color: item.color }]}>{item.title}</Text>
              <Text style={[styles.slideSubtitle, { color: colors.icon }]}>{item.subtitle}</Text>
              <Text style={[styles.slideDesc, { color: colors.icon }]}>{item.desc}</Text>
            </View>
          );
        }}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: i, animated: true });
              setCurrentIndex(i);
            }}
          >
            <View style={[
              styles.dot,
              { backgroundColor: i === currentIndex ? current.color : colors.border },
              i === currentIndex && styles.dotActive,
            ]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.btnsRow}>
        {currentIndex > 0 && (
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
              setCurrentIndex(currentIndex - 1);
            }}
          >
            <Text style={[styles.backBtnText, { color: colors.icon }]}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: current.color, flex: currentIndex > 0 ? 1 : undefined }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextText, { color: colors.background }]}>
            {currentIndex === SLIDES.length - 1 ? "Get Started " : "Next"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Page indicator */}
      <Text style={[styles.pageIndicator, { color: colors.icon }]}>
        {currentIndex + 1} / {SLIDES.length}
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" ,  paddingBottom: 20, // ضيفي
},

  skipBtn: { position: "absolute", top: 60, right: 24, zIndex: 10, padding: 8 },
  skipText: { fontSize: 13, fontWeight: "700" },

  slide: { alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 16 },

  iconOuter: {
    width: 200, height: 200, borderRadius: 100,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, marginBottom: 16,
  },
  iconMiddle: {
    width: 155, height: 155, borderRadius: 78,
    alignItems: "center", justifyContent: "center",
  },
  iconInner: {
    width: 115, height: 115, borderRadius: 58,
    alignItems: "center", justifyContent: "center",
  },

  slideTitle: { fontSize: 34, fontWeight: "900", letterSpacing: -1, textAlign: "center" },
  slideSubtitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 3, textAlign: "center" },
  slideDesc: { fontSize: 15, textAlign: "center", lineHeight: 24, fontWeight: "500" },

  dots: { flexDirection: "row", gap: 8, marginBottom: 32 },
  dot: { height: 8, borderRadius: 4, width: 8 },
  dotActive: { width: 28 },

  btnsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 32, width: "100%", marginBottom: 16,  paddingBottom: 20, 
 },
  backBtn: {
    paddingVertical: 16, paddingHorizontal: 24,
    borderRadius: 20, borderWidth: 1, alignItems: "center",
  },
  backBtnText: { fontSize: 15, fontWeight: "700" },
  nextBtn: {
    paddingVertical: 18, borderRadius: 20,
    alignItems: "center", width: "100%",paddingHorizontal: 20
  },
  nextText: { fontSize: 16, fontWeight: "900" },

  pageIndicator: { fontSize: 11, fontWeight: "700", marginBottom: 40, opacity: 0.5 },
});