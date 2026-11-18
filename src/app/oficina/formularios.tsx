import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';
import { isTaxOfficePaywall, TaxOfficeUpsellView } from '@/components/tax-office-upsell';

interface TaxFormTemplate {
  id: string;
  name: string;
  status: 'draft' | 'published';
  version: number;
  secureToken: string;
}

export default function OficinaFormulariosScreen() {
  const [forms, setForms] = useState<TaxFormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [error, setError] = useState('');

  const fetchForms = useCallback(async () => {
    setError('');
    try {
      const res = await hubFetch('/api/tax-office/forms');
      const data = await res.json().catch(() => ({}));
      if (isTaxOfficePaywall(res.status, data.error)) {
        setPaywall(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los formularios.');
      setPaywall(false);
      setForms(data.forms || []);
    } catch (err) {
      console.error('Error cargando formularios de Oficina Virtual:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchForms().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchForms]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchForms();
    setRefreshing(false);
  };

  const handleCopyPublicLink = async (token: string) => {
    const url = `https://www.emprende360.biz/tax-forms/${token}`;
    try {
      await Clipboard.setStringAsync(url);
      Alert.alert('Enlace copiado', url);
    } catch (err) {
      console.error('Error copiando enlace público:', err);
      Alert.alert('Enlace público', url);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Formularios</Text>
          {!paywall && <Text style={styles.subtitle}>{forms.length} plantillas</Text>}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : paywall ? (
        <TaxOfficeUpsellView />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={forms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay formularios creados en tu oficina.</Text>}
          renderItem={({ item }) => {
            const isPublished = item.status === 'published' && Boolean(item.secureToken);
            const publicUrl = `https://www.emprende360.biz/tax-forms/${item.secureToken}`;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <View
                    style={[
                      styles.badge,
                      { borderColor: isPublished ? Colors.dark.success : Colors.dark.textSecondary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: isPublished ? Colors.dark.success : Colors.dark.textSecondary },
                      ]}
                    >
                      {isPublished ? 'PUBLICADO' : 'BORRADOR'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>Versión {item.version || 1}</Text>

                {isPublished && (
                  <>
                    <Text selectable style={styles.urlText} numberOfLines={1}>
                      {publicUrl}
                    </Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      activeOpacity={0.85}
                      onPress={() => handleCopyPublicLink(item.secureToken)}
                    >
                      <Ionicons name="copy-outline" size={14} color={Colors.dark.background} />
                      <Text style={styles.copyButtonText}>Copiar link público</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          }}
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
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardName: { color: Colors.dark.text, fontSize: 14, fontWeight: '700', flex: 1 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  cardMeta: { color: Colors.dark.textSecondary, fontSize: 12 },
  urlText: { color: Colors.dark.accent, fontSize: 11 },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 2,
  },
  copyButtonText: { color: Colors.dark.background, fontSize: 11, fontWeight: '800' },
});
