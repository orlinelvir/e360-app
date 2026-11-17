import { ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface AdminMenuItem {
  title: string;
  description: string;
  icon: IconName;
  href: Href;
}

const ADMIN_ITEMS: AdminMenuItem[] = [
  { title: 'Resumen', description: 'Tickets abiertos y casos recientes', icon: 'pulse', href: '/admin/resumen' as Href },
  { title: 'Casos', description: 'Master Feed con búsqueda por cliente o broker', icon: 'folder-open', href: '/admin/casos' as Href },
  { title: 'Brokers', description: 'Roster completo de brokers y volumen', icon: 'people', href: '/admin/brokers' as Href },
  { title: 'Tickets', description: 'Soporte de brokers y cambio de estado', icon: 'chatbubbles', href: '/admin/tickets' as Href },
  { title: 'Equipo & Roles', description: 'Permisos, roles y tarifas del staff', icon: 'shield-checkmark', href: '/admin/roles' as Href },
  { title: 'Catálogo de Servicios', description: 'Títulos y descripciones de servicios', icon: 'grid', href: '/admin/servicios' as Href },
  { title: 'Subcuentas GHL', description: 'Ubicaciones activas en la agencia', icon: 'git-network', href: '/admin/subcuentas' as Href },
  { title: 'Métricas', description: 'KPIs globales y volumen por vertical', icon: 'stats-chart', href: '/admin/metricas' as Href },
  { title: 'Actividad del Staff', description: 'Desempeño por ventana de días y backlog', icon: 'analytics', href: '/admin/actividad' as Href },
  { title: 'Cola de Sincronización', description: 'Casos con sync pendiente o fallido en GHL', icon: 'sync', href: '/admin/sincronizacion' as Href },
  { title: 'Nómina', description: 'Horas registradas, pago esperado y liquidación', icon: 'cash', href: '/admin/nomina' as Href },
];

export default function AdminMenuScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Torre de Control</Text>
        <Text style={styles.subtitle}>Administración y operaciones internas de E360 Hub.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {ADMIN_ITEMS.map((item) => (
          <TouchableOpacity key={item.title} style={styles.card} activeOpacity={0.85} onPress={() => router.push(item.href)}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { color: Colors.dark.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
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
