import React from 'react';
        import { createNativeStackNavigator } from '@react-navigation/native-stack';
        import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import { useAuth } from '../context/AuthContext';

        const Stack = createNativeStackNavigator();

        export default function AuthNavigator() {
          const { biometricEnabled } = useAuth();
          return (
            <Stack.Navigator initialRouteName={biometricEnabled ? 'Login' : 'Onboarding'} screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            </Stack.Navigator>
          );
        }
      
