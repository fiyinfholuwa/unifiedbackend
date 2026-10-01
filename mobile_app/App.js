import React from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
        import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
        import AppNavigator from './src/navigation/AppNavigator';
        import { SubscriptionProvider } from './src/context/SubscriptionContext';
        import { WalletProvider } from './src/context/WalletContext';
import { AppAlertProvider } from './src/context/AppAlertContext';
import BrandLogo from './src/components/BrandLogo';

        function ThemedNavigation() {
          const { theme, isDark } = useTheme();
          const baseTheme = isDark ? DarkTheme : DefaultTheme;
          const navigationTheme = {
            ...baseTheme,
            colors: {
              ...baseTheme.colors,
              primary: theme.primary,
              background: theme.background,
              card: theme.card,
              text: theme.text,
              border: theme.border,
              notification: theme.tint,
            },
          };

          return (
            <>
              <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
              <NavigationContainer theme={navigationTheme}>
                <AppNavigator />
              </NavigationContainer>
            </>
          );
        }

        export default function App() {
          const [fontsLoaded] = useFonts({ Inter_400Regular });

          if (!fontsLoaded) return <View style={styles.startup}><BrandLogo size={112} /></View>;

          Text.defaultProps = Text.defaultProps || {};
          Text.defaultProps.style = [{ fontFamily: 'Inter_400Regular' }, Text.defaultProps.style];
          TextInput.defaultProps = TextInput.defaultProps || {};
          TextInput.defaultProps.style = [{ fontFamily: 'Inter_400Regular' }, TextInput.defaultProps.style];

          return (
            <ThemeProvider>
              <AppAlertProvider>
                <AuthProvider>
                  <WalletProvider>
                    <SubscriptionProvider>
                      <ThemedNavigation />
                    </SubscriptionProvider>
                  </WalletProvider>
                </AuthProvider>
              </AppAlertProvider>
            </ThemeProvider>
          );
        }

const styles = StyleSheet.create({
  startup: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F1FF' },
});
      
