import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';
import { deriveReviewStatus, REVIEW_STATUS_COLOR, REVIEW_STATUS_LABEL } from '@/lib/caseStatus';
import { TICKET_STATUS_COLOR, TICKET_STATUS_LABEL, getTicketCategoryLabel } from '@/lib/ticketCategories';

interface AdminCaseItem {
  id: string;
  name: string;
  serviceName?: string;
  brokerName: string;
  amount?: number;
  status?: string;
  reviewStatus?: string;
}

interface AdminTicketItem {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  brokerName: string;
}

function formatMoney(amount?: number) {
  return `$${(amount || 0).toLocaleString('en-US')}`;
}

export default function AdminResumenScreen() {
  const [cases, setCases] = useState<AdminCaseItem[]>([]);
  const [tickets, setTickets] = useState<AdminTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setError('');
    try {
      const [casesRes, ticketsRes] = await Promise.all([
        hubFetch('/api/admin/cases'),
        hubFetch('/api/admin/tickets'),
      ]);
      const casesData = await casesRes.json();
      const ticketsData = await ticketsRes.json();
      if (!casesRes.ok) throw new Error(casesData.error || 'No se pudieron cargar los casos.');
      if (!ticketsRes.ok) throw new Error(ticketsData.error || 'No se pudieron cargar los tickets.');
      setCases((casesData.cases || []).slice(0, 15));
      setTickets((ticketsData.tickets || []).filter((t: AdminTicketItem) => t.status !== 'resolved'));
    } catch (err) {
      console.error('Error cargando resumen de Torre de Control:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchData().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Resumen</Text>
          <Text style={styles.subtitle}>Resumen operativo de todas las verticales.</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
        >
          {!!error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.sectionTitle}>TICKETS ABIERTOS ({tickets.length})</Text>
          {tickets.length === 0 ? (
            <Text style={styles.empty}>No hay tickets pendientes.</Text>
          ) : (
            tickets.slice(0, 10).map((t) => (
              <View key={t.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{t.subject}</Text>
                  <View style={[styles.badge, { borderColor: TICKET_STATUS_COLOR[t.status] }]}>
                    <Text style={[styles.badgeText, { color: TICKET_STATUS_COLOR[t.status] }]}>
                      {TICKET_STATUS_LABEL[t.status] || t.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardSubtext}>{t.brokerName} · {getTicketCategoryLabel(t.category)}</Text>
              </View>
            ))
          )}

          <Text style={[styles.sectionTitle, styles.sectionSpaced]}>CASOS RECIENTES ({cases.length})</Text>
          {cases.length === 0 ? (
            <Text style={styles.empty}>No hay casos todavía.</Text>
          ) : (
            cases.map((c) => {
              const reviewStatus = deriveReviewStatus(c.reviewStatus || c.status);
              return (
                <View key={c.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{c.name}</Text>
                    <View style={[styles.badge, { borderColor: REVIEW_STATUS_COLOR[reviewStatus] }]}>
                      <Text style={[styles.badgeText, { color: REVIEW_STATUS_COLOR[reviewStatus] }]}>
                        {REVIEW_STATUS_LABEL[reviewStatus]}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardSubtext}>{c.serviceName || 'Servicio'} · {c.brokerName}</Text>
                  {!!c.amount && <Text style={styles.cardAmount}>{formatMoney(c.amount)}</Text>}
                </View>
              );
            })
          )}
        </ScrollView>
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
  loader: { marginTop: 60 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  error: { color: Colors.dark.danger, fontSize: 12, marginBottom: 12 },
  sectionTitle: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  sectionSpaced: { marginTop: 20 },
  empty: { color: Colors.dark.textSecondary, fontSize: 12, marginBottom: 8 },
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 12,
    marginBottom: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { color: Colors.dark.text, fontSize: 13, fontWeight: '700', flex: 1 },
  cardSubtext: { color: Colors.dark.textSecondary, fontSize: 11, marginTop: 4 },
  cardAmount: { color: Colors.dark.success, fontSize: 12, fontWeight: '700', marginTop: 4 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
});
