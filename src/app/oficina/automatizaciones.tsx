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
import { isTaxOfficePaywall, TaxOfficeUpsellView } from '@/app/(tabs)/oficina';

type TaxAutomationStatus = 'active' | 'draft' | 'paused';

interface TaxAutomation {
  id: string;
  name: string;
  status: TaxAutomationStatus;
  triggerType: string;
  actionType: string;
}

export default function OficinaAutomatizacionesScreen() {
  const [automations, setAutomations] = useState<TaxAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchAutomations = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/tax-office/automations');
      const data = await res.json().catch(() => ({}));
      if (isTaxOfficePaywall(res.status, data.error)) {
        setPaywall(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las automatizaciones.');
      setPaywall(false);
      setAutomations(data.automations || []);
    } catch (err) {
      console.error('Error cargando automatizaciones de Oficina Virtual:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchAutomations().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAutomations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAutomations();
    setRefreshing(false);
  };

  const handleToggleStatus = async (item: TaxAutomation) => {
    const nextStatus: TaxAutomationStatus = item.status === 'active' ? 'paused' : 'active';
    setTogglingId(item.id);
    setError('');
    try {
      const res = await hubFetch(`/api/tax-office/automations/${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la automatización.');
      setAutomations((prev) => prev.map((a) => (a.id === item.id ? { ...a, status: nextStatus } : a)));
    } catch (err) {
      console.error('Error cambiando estado de automatización:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Automatizaciones</Text>
          {!paywall && <Text style={styles.subtitle}>{automations.length} reglas</Text>}
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
          data={automations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No tienes automatizaciones configuradas.</Text>}
          renderItem={({ item }) => {
            const isActive = item.status === 'active';
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <View
                    style={[
                      styles.badge,
                      { borderColor: isActive ? Colors.dark.success : Colors.dark.textSecondary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: isActive ? Colors.dark.success : Colors.dark.textSecondary },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>
                  Disparador: {item.triggerType} → Acción: {item.actionType}
                </Text>
                <TouchableOpacity
                  style={styles.toggleButton}
                  activeOpacity={0.85}
                  disabled={togglingId === item.id}
                  onPress={() => handleToggleStatus(item)}
                >
                  {togglingId === item.id ? (
                    <ActivityIndicator size="small" color={Colors.dark.accent} />
                  ) : (
                    <>
                      <Ionicons
                        name={isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                        size={16}
                        color={Colors.dark.accent}
                      />
                      <Text style={styles.toggleText}>{isActive ? 'Pausar' : 'Activar'}</Text>
                    </>
                  )}
                </TouchableOpacity>
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
  badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cardMeta: { color: Colors.dark.textSecondary, fontSize: 12 },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  toggleText: { color: Colors.dark.accent, fontSize: 11, fontWeight: '700' },
});
