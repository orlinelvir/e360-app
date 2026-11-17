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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';

interface BrokerProfileData {
  uid: string;
  displayName?: string;
  name?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  businessName?: string;
  city?: string;
  state?: string;
  nmlsId?: string;
  licenseNumber?: string;
  bio?: string;
  specialties?: string[];
  referralSlug?: string;
}

type ProfileForm = {
  displayName: string;
  businessName: string;
  phone: string;
  whatsapp: string;
  city: string;
  state: string;
  nmlsId: string;
  licenseNumber: string;
  bio: string;
  specialtiesText: string;
  referralSlug: string;
};

function toForm(p: BrokerProfileData): ProfileForm {
  return {
    displayName: p.displayName || p.name || '',
    businessName: p.businessName || '',
    phone: p.phone || '',
    whatsapp: p.whatsapp || '',
    city: p.city || '',
    state: p.state || '',
    nmlsId: p.nmlsId || '',
    licenseNumber: p.licenseNumber || '',
    bio: p.bio || '',
    specialtiesText: Array.isArray(p.specialties) ? p.specialties.join(', ') : '',
    referralSlug: p.referralSlug || '',
  };
}

function parseSpecialties(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function EditarPerfilScreen() {
  const { user } = useAuth();
  const [original, setOriginal] = useState<ProfileForm | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      const res = await hubFetch('/api/broker/profile');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar tu perfil.');
      const mapped = toForm(data.profile || { uid: user.uid, email: user.email || '' });
      setOriginal(mapped);
      setForm(mapped);
    } catch (err) {
      console.error('Error cargando perfil para editar:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchProfile().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const setField = (key: keyof ProfileForm) => (value: string) => {
    setSaveMessage('');
    setSaveError('');
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!form || !original) return;

    const payload: Record<string, unknown> = {};
    const scalarKeys: (keyof Omit<ProfileForm, 'specialtiesText'>)[] = [
      'displayName',
      'businessName',
      'phone',
      'whatsapp',
      'city',
      'state',
      'nmlsId',
      'licenseNumber',
      'bio',
      'referralSlug',
    ];

    for (const key of scalarKeys) {
      if (form[key].trim() !== original[key].trim()) {
        payload[key] = form[key].trim();
      }
    }

    const nextSpecs = parseSpecialties(form.specialtiesText);
    const origSpecs = parseSpecialties(original.specialtiesText);
    if (JSON.stringify(nextSpecs) !== JSON.stringify(origSpecs)) {
      payload.specialties = nextSpecs;
    }

    if (Object.keys(payload).length === 0) {
      setSaveError('');
      setSaveMessage('No hay cambios para guardar.');
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveMessage('');
    try {
      const res = await hubFetch('/api/broker/profile', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron guardar los cambios.');
      setOriginal(form);
      setSaveMessage('Perfil actualizado correctamente.');
    } catch (err) {
      console.error('Error guardando perfil:', err);
      setSaveError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Perfil</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !form ? (
        <Text style={styles.empty}>No se pudo cargar el formulario de perfil.</Text>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          >
            <Text style={styles.label}>NOMBRE COMPLETO</Text>
            <TextInput
              value={form.displayName}
              onChangeText={setField('displayName')}
              placeholder="Tu nombre y apellido"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
            />

            <Text style={styles.label}>NOMBRE DE AGENCIA / NEGOCIO</Text>
            <TextInput
              value={form.businessName}
              onChangeText={setField('businessName')}
              placeholder="Ej. Apex Capital Advisors LLC"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
            />

            <Text style={styles.label}>TELÉFONO DIRECTO</Text>
            <TextInput
              value={form.phone}
              onChangeText={setField('phone')}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={Colors.dark.textSecondary}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Text style={styles.label}>WHATSAPP OFICIAL</Text>
            <TextInput
              value={form.whatsapp}
              onChangeText={setField('whatsapp')}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={Colors.dark.textSecondary}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>CIUDAD</Text>
                <TextInput
                  value={form.city}
                  onChangeText={setField('city')}
                  placeholder="Ej. Miami"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>ESTADO</Text>
                <TextInput
                  value={form.state}
                  onChangeText={setField('state')}
                  placeholder="Ej. FL"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>NMLS ID</Text>
                <TextInput
                  value={form.nmlsId}
                  onChangeText={setField('nmlsId')}
                  placeholder="Ej. NMLS 1234567"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>N.º DE LICENCIA</Text>
                <TextInput
                  value={form.licenseNumber}
                  onChangeText={setField('licenseNumber')}
                  placeholder="Opcional"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.label}>ESPECIALIDADES (SEPARADAS POR COMA)</Text>
            <TextInput
              value={form.specialtiesText}
              onChangeText={setField('specialtiesText')}
              placeholder="Ej. MCA, Crédito Comercial, SBA, Hipotecas"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
            />

            <Text style={styles.label}>SLUG DE REFERIDO</Text>
            <TextInput
              value={form.referralSlug}
              onChangeText={setField('referralSlug')}
              placeholder="tu-nombre-o-agencia"
              placeholderTextColor={Colors.dark.textSecondary}
              autoCapitalize="none"
              style={styles.input}
            />

            <Text style={styles.label}>BIOGRAFÍA / PRESENTACIÓN COMERCIAL</Text>
            <TextInput
              value={form.bio}
              onChangeText={setField('bio')}
              placeholder="Describe tu experiencia como broker y los servicios que ofreces..."
              placeholderTextColor={Colors.dark.textSecondary}
              multiline
              style={[styles.input, styles.textArea]}
            />

            {!!saveError && <Text style={styles.saveError}>{saveError}</Text>}
            {!!saveMessage && <Text style={styles.saveMessage}>{saveMessage}</Text>}

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
              {saving ? (
                <ActivityIndicator color={Colors.dark.background} />
              ) : (
                <Text style={styles.saveText}>GUARDAR PERFIL</Text>
              )}
            </TouchableOpacity>
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
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800', flex: 1 },
  loader: { marginTop: 40 },
  error: { color: Colors.dark.danger, textAlign: 'center', marginTop: 40, fontSize: 13, paddingHorizontal: 24 },
  empty: { color: Colors.dark.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 13 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
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
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  saveError: { color: Colors.dark.danger, fontSize: 12, marginTop: 12 },
  saveMessage: { color: Colors.dark.success, fontSize: 12, marginTop: 12 },
  saveButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: { color: Colors.dark.background, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});
