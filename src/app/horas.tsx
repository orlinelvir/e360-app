import { useCallback, useEffect, useMemo, useState } from 'react';
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

interface TimeEntryItem {
  id: string;
  date: string;
  hoursWorked: number;
  note?: string;
  createdAt?: string;
}

function todayISODate() {
  return new Date().toISOString().split('T')[0];
}

function startOfWeek(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function formatMoney(val: number) {
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function MisHorasScreen() {
  const [entries, setEntries] = useState<TimeEntryItem[]>([]);
  const [contractType, setContractType] = useState<string | undefined>(undefined);
  const [hourlyRateUSD, setHourlyRateUSD] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [date, setDate] = useState(todayISODate());
  const [hoursWorked, setHoursWorked] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchEntries = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/staff/time-entries');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar tus horas.');
      setEntries(data.entries || []);
      setContractType(data.contractType);
      setHourlyRateUSD(data.hourlyRateUSD);
    } catch (err) {
      console.error('Error cargando mis horas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchEntries().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEntries]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEntries();
    setRefreshing(false);
  };

  const weekStart = startOfWeek(todayISODate());
  const hoursThisWeek = useMemo(
    () => entries.filter((e) => e.date >= weekStart).reduce((acc, e) => acc + e.hoursWorked, 0),
    [entries, weekStart],
  );
  const isHourly = contractType === 'hourly' && typeof hourlyRateUSD === 'number';

  const handleAddEntry = async () => {
    const numHours = Number(hoursWorked);
    if (!date.trim() || Number.isNaN(numHours) || numHours < 0.25 || numHours > 24) {
      setFormError('Las horas trabajadas deben estar entre 0.25 y 24.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const res = await hubFetch('/api/staff/time-entries', {
        method: 'POST',
        body: JSON.stringify({
          date: date.trim(),
          hoursWorked: numHours,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar la entrada.');
      setHoursWorked('');
      setNote('');
      setFormOpen(false);
      await fetchEntries();
    } catch (err) {
      console.error('Error registrando horas:', err);
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
        <View style={styles.headerText}>
          <Text style={styles.title}>Mis Horas</Text>
          <Text style={styles.subtitle}>{hoursThisWeek.toFixed(1)}h registradas esta semana</Text>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={() => setFormOpen(true)}>
          <Ionicons name="add" size={20} color={Colors.dark.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>ESTIMADO DE ESTA SEMANA</Text>
        {isHourly ? (
          <>
            <Text style={styles.summaryAmount}>{formatMoney(hoursThisWeek * (hourlyRateUSD as number))}</Text>
            <Text style={styles.summaryHint}>
              ${hourlyRateUSD}/hr × {hoursThisWeek.toFixed(1)}h
            </Text>
          </>
        ) : (
          <Text style={styles.summaryHint}>
            {contractType ? 'No aplica — tu contrato no es por hora.' : 'Tu tarifa por hora aún no está configurada.'}
          </Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>Todavía no has registrado horas.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{item.date}</Text>
                <Text style={styles.cardHours}>{item.hoursWorked}h</Text>
              </View>
              {!!item.note && <Text style={styles.cardNote}>{item.note}</Text>}
            </View>
          )}
        />
      )}

      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar horas</Text>
              <TouchableOpacity onPress={() => setFormOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formBody}>
              <Text style={styles.label}>FECHA (YYYY-MM-DD)</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="2026-11-16"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
              />

              <Text style={styles.label}>HORAS TRABAJADAS (0.25 A 24)</Text>
              <TextInput
                value={hoursWorked}
                onChangeText={setHoursWorked}
                placeholder="Ej. 8"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.label}>NOTA (OPCIONAL)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Ej. soporte de clientes"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
              />

              {!!formError && <Text style={styles.error}>{formError}</Text>}

              <TouchableOpacity style={styles.submitButton} onPress={handleAddEntry} disabled={submitting} activeOpacity={0.85}>
                {submitting ? (
                  <ActivityIndicator color={Colors.dark.background} />
                ) : (
                  <Text style={styles.submitText}>GUARDAR ENTRADA</Text>
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
  headerText: { flex: 1 },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
  newButton: { backgroundColor: Colors.dark.accent, borderRadius: 999, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  summaryCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    gap: 4,
  },
  summaryLabel: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  summaryAmount: { color: Colors.dark.success, fontSize: 22, fontWeight: '900' },
  summaryHint: { color: Colors.dark.textSecondary, fontSize: 12 },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { color: Colors.dark.text, fontSize: 14, fontWeight: '700' },
  cardHours: { color: Colors.dark.accent, fontSize: 14, fontWeight: '900' },
  cardNote: { color: Colors.dark.textSecondary, fontSize: 12 },
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
