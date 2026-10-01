import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AuthLayout, AuthInput, PrimaryButton } from '../../components/AuthLayout';
import { useAppAlert } from '../../context/AppAlertContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('test@example.com'); const [password, setPassword] = useState('password'); const [visible, setVisible] = useState(false); const [loading, setLoading] = useState(false);
  const { login, biometricAvailable, biometricEnabled, biometricLabel, biometricLogin } = useAuth(); const { theme } = useTheme();
  const Alert = useAppAlert();
  const submit = async () => { setLoading(true); try { await login(email, password); } catch (e) { Alert.alert('Unable to log in', e.message); } finally { setLoading(false); } };
  return <AuthLayout title="Welcome back" subtitle="Sign in to manage every conversation from one place.">
    <AuthInput icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
    <AuthInput icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!visible} right={<TouchableOpacity onPress={() => setVisible(!visible)}><Icon name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.secondaryText} /></TouchableOpacity>} />
    <TouchableOpacity style={styles.forgot} onPress={() => navigation.navigate('ForgotPassword')}><Text style={[styles.link, { color: theme.tint }]}>Forgot password?</Text></TouchableOpacity>
    <PrimaryButton label="Log in" onPress={submit} loading={loading} disabled={!email || !password} />
    {biometricAvailable && biometricEnabled && <><View style={styles.orRow}><View style={[styles.line, { backgroundColor: theme.border }]} /><Text style={[styles.or, { color: theme.secondaryText }]}>OR</Text><View style={[styles.line, { backgroundColor: theme.border }]} /></View><TouchableOpacity style={[styles.bio, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={biometricLogin}><Icon name="finger-print-outline" size={22} color={theme.tint} /><Text style={[styles.bioText, { color: theme.text }]}>Log in with {biometricLabel}</Text></TouchableOpacity></>}
    <View style={styles.footer}><Text style={[styles.footerText, { color: theme.secondaryText }]}>New to Unified Messenger? </Text><TouchableOpacity onPress={() => navigation.navigate('Register')}><Text style={[styles.link, { color: theme.tint }]}>Create account</Text></TouchableOpacity></View>
  </AuthLayout>;
}
const styles = StyleSheet.create({ forgot: { alignSelf: 'flex-end', marginBottom: 12 }, link: { fontSize: 11.5, fontWeight: '800' }, orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 17 }, line: { flex: 1, height: 1 }, or: { fontSize: 8.5, fontWeight: '800', marginHorizontal: 10 }, bio: { height: 46, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, bioText: { fontSize: 11.5, fontWeight: '800' }, footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 }, footerText: { fontSize: 11.5 } });
