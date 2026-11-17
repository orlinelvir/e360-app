import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
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

interface PayrollRow {
  staffUid: string;
  staffName: string;
  periodStart: string;
  periodEnd: string;
  hoursLogged: number;
  hourlyRate: number;
  expectedPay: number;
  actualPaid?: number;
  paidAt?: string;
  notes?: string;
}

function defaultPeriod(): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  const d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const start = d.toISOString().split('T')[0];
  return { start, end };
}

function formatMoney(val?: number) {
  return `$${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminNominaScreen() {
  const initial = defaultPeriod();
  const [periodStart, setPeriodStart] = useState(initial.start);
  const [periodEnd, setPeriodEnd] = useState(initial.end);
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState<PayrollRow | null>(null);
  const [actualPaid, setActualPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchPayroll = useCallback(async () => {
    setError('');
    try {
      const qs = `periodStart=${encodeURIComponent(periodStart.trim())}&periodEnd=${encodeURIComponent(periodEnd.trim())}`;
      const res = await hubFetch(`/api/admin/payroll?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar la nómina.');
      setRows(data.rows || []);
    } catch (err) {
      console.error('Error cargando nómina admin:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [periodStart, periodEnd]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchPayroll().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchPayroll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayroll();
    setRefreshing(false);
  };

  const openEditor = (row: PayrollRow) => {
    setEditing(row);
    setActualPaid(row.actualPaid !== undefined ? String(row.actualPaid) : String(row.expectedPay));
    setNotes(row.notes || '');
    setFormError('');
  };

  const handleSave = async () => {
    if (!editing) return;
    const numPaid = Number(actualPaid);
    if (Number.isNaN(numPaid) || numPaid < 0) {
      setFormError('Ingresa un monto pagado válido.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const res = await hubFetch('/api/admin/payroll', {
        method: 'POST',
        body: JSON.stringify({
          staffUid: editing.staffUid,
          periodStart: editing.periodStart,
          periodEnd: editing.periodEnd,
          actualPaid: numPaid,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar el pago.');
      setEditing(null);
      await fetchPayroll();
    } catch (err) {
      console.error('Error guardando registro de nómina:', err);
      setFormError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Nómina</Text>
      </View>

      <View style={styles.rangeBar}>
        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>DESDE (YYYY-MM-DD)</Text>
          <TextInput
            value={periodStart}
            onChangeText={setPeriodStart}
            placeholder="2026-11-01"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.dateInput}
          />
        </View>
        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>HASTA (YYYY-MM-DD)</Text>
          <TextInput
            value={periodEnd}
            onChangeText={setPeriodEnd}
            placeholder="2026-11-15"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.dateInput}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.staffUid}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay personal por hora en este periodo.</Text>}
          renderItem={({ item }) => {
            const hasPaid = item.actualPaid !== undefined && item.actualPaid !== null;
            const variance = hasPaid ? (item.actualPaid as number) - item.expectedPay : 0;
            const varianceColor = variance >= 0 ? Colors.dark.success : Colors.dark.danger;

            return (
              <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openEditor(item)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.staffName}</Text>
                  <Text style={styles.rateText}>${item.hourlyRate}/hr · {item.hoursLogged.toFixed(1)}h</Text>
                </View>

                <View style={styles.payRow}>
                  <Text style={styles.expectedText}>Esperado: {formatMoney(item.expectedPay)}</Text>
                  <Text style={styles.actualText}>
                    Pagado: {hasPaid ? formatMoney(item.actualPaid) : 'Pendiente'}
                  </Text>
                </View>

                {hasPaid && (
                  <Text style={[styles.varianceText, { color: varianceColor }]}>
                    Variación: {variance >= 0 ? '+' : ''}{formatMoney(variance)}
                  </Text>
                )}
                {!!item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal visible={editing !== null} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar pago: {editing?.staffName}</Text>
              <TouchableOpacity onPress={() => setEditing(null)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formBody}>
              <Text style={styles.label}>MONTO REAL PAGADO (USD)</Text>
              <TextInput
                value={actualPaid}
                onChangeText={setActualPaid}
                placeholder="0.00"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.label}>NOTAS (OPCIONAL)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Referencia o comentario del pago"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
              />

              {!!formError && <Text style={styles.error}>{formError}</Text>}

              <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={submitting} activeOpacity={0.85}>
                {submitting ? (
                  <ActivityIndicator color={Colors.dark.background} />
                ) : (
                  <Text style={styles.submitText}>GUARDAR PAGO</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800', flex: 1 },
  rangeBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  dateField: { flex: 1 },
  dateLabel: { color: Colors.dark.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  dateInput: {
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.dark.text,
    fontSize: 13,
  },
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
    gap: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardName: { color: Colors.dark.text, fontSize: 14, fontWeight: '700', flex: 1 },
  rateText: { color: Colors.dark.accent, fontSize: 12, fontWeight: '700' },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  expectedText: { color: Colors.dark.textSecondary, fontSize: 12, fontWeight: '600' },
  actualText: { color: Colors.dark.text, fontSize: 12, fontWeight: '700' },
  varianceText: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  notesText: { color: Colors.dark.textSecondary, fontSize: 11, marginTop: 2 },
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
  formBody: { padding: 16 },
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
    marginBottom: 16,
  },
  submitText: { color: Colors.dark.background, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});
