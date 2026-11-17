import { ComponentProps, useCallback, useEffect, useState } from 'react';
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
import { Href, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';
import { isTaxOfficePaywall, TaxOfficeUpsellView } from '@/components/tax-office-upsell';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface OficinaMenuItem {
  title: string;
  description: string;
  icon: IconName;
  href: Href;
}

const OFICINA_ITEMS: OficinaMenuItem[] = [
  { title: 'Dashboard', description: 'KPIs de casos, volumen y facturación', icon: 'stats-chart', href: '/oficina/dashboard' as Href },
  { title: 'Casos', description: 'Declaraciones fiscales y avance de etapa', icon: 'folder-open', href: '/oficina/casos' as Href },
  { title: 'Clientes', description: 'Directorio de clientes de impuestos', icon: 'people', href: '/oficina/clientes' as Href },
  { title: 'Workflow', description: 'Pipeline de prospectos por etapa', icon: 'git-branch', href: '/oficina/workflow' as Href },
  { title: 'Tareas', description: 'Pendientes operativos de la oficina', icon: 'checkbox', href: '/oficina/tareas' as Href },
  { title: 'Citas', description: 'Agenda de consultas con clientes', icon: 'calendar', href: '/oficina/citas' as Href },
  { title: 'Facturación', description: 'Facturas emitidas, cobros y estados', icon: 'receipt', href: '/oficina/facturas' as Href },
  { title: 'Comisiones', description: 'Desglose de retornos y splits por preparador', icon: 'cash', href: '/oficina/comisiones' as Href },
  { title: 'Formularios', description: 'Plantillas publicadas y enlaces públicos', icon: 'document-text', href: '/oficina/formularios' as Href },
  { title: 'Automatizaciones', description: 'Reglas activas y pausadas de tu oficina', icon: 'flash', href: '/oficina/automatizaciones' as Href },
];

export default function OficinaScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [error, setError] = useState('');

  const checkAccess = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/tax-office/cases');
      const data = await res.json().catch(() => ({}));
      if (isTaxOfficePaywall(res.status, data.error)) {
        setPaywall(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'No se pudo verificar el acceso a Oficina Virtual.');
      setPaywall(false);
    } catch (err) {
      console.error('Error verificando Oficina Virtual:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      checkAccess().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [checkAccess]);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkAccess();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Oficina Virtual</Text>
        <Text style={styles.subtitle}>Gestión integral de tu oficina de impuestos E360.</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : paywall ? (
        <TaxOfficeUpsellView />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
        >
          {OFICINA_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(item.href)}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={20} color={Colors.dark.accent} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { color: Colors.dark.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
  loader: { marginTop: 40 },
  error: { color: Colors.dark.danger, textAlign: 'center', marginTop: 40, fontSize: 13, paddingHorizontal: 24 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.backgroundSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { color: Colors.dark.text, fontSize: 14, fontWeight: '700' },
  cardDescription: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
});
