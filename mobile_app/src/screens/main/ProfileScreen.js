import React, { useState, useEffect, useRef } from 'react';
import { Animated, View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSubscription } from '../../context/SubscriptionContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useAppAlert } from '../../context/AppAlertContext';

const MenuRow = ({ icon, label, detail, onPress, theme, danger = false, right }) => (
  <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={onPress}>
    <View style={[styles.menuIcon, { backgroundColor: danger ? '#EF444415' : theme.muted }]}> 
      <Icon name={icon} size={18} color={danger ? '#EF5B5B' : theme.tint} />
    </View>
    <View style={styles.menuText}>
      <Text style={[styles.menuLabel, { color: danger ? '#EF5B5B' : theme.text }]}>{label}</Text>
      {detail && <Text style={[styles.menuDetail, { color: theme.secondaryText }]}>{detail}</Text>}
    </View>
    {right || <Icon name="chevron-forward" size={17} color={theme.secondaryText} />}
  </TouchableOpacity>
);

const ThemeSelector = ({ isDark, onChange, theme }) => {
  const position = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(position, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 190,
      mass: 0.8,
    }).start();
  }, [isDark, position]);

  const translateX = position.interpolate({ inputRange: [0, 1], outputRange: [0, 72] });

  return (
    <View style={[styles.appearanceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.appearanceIcon, { backgroundColor: theme.muted }]}>
        <Icon name={isDark ? 'moon' : 'sunny'} size={21} color={theme.primary} />
      </View>
      <View style={styles.appearanceCopy}>
        <Text style={[styles.menuLabel, { color: theme.text }]}>Appearance</Text>
        <Text style={[styles.menuDetail, { color: theme.secondaryText }]}>{isDark ? 'Dark theme is active' : 'Light theme is active'}</Text>
      </View>
      <View style={[styles.themeControl, { backgroundColor: theme.muted, borderColor: theme.border }]}>
        <Animated.View style={[styles.themeIndicator, { backgroundColor: theme.primary, transform: [{ translateX }] }]} />
        <TouchableOpacity
          style={styles.themeOption}
          activeOpacity={0.8}
          onPress={() => isDark && onChange()}
          accessibilityRole="radio"
          accessibilityState={{ checked: !isDark }}
          accessibilityLabel="Use light theme"
        >
          <Icon name={isDark ? 'sunny-outline' : 'sunny'} size={15} color={isDark ? theme.secondaryText : '#fff'} />
          <Text style={[styles.themeOptionText, { color: isDark ? theme.secondaryText : '#fff' }]}>Light</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.themeOption}
          activeOpacity={0.8}
          onPress={() => !isDark && onChange()}
          accessibilityRole="radio"
          accessibilityState={{ checked: isDark }}
          accessibilityLabel="Use dark theme"
        >
          <Icon name={isDark ? 'moon' : 'moon-outline'} size={15} color={isDark ? '#fff' : theme.secondaryText} />
          <Text style={[styles.themeOptionText, { color: isDark ? '#fff' : theme.secondaryText }]}>Dark</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ProfileScreen({ navigation }) {
  const { user, logout, deleteAccount, biometricAvailable, biometricEnabled, biometricLabel, enableBiometrics, disableBiometrics } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const Alert = useAppAlert();
  const { plan, usage, remaining } = useSubscription();
  const [showLogout, setShowLogout] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [updatingSecurity, setUpdatingSecurity] = useState(false);

  const profile = user;
  if (!profile) return null;

  const usagePercent = plan.limit === Infinity ? 0 : Math.min((usage / plan.limit) * 100, 100);

  const toggleBiometrics = async value => {
    setUpdatingSecurity(true);
    if (value) {
      const success = await enableBiometrics();
      if (!success) Alert.alert(`${biometricLabel} not enabled`, 'Authentication was cancelled or biometrics are unavailable.');
    } else {
      await disableBiometrics();
    }
    setUpdatingSecurity(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headingRow}>
          <View><Text style={[styles.eyebrow, { color: theme.tint }]}>ACCOUNT</Text><Text style={[styles.heading, { color: theme.text }]}>Profile</Text></View>
        </View>

        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          <View style={styles.profileInfo}><Text style={[styles.name, { color: theme.text }]}>{profile.name}</Text><Text style={[styles.email, { color: theme.secondaryText }]}>{profile.email}</Text></View>
          <View style={[styles.planPill, { backgroundColor: `${plan.color}18` }]}><Icon name="star-outline" size={12} color={plan.color} /><Text style={[styles.planPillText, { color: plan.color }]}>{plan.name}</Text></View>
        </View>

        <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.muted }]} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.8}>
          <Icon name="create-outline" size={17} color={theme.primary} />
          <Text style={[styles.editButtonText, { color: theme.primary }]}>Edit profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.usageCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.8}>
          <View style={styles.usageTop}><View><Text style={[styles.usageTitle, { color: theme.text }]}>Monthly messages</Text><Text style={[styles.usageSub, { color: theme.secondaryText }]}>{plan.limit === Infinity ? `${usage} sent · Unlimited` : `${usage} of ${plan.limit} sent · ${remaining} left`}</Text></View><Text style={[styles.manage, { color: theme.tint }]}>Manage plan</Text></View>
          <View style={[styles.track, { backgroundColor: theme.muted }]}><View style={[styles.progress, { backgroundColor: plan.color, width: plan.limit === Infinity ? '100%' : `${usagePercent}%` }]} /></View>
          <Text style={[styles.allSocials, { color: theme.secondaryText }]}><Icon name="checkmark-circle" size={12} color="#39C884" />  All social connections included</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>PREFERENCES</Text>
        <ThemeSelector isDark={isDark} onChange={toggleTheme} theme={theme} />

        <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>SECURITY</Text>
        <View style={[styles.securityCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <View style={[styles.securityIcon, { backgroundColor: theme.muted }]}><Icon name="finger-print-outline" size={22} color={theme.primary} /></View>
          <View style={styles.securityCopy}>
            <Text style={[styles.menuLabel, { color: theme.text }]}>Login with {biometricLabel}</Text>
            <Text style={[styles.menuDetail, { color: theme.secondaryText }]}>{biometricAvailable ? 'Use device biometrics instead of your password.' : 'No enrolled biometrics were found on this device.'}</Text>
          </View>
          <Switch value={biometricEnabled} disabled={!biometricAvailable || updatingSecurity} onValueChange={toggleBiometrics} trackColor={{ false: theme.muted, true: theme.primary }} thumbColor="#fff" />
        </View>
        <View style={[styles.securityNotice, { backgroundColor: theme.muted }]}><Icon name="lock-closed-outline" size={14} color={theme.secondaryText} /><Text style={[styles.securityNoticeText, { color: theme.secondaryText }]}>Your login token is protected by the device Keychain or Keystore.</Text></View>

        <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>SUPPORT & INFORMATION</Text>
        <View style={[styles.menuCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <MenuRow icon="help-buoy-outline" label="Help desk" detail="Get support from our team" theme={theme} onPress={() => navigation.navigate('Support', { mode: 'help' })} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuRow icon="chatbubble-ellipses-outline" label="Send feedback" detail="Help us improve the app" theme={theme} onPress={() => navigation.navigate('Support', { mode: 'feedback' })} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuRow icon="help-circle-outline" label="Frequently asked questions" theme={theme} onPress={() => navigation.navigate('Info', { type: 'faq' })} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuRow icon="document-text-outline" label="Terms & conditions" theme={theme} onPress={() => navigation.navigate('Info', { type: 'terms' })} />
        </View>

        <View style={[styles.menuCard, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 15 }]}> 
          <MenuRow icon="log-out-outline" label="Log out" danger theme={theme} onPress={() => setShowLogout(true)} />
        </View>
        <TouchableOpacity style={[styles.deleteAccount, { borderColor: '#EF5B5B55' }]} onPress={() => setShowDelete(true)} activeOpacity={0.75}>
          <Icon name="trash-outline" size={16} color="#EF5B5B" />
          <Text style={styles.deleteAccountText}>Delete account</Text>
        </TouchableOpacity>
        <Text style={[styles.version, { color: theme.secondaryText }]}>Unified Messenger · Version 1.0.0</Text>
      </ScrollView>

      <ConfirmationModal visible={showLogout} title="Log out of your account?" message="You will need to sign in again to access your connected conversations." icon="log-out-outline" confirmLabel="Log out" onCancel={() => setShowLogout(false)} onConfirm={logout} />
      <ConfirmationModal visible={showDelete} title="Permanently delete account?" message="This removes your profile, connected channels, wallet, subscription, and local activity. This action cannot be undone." icon="trash-outline" iconColor="#EF5B5B" confirmLabel="Delete account" onCancel={() => setShowDelete(false)} onConfirm={deleteAccount} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 120 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.35 }, heading: { fontSize: 25, fontWeight: '800', letterSpacing: -0.5, marginTop: 3 },
  profileCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 13, marginTop: 15 }, avatar: { width: 52, height: 52, borderRadius: 17, marginRight: 11 }, profileInfo: { flex: 1 }, name: { fontSize: 15, fontWeight: '800' }, email: { fontSize: 10.5, marginTop: 3 },
  editButton: { height: 40, borderRadius: 13, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, editButtonText: { fontSize: 11.5, fontWeight: '800' },
  planPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9 }, planPillText: { fontSize: 9.5, fontWeight: '900' },
  usageCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 10 }, usageTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, usageTitle: { fontSize: 13, fontWeight: '800' }, usageSub: { fontSize: 10.5, marginTop: 3 }, manage: { fontSize: 10.5, fontWeight: '800' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 12 }, progress: { height: '100%', borderRadius: 3 }, allSocials: { fontSize: 10, marginTop: 9 },
  sectionLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginTop: 19, marginBottom: 7, marginLeft: 3 },
  appearanceCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 11 },
  appearanceIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  appearanceCopy: { flex: 1, paddingRight: 8 },
  themeControl: { width: 150, height: 40, borderRadius: 14, borderWidth: 1, padding: 3, flexDirection: 'row', position: 'relative', overflow: 'hidden' },
  themeIndicator: { position: 'absolute', top: 3, left: 3, width: 72, height: 32, borderRadius: 11, shadowColor: '#3B176D', shadowOffset: { width: 0, height: 3 }, shadowOpacity: .24, shadowRadius: 5, elevation: 4 },
  themeOption: { width: 72, height: 32, zIndex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  themeOptionText: { fontSize: 9.5, fontWeight: '800' },
  securityCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 12 }, securityIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 10 }, securityCopy: { flex: 1, paddingRight: 8 },
  securityNotice: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, borderRadius: 12, marginTop: 8 }, securityNoticeText: { flex: 1, fontSize: 9.5, lineHeight: 14 },
  menuCard: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' }, menuRow: { minHeight: 59, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9 }, menuIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 10 }, menuText: { flex: 1 }, menuLabel: { fontSize: 12.5, fontWeight: '800' }, menuDetail: { fontSize: 9.5, marginTop: 2 }, divider: { height: StyleSheet.hairlineWidth, marginLeft: 57 }, deleteAccount: { height: 42, borderRadius: 14, borderWidth: 1, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, deleteAccountText: { color: '#EF5B5B', fontSize: 11.5, fontWeight: '800' }, version: { textAlign: 'center', fontSize: 9.5, marginTop: 18 },
});
