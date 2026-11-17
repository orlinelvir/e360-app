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

interface AdminBrokerItem {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  tier: string;
  role: string;
  ghlConnected: boolean;
  packagePaid: boolean;
  referralEarnings: number;
  brokerId: string;
  totalClients: number;
  totalVolume: number;
  pendingSyncCount: number;
}

function formatMoney(amount?: number) {
  return `$${(amount || 0).toLocaleString('en-US')}`;
}

export default function AdminBrokersScreen() {
  const [brokers, setBrokers] = useState<AdminBrokerItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchBrokers = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/admin/brokers');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los brokers.');
      setBrokers(data.brokers || []);
    } catch (err) {
      console.error('Error cargando brokers admin:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchBrokers().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchBrokers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBrokers();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brokers;
    return brokers.filter(
      (b) =>
        (b.displayName || '').toLowerCase().includes(q) ||
        (b.email || '').toLowerCase().includes(q) ||
        (b.brokerId || '').toLowerCase().includes(q),
    );
  }, [brokers, search]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Roster de Brokers</Text>
          <Text style={styles.subtitle}>{filtered.length} de {brokers.length} brokers</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.dark.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, correo o ID..."
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
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No se encontraron brokers.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>{item.displayName}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.tier}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {item.brokerId ? `${item.brokerId} · ` : ''}
                {item.email}
                {item.phone ? ` · ${item.phone}` : ''}
              </Text>
              <View style={styles.tagsRow}>
                <Text style={[styles.tag, { color: item.packagePaid ? Colors.dark.success : Colors.dark.textSecondary }]}>
                  {item.packagePaid ? 'Paquete Pagado' : 'Pago Pendiente'}
                </Text>
                <Text style={[styles.tag, { color: item.ghlConnected ? Colors.dark.accent : Colors.dark.textSecondary }]}>
                  {item.ghlConnected ? 'GHL Conectado' : 'GHL Sin Conectar'}
                </Text>
                {item.pendingSyncCount > 0 && (
                  <Text style={[styles.tag, { color: Colors.dark.danger }]}>
                    {item.pendingSyncCount} sync pend.
                  </Text>
                )}
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.statText}>{item.totalClients} clientes</Text>
                <Text style={styles.volumeText}>Vol: {formatMoney(item.totalVolume)}</Text>
                {item.referralEarnings > 0 && (
                  <Text style={styles.refText}>Ref: {formatMoney(item.referralEarnings)}</Text>
                )}
              </View>
            </View>
          )}
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
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardName: { color: Colors.dark.text, fontSize: 14, fontWeight: '700', flex: 1 },
  badge: { borderWidth: 1, borderColor: Colors.dark.accent, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: Colors.dark.accent, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cardMeta: { color: Colors.dark.textSecondary, fontSize: 11 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
  tag: { fontSize: 11, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  statText: { color: Colors.dark.textSecondary, fontSize: 12, fontWeight: '600' },
  volumeText: { color: Colors.dark.success, fontSize: 13, fontWeight: '700' },
  refText: { color: Colors.dark.gold, fontSize: 11, fontWeight: '700' },
});
