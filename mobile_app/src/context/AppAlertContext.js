import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from './ThemeContext';

const AppAlertContext = createContext(null);

export function AppAlertProvider({ children }) {
  const { theme } = useTheme();
  const [alertState, setAlertState] = useState(null);

  const dismiss = useCallback(() => setAlertState(null), []);

  const alert = useCallback((title, message, buttons, options = {}) => {
    const normalizedButtons = buttons?.length ? buttons : [{ text: 'OK' }];
    setAlertState({
      title,
      message,
      buttons: normalizedButtons,
      icon: options.icon || 'notifications-outline',
      iconColor: options.iconColor || theme.primary,
      dismissible: options.dismissible ?? Boolean(normalizedButtons.find(button => button.style === 'cancel')),
    });
  }, [theme.primary]);

  const handleButton = button => {
    dismiss();
    button.onPress?.();
  };

  const cancelButton = alertState?.buttons.find(button => button.style === 'cancel');
  const close = () => {
    if (!alertState?.dismissible) return;
    dismiss();
    cancelButton?.onPress?.();
  };

  const api = useMemo(() => ({ alert, dismiss }), [alert, dismiss]);

  return (
    <AppAlertContext.Provider value={api}>
      {children}
      <Modal
        visible={Boolean(alertState)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <View style={[styles.dialog, { backgroundColor: theme.card, borderColor: theme.border }]}> 
            {alertState?.dismissible && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close alert"
                style={[styles.closeButton, { backgroundColor: theme.muted }]}
                onPress={close}
              >
                <Icon name="close" size={18} color={theme.secondaryText} />
              </TouchableOpacity>
            )}
            <View style={[styles.icon, { backgroundColor: `${alertState?.iconColor || theme.primary}18` }]}> 
              <Icon name={alertState?.icon || 'notifications-outline'} size={28} color={alertState?.iconColor || theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{alertState?.title}</Text>
            {Boolean(alertState?.message) && (
              <Text style={[styles.message, { color: theme.secondaryText }]}>{alertState.message}</Text>
            )}
            <View style={[styles.actions, alertState?.buttons.length > 2 && styles.stackedActions]}>
              {alertState?.buttons.map((button, index) => {
                const isCancel = button.style === 'cancel';
                const isDestructive = button.style === 'destructive';
                const buttonColor = isDestructive ? '#EF5B5B' : theme.primary;
                return (
                  <TouchableOpacity
                    key={`${button.text || 'OK'}-${index}`}
                    accessibilityRole="button"
                    accessibilityLabel={button.text || 'OK'}
                    style={[
                      styles.button,
                      alertState.buttons.length > 2 && styles.stackedButton,
                      { backgroundColor: isCancel ? theme.muted : buttonColor, borderColor: isCancel ? theme.border : buttonColor },
                    ]}
                    activeOpacity={0.78}
                    onPress={() => handleButton(button)}
                  >
                    <Text style={[styles.buttonText, { color: isCancel ? theme.text : '#fff' }]}>{button.text || 'OK'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AppAlertContext.Provider>
  );
}

export function useAppAlert() {
  const context = useContext(AppAlertContext);
  if (!context) throw new Error('useAppAlert must be used inside AppAlertProvider');
  return context;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(7, 5, 18, 0.72)' },
  dialog: { width: '100%', maxWidth: 390, alignSelf: 'center', alignItems: 'center', borderRadius: 26, borderWidth: 1, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.3, shadowRadius: 28, elevation: 20 },
  closeButton: { position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  icon: { width: 62, height: 62, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 19, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  message: { maxWidth: 300, fontSize: 12.5, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  actions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 21 },
  stackedActions: { flexDirection: 'column' },
  button: { flex: 1, minHeight: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  stackedButton: { flex: 0, width: '100%' },
  buttonText: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
});
