import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Bus, Send, HelpCircle, Check } from 'lucide-react-native';
import { io, Socket } from 'socket.io-client';
import Api from '../../src/services/api';
import { useThemeColor } from '../../constants/theme';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

interface ChatMessage {
  _id: string;
  sender: { _id: string; name: string };
  message: string;
  createdAt: string;
}

export default function TripChat() {
  const colors                          = useThemeColor();
  const { tripId }                      = useLocalSearchParams<{ tripId: string }>();
  const { token }                       = useAuth();
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage]     = useState('');
  const [error, setError]               = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const socketRef                       = useRef<Socket | null>(null);
  const flatListRef                     = useRef<FlatList>(null);

  // Get current user id from token
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
        if (err.response?.status === 403) {
          setError('Access denied. You are not registered for this trip.');
        }
      }
    };
    fetchHistory();

    socketRef.current = io('http://10.171.240.125:5001', {
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

  if (error) {
    return (
      <View style={[s.errorWrap, { backgroundColor: colors.background }]}>
        <View style={[s.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <HelpCircle size={48} color="#f7a01b" style={{ opacity: 0.5, marginBottom: 12 }} />
          <Text style={[s.errorText, { color: colors.icon }]}>{error}</Text>
        </View>
      </View>
    );
  }

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
              ? s.bubbleMe
              : [s.bubbleThem, { backgroundColor: colors.card, borderColor: colors.border }]
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
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={s.headerLeft}>
          <View style={s.headerIcon}>
            <Bus size={20} color="#f7a01b" />
          </View>
          <View>
            <Text style={[s.headerTitle, { color: colors.text }]}>Trip Live Chat</Text>
            <View style={s.onlineRow}>
              <View style={s.onlineDot} />
              <Text style={s.onlineText}>Connected Live</Text>
            </View>
          </View>
        </View>
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
          style={[s.sendBtn, !newMessage.trim() && s.sendDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim()}
          activeOpacity={0.85}
        >
          <Send size={18} color="#000" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },

  errorWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorCard:    { borderWidth: 1, borderRadius: 24, padding: 32, alignItems: 'center' },
  errorText:    { fontSize: 13, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon:   { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(247,160,27,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(247,160,27,0.2)' },
  headerTitle:  { fontSize: 15, fontWeight: '700' },
  onlineRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  onlineDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  onlineText:   { fontSize: 9, fontWeight: '800', color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1.5 },

  messagesList: { padding: 16, gap: 12, flexGrow: 1 },
  msgRow:       { marginBottom: 12 },
  msgRowMe:     { alignItems: 'flex-end' },
  msgRowThem:   { alignItems: 'flex-start' },
  msgContent:   { maxWidth: '75%' },
  senderName:   { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, marginLeft: 4 },

  bubble:       { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  bubbleMe:     { backgroundColor: '#f7a01b', borderBottomRightRadius: 4 },
  bubbleThem:   { borderWidth: 1, borderBottomLeftRadius: 4 },
  msgText:      { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  msgMeta:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: 'flex-end' },
  msgTime:      { fontSize: 8, fontWeight: '700' },

  emptyWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, opacity: 0.3 },
  emptyText:    { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },

  inputBar:     { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1 },
  input:        { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn:      { width: 48, height: 48, borderRadius: 16, backgroundColor: '#f7a01b', alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
});