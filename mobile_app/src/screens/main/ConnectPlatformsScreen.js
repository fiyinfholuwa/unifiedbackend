import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../api/apiService';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useAppAlert } from '../../context/AppAlertContext';
import { allPlatformGuide, platformGuides } from '../../utils/platformGuides';

const platformDescriptions = {
  facebook: 'Pages, Messenger and customer replies',
  instagram: 'Direct messages and story replies',
  whatsapp: 'Business chats and customer messages',
  telegram: 'Private chats, groups and channels',
  tiktok: 'TikTok profile connection; business messaging requires TikTok Business API access',
  twitter: 'X profile connection; direct messaging requires approved X API access',
};

export default function ConnectPlatformsScreen() {
  const [platforms, setPlatforms] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [pendingDisconnect, setPendingDisconnect] = useState(null);
  const [credentialPlatform, setCredentialPlatform] = useState(null);
  const [credentialValue, setCredentialValue] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState(null);
  const { theme } = useTheme();
  const Alert = useAppAlert();

  useEffect(() => {
    loadPlatforms();
    const handleCallback = ({ url }) => {
      loadPlatforms();
      const query = url.split('?')[1] || '';
      const params = query.split('&').reduce((result, item) => {
        const [key, value] = item.split('=');
        if (key) result[key] = decodeURIComponent(value || '');
        return result;
      }, {});
      if (params.success === '0') {
        Alert.alert('Connection failed', 'The platform did not approve the connection. Please try again.');
      }
    };
    const subscription = Linking.addEventListener('url', handleCallback);
    Linking.getInitialURL().then(url => url && handleCallback({ url })).catch(() => {});
    return () => subscription.remove();
  }, [Alert]);

  const loadPlatforms = async () => {
    const data = await apiService.getPlatforms();
    setPlatforms(data);
  };

  const updateConnection = async platform => {
    setUpdatingId(platform.id);
    try {
      if (platform.connected) {
        await apiService.disconnectPlatform(platform.id);
      } else {
        const authorizationUrl = await apiService.startPlatformConnection(platform.id);
        if (authorizationUrl) {
          await Linking.openURL(authorizationUrl);
          return;
        }
      }
      await loadPlatforms();
      setPendingDisconnect(null);
    } catch (e) {
      if (!platform.connected && (platform.id === 'telegram' || platform.id === 'whatsapp')) {
        setCredentialPlatform(platform);
        return;
      }
      Alert.alert('Connection error', `We couldn't update ${platform.name}. Please try again.`);
    } finally {
      setUpdatingId(null);
    }
  };

  const saveCredentials = async () => {
    if (!credentialPlatform || !credentialValue.trim()) return;
    setSavingCredentials(true);
    try {
      const credentials = credentialPlatform.id === 'telegram'
        ? { bot_token: credentialValue.trim() }
        : { access_token: credentialValue.trim(), phone_number_id: phoneNumberId.trim(), business_account_id: businessAccountId.trim() };
      await apiService.savePlatformCredentials(credentialPlatform.id, credentials);
      setCredentialPlatform(null); setCredentialValue(''); setPhoneNumberId(''); setBusinessAccountId(''); await loadPlatforms();
    } catch (e) { Alert.alert('Could not connect account', e.message); } finally { setSavingCredentials(false); }
  };

  const toggleConnect = platform => {
    if (!platform.connected) {
      updateConnection(platform);
      return;
    }

    setPendingDisconnect(platform);
  };

  const connectedCount = platforms.filter(platform => platform.connected).length;
  const guide = guidePlatform === 'all' ? allPlatformGuide : platformGuides[guidePlatform];

  const renderItem = ({ item }) => {
    const isUpdating = updatingId === item.id;
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <View style={[styles.iconWrap, { backgroundColor: `${item.color}18` }]}> 
          <Icon name={item.icon} size={25} color={item.color} />
        </View>

        <View style={styles.platformInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
            {item.connected && <View style={styles.statusDot} />}
          </View>
          <Text style={[styles.description, { color: theme.secondaryText }]} numberOfLines={2}>
            {platformDescriptions[item.id]}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.infoButton}
          accessibilityLabel={`Read ${item.name} connection guide`}
          onPress={() => setGuidePlatform(item.id)}
        >
          <Icon name="information-circle-outline" size={21} color={theme.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            item.connected
              ? { backgroundColor: theme.muted, borderColor: theme.border }
              : { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
          activeOpacity={0.75}
          disabled={updatingId !== null}
          onPress={() => toggleConnect(item)}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={item.connected ? theme.tint : '#fff'} />
          ) : (
            <Text style={[styles.buttonText, { color: item.connected ? theme.text : '#fff' }]}>
              {item.connected ? 'Connected' : 'Connect'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.container}>
        <Text style={[styles.eyebrow, { color: theme.tint }]}>CHANNELS</Text>
        <Text style={[styles.header, { color: theme.text }]}>Connect accounts</Text>
        <Text style={[styles.sub, { color: theme.secondaryText }]}>Bring your conversations together in one inbox.</Text>

        <View style={[styles.summary, { backgroundColor: theme.primary }]}> 
          <View style={styles.summaryIcon}>
            <Icon name="git-merge-outline" size={22} color="#fff" />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>{connectedCount} of {platforms.length} connected</Text>
            <Text style={styles.summarySub}>
              {connectedCount === 0 ? 'Connect a channel to get started' : 'Your connected inbox is ready'}
            </Text>
          </View>
          <Icon name="shield-checkmark-outline" size={22} color="rgba(255,255,255,0.8)" />
        </View>

        <TouchableOpacity
          style={[styles.guideLink, { backgroundColor: theme.card, borderColor: theme.border }]}
          activeOpacity={0.78}
          onPress={() => setGuidePlatform('all')}
        >
          <Icon name="book-outline" size={18} color={theme.tint} />
          <View style={styles.guideLinkCopy}>
            <Text style={[styles.guideLinkTitle, { color: theme.text }]}>Need help connecting?</Text>
            <Text style={[styles.guideLinkText, { color: theme.secondaryText }]}>Read the setup steps for every channel.</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={theme.secondaryText} />
        </TouchableOpacity>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Available platforms</Text>
          <Text style={[styles.secureText, { color: theme.secondaryText }]}>Secure sign-in</Text>
        </View>

        <FlatList
          data={platforms}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />

        <Modal visible={Boolean(guide)} transparent animationType="slide" onRequestClose={() => setGuidePlatform(null)}>
          <View style={styles.guideOverlay}>
            <View style={[styles.guideModal, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.guideHeader}>
                <View style={styles.guideHeaderCopy}>
                  <Text style={[styles.guideTitle, { color: theme.text }]}>{guide?.title}</Text>
                  <Text style={[styles.guideSummary, { color: theme.secondaryText }]}>{guide?.summary}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.closeGuideButton, { backgroundColor: theme.muted }]}
                  accessibilityLabel="Close connection guide"
                  onPress={() => setGuidePlatform(null)}
                >
                  <Icon name="close" size={18} color={theme.secondaryText} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.guideContent}>
                <Text style={[styles.guideSectionTitle, { color: theme.tint }]}>Before you start</Text>
                {guide?.prerequisites?.map((item, index) => (
                  <View key={`prerequisite-${index}`} style={styles.guideBulletRow}>
                    <Icon name="checkmark-circle" size={16} color={theme.tint} />
                    <Text style={[styles.guideBody, { color: theme.secondaryText }]}>{item}</Text>
                  </View>
                ))}
                <Text style={[styles.guideSectionTitle, { color: theme.tint }]}>Steps</Text>
                {guide?.steps?.map((item, index) => (
                  <View key={`step-${index}`} style={styles.guideStepRow}>
                    <View style={[styles.stepNumber, { backgroundColor: `${theme.tint}18` }]}>
                      <Text style={[styles.stepNumberText, { color: theme.tint }]}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.guideBody, { color: theme.secondaryText }]}>{item}</Text>
                  </View>
                ))}
                <View style={[styles.guideNote, { backgroundColor: `${theme.tint}12`, borderColor: `${theme.tint}32` }]}>
                  <Icon name="alert-circle-outline" size={17} color={theme.tint} />
                  <Text style={[styles.guideBody, { color: theme.secondaryText }]}>{guide?.limitation}</Text>
                </View>
                {guide?.docsUrl && (
                  <TouchableOpacity
                    style={[styles.docsButton, { backgroundColor: theme.primary }]}
                    activeOpacity={0.78}
                    onPress={() => Linking.openURL(guide.docsUrl)}
                  >
                    <Icon name="open-outline" size={16} color="#fff" />
                    <Text style={styles.docsButtonText}>Open official setup docs</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={Boolean(credentialPlatform)} transparent animationType="fade" onRequestClose={() => setCredentialPlatform(null)}>
          <View style={styles.modalOverlay}><View style={[styles.credentialModal, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Connect {credentialPlatform?.name}</Text>
            <Text style={[styles.modalText, { color: theme.secondaryText }]}>{credentialPlatform?.id === 'telegram' ? 'Enter a Telegram BotFather token. The server will verify it before saving.' : 'Enter your WhatsApp Cloud API credentials. They are encrypted on the server.'}</Text>
            <TextInput secureTextEntry placeholder={credentialPlatform?.id === 'telegram' ? 'Bot token' : 'Access token'} placeholderTextColor={theme.secondaryText} value={credentialValue} onChangeText={setCredentialValue} style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} />
            {credentialPlatform?.id === 'whatsapp' && <><TextInput placeholder="Phone number ID" placeholderTextColor={theme.secondaryText} value={phoneNumberId} onChangeText={setPhoneNumberId} style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} /><TextInput placeholder="Business account ID" placeholderTextColor={theme.secondaryText} value={businessAccountId} onChangeText={setBusinessAccountId} style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} /></>}
            <View style={styles.modalActions}><TouchableOpacity onPress={() => setCredentialPlatform(null)} style={[styles.modalButton, { backgroundColor: theme.muted }]}><Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text></TouchableOpacity><TouchableOpacity disabled={savingCredentials} onPress={saveCredentials} style={[styles.modalButton, { backgroundColor: theme.primary }]}>{savingCredentials ? <ActivityIndicator color="#fff" /> : <Text style={[styles.modalButtonText, { color: '#fff' }]}>Connect</Text>}</TouchableOpacity></View>
          </View></View>
        </Modal>

        <ConfirmationModal
          visible={Boolean(pendingDisconnect)}
          title={pendingDisconnect ? `Disconnect ${pendingDisconnect.name}?` : 'Disconnect account?'}
          message="New messages from this account will stop appearing in your unified inbox. Your account data will remain safe."
          icon={pendingDisconnect?.icon || 'link-outline'}
          iconColor={pendingDisconnect?.color || '#F26B5E'}
          confirmLabel="Disconnect"
          loading={Boolean(pendingDisconnect && updatingId === pendingDisconnect.id)}
          note="You can reconnect this account at any time."
          onCancel={() => setPendingDisconnect(null)}
          onConfirm={() => pendingDisconnect && updateConnection(pendingDisconnect)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.35, marginBottom: 3 },
  header: { fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  sub: { fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  summary: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 15, marginTop: 18, shadowColor: '#203C86', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 5 },
  summaryIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.16)', marginRight: 11 },
  summaryText: { flex: 1 },
  summaryTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  summarySub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 3 },
  guideLink: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 13, marginTop: 11 },
  guideLinkCopy: { flex: 1, marginHorizontal: 10 },
  guideLinkTitle: { fontSize: 12.5, fontWeight: '800' },
  guideLinkText: { fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 7 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  secureText: { fontSize: 10.5, fontWeight: '600' },
  listContent: { paddingBottom: 110 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 17, borderWidth: 1, marginVertical: 4, shadowColor: '#142B44', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 7, elevation: 2 },
  iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  platformInfo: { flex: 1, paddingRight: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 13.5, fontWeight: '800', flexShrink: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#39C884', marginLeft: 6 },
  description: { fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  infoButton: { width: 30, height: 34, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  button: { minWidth: 82, height: 34, paddingHorizontal: 11, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 11, fontWeight: '800' },
  guideOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7, 5, 18, 0.72)' },
  guideModal: { maxHeight: '88%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, paddingHorizontal: 20, paddingTop: 20 },
  guideHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  guideHeaderCopy: { flex: 1 },
  guideTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  guideSummary: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  closeGuideButton: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  guideContent: { paddingTop: 20, paddingBottom: 32 },
  guideSectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 8, marginBottom: 10 },
  guideBulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  guideStepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  stepNumber: { width: 23, height: 23, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 11, fontWeight: '900' },
  guideBody: { flex: 1, fontSize: 11.5, lineHeight: 17 },
  guideNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 4 },
  docsButton: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 13, marginTop: 18 },
  docsButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(7, 5, 18, 0.72)' },
  credentialModal: { borderRadius: 24, borderWidth: 1, padding: 20 },
  modalTitle: { fontSize: 19, fontWeight: '800', textAlign: 'center' },
  modalText: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7, marginBottom: 15 },
  modalInput: { height: 46, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, marginBottom: 10, fontSize: 12 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalButton: { flex: 1, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  modalButtonText: { fontSize: 12, fontWeight: '800' },
});
