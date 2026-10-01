import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

const faqs = [
  ['Can I connect every platform on the Free plan?', 'Yes. Every plan supports all available social platforms. Plans only change how many messages you can send each month.'],
  ['What counts as a sent message?', 'Each message you send from Unified Messenger counts once. Incoming messages do not count toward your limit.'],
  ['When does my limit reset?', 'Message usage resets at the beginning of each calendar month.'],
  ['What happens when I reach my limit?', 'You can still read incoming messages and use your connected accounts. Upgrade your plan to continue sending.'],
  ['Can I cancel or change plans?', 'Yes. You can change your plan from Profile at any time.'],
];

export default function InfoScreen({ route }) {
  const { theme } = useTheme();
  const type = route.params?.type || 'terms';
  const [openIndex, setOpenIndex] = useState(0);

  if (type === 'faq') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.intro, { color: theme.secondaryText }]}>Quick answers about accounts, messages, and subscriptions.</Text>
          {faqs.map(([question, answer], index) => {
            const open = openIndex === index;
            return (
              <TouchableOpacity
                key={question}
                style={[styles.faqCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                activeOpacity={0.8}
                onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpenIndex(open ? -1 : index); }}
              >
                <View style={styles.questionRow}>
                  <Text style={[styles.question, { color: theme.text }]}>{question}</Text>
                  <Icon name={open ? 'remove' : 'add'} size={19} color={theme.tint} />
                </View>
                {open && <Text style={[styles.answer, { color: theme.secondaryText }]}>{answer}</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.updated, { color: theme.tint }]}>LAST UPDATED · AUGUST 2026</Text>
        <Text style={[styles.intro, { color: theme.secondaryText }]}>By using Unified Messenger, you agree to these straightforward terms.</Text>
        {[
          ['1. Your account', 'Keep your login details secure and provide accurate account information. You are responsible for activity performed through your account.'],
          ['2. Connected platforms', 'You authorize Unified Messenger to access messages from accounts you choose to connect. You can disconnect a platform at any time.'],
          ['3. Message plans', 'All plans allow every supported social connection. Monthly sending allowances depend on your selected plan and reset each calendar month.'],
          ['4. Acceptable use', 'Do not use the service for spam, harassment, unlawful content, or activity that violates the rules of a connected platform.'],
          ['5. Privacy and data', 'We use account and message data only to provide the unified messaging experience and related support.'],
          ['6. Changes', 'We may improve these terms as the service evolves. Material changes will be communicated within the application.'],
        ].map(([title, body]) => (
          <View key={title} style={[styles.termCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
            <Text style={[styles.termTitle, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.termBody, { color: theme.secondaryText }]}>{body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: 18, paddingBottom: 30 },
  updated: { fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginTop: 4 },
  intro: { fontSize: 12.5, lineHeight: 19, marginTop: 6, marginBottom: 13 },
  faqCard: { padding: 14, borderRadius: 16, borderWidth: 1, marginVertical: 4 },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, question: { flex: 1, fontSize: 13, fontWeight: '800', lineHeight: 18 },
  answer: { fontSize: 11.5, lineHeight: 18, marginTop: 10, paddingRight: 20 },
  termCard: { padding: 15, borderRadius: 16, borderWidth: 1, marginVertical: 5 },
  termTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6 }, termBody: { fontSize: 11.5, lineHeight: 18 },
});
