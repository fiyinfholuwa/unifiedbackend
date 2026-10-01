import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import apiService from '../../api/apiService';
import { platforms } from '../../api/mockData';
import { useSubscription } from '../../context/SubscriptionContext';
import { useTheme } from '../../context/ThemeContext';
import { useAppAlert } from '../../context/AppAlertContext';

const uniqueMessages = items => Array.from(
  new Map(items.map(message => [message.id, message])).values(),
);

const EMOJIS = ['😀', '😂', '😍', '🥰', '👍', '🙏', '🎉', '❤️', '🔥', '✨', '😢', '😮'];
const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🙏'];

function VoiceNote({ uri, duration, isMine, theme }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const seconds = Math.max(1, Math.round(status.duration || duration || 0));
  const current = Math.round(status.currentTime || 0);

  const toggle = () => {
    if (status.playing) player.pause();
    else {
      if (status.didJustFinish || status.currentTime >= status.duration) player.seekTo(0);
      player.play();
    }
  };

  return (
    <View style={styles.voiceNote}>
      <TouchableOpacity style={[styles.voicePlay, { backgroundColor: isMine ? 'rgba(255,255,255,.2)' : theme.muted }]} onPress={toggle}>
        <Icon name={status.playing ? 'pause' : 'play'} size={17} color={isMine ? '#fff' : theme.primary} />
      </TouchableOpacity>
      <View style={styles.waveform}>{[8, 15, 11, 19, 13, 22, 9, 17, 12, 20, 10, 15].map((height, index) => <View key={index} style={[styles.waveBar, { height, backgroundColor: isMine ? 'rgba(255,255,255,.75)' : theme.tint }]} />)}</View>
      <Text style={[styles.voiceDuration, { color: isMine ? 'rgba(255,255,255,.78)' : theme.secondaryText }]}>{status.playing ? current : seconds}s</Text>
    </View>
  );
}

