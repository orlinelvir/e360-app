import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';
import { isTaxOfficePaywall, TaxOfficeUpsellView } from '@/app/(tabs)/oficina';

interface TaxCaseSummary {
  id: string;
  agreedFee?: number;
}

interface TaxInvoiceSummary {
  id: string;
  amount?: number;
  status?: string;
}

function formatMoney(amount?: number) {
  return `$${(amount || 0).toLocaleString('en-US')}`;
}

export default function OficinaDashboardScreen() {
  const [cases, setCases] = useState<TaxCaseSummary[]>([]);
  const [invoices, setInvoices] = useState<TaxInvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setError('');
    try {
      const [casesRes, invoicesRes] = await Promise.all([
        hubFetch('/api/tax-office/cases'),
        hubFetch('/api/tax-office/invoices'),
      ]);
      const casesData = await casesRes.json().catch(() => ({}));
      const invoicesData = await invoicesRes.json().catch(() => ({}));

      if (
        isTaxOfficePaywall(casesRes.status, casesData.error) ||
        isTaxOfficePaywall(invoicesRes.status, invoicesData.error)
      ) {
        setPaywall(true);
        return;
      }

      if (!casesRes.ok) throw new Error(casesData.error || 'No se pudieron cargar los casos.');
      if (!invoicesRes.ok) throw new Error(invoicesData.error || 'No se pudieron cargar las facturas.');

      setPaywall(false);
      setCases(casesData.cases || []);
      setInvoices(invoicesData.invoices || []);
    } catch (err) {
      console.error('Error cargando dashboard de Oficina Virtual:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchDashboard().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const kpis = useMemo(() => {
    const totalCases = cases.length;
    const totalVolume = cases.reduce((acc, c) => acc + (Number(c.agreedFee) || 0), 0);
    const totalBilled = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
    const pendingCollection = invoices
      .filter((inv) => inv.status === 'sent')
      .reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
    return { totalCases, totalVolume, totalBilled, pendingCollection };
  }, [cases, invoices]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Dashboard Oficina</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : paywall ? (
        <TaxOfficeUpsellView />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
        >
          <View style={styles.grid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL CASOS</Text>
              <Text style={styles.kpiValue}>{kpis.totalCases}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>VOLUMEN ACORDADO</Text>
              <Text style={[styles.kpiValue, { color: Colors.dark.accent }]}>{formatMoney(kpis.totalVolume)}</Text>
            </View>
          </View>

          <View style={styles.grid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>FACTURADO (PAGADO)</Text>
              <Text style={[styles.kpiValue, { color: Colors.dark.success }]}>{formatMoney(kpis.totalBilled)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>PENDIENTE DE COBRO</Text>
              <Text style={[styles.kpiValue, { color: Colors.dark.gold }]}>
                {formatMoney(kpis.pendingCollection)}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800', flex: 1 },
  loader: { marginTop: 40 },
  error: { color: Colors.dark.danger, textAlign: 'center', marginTop: 40, fontSize: 13, paddingHorizontal: 24 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  grid: { flexDirection: 'row', gap: 10 },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
    gap: 6,
  },
  kpiLabel: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  kpiValue: { color: Colors.dark.text, fontSize: 20, fontWeight: '900' },
});
