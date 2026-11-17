import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';
import { deriveReviewStatus, REVIEW_STATUS_COLOR, REVIEW_STATUS_LABEL } from '@/lib/caseStatus';

interface AdminCaseItem {
  id: string;
  brokerId: string;
  brokerName: string;
  name: string;
  email?: string;
  phone?: string;
  serviceName?: string;
  amount?: number;
  estimatedCommission?: number;
  reviewStatus?: string;
  status?: string;
  createdAt?: string;
}

function formatMoney(amount?: number) {
  return `$${(amount || 0).toLocaleString('en-US')}`;
}

export default function AdminCasosScreen() {
  const [cases, setCases] = useState<AdminCaseItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchCases = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/admin/cases');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los casos.');
      setCases(data.cases || []);
    } catch (err) {
      console.error('Error cargando casos admin:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchCases().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCases]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCases();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.brokerName || '').toLowerCase().includes(q) ||
        (c.serviceName || '').toLowerCase().includes(q),
    );
  }, [cases, search]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Casos (Master Feed)</Text>
          <Text style={styles.subtitle}>{filtered.length} de {cases.length} casos</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.dark.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por cliente, broker o servicio..."
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.searchInput}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={Colors.dark.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => `${item.brokerId}-${item.id}`}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No se encontraron casos.</Text>}
          renderItem={({ item }) => {
            const status = deriveReviewStatus(item.reviewStatus || item.status);
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <View style={[styles.badge, { borderColor: REVIEW_STATUS_COLOR[status] }]}>
                    <Text style={[styles.badgeText, { color: REVIEW_STATUS_COLOR[status] }]}>
                      {REVIEW_STATUS_LABEL[status]}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardService}>{item.serviceName || 'Servicio'} · Broker: {item.brokerName}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardAmount}>{formatMoney(item.amount)}</Text>
                  {!!item.estimatedCommission && (
                    <Text style={styles.cardCommission}>Comisión est. {formatMoney(item.estimatedCommission)}</Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  headerText: { flex: 1 },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: Colors.dark.text, fontSize: 13 },
  loader: { marginTop: 40 },
  error: { color: Colors.dark.danger, textAlign: 'center', marginTop: 40, fontSize: 13, paddingHorizontal: 24 },
  empty: { color: Colors.dark.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardName: { color: Colors.dark.text, fontSize: 14, fontWeight: '700', flex: 1 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cardService: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cardAmount: { color: Colors.dark.success, fontSize: 13, fontWeight: '700' },
  cardCommission: { color: Colors.dark.accent, fontSize: 11 },
});
