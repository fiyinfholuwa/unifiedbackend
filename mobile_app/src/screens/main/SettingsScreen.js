import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useAppAlert } from '../../context/AppAlertContext';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const Alert = useAppAlert();
  const { biometricAvailable, biometricEnabled, biometricLabel, enableBiometrics, disableBiometrics } = useAuth();
  const [updating, setUpdating] = useState(false);
  const toggle = async value => {
    setUpdating(true);
    if (value) {
      const success = await enableBiometrics();
      if (!success) Alert.alert(`${biometricLabel} not enabled`, 'Authentication was cancelled or biometrics are unavailable.');
    } else await disableBiometrics();
    setUpdating(false);
  };
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['bottom']}><View style={styles.content}>
    <Text style={[styles.section, { color: theme.secondaryText }]}>SECURITY</Text>
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}><View style={[styles.icon, { backgroundColor: `${theme.primary}14` }]}><Icon name="finger-print-outline" size={21} color={theme.primary} /></View><View style={styles.info}><Text style={[styles.title, { color: theme.text }]}>Login with {biometricLabel}</Text><Text style={[styles.detail, { color: theme.secondaryText }]}>{biometricAvailable ? 'Use device biometrics instead of your password.' : 'No enrolled biometrics were found on this device.'}</Text></View><Switch value={biometricEnabled} disabled={!biometricAvailable || updating} onValueChange={toggle} trackColor={{ false: theme.muted, true: theme.primary }} thumbColor="#fff" /></View>
    <View style={[styles.notice, { backgroundColor: theme.muted }]}><Icon name="lock-closed-outline" size={15} color={theme.secondaryText} /><Text style={[styles.noticeText, { color: theme.secondaryText }]}>Your login token is protected by the device Keychain or Keystore and is never stored as plain text.</Text></View>
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 18 }, section: { fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 7 }, card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 13 }, icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 10 }, info: { flex: 1, paddingRight: 8 }, title: { fontSize: 12.5, fontWeight: '800' }, detail: { fontSize: 9.5, lineHeight: 14, marginTop: 3 }, notice: { flexDirection: 'row', gap: 7, padding: 11, borderRadius: 13, marginTop: 12 }, noticeText: { flex: 1, fontSize: 9.5, lineHeight: 14 } });
