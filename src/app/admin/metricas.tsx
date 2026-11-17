import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';

interface MetricsData {
  totalBrokers: number;
  connectedBrokers: number;
  totalLeads: number;
  totalVolume: number;
  estimatedCommissions: number;
  syncHealth: {
    synced: number;
    failed: number;
  };
  clusterStats: Record<string, { count: number; volume: number }>;
}

const CLUSTER_LABEL: Record<string, string> = {
  fondeo_rapido: 'Fondeo Rápido / MCA',
  real_estate: 'Bienes Raíces & Hipotecas',
  credit_repair: 'Reparación de Crédito',
  seguros: 'Seguros',
  corporativo: 'Corporativo & Otros',
};

function formatMoney(amount?: number) {
  return `$${(amount || 0).toLocaleString('en-US')}`;
}

export default function AdminMetricasScreen() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchMetrics = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/admin/metrics');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las métricas.');
      setMetrics(data.metrics || null);
    } catch (err) {
      console.error('Error cargando métricas admin:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchMetrics().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMetrics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMetrics();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Métricas Globales</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !metrics ? (
        <Text style={styles.empty}>No hay datos de métricas disponibles.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
        >
          <View style={styles.grid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>BROKERS TOTALES</Text>
              <Text style={styles.kpiValue}>{metrics.totalBrokers}</Text>
              <Text style={styles.kpiHint}>{metrics.connectedBrokers} con GHL conectado</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>SOLICITUDES</Text>
              <Text style={styles.kpiValue}>{metrics.totalLeads}</Text>
              <Text style={styles.kpiHint}>
                {metrics.syncHealth.synced} sync · {metrics.syncHealth.failed} pend.
              </Text>
            </View>
          </View>

          <View style={styles.grid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>VOLUMEN TOTAL</Text>
              <Text style={[styles.kpiValue, { color: Colors.dark.success }]}>{formatMoney(metrics.totalVolume)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>COMISIONES EST.</Text>
              <Text style={[styles.kpiValue, { color: Colors.dark.accent }]}>
                {formatMoney(metrics.estimatedCommissions)}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>DESGLOSE POR VERTICAL</Text>
          {Object.entries(metrics.clusterStats || {}).map(([cluster, stat]) => (
            <View key={cluster} style={styles.clusterCard}>
              <View style={styles.clusterHeader}>
                <Text style={styles.clusterName}>{CLUSTER_LABEL[cluster] || cluster}</Text>
                <Text style={styles.clusterCount}>{stat.count} casos</Text>
              </View>
              <Text style={styles.clusterVolume}>Volumen: {formatMoney(stat.volume)}</Text>
            </View>
          ))}
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
  empty: { color: Colors.dark.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 13 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  grid: { flexDirection: 'row', gap: 10 },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
    gap: 4,
  },
  kpiLabel: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  kpiValue: { color: Colors.dark.text, fontSize: 20, fontWeight: '900' },
  kpiHint: { color: Colors.dark.textSecondary, fontSize: 11 },
  sectionTitle: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 12 },
  clusterCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
    gap: 4,
  },
  clusterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clusterName: { color: Colors.dark.text, fontSize: 14, fontWeight: '700' },
  clusterCount: { color: Colors.dark.accent, fontSize: 12, fontWeight: '700' },
  clusterVolume: { color: Colors.dark.success, fontSize: 12, fontWeight: '600' },
});
