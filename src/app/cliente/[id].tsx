import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { Href, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';
import { deriveReviewStatus, REVIEW_STATUS_COLOR, REVIEW_STATUS_LABEL } from '@/lib/caseStatus';

// Misma forma que GET /api/broker/clients (ver index.tsx).
interface ClientItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  serviceName?: string;
  amount?: number | string;
  estimatedCommission?: number;
  status?: string;
  notes?: string;
  createdAt?: string;
}

// GET /api/broker/clients/notes?clientId=… — siempre categoría "broker";
// las notas internas de staff nunca llegan aquí.
interface CaseNote {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

type FormState = { name: string; email: string; phone: string; amount: string; notes: string };

function toForm(client: ClientItem): FormState {
  return {
    name: client.name ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
    amount: client.amount !== undefined && client.amount !== null ? String(client.amount) : '',
    notes: client.notes ?? '',
  };
}

function formatMoney(amount?: number | string) {
  return `$${(Number(amount) || 0).toLocaleString('en-US')}`;
}

function formatDate(iso?: string) {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ClienteDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [client, setClient] = useState<ClientItem | null>(null);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const fetchAll = useCallback(async () => {
    if (!user || !id) return;
    setError('');
    try {
      const [clientsRes, notesRes] = await Promise.all([
        hubFetch('/api/broker/clients'),
        hubFetch(`/api/broker/clients/notes?clientId=${encodeURIComponent(id)}`),
      ]);
      const clientsData = await clientsRes.json();
      if (!clientsRes.ok) throw new Error(clientsData.error || 'No se pudo cargar el cliente.');

      const found = (clientsData.clients as ClientItem[] | undefined)?.find((c) => c.id === id);
      if (!found) throw new Error('Cliente no encontrado.');
      setClient(found);
      setForm(toForm(found));

      // Las notas son secundarias: si fallan, el detalle sigue siendo útil.
      const notesData = await notesRes.json().catch(() => ({}));
      setNotes(notesRes.ok ? notesData.notes || [] : []);
    } catch (err) {
      console.error('Error cargando detalle de cliente:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [user, id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchAll().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const reviewStatus = deriveReviewStatus(client?.status);
  // Mismo criterio que /api/broker/clients/edit: solo se corrige mientras el
  // caso sigue pendiente de documentos o en revisión.
  const editable = reviewStatus === 'pending_docs' || reviewStatus === 'in_review';

  const handleSave = async () => {
    if (!client || !form) return;
    const original = toForm(client);
    // Solo se mandan los campos que el usuario realmente cambió.
    const changes: Partial<Record<keyof FormState, string | number>> = {};
    (Object.keys(form) as (keyof FormState)[]).forEach((key) => {
      if (form[key].trim() !== original[key].trim()) {
        changes[key] = key === 'amount' ? Number(form[key]) || 0 : form[key].trim();
      }
    });
    if (Object.keys(changes).length === 0) {
      setSaveError('');
      setSaveMessage('No hay cambios para guardar.');
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveMessage('');
    try {
      const res = await hubFetch('/api/broker/clients/edit', {
        method: 'PATCH',
        body: JSON.stringify({ clientId: client.id, ...changes }),
      });
      const data = await res.json();
      // El backend explica por qué no se puede editar (ej. "Este caso ya fue
      // revisado...") — se muestra tal cual, no como error genérico.
      if (!res.ok) throw new Error(data.error || 'No se pudieron guardar los cambios.');
      setSaveMessage('Cambios guardados.');
      await fetchAll();
    } catch (err) {
      console.error('Error guardando cliente:', err);
      setSaveError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: keyof FormState) => (value: string) => {
    setSaveMessage('');
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{client?.name || 'Cliente'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error || !client || !form ? (
        <Text style={styles.error}>{error || 'Cliente no encontrado.'}</Text>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          >
            <View style={styles.summaryCard}>
              <View style={[styles.badge, { borderColor: REVIEW_STATUS_COLOR[reviewStatus] }]}>
                <Text style={[styles.badgeText, { color: REVIEW_STATUS_COLOR[reviewStatus] }]}>{REVIEW_STATUS_LABEL[reviewStatus]}</Text>
              </View>
              <Text style={styles.service}>{client.serviceName || 'Servicio'}</Text>
              <View style={styles.summaryFooter}>
                <Text style={styles.amount}>{formatMoney(client.amount)}</Text>
                {!!client.estimatedCommission && <Text style={styles.commission}>Comisión est. {formatMoney(client.estimatedCommission)}</Text>}
              </View>
              {!!formatDate(client.createdAt) && <Text style={styles.date}>Creado el {formatDate(client.createdAt)}</Text>}
            </View>

            <TouchableOpacity style={styles.docsButton} activeOpacity={0.85} onPress={() => router.push(`/cliente/${client.id}/documentos` as Href)}>
              <Ionicons name="folder-open" size={18} color={Colors.dark.accent} />
              <Text style={styles.docsButtonText}>Documentos del cliente</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.dark.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
            {!editable && (
              <Text style={styles.lockedNote}>Este caso ya fue revisado por el staff. Para cambiar un dato, contacta a soporte.</Text>
            )}

            <Text style={styles.label}>NOMBRE</Text>
            <TextInput value={form.name} onChangeText={setField('name')} editable={editable} style={[styles.input, !editable && styles.inputDisabled]} placeholderTextColor={Colors.dark.textSecondary} />

            <Text style={styles.label}>EMAIL</Text>
            <TextInput value={form.email} onChangeText={setField('email')} editable={editable} keyboardType="email-address" autoCapitalize="none" style={[styles.input, !editable && styles.inputDisabled]} placeholderTextColor={Colors.dark.textSecondary} />

            <Text style={styles.label}>TELÉFONO</Text>
            <TextInput value={form.phone} onChangeText={setField('phone')} editable={editable} keyboardType="phone-pad" style={[styles.input, !editable && styles.inputDisabled]} placeholderTextColor={Colors.dark.textSecondary} />

            <Text style={styles.label}>MONTO</Text>
            <TextInput value={form.amount} onChangeText={setField('amount')} editable={editable} keyboardType="numeric" style={[styles.input, !editable && styles.inputDisabled]} placeholderTextColor={Colors.dark.textSecondary} />

            <Text style={styles.label}>NOTAS</Text>
            <TextInput value={form.notes} onChangeText={setField('notes')} editable={editable} multiline style={[styles.input, styles.textArea, !editable && styles.inputDisabled]} placeholderTextColor={Colors.dark.textSecondary} />

            {!!saveError && <Text style={styles.saveError}>{saveError}</Text>}
            {!!saveMessage && <Text style={styles.saveMessage}>{saveMessage}</Text>}

            {editable && (
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                {saving ? <ActivityIndicator color={Colors.dark.background} /> : <Text style={styles.saveText}>GUARDAR CAMBIOS</Text>}
              </TouchableOpacity>
            )}

            <Text style={styles.sectionTitle}>NOTAS DEL CASO</Text>
            {notes.length === 0 ? (
              <Text style={styles.empty}>Todavía no hay notas para este cliente.</Text>
            ) : (
              notes.map((note) => (
                <View key={note.id} style={styles.noteCard}>
                  <Text style={styles.noteContent}>{note.content}</Text>
                  <Text style={styles.noteMeta}>
                    {note.authorName}
                    {formatDate(note.createdAt) ? ` · ${formatDate(note.createdAt)}` : ''}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  title: { color: Colors.dark.text, fontSize: 20, fontWeight: '800', flex: 1 },
  loader: { marginTop: 40 },
  error: { color: Colors.dark.danger, textAlign: 'center', marginTop: 40, fontSize: 13, paddingHorizontal: 24 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
    gap: 6,
  },
  badge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  service: { color: Colors.dark.text, fontSize: 15, fontWeight: '700' },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  amount: { color: Colors.dark.success, fontSize: 14, fontWeight: '700' },
  commission: { color: Colors.dark.accent, fontSize: 11 },
  date: { color: Colors.dark.textSecondary, fontSize: 11 },
  docsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
    marginTop: 12,
  },
  docsButtonText: { color: Colors.dark.text, fontSize: 13, fontWeight: '700', flex: 1 },
  sectionTitle: { color: Colors.dark.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 24 },
  lockedNote: { color: Colors.dark.gold, fontSize: 12, marginTop: 8 },
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
  inputDisabled: { opacity: 0.6 },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  saveError: { color: Colors.dark.danger, fontSize: 12, marginTop: 12 },
  saveMessage: { color: Colors.dark.success, fontSize: 12, marginTop: 12 },
  saveButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveText: { color: Colors.dark.background, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  empty: { color: Colors.dark.textSecondary, fontSize: 13, marginTop: 12 },
  noteCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 12,
    marginTop: 10,
  },
  noteContent: { color: Colors.dark.text, fontSize: 13 },
  noteMeta: { color: Colors.dark.textSecondary, fontSize: 11, marginTop: 6 },
});
