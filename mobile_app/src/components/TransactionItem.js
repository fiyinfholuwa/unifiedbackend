import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const icons = { funding: 'add-circle-outline', subscription: 'card-outline', kyc: 'shield-checkmark-outline', account: 'business-outline', activity: 'flash-outline' };

export default function TransactionItem({ transaction, compact = false }) {
  const { theme } = useTheme();
  const date = new Date(transaction.timestamp);
  const amountColor = transaction.direction === 'credit' ? '#24A86B' : transaction.direction === 'debit' ? '#EF5B5B' : theme.secondaryText;
  return (
    <View style={[styles.row, compact && styles.compact]}>
      <View style={[styles.icon, { backgroundColor: theme.muted }]}><Icon name={icons[transaction.type] || 'flash-outline'} size={18} color={theme.tint} /></View>
      <View style={styles.info}><View style={styles.titleRow}><Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{transaction.title}</Text>{transaction.demo && <Text style={[styles.demo, { color: theme.tint, backgroundColor: `${theme.tint}14` }]}>DEMO</Text>}</View><Text style={[styles.date, { color: theme.secondaryText }]}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</Text></View>
      {transaction.amount > 0 && <Text style={[styles.amount, { color: amountColor }]}>{transaction.direction === 'credit' ? '+' : '−'}{transaction.amount}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({ row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingVertical: 9 }, compact: { minHeight: 56 }, icon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 }, info: { flex: 1 }, titleRow: { flexDirection: 'row', alignItems: 'center' }, title: { fontSize: 11.5, fontWeight: '800', flexShrink: 1 }, demo: { fontSize: 7, fontWeight: '900', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, marginLeft: 6 }, date: { fontSize: 9, marginTop: 3 }, amount: { fontSize: 12, fontWeight: '900', marginLeft: 8 } });
