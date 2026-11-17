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

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
}

type ContractType = 'hourly' | 'salary' | 'commission';

interface TeamMemberItem {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  role: string;
  roleDetails?: RoleDefinition;
  contractType?: ContractType;
  hourlyRateUSD?: number;
  weeklyHoursExpected?: number;
  contractNotes?: string;
}

const CONTRACT_OPTIONS: { id: ContractType; label: string }[] = [
  { id: 'hourly', label: 'Por hora' },
  { id: 'salary', label: 'Salario' },
  { id: 'commission', label: 'Comisión' },
];

export default function AdminRolesScreen() {
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState<TeamMemberItem | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [contractType, setContractType] = useState<ContractType>('hourly');
  const [hourlyRateUSD, setHourlyRateUSD] = useState('');
  const [weeklyHoursExpected, setWeeklyHoursExpected] = useState('');
  const [contractNotes, setContractNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRoles = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/admin/roles');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el equipo.');
      setMembers(data.teamMembers || []);
      setRoleDefinitions(data.roleDefinitions || []);
    } catch (err) {
      console.error('Error cargando roles admin:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchRoles().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchRoles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRoles();
    setRefreshing(false);
  };

  const openEditor = (m: TeamMemberItem) => {
    setEditing(m);
    setSelectedRole(m.role);
    setContractType(m.contractType || 'hourly');
    setHourlyRateUSD(m.hourlyRateUSD !== undefined ? String(m.hourlyRateUSD) : '');
    setWeeklyHoursExpected(m.weeklyHoursExpected !== undefined ? String(m.weeklyHoursExpected) : '');
    setContractNotes(m.contractNotes || '');
    setFormError('');
  };

  const handleSave = async () => {
    if (!editing || !selectedRole) return;
    setSubmitting(true);
    setFormError('');
    try {
      const payload: Record<string, unknown> = {
        targetUid: editing.uid,
        role: selectedRole,
        contractType,
        hourlyRateUSD: contractType === 'hourly' && hourlyRateUSD.trim() !== '' ? Number(hourlyRateUSD) : null,
        weeklyHoursExpected: weeklyHoursExpected.trim() !== '' ? Number(weeklyHoursExpected) : null,
        contractNotes: contractNotes.trim() !== '' ? contractNotes.trim() : null,
      };
      const res = await hubFetch('/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el rol.');
      setEditing(null);
      await fetchRoles();
    } catch (err) {
      console.error('Error guardando rol:', err);
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
          <Text style={styles.title}>Equipo & Roles</Text>
          <Text style={styles.subtitle}>{members.length} miembros del staff</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay miembros de equipo configurados.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openEditor(item)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>{item.displayName}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.roleDetails?.name || item.role}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>{item.email}</Text>
              <Text style={styles.cardContract}>
                Contrato: {item.contractType || 'Sin definir'}
                {item.hourlyRateUSD !== undefined ? ` · $${item.hourlyRateUSD}/hr` : ''}
                {item.weeklyHoursExpected !== undefined ? ` · ${item.weeklyHoursExpected}h/sem` : ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={editing !== null} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                Editar rol: {editing?.displayName}
              </Text>
              <TouchableOpacity onPress={() => setEditing(null)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formBody}>
              <Text style={styles.label}>ROL DEL SISTEMA</Text>
              <View style={styles.rolesList}>
                {roleDefinitions.map((r) => {
                  const active = selectedRole === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.roleOption, active && styles.roleOptionActive]}
                      onPress={() => setSelectedRole(r.id)}
                    >
                      <Text style={[styles.roleOptionName, active && styles.roleOptionNameActive]}>{r.name}</Text>
                      <Text style={styles.roleOptionDesc}>{r.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>TIPO DE CONTRATO</Text>
              <View style={styles.contractRow}>
                {CONTRACT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.contractChip, contractType === opt.id && styles.contractChipActive]}
                    onPress={() => setContractType(opt.id)}
                  >
                    <Text style={[styles.contractChipText, contractType === opt.id && styles.contractChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {contractType === 'hourly' && (
                <>
                  <Text style={styles.label}>TARIFA POR HORA (USD)</Text>
                  <TextInput
                    value={hourlyRateUSD}
                    onChangeText={setHourlyRateUSD}
                    placeholder="Ej. 15"
                    placeholderTextColor={Colors.dark.textSecondary}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </>
              )}

              <Text style={styles.label}>HORAS SEMANALES ESPERADAS</Text>
              <TextInput
                value={weeklyHoursExpected}
                onChangeText={setWeeklyHoursExpected}
                placeholder="Ej. 40"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.label}>NOTAS DE CONTRATO</Text>
              <TextInput
                value={contractNotes}
                onChangeText={setContractNotes}
                placeholder="Notas internas opcionales"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
              />

              {!!formError && <Text style={styles.error}>{formError}</Text>}

              <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={submitting} activeOpacity={0.85}>
                {submitting ? (
                  <ActivityIndicator color={Colors.dark.background} />
                ) : (
                  <Text style={styles.submitText}>GUARDAR CAMBIOS</Text>
                )}
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
  cardContract: { color: Colors.dark.textSecondary, fontSize: 11, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.dark.backgroundElement, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalTitle: { color: Colors.dark.text, fontSize: 15, fontWeight: '700', flex: 1 },
  formBody: { padding: 16, paddingBottom: 32 },
  label: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 12 },
  rolesList: { gap: 8, marginTop: 8 },
  roleOption: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: 12,
    padding: 10,
  },
  roleOptionActive: { borderColor: Colors.dark.accent },
  roleOptionName: { color: Colors.dark.text, fontSize: 13, fontWeight: '700' },
  roleOptionNameActive: { color: Colors.dark.accent },
  roleOptionDesc: { color: Colors.dark.textSecondary, fontSize: 11, marginTop: 2 },
  contractRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  contractChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  contractChipActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  contractChipText: { color: Colors.dark.textSecondary, fontSize: 11, fontWeight: '700' },
  contractChipTextActive: { color: Colors.dark.background, fontWeight: '800' },
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
