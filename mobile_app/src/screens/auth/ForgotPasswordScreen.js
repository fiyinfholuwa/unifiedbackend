import React, { useState } from 'react';
import { AuthLayout, AuthInput, PrimaryButton } from '../../components/AuthLayout';
import { useAppAlert } from '../../context/AppAlertContext';
import apiService from '../../api/apiService';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false);
  const Alert = useAppAlert();
  const send = async () => { setLoading(true); try { await apiService.forgotPassword(email.trim()); Alert.alert('Reset code sent', 'Use the six-digit code sent to your email.', [{ text: 'Continue', onPress: () => navigation.navigate('ResetPassword', { email }) }]); } catch (e) { Alert.alert('Unable to send code', e.message); } finally { setLoading(false); } };
  return <AuthLayout title="Reset your password" subtitle="Enter your account email and we’ll send you a secure reset code." navigation={navigation} showBack><AuthInput icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /><PrimaryButton label="Send reset code" onPress={send} loading={loading} disabled={!email.includes('@')} /></AuthLayout>;
}
