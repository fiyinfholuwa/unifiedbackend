import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '@expo/vector-icons/Ionicons';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../context/ThemeContext';
import DashboardScreen from '../screens/main/DashboardScreen';
import InboxScreen from '../screens/main/InboxScreen';
import ConnectPlatformsScreen from '../screens/main/ConnectPlatformsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();

const icons = {
  Home: ['chatbubble-ellipses', 'chatbubble-ellipses-outline'],
  Analytics: ['bar-chart', 'bar-chart-outline'],
  Connect: ['add-circle', 'add-circle-outline'],
  Profile: ['person', 'person-outline'],
};

export default function MainTabNavigator() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const dockBottom = Math.max(insets.bottom, 12);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.secondaryText,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.card,
            bottom: dockBottom,
            shadowColor: theme.text,
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarIcon: ({ color, focused }) => {
          const [filledIcon, outlineIcon] = icons[route.name];

          return (
            <View
              style={[
                styles.iconWrap,
                focused && { backgroundColor: `${theme.tint}18` },
              ]}
            >
              <Icon
                name={focused ? filledIcon : outlineIcon}
                size={focused ? 22 : 21}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={InboxScreen} />
      <Tab.Screen name="Analytics" component={DashboardScreen} />
      <Tab.Screen name="Connect" component={ConnectPlatformsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 24,
    right: 24,
    height: 66,
    borderTopWidth: 0,
    borderRadius: 33,
    paddingTop: 7,
    paddingBottom: 7,
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 12,
    ...Platform.select({
      android: { overflow: 'hidden' },
    }),
  },
  tabBarItem: {
    height: 52,
    borderRadius: 26,
    paddingVertical: 0,
  },
  tabBarIcon: {
    marginTop: 0,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginTop: -2,
    marginBottom: 1,
  },
  iconWrap: {
    width: 46,
    height: 29,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
