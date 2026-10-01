import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { platforms } from '../../api/mockData';
import apiService from '../../api/apiService';
import ConversationItem from '../../components/ConversationItem';
import Loader from '../../components/Loader';

const ALL_TAB = { id: 'all', name: 'All', icon: 'chatbubbles' };
const TAB_LABELS = { whatsapp: 'WhatsApp' };

export default function InboxScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [connectedCount, setConnectedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const { theme } = useTheme();
  const { hasSubscription, loading: subscriptionLoading } = useSubscription();

  const loadConversations = useCallback(async () => {
    try {
      const [data, availablePlatforms] = await Promise.all([
        apiService.getConversations(),
        apiService.getPlatforms(),
      ]);
      setConversations(data);
      setConnectedCount(availablePlatforms.filter(platform => platform.connected).length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadConversations);
    return unsubscribe;
  }, [navigation, loadConversations]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const tabs = useMemo(() => {
    const usedPlatforms = new Set(conversations.map(item => item.platform));
    return [ALL_TAB, ...platforms.filter(platform => usedPlatforms.has(platform.id))];
  }, [conversations]);

  const visibleConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return conversations.filter(conversation => {
      const matchesTab = activeTab === 'all' || conversation.platform === activeTab;
      const matchesQuery = !normalizedQuery
        || conversation.contactName.toLowerCase().includes(normalizedQuery)
        || conversation.lastMessage.toLowerCase().includes(normalizedQuery);
      return matchesTab && matchesQuery;
    });
  }, [activeTab, conversations, query]);

  const countForTab = id => id === 'all'
    ? conversations.length
    : conversations.filter(item => item.platform === id).length;

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  if (loading || subscriptionLoading) return <Loader />;

  const needsConnection = connectedCount === 0;
  const needsSubscription = !hasSubscription;
  const setupIncomplete = needsConnection || needsSubscription;
  const nextSetupStep = needsConnection
    ? {
        icon: 'git-merge-outline',
        eyebrow: 'STEP 1 OF 2',
        title: 'Connect your first channel',
        text: 'Choose the social accounts you want to bring into your unified inbox.',
        button: 'Connect accounts',
        route: 'Connect',
      }
    : {
        icon: 'sparkles-outline',
        eyebrow: 'FINAL STEP',
        title: 'Choose your messaging plan',
        text: 'Activate the Free plan or choose more capacity before you start replying.',
        button: 'View messaging plans',
        route: 'Subscription',
      };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: theme.tint }]}>UNIFIED INBOX</Text>
            <Text style={[styles.title, { color: theme.text }]}>Messages</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Everything important, in one place.</Text>
          </View>
          <TouchableOpacity
            style={[styles.composeButton, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Connect')}
          >
            <Icon name="add" size={25} color="#fff" />
          </TouchableOpacity>
        </View>

        {setupIncomplete && (
          <View style={[styles.setupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.setupIcon, { backgroundColor: theme.muted }]}>
              <Icon name={nextSetupStep.icon} size={24} color={theme.primary} />
            </View>
            <View style={styles.setupCopy}>
              <Text style={[styles.setupEyebrow, { color: theme.tint }]}>{nextSetupStep.eyebrow}</Text>
              <Text style={[styles.setupTitle, { color: theme.text }]}>{nextSetupStep.title}</Text>
              <Text style={[styles.setupText, { color: theme.secondaryText }]}>{nextSetupStep.text}</Text>
            </View>
            <TouchableOpacity
              style={[styles.setupButton, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(nextSetupStep.route)}
            >
              <Text style={styles.setupButtonText}>{nextSetupStep.button}</Text>
              <Icon name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Icon name="search-outline" size={20} color={theme.secondaryText} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search people or messages"
            placeholderTextColor={theme.secondaryText}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
              <Icon name="close-circle" size={19} color={theme.secondaryText} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabs}
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.75}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tab,
                  { backgroundColor: isActive ? theme.primary : theme.card, borderColor: isActive ? theme.primary : theme.border },
                ]}
              >
                <Icon
                  name={tab.icon}
                  size={16}
                  color={isActive ? '#fff' : (tab.color || theme.secondaryText)}
                />
                <Text style={[styles.tabLabel, { color: isActive ? '#fff' : theme.text }]}>
                  {TAB_LABELS[tab.id] || tab.name}
                </Text>
                <View style={[styles.count, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : theme.muted }]}> 
                  <Text style={[styles.countText, { color: isActive ? '#fff' : theme.secondaryText }]}>{countForTab(tab.id)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Conversations</Text>
          <Text style={[styles.resultCount, { color: theme.secondaryText }]}>{visibleConversations.length} shown</Text>
        </View>

        {visibleConversations.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.card }]}>
              <Icon name="chatbubble-ellipses-outline" size={32} color={theme.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{needsConnection ? 'Your inbox is ready to connect' : 'No conversations found'}</Text>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>{needsConnection ? 'Connect a social account above and its conversations will appear here.' : 'Try another tab or clear your search.'}</Text>
          </View>
        ) : (
          <FlatList
            data={visibleConversations}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <ConversationItem
                conversation={item}
                onPress={() => navigation.navigate('ChatDetail', {
                  conversationId: item.id,
                  contactName: item.contactName,
                  avatar: item.avatar,
                  platform: item.platform,
                })}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 10 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.35, marginBottom: 3 },
  title: { fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 12.5, marginTop: 2 },
  composeButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#17324D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 7, elevation: 4 },
  setupCard: { marginHorizontal: 18, marginTop: 15, padding: 14, borderRadius: 19, borderWidth: 1, flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' },
  setupIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  setupCopy: { flex: 1 },
  setupEyebrow: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  setupTitle: { fontSize: 14, fontWeight: '800', marginTop: 3 },
  setupText: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  setupButton: { width: '100%', height: 41, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  setupButtonText: { color: '#fff', fontSize: 11.5, fontWeight: '800' },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 42, borderRadius: 14, borderWidth: 1, marginHorizontal: 18, marginTop: 15, paddingHorizontal: 12 },
  searchInput: { flex: 1, height: '100%', marginLeft: 8, fontSize: 13.5 },
  tabsScroll: { flexGrow: 0, flexShrink: 0 },
  tabs: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 9, gap: 7 },
  tab: { height: 34, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderRadius: 17, borderWidth: 1, gap: 5 },
  tabLabel: { fontSize: 11.5, fontWeight: '700' },
  count: { minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 9, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginTop: 0, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  resultCount: { fontSize: 11, fontWeight: '600' },
  listContent: { paddingHorizontal: 14, paddingTop: 3, paddingBottom: 110 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 70 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 5 },
  emptyText: { fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
});
