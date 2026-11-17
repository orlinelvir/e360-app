import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';

interface FailedSyncLead {
  id: string;
  brokerId: string;
  brokerName: string;
  name: string;
  email: string;
  phone: string;
  serviceName: string;
  amount: number;
  syncStatus: string;
  createdAt: string;
}

function formatMoney(amount?: number) {
  return `$${(amount || 0).toLocaleString('en-US')}`;
}

export default function AdminSincronizacionScreen() {
  const [leads, setLeads] = useState<FailedSyncLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [retryingKey, setRetryingKey] = useState<string | null>(null);

  const fetchFailedSync = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/admin/failed-sync');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar la cola de sincronización.');
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Error cargando cola de sincronización:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchFailedSync().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchFailedSync]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFailedSync();
    setRefreshing(false);
  };

  // Contrato confirmado en app/api/admin/retry-sync/route.ts:
  // POST { brokerId, clientId } -> { success: boolean, syncStatus: "synced" | "failed" }
  const handleRetry = async (item: FailedSyncLead) => {
    const key = `${item.brokerId}-${item.id}`;
    setRetryingKey(key);
    setError('');
    try {
      const res = await hubFetch('/api/admin/retry-sync', {
        method: 'POST',
        body: JSON.stringify({ brokerId: item.brokerId, clientId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo reintentar la sincronización.');
      if (data.syncStatus === 'synced') {
        setLeads((prev) => prev.filter((l) => !(l.brokerId === item.brokerId && l.id === item.id)));
      } else {
        setError(`El reintento para "${item.name}" terminó con estado: ${data.syncStatus || 'failed'}.`);
      }
    } catch (err) {
      console.error('Error reintentando sync:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setRetryingKey(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Cola de Sincronización</Text>
          <Text style={styles.subtitle}>{leads.length} casos pendientes o con fallo</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error && leads.length === 0 ? (
        <Text style={styles.errorBanner}>{error}</Text>
      ) : (
        <>
          {!!error && <Text style={styles.errorBanner}>{error}</Text>}
          <FlatList
          data={leads}
          keyExtractor={(item) => `${item.brokerId}-${item.id}`}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay casos pendientes de sincronizar con GHL.</Text>}
          renderItem={({ item }) => {
            const key = `${item.brokerId}-${item.id}`;
            const isRetrying = retryingKey === key;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.syncStatus}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>
                  {item.serviceName} · Broker: {item.brokerName}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    activeOpacity={0.85}
                    disabled={retryingKey !== null}
                    onPress={() => handleRetry(item)}
                  >
                    {isRetrying ? (
                      <ActivityIndicator size="small" color={Colors.dark.background} />
                    ) : (
                      <>
                        <Ionicons name="refresh" size={14} color={Colors.dark.background} />
                        <Text style={styles.retryText}>Reintentar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  headerText: { flex: 1 },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
  errorBanner: { color: Colors.dark.danger, fontSize: 12, paddingHorizontal: 16, paddingBottom: 8 },
  loader: { marginTop: 40 },
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
  badge: { borderWidth: 1, borderColor: Colors.dark.danger, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: Colors.dark.danger, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cardMeta: { color: Colors.dark.textSecondary, fontSize: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  amount: { color: Colors.dark.success, fontSize: 13, fontWeight: '700' },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 96,
    backgroundColor: Colors.dark.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  retryText: { color: Colors.dark.background, fontSize: 11, fontWeight: '800' },
});
