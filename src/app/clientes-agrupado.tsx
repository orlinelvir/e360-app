import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';
import { deriveReviewStatus, REVIEW_STATUS_COLOR, REVIEW_STATUS_LABEL, ReviewStatus } from '@/lib/caseStatus';

// Misma forma que GET /api/broker/clients (ver index.tsx).
interface ClientItem {
  id: string;
  name: string;
  serviceName?: string;
  amount?: number | string;
  estimatedCommission?: number;
  status?: string;
}

interface StatusSection {
  status: ReviewStatus;
  data: ClientItem[];
}

// Orden de las secciones: lo que requiere acción del broker primero.
const SECTION_ORDER: ReviewStatus[] = ['pending_docs', 'in_review', 'approved', 'funded', 'rejected'];

function formatMoney(amount?: number | string) {
  return `$${(Number(amount) || 0).toLocaleString('en-US')}`;
}

export default function ClientesAgrupadoScreen() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchClients = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      const res = await hubFetch('/api/broker/clients');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar tus clientes.');
      setClients(data.clients || []);
    } catch (err) {
      console.error('Error cargando clientes agrupados:', err);
      setError(err instanceof Error ? err.message : 'No se pudieron cargar tus clientes.');
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchClients().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  };

  const sections = useMemo<StatusSection[]>(() => {
    const grouped = new Map<ReviewStatus, ClientItem[]>();
    for (const client of clients) {
      const status = deriveReviewStatus(client.status);
      grouped.set(status, [...(grouped.get(status) ?? []), client]);
    }
    return SECTION_ORDER.filter((status) => grouped.has(status)).map((status) => ({ status, data: grouped.get(status)! }));
  }, [clients]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Clientes por estado</Text>
          <Text style={styles.subtitle}>{clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>Todavía no tienes clientes sometidos.</Text>}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: REVIEW_STATUS_COLOR[section.status] }]} />
              <Text style={[styles.sectionTitle, { color: REVIEW_STATUS_COLOR[section.status] }]}>
                {REVIEW_STATUS_LABEL[section.status]}
              </Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item, section }) => (
            <View style={[styles.card, { borderLeftColor: REVIEW_STATUS_COLOR[section.status] }]}>
              <Text style={styles.cardName}>{item.name || 'Sin nombre'}</Text>
              <Text style={styles.cardService}>{item.serviceName || 'Servicio'}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardAmount}>{formatMoney(item.amount)}</Text>
                {!!item.estimatedCommission && (
                  <Text style={styles.cardCommission}>Comisión est. {formatMoney(item.estimatedCommission)}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  headerText: { flex: 1 },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
  loader: { marginTop: 40 },
  error: { color: Colors.dark.danger, textAlign: 'center', marginTop: 40, fontSize: 13 },
  empty: { color: Colors.dark.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  sectionCount: { color: Colors.dark.textSecondary, fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: Colors.dark.border,
    padding: 14,
    marginBottom: 10,
  },
  cardName: { color: Colors.dark.text, fontSize: 15, fontWeight: '700' },
  cardService: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cardAmount: { color: Colors.dark.success, fontSize: 14, fontWeight: '700' },
  cardCommission: { color: Colors.dark.accent, fontSize: 11 },
});
