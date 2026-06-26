import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { MapPin, Send, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import socket from '../../src/services/socket';
import Api from '../../src/services/api';
import { useThemeColor } from '../../constants/theme';
import TopBar from '../../src/components/TopBar';

interface Message {
  _id: string;
  roomId: string;
  message: string;
  sender: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export default function GroupChat() {
  const colors = useThemeColor();
  const router = useRouter();

  const [isOpen, setIsOpen]             = useState(false);
  const [messageLabel, setMessageLabel] = useState('Loading chat status...');
  const [roomId, setRoomId]             = useState('');
  const [routeName, setRouteName]       = useState('');
  const [timeSlot, setTimeSlot]         = useState('');

  const [messages, setMessages]         = useState<Message[]>([]);
  const [newMessage, setNewMessage]     = useState('');
  const [isLoading, setIsLoading]       = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const flatListRef = useRef<FlatList>(null);

  // Fetch current user ID to differentiate "my messages" from others
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) setCurrentUserId(id);
      } catch (e) {
        console.error('Failed to get user ID', e);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchChatStatus = async () => {
      try {
        const res  = await Api.get('/chat/active-group');
        const data = res.data;
        if (data.isOpen) {
          setIsOpen(true);
          setRoomId(data.roomId);
          setRouteName(data.routeName);
          setTimeSlot(data.timeSlot);
          setMessages(data.messages || []);
          socket.emit('joinRoom', data.roomId);
        } else {
          setIsOpen(false);
          setMessageLabel(data.message || 'Chat is closed.');
        }
      } catch (err) {
        console.error('Failed to fetch chat status', err);
        setMessageLabel('Failed to verify chat status.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchChatStatus();

    return () => {
      if (roomId) socket.emit('leaveRoom', roomId);
    };
  }, [roomId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleNewMessage = (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };
    socket.on('newMessage', handleNewMessage);
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [isOpen]);

  const handleSend = async () => {
    if (!newMessage.trim() || !roomId) return;
    const text = newMessage;
    setNewMessage(''); // Optimistic clear
    try {
      await Api.post(`/chat/${roomId}`, { message: text });
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const renderMessage = ({ item: m }: { item: Message }) => {
    const isMe = m.sender._id === currentUserId;
    return (
      <View style={[s.msgRow, isMe ? s.msgRowMe : s.msgRowThem]}>
        <View style={s.msgContent}>
          {!isMe && (
            <Text style={[s.senderName, { color: colors.icon }]}>{m.sender.name}</Text>
          )}
          <View style={[
            s.bubble,
            isMe
              ? { backgroundColor: colors.tint, borderBottomRightRadius: 4 }
              : [s.bubbleThem, { backgroundColor: colors.card, borderColor: colors.border }],
          ]}>
            <Text style={[s.msgText, { color: isMe ? '#000' : colors.text }]}>
              {m.message}
            </Text>
            <Text style={[s.msgTime, { color: isMe ? 'rgba(0,0,0,0.5)' : colors.icon }]}>
              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      
      {/* TopBar is always visible */}
      <TopBar
        title="Live Chat"
        showMenu={true}
        showSettings={true}
      />

      {/* ── Loading ────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={s.centerWrap}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : 

      /* ── Chat Closed ────────────────────────────────────────────────────────── */
      !isOpen ? (
        <View style={s.centerWrap}>
          <View style={[s.closedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Clock size={40} color={colors.icon} style={{ opacity: 0.5, marginBottom: 16 }} />
            <Text style={[s.closedTitle, { color: colors.text }]}>Chat Window Closed</Text>
            <Text style={[s.closedSub,   { color: colors.icon }]}>{messageLabel}</Text>
          </View>
        </View>
      ) : 

      /* ── Chat Open ──────────────────────────────────────────────────────────── */
      (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Sub Header for Route Details */}
          <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View>
              <Text style={[s.headerTitle, { color: colors.text }]}>Route Group Chat</Text>
              <View style={s.headerMeta}>
                <MapPin size={10} color={colors.tint} />
                <Text style={[s.headerMetaText, { color: colors.icon }]}>{routeName}</Text>
                <Text style={[s.headerMetaText, { color: colors.icon }]}>•</Text>
                <Text style={[s.headerMetaText, { color: colors.icon }]}>{timeSlot} Wave</Text>
              </View>
            </View>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>Live</Text>
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
                <Send size={24} color={colors.icon} style={{ opacity: 0.4, marginBottom: 8 }} />
                <Text style={[s.emptyTitle, { color: colors.text }]}>No messages yet</Text>
                <Text style={[s.emptySub,   { color: colors.icon }]}>Be the first to say hello!</Text>
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
              <Send size={14} color="#000" />
              <Text style={s.sendLabel}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },

  centerWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  closedCard:    { borderWidth: 1, borderRadius: 24, padding: 32, alignItems: 'center', maxWidth: 300 },
  closedTitle:   { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
  closedSub:     { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', lineHeight: 18 },

  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle:   { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  headerMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  headerMetaText:{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  liveBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  liveDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  liveText:      { fontSize: 10, fontWeight: '900', color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1.5 },

  messagesList:  { padding: 16, gap: 12, flexGrow: 1 },
  msgRow:        { marginBottom: 12 },
  msgRowMe:      { alignItems: 'flex-end' },
  msgRowThem:    { alignItems: 'flex-start' },
  msgContent:    { maxWidth: '75%' },
  senderName:    { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, marginLeft: 4 },

  bubble:        { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  bubbleThem:    { borderWidth: 1, borderBottomLeftRadius: 4 },
  msgText:       { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  msgTime:       { fontSize: 9, fontWeight: '700', marginTop: 4, textAlign: 'right' },

  emptyWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle:    { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
  emptySub:      { fontSize: 10, marginTop: 4 },

  inputBar:      { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  input:         { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, height: 48, borderRadius: 16, justifyContent: 'center' },
  sendDisabled:  { opacity: 0.4 },
  sendLabel:     { fontSize: 11, fontWeight: '900', color: '#000', textTransform: 'uppercase', letterSpacing: 1.5 },
});