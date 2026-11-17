import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  SectionList,
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
import { isTaxOfficePaywall, TaxOfficeUpsellView } from '@/components/tax-office-upsell';

interface TaxPipelineStage {
  id: string;
  name: string;
  order: number;
}

interface TaxPipeline {
  id: string;
  name: string;
  stages: TaxPipelineStage[];
  isDefault?: boolean;
}

interface TaxLead {
  id: string;
  pipelineId: string;
  stageId: string;
  name: string;
  email?: string;
  phone?: string;
  estimatedValue?: number;
  notes?: string;
}

function formatMoney(amount?: number) {
  return `$${(amount || 0).toLocaleString('en-US')}`;
}

export default function OficinaWorkflowScreen() {
  const [pipelines, setPipelines] = useState<TaxPipeline[]>([]);
  const [leads, setLeads] = useState<TaxLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [error, setError] = useState('');

  const [movingLead, setMovingLead] = useState<TaxLead | null>(null);

  const fetchWorkflow = useCallback(async () => {
    setError('');
    try {
      const [pipeRes, leadsRes] = await Promise.all([
        hubFetch('/api/tax-office/pipelines'),
        hubFetch('/api/tax-office/leads'),
      ]);
      const pipeData = await pipeRes.json().catch(() => ({}));
      const leadsData = await leadsRes.json().catch(() => ({}));

      if (
        isTaxOfficePaywall(pipeRes.status, pipeData.error) ||
        isTaxOfficePaywall(leadsRes.status, leadsData.error)
      ) {
        setPaywall(true);
        return;
      }

      if (!pipeRes.ok) throw new Error(pipeData.error || 'No se pudieron cargar los pipelines.');
      if (!leadsRes.ok) throw new Error(leadsData.error || 'No se pudieron cargar los leads.');

      setPaywall(false);
      setPipelines(pipeData.pipelines || []);
      setLeads(leadsData.leads || []);
    } catch (err) {
      console.error('Error cargando workflow de Oficina Virtual:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchWorkflow().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchWorkflow]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkflow();
    setRefreshing(false);
  };

  const activePipeline = useMemo(
    () => pipelines.find((p) => p.isDefault) || pipelines[0] || null,
    [pipelines],
  );

  const stages = useMemo(
    () => [...(activePipeline?.stages || [])].sort((a, b) => a.order - b.order),
    [activePipeline],
  );

  const sections = useMemo(() => {
    return stages.map((stage) => ({
      stage,
      data: leads.filter((l) => l.stageId === stage.id),
    }));
  }, [stages, leads]);

  const handleMoveStage = async (stageId: string) => {
    if (!movingLead) return;
    try {
      const res = await hubFetch(`/api/tax-office/leads/${encodeURIComponent(movingLead.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ stageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo mover el lead.');
      setMovingLead(null);
      await fetchWorkflow();
    } catch (err) {
      console.error('Error moviendo lead de etapa:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Workflow</Text>
          {!paywall && (
            <Text style={styles.subtitle}>
              {activePipeline ? activePipeline.name : 'Pipeline'} · {leads.length} prospectos
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : paywall ? (
        <TaxOfficeUpsellView />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay etapas ni prospectos configurados.</Text>}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.stage.name}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                {item.estimatedValue !== undefined && (
                  <Text style={styles.cardValue}>{formatMoney(item.estimatedValue)}</Text>
                )}
              </View>
              {!!(item.email || item.phone) && (
                <Text style={styles.cardMeta}>{[item.email, item.phone].filter(Boolean).join(' · ')}</Text>
              )}
              <TouchableOpacity
                style={styles.moveButton}
                activeOpacity={0.85}
                onPress={() => setMovingLead(item)}
              >
                <Ionicons name="swap-horizontal" size={14} color={Colors.dark.accent} />
                <Text style={styles.moveButtonText}>Mover a...</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={movingLead !== null} animationType="slide" transparent onRequestClose={() => setMovingLead(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>Mover: {movingLead?.name}</Text>
              <TouchableOpacity onPress={() => setMovingLead(null)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={stages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleMoveStage(item.id)}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {movingLead?.stageId === item.id && <Ionicons name="checkmark" size={18} color={Colors.dark.accent} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  error: { color: Colors.dark.danger, textAlign: 'center', marginTop: 16, fontSize: 12, paddingHorizontal: 20 },
  empty: { color: Colors.dark.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  sectionTitle: { color: Colors.dark.accent, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCount: { color: Colors.dark.textSecondary, fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardName: { color: Colors.dark.text, fontSize: 14, fontWeight: '700', flex: 1 },
  cardValue: { color: Colors.dark.success, fontSize: 13, fontWeight: '700' },
  cardMeta: { color: Colors.dark.textSecondary, fontSize: 12 },
  moveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 2,
  },
  moveButtonText: { color: Colors.dark.accent, fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.dark.backgroundElement, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalTitle: { color: Colors.dark.text, fontSize: 15, fontWeight: '700', flex: 1 },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalItemText: { color: Colors.dark.text, fontSize: 13 },
});
