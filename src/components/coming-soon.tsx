import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PRÓXIMAMENTE</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  title: { color: Colors.dark.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  description: { color: Colors.dark.textSecondary, fontSize: 13, textAlign: 'center' },
  badge: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { color: Colors.dark.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
});
