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

type TaxTaskPriority = 'low' | 'medium' | 'high';
type TaxTaskStatus = 'to_do' | 'in_progress' | 'completed';

interface TaxTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: TaxTaskPriority;
  status: TaxTaskStatus;
  relatedClientId?: string;
}

const PRIORITY_LABEL: Record<TaxTaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

const STATUS_OPTIONS: { id: TaxTaskStatus; label: string }[] = [
  { id: 'to_do', label: 'Por Hacer' },
  { id: 'in_progress', label: 'En Progreso' },
  { id: 'completed', label: 'Completada' },
];

export default function OficinaTareasScreen() {
  const [tasks, setTasks] = useState<TaxTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaxTaskPriority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchTasks = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/tax-office/tasks');
      const data = await res.json().catch(() => ({}));
      if (isTaxOfficePaywall(res.status, data.error)) {
        setPaywall(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las tareas.');
      setPaywall(false);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Error cargando tareas de Oficina Virtual:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchTasks().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setFormError('El título de la tarea es obligatorio.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const res = await hubFetch('/api/tax-office/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate.trim() || undefined,
          priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear la tarea.');
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('medium');
      setFormOpen(false);
      await fetchTasks();
    } catch (err) {
      console.error('Error creando tarea fiscal:', err);
      setFormError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (task: TaxTask, nextStatus: TaxTaskStatus) => {
    if (task.status === nextStatus) return;
    try {
      const res = await hubFetch(`/api/tax-office/tasks/${encodeURIComponent(task.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la tarea.');
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    } catch (err) {
      console.error('Error actualizando tarea fiscal:', err);
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
          <Text style={styles.title}>Tareas</Text>
          {!paywall && <Text style={styles.subtitle}>{tasks.length} tareas</Text>}
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
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No tienes tareas registradas.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.priorityTag}>Prioridad: {PRIORITY_LABEL[item.priority] || item.priority}</Text>
              </View>
              {!!item.description && <Text style={styles.cardDesc}>{item.description}</Text>}
              {!!item.dueDate && <Text style={styles.cardDue}>Vence: {item.dueDate}</Text>}
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((opt) => {
                  const active = item.status === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.statusChip, active && styles.statusChipActive]}
                      onPress={() => handleUpdateStatus(item, opt.id)}
                    >
                      <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Tarea</Text>
              <TouchableOpacity onPress={() => setFormOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.formBody}>
              <Text style={styles.label}>TÍTULO</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="Ej. Solicitar W-2 faltante" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

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

              <Text style={styles.label}>FECHA LÍMITE (YYYY-MM-DD)</Text>
              <TextInput value={dueDate} onChangeText={setDueDate} placeholder="2026-12-01" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              <Text style={styles.label}>DESCRIPCIÓN</Text>
              <TextInput value={description} onChangeText={setDescription} placeholder="Detalles opcionales" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              {!!formError && <Text style={styles.error}>{formError}</Text>}

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate} disabled={submitting} activeOpacity={0.85}>
                {submitting ? <ActivityIndicator color={Colors.dark.background} /> : <Text style={styles.submitText}>CREAR TAREA</Text>}
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
  cardTitle: { color: Colors.dark.text, fontSize: 14, fontWeight: '700', flex: 1 },
  priorityTag: { color: Colors.dark.accent, fontSize: 11, fontWeight: '700' },
  cardDesc: { color: Colors.dark.textSecondary, fontSize: 12 },
  cardDue: { color: Colors.dark.gold, fontSize: 11, fontWeight: '600' },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statusChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statusChipActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  statusChipText: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700' },
  statusChipTextActive: { color: Colors.dark.background, fontWeight: '800' },
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
  formBody: { padding: 16 },
  label: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 12 },
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
  priorityOptionTextActive: { color: Colors.dark.background, fontWeight: '800' },
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
