import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useWallet } from '../../context/WalletContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../api/apiService';
import { platforms as platformCatalog } from '../../api/mockData';

const needsAttention = conversation => /\d+d ago/.test(conversation.timestamp)
  || (Number.parseInt(conversation.timestamp, 10) >= 4 && conversation.timestamp.includes('h ago'));

const MetricCard = ({ icon, value, label, detail, color, theme }) => (
  <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <View style={styles.metricTop}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}16` }]}><Icon name={icon} size={17} color={color} /></View>
      <Text style={[styles.metricDetail, { color }]}>{detail}</Text>
    </View>
    <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
    <Text style={[styles.metricLabel, { color: theme.secondaryText }]}>{label}</Text>
  </View>
);

export default function DashboardScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const wallet = useWallet();
  const { plan, usage, remaining } = useSubscription();
  const [conversations, setConversations] = useState([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);

  const loadAnalytics = useCallback(async () => {
    const [conversationData, platformData] = await Promise.all([apiService.getConversations(), apiService.getPlatforms()]);
    setConversations(conversationData);
    setConnectedPlatforms(platformData.filter(platform => platform.connected));
  }, []);

  useEffect(() => navigation.addListener('focus', loadAnalytics), [navigation, loadAnalytics]);
  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const priority = useMemo(() => conversations.filter(needsAttention), [conversations]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';
  const channels = connectedPlatforms.length ? connectedPlatforms : platformCatalog.slice(0, 4);
  const openConversation = conversation => navigation.navigate('ChatDetail', { conversationId: conversation.id, contactName: conversation.contactName, avatar: conversation.avatar, platform: conversation.platform });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={[styles.greeting, { color: theme.secondaryText }]}>{greeting}</Text><Text style={[styles.title, { color: theme.text }]}>{firstName}</Text></View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.historyButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('Transactions')}>
              <Icon name="time-outline" size={17} color={theme.tint} />
              <Text style={[styles.historyText, { color: theme.tint }]}>History</Text>
            </TouchableOpacity>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}><Text style={styles.avatarText}>{firstName.slice(0, 2).toUpperCase()}</Text></View>
          </View>
        </View>

        <TouchableOpacity style={[styles.attentionBanner, { backgroundColor: priority.length ? '#D9473F' : '#249768' }]} activeOpacity={0.84} onPress={() => priority[0] && openConversation(priority[0])}>
          <View style={styles.attentionIcon}><Icon name={priority.length ? 'warning-outline' : 'checkmark-circle-outline'} size={20} color="#fff" /></View>
          <View style={styles.attentionCopy}>
            <Text style={styles.attentionTitle}>{priority.length ? `${priority.length} conversation${priority.length === 1 ? '' : 's'} need attention` : 'Your inbox is under control'}</Text>
            <Text style={styles.attentionText}>{priority.length ? `${priority[0].contactName} has been waiting the longest` : 'No older conversations are waiting'}</Text>
          </View>
          <Icon name="chevron-forward" size={18} color="rgba(255,255,255,.8)" />
        </TouchableOpacity>

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.text }]}>Billing snapshot</Text><View style={styles.billingLinks}><TouchableOpacity onPress={() => navigation.navigate('Transactions')}><Text style={[styles.sectionLink, { color: theme.tint }]}>History</Text></TouchableOpacity><TouchableOpacity onPress={() => navigation.navigate('Wallet')}><Text style={[styles.sectionLink, { color: theme.tint }]}>Fund</Text></TouchableOpacity></View></View>
        <View style={[styles.walletCard, { backgroundColor: theme.primary }]}><View><Text style={styles.walletLabel}>AVAILABLE BALANCE</Text><Text style={styles.walletValue}>{wallet.balance.toLocaleString()} <Text style={styles.walletUnits}>units</Text></Text></View><View style={styles.planBadge}><Icon name="star" size={12} color="#fff" /><Text style={styles.planBadgeText}>{plan.name}</Text></View></View>

        <View style={styles.metrics}>
          <MetricCard icon="send-outline" value={usage.toLocaleString()} label="Messages sent" detail={plan.name} color={theme.primary} theme={theme} />
          <MetricCard icon="chatbubbles-outline" value={conversations.length} label="Open conversations" detail="Live" color="#E2A128" theme={theme} />
          <MetricCard icon="git-merge-outline" value={connectedPlatforms.length} label="Connected channels" detail={`of ${platformCatalog.length}`} color="#D34F8C" theme={theme} />
          <MetricCard icon="sparkles-outline" value={remaining === Infinity ? '∞' : remaining.toLocaleString()} label="Messages remaining" detail="This month" color="#24A878" theme={theme} />
        </View>

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.text }]}>Channels</Text><TouchableOpacity onPress={() => navigation.navigate('Connect')}><Text style={[styles.sectionLink, { color: theme.tint }]}>Manage</Text></TouchableOpacity></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.channelList}>
          {channels.map(platform => {
            const count = conversations.filter(item => item.platform === platform.id).length;
            const connected = connectedPlatforms.some(item => item.id === platform.id);
            return (
              <View key={platform.id} style={[styles.channelCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.channelTop}><View style={[styles.channelIcon, { backgroundColor: `${platform.color}18` }]}><Icon name={platform.icon} size={18} color={platform.color} /></View><View style={[styles.channelStatus, { backgroundColor: connected ? '#24A87818' : theme.muted }]}><Text style={[styles.channelStatusText, { color: connected ? '#24A878' : theme.secondaryText }]}>{connected ? count : '—'}</Text></View></View>
                <Text style={[styles.channelCount, { color: theme.text }]}>{connected ? count : 'Offline'}</Text><Text style={[styles.channelName, { color: theme.secondaryText }]} numberOfLines={1}>{platform.name}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.text }]}>Priority queue</Text><TouchableOpacity onPress={() => navigation.navigate('Home')}><Text style={[styles.sectionLink, { color: theme.tint }]}>View inbox</Text></TouchableOpacity></View>
        <Text style={[styles.queueHint, { color: theme.secondaryText }]}>Older conversations appear here first.</Text>
        <View style={[styles.queueCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {(priority.length ? priority : conversations).slice(0, 3).map((conversation, index, items) => {
            const platform = platformCatalog.find(item => item.id === conversation.platform);
            return <React.Fragment key={conversation.id}>
              <TouchableOpacity style={styles.queueRow} onPress={() => openConversation(conversation)} activeOpacity={0.75}>
                <Image source={{ uri: conversation.avatar }} style={styles.queueAvatar} />
                <View style={styles.queueCopy}><View style={styles.queueNameRow}><Text style={[styles.queueName, { color: theme.text }]} numberOfLines={1}>{conversation.contactName}</Text>{platform && <Icon name={platform.icon} size={12} color={platform.color} />}</View><Text style={[styles.queueMessage, { color: theme.secondaryText }]} numberOfLines={1}>{conversation.lastMessage}</Text></View>
                <View style={[styles.waitPill, { backgroundColor: needsAttention(conversation) ? '#EF5B5B16' : theme.muted }]}><Text style={[styles.waitText, { color: needsAttention(conversation) ? '#D9473F' : theme.secondaryText }]}>{conversation.timestamp}</Text></View>
              </TouchableOpacity>
              {index < items.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
            </React.Fragment>;
          })}
          {!conversations.length && <View style={styles.emptyQueue}><Icon name="chatbubble-outline" size={23} color={theme.tint} /><Text style={[styles.emptyText, { color: theme.secondaryText }]}>Connect a channel to start tracking conversations.</Text></View>}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 112 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerActions: { flexDirection: 'row', alignItems: 'center', gap: 7 }, greeting: { fontSize: 10.5 }, title: { fontSize: 23, fontWeight: '900', letterSpacing: -.5, marginTop: 1 }, avatar: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontSize: 10.5, fontWeight: '900' }, historyButton: { height: 34, borderRadius: 11, borderWidth: 1, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 4 }, historyText: { fontSize: 9.5, fontWeight: '800' },
  attentionBanner: { minHeight: 60, borderRadius: 16, marginTop: 12, padding: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#651D23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: .15, shadowRadius: 8, elevation: 3 }, attentionIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center', marginRight: 9 }, attentionCopy: { flex: 1 }, attentionTitle: { color: '#fff', fontSize: 11.5, fontWeight: '900' }, attentionText: { color: 'rgba(255,255,255,.76)', fontSize: 8.5, marginTop: 3 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 }, metricCard: { width: '48.8%', minHeight: 94, borderWidth: 1, borderRadius: 15, padding: 10 }, metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, metricIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, metricDetail: { fontSize: 7.5, fontWeight: '900' }, metricValue: { fontSize: 19, fontWeight: '900', marginTop: 6 }, metricLabel: { fontSize: 8.5, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 17, marginBottom: 7 }, sectionTitle: { fontSize: 15, fontWeight: '900', letterSpacing: -.2 }, sectionLink: { fontSize: 9.5, fontWeight: '800' }, billingLinks: { flexDirection: 'row', gap: 14 },
  channelList: { gap: 7, paddingRight: 16 }, channelCard: { width: 98, minHeight: 86, borderWidth: 1, borderRadius: 14, padding: 9 }, channelTop: { flexDirection: 'row', justifyContent: 'space-between' }, channelIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, channelStatus: { minWidth: 22, height: 18, borderRadius: 7, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' }, channelStatusText: { fontSize: 7.5, fontWeight: '900' }, channelCount: { fontSize: 12.5, fontWeight: '900', marginTop: 6 }, channelName: { fontSize: 8, marginTop: 1 },
  queueHint: { fontSize: 8.5, marginTop: -3, marginBottom: 6 }, queueCard: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' }, queueRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7 }, queueAvatar: { width: 36, height: 36, borderRadius: 12, marginRight: 8 }, queueCopy: { flex: 1, minWidth: 0 }, queueNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, queueName: { maxWidth: '82%', fontSize: 10.5, fontWeight: '900' }, queueMessage: { fontSize: 8.5, marginTop: 3 }, waitPill: { height: 20, borderRadius: 8, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', marginLeft: 6 }, waitText: { fontSize: 7.5, fontWeight: '900' }, divider: { height: StyleSheet.hairlineWidth, marginLeft: 54 }, emptyQueue: { alignItems: 'center', padding: 18 }, emptyText: { fontSize: 9.5, marginTop: 6, textAlign: 'center' },
  walletCard: { minHeight: 70, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, walletLabel: { color: 'rgba(255,255,255,.68)', fontSize: 7, fontWeight: '900', letterSpacing: .9 }, walletValue: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 4 }, walletUnits: { fontSize: 9.5, color: 'rgba(255,255,255,.75)' }, planBadge: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: 'rgba(255,255,255,.16)', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 6 }, planBadgeText: { color: '#fff', fontSize: 8.5, fontWeight: '900' },
});
