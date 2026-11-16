import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';
import { pickDocumentOrPhoto } from '@/lib/pickFile';

// GET /api/broker/clients/documents?clientId=… — downloadUrl es una URL
// firmada que expira en 15 min: nunca se guarda, se pide de nuevo al abrir.
interface CaseDocument {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedByName: string;
  createdAt: string;
  downloadUrl: string | null;
}

// Mismos límites que valida el backend (documents/route.ts) — se revisan aquí
// primero para no gastar la subida completa en un archivo que el servidor va a rechazar.
const MAX_DOCUMENT_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDate(iso?: string) {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ClienteDocumentosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [openingId, setOpeningId] = useState<string | null>(null);

  const loadDocuments = useCallback(async (): Promise<CaseDocument[]> => {
    const res = await hubFetch(`/api/broker/clients/documents?clientId=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los documentos.');
    return data.documents || [];
  }, [id]);

  const fetchDocuments = useCallback(async () => {
    if (!user || !id) return;
    setError('');
    try {
      setDocuments(await loadDocuments());
    } catch (err) {
      console.error('Error cargando documentos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [user, id, loadDocuments]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchDocuments().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDocuments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
  };

  const handleUpload = async () => {
    setUploadError('');
    const file = await pickDocumentOrPhoto();
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('El archivo debe ser una imagen (JPG/PNG/WEBP) o PDF.');
      return;
    }
    if (file.size !== undefined && file.size > MAX_DOCUMENT_SIZE) {
      setUploadError(`El archivo pesa ${formatSize(file.size)} y no puede superar 8 MB.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('clientId', id);
      // En React Native, FormData acepta { uri, name, type } como archivo.
      formData.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);

      const res = await hubFetch('/api/broker/clients/documents', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo subir el documento.');
      await fetchDocuments();
    } catch (err) {
      console.error('Error subiendo documento:', err);
      setUploadError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setUploading(false);
    }
  };

  const handleOpen = async (doc: CaseDocument) => {
    setOpeningId(doc.id);
    try {
      // Se vuelve a pedir la lista para obtener una URL firmada recién generada
      // (la que ya tenemos pudo haber expirado).
      const fresh = await loadDocuments();
      setDocuments(fresh);
      const url = fresh.find((d) => d.id === doc.id)?.downloadUrl;
      if (!url) {
        Alert.alert('Documento no disponible', 'No se pudo generar el enlace de este documento. Intenta de nuevo más tarde.');
        return;
      }
      await WebBrowser.openBrowserAsync(url);
    } catch (err) {
      console.error('Error abriendo documento:', err);
      Alert.alert('No se pudo abrir', err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Documentos</Text>
          <Text style={styles.subtitle}>{documents.length} {documents.length === 1 ? 'documento' : 'documentos'}</Text>
        </View>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={uploading} activeOpacity={0.85}>
          {uploading ? (
            <ActivityIndicator size="small" color={Colors.dark.background} />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={14} color={Colors.dark.background} />
              <Text style={styles.uploadText}>Subir</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {!!uploadError && <Text style={styles.uploadError}>{uploadError}</Text>}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>Este cliente todavía no tiene documentos.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => handleOpen(item)} disabled={openingId !== null}>
              <Ionicons
                name={item.contentType === 'application/pdf' ? 'document-text' : 'image'}
                size={22}
                color={Colors.dark.accent}
              />
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>{item.fileName}</Text>
                <Text style={styles.cardMeta}>
                  {formatSize(item.size)} · {item.uploadedByName}
                  {formatDate(item.createdAt) ? ` · ${formatDate(item.createdAt)}` : ''}
                </Text>
              </View>
              {openingId === item.id ? (
                <ActivityIndicator size="small" color={Colors.dark.accent} />
              ) : (
                <Ionicons name="open-outline" size={18} color={Colors.dark.textSecondary} />
              )}
            </TouchableOpacity>
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 72,
    backgroundColor: Colors.dark.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  uploadText: { color: Colors.dark.background, fontSize: 11, fontWeight: '800' },
  uploadError: { color: Colors.dark.danger, fontSize: 12, paddingHorizontal: 20, paddingBottom: 8 },
  loader: { marginTop: 40 },
  error: { color: Colors.dark.danger, textAlign: 'center', marginTop: 40, fontSize: 13, paddingHorizontal: 24 },
  empty: { color: Colors.dark.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 13 },
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
  cardBody: { flex: 1 },
  cardName: { color: Colors.dark.text, fontSize: 13, fontWeight: '700' },
  cardMeta: { color: Colors.dark.textSecondary, fontSize: 11, marginTop: 3 },
});
