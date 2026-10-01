import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useWallet } from '../../context/WalletContext';
import { useAppAlert } from '../../context/AppAlertContext';

export default function KycScreen({ navigation }) {
  const { theme } = useTheme();
  const wallet = useWallet();
  const Alert = useAppAlert();
  const [businessName, setBusinessName] = useState(wallet.kycBusinessName || wallet.kycName || '');
  const [nin, setNin] = useState('');
  const [document, setDocument] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const pending = wallet.kycStatus === 'pending';
  const verified = wallet.kycStatus === 'verified';
  const rejected = wallet.kycStatus === 'rejected';
  const valid = businessName.trim().length > 1 && /^\d{11}$/.test(nin) && document;

  const selectDocument = async source => {
    const picker = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await picker({ mediaTypes: ['images'], allowsEditing: false, quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setDocument({ uri: asset.uri, name: asset.fileName || `nin-document-${Date.now()}.jpg`, mimeType: asset.mimeType || 'image/jpeg' });
    }
  };

  const chooseDocument = () => Alert.alert('NIN document', 'Choose how you want to provide your document.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Take a photo', onPress: () => selectDocument('camera') },
    { text: 'Choose from device', onPress: () => selectDocument('library') },
  ]);

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      await wallet.completeKyc(businessName.trim(), nin, document);
      Alert.alert('KYC submitted', 'Your documents are pending review. You cannot fund your wallet or activate a paid plan until verification is confirmed.', [{ text: 'Done', onPress: navigation.goBack }]);
    } catch (error) {
      Alert.alert('Unable to submit KYC', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['bottom']}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={[styles.notice, { backgroundColor: `${theme.primary}14` }]}><Icon name="shield-checkmark-outline" size={23} color={theme.primary} /><View style={styles.noticeText}><Text style={[styles.noticeTitle, { color: theme.text }]}>Secure KYC review</Text><Text style={[styles.noticeBody, { color: theme.secondaryText }]}>Submit your business details and NIN document for manual confirmation.</Text></View></View>
    {verified ? <View style={styles.status}><Icon name="checkmark-circle" size={54} color="#39C884" /><Text style={[styles.statusTitle, { color: theme.text }]}>KYC verified</Text><Text style={[styles.statusText, { color: theme.secondaryText }]}>You can now fund your wallet and activate paid plans.</Text><TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => navigation.replace('Wallet')}><Text style={styles.buttonText}>Continue to wallet</Text></TouchableOpacity></View> : pending ? <View style={styles.status}><Icon name="time-outline" size={54} color={theme.primary} /><Text style={[styles.statusTitle, { color: theme.text }]}>KYC pending review</Text><Text style={[styles.statusText, { color: theme.secondaryText }]}>Your business name, NIN, and document were submitted successfully. You will be able to proceed after confirmation.</Text><TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={() => navigation.goBack()}><Text style={[styles.secondaryButtonText, { color: theme.text }]}>Back</Text></TouchableOpacity></View> : <>
      {rejected && <View style={[styles.rejected, { backgroundColor: '#EF5B5B16' }]}><Icon name="alert-circle-outline" size={19} color="#D9473F" /><Text style={styles.rejectedText}>Your previous KYC submission was not approved. Please submit corrected details.</Text></View>}
      <Text style={[styles.label, { color: theme.text }]}>Business name</Text><TextInput style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} value={businessName} onChangeText={setBusinessName} placeholder="Registered business name" placeholderTextColor={theme.secondaryText} />
      <Text style={[styles.label, { color: theme.text }]}>NIN number</Text><TextInput style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} value={nin} onChangeText={value => setNin(value.replace(/\D/g, '').slice(0, 11))} placeholder="11-digit NIN" placeholderTextColor={theme.secondaryText} keyboardType="number-pad" maxLength={11} />
      <Text style={[styles.label, { color: theme.text }]}>NIN document</Text><TouchableOpacity style={[styles.documentButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={chooseDocument}><Icon name={document ? 'checkmark-circle-outline' : 'cloud-upload-outline'} size={21} color={document ? '#24A86B' : theme.tint} /><View style={styles.documentCopy}><Text style={[styles.documentTitle, { color: theme.text }]}>{document ? 'Document selected' : 'Upload NIN document'}</Text><Text style={[styles.documentHint, { color: theme.secondaryText }]}>{document ? document.name : 'Choose a clear JPG or PNG image'}</Text></View><Icon name="chevron-forward" size={18} color={theme.secondaryText} /></TouchableOpacity>
      <TouchableOpacity disabled={!valid || submitting} style={[styles.button, { backgroundColor: valid && !submitting ? theme.primary : theme.muted }]} onPress={submit}>{submitting ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, { color: valid ? '#fff' : theme.secondaryText }]}>Submit for review</Text>}</TouchableOpacity>
    </>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: 18, paddingBottom: 32 }, notice: { flexDirection: 'row', borderRadius: 17, padding: 14, marginBottom: 22 }, noticeText: { flex: 1, marginLeft: 10 }, noticeTitle: { fontSize: 12.5, fontWeight: '800' }, noticeBody: { fontSize: 10.5, lineHeight: 15, marginTop: 3 }, rejected: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 13, padding: 12, marginBottom: 18 }, rejectedText: { flex: 1, color: '#D9473F', fontSize: 10.5, lineHeight: 15 }, label: { fontSize: 11.5, fontWeight: '800', marginBottom: 6 }, input: { height: 46, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 12.5, marginBottom: 16 }, documentButton: { minHeight: 64, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, documentCopy: { flex: 1, marginHorizontal: 10 }, documentTitle: { fontSize: 11.5, fontWeight: '800' }, documentHint: { fontSize: 9.5, marginTop: 3 }, button: { height: 47, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 5 }, buttonText: { color: '#fff', fontSize: 12.5, fontWeight: '800' }, secondaryButton: { height: 47, minWidth: 130, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 18 }, secondaryButtonText: { fontSize: 12.5, fontWeight: '800' }, status: { alignItems: 'center', marginTop: 30 }, statusTitle: { fontSize: 19, fontWeight: '800', marginTop: 12 }, statusText: { fontSize: 11.5, lineHeight: 17, textAlign: 'center', marginTop: 4, marginBottom: 18 },
});
