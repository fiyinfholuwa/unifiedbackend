import React from 'react';
        import { createNativeStackNavigator } from '@react-navigation/native-stack';
        import { useAuth } from '../context/AuthContext';
        import AuthNavigator from './AuthNavigator';
        import MainTabNavigator from './MainTabNavigator.js';
        import ChatDetailScreen from '../screens/main/ChatDetailScreen';
import ConnectPlatformsScreen from '../screens/main/ConnectPlatformsScreen';
import SubscriptionScreen from '../screens/main/SubscriptionScreen';
import InfoScreen from '../screens/main/InfoScreen';
import SupportScreen from '../screens/main/SupportScreen';
import { useTheme } from '../context/ThemeContext';
import KycScreen from '../screens/main/KycScreen';
import WalletScreen from '../screens/main/WalletScreen';
import TransactionsScreen from '../screens/main/TransactionsScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import Loader from '../components/Loader';

        const Stack = createNativeStackNavigator();

        export default function AppNavigator() {
          const { user, loading } = useAuth();
          const { theme } = useTheme();

          if (loading) return <Loader />;

          return (
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: theme.background },
                headerTintColor: theme.text,
                headerTitleStyle: { color: theme.text, fontSize: 16, fontWeight: '800' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: theme.background },
              }}
            >
              {!user ? (
                <Stack.Screen name="Auth" component={AuthNavigator} />
              ) : (
                <>
                  <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                  <Stack.Screen name="ConnectPlatforms" component={ConnectPlatformsScreen} options={{ headerShown: true, title: 'Connect Platforms' }} />
                  <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
                  <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ headerShown: true, title: 'Plans & billing' }} />
                  <Stack.Screen name="Info" component={InfoScreen} options={({ route }) => ({ headerShown: true, title: route.params?.type === 'faq' ? 'Frequently asked questions' : 'Terms & conditions' })} />
                  <Stack.Screen name="Support" component={SupportScreen} options={({ route }) => ({ headerShown: true, title: route.params?.mode === 'feedback' ? 'Send feedback' : 'Help desk' })} />
                  <Stack.Screen name="Kyc" component={KycScreen} options={{ headerShown: true, title: 'Identity verification' }} />
                  <Stack.Screen name="Wallet" component={WalletScreen} options={{ headerShown: true, title: 'Wallet & funding' }} />
                  <Stack.Screen name="Transactions" component={TransactionsScreen} options={{ headerShown: true, title: 'Transactions & activity' }} />
                  <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: 'Edit profile' }} />
                </>
              )}
            </Stack.Navigator>
          );
        }
      
