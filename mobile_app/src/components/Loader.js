import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import BrandLogo from './BrandLogo';

        export default function Loader() {
          const { theme } = useTheme();
          return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
              <BrandLogo size={112} />
              <Text style={[styles.name, { color: theme.text }]}>UNIFIED MESSENGER</Text>
              <ActivityIndicator style={styles.indicator} size="small" color={theme.tint} />
            </View>
          );
        }
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { marginTop: 8, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  indicator: { marginTop: 20 },
});
