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
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';
import { TICKET_STATUS_COLOR, TICKET_STATUS_LABEL, getTicketCategoryLabel } from '@/lib/ticketCategories';

type TicketStatus = 'open' | 'in_progress' | 'resolved';

interface AdminTicketItem {
  id: string;
  brokerId: string;
  brokerName: string;
  subject: string;
  category: string;
  priority?: string;
  status: TicketStatus;
  description: string;
  attachmentUrl?: string;
  createdAt?: string;
}

const STATUS_OPTIONS: TicketStatus[] = ['open', 'in_progress', 'resolved'];

export default function AdminTicketsScreen() {
  const [tickets, setTickets] = useState<AdminTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/admin/tickets');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los tickets.');
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error cargando tickets admin:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchTickets().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTickets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (item: AdminTicketItem, nextStatus: TicketStatus) => {
    if (item.status === nextStatus) return;
    setUpdatingId(item.id);
    setError('');
    try {
      const res = await hubFetch('/api/admin/tickets', {
        method: 'PATCH',
        body: JSON.stringify({ brokerId: item.brokerId, ticketId: item.id, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el estado del ticket.');
      setTickets((prev) =>
        prev.map((t) => (t.id === item.id && t.brokerId === item.brokerId ? { ...t, status: nextStatus } : t)),
      );
    } catch (err) {
      console.error('Error actualizando estado de ticket:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Tickets de Brokers</Text>
          <Text style={styles.subtitle}>{tickets.length} tickets registrados</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error && tickets.length === 0 ? (
        <Text style={styles.errorBanner}>{error}</Text>
      ) : (
        <>
          {!!error && <Text style={styles.errorBanner}>{error}</Text>}
          <FlatList
          data={tickets}
          keyExtractor={(item) => `${item.brokerId}-${item.id}`}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay tickets registrados.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardSubject} numberOfLines={1}>{item.subject}</Text>
                <View style={[styles.badge, { borderColor: TICKET_STATUS_COLOR[item.status] }]}>
                  <Text style={[styles.badgeText, { color: TICKET_STATUS_COLOR[item.status] }]}>
                    {TICKET_STATUS_LABEL[item.status] || item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardMeta}>
                {item.brokerName} · {getTicketCategoryLabel(item.category)}
              </Text>
              <Text style={styles.cardDescription}>{item.description}</Text>

              {!!item.attachmentUrl && (
                <TouchableOpacity
                  style={styles.attachmentButton}
                  activeOpacity={0.85}
                  onPress={() => WebBrowser.openBrowserAsync(item.attachmentUrl!)}
                >
                  <Ionicons name="attach" size={16} color={Colors.dark.accent} />
                  <Text style={styles.attachmentText}>Ver archivo adjunto</Text>
                </TouchableOpacity>
              )}

              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((st) => {
                  const active = item.status === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[styles.statusChip, active && styles.statusChipActive]}
                      disabled={updatingId === item.id || active}
                      onPress={() => handleUpdateStatus(item, st)}
                    >
                      <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>
                        {TICKET_STATUS_LABEL[st]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
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
  cardSubject: { color: Colors.dark.text, fontSize: 14, fontWeight: '700', flex: 1 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cardMeta: { color: Colors.dark.accent, fontSize: 11, fontWeight: '600' },
  cardDescription: { color: Colors.dark.textSecondary, fontSize: 12, lineHeight: 18 },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  attachmentText: { color: Colors.dark.accent, fontSize: 12, fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  statusChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statusChipActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  statusChipText: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700' },
  statusChipTextActive: { color: Colors.dark.background, fontWeight: '800' },
});