export default function ChatDetailScreen({ route, navigation }) {
  const {
    conversationId,
    contactName = 'Conversation',
    avatar,
    platform: platformId,
  } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const listRef = useRef(null);
  const { theme } = useTheme();
  const Alert = useAppAlert();
  const { plan, remaining, canSendMessage, recordSentMessage } = useSubscription();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const platformInfo = platforms.find(item => item.id === platformId);
  const canSubmit = inputText.trim().length > 0 && !sending;

  const showLimitAlert = () => Alert.alert(
    'Monthly limit reached',
    `You have used all ${plan.limit} messages included in your ${plan.name} plan.`,
    [{ text: 'Not now', style: 'cancel' }, { text: 'View plans', onPress: () => navigation.navigate('Subscription') }],
  );

  const scrollToLatest = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const data = await apiService.getMessages(conversationId);
      setMessages(uniqueMessages(data));
    } catch (error) {
      Alert.alert('Could not load messages', 'Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const sendMessage = async () => {
    const message = inputText.trim();
    if (!message || sending) return;

    if (!canSendMessage) {
      showLimitAlert();
      return;
    }

    setSending(true);
    try {
      const newMessage = await apiService.sendMessage(conversationId, message);
      await recordSentMessage();
      setMessages(current => current.some(item => item.id === newMessage.id)
        ? current
        : [...current, newMessage]);
      setInputText('');
      scrollToLatest();
    } catch (error) {
      Alert.alert('Message not sent', 'Please try sending your message again.');
    } finally {
      setSending(false);
    }
  };

  const sendMedia = async payload => {
    if (!canSendMessage) return showLimitAlert();
    setSending(true);
    try {
      const newMessage = await apiService.sendMediaMessage(conversationId, payload);
      await recordSentMessage();
      setMessages(current => [...current, newMessage]);
      setShowTools(false);
      setShowEmojis(false);
      scrollToLatest();
    } catch (error) {
      Alert.alert('Message not sent', 'Please try sending it again.');
    } finally {
      setSending(false);
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Gallery permission needed', 'Allow photo access to upload images in chat.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsMultipleSelection: false });
    if (!result.canceled && result.assets?.[0]) {
      await sendMedia({ type: 'image', uri: result.assets[0].uri, width: result.assets[0].width, height: result.assets[0].height });
    }
  };

  const startRecording = async () => {
    if (!canSendMessage) return showLimitAlert();
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone permission needed', 'Allow microphone access to record voice notes.');
      return;
    }
    try {
      setShowTools(false);
      setShowEmojis(false);
      Keyboard.dismiss();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      Alert.alert('Could not record', 'Please check your microphone and try again.');
    }
  };

  const finishRecording = async (send = true) => {
    const duration = recorderState.durationMillis;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (send && recorder.uri && duration >= 500) await sendMedia({ type: 'audio', uri: recorder.uri, duration: duration / 1000 });
      else if (send && duration < 500) Alert.alert('Voice note too short', 'Hold on a little longer before sending.');
    } catch (error) {
      Alert.alert('Could not save voice note', 'Please try recording again.');
    }
  };

  const reactToMessage = async reaction => {
    const message = selectedMessage;
    setSelectedMessage(null);
    if (!message) return;
    try {
      const updated = await apiService.reactToMessage(conversationId, message.id, reaction);
      setMessages(current => current.map(item => item.id === updated.id ? updated : item));
    } catch (error) {
      Alert.alert('Could not add reaction', 'Please try again.');
    }
  };

  const deleteSelectedMessage = forEveryone => {
    const message = selectedMessage;
    setSelectedMessage(null);
    if (!message) return;
    Alert.alert(
      forEveryone ? 'Delete for everyone?' : 'Delete for you?',
      forEveryone ? 'Everyone in this conversation will see that the message was deleted.' : 'This message will only be removed from your view.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteMessage(conversationId, message.id, forEveryone);
              setMessages(current => forEveryone
                ? current.map(item => item.id === message.id ? { id: item.id, sender: item.sender, type: 'deleted', text: 'This message was deleted', timestamp: item.timestamp } : item)
                : current.filter(item => item.id !== message.id));
            } catch (error) {
              Alert.alert('Could not delete message', 'Please try again.');
            }
          },
        },
      ],
    );
  };

  const renderMessage = ({ item, index }) => {
    const isMine = item.sender === 'me';
    const previousMessage = messages[index - 1];
    const startsGroup = !previousMessage || previousMessage.sender !== item.sender;

    return (
      <TouchableOpacity
        style={[
          styles.messageRow,
          isMine ? styles.myMessage : styles.otherMessage,
          startsGroup && styles.groupStart,
          item.reaction && styles.hasReaction,
        ]}
        activeOpacity={0.88}
        delayLongPress={350}
        onLongPress={() => item.type !== 'deleted' && setSelectedMessage(item)}
      >
        <View
          style={[
            styles.bubble,
            isMine ? styles.myBubble : styles.otherBubble,
            {
              backgroundColor: isMine ? theme.primary : theme.card,
              borderColor: isMine ? theme.primary : theme.border,
            },
          ]}
        >
          {item.type === 'deleted' ? <View style={styles.deletedMessage}><Icon name="ban-outline" size={15} color={isMine ? 'rgba(255,255,255,.7)' : theme.secondaryText} /><Text style={[styles.deletedText, { color: isMine ? 'rgba(255,255,255,.72)' : theme.secondaryText }]}>This message was deleted</Text></View>
            : item.type === 'image' ? <Image source={{ uri: item.uri }} style={styles.messageImage} resizeMode="cover" />
            : item.type === 'audio' ? <VoiceNote uri={item.uri} duration={item.duration} isMine={isMine} theme={theme} />
              : <Text style={[styles.messageText, { color: isMine ? '#FFFFFF' : theme.text }]}>{item.text}</Text>}
          <View style={styles.messageMeta}>
            <Text style={[styles.messageTime, { color: isMine ? 'rgba(255,255,255,0.72)' : theme.secondaryText }]}>
              {item.timestamp}
            </Text>
            {isMine && <Icon name="checkmark-done" size={14} color="rgba(255,255,255,0.8)" />}
          </View>
        </View>
        {Boolean(item.reaction) && <View style={[styles.reactionBadge, isMine ? styles.myReaction : styles.otherReaction, { backgroundColor: theme.card, borderColor: theme.border }]}><Text style={styles.reactionEmoji}>{item.reaction}</Text></View>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.headerButton} onPress={navigation.goBack} hitSlop={8}>
            <Icon name="chevron-back" size={25} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.contactBlock}>
            {avatar ? (
              <View style={styles.avatarWrap}>
                <Image source={{ uri: avatar }} style={styles.avatar} />
                <View style={[styles.onlineDot, { borderColor: theme.background }]} />
              </View>
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: theme.muted }]}>
                <Text style={[styles.avatarInitial, { color: theme.tint }]}>{contactName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.contactText}>
              <Text style={[styles.contactName, { color: theme.text }]} numberOfLines={1}>{contactName}</Text>
              <View style={styles.statusRow}>
                {platformInfo && <Icon name={platformInfo.icon} size={12} color={platformInfo.color} />}
                <Text style={[styles.status, { color: theme.secondaryText }]}>
                  {platformInfo?.name || 'Active now'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.card }]}
            onPress={() => Alert.alert('Conversation options', 'More conversation tools are coming soon.')}
            hitSlop={8}
          >
            <Icon name="ellipsis-horizontal" size={21} color={theme.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={theme.tint} />
            <Text style={[styles.stateText, { color: theme.secondaryText }]}>Loading conversation…</Text>
          </View>
        ) : (
          <FlatList
            style={styles.messageListView}
            ref={listRef}
            data={uniqueMessages(messages)}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[styles.messageList, messages.length === 0 && styles.emptyList]}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListHeaderComponent={messages.length > 0 ? (
              <View style={[styles.dayChip, { backgroundColor: theme.muted }]}>
                <Text style={[styles.dayText, { color: theme.secondaryText }]}>Today</Text>
              </View>
            ) : null}
            ListEmptyComponent={(
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: theme.muted }]}>
                  <Icon name="chatbubble-ellipses-outline" size={30} color={theme.tint} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Start the conversation</Text>
                <Text style={[styles.stateText, { color: theme.secondaryText }]}>Send a message to {contactName}.</Text>
              </View>
            )}
          />
        )}

        <View style={[styles.composerArea, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <View style={styles.allowanceRow}>
            <Text style={[styles.allowance, { color: canSendMessage ? theme.secondaryText : '#EF5B5B' }]}>
              {plan.limit === Infinity ? `${plan.name} · Unlimited` : `${remaining} messages remaining`}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Subscription')} hitSlop={8}>
              <Text style={[styles.planLink, { color: theme.tint }]}>View plan</Text>
            </TouchableOpacity>
          </View>

          {showTools && !recorderState.isRecording && (
            <View style={[styles.toolTray, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TouchableOpacity style={styles.toolItem} onPress={pickFromGallery}>
                <View style={[styles.toolIcon, { backgroundColor: `${theme.primary}18` }]}><Icon name="images-outline" size={21} color={theme.primary} /></View>
                <Text style={[styles.toolLabel, { color: theme.text }]}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolItem} onPress={startRecording}>
                <View style={[styles.toolIcon, { backgroundColor: '#EF5B5B18' }]}><Icon name="mic-outline" size={21} color="#EF5B5B" /></View>
                <Text style={[styles.toolLabel, { color: theme.text }]}>Voice note</Text>
              </TouchableOpacity>
            </View>
          )}

          {showEmojis && !recorderState.isRecording && (
            <View style={[styles.emojiTray, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {EMOJIS.map(emoji => <TouchableOpacity key={emoji} style={styles.emojiButton} onPress={() => setInputText(current => `${current}${emoji}`)}><Text style={styles.emoji}>{emoji}</Text></TouchableOpacity>)}
            </View>
          )}

          {recorderState.isRecording ? (
            <View style={[styles.recordingShell, { backgroundColor: theme.card, borderColor: '#EF5B5B55' }]}>
              <View style={styles.recordingStatus}><View style={styles.recordingDot} /><Text style={[styles.recordingTime, { color: theme.text }]}>{Math.floor(recorderState.durationMillis / 60000)}:{String(Math.floor((recorderState.durationMillis % 60000) / 1000)).padStart(2, '0')}</Text><Text style={[styles.recordingLabel, { color: theme.secondaryText }]}>Recording voice note</Text></View>
              <TouchableOpacity style={[styles.recordAction, { backgroundColor: theme.muted }]} onPress={() => finishRecording(false)}><Icon name="trash-outline" size={18} color="#EF5B5B" /></TouchableOpacity>
              <TouchableOpacity style={[styles.recordAction, { backgroundColor: theme.primary }]} onPress={() => finishRecording(true)}><Icon name="send" size={17} color="#fff" /></TouchableOpacity>
            </View>
          ) : <View style={[styles.inputShell, { backgroundColor: theme.card, borderColor: theme.border }]}> 
            <TouchableOpacity
              style={[styles.attachButton, showTools && { backgroundColor: theme.muted }]}
              onPress={() => { Keyboard.dismiss(); setShowEmojis(false); setShowTools(value => !value); }}
              hitSlop={6}
            >
              <Icon name={showTools ? 'close' : 'add'} size={24} color={showTools ? theme.primary : theme.secondaryText} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Write a message…"
              placeholderTextColor={theme.secondaryText}
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => { setShowTools(false); setShowEmojis(false); }}
              multiline
              maxLength={1000}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity style={styles.emojiToggle} onPress={() => { Keyboard.dismiss(); setShowTools(false); setShowEmojis(value => !value); }}>
              <Icon name={showEmojis ? 'happy' : 'happy-outline'} size={21} color={showEmojis ? theme.primary : theme.secondaryText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: canSubmit ? theme.primary : theme.muted },
              ]}
              onPress={canSubmit ? sendMessage : startRecording}
              disabled={sending}
              activeOpacity={0.8}
            >
              {sending
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Icon name={canSubmit ? 'arrow-up' : 'mic'} size={20} color={canSubmit ? '#FFFFFF' : theme.primary} />}
            </TouchableOpacity>
          </View>}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={Boolean(selectedMessage)} transparent animationType="fade" onRequestClose={() => setSelectedMessage(null)} statusBarTranslucent>
        <View style={styles.actionOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedMessage(null)} />
          <View style={[styles.messageActions, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.actionHandle} />
            <Text style={[styles.actionTitle, { color: theme.text }]}>Message actions</Text>
            <Text style={[styles.actionHint, { color: theme.secondaryText }]}>React or remove this message</Text>
            <View style={[styles.reactionRow, { backgroundColor: theme.muted }]}>
              {QUICK_REACTIONS.map(reaction => (
                <TouchableOpacity key={reaction} style={[styles.quickReaction, selectedMessage?.reaction === reaction && { backgroundColor: theme.card }]} onPress={() => reactToMessage(reaction)}>
                  <Text style={styles.quickReactionEmoji}>{reaction}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.messageActionRow} onPress={() => deleteSelectedMessage(false)}>
              <View style={[styles.messageActionIcon, { backgroundColor: theme.muted }]}><Icon name="trash-outline" size={18} color={theme.text} /></View>
              <View style={styles.messageActionCopy}><Text style={[styles.messageActionLabel, { color: theme.text }]}>Delete for me</Text><Text style={[styles.messageActionDetail, { color: theme.secondaryText }]}>Remove it only from your inbox</Text></View>
            </TouchableOpacity>
            {selectedMessage?.sender === 'me' && <TouchableOpacity style={styles.messageActionRow} onPress={() => deleteSelectedMessage(true)}>
              <View style={[styles.messageActionIcon, { backgroundColor: '#EF5B5B18' }]}><Icon name="trash-bin-outline" size={18} color="#EF5B5B" /></View>
              <View style={styles.messageActionCopy}><Text style={[styles.messageActionLabel, { color: '#EF5B5B' }]}>Delete for everyone</Text><Text style={[styles.messageActionDetail, { color: theme.secondaryText }]}>Replace it with a deleted-message notice</Text></View>
            </TouchableOpacity>}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  messageListView: { flex: 1 },
  header: { height: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  contactBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', marginHorizontal: 9 },
  avatarWrap: { width: 42, height: 42, marginRight: 10 },
  avatar: { width: 42, height: 42, borderRadius: 14 },
  avatarFallback: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarInitial: { fontSize: 17, fontWeight: '800' },
  onlineDot: { position: 'absolute', right: -1, bottom: -1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#39C884', borderWidth: 2 },
  contactText: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 },
  status: { fontSize: 10.5, fontWeight: '600' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stateText: { fontSize: 12.5, lineHeight: 18, textAlign: 'center' },
  messageList: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14 },
  emptyList: { flexGrow: 1 },
  dayChip: { alignSelf: 'center', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 12, marginVertical: 8 },
  dayText: { fontSize: 10, fontWeight: '700' },
  messageRow: { flexDirection: 'row', marginTop: 3, position: 'relative' },
  groupStart: { marginTop: 10 }, hasReaction: { marginBottom: 10 },
  myMessage: { justifyContent: 'flex-end' },
  otherMessage: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', minWidth: 74, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 7, borderWidth: 1 },
  myBubble: { borderRadius: 17, borderBottomRightRadius: 5 },
  otherBubble: { borderRadius: 17, borderBottomLeftRadius: 5 },
  messageText: { fontSize: 14, lineHeight: 20 },
  deletedMessage: { flexDirection: 'row', alignItems: 'center', gap: 6 }, deletedText: { fontSize: 12.5, fontStyle: 'italic' },
  reactionBadge: { position: 'absolute', bottom: -11, minWidth: 27, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, zIndex: 2 }, myReaction: { right: 2 }, otherReaction: { left: 8 }, reactionEmoji: { fontSize: 13 },
  messageImage: { width: 210, height: 160, borderRadius: 12 },
  voiceNote: { width: 210, minHeight: 42, flexDirection: 'row', alignItems: 'center' },
  voicePlay: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  waveform: { flex: 1, height: 28, marginHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  waveBar: { width: 3, borderRadius: 2 }, voiceDuration: { width: 26, fontSize: 9.5, fontWeight: '800' },
  messageMeta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 3, marginTop: 4 },
  messageTime: { fontSize: 9.5, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 30 },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  composerArea: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
  allowanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 5, marginBottom: 7 },
  allowance: { fontSize: 10, fontWeight: '600' },
  planLink: { fontSize: 10, fontWeight: '800' },
  toolTray: { flexDirection: 'row', borderWidth: 1, borderRadius: 17, padding: 10, gap: 18, marginBottom: 8 },
  toolItem: { alignItems: 'center', minWidth: 60 }, toolIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, toolLabel: { fontSize: 9.5, fontWeight: '700', marginTop: 5 },
  emojiTray: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderRadius: 17, padding: 8, marginBottom: 8 },
  emojiButton: { width: '16.66%', height: 38, alignItems: 'center', justifyContent: 'center' }, emoji: { fontSize: 23 },
  inputShell: { minHeight: 50, maxHeight: 120, flexDirection: 'row', alignItems: 'flex-end', borderRadius: 19, borderWidth: 1, padding: 5 },
  attachButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 38, maxHeight: 104, paddingHorizontal: 4, paddingTop: 9, paddingBottom: 8, fontSize: 14, lineHeight: 20 },
  emojiToggle: { width: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
  sendButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  recordingShell: { height: 52, flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, paddingHorizontal: 7 },
  recordingStatus: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7 }, recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF5B5B', marginRight: 8 }, recordingTime: { fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] }, recordingLabel: { fontSize: 10, marginLeft: 8 }, recordAction: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  actionOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,5,18,.58)' },
  messageActions: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 30 },
  actionHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#A59CB8', opacity: .55, alignSelf: 'center', marginBottom: 13 },
  actionTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' }, actionHint: { fontSize: 10.5, textAlign: 'center', marginTop: 3 },
  reactionRow: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: 18, padding: 7, marginTop: 17, marginBottom: 9 }, quickReaction: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, quickReactionEmoji: { fontSize: 24 },
  messageActionRow: { minHeight: 61, flexDirection: 'row', alignItems: 'center', paddingVertical: 7 }, messageActionIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, messageActionCopy: { flex: 1 }, messageActionLabel: { fontSize: 12.5, fontWeight: '800' }, messageActionDetail: { fontSize: 9.5, marginTop: 3 },
});
