import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';

export default function SubcuentaCrmScreen() {
  // Reutiliza el estado cargado en A5 (Mi Perfil) sin construir un GET nuevo.
  const params = useLocalSearchParams<{ ghlConnected?: string; ghlLocationId?: string }>();
  const [connected, setConnected] = useState(params.ghlConnected === 'true');
  const [ghlLocationId, setGhlLocationId] = useState(params.ghlLocationId || '');
  const [ghlApiKey, setGhlApiKey] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    const trimmedLocId = ghlLocationId.trim();
    const trimmedApiKey = ghlApiKey.trim();

    if (!trimmedLocId || !trimmedApiKey) {
      setError('Location ID y API Key (PIT) son requeridos.');
      setMessage('');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await hubFetch('/api/broker/ghl-credentials', {
        method: 'POST',
        body: JSON.stringify({ ghlLocationId: trimmedLocId, ghlApiKey: trimmedApiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron guardar las credenciales.');
      setConnected(true);
      setGhlApiKey('');
      setMessage('Credenciales de StartPoint CRM guardadas correctamente.');
    } catch (err) {
      console.error('Error guardando credenciales CRM:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
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
        <Text style={styles.title}>Subcuenta CRM (GHL)</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusTitleRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: connected ? Colors.dark.success : Colors.dark.textSecondary },
                  ]}
                />
                <Text style={styles.statusTitle}>Subcuenta StartPoint CRM</Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { borderColor: connected ? Colors.dark.success : Colors.dark.textSecondary },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: connected ? Colors.dark.success : Colors.dark.textSecondary },
                  ]}
                >
                  {connected ? 'CONECTADA' : 'SIN CONECTAR'}
                </Text>
              </View>
            </View>
            <Text style={styles.statusDescription}>
              Vincula tu subcuenta GoHighLevel para recibir leads en tus propios embudos comerciales.
            </Text>
            <TouchableOpacity
              style={styles.externalButton}
              activeOpacity={0.85}
              onPress={() => WebBrowser.openBrowserAsync('https://app.startpoint.biz')}
            >
              <Text style={styles.externalButtonText}>Abrir StartPoint CRM</Text>
              <Ionicons name="open-outline" size={15} color={Colors.dark.accent} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>CRM LOCATION ID</Text>
          <TextInput
            value={ghlLocationId}
            onChangeText={(v) => {
              setError('');
              setMessage('');
              setGhlLocationId(v);
            }}
            placeholder="Ej. veYvJ38dK..."
            placeholderTextColor={Colors.dark.textSecondary}
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.label}>SUBACCOUNT PRIVATE TOKEN (PIT)</Text>
          <TextInput
            value={ghlApiKey}
            onChangeText={(v) => {
              setError('');
              setMessage('');
              setGhlApiKey(v);
            }}
            placeholder={connected ? 'Ingresa un nuevo token para actualizarlo' : '••••••••••••••••'}
            placeholderTextColor={Colors.dark.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving ? (
              <ActivityIndicator color={Colors.dark.background} />
            ) : (
              <Text style={styles.saveText}>GUARDAR CREDENCIALES</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800', flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  statusCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
    gap: 10,
  },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  statusTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusTitle: { color: Colors.dark.text, fontSize: 15, fontWeight: '700' },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  statusDescription: { color: Colors.dark.textSecondary, fontSize: 12, lineHeight: 18 },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
  externalButtonText: { color: Colors.dark.accent, fontSize: 12, fontWeight: '700' },
  label: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 16 },
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
  error: { color: Colors.dark.danger, fontSize: 12, marginTop: 12 },
  message: { color: Colors.dark.success, fontSize: 12, marginTop: 12 },
  saveButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: { color: Colors.dark.background, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});
