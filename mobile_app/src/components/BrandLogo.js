import React from 'react';
import { Image, StyleSheet } from 'react-native';

const logoSource = require('../../assets/unified-logo.png');

export default function BrandLogo({ size = 64, style }) {
  return (
    <Image
      source={logoSource}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Unified Messenger logo"
      style={[styles.logo, { width: size, height: size }, style]}
    />
  );
}

const styles = StyleSheet.create({
  logo: { backgroundColor: 'transparent' },
});
