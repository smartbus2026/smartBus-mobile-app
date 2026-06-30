import { Bot, Send, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from "react-native";
import { useThemeColor } from "../../constants/theme";
import api from "../services/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chatbot() {
  const colors = useThemeColor();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMsg: Message = { role: "user", content: message };
    setChatHistory(prev => [...prev, userMsg]);
    setMessage("");
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await api.post("/ai/chat", { message: userMsg.content });
      setChatHistory(prev => [...prev, {
        role: "assistant",
        content: response.data.reply || response.data.message || "Done",
      }]);
    } catch {
      setChatHistory(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I am having trouble connecting to the AI.",
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <View style={styles.fabContainer}>
        <Animated.View style={[
          styles.fabPulse,
          { transform: [{ scale: isOpen ? 1 : pulseAnim }], opacity: isOpen ? 0 : 0.3 }
        ]} />
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: isOpen ? "#262a33" : "#f7a01b" }]}
          onPress={() => setIsOpen(!isOpen)}
          activeOpacity={0.85}
        >
          {isOpen
            ? <X size={22} color="#fff" />
            : <Bot size={22} color="#0f1115" />
          }
        </TouchableOpacity>
      </View>

      {/* Chat Modal */}
      <Modal visible={isOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />

          <View style={[styles.chatWindow, { backgroundColor: colors.card, borderColor: colors.border }]}>

            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>SmartBus AI</Text>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>System Operational</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setIsOpen(false)}
              >
                <X size={18} color="#0f1115" />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollRef}
              style={styles.messagesArea}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {chatHistory.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🚌</Text>
                  <Text style={[styles.emptyText, { color: colors.icon }]}>
                    Your personal route assistant is ready.
                  </Text>
                </View>
              )}

              {chatHistory.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.msgRow,
                    msg.role === "user" ? styles.msgRowUser : styles.msgRowBot
                  ]}
                >
                  <View style={[
                    styles.msgBubble,
                    msg.role === "user"
                      ? styles.bubbleUser
                      : [styles.bubbleBot, { backgroundColor: "#262a33", borderColor: colors.border }]
                  ]}>
                    <Text style={[
                      styles.msgText,
                      { color: msg.role === "user" ? "#0f1115" : colors.text }
                    ]}>
                      {msg.content}
                    </Text>
                  </View>
                </View>
              ))}

              {loading && (
                <View style={styles.msgRowBot}>
                  <View style={[styles.msgBubble, styles.bubbleBot, { backgroundColor: "#262a33" }]}>
                    <View style={styles.typingDots}>
                      <ActivityIndicator size="small" color="#f7a01b" />
                      <Text style={[styles.typingText, { color: colors.icon }]}>AI Calculating...</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={[styles.inputArea, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <View style={[styles.inputWrapper, { backgroundColor: "#262a33", borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Type your query..."
                  placeholderTextColor={colors.icon}
                  value={message}
                  onChangeText={setMessage}
                  onSubmitEditing={sendMessage}
                  returnKeyType="send"
                  multiline={false}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, { opacity: !message.trim() || loading ? 0.4 : 1 }]}
                  onPress={sendMessage}
                  disabled={!message.trim() || loading}
                >
                  <Send size={16} color="#0f1115" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.footer, { color: colors.icon }]}>
                Powered by SmartBus Neural Engine
              </Text>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute", bottom: 100, right: 20, zIndex: 999,
    alignItems: "center", justifyContent: "center",
  },
  fabPulse: {
    position: "absolute", width: 56, height: 56,
    borderRadius: 18, backgroundColor: "#f7a01b",
  },
  fab: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#f7a01b", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },

  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1 },
  chatWindow: {
    height: "75%", borderTopLeftRadius: 32, borderTopRightRadius: 32,
    borderWidth: 1, overflow: "hidden",
  },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, backgroundColor: "#f7a01b",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#0f1115", letterSpacing: -0.5 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  statusText: { fontSize: 9, fontWeight: "800", color: "rgba(0,0,0,0.6)", textTransform: "uppercase", letterSpacing: 1.5 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.1)", alignItems: "center", justifyContent: "center",
  },

  messagesArea: { flex: 1 },
  messagesContent: { padding: 16, gap: 10, flexGrow: 1 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 2, textAlign: "center", paddingHorizontal: 32, lineHeight: 20 },

  msgRow: { flexDirection: "row" },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowBot: { justifyContent: "flex-start" },
  msgBubble: { maxWidth: "85%", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  bubbleUser: { backgroundColor: "#f7a01b", borderBottomRightRadius: 4 },
  bubbleBot: { borderWidth: 1, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 14, lineHeight: 20, fontWeight: "500" },

  typingDots: { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },

  inputArea: { padding: 16, borderTopWidth: 1 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 4,
  },
  input: { flex: 1, fontSize: 14, paddingVertical: 12, fontWeight: "500" },
  sendBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "#f7a01b", alignItems: "center", justifyContent: "center",
  },
  footer: { fontSize: 9, textAlign: "center", marginTop: 8, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, opacity: 0.5 },
});