import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { EMPTY_QUALIFIER_INPUTS, QualifierInputs, QualifierProduct, dti, fmt, qualify } from '@/lib/qualifier';

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

function ChipSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function probTier(prob: number): { bg: string; label: string } {
  if (prob >= 75) return { bg: Colors.dark.success, label: 'Alta' };
  if (prob >= 40) return { bg: Colors.dark.gold, label: 'Media' };
  if (prob > 0) return { bg: Colors.dark.danger, label: 'Baja' };
  return { bg: Colors.dark.border, label: 'No califica' };
}

function FactorIcon({ t }: { t: 'pass' | 'warn' | 'fail' }) {
  if (t === 'pass') return <Ionicons name="checkmark-circle" size={13} color={Colors.dark.success} />;
  if (t === 'warn') return <Ionicons name="warning" size={13} color={Colors.dark.gold} />;
  return <Ionicons name="close-circle" size={13} color={Colors.dark.danger} />;
}

export default function CalificadorScreen() {
  const [inputs, setInputs] = useState<QualifierInputs>(EMPTY_QUALIFIER_INPUTS);
  const [results, setResults] = useState<QualifierProduct[] | null>(null);
  const [error, setError] = useState('');

  const set = <K extends keyof QualifierInputs>(key: K, value: QualifierInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const setNumber = (key: keyof QualifierInputs, text: string) => {
    const n = parseFloat(text);
    set(key, (Number.isNaN(n) ? 0 : n) as QualifierInputs[typeof key]);
  };

  const handleQualify = () => {
    if (!inputs.score && !inputs.income && !inputs.monthlyDeposits) {
      setError('Ingresa al menos el puntaje de crédito, ingreso mensual o depósitos bancarios.');
      return;
    }
    setError('');
    setResults(qualify(inputs));
  };

  const handleReset = () => {
    setInputs(EMPTY_QUALIFIER_INPUTS);
    setResults(null);
    setError('');
  };

  if (results) {
    const qualified = results.filter((p) => p.prob > 0);
    const top = results.filter((p) => p.prob >= 75);
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.resultsHeader}>
            <View style={styles.flexShrink}>
              <Text style={styles.title}>{qualified.length} productos evaluados</Text>
              <Text style={styles.subtitle}>{top.length} con alta probabilidad</Text>
            </View>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Ionicons name="arrow-back" size={14} color={Colors.dark.textSecondary} />
              <Text style={styles.resetButtonText}>Nuevo cliente</Text>
            </TouchableOpacity>
          </View>

          {results.map((p) => {
            const tier = probTier(p.prob);
            const amtStr = p.min > 0 && p.max > 0 ? `${fmt(p.min)} — ${fmt(p.max)}` : 'Depende del perfil';
            return (
              <View key={p.name} style={styles.productCard}>
                <View style={[styles.productHeader, { backgroundColor: p.color }]}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <View style={styles.productProbWrap}>
                    <Text style={styles.productProb}>{p.prob}%</Text>
                    <Text style={styles.productProbLabel}>PROBABILIDAD</Text>
                  </View>
                </View>
                <View style={styles.productBody}>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${p.prob}%`, backgroundColor: tier.bg }]} />
                  </View>
                  <Text style={styles.amountLabel}>MONTO ESTIMADO</Text>
                  <Text style={styles.amountValue}>{amtStr}</Text>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarLabel}>AVATAR DEL CLIENTE IDEAL</Text>
                    <Text style={styles.avatarText}>{p.avatar}</Text>
                  </View>
                  <View style={styles.factorsList}>
                    {p.factors.map((f, i) => (
                      <View key={i} style={styles.factorRow}>
                        <FactorIcon t={f.t} />
                        <Text style={styles.factorText}>{f.txt}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.noteBox}>
                    <Text style={styles.noteText}>📋 {p.note}</Text>
                  </View>
                </View>
              </View>
            );
          })}

          <Text style={styles.disclaimer}>
            ⚠️ Esta herramienta es una estimación basada en criterios generales de elegibilidad. Los lenders siempre
            realizarán su propio proceso de underwriting adicional. Los resultados no garantizan aprobación.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Calificador de Clientes</Text>
        <Text style={styles.subtitle}>Ingresa el perfil del cliente para ver a qué productos de financiamiento califica.</Text>

        <Text style={styles.label}>PUNTAJE DE CRÉDITO (FICO)</Text>
        <TextInput
          value={inputs.score ? String(inputs.score) : ''}
          onChangeText={(t) => setNumber('score', t)}
          keyboardType="numeric"
          placeholder="ej. 680"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>ANTIGÜEDAD DEL CRÉDITO (AÑOS)</Text>
        <TextInput
          value={inputs.creditAge ? String(inputs.creditAge) : ''}
          onChangeText={(t) => setNumber('creditAge', t)}
          keyboardType="numeric"
          placeholder="ej. 4"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>¿TIENE NEGOCIO REGISTRADO?</Text>
        <ChipSelect
          value={inputs.hasBiz}
          onChange={(v) => set('hasBiz', v)}
          options={[
            { value: 'si', label: 'Sí — LLC/Corp' },
            { value: 'no', label: 'No — informal' },
          ]}
        />

        <Text style={styles.label}>TIEMPO EN NEGOCIO (MESES)</Text>
        <TextInput
          value={inputs.bizAge ? String(inputs.bizAge) : ''}
          onChangeText={(t) => setNumber('bizAge', t)}
          keyboardType="numeric"
          placeholder="ej. 18"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>DEPÓSITOS MENSUALES PROMEDIO ($)</Text>
        <TextInput
          value={inputs.monthlyDeposits ? String(inputs.monthlyDeposits) : ''}
          onChangeText={(t) => setNumber('monthlyDeposits', t)}
          keyboardType="numeric"
          placeholder="ej. 25000"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>DÍAS NEGATIVOS EN BANCO POR MES</Text>
        <TextInput
          value={inputs.negDays ? String(inputs.negDays) : ''}
          onChangeText={(t) => setNumber('negDays', t)}
          keyboardType="numeric"
          placeholder="ej. 2"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>¿TIENE DEUDAS ACTIVAS DE MCA?</Text>
        <ChipSelect
          value={inputs.mcaStack}
          onChange={(v) => set('mcaStack', v)}
          options={[
            { value: 'no', label: 'No' },
            { value: '1', label: '1 activo' },
            { value: '2+', label: '2+ activos' },
          ]}
        />

        <Text style={styles.label}>INGRESO BRUTO MENSUAL PERSONAL ($)</Text>
        <TextInput
          value={inputs.income ? String(inputs.income) : ''}
          onChangeText={(t) => setNumber('income', t)}
          keyboardType="numeric"
          placeholder="ej. 6000"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>DEUDAS MENSUALES (AUTO, TARJETAS, ETC.) ($)</Text>
        <TextInput
          value={inputs.debts ? String(inputs.debts) : ''}
          onChangeText={(t) => setNumber('debts', t)}
          keyboardType="numeric"
          placeholder="ej. 800"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.input}
        />
        {inputs.income > 0 && (
          <Text style={styles.dtiHint}>DTI actual: {dti(inputs).toFixed(0)}%</Text>
        )}

        <Text style={styles.label}>TIPO DE INGRESO PERSONAL</Text>
        <ChipSelect
          value={inputs.incomeType}
          onChange={(v) => set('incomeType', v)}
          options={[
            { value: 'w2', label: 'W-2' },
            { value: '1099', label: '1099' },
            { value: 'mixto', label: 'Mixto' },
            { value: 'ninguno', label: 'Sin ingreso' },
          ]}
        />

        <Text style={styles.label}>AÑOS EN EL MISMO EMPLEO/CAMPO</Text>
        <TextInput
          value={inputs.jobYears ? String(inputs.jobYears) : ''}
          onChangeText={(t) => setNumber('jobYears', t)}
          keyboardType="numeric"
          placeholder="ej. 3"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>¿TIENE SSN O ITIN?</Text>
        <ChipSelect
          value={inputs.idType}
          onChange={(v) => set('idType', v)}
          options={[
            { value: 'ssn', label: 'SSN' },
            { value: 'itin', label: 'ITIN' },
            { value: 'ninguno', label: 'Ninguno' },
          ]}
        />

        <Text style={styles.label}>¿TIENE PROPIEDAD / ACTIVOS?</Text>
        <ChipSelect
          value={inputs.hasAssets}
          onChange={(v) => set('hasAssets', v)}
          options={[
            { value: 'si', label: 'Sí' },
            { value: 'no', label: 'No' },
          ]}
        />

        <Text style={styles.label}>MONTO QUE EL CLIENTE NECESITA ($)</Text>
        <TextInput
          value={inputs.needed ? String(inputs.needed) : ''}
          onChangeText={(t) => setNumber('needed', t)}
          keyboardType="numeric"
          placeholder="ej. 50000"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>¿TERMINA EL MES POSITIVO EN BANCO?</Text>
        <ChipSelect
          value={inputs.monthPositive}
          onChange={(v) => set('monthPositive', v)}
          options={[
            { value: 'si', label: 'Siempre' },
            { value: 'aveces', label: 'A veces' },
            { value: 'no', label: 'Casi nunca' },
          ]}
        />

        <Text style={styles.label}>PROPÓSITO DEL FINANCIAMIENTO</Text>
        <ChipSelect
          value={inputs.purpose}
          onChange={(v) => set('purpose', v)}
          options={[
            { value: 'capital', label: 'Capital de trabajo' },
            { value: 'expansion', label: 'Expansión' },
            { value: 'equipo', label: 'Equipo' },
            { value: 'deudas', label: 'Consolidar deudas' },
            { value: 'personal', label: 'Personal' },
            { value: 'casa', label: 'Compra de casa' },
            { value: 'inversion', label: 'Inversión' },
          ]}
        />

        <Text style={styles.label}>¿TIENE BANCARROTA RECIENTE? (ÚLTIMOS 3 AÑOS)</Text>
        <ChipSelect
          value={inputs.bankruptcy}
          onChange={(v) => set('bankruptcy', v)}
          options={[
            { value: 'no', label: 'No' },
            { value: 'si', label: 'Sí' },
          ]}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.qualifyButton} onPress={handleQualify} activeOpacity={0.85}>
          <Text style={styles.qualifyButtonText}>🔍 CALIFICAR AL CLIENTE</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { color: Colors.dark.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 10 },
  label: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: Colors.dark.text,
    fontSize: 14,
  },
  dtiHint: { color: Colors.dark.accent, fontSize: 11, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.dark.backgroundElement,
  },
  chipActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  chipText: { color: Colors.dark.textSecondary, fontSize: 11.5, fontWeight: '600' },
  chipTextActive: { color: '#000', fontWeight: '800' },
  error: { color: Colors.dark.danger, fontSize: 12, marginTop: 16 },
  qualifyButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  qualifyButtonText: { color: '#000', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },

  flexShrink: { flexShrink: 1 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resetButtonText: { color: Colors.dark.textSecondary, fontSize: 11, fontWeight: '700' },
  productCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  productName: { color: Colors.dark.background, fontSize: 13, fontWeight: '700', flex: 1, marginRight: 8 },
  productProbWrap: { alignItems: 'flex-end' },
  productProb: { color: Colors.dark.background, fontSize: 20, fontWeight: '900' },
  productProbLabel: { color: Colors.dark.background, fontSize: 8, letterSpacing: 1 },
  productBody: { padding: 14 },
  barBg: { height: 6, backgroundColor: Colors.dark.backgroundSelected, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  barFill: { height: '100%', borderRadius: 4 },
  amountLabel: { color: Colors.dark.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  amountValue: { color: Colors.dark.text, fontSize: 18, fontWeight: '900', marginBottom: 10 },
  avatarBox: { backgroundColor: Colors.dark.backgroundSelected, borderRadius: 8, padding: 10, marginBottom: 10 },
  avatarLabel: { color: Colors.dark.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 3 },
  avatarText: { color: Colors.dark.text, fontSize: 11, lineHeight: 16 },
  factorsList: { gap: 5, marginBottom: 10 },
  factorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  factorText: { color: Colors.dark.textSecondary, fontSize: 11, flex: 1, lineHeight: 15 },
  noteBox: { backgroundColor: Colors.dark.backgroundSelected, borderRadius: 8, padding: 10 },
  noteText: { color: Colors.dark.textSecondary, fontSize: 10.5, fontStyle: 'italic', lineHeight: 15 },
  disclaimer: { color: Colors.dark.textSecondary, fontSize: 9.5, textAlign: 'center', marginTop: 10, lineHeight: 14 },
});
