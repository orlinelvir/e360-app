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

type TaxInvoiceStatus = 'draft' | 'sent' | 'paid' | 'failed' | 'refunded' | 'cancelled';
type TaxPaymentMethod = 'refund_deduction' | 'card' | 'zelle' | 'cash';

interface TaxInvoice {
  id: string;
  invoiceNumber?: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  description?: string;
  dueDate?: string;
  status: TaxInvoiceStatus;
  paymentMethod: TaxPaymentMethod;
  caseId?: string;
}

const STATUS_OPTIONS: { id: TaxInvoiceStatus; label: string }[] = [
  { id: 'draft', label: 'Borrador' },
  { id: 'sent', label: 'Enviada' },
  { id: 'paid', label: 'Pagada' },
  { id: 'failed', label: 'Fallida' },
  { id: 'refunded', label: 'Reembolsada' },
  { id: 'cancelled', label: 'Cancelada' },
];

const PAYMENT_OPTIONS: { id: TaxPaymentMethod; label: string }[] = [
  { id: 'refund_deduction', label: 'Deducción Reembolso' },
  { id: 'card', label: 'Tarjeta' },
  { id: 'zelle', label: 'Zelle' },
  { id: 'cash', label: 'Efectivo' },
];

function formatMoney(amount?: number) {
  return `$${(amount || 0).toLocaleString('en-US')}`;
}

export default function OficinaFacturasScreen() {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<TaxPaymentMethod>('refund_deduction');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [statusTarget, setStatusTarget] = useState<TaxInvoice | null>(null);

  const fetchInvoices = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/tax-office/invoices');
      const data = await res.json().catch(() => ({}));
      if (isTaxOfficePaywall(res.status, data.error)) {
        setPaywall(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las facturas.');
      setPaywall(false);
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Error cargando facturas de Oficina Virtual:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchInvoices().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchInvoices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!clientName.trim()) {
      setFormError('El nombre del cliente es obligatorio.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const res = await hubFetch('/api/tax-office/invoices', {
        method: 'POST',
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim() || undefined,
          amount: Number(amount) || 0,
          description: description.trim() || undefined,
          dueDate: dueDate.trim() || undefined,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear la factura.');
      setClientName('');
      setClientEmail('');
      setAmount('');
      setDescription('');
      setDueDate('');
      setFormOpen(false);
      await fetchInvoices();
    } catch (err) {
      console.error('Error creando factura fiscal:', err);
      setFormError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: TaxInvoiceStatus) => {
    if (!statusTarget) return;
    try {
      const res = await hubFetch(`/api/tax-office/invoices/${encodeURIComponent(statusTarget.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la factura.');
      setStatusTarget(null);
      await fetchInvoices();
    } catch (err) {
      console.error('Error actualizando estado de factura:', err);
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
          <Text style={styles.title}>Facturación</Text>
          {!paywall && <Text style={styles.subtitle}>{invoices.length} facturas emitidas</Text>}
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
          data={invoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay facturas registradas.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => setStatusTarget(item)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.invoiceNumber ? `${item.invoiceNumber} · ` : ''}
                  {item.clientName}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {item.clientEmail} · {item.paymentMethod}
              </Text>
              {!!item.description && <Text style={styles.cardMeta}>{item.description}</Text>}
              <View style={styles.cardFooter}>
                <Text style={styles.amountText}>{formatMoney(item.amount)}</Text>
                {!!item.dueDate && <Text style={styles.dueText}>Vence: {item.dueDate}</Text>}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Factura</Text>
              <TouchableOpacity onPress={() => setFormOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.formBody}>
              <Text style={styles.label}>CLIENTE</Text>
              <TextInput value={clientName} onChangeText={setClientName} placeholder="Nombre completo" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              <Text style={styles.label}>EMAIL</Text>
              <TextInput value={clientEmail} onChangeText={setClientEmail} placeholder="cliente@correo.com" placeholderTextColor={Colors.dark.textSecondary} autoCapitalize="none" keyboardType="email-address" style={styles.input} />

              <Text style={styles.label}>MONTO (USD)</Text>
              <TextInput value={amount} onChangeText={setAmount} placeholder="350" placeholderTextColor={Colors.dark.textSecondary} keyboardType="numeric" style={styles.input} />

              <Text style={styles.label}>MÉTODO DE PAGO</Text>
              <View style={styles.methodRow}>
                {PAYMENT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.methodChip, paymentMethod === opt.id && styles.methodChipActive]}
                    onPress={() => setPaymentMethod(opt.id)}
                  >
                    <Text style={[styles.methodText, paymentMethod === opt.id && styles.methodTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>FECHA DE VENCIMIENTO (YYYY-MM-DD)</Text>
              <TextInput value={dueDate} onChangeText={setDueDate} placeholder="2026-12-15" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              <Text style={styles.label}>CONCEPTO / DESCRIPCIÓN</Text>
              <TextInput value={description} onChangeText={setDescription} placeholder="Preparación 1040" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              {!!formError && <Text style={styles.error}>{formError}</Text>}

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate} disabled={submitting} activeOpacity={0.85}>
                {submitting ? <ActivityIndicator color={Colors.dark.background} /> : <Text style={styles.submitText}>EMITIR FACTURA</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={statusTarget !== null} animationType="slide" transparent onRequestClose={() => setStatusTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>Estado: {statusTarget?.clientName}</Text>
              <TouchableOpacity onPress={() => setStatusTarget(null)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={STATUS_OPTIONS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleUpdateStatus(item.id)}>
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {statusTarget?.status === item.id && <Ionicons name="checkmark" size={18} color={Colors.dark.accent} />}
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
    gap: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardName: { color: Colors.dark.text, fontSize: 14, fontWeight: '700', flex: 1 },
  badge: { borderWidth: 1, borderColor: Colors.dark.accent, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: Colors.dark.accent, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cardMeta: { color: Colors.dark.textSecondary, fontSize: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  amountText: { color: Colors.dark.success, fontSize: 14, fontWeight: '700' },
  dueText: { color: Colors.dark.textSecondary, fontSize: 11 },
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
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  methodChip: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  methodChipActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  methodText: { color: Colors.dark.textSecondary, fontSize: 11, fontWeight: '700' },
  methodTextActive: { color: Colors.dark.background, fontWeight: '800' },
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
