import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { HelpCircle, Check, Send } from 'lucide-react-native';
import { io, Socket } from 'socket.io-client';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Api from '../../src/services/api';
import { useThemeColor } from '../../constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import TopBar from '../../src/components/TopBar';

interface ChatMessage {
  _id: string;
  sender: { _id: string; name: string };
  message: string;
  createdAt: string;
}

export default function TripChat() {
  const colors   = useThemeColor();
  const router   = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { token }  = useAuth();

  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage]       = useState('');
  const [error, setError]                 = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const socketRef   = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id || '');
      } catch {}
    }
  }, [token]);

  useEffect(() => {
    if (!tripId || tripId === 'default' || tripId.length < 24) {
      setError('Please select a valid trip to start chatting.');
      return;
    }
    setError(null);

    const fetchHistory = async () => {
      try {
        const res = await Api.get(`/chat/${tripId}`);
        setMessages(res.data || []);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
      } catch (err: any) {
        if (err.response?.status === 403)
          setError('Access denied. You are not registered for this trip.');
      }
    };
    fetchHistory();

    socketRef.current = io('http://192.168.1.105:5001', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current.emit('join-trip-room', tripId);
    socketRef.current.on('new-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => {
      socketRef.current?.emit('leave-trip-room', tripId);
      socketRef.current?.disconnect();
    };
  }, [tripId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !tripId || tripId === 'default') return;
    const text = newMessage;
    setNewMessage('');
    try {
      await Api.post(`/chat/${tripId}`, { message: text });
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const renderMessage = ({ item: msg }: { item: ChatMessage }) => {
    const isMe = msg.sender._id === currentUserId;
    return (
      <View style={[s.msgRow, isMe ? s.msgRowMe : s.msgRowThem]}>
        <View style={s.msgContent}>
          {!isMe && (
            <Text style={[s.senderName, { color: colors.icon }]}>{msg.sender.name}</Text>
          )}
          <View style={[
            s.bubble,
            isMe
              ? { backgroundColor: colors.tint, borderBottomRightRadius: 4 }
              : [s.bubbleThem, { backgroundColor: colors.card, borderColor: colors.border }],
          ]}>
            <Text style={[s.msgText, { color: isMe ? '#000' : colors.text }]}>
              {msg.message}
            </Text>
            <View style={s.msgMeta}>
              <Text style={[s.msgTime, { color: isMe ? 'rgba(0,0,0,0.5)' : colors.icon }]}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {isMe && <Check size={10} color="rgba(0,0,0,0.5)" />}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      <TopBar
        title="Live Chat"
        showMenu
        showBack={false}
        showSettings
        onSettingsPress={() => router.push('/(student)/settings' as any)}
      />

      {error ? (
        <View style={[s.errorWrap, { backgroundColor: colors.background }]}>
          <View style={[s.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <HelpCircle size={48} color={colors.tint} style={{ opacity: 0.5, marginBottom: 12 }} />
            <Text style={[s.errorText, { color: colors.icon }]}>{error}</Text>
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Online indicator */}
          <View style={[s.onlineBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={s.onlineDot} />
            <Text style={s.onlineText}>Connected Live</Text>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, i) => item._id || String(i)}
            renderItem={renderMessage}
            contentContainerStyle={s.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Text style={[s.emptyText, { color: colors.icon }]}>Start the conversation</Text>
              </View>
            }
          />

          {/* Input */}
          <View style={[s.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TextInput
              style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Type your message..."
              placeholderTextColor={colors.icon}
              value={newMessage}
              onChangeText={setNewMessage}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity
              style={[s.sendBtn, { backgroundColor: colors.tint }, !newMessage.trim() && s.sendDisabled]}
              onPress={handleSend}
              disabled={!newMessage.trim()}
              activeOpacity={0.85}
            >
              <Send size={18} color="#000" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },

  errorWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorCard:    { borderWidth: 1, borderRadius: 24, padding: 32, alignItems: 'center' },
  errorText:    { fontSize: 13, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },

  onlineBar:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1 },
  onlineDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  onlineText:   { fontSize: 9, fontWeight: '800', color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1.5 },

  messagesList: { padding: 16, gap: 12, flexGrow: 1 },
  msgRow:       { marginBottom: 12 },
  msgRowMe:     { alignItems: 'flex-end' },
  msgRowThem:   { alignItems: 'flex-start' },
  msgContent:   { maxWidth: '75%' },
  senderName:   { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, marginLeft: 4 },

  bubble:       { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  bubbleThem:   { borderWidth: 1, borderBottomLeftRadius: 4 },
  msgText:      { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  msgMeta:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: 'flex-end' },
  msgTime:      { fontSize: 8, fontWeight: '700' },

  emptyWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, opacity: 0.3 },
  emptyText:    { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },

  inputBar:     { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1 },
  input:        { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn:      { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
});
import { BOTTOM_BAR_HEIGHT } from '../../src/hooks/useBottomBarHeight';

// في الـ styles
<View style={{ flex: 1, paddingBottom: BOTTOM_BAR_HEIGHT }}></View>