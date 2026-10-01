import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AuthLayout, AuthInput, PrimaryButton } from '../../components/AuthLayout';
import { useAppAlert } from '../../context/AppAlertContext';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [visible, setVisible] = useState(false); const [loading, setLoading] = useState(false);
  const { register } = useAuth(); const { theme } = useTheme();
  const Alert = useAppAlert();
  const valid = name.trim() && email.includes('@') && password.length >= 8;
  const submit = async () => { setLoading(true); try { await register(name.trim(), email.trim(), password); } catch (e) { Alert.alert('Unable to create account', e.message); } finally { setLoading(false); } };
  return <AuthLayout title="Create your account" subtitle="Connect every social inbox and respond from one secure workspace." navigation={navigation} showBack>
    <AuthInput icon="person-outline" placeholder="Full name" value={name} onChangeText={setName} />
    <AuthInput icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
    <AuthInput icon="lock-closed-outline" placeholder="Password · at least 8 characters" value={password} onChangeText={setPassword} secureTextEntry={!visible} right={<TouchableOpacity onPress={() => setVisible(!visible)} accessibilityLabel={visible ? 'Hide password' : 'Show password'}><Icon name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.secondaryText} /></TouchableOpacity>} />
    <View style={styles.requirements}><Text style={[styles.requirement, { color: password.length >= 8 ? '#24A86B' : theme.secondaryText }]}>●  8+ characters</Text><Text style={[styles.requirement, { color: email.includes('@') ? '#24A86B' : theme.secondaryText }]}>●  Valid email</Text></View>
    <PrimaryButton label="Create account" onPress={submit} loading={loading} disabled={!valid} />
    <Text style={[styles.terms, { color: theme.secondaryText }]}>By continuing, you agree to the Terms & Conditions and Privacy Policy.</Text>
    <View style={styles.footer}><Text style={[styles.footerText, { color: theme.secondaryText }]}>Already registered? </Text><TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={[styles.link, { color: theme.tint }]}>Log in</Text></TouchableOpacity></View>
  </AuthLayout>;
}
const styles = StyleSheet.create({ requirements: { flexDirection: 'row', gap: 14, marginBottom: 12, paddingLeft: 3 }, requirement: { fontSize: 9.5, fontWeight: '700' }, terms: { fontSize: 9.5, lineHeight: 14, textAlign: 'center', marginTop: 13, paddingHorizontal: 20 }, footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 }, footerText: { fontSize: 11.5 }, link: { fontSize: 11.5, fontWeight: '800' } });
