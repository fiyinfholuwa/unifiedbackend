import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import BrandLogo from './BrandLogo';

export function AuthLayout({ title, subtitle, children, navigation, showBack = false }) {
  const { theme } = useTheme();
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><View style={[styles.orbOne, { backgroundColor: `${theme.primary}10` }]} /><View style={[styles.orbTwo, { backgroundColor: `${theme.tint}0C` }]} /><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}><ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    {showBack && <TouchableOpacity style={[styles.back, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.goBack()}><Icon name="arrow-back" size={19} color={theme.text} /></TouchableOpacity>}
    <View style={styles.brandRow}><BrandLogo size={28} style={styles.brandLogo} /><Text style={[styles.brandName, { color: theme.text }]}>UNIFIED</Text><View style={[styles.brandDot, { backgroundColor: theme.tint }]} /></View>
    <View style={[styles.logoHalo, { backgroundColor: `${theme.primary}12` }]}><BrandLogo size={70} /></View>
    <Text style={[styles.title, { color: theme.text }]}>{title}</Text><Text style={[styles.subtitle, { color: theme.secondaryText }]}>{subtitle}</Text>
    <View style={[styles.form, { backgroundColor: theme.card, borderColor: theme.border }]}>{children}</View>
    <View style={styles.trustRow}><Icon name="shield-checkmark-outline" size={13} color={theme.secondaryText} /><Text style={[styles.trustText, { color: theme.secondaryText }]}>Secure access · Encrypted credentials</Text></View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

export function AuthInput({ icon, right, style, ...props }) {
  const { theme } = useTheme();
  return <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.border }, style]}><Icon name={icon} size={18} color={theme.secondaryText} /><TextInput {...props} placeholderTextColor={theme.secondaryText} style={[styles.input, { color: theme.text }]} />{right}</View>;
}

export function PrimaryButton({ label, onPress, disabled, loading }) {
  const { theme } = useTheme();
  return <TouchableOpacity style={[styles.primary, { backgroundColor: disabled ? theme.muted : theme.primary }]} disabled={disabled || loading} onPress={onPress}><Text style={[styles.primaryText, disabled && { color: theme.secondaryText }]}>{loading ? 'Please wait...' : label}</Text>{!loading && <Icon name="arrow-forward" size={16} color={disabled ? theme.secondaryText : '#fff'} />}</TouchableOpacity>;
}

const styles = StyleSheet.create({ safe: { flex: 1, overflow: 'hidden' }, flex: { flex: 1 }, orbOne: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -110, right: -95 }, orbTwo: { position: 'absolute', width: 210, height: 210, borderRadius: 105, bottom: -90, left: -100 }, content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 22, justifyContent: 'center' }, back: { position: 'absolute', top: 10, left: 20, width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', zIndex: 2 }, brandRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginBottom: 18 }, brandLogo: { marginRight: 7 }, brandName: { fontSize: 10, fontWeight: '900', letterSpacing: 1.7 }, brandDot: { width: 4, height: 4, borderRadius: 2, marginLeft: 4 }, logoHalo: { width: 84, height: 84, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }, title: { fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: -.5, marginTop: 14 }, subtitle: { fontSize: 11.5, lineHeight: 17, textAlign: 'center', marginTop: 5, paddingHorizontal: 22 }, form: { marginTop: 20, borderWidth: 1, borderRadius: 22, padding: 15, shadowColor: '#111A2F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: .06, shadowRadius: 14, elevation: 3 }, trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 13 }, trustText: { fontSize: 8.5, fontWeight: '700' }, inputWrap: { height: 46, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, marginBottom: 10 }, input: { flex: 1, height: '100%', fontSize: 12, marginLeft: 9 }, primary: { height: 47, borderRadius: 14, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: '#203C86', shadowOffset: { width: 0, height: 5 }, shadowOpacity: .18, shadowRadius: 8, elevation: 4 }, primaryText: { color: '#fff', fontSize: 12, fontWeight: '800' } });
