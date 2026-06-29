// app/(student)/route-chat.tsx
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView,
  Platform, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { MapPin, Send, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import socket from '../../src/services/socket';
import Api from '../../src/services/api';
import TopBar from '../../src/components/TopBar';

interface Message {
  _id: string;
  roomId: string;
  message: string;
  sender: { _id: string; name: string };
  createdAt: string;
}

export default function GroupChat() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();

  const [isOpen, setIsOpen]               = useState(false);
  const [messageLabel, setMessageLabel]   = useState('Loading chat status...');
  const [roomId, setRoomId]               = useState('');
  const [routeName, setRouteName]         = useState('');
  const [timeSlot, setTimeSlot]           = useState('');
  const [messages, setMessages]           = useState<Message[]>([]);
  const [newMessage, setNewMessage]       = useState('');
  const [isLoading, setIsLoading]         = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    AsyncStorage.getItem('userId')
      .then(id => { if (id) setCurrentUserId(id); })
      .catch(e => console.error('Failed to get user ID', e));
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
      } catch {
        setMessageLabel('Failed to verify chat status.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchChatStatus();
    return () => { if (roomId) socket.emit('leaveRoom', roomId); };
  }, [roomId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleNewMessage = (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };
    socket.on('newMessage', handleNewMessage);
    return () => { socket.off('newMessage', handleNewMessage); };
  }, [isOpen]);

  const handleSend = async () => {
    if (!newMessage.trim() || !roomId) return;
    const text = newMessage;
    setNewMessage('');
    try {
      await Api.post(`/chat/${roomId}`, { message: text });
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const renderMessage = ({ item: m }: { item: Message }) => {
    const isMe = m.sender._id === currentUserId;
    return (
      <View style={{ marginBottom: 12, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        <View style={{ maxWidth: '75%' }}>
          {!isMe && (
            <Text style={{
              fontSize: 9, fontWeight: '800', textTransform: 'uppercase',
              letterSpacing: 1, color: colors.icon, marginBottom: 4, marginLeft: 4,
            }}>
              {m.sender.name}
            </Text>
          )}
          <View style={{
            paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
            ...(isMe
              ? { backgroundColor: colors.tint, borderBottomRightRadius: 4 }
              : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 }),
          }}>
            <Text style={{ fontSize: 14, fontWeight: '500', lineHeight: 20, color: isMe ? '#000' : colors.text }}>
              {m.message}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: '700', marginTop: 4, textAlign: 'right', color: isMe ? 'rgba(0,0,0,0.5)' : colors.icon }}>
              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Live Chat" showMenu showSettings />

      {/* ── Loading ── */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: colors.icon }}>
            LOADING...
          </Text>
        </View>

      /* ── Chat Closed ── */
      ) : !isOpen ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{
            borderWidth: 1, borderRadius: 24, padding: 32,
            alignItems: 'center', maxWidth: 300,
            backgroundColor: colors.card, borderColor: colors.border,
          }}>
            <View style={{
              width: 72, height: 72, borderRadius: 24,
              alignItems: 'center', justifyContent: 'center', marginBottom: 20,
              backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
            }}>
              <Clock size={32} color={colors.icon} />
            </View>
            <Text style={{
              fontSize: 13, fontWeight: '900', textTransform: 'uppercase',
              letterSpacing: 1, color: colors.text, textAlign: 'center', marginBottom: 8,
            }}>
              CHAT{' '}<Text style={{ color: colors.tint }}>CLOSED</Text>
            </Text>
            <Text style={{
              fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
              letterSpacing: 1, color: colors.icon, textAlign: 'center', lineHeight: 18,
            }}>
              {messageLabel}
            </Text>
          </View>
        </View>

      /* ── Chat Open ── */
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          {/* Sub Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingVertical: 14,
            backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
          }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.text }}>
                Route Group Chat
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <MapPin size={10} color={colors.tint} />
                <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>
                  {routeName}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.icon }}>•</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: colors.icon }}>
                  {timeSlot} Wave
                </Text>
              </View>
            </View>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
              backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                LIVE
              </Text>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, i) => item._id || String(i)}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
                <View style={{
                  width: 56, height: 56, borderRadius: 18, marginBottom: 16,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: `${colors.tint}1A`, borderWidth: 1, borderColor: `${colors.tint}33`,
                }}>
                  <Send size={22} color={colors.tint} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: colors.text }}>
                  No messages yet
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.icon, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Be the first to say hello!
                </Text>
              </View>
            }
          />

          {/* Input Bar */}
          <View style={{
            flexDirection: 'row', alignItems: 'flex-end', gap: 10,
            padding: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12,
            backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
          }}>
            <TextInput
              style={{
                flex: 1, borderWidth: 1, borderRadius: 20,
                paddingHorizontal: 16, paddingVertical: 10,
                fontSize: 14, maxHeight: 100, fontWeight: '600',
                backgroundColor: colors.background, borderColor: colors.border, color: colors.text,
              }}
              placeholder="Type your message..."
              placeholderTextColor={colors.icon}
              value={newMessage}
              onChangeText={setNewMessage}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!newMessage.trim()}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 20, height: 48, borderRadius: 16, justifyContent: 'center',
                backgroundColor: colors.tint, opacity: !newMessage.trim() ? 0.4 : 1,
              }}
            >
              <Send size={14} color="#000" />
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#000', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                SEND
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}