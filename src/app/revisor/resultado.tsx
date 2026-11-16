import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { getLastCreditAnalysisResult } from './index';

export default function RevisorResultadoScreen() {
  const result = getLastCreditAnalysisResult();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Resultado del Análisis</Text>
      </View>

      {!result ? (
        <Text style={styles.empty}>No hay un análisis cargado todavía. Regresa y analiza un reporte.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {result.notes.length > 0 && (
            <View style={styles.notesContainer}>
              {result.notes.map((note, idx) => (
                <View key={idx} style={styles.noteBox}>
                  <Ionicons name="warning-outline" size={18} color={Colors.dark.gold} />
                  <Text style={styles.noteText}>{note}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>PUNTAJES POR BURÓ</Text>
          {result.analysis.scores.length === 0 ? (
            <Text style={styles.emptySection}>No se detectaron puntajes explícitos en las páginas enviadas.</Text>
          ) : (
            <View style={styles.scoresRow}>
              {result.analysis.scores.map((s, idx) => (
                <View key={`${s.buro}-${idx}`} style={styles.scoreCard}>
                  <Text style={styles.scoreBuro}>{s.buro}</Text>
                  <Text style={styles.scoreValue}>{s.score ?? 'N/D'}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>RESUMEN PARA EL BROKER</Text>
          <View style={styles.card}>
            <Text style={styles.summaryText}>{result.analysis.resumen_para_el_broker}</Text>
          </View>

          <Text style={styles.sectionTitle}>HALLAZGOS Y PROBLEMAS ({result.analysis.problemas.length})</Text>
          {result.analysis.problemas.length === 0 ? (
            <Text style={styles.emptySection}>No se detectaron cuentas negativas o problemas relevantes.</Text>
          ) : (
            result.analysis.problemas.map((prob, idx) => (
              <View key={idx} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {prob.acreedor || 'Cuenta'}
                    {prob.cuenta_ultimos4 ? ` · ••••${prob.cuenta_ultimos4}` : ''}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      { borderColor: prob.es_negativo ? Colors.dark.danger : Colors.dark.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: prob.es_negativo ? Colors.dark.danger : Colors.dark.accent },
                      ]}
                    >
                      {prob.tipo}
                    </Text>
                  </View>
                </View>

                {prob.buros?.length > 0 && (
                  <Text style={styles.buroList}>Burós: {prob.buros.join(', ')}</Text>
                )}
                {!!prob.detalle && <Text style={styles.detailText}>{prob.detalle}</Text>}
                {!!prob.accion && <Text style={styles.actionText}>Acción sugerida: {prob.accion}</Text>}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800', flex: 1 },
  empty: { color: Colors.dark.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 13, paddingHorizontal: 24 },
  emptySection: { color: Colors.dark.textSecondary, fontSize: 12, marginBottom: 8 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  notesContainer: { gap: 8, marginBottom: 4 },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.dark.backgroundSelected,
    borderWidth: 1,
    borderColor: Colors.dark.gold,
    borderRadius: 12,
    padding: 12,
  },
  noteText: { color: Colors.dark.gold, fontSize: 12, lineHeight: 17, flex: 1 },
  sectionTitle: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 10 },
  scoresRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  scoreCard: {
    flex: 1,
    minWidth: 96,
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
    alignItems: 'center',
  },
  scoreBuro: { color: Colors.dark.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  scoreValue: { color: Colors.dark.accent, fontSize: 22, fontWeight: '900', marginTop: 4 },
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
    gap: 6,
  },
  summaryText: { color: Colors.dark.text, fontSize: 13, lineHeight: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { color: Colors.dark.text, fontSize: 14, fontWeight: '700', flex: 1 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  buroList: { color: Colors.dark.textSecondary, fontSize: 11, fontWeight: '600' },
  detailText: { color: Colors.dark.textSecondary, fontSize: 12, lineHeight: 18 },
  actionText: { color: Colors.dark.accent, fontSize: 12, fontWeight: '600', marginTop: 2 },
});
