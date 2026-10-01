import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

export default function ConfirmationModal({
  visible,
  title,
  message,
  icon = 'alert-outline',
  iconColor = '#F26B5E',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
  note,
}) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={loading ? undefined : onCancel} />

        <View style={[styles.dialog, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.muted }]}
            onPress={onCancel}
            disabled={loading}
            accessibilityLabel="Close confirmation"
          >
            <Icon name="close" size={18} color={theme.secondaryText} />
          </TouchableOpacity>

          <View style={[styles.iconHalo, { backgroundColor: `${iconColor}16` }]}> 
            <View style={[styles.iconCircle, { backgroundColor: `${iconColor}24` }]}> 
              <Icon name={icon} size={28} color={iconColor} />
            </View>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.secondaryText }]}>{message}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.muted, borderColor: theme.border }]}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.75}
            >
              <Text style={[styles.cancelText, { color: theme.text }]}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton, { backgroundColor: iconColor, borderColor: iconColor }]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.75}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="link-outline" size={16} color="#fff" />
                  <Text style={styles.confirmText}>{confirmLabel}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {Boolean(note) && <View style={styles.safetyNote}>
            <Icon name="information-circle-outline" size={14} color={theme.secondaryText} />
            <Text style={[styles.safetyText, { color: theme.secondaryText }]}>{note}</Text>
          </View>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(7, 12, 25, 0.68)' },
  dialog: { width: '100%', maxWidth: 390, alignSelf: 'center', alignItems: 'center', borderRadius: 26, borderWidth: 1, paddingHorizontal: 20, paddingTop: 26, paddingBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.28, shadowRadius: 28, elevation: 18 },
  closeButton: { position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  iconHalo: { width: 78, height: 78, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconCircle: { width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3, textAlign: 'center' },
  message: { maxWidth: 290, fontSize: 12.5, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  actions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 22 },
  actionButton: { flex: 1, height: 44, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  confirmButton: { shadowColor: '#C4493D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 7, elevation: 3 },
  cancelText: { fontSize: 12, fontWeight: '800' },
  confirmText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  safetyNote: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14 },
  safetyText: { fontSize: 10.5 },
});
