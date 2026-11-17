import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { isTaxOfficePaywall, TaxOfficeUpsellView } from '@/components/tax-office-upsell';

type MeetingIntegration = 'none' | 'zoom' | 'google_meet' | 'phone';

interface TaxAppointment {
  id: string;
  title: string;
  type: string;
  dateTime: string;
  durationMinutes: number;
  relatedClientId?: string;
  location?: string;
  meetingIntegration: MeetingIntegration;
  label?: string;
}

const INTEGRATION_OPTIONS: { id: MeetingIntegration; label: string }[] = [
  { id: 'none', label: 'Presencial' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'google_meet', label: 'Google Meet' },
  { id: 'phone', label: 'Llamada' },
];

export default function OficinaCitasScreen() {
  const [appointments, setAppointments] = useState<TaxAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Consulta');
  const [dateTime, setDateTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [location, setLocation] = useState('');
  const [meetingIntegration, setMeetingIntegration] = useState<MeetingIntegration>('none');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAppointments = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/tax-office/appointments');
      const data = await res.json().catch(() => ({}));
      if (isTaxOfficePaywall(res.status, data.error)) {
        setPaywall(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las citas.');
      setPaywall(false);
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error('Error cargando citas de Oficina Virtual:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchAppointments().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAppointments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const sorted = useMemo(
    () =>
      [...appointments].sort(
        (a, b) => (new Date(a.dateTime).getTime() || 0) - (new Date(b.dateTime).getTime() || 0),
      ),
    [appointments],
  );

  const handleCreate = async () => {
    if (!title.trim() || !dateTime.trim()) {
      setFormError('Título y fecha/hora son obligatorios.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const res = await hubFetch('/api/tax-office/appointments', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          type: type.trim() || 'Consulta',
          dateTime: dateTime.trim(),
          durationMinutes: Number(durationMinutes) || 30,
          location: location.trim() || undefined,
          meetingIntegration,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo agendar la cita.');
      setTitle('');
      setDateTime('');
      setLocation('');
      setFormOpen(false);
      await fetchAppointments();
    } catch (err) {
      console.error('Error creando cita fiscal:', err);
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
          <Text style={styles.title}>Citas</Text>
          {!paywall && <Text style={styles.subtitle}>{sorted.length} citas agendadas</Text>}
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
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay citas agendadas.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.meetingIntegration}</Text>
                </View>
              </View>
              <Text style={styles.cardDate}>
                {item.dateTime} · {item.durationMinutes} min
              </Text>
              <Text style={styles.cardMeta}>
                {item.type}
                {item.location ? ` · ${item.location}` : ''}
              </Text>
            </View>
          )}
        />
      )}

      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Cita</Text>
              <TouchableOpacity onPress={() => setFormOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.formBody}>
              <Text style={styles.label}>TÍTULO DE LA CITA</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="Ej. Revisión 1040 Juan Pérez" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              <Text style={styles.label}>FECHA Y HORA (ISO / YYYY-MM-DD HH:MM)</Text>
              <TextInput value={dateTime} onChangeText={setDateTime} placeholder="2026-12-01T10:00" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              <Text style={styles.label}>DURACIÓN (MINUTOS)</Text>
              <TextInput value={durationMinutes} onChangeText={setDurationMinutes} placeholder="30" placeholderTextColor={Colors.dark.textSecondary} keyboardType="numeric" style={styles.input} />

              <Text style={styles.label}>TIPO</Text>
              <TextInput value={type} onChangeText={setType} placeholder="Consulta" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              <Text style={styles.label}>MODALIDAD</Text>
              <View style={styles.integrationRow}>
                {INTEGRATION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.integrationChip, meetingIntegration === opt.id && styles.integrationChipActive]}
                    onPress={() => setMeetingIntegration(opt.id)}
                  >
                    <Text style={[styles.integrationText, meetingIntegration === opt.id && styles.integrationTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>UBICACIÓN / ENLACE (OPCIONAL)</Text>
              <TextInput value={location} onChangeText={setLocation} placeholder="Oficina o enlace de reunión" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />

              {!!formError && <Text style={styles.error}>{formError}</Text>}

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate} disabled={submitting} activeOpacity={0.85}>
                {submitting ? <ActivityIndicator color={Colors.dark.background} /> : <Text style={styles.submitText}>AGENDAR CITA</Text>}
              </TouchableOpacity>
            </ScrollView>
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
    gap: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { color: Colors.dark.text, fontSize: 14, fontWeight: '700', flex: 1 },
  badge: { borderWidth: 1, borderColor: Colors.dark.accent, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: Colors.dark.accent, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cardDate: { color: Colors.dark.gold, fontSize: 12, fontWeight: '700' },
  cardMeta: { color: Colors.dark.textSecondary, fontSize: 12 },
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
  formBody: { padding: 16, paddingBottom: 32 },
  label: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 12 },
  integrationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  integrationChip: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  integrationChipActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  integrationText: { color: Colors.dark.textSecondary, fontSize: 11, fontWeight: '700' },
  integrationTextActive: { color: Colors.dark.background, fontWeight: '800' },
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
