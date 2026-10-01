import React from 'react';
        import { View, Text, StyleSheet } from 'react-native';
        import { platforms } from '../api/mockData';
        import Icon from '@expo/vector-icons/Ionicons';

        export default function PlatformBadge({ platformId }) {
          const platform = platforms.find(p => p.id === platformId);
          if (!platform) return null;

          return (
            <View style={[styles.badge, { backgroundColor: platform.color + '30' }]}>
              <Icon name={platform.icon} size={14} color={platform.color} />
              <Text style={[styles.label, { color: platform.color }]}>{platform.name}</Text>
            </View>
          );
        }

        const styles = StyleSheet.create({
          badge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 12,
            gap: 4,
          },
          label: { fontSize: 9, fontWeight: '700' },
        });
      
