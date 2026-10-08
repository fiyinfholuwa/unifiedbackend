import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useWallet } from '../../context/WalletContext';
import { useAppAlert } from '../../context/AppAlertContext';

const features = {
  free: ['Connect every social account', '50 sent messages / month', 'Unified inbox'],
  pro: ['Connect every social account', '1,000 sent messages / month', 'Priority support', 'Advanced search'],
  business: ['Connect every social account', 'Unlimited sent messages', 'Team-ready workspace', 'Priority support'],
};

export default function SubscriptionScreen({ navigation }) {
  const { theme } = useTheme();
  const { plans, planId, selectPlan } = useSubscription();
  const wallet = useWallet();
  const Alert = useAppAlert();
  const [selected, setSelected] = useState(planId);
  const [saving, setSaving] = useState(false);

  const continueWithPlan = async () => {
    const selectedPlan = plans[selected];
    if (selectedPlan.unitCost > 0 && wallet.kycStatus !== 'verified') {
      Alert.alert('Complete verification', 'KYC is required before activating a paid plan.', [{ text: 'Start KYC', onPress: () => navigation.navigate('Kyc') }]);
      return;
    }
    if (selected !== planId && selectedPlan.unitCost > wallet.balance) {
      Alert.alert('Insufficient units', `You need ${selectedPlan.unitCost} units to activate ${selectedPlan.name}.`, [{ text: 'Fund wallet', onPress: () => navigation.navigate('Wallet') }]);
      return;
    }
    setSaving(true);
    try {
      await selectPlan(selected);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Unable to activate plan', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}18` }]}>
          <Icon name="star-outline" size={26} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Choose your message plan</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Connect all your socials on any plan. Upgrade only when you need to send more.</Text>

        {Object.values(plans).map(plan => {
          const active = selected === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, { backgroundColor: theme.card, borderColor: active ? plan.color : theme.border }, active && styles.activeCard]}
              activeOpacity={0.8}
              onPress={() => setSelected(plan.id)}
            >
              <View style={styles.planTop}>
                <View>
                  <View style={styles.planNameRow}>
                    <Text style={[styles.planName, { color: theme.text }]}>{plan.name}</Text>
                    {plan.id === 'pro' && <Text style={[styles.popular, { backgroundColor: `${plan.color}18`, color: plan.color }]}>POPULAR</Text>}
                  </View>
                  <Text style={[styles.price, { color: plan.color }]}>{plan.price}<Text style={[styles.period, { color: theme.secondaryText }]}> / month</Text></Text>
                </View>
                <View style={[styles.radio, { borderColor: active ? plan.color : theme.border, backgroundColor: active ? plan.color : 'transparent' }]}>
                  {active && <Icon name="checkmark" size={15} color="#fff" />}
                </View>
              </View>
              {(plan.features || features[plan.id] || []).map(feature => (
                <View key={feature} style={styles.featureRow}>
                  <Icon name="checkmark-circle" size={16} color={plan.color} />
                  <Text style={[styles.feature, { color: theme.secondaryText }]}>{feature}</Text>
                </View>
              ))}
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.note, { color: theme.secondaryText }]}>Wallet balance: {wallet.balance} units · Plan charges are secured on the server</Text>
        <TouchableOpacity style={[styles.continueButton, { backgroundColor: theme.primary }]} onPress={continueWithPlan} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.continueText}>{selected === planId ? 'Keep current plan' : `Choose ${plans[selected].name}`}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, content: { padding: 18, paddingBottom: 30 },
  heroIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 8 },
  title: { fontSize: 23, fontWeight: '800', textAlign: 'center', marginTop: 12, letterSpacing: -0.4 },
  subtitle: { fontSize: 12.5, lineHeight: 18, textAlign: 'center', paddingHorizontal: 18, marginTop: 6, marginBottom: 14 },
  planCard: { borderRadius: 18, borderWidth: 1, padding: 15, marginVertical: 5 }, activeCard: { borderWidth: 2, padding: 14 },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, planName: { fontSize: 16, fontWeight: '800' },
  popular: { fontSize: 8, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, letterSpacing: 0.5 },
  price: { fontSize: 18, fontWeight: '800', marginTop: 3 }, period: { fontSize: 10.5, fontWeight: '500' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 7 }, feature: { fontSize: 11.5 },
  note: { fontSize: 10.5, textAlign: 'center', marginVertical: 13 },
  continueButton: { height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, continueText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
