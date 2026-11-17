import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';

export function isTaxOfficePaywall(status: number, errorMessage?: string): boolean {
  return status === 403 && Boolean(errorMessage && errorMessage.includes('Oficina Virtual E360 no está activa'));
}

export function TaxOfficeUpsellView() {
  return (
    <View style={styles.upsellBox}>
      <View style={styles.upsellIconWrap}>
        <Ionicons name="lock-closed" size={32} color={Colors.dark.gold} />
      </View>
      <Text style={styles.upsellTitle}>Oficina Virtual E360</Text>
      <Text style={styles.upsellText}>Esta función requiere Oficina Virtual E360 activa</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  upsellBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  upsellIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.dark.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  upsellTitle: { color: Colors.dark.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  upsellText: { color: Colors.dark.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
