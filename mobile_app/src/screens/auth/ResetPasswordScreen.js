import React, { useState } from 'react';
import { AuthLayout, AuthInput, PrimaryButton } from '../../components/AuthLayout';
import { useAppAlert } from '../../context/AppAlertContext';
import apiService from '../../api/apiService';

export default function ResetPasswordScreen({ route, navigation }) {
  const [code, setCode] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const Alert = useAppAlert();
  const valid = code.length === 6 && password.length >= 8 && password === confirm;
  const reset = async () => { try { await apiService.resetPassword(route.params?.email || '', code, password); Alert.alert('Password updated', 'You can now log in with your new password.', [{ text: 'Log in', onPress: () => navigation.navigate('Login') }]); } catch (e) { Alert.alert('Unable to reset password', e.message); } };
  return <AuthLayout title="Create a new password" subtitle="Enter the six-digit code and choose a strong new password." navigation={navigation} showBack><AuthInput icon="keypad-outline" placeholder="6-digit reset code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} /><AuthInput icon="lock-closed-outline" placeholder="New password" value={password} onChangeText={setPassword} secureTextEntry /><AuthInput icon="checkmark-circle-outline" placeholder="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry /><PrimaryButton label="Update password" onPress={reset} disabled={!valid} /></AuthLayout>;
}
