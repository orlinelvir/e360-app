import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

import { useAuth } from '@/context/AuthContext';
import { db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { deriveReviewStatus, REVIEW_STATUS_COLOR, REVIEW_STATUS_LABEL } from '@/lib/caseStatus';

interface ClientItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  serviceName?: string;
  amount?: number;
  estimatedCommission?: number;
  status?: string;
  createdAt?: string;
}

function formatMoney(amount?: number) {
  return `$${(amount || 0).toLocaleString('en-US')}`;
}

export default function MisClientesScreen() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchClients = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      const q = query(collection(db, 'brokers', user.uid, 'clients'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClientItem)));
    } catch (err) {
      console.error('Error cargando Mis Clientes:', err);
      setError('No se pudieron cargar tus clientes.');
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Clientes</Text>
        <Text style={styles.subtitle}>{clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>Todavía no tienes clientes sometidos.</Text>}
          renderItem={({ item }) => {
            const reviewStatus = deriveReviewStatus(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{item.name || 'Sin nombre'}</Text>
                  <View style={[styles.badge, { borderColor: REVIEW_STATUS_COLOR[reviewStatus] }]}>
                    <Text style={[styles.badgeText, { color: REVIEW_STATUS_COLOR[reviewStatus] }]}>
                      {REVIEW_STATUS_LABEL[reviewStatus]}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardService}>{item.serviceName || 'Servicio'}</Text>
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
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { color: Colors.dark.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
  loader: { marginTop: 40 },
  error: { color: Colors.dark.danger, textAlign: 'center', marginTop: 40, fontSize: 13 },
  empty: { color: Colors.dark.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardName: { color: Colors.dark.text, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cardService: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cardAmount: { color: Colors.dark.success, fontSize: 14, fontWeight: '700' },
  cardCommission: { color: Colors.dark.accent, fontSize: 11 },
});
