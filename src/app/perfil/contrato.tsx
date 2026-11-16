import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';

const CONTRACT_FORM_URL = 'https://api.leadconnectorhq.com/widget/form/j8cbC01b5t6UhaDbAusL';

export default function MiContratoScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ contractSignedAt?: string; contractSignedSelfReported?: string }>();

  const [contractSignedAt, setContractSignedAt] = useState(params.contractSignedAt || '');
  const [selfReported, setSelfReported] = useState(params.contractSignedSelfReported === 'true');
  const [loading, setLoading] = useState(!params.contractSignedAt && params.contractSignedSelfReported === undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [reporting, setReporting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchContractStatus = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      const res = await hubFetch('/api/broker/profile');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el estado del contrato.');
      const p = data.profile || {};
      setContractSignedAt(p.contractSignedAt || '');
      setSelfReported(Boolean(p.contractSignedSelfReported));
    } catch (err) {
      console.error('Error cargando estado de contrato:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContractStatus().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchContractStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContractStatus();
    setRefreshing(false);
  };

  const handleReportSigned = async () => {
    setReporting(true);
    setError('');
    setActionMessage('');
    try {
      const res = await hubFetch('/api/broker/profile', {
        method: 'POST',
        body: JSON.stringify({ contractSignedSelfReported: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar tu aviso.');
      setSelfReported(true);
      setActionMessage('Gracias — nuestro equipo confirmará tu firma en breve.');
    } catch (err) {
      console.error('Error reportando firma de contrato:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setReporting(false);
    }
  };

  const statusColor = contractSignedAt
    ? Colors.dark.success
    : selfReported
      ? Colors.dark.gold
      : Colors.dark.textSecondary;
  const statusLabel = contractSignedAt
    ? 'FIRMADO'
    : selfReported
      ? 'PENDIENTE DE CONFIRMAR (NO OFICIAL)'
      : 'PENDIENTE DE FIRMA';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mi Contrato</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Mi Contrato de Servicios</Text>
              <View style={[styles.badge, { borderColor: statusColor }]}>
                <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>

            {contractSignedAt ? (
              <Text style={styles.bodyText}>
                Tu contrato de servicios quedó firmado y confirmado oficialmente el{' '}
                {new Date(contractSignedAt).toLocaleDateString('es-MX')}. Si necesitas revisarlo de nuevo o hacer una
                corrección, escríbenos a info@emprende360.biz.
              </Text>
            ) : (
              <>
                <Text style={styles.bodyText}>
                  Firma tu contrato de servicios en el formulario oficial. Una vez enviado, nuestro equipo confirma tu
                  firma.
                </Text>

                {selfReported && (
                  <View style={styles.noticeBox}>
                    <Ionicons name="information-circle-outline" size={18} color={Colors.dark.gold} />
                    <Text style={styles.noticeText}>
                      Aviso informativo (no oficial): ya marcaste que firmaste el contrato. La firma oficial queda
                      confirmada cuando nuestro equipo o el sistema verifica el documento.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.formButton}
                  activeOpacity={0.85}
                  onPress={() => WebBrowser.openBrowserAsync(CONTRACT_FORM_URL)}
                >
                  <Ionicons name="document-text-outline" size={18} color={Colors.dark.accent} />
                  <Text style={styles.formButtonText}>Abrir formulario de contrato</Text>
                  <Ionicons name="open-outline" size={16} color={Colors.dark.accent} />
                </TouchableOpacity>

                {!selfReported && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.85}
                    onPress={handleReportSigned}
                    disabled={reporting}
                  >
                    {reporting ? (
                      <ActivityIndicator color={Colors.dark.background} />
                    ) : (
                      <Text style={styles.primaryButtonText}>YA FIRMÉ</Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}

            {!!error && <Text style={styles.error}>{error}</Text>}
            {!!actionMessage && <Text style={styles.message}>{actionMessage}</Text>}
          </View>

          <View style={styles.guaranteeCard}>
            <View style={styles.guaranteeHeader}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.dark.accent} />
              <Text style={styles.guaranteeTitle}>GARANTÍA DE DEVOLUCIÓN DE 90 DÍAS ($750)</Text>
            </View>
            <Text style={styles.bullet}>
              • El plazo de 90 días empieza a contar desde que se recibe el pago completo.
            </Text>
            <Text style={styles.bullet}>
              • Debes completar todas las sesiones de entrenamiento y seguir el proceso/sistemas de Emprende 360 al pie
              de la letra.
            </Text>
            <Text style={styles.bullet}>
              • Solo aplica si, cumpliendo lo anterior, no generaste en ingresos al menos el monto invertido.
            </Text>
            <Text style={styles.bullet}>
              • No hay reembolso antes de los 90 días, ni en planes de pago con el segundo pago incompleto.
            </Text>
            <Text style={styles.guaranteeFootnote}>
              Este resumen es solo orientativo — el contrato firmado es el documento legal vinculante. Es una garantía
              poco común: hasta hoy, nadie ha calificado para ella.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800', flex: 1 },
  loader: { marginTop: 40 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: { color: Colors.dark.text, fontSize: 15, fontWeight: '700' },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  bodyText: { color: Colors.dark.textSecondary, fontSize: 13, lineHeight: 19 },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.dark.backgroundSelected,
    borderWidth: 1,
    borderColor: Colors.dark.gold,
    borderRadius: 12,
    padding: 12,
  },
  noticeText: { color: Colors.dark.gold, fontSize: 12, lineHeight: 17, flex: 1 },
  formButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  formButtonText: { color: Colors.dark.accent, fontSize: 13, fontWeight: '700', flex: 1 },
  primaryButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: Colors.dark.background, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  error: { color: Colors.dark.danger, fontSize: 12 },
  message: { color: Colors.dark.success, fontSize: 12 },
  guaranteeCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
    gap: 8,
  },
  guaranteeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  guaranteeTitle: { color: Colors.dark.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, flex: 1 },
  bullet: { color: Colors.dark.textSecondary, fontSize: 12, lineHeight: 18 },
  guaranteeFootnote: { color: Colors.dark.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 4 },
});
