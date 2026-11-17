import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';
import { isTaxOfficePaywall, TaxOfficeUpsellView } from '@/components/tax-office-upsell';

interface TaxCommissionItem {
  id?: string;
  preparerName: string;
  preparerEmail: string;
  totalReturns: number;
  grossVolume: number;
  splitPercentage: number;
  e360FeeDeduction: number;
  netCommission: number;
  status: 'pending' | 'paid';
}

function formatMoney(amount?: number) {
  return `$${(amount || 0).toLocaleString('en-US')}`;
}

export default function OficinaComisionesScreen() {
  const [commissions, setCommissions] = useState<TaxCommissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [error, setError] = useState('');

  const fetchCommissions = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/tax-office/commissions');
      const data = await res.json().catch(() => ({}));
      if (isTaxOfficePaywall(res.status, data.error)) {
        setPaywall(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las comisiones.');
      setPaywall(false);
      setCommissions(data.commissions || []);
    } catch (err) {
      console.error('Error cargando comisiones de Oficina Virtual:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchCommissions().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCommissions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCommissions();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Comisiones</Text>
          {!paywall && <Text style={styles.subtitle}>{commissions.length} registros</Text>}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : paywall ? (
        <TaxOfficeUpsellView />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={commissions}
          keyExtractor={(item, idx) => item.id || `${item.preparerEmail}-${idx}`}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay comisiones registradas.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>{item.preparerName}</Text>
                <View
                  style={[
                    styles.badge,
                    { borderColor: item.status === 'paid' ? Colors.dark.success : Colors.dark.gold },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: item.status === 'paid' ? Colors.dark.success : Colors.dark.gold },
                    ]}
                  >
                    {item.status === 'paid' ? 'PAGADA' : 'PENDIENTE'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {item.preparerEmail} · {item.totalReturns} retornos · Split {item.splitPercentage}%
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.grossText}>Bruto: {formatMoney(item.grossVolume)}</Text>
                <Text style={styles.feeText}>Fee E360: -{formatMoney(item.e360FeeDeduction)}</Text>
                <Text style={styles.netText}>Neto: {formatMoney(item.netCommission)}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  headerText: { flex: 1 },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
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
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  cardMeta: { color: Colors.dark.textSecondary, fontSize: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  grossText: { color: Colors.dark.textSecondary, fontSize: 12 },
  feeText: { color: Colors.dark.danger, fontSize: 12 },
  netText: { color: Colors.dark.success, fontSize: 13, fontWeight: '800' },
});
