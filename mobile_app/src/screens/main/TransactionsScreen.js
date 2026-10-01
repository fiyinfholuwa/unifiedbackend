import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useWallet } from '../../context/WalletContext';
import TransactionItem from '../../components/TransactionItem';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'credit', label: 'Money in' },
  { id: 'debit', label: 'Money out' },
  { id: 'subscription', label: 'Plans' },
  { id: 'activity', label: 'Account activity' },
];

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const { transactions } = useWallet();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    return transactions.filter(item => {
      const matchesSearch = !search
        || item.title.toLowerCase().includes(search)
        || item.type.toLowerCase().includes(search)
        || String(item.amount || '').includes(search);
      const matchesFilter = filter === 'all'
        || item.direction === filter
        || (filter === 'subscription' && item.type === 'subscription')
        || (filter === 'activity' && !['funding', 'subscription'].includes(item.type));
      return matchesSearch && matchesFilter;
    });
  }, [filter, query, transactions]);

  const totals = useMemo(() => transactions.reduce((summary, item) => {
    if (item.direction === 'credit') summary.in += Number(item.amount || 0);
    if (item.direction === 'debit') summary.out += Number(item.amount || 0);
    return summary;
  }, { in: 0, out: 0 }), [transactions]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['bottom']}>
      <View style={styles.toolbar}>
        <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Icon name="search-outline" size={18} color={theme.secondaryText} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Search transactions"
            placeholderTextColor={theme.secondaryText}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}><Icon name="close-circle" size={18} color={theme.secondaryText} /></TouchableOpacity>}
        </View>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: filter === 'all' ? theme.card : theme.primary, borderColor: filter === 'all' ? theme.border : theme.primary }]} onPress={() => setFilterOpen(true)}>
          <Icon name="options-outline" size={19} color={filter === 'all' ? theme.text : '#fff'} />
          {filter !== 'all' && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      <View style={[styles.summary, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.summaryItem}><View style={[styles.summaryIcon, { backgroundColor: '#24A86B18' }]}><Icon name="arrow-down-outline" size={16} color="#24A86B" /></View><Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Money in</Text><Text style={[styles.summaryValue, { color: '#24A86B' }]}>+{totals.in.toLocaleString()}</Text></View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryItem}><View style={[styles.summaryIcon, { backgroundColor: '#EF5B5B18' }]}><Icon name="arrow-up-outline" size={16} color="#EF5B5B" /></View><Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Money out</Text><Text style={[styles.summaryValue, { color: '#EF5B5B' }]}>−{totals.out.toLocaleString()}</Text></View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryItem}><View style={[styles.summaryIcon, { backgroundColor: theme.muted }]}><Icon name="swap-vertical-outline" size={16} color={theme.tint} /></View><Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Net activity</Text><Text style={[styles.summaryValue, { color: theme.text }]}>{(totals.in - totals.out).toLocaleString()}</Text></View>
      </View>

      <View style={styles.resultRow}><View><Text style={[styles.resultTitle, { color: theme.text }]}>Activity</Text>{filter !== 'all' && <Text style={[styles.activeFilter, { color: theme.tint }]}>{filters.find(item => item.id === filter)?.label}</Text>}</View><Text style={[styles.resultCount, { color: theme.secondaryText }]}>{results.length} result{results.length === 1 ? '' : 's'}</Text></View>

      {results.length ? (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          contentContainerStyle={[styles.list, { backgroundColor: theme.card, borderColor: theme.border }]}
          ItemSeparatorComponent={() => <View style={[styles.divider, { backgroundColor: theme.border }]} />}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.muted }]}><Icon name={transactions.length ? 'search-outline' : 'receipt-outline'} size={27} color={theme.tint} /></View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>{transactions.length ? 'No matching activity' : 'No transactions yet'}</Text>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>{transactions.length ? 'Try another search term or transaction filter.' : 'Your wallet deposits, plan payments, and account activity will appear here.'}</Text>
          {transactions.length > 0 && <TouchableOpacity onPress={() => { setQuery(''); setFilter('all'); }}><Text style={[styles.clearFilters, { color: theme.tint }]}>Clear filters</Text></TouchableOpacity>}
        </View>
      )}

      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFilterOpen(false)} />
          <View style={[styles.filterDialog, { backgroundColor: theme.card, borderColor: theme.border }]}> 
            <View style={styles.dialogHeader}><View><Text style={[styles.dialogTitle, { color: theme.text }]}>Filter activity</Text><Text style={[styles.dialogSub, { color: theme.secondaryText }]}>Choose one transaction type</Text></View><TouchableOpacity style={[styles.close, { backgroundColor: theme.muted }]} onPress={() => setFilterOpen(false)}><Icon name="close" size={18} color={theme.secondaryText} /></TouchableOpacity></View>
            {filters.map(item => {
              const active = filter === item.id;
              return <TouchableOpacity key={item.id} style={[styles.option, { borderColor: theme.border }]} onPress={() => { setFilter(item.id); setFilterOpen(false); }}><View style={[styles.radio, { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : 'transparent' }]}>{active && <Icon name="checkmark" size={13} color="#fff" />}</View><Text style={[styles.optionText, { color: theme.text }]}>{item.label}</Text>{item.id === 'credit' && <Icon name="arrow-down" size={16} color="#24A86B" />}{item.id === 'debit' && <Icon name="arrow-up" size={16} color="#EF5B5B" />}</TouchableOpacity>;
            })}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 18, paddingTop: 12 },
  toolbar: { flexDirection: 'row', gap: 8, marginBottom: 13 }, search: { flex: 1, height: 44, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  input: { flex: 1, height: '100%', fontSize: 12.5, marginLeft: 8 },
  filterButton: { width: 44, height: 44, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, filterBadge: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFCA62', right: 7, top: 7, borderWidth: 1, borderColor: '#fff' },
  summary: { minHeight: 92, borderWidth: 1, borderRadius: 18, padding: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 }, summaryItem: { flex: 1, alignItems: 'center' }, summaryIcon: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, summaryLabel: { fontSize: 8.5, marginTop: 5 }, summaryValue: { fontSize: 12, fontWeight: '900', marginTop: 2 }, summaryDivider: { width: StyleSheet.hairlineWidth, height: 48 }, resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }, resultTitle: { fontSize: 14, fontWeight: '800' }, activeFilter: { fontSize: 9.5, fontWeight: '800', marginTop: 2 }, resultCount: { fontSize: 9.5, fontWeight: '700' },
  list: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 13, paddingBottom: 2 }, divider: { height: StyleSheet.hairlineWidth, marginLeft: 47 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 70 }, emptyIcon: { width: 60, height: 60, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { fontSize: 15, fontWeight: '800', marginTop: 12 }, emptyText: { fontSize: 10.5, lineHeight: 16, textAlign: 'center', marginTop: 4 }, clearFilters: { fontSize: 10.5, fontWeight: '800', marginTop: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(7,12,25,.65)', justifyContent: 'flex-end' }, filterDialog: { borderTopLeftRadius: 25, borderTopRightRadius: 25, borderWidth: 1, padding: 18, paddingBottom: 28 }, dialogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, dialogTitle: { fontSize: 17, fontWeight: '800' }, dialogSub: { fontSize: 10, marginTop: 3 }, close: { width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, option: { height: 50, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center' }, radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, optionText: { flex: 1, fontSize: 12, fontWeight: '800' },
});
