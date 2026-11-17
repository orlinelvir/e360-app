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
import { isTaxOfficePaywall, TaxOfficeUpsellView } from '@/components/tax-office-upsell';

type TaxClientStatus =
  | 'lead'
  | 'active'
  | 'pending'
  | 'waiting_docs'
  | 'in_review'
  | 'completed'
  | 'inactive'
  | 'archived';

interface TaxClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: TaxClientStatus;
  notes?: string;
}

const STATUS_OPTIONS: { id: TaxClientStatus; label: string }[] = [
  { id: 'lead', label: 'Prospecto (Lead)' },
  { id: 'active', label: 'Activo' },
  { id: 'pending', label: 'Pendiente' },
  { id: 'waiting_docs', label: 'Esperando Docs' },
  { id: 'in_review', label: 'En Revisión' },
  { id: 'completed', label: 'Completado' },
  { id: 'inactive', label: 'Inactivo' },
  { id: 'archived', label: 'Archivado' },
];

export default function OficinaClientesScreen() {
  const [clients, setClients] = useState<TaxClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [statusTarget, setStatusTarget] = useState<TaxClient | null>(null);

  const fetchClients = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/tax-office/clients');
      const data = await res.json().catch(() => ({}));
      if (isTaxOfficePaywall(res.status, data.error)) {
        setPaywall(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los clientes.');
      setPaywall(false);
      setClients(data.clients || []);
    } catch (err) {
      console.error('Error cargando clientes de Oficina Virtual:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

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

  const handleCreate = async () => {
    if (!name.trim()) {
      setFormError('El nombre del cliente es obligatorio.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setFormError('Ingresa al menos un correo o teléfono.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const res = await hubFetch('/api/tax-office/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear el cliente.');
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
      setFormOpen(false);
      await fetchClients();
    } catch (err) {
      console.error('Error creando cliente fiscal:', err);
      setFormError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeStatus = async (status: TaxClientStatus) => {
    if (!statusTarget) return;
    try {
      const res = await hubFetch(`/api/tax-office/clients/${encodeURIComponent(statusTarget.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cambiar el estado.');
      setStatusTarget(null);
      await fetchClients();
    } catch (err) {
      console.error('Error actualizando estado de cliente fiscal:', err);
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
          <Text style={styles.title}>Clientes Oficina</Text>
          {!paywall && <Text style={styles.subtitle}>{clients.length} clientes</Text>}
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
          data={clients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay clientes registrados en tu oficina.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => setStatusTarget(item)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {[item.email, item.phone].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
              </Text>
              {!!item.notes && <Text style={styles.cardNotes}>{item.notes}</Text>}
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Cliente</Text>
              <TouchableOpacity onPress={() => setFormOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.formBody}>
              <Text style={styles.label}>NOMBRE</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Nombre completo" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              <Text style={styles.label}>EMAIL</Text>
              <TextInput value={email} onChangeText={setEmail} placeholder="cliente@correo.com" placeholderTextColor={Colors.dark.textSecondary} autoCapitalize="none" keyboardType="email-address" style={styles.input} />

              <Text style={styles.label}>TELÉFONO</Text>
              <TextInput value={phone} onChangeText={setPhone} placeholder="+1 (555) 000-0000" placeholderTextColor={Colors.dark.textSecondary} keyboardType="phone-pad" style={styles.input} />

              <Text style={styles.label}>NOTAS</Text>
              <TextInput value={notes} onChangeText={setNotes} placeholder="Opcional" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              {!!formError && <Text style={styles.error}>{formError}</Text>}

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate} disabled={submitting} activeOpacity={0.85}>
                {submitting ? <ActivityIndicator color={Colors.dark.background} /> : <Text style={styles.submitText}>GUARDAR CLIENTE</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={statusTarget !== null} animationType="slide" transparent onRequestClose={() => setStatusTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>Estado: {statusTarget?.name}</Text>
              <TouchableOpacity onPress={() => setStatusTarget(null)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={STATUS_OPTIONS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleChangeStatus(item.id)}>
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
  cardNotes: { color: Colors.dark.textSecondary, fontSize: 11, marginTop: 2 },
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
