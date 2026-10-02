import React, { createContext, useState, useContext, useEffect } from 'react';
        import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../api/apiService';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

        const AuthContext = createContext();

        export const AuthProvider = ({ children }) => {
          const [user, setUser] = useState(null);
          const [loading, setLoading] = useState(true);
          const [biometricAvailable, setBiometricAvailable] = useState(false);
          const [biometricEnabled, setBiometricEnabled] = useState(false);
          const [biometricLabel, setBiometricLabel] = useState('Biometrics');

          useEffect(() => {
            const loadUser = async () => {
              try {
                const [hardware, enrolled, enabled, types] = await Promise.all([
                  LocalAuthentication.hasHardwareAsync(),
                  LocalAuthentication.isEnrolledAsync(),
                  SecureStore.getItemAsync('biometric_enabled'),
                  LocalAuthentication.supportedAuthenticationTypesAsync(),
                ]);
                setBiometricAvailable(hardware && enrolled);
                setBiometricEnabled(enabled === 'true');
                setBiometricLabel(types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) ? 'Face ID' : 'Fingerprint');
              } catch (error) {
                setBiometricAvailable(false);
                setBiometricEnabled(false);
              }

              const token = await AsyncStorage.getItem('@auth_token');
              if (token) {
                try {
                  const profile = await apiService.getUserProfile();
                  setUser(profile);
                } catch (error) {
                  setUser(null);
                }
              }
              setLoading(false);
            };
            loadUser().catch(() => setLoading(false));
          }, []);

          const login = async (email, password) => {
            const data = await apiService.login(email, password);
            await AsyncStorage.setItem('@auth_token', data.token);
            if (biometricEnabled) await SecureStore.setItemAsync('biometric_token', data.token);
            setUser(data.user);
            return data;
          };

          const register = async (name, email, password) => {
            const data = await apiService.register(name, email, password);
            await AsyncStorage.setItem('@auth_token', data.token);
            setUser(data.user);
            return data;
          };

          const logout = async () => {
            await AsyncStorage.removeItem('@auth_token');
            setUser(null);
          };

          const updateProfile = async updates => {
            const profile = await apiService.updateUserProfile(updates);
            setUser({ ...profile });
            return profile;
          };

          const deleteAccount = async () => {
            await Promise.all([
              apiService.deleteUserProfile(),
              AsyncStorage.multiRemove([
                '@auth_token',
                '@user_profile',
                '@connected_platforms',
                '@wallet_state',
                '@subscription_plan',
                '@message_usage',
              ]),
              SecureStore.deleteItemAsync('biometric_enabled'),
              SecureStore.deleteItemAsync('biometric_token'),
            ]);
            setBiometricEnabled(false);
            setUser(null);
          };

          const enableBiometrics = async () => {
            if (!biometricAvailable || !user) return false;
            const result = await LocalAuthentication.authenticateAsync({ promptMessage: `Enable ${biometricLabel}`, cancelLabel: 'Cancel', disableDeviceFallback: false });
            if (!result.success) return false;
            await SecureStore.setItemAsync('biometric_enabled', 'true');
            await SecureStore.setItemAsync('biometric_token', 'fake-jwt-token');
            setBiometricEnabled(true);
            return true;
          };

          const disableBiometrics = async () => {
            await SecureStore.deleteItemAsync('biometric_enabled');
            await SecureStore.deleteItemAsync('biometric_token');
            setBiometricEnabled(false);
          };

          const biometricLogin = async () => {
            const token = await SecureStore.getItemAsync('biometric_token');
            if (!token || !biometricAvailable || !biometricEnabled) return false;
            const result = await LocalAuthentication.authenticateAsync({ promptMessage: `Log in with ${biometricLabel}`, cancelLabel: 'Use password', disableDeviceFallback: false });
            if (!result.success) return false;
            const profile = await apiService.getUserProfile();
            await AsyncStorage.setItem('@auth_token', token);
            setUser(profile);
            return true;
          };

          return (
            <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, deleteAccount, biometricAvailable, biometricEnabled, biometricLabel, enableBiometrics, disableBiometrics, biometricLogin }}>
              {children}
            </AuthContext.Provider>
          );
        };

        export const useAuth = () => useContext(AuthContext);
      
