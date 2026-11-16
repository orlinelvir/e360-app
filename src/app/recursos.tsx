import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { GUIDES, GuideEntry } from '@/lib/guides';

export default function RecursosScreen() {
  const handleOpenGuide = (guide: GuideEntry) => {
    WebBrowser.openBrowserAsync(`https://www.emprende360.biz/api/guides/${encodeURIComponent(guide.slug)}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Recursos</Text>
          <Text style={styles.subtitle}>{GUIDES.length} guías oficiales disponibles</Text>
        </View>
      </View>

      <FlatList
        data={GUIDES}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No hay guías disponibles.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => handleOpenGuide(item)}>
            <View style={styles.iconWrap}>
              <Ionicons name="document-text-outline" size={20} color={Colors.dark.accent} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={Colors.dark.textSecondary} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  headerText: { flex: 1 },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
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
  cardDescription: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 3, lineHeight: 17 },
});
