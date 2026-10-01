import React, { useState } from 'react';
import { ActivityIndicator, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useAppAlert } from '../../context/AppAlertContext';
import apiService from '../../api/apiService';

export default function SupportScreen({ route, navigation }) {
  const { theme } = useTheme();
  const Alert = useAppAlert();
  const feedback = route.params?.mode === 'feedback';
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!message.trim()) return;
    if (sending) return;
    setSending(true);
    try {
      await apiService.submitSupport(feedback ? 'feedback' : 'support', subject.trim(), message.trim());
      Alert.alert(feedback ? 'Thank you!' : 'Request received', feedback ? 'Your feedback helps us improve.' : 'Our help team will respond within 24 hours.', [{ text: 'Done', onPress: navigation.goBack }]);
    } catch (error) {
      Alert.alert('Could not send message', error.message || 'Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={8}>
        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: `${theme.primary}14` }]}> 
          <Icon name={feedback ? 'heart-outline' : 'headset-outline'} size={27} color={theme.primary} />
          <Text style={[styles.heroTitle, { color: theme.text }]}>{feedback ? 'We value your ideas' : 'How can we help?'}</Text>
          <Text style={[styles.heroText, { color: theme.secondaryText }]}>{feedback ? 'Tell us what would make Unified Messenger better.' : 'Send a request and our team will get back to you.'}</Text>
        </View>
        <Text style={[styles.label, { color: theme.text }]}>Subject</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} placeholder={feedback ? 'Feature idea or suggestion' : 'What do you need help with?'} placeholderTextColor={theme.secondaryText} value={subject} onChangeText={setSubject} />
        <Text style={[styles.label, { color: theme.text }]}>Message</Text>
        <TextInput style={[styles.input, styles.messageInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} placeholder="Share some details..." placeholderTextColor={theme.secondaryText} multiline textAlignVertical="top" value={message} onChangeText={setMessage} />
        <TouchableOpacity style={[styles.submit, { backgroundColor: message.trim() && !sending ? theme.primary : theme.muted }]} disabled={!message.trim() || sending} onPress={submit}>
          {sending ? <ActivityIndicator color="#fff" /> : <><Icon name="paper-plane-outline" size={16} color={message.trim() ? '#fff' : theme.secondaryText} /><Text style={[styles.submitText, { color: message.trim() ? '#fff' : theme.secondaryText }]}>Send {feedback ? 'feedback' : 'request'}</Text></>}
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { flex: 1 }, formContent: { padding: 18, paddingBottom: 32 },
  hero: { alignItems: 'center', borderRadius: 20, padding: 18, marginBottom: 20 }, heroTitle: { fontSize: 17, fontWeight: '800', marginTop: 8 }, heroText: { fontSize: 11.5, lineHeight: 17, textAlign: 'center', marginTop: 4 },
  label: { fontSize: 11.5, fontWeight: '800', marginBottom: 6, marginLeft: 2 },
  input: { height: 44, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 12.5, marginBottom: 15 },
  messageInput: { height: 125, paddingTop: 12 },
  submit: { height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, submitText: { fontSize: 12.5, fontWeight: '800' },
});
