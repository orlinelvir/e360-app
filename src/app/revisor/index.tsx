import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { PickedFile, pickDocumentOrPhoto } from '@/lib/pickFile';

const MAX_IMAGES = 70;

export default function RevisorCreditoScreen() {
  const [pages, setPages] = useState<PickedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!submitting) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [submitting]);

  const handleAddPage = async () => {
    setError('');
    if (pages.length >= MAX_IMAGES) {
      setError(`Solo puedes agregar un máximo de ${MAX_IMAGES} páginas por análisis.`);
      return;
    }
    const picked = await pickDocumentOrPhoto({ includeBase64: true });
    if (!picked) return;
    if (!picked.base64) {
      setError('No se pudo leer la imagen seleccionada. Intenta con otra foto.');
      return;
    }
    // Quitar prefijo data:...;base64, si viniera incluido
    const cleanBase64 = picked.base64.replace(/^data:[^;]+;base64,/, '');
    setPages((prev) => [...prev, { ...picked, base64: cleanBase64 }]);
  };

  const handleRemovePage = (index: number) => {
    setError('');
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (pages.length === 0) {
      setError('Agrega al menos una foto del reporte de crédito.');
      return;
    }
    if (pages.length > MAX_IMAGES) {
      setError(`Sube un máximo de ${MAX_IMAGES} imágenes.`);
      return;
    }

    setElapsedSeconds(0);
    setSubmitting(true);
    setError('');
    try {
      const images = pages.map((p) => ({
        mimeType: p.type || 'image/jpeg',
        data: (p.base64 || '').replace(/^data:[^;]+;base64,/, ''),
      }));

      const res = await hubFetch('/api/credit-repair/analyze-report', {
        method: 'POST',
        body: JSON.stringify({ images }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        // Mostrar mensaje literal del backend (trae los minutos de espera calculados).
        setError(data.error || 'Alcanzaste el límite de análisis por hora. Intenta más tarde.');
        return;
      }

      if (res.status === 502) {
        setError(
          data.error || 'El analizador tardó demasiado o devolvió una respuesta incompleta. Intenta de nuevo en unos segundos.',
        );
        return;
      }

      if (!res.ok || !data.analysis) {
        throw new Error(data.error || 'No se pudo analizar el reporte.');
      }

      const payload = JSON.stringify({
        analysis: data.analysis,
        notes: Array.isArray(data.notes) ? data.notes : [],
      });
      router.push({ pathname: '/revisor/resultado', params: { payload } } as unknown as Href);
    } catch (err) {
      console.error('Error analizando reporte de crédito:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al analizar el reporte.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} disabled={submitting}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Revisor de Crédito IA</Text>
          <Text style={styles.subtitle}>
            {pages.length} de {MAX_IMAGES} páginas agregadas
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPage}
          disabled={submitting || pages.length >= MAX_IMAGES}
          activeOpacity={0.85}
        >
          <Ionicons name="camera" size={16} color={Colors.dark.background} />
          <Text style={styles.addButtonText}>Agregar foto</Text>
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {submitting ? (
        <View style={styles.longLoaderBox}>
          <ActivityIndicator size="large" color={Colors.dark.accent} />
          <Text style={styles.longLoaderTitle}>Analizando reporte con IA ({elapsedSeconds}s)</Text>
          <Text style={styles.longLoaderHint}>
            Extrayendo cuentas, puntajes y hallazgos de {pages.length} {pages.length === 1 ? 'página' : 'páginas'}. Este
            proceso puede tardar hasta 3 minutos en reportes largos — no cierres esta pantalla.
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={pages}
            keyExtractor={(item, index) => `${item.uri}-${index}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.empty}>
                Toma fotos o elige imágenes de las páginas del reporte de crédito (máximo {MAX_IMAGES} páginas) para que
                la IA identifique los puntajes, cuentas negativas y plan de acción.
              </Text>
            }
            renderItem={({ item, index }) => (
              <View style={styles.card}>
                <View style={styles.pageBadge}>
                  <Text style={styles.pageBadgeText}>Pág. {index + 1}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardMeta}>{item.type}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemovePage(index)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={Colors.dark.danger} />
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, pages.length === 0 && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={pages.length === 0 || submitting}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={16} color={Colors.dark.background} />
              <Text style={styles.submitText}>ANALIZAR REPORTE ({pages.length})</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  headerText: { flex: 1 },
  title: { color: Colors.dark.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: { color: Colors.dark.background, fontSize: 11, fontWeight: '800' },
  error: { color: Colors.dark.danger, fontSize: 12, paddingHorizontal: 20, paddingBottom: 10 },
  longLoaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  longLoaderTitle: { color: Colors.dark.text, fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  longLoaderHint: { color: Colors.dark.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  empty: { color: Colors.dark.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 13, lineHeight: 19, paddingHorizontal: 16 },
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
  pageBadge: {
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pageBadgeText: { color: Colors.dark.accent, fontSize: 10, fontWeight: '800' },
  cardBody: { flex: 1 },
  cardName: { color: Colors.dark.text, fontSize: 13, fontWeight: '700' },
  cardMeta: { color: Colors.dark.textSecondary, fontSize: 11, marginTop: 2 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundElement,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    paddingVertical: 14,
  },
  submitButtonDisabled: { opacity: 0.45 },
  submitText: { color: Colors.dark.background, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});
