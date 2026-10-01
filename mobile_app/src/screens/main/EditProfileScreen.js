import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useAppAlert } from '../../context/AppAlertContext';

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const { theme } = useTheme();
  const Alert = useAppAlert();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const valid = Boolean(name.trim() && email.trim().includes('@'));

  const selectAvatar = async source => {
    const picker = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await picker({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setAvatar({ uri: asset.uri, name: asset.fileName || `profile-${Date.now()}.jpg`, mimeType: asset.mimeType || 'image/jpeg' });
    }
  };

  const chooseAvatar = () => Alert.alert('Profile photo', 'Choose how you want to add your photo.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Take a photo', onPress: () => selectAvatar('camera') },
    { text: 'Choose from device', onPress: () => selectAvatar('library') },
  ]);

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim(), bio: bio.trim(), avatar });
      Alert.alert('Profile updated', 'Your account details have been saved.', [{ text: 'Done', onPress: navigation.goBack }]);
    } catch (error) {
      Alert.alert('Could not update profile', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={[styles.avatarWrap, { backgroundColor: theme.muted }]} onPress={chooseAvatar} activeOpacity={0.8}>
          <Image source={{ uri: avatar?.uri || user?.avatar }} style={styles.avatar} />
          <View style={[styles.avatarBadge, { backgroundColor: theme.primary }]}><Icon name="camera-outline" size={13} color="#fff" /></View>
        </TouchableOpacity>
        <Text style={[styles.avatarHint, { color: theme.secondaryText }]}>Tap the photo to upload a new profile image</Text>
        <Text style={[styles.helper, { color: theme.secondaryText }]}>Update the details people see across your connected conversations.</Text>

        <Text style={[styles.label, { color: theme.text }]}>Full name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={theme.secondaryText} style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} />
        <Text style={[styles.label, { color: theme.text }]}>Email address</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={theme.secondaryText} keyboardType="email-address" autoCapitalize="none" style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} />
        <Text style={[styles.label, { color: theme.text }]}>Bio</Text>
        <TextInput value={bio} onChangeText={setBio} placeholder="Tell people a little about you" placeholderTextColor={theme.secondaryText} multiline maxLength={140} textAlignVertical="top" style={[styles.input, styles.bioInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} />
        <Text style={[styles.counter, { color: theme.secondaryText }]}>{bio.length}/140</Text>

        <TouchableOpacity disabled={!valid || saving} onPress={save} style={[styles.saveButton, { backgroundColor: valid ? theme.primary : theme.muted }]}>
          {saving ? <ActivityIndicator color="#fff" /> : <><Icon name="checkmark-circle-outline" size={18} color={valid ? '#fff' : theme.secondaryText} /><Text style={[styles.saveText, !valid && { color: theme.secondaryText }]}>Save changes</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: 18, paddingBottom: 34 },
  avatarWrap: { width: 92, height: 92, borderRadius: 30, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  avatar: { width: 78, height: 78, borderRadius: 25 }, avatarBadge: { position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  helper: { fontSize: 11.5, lineHeight: 17, textAlign: 'center', marginTop: 12, marginBottom: 22, paddingHorizontal: 28 },
  label: { fontSize: 11.5, fontWeight: '800', marginBottom: 6, marginLeft: 2 },
  input: { height: 48, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, fontSize: 13, marginBottom: 16 },
  bioInput: { height: 105, paddingTop: 13, paddingBottom: 13, marginBottom: 5 }, counter: { textAlign: 'right', fontSize: 9.5, marginBottom: 17 },
  saveButton: { height: 48, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, saveText: { color: '#fff', fontSize: 12.5, fontWeight: '800' },
});
