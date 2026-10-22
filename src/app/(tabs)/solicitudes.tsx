import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';
import { SERVICE_OPTIONS } from '@/lib/services';

// Mismas verticales que en /api/services/submit (lib/service-routing.ts del
// Hub web): sin confirmar el formulario oficial o adjuntar el PDF, el
// servidor rechaza la solicitud con 400 — en v1 de la app móvil (sin subida
// de archivos todavía) solo queda la opción de confirmar.
const FINANCING_SERVICE_IDS = new Set([
  'business-loan',
  'business-loan-conventional',
  'personal-loan',
  'business-credit-cards',
  'mortgage-loan',
]);

export default function SolicitudesScreen() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [service, setService] = useState(SERVICE_OPTIONS[0]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [officialFormConfirmed, setOfficialFormConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isFinancing = FINANCING_SERVICE_IDS.has(service.id);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setAmount('');
    setNotes('');
    setOfficialFormConfirmed(false);
  };

  const handleSubmit = async () => {
    if (!firstName || !email) {
      setError('Nombre y correo del cliente son requeridos.');
      return;
    }
    if (isFinancing && !officialFormConfirmed) {
      setError('Confirma que el cliente llenó el formulario oficial de E360 para continuar.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('firstName', firstName.trim());
      formData.append('lastName', lastName.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      formData.append('service', service.title);
      formData.append('serviceId', service.id);
      formData.append('amount', amount.trim());
      formData.append('notes', notes.trim());
      formData.append('officialFormConfirmed', String(officialFormConfirmed));

      const res = await hubFetch('/api/services/submit', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar la solicitud.');

      setSuccess(data.warning || `Listo — ${firstName} quedó admitido para ${service.title}.`);
      resetForm();
    } catch (err) {
      console.error('Error al someter solicitud:', err);
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Someter Solicitud</Text>
          <Text style={styles.subtitle}>Admite un cliente nuevo directo desde el celular.</Text>

          <Text style={styles.label}>SERVICIO</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setPickerOpen(true)}>
            <Text style={styles.pickerText}>{service.title}</Text>
            <Ionicons name="chevron-down" size={18} color={Colors.dark.textSecondary} />
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>NOMBRE</Text>
              <TextInput value={firstName} onChangeText={setFirstName} placeholder="Juan" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>APELLIDO</Text>
              <TextInput value={lastName} onChangeText={setLastName} placeholder="Pérez" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} />
            </View>
          </View>

          <Text style={styles.label}>CORREO</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="cliente@correo.com"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>TELÉFONO</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="(555) 555-5555"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>MONTO SOLICITADO ($)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>NOTAS</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Opcional"
            placeholderTextColor={Colors.dark.textSecondary}
            style={[styles.input, styles.notesInput]}
            multiline
          />

          {isFinancing && (
            <View style={styles.confirmRow}>
              <Switch
                value={officialFormConfirmed}
                onValueChange={setOfficialFormConfirmed}
                trackColor={{ false: Colors.dark.border, true: Colors.dark.accent }}
              />
              <Text style={styles.confirmText}>
                Confirmo que el cliente llenó el formulario oficial de E360 para esta solicitud.
              </Text>
            </View>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!success && <Text style={styles.success}>{success}</Text>}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
            {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>SOMETER SOLICITUD</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Elige un servicio</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SERVICE_OPTIONS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setService(item);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.title}</Text>
                  {item.id === service.id && <Ionicons name="checkmark" size={18} color={Colors.dark.accent} />}
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
  flex: { flex: 1 },
  scroll: { padding: 20, gap: 4 },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2, marginBottom: 16 },
  label: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 12 },
  input: {
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.dark.text,
    fontSize: 14,
    marginTop: 6,
  },
  notesInput: { minHeight: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  picker: {
    backgroundColor: Colors.dark.backgroundElement,
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
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  confirmText: { color: Colors.dark.textSecondary, fontSize: 11, flex: 1 },
  error: { color: Colors.dark.danger, fontSize: 12, marginTop: 16 },
  success: { color: Colors.dark.success, fontSize: 12, marginTop: 16 },
  submitButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: { color: '#000', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.dark.backgroundElement, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
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
});
