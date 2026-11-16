import { ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  title: string;
  description: string;
  icon: IconName;
  // Estas pantallas (A5, A9, A10, B13 del roadmap) se construyen en tareas
  // posteriores, así que sus rutas aún no existen en los tipos generados de
  // Expo Router. El cast a Href se puede quitar cuando cada una exista.
  href: Href;
}

export default function MasScreen() {
  const { profile } = useAuth();
  const isStaff = (profile?.role || 'broker') !== 'broker';

  const items: MenuItem[] = [
    { title: 'Mi Perfil', description: 'Tus datos, CRM y contrato', icon: 'person-circle', href: '/perfil' as Href },
    { title: 'Recursos', description: 'Biblioteca de guías', icon: 'book', href: '/recursos' as Href },
    { title: 'Revisor de Crédito IA', description: 'Analiza un reporte con la cámara', icon: 'scan', href: '/revisor' as Href },
    // Mismo criterio que Torre de Control: "broker" es el único rol sin horas registradas.
    ...(isStaff ? [{ title: 'Mis Horas', description: 'Registra tus horas trabajadas', icon: 'time' as IconName, href: '/horas' as Href }] : []),
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Más</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {items.map((item) => (
          <TouchableOpacity key={item.title} style={styles.card} activeOpacity={0.85} onPress={() => router.push(item.href)}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={22} color={Colors.dark.accent} />
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
