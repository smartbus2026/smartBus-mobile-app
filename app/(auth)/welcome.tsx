import { View, Text } from "react-native";
export default function WelcomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0f1115", justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "#fff" }}>Welcome</Text>
    </View>
  );
}