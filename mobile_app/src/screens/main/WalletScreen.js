import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { UNIT_PRICE_NGN, useWallet } from '../../context/WalletContext';
import { useAppAlert } from '../../context/AppAlertContext';

export default function WalletScreen({ navigation }) {
  const { theme } = useTheme();
  const wallet = useWallet();
  const Alert = useAppAlert();
  const [unitInput, setUnitInput] = useState('250');
  const [paymentMethod, setPaymentMethod] = useState('globus_bank_transfer');
  const [now, setNow] = useState(Date.now());
  const [starting, setStarting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const session = wallet.paymentSession;
  const timeLeft = session ? Math.max(session.expiresAt - now, 0) : 0;
  const expired = Boolean(session && timeLeft === 0);
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const selectedUnits = Number.parseInt(unitInput, 10) || 0;
  const validAmount = selectedUnits >= 10 && selectedUnits <= 100000;
  const paymentAmount = selectedUnits * UNIT_PRICE_NGN;
  const sessionPaymentAmount = session?.paymentAmount ?? session?.amount * UNIT_PRICE_NGN;
  const formatNaira = amount => `₦${Number(amount || 0).toLocaleString()}`;

  useEffect(() => {
    if (!session) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [session?.expiresAt]);

  const startPayment = async () => {
    if (wallet.kycStatus !== 'verified') {
      Alert.alert('Verification required', 'Complete KYC before generating a payment account.', [{ text: 'Complete KYC', onPress: () => navigation.navigate('Kyc') }]);
      return;
    }
    if (!validAmount) {
      Alert.alert('Enter a valid amount', 'Choose between 10 and 100,000 wallet units.');
      return;
    }
    setStarting(true);
    try {
      await wallet.createPaymentSession(selectedUnits, paymentMethod);
      setNow(Date.now());
    } catch (error) {
      const providerPending = ['PAYSTACK_NOT_CONFIGURED', 'MONNIFY_NOT_CONFIGURED'].includes(error.message);
      Alert.alert('Could not start funding', error.message === 'KYC_REQUIRED' ? 'Your KYC must be approved before you can fund the wallet.' : providerPending ? 'This payment provider is not configured yet. Use Bank transfer (Globus Bank) for the demo flow.' : 'Check the number of units and try again.');
    } finally {
      setStarting(false);
    }
  };

  const confirm = async () => {
    setConfirming(true);
    try {
      const success = await wallet.confirmPayment();
      if (success) {
        Alert.alert(
          'Payment confirmed',
          `${session.amount} units have been added to your wallet.`,
          [{ text: 'Done', onPress: () => navigation.goBack() }],
        );
        return;
      }
      Alert.alert('Payment session expired', 'Generate a new account number and try again.');
    } catch (error) {
      Alert.alert('Could not confirm payment', error.message);
    } finally {
      setConfirming(false);
    }
  };

  const cancel = async () => {
    try {
      await wallet.cancelPaymentSession();
      setNow(Date.now());
    } catch (error) {
      Alert.alert('Could not cancel payment', error.message);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}> 
          <Text style={styles.balanceLabel}>WALLET BALANCE</Text>
          <Text style={styles.balance}>{wallet.balance.toLocaleString()} <Text style={styles.units}>units</Text></Text>
          <Text style={styles.demo}>Simulated wallet · No real funds</Text>
        </View>

        {session ? (
          <>
            <View style={styles.paymentHeader}>
              <View><Text style={[styles.section, styles.noMargin, { color: theme.secondaryText }]}>TEMPORARY PAYMENT ACCOUNT</Text><Text style={[styles.payAmount, { color: theme.text }]}>{session.amount.toLocaleString()} units · {formatNaira(sessionPaymentAmount)}</Text></View>
              <View style={[styles.timer, { backgroundColor: expired ? '#EF444418' : `${theme.primary}14` }]}> 
                <Icon name="time-outline" size={14} color={expired ? '#EF5B5B' : theme.tint} />
                <Text style={[styles.timerText, { color: expired ? '#EF5B5B' : theme.tint }]}>{expired ? 'Expired' : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}</Text>
              </View>
            </View>

            <View style={[styles.accountCard, { backgroundColor: theme.card, borderColor: expired ? '#EF5B5B' : theme.border }]}> 
              <View style={[styles.bankIcon, { backgroundColor: theme.muted }]}><Icon name="business-outline" size={21} color={theme.tint} /></View>
              <Text style={[styles.bankName, { color: theme.secondaryText }]}>{session.provider || 'Globus Bank'}</Text>
              <Text style={[styles.accountNumber, { color: theme.text }]}>{session.accountNumber}</Text>
              <Text style={[styles.accountName, { color: theme.secondaryText }]}>{session.accountName || 'Unified Messenger Wallet'}</Text>
              <View style={[styles.amountDue, { backgroundColor: theme.muted }]}><View><Text style={[styles.amountDueLabel, { color: theme.secondaryText }]}>AMOUNT TO TRANSFER</Text><Text style={[styles.amountDueHint, { color: theme.secondaryText }]}>{session.amount.toLocaleString()} wallet units</Text></View><Text style={[styles.amountDueValue, { color: theme.text }]}>{formatNaira(sessionPaymentAmount)}</Text></View>
            </View>

            <Text style={[styles.instruction, { color: theme.secondaryText }]}>Make the transfer before the timer expires, then confirm below. This demo credits units immediately.</Text>
            <TouchableOpacity style={[styles.fund, { backgroundColor: expired ? theme.muted : theme.primary }]} disabled={expired || confirming} onPress={confirm}>
              <Icon name="checkmark-circle-outline" size={18} color={expired ? theme.secondaryText : '#fff'} />
              <Text style={[styles.fundText, expired && { color: theme.secondaryText }]}>{confirming ? 'Confirming...' : 'I have paid'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancel} onPress={cancel} disabled={confirming}><Text style={[styles.cancelText, { color: theme.secondaryText }]}>{expired ? 'Generate another account' : 'Cancel this payment'}</Text></TouchableOpacity>
          </>
        ) : (
          <>
            {wallet.kycStatus === 'pending' && <View style={[styles.kycPending, { backgroundColor: `${theme.primary}14` }]}><Icon name="time-outline" size={17} color={theme.primary} /><Text style={[styles.kycPendingText, { color: theme.secondaryText }]}>Your KYC is pending review. Wallet funding will be available after approval.</Text></View>}
            <Text style={[styles.section, { color: theme.secondaryText }]}>PAYMENT METHOD</Text>
            <View style={styles.methods}>
              {[
                { id: 'paystack', label: 'Paystack', icon: 'card-outline' },
                { id: 'monnify', label: 'Monnify', icon: 'phone-portrait-outline' },
                { id: 'globus_bank_transfer', label: 'Bank transfer (Globus Bank)', icon: 'business-outline' },
              ].map(method => {
                const active = paymentMethod === method.id;
                return <TouchableOpacity key={method.id} style={[styles.method, { backgroundColor: theme.card, borderColor: active ? theme.primary : theme.border }, active && styles.activeMethod]} onPress={() => setPaymentMethod(method.id)}><Icon name={method.icon} size={18} color={active ? theme.primary : theme.secondaryText} /><Text style={[styles.methodText, { color: active ? theme.text : theme.secondaryText }]}>{method.label}</Text>{method.id !== 'globus_bank_transfer' && <Text style={[styles.comingSoon, { color: theme.secondaryText }]}>Soon</Text>}</TouchableOpacity>;
              })}
            </View>
            <Text style={[styles.section, { color: theme.secondaryText }]}>BUY WALLET UNITS</Text>
            <Text style={[styles.description, { color: theme.secondaryText }]}>Enter how many units you need. The amount to transfer is calculated at ₦{UNIT_PRICE_NGN} per unit.</Text>
            <View style={[styles.unitInputWrap, { backgroundColor: theme.card, borderColor: validAmount ? theme.primary : theme.border }]}>
              <View style={[styles.inputIcon, { backgroundColor: theme.muted }]}><Icon name="wallet-outline" size={20} color={theme.primary} /></View>
              <TextInput
                value={unitInput}
                onChangeText={value => setUnitInput(value.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                placeholder="Enter units"
                placeholderTextColor={theme.secondaryText}
                style={[styles.unitInput, { color: theme.text }]}
                maxLength={6}
              />
              <Text style={[styles.inputSuffix, { color: theme.secondaryText }]}>units</Text>
            </View>
            <View style={[styles.calculation, { backgroundColor: theme.muted }]}>
              <View><Text style={[styles.calculationLabel, { color: theme.secondaryText }]}>YOU WILL TRANSFER</Text><Text style={[styles.rate, { color: theme.secondaryText }]}>{selectedUnits.toLocaleString()} units × ₦{UNIT_PRICE_NGN}</Text></View>
              <Text style={[styles.calculationValue, { color: validAmount ? theme.primary : theme.secondaryText }]}>{formatNaira(paymentAmount)}</Text>
            </View>
            {!validAmount && <Text style={styles.validation}>Enter between 10 and 100,000 units.</Text>}
            <TouchableOpacity disabled={!validAmount || starting} style={[styles.fund, { backgroundColor: validAmount && !starting ? theme.primary : theme.muted }]} onPress={startPayment}>{starting ? <ActivityIndicator color="#fff" /> : <><Icon name="business-outline" size={17} color={validAmount ? '#fff' : theme.secondaryText} /><Text style={[styles.fundText, !validAmount && { color: theme.secondaryText }]}>Generate payment account</Text></>}</TouchableOpacity>
          </>
        )}

        <View style={[styles.security, { backgroundColor: theme.muted }]}><Icon name="information-circle-outline" size={16} color={theme.secondaryText} /><Text style={[styles.securityText, { color: theme.secondaryText }]}>Prototype only. A production app must verify transfers through a licensed payment provider before crediting units.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { flexGrow: 1, padding: 18 },
  balanceCard: { borderRadius: 20, padding: 17 }, balanceLabel: { color: 'rgba(255,255,255,.7)', fontSize: 9, fontWeight: '900', letterSpacing: 1 }, balance: { color: '#fff', fontSize: 27, fontWeight: '800', marginTop: 7 }, units: { fontSize: 13 }, demo: { color: 'rgba(255,255,255,.65)', fontSize: 9.5, marginTop: 7 },
  section: { fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginTop: 20, marginBottom: 7 }, noMargin: { marginTop: 0 }, description: { fontSize: 10.5, lineHeight: 16, marginBottom: 13 },
  unitInputWrap: { height: 58, borderWidth: 1.5, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11 }, inputIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 }, unitInput: { flex: 1, height: '100%', fontSize: 18, fontWeight: '800' }, inputSuffix: { fontSize: 11, fontWeight: '800' },
  calculation: { minHeight: 66, borderRadius: 15, paddingHorizontal: 13, paddingVertical: 11, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, calculationLabel: { fontSize: 8, fontWeight: '900', letterSpacing: .8 }, rate: { fontSize: 10, marginTop: 4 }, calculationValue: { fontSize: 21, fontWeight: '900' }, validation: { color: '#EF5B5B', fontSize: 9.5, fontWeight: '700', marginTop: 6, marginLeft: 3 },
  paymentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 9 }, payAmount: { fontSize: 13, fontWeight: '800', marginTop: 4 }, timer: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, height: 30, borderRadius: 10 }, timerText: { fontSize: 11, fontWeight: '900', fontVariant: ['tabular-nums'] },
  accountCard: { alignItems: 'center', borderWidth: 1, borderRadius: 19, padding: 16 }, bankIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, bankName: { fontSize: 8.5, fontWeight: '900', letterSpacing: .8, marginTop: 10 }, accountNumber: { fontSize: 23, fontWeight: '800', letterSpacing: 2, marginTop: 4 }, accountName: { fontSize: 10, marginTop: 3 }, amountDue: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, padding: 11, marginTop: 14 }, amountDueLabel: { fontSize: 8.5, fontWeight: '800' }, amountDueHint: { fontSize: 9, marginTop: 3 }, amountDueValue: { fontSize: 16, fontWeight: '900' },
  kycPending: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 13, padding: 12, marginTop: 18 }, kycPendingText: { flex: 1, fontSize: 10.5, lineHeight: 15 }, methods: { gap: 8, marginBottom: 3 }, method: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }, activeMethod: { borderWidth: 1.5 }, methodText: { flex: 1, fontSize: 11.5, fontWeight: '800' }, comingSoon: { fontSize: 9, fontWeight: '700' }, instruction: { fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 10, marginTop: 11 }, fund: { height: 46, borderRadius: 14, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', marginTop: 13 }, fundText: { color: '#fff', fontSize: 12.5, fontWeight: '800' }, cancel: { alignSelf: 'center', padding: 10 }, cancelText: { fontSize: 10.5, fontWeight: '700' },
  security: { flexDirection: 'row', padding: 11, borderRadius: 13, marginTop: 'auto', gap: 8 }, securityText: { flex: 1, fontSize: 9.5, lineHeight: 14 },
});
