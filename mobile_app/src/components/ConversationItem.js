import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import PlatformBadge from './PlatformBadge';

export default function ConversationItem({ conversation, onPress }) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <View style={styles.avatarWrap}>
        <Image source={{ uri: conversation.avatar }} style={styles.avatar} />
        <View style={[styles.onlineDot, { borderColor: theme.card }]} />
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{conversation.contactName}</Text>
          <Text style={[styles.time, { color: theme.secondaryText }]}>{conversation.timestamp}</Text>
        </View>
        <Text style={[styles.lastMsg, { color: theme.secondaryText }]} numberOfLines={1}>
          {conversation.lastMessage}
        </Text>
        <View style={styles.metaRow}>
          <PlatformBadge platformId={conversation.platform} />
          <Icon name="chevron-forward" size={17} color={theme.secondaryText} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', padding: 11, marginVertical: 4, borderRadius: 17, borderWidth: 1, shadowColor: '#142B44', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 7, elevation: 2 },
  avatarWrap: { width: 48, height: 48, marginRight: 11 },
  avatar: { width: 48, height: 48, borderRadius: 15 },
  onlineDot: { position: 'absolute', width: 11, height: 11, borderRadius: 6, backgroundColor: '#39C884', borderWidth: 2, right: -2, bottom: -2 },
  info: { flex: 1, justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  name: { flex: 1, fontWeight: '800', fontSize: 14, marginRight: 8 },
  time: { fontSize: 10, fontWeight: '600' },
  lastMsg: { fontSize: 12.5, lineHeight: 17, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
