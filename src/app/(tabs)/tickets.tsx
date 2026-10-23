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
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';
import { TICKET_CATEGORIES, TICKET_STATUS_COLOR, TICKET_STATUS_LABEL, getTicketCategoryLabel } from '@/lib/ticketCategories';

interface TicketItem {
  id: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  description: string;
  createdAt: string;
}

const PRIORITY_LABEL: Record<string, string> = { low: 'Baja', medium: 'Media', high: 'Alta' };

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [category, setCategory] = useState(TICKET_CATEGORIES[0]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchTickets = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/support/tickets');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los tickets.');
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error cargando tickets:', err);
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

  const resetForm = () => {
    setSubject('');
    setDescription('');
    setCategory(TICKET_CATEGORIES[0]);
    setPriority('medium');
  };

  const handleCreateTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      setFormError('Asunto y descripción son requeridos.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const formData = new FormData();
      formData.append('subject', subject.trim());
      formData.append('category', category.id);
      formData.append('priority', priority);
      formData.append('description', description.trim());

      const res = await hubFetch('/api/support/tickets', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear el ticket.');

      resetForm();
      setFormOpen(false);
      fetchTickets();
    } catch (err) {
      console.error('Error creando ticket:', err);
      setFormError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Soporte</Text>
          <Text style={styles.subtitle}>{tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}</Text>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={() => setFormOpen(true)}>
          <Ionicons name="add" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No tienes tickets todavía.</Text>}
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
              <Text style={styles.cardCategory}>{getTicketCategoryLabel(item.category)}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.cardPriority}>Prioridad: {PRIORITY_LABEL[item.priority] || item.priority}</Text>
            </View>
          )}
        />
      )}

      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Ticket</Text>
              <TouchableOpacity onPress={() => setFormOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formBody}>
              <Text style={styles.label}>CATEGORÍA</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setCategoryPickerOpen(true)}>
                <Text style={styles.pickerText} numberOfLines={1}>{category.label}</Text>
                <Ionicons name="chevron-down" size={16} color={Colors.dark.textSecondary} />
              </TouchableOpacity>

              <Text style={styles.label}>PRIORIDAD</Text>
              <View style={styles.priorityRow}>
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityOption, priority === p && styles.priorityOptionActive]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.priorityOptionText, priority === p && styles.priorityOptionTextActive]}>
                      {PRIORITY_LABEL[p]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>ASUNTO</Text>
              <TextInput value={subject} onChangeText={setSubject} placeholder="Resumen breve" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              <Text style={styles.label}>DESCRIPCIÓN</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Detalla tu problema o pregunta"
                placeholderTextColor={Colors.dark.textSecondary}
                style={[styles.input, styles.textArea]}
                multiline
              />

              {!!formError && <Text style={styles.error}>{formError}</Text>}

              <TouchableOpacity style={styles.submitButton} onPress={handleCreateTicket} disabled={submitting} activeOpacity={0.85}>
                {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>ENVIAR TICKET</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={categoryPickerOpen} animationType="slide" transparent onRequestClose={() => setCategoryPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Elige una categoría</Text>
              <TouchableOpacity onPress={() => setCategoryPickerOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={TICKET_CATEGORIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCategory(item);
                    setCategoryPickerOpen(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {item.id === category.id && <Ionicons name="checkmark" size={18} color={Colors.dark.accent} />}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { color: Colors.dark.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
  newButton: { backgroundColor: Colors.dark.accent, borderRadius: 999, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  loader: { marginTop: 40 },
  error: { color: Colors.dark.danger, textAlign: 'center', marginTop: 16, fontSize: 12 },
  empty: { color: Colors.dark.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardSubject: { color: Colors.dark.text, fontSize: 14, fontWeight: '700', flex: 1 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cardCategory: { color: Colors.dark.accent, fontSize: 11, marginTop: 4, fontWeight: '600' },
  cardDescription: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 6 },
  cardPriority: { color: Colors.dark.textSecondary, fontSize: 10, marginTop: 8 },
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
  modalTitle: { color: Colors.dark.text, fontSize: 15, fontWeight: '700' },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalItemText: { color: Colors.dark.text, fontSize: 13, flexShrink: 1 },
  formBody: { padding: 16, gap: 4 },
  label: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 12 },
  picker: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: { color: Colors.dark.text, fontSize: 13, flexShrink: 1 },
  priorityRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  priorityOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  priorityOptionActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  priorityOptionText: { color: Colors.dark.textSecondary, fontSize: 12, fontWeight: '700' },
  priorityOptionTextActive: { color: '#000' },
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
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitText: { color: '#000', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});
