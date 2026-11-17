import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';
import { isTaxOfficePaywall, TaxOfficeUpsellView } from '@/app/(tabs)/oficina';

type TaxCaseStage = 'new' | 'docs_pending' | 'in_review' | 'ready_to_file' | 'transmitted' | 'accepted' | 'rejected';

interface TaxCase {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceType: string;
  taxYear: number;
  agreedFee: number;
  stage: TaxCaseStage;
  bankProduct?: boolean;
  bankPartner?: string;
  refundAdvanceRequested?: boolean;
  documentsCount?: number;
  deadline?: string;
  notes?: string;
  assignedPreparer?: string;
}

const STAGE_OPTIONS: { id: TaxCaseStage; label: string }[] = [
  { id: 'new', label: 'Nuevo' },
  { id: 'docs_pending', label: 'Docs Pendientes' },
  { id: 'in_review', label: 'En Revisión' },
  { id: 'ready_to_file', label: 'Listo p/ Enviar' },
  { id: 'transmitted', label: 'Transmitido' },
  { id: 'accepted', label: 'Aceptado' },
  { id: 'rejected', label: 'Rechazado' },
];

const STAGE_LABEL: Record<TaxCaseStage, string> = {
  new: 'Nuevo',
  docs_pending: 'Docs Pendientes',
  in_review: 'En Revisión',
  ready_to_file: 'Listo p/ Enviar',
  transmitted: 'Transmitido',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
};

function formatMoney(amount?: number) {
  return `$${(amount || 0).toLocaleString('en-US')}`;
}

export default function OficinaCasosScreen() {
  const [cases, setCases] = useState<TaxCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceType, setServiceType] = useState('1040_personal');
  const [taxYear, setTaxYear] = useState(String(new Date().getFullYear()));
  const [agreedFee, setAgreedFee] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [stageTarget, setStageTarget] = useState<TaxCase | null>(null);
  const [updatingStage, setUpdatingStage] = useState(false);

  const fetchCases = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/tax-office/cases');
      const data = await res.json().catch(() => ({}));
      if (isTaxOfficePaywall(res.status, data.error)) {
        setPaywall(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los casos fiscales.');
      setPaywall(false);
      setCases(data.cases || []);
    } catch (err) {
      console.error('Error cargando casos de Oficina Virtual:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchCases().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCases]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCases();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!clientName.trim()) {
      setFormError('El nombre del cliente es obligatorio.');
      return;
    }
    if (!clientEmail.trim() && !clientPhone.trim()) {
      setFormError('Ingresa al menos un correo o teléfono de contacto.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const res = await hubFetch('/api/tax-office/cases', {
        method: 'POST',
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim() || undefined,
          clientPhone: clientPhone.trim() || undefined,
          serviceType: serviceType.trim() || '1040_personal',
          taxYear: Number(taxYear) || new Date().getFullYear(),
          agreedFee: Number(agreedFee) || 0,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear el caso.');
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setAgreedFee('');
      setNotes('');
      setFormOpen(false);
      await fetchCases();
    } catch (err) {
      console.error('Error creando caso fiscal:', err);
      setFormError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvanceStage = async (stage: TaxCaseStage) => {
    if (!stageTarget) return;
    setUpdatingStage(true);
    setError('');
    try {
      const res = await hubFetch(`/api/tax-office/cases/${encodeURIComponent(stageTarget.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la etapa.');
      setStageTarget(null);
      await fetchCases();
    } catch (err) {
      console.error('Error actualizando etapa fiscal:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setUpdatingStage(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Casos Fiscales</Text>
          {!paywall && <Text style={styles.subtitle}>{cases.length} casos registrados</Text>}
        </View>
        {!paywall && !loading && (
          <TouchableOpacity style={styles.newButton} onPress={() => setFormOpen(true)}>
            <Ionicons name="add" size={20} color={Colors.dark.background} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : paywall ? (
        <TaxOfficeUpsellView />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={cases}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay casos fiscales registrados.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => setStageTarget(item)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>{item.clientName}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{STAGE_LABEL[item.stage] || item.stage}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {item.serviceType} · Año {item.taxYear}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.feeText}>{formatMoney(item.agreedFee)}</Text>
                <Text style={styles.stageHint}>Toca para cambiar etapa</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Caso Fiscal</Text>
              <TouchableOpacity onPress={() => setFormOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.formBody}>
              <Text style={styles.label}>NOMBRE DEL CLIENTE</Text>
              <TextInput value={clientName} onChangeText={setClientName} placeholder="Nombre completo" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              <Text style={styles.label}>CORREO</Text>
              <TextInput value={clientEmail} onChangeText={setClientEmail} placeholder="cliente@correo.com" placeholderTextColor={Colors.dark.textSecondary} autoCapitalize="none" keyboardType="email-address" style={styles.input} />

              <Text style={styles.label}>TELÉFONO</Text>
              <TextInput value={clientPhone} onChangeText={setClientPhone} placeholder="+1 (555) 000-0000" placeholderTextColor={Colors.dark.textSecondary} keyboardType="phone-pad" style={styles.input} />

              <Text style={styles.label}>TIPO DE SERVICIO</Text>
              <TextInput value={serviceType} onChangeText={setServiceType} placeholder="1040_personal" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              <Text style={styles.label}>AÑO FISCAL</Text>
              <TextInput value={taxYear} onChangeText={setTaxYear} placeholder="2026" placeholderTextColor={Colors.dark.textSecondary} keyboardType="numeric" style={styles.input} />

              <Text style={styles.label}>HONORARIO ACORDADO (USD)</Text>
              <TextInput value={agreedFee} onChangeText={setAgreedFee} placeholder="350" placeholderTextColor={Colors.dark.textSecondary} keyboardType="numeric" style={styles.input} />

              <Text style={styles.label}>NOTAS</Text>
              <TextInput value={notes} onChangeText={setNotes} placeholder="Opcional" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              {!!formError && <Text style={styles.error}>{formError}</Text>}

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate} disabled={submitting} activeOpacity={0.85}>
                {submitting ? <ActivityIndicator color={Colors.dark.background} /> : <Text style={styles.submitText}>CREAR CASO</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={stageTarget !== null} animationType="slide" transparent onRequestClose={() => setStageTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>Etapa: {stageTarget?.clientName}</Text>
              <TouchableOpacity onPress={() => setStageTarget(null)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={STAGE_OPTIONS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  disabled={updatingStage}
                  onPress={() => handleAdvanceStage(item.id)}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {stageTarget?.stage === item.id && <Ionicons name="checkmark" size={18} color={Colors.dark.accent} />}
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
  newButton: { backgroundColor: Colors.dark.accent, borderRadius: 999, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  loader: { marginTop: 40 },
  error: { color: Colors.dark.danger, textAlign: 'center', marginTop: 16, fontSize: 12, paddingHorizontal: 20 },
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
  badge: { borderWidth: 1, borderColor: Colors.dark.accent, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: Colors.dark.accent, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cardMeta: { color: Colors.dark.textSecondary, fontSize: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  feeText: { color: Colors.dark.success, fontSize: 14, fontWeight: '700' },
  stageHint: { color: Colors.dark.accent, fontSize: 11, fontWeight: '600' },
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
  formBody: { padding: 16, paddingBottom: 32 },
  label: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 12 },
  input: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.dark.text,
    fontSize: 14,
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: { color: Colors.dark.background, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});
