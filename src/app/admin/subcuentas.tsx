import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';

interface LocationItem {
  id: string;
  name: string;
  state: string;
  country: string;
  timezone: string;
  email: string;
  phone: string;
}

export default function AdminSubcuentasScreen() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLocations = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/admin/locations');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las subcuentas.');
      setLocations(data.locations || []);
    } catch (err) {
      console.error('Error cargando subcuentas GHL:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchLocations().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchLocations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLocations();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Subcuentas GHL</Text>
          <Text style={styles.subtitle}>{locations.length} ubicaciones activas</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={locations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay subcuentas registradas.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardId}>ID: {item.id}</Text>
              {!!(item.email || item.phone) && (
                <Text style={styles.cardMeta}>
                  {[item.email, item.phone].filter(Boolean).join(' · ')}
                </Text>
              )}
              {!!(item.state || item.country || item.timezone) && (
                <Text style={styles.cardMeta}>
                  {[item.state, item.country, item.timezone].filter(Boolean).join(' · ')}
                </Text>
              )}
            </View>
          )}
        />
      )}
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
  error: { color: Colors.dark.danger, textAlign: 'center', marginTop: 40, fontSize: 13, paddingHorizontal: 24 },
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
  cardName: { color: Colors.dark.text, fontSize: 14, fontWeight: '700' },
  cardId: { color: Colors.dark.accent, fontSize: 11, fontWeight: '600' },
  cardMeta: { color: Colors.dark.textSecondary, fontSize: 12 },
});
