import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';

interface StaffActivityItem {
  uid: string;
  name: string;
  email: string;
  role: string;
  caseNotes: number;
  statusChanges: number;
  ticketReplies: number;
}

interface StaleCaseItem {
  brokerId: string;
  clientId: string;
  name: string;
  ageDays: number;
}

interface BacklogCluster {
  pendingDocs: number;
  inReview: number;
  staleCases: StaleCaseItem[];
}

const WINDOW_OPTIONS = [7, 30, 90] as const;

export default function AdminActividadScreen() {
  const [days, setDays] = useState<7 | 30 | 90>(7);
  const [staff, setStaff] = useState<StaffActivityItem[]>([]);
  const [backlogByCluster, setBacklogByCluster] = useState<Record<string, BacklogCluster>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchActivity = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch(`/api/admin/staff-activity?days=${days}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar la actividad del staff.');
      setStaff(data.staff || []);
      setBacklogByCluster(data.backlogByCluster || {});
    } catch (err) {
      console.error('Error cargando actividad del staff:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [days]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchActivity().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchActivity]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActivity();
    setRefreshing(false);
  };

  const clusterEntries = Object.entries(backlogByCluster);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Actividad del Staff</Text>
      </View>

      <View style={styles.chipsRow}>
        {WINDOW_OPTIONS.map((w) => {
          const active = days === w;
          return (
            <TouchableOpacity
              key={w}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setDays(w)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>Últimos {w} días</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
        >
          <Text style={styles.sectionTitle}>ACCIONES POR MIEMBRO ({staff.length})</Text>
          {staff.length === 0 ? (
            <Text style={styles.empty}>No hay miembros de staff registrados.</Text>
          ) : (
            staff.map((m) => (
              <View key={m.uid} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName} numberOfLines={1}>{m.name}</Text>
                  <Text style={styles.roleTag}>{m.role}</Text>
                </View>
                <Text style={styles.cardEmail}>{m.email}</Text>
                <View style={styles.metricsRow}>
                  <Text style={styles.metricItem}>Notas: {m.caseNotes}</Text>
                  <Text style={styles.metricItem}>Estados: {m.statusChanges}</Text>
                  <Text style={styles.metricItem}>Tickets: {m.ticketReplies}</Text>
                </View>
              </View>
            ))
          )}

          <Text style={styles.sectionTitle}>BACKLOG POR VERTICAL</Text>
          {clusterEntries.length === 0 ? (
            <Text style={styles.empty}>No hay casos pendientes en ninguna vertical.</Text>
          ) : (
            clusterEntries.map(([cluster, b]) => (
              <View key={cluster} style={styles.card}>
                <Text style={styles.cardName}>{cluster}</Text>
                <Text style={styles.cardEmail}>
                  Pendientes de docs: {b.pendingDocs} · En revisión: {b.inReview}
                </Text>
                {b.staleCases.length > 0 && (
                  <View style={styles.staleList}>
                    {b.staleCases.map((sc) => (
                      <Text key={`${sc.brokerId}-${sc.clientId}`} style={styles.staleItem}>
                        • {sc.name} ({sc.ageDays}d en revisión)
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800', flex: 1 },
  chipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  chipText: { color: Colors.dark.textSecondary, fontSize: 11, fontWeight: '700' },
  chipTextActive: { color: Colors.dark.background, fontWeight: '800' },
  loader: { marginTop: 40 },
  error: { color: Colors.dark.danger, textAlign: 'center', marginTop: 40, fontSize: 13, paddingHorizontal: 24 },
  empty: { color: Colors.dark.textSecondary, fontSize: 12, marginBottom: 8 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  sectionTitle: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 8 },
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
    gap: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardName: { color: Colors.dark.text, fontSize: 14, fontWeight: '700', flex: 1 },
  roleTag: { color: Colors.dark.accent, fontSize: 11, fontWeight: '700' },
  cardEmail: { color: Colors.dark.textSecondary, fontSize: 12 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  metricItem: { color: Colors.dark.text, fontSize: 12, fontWeight: '700' },
  staleList: { marginTop: 4, gap: 2 },
  staleItem: { color: Colors.dark.gold, fontSize: 11 },
});
