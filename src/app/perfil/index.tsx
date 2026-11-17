import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { hubFetch } from '@/lib/hubApi';

interface BrokerProfileData {
  uid: string;
  displayName?: string;
  name?: string;
  email: string;
  brokerId?: string;
  phone?: string;
  whatsapp?: string;
  businessName?: string;
  tier?: string;
  city?: string;
  state?: string;
  nmlsId?: string;
  licenseNumber?: string;
  bio?: string;
  specialties?: string[];
  referralSlug?: string;
  ghlLocationId?: string;
  ghlConnected?: boolean;
  contractSignedAt?: string;
  contractSignedSelfReported?: boolean;
}

export default function MiPerfilScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<BrokerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      const res = await hubFetch('/api/broker/profile');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar tu perfil.');
      setProfile(data.profile || null);
    } catch (err) {
      console.error('Error cargando perfil:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchProfile().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const displayName = profile?.displayName || profile?.name || 'Broker E360';
  const locationText = [profile?.city, profile?.state].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mi Perfil</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.dark.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !profile ? (
        <Text style={styles.empty}>No se encontró información de perfil.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.heroInfo}>
                <View style={styles.badgeRow}>
                  <View style={styles.tierBadge}>
                    <Text style={styles.tierBadgeText}>{profile.tier || 'Junior Broker'}</Text>
                  </View>
                  <Text style={styles.brokerIdText}>ID: {profile.brokerId || 'Asignando...'}</Text>
                </View>
                <Text style={styles.heroName}>{displayName}</Text>
                <Text style={styles.heroEmail}>{profile.email || user?.email || ''}</Text>
                <Text style={styles.heroLocation}>{locationText || 'Ciudad / Estado sin especificar'}</Text>
              </View>
            </View>

            <View style={styles.bioSection}>
              <Text style={styles.sectionLabel}>BIOGRAFÍA</Text>
              <Text style={styles.bioText}>{profile.bio || 'Sin biografía configurada.'}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>CONFIGURACIÓN DE CUENTA</Text>

          <TouchableOpacity
            style={styles.navCard}
            activeOpacity={0.85}
            onPress={() => router.push('/perfil/editar' as Href)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="create-outline" size={20} color={Colors.dark.accent} />
            </View>
            <View style={styles.navBody}>
              <Text style={styles.navTitle}>Editar Perfil</Text>
              <Text style={styles.navSubtitle}>Datos comerciales, teléfono, licencias y especialidades</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.dark.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: '/perfil/crm',
                params: {
                  ghlConnected: profile.ghlConnected ? 'true' : 'false',
                  ghlLocationId: profile.ghlLocationId || '',
                },
              } as unknown as Href)
            }
          >
            <View style={styles.iconWrap}>
              <Ionicons name="git-network-outline" size={20} color={Colors.dark.accent} />
            </View>
            <View style={styles.navBody}>
              <Text style={styles.navTitle}>Subcuenta CRM (GHL)</Text>
              <Text style={styles.navSubtitle}>
                {profile.ghlConnected ? `Conectada · ${profile.ghlLocationId || 'OK'}` : 'Sin conectar'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.dark.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: '/perfil/contrato',
                params: {
                  contractSignedAt: profile.contractSignedAt || '',
                  contractSignedSelfReported: profile.contractSignedSelfReported ? 'true' : 'false',
                },
              } as unknown as Href)
            }
          >
            <View style={styles.iconWrap}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.dark.accent} />
            </View>
            <View style={styles.navBody}>
              <Text style={styles.navTitle}>Mi Contrato</Text>
              <Text style={styles.navSubtitle}>
                {profile.contractSignedAt
                  ? 'Firmado y confirmado'
                  : profile.contractSignedSelfReported
                    ? 'Autorreportado (pendiente de confirmación)'
                    : 'Garantía de 90 días y firma de contrato'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.dark.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color={Colors.dark.danger} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800', flex: 1 },
  loader: { marginTop: 40 },
  error: { color: Colors.dark.danger, textAlign: 'center', marginTop: 40, fontSize: 13, paddingHorizontal: 24 },
  empty: { color: Colors.dark.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 13 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  heroCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
    gap: 14,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.dark.background, fontSize: 24, fontWeight: '900' },
  heroInfo: { flex: 1, gap: 3 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  tierBadge: {
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tierBadgeText: { color: Colors.dark.accent, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  brokerIdText: { color: Colors.dark.textSecondary, fontSize: 11, fontWeight: '600' },
  heroName: { color: Colors.dark.text, fontSize: 18, fontWeight: '800', marginTop: 2 },
  heroEmail: { color: Colors.dark.textSecondary, fontSize: 12 },
  heroLocation: { color: Colors.dark.textSecondary, fontSize: 12 },
  bioSection: { borderTopWidth: 1, borderTopColor: Colors.dark.border, paddingTop: 12, gap: 4 },
  sectionLabel: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  bioText: { color: Colors.dark.text, fontSize: 13, lineHeight: 19 },
  sectionTitle: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 14, marginBottom: 2 },
  navCard: {
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
  navBody: { flex: 1 },
  navTitle: { color: Colors.dark.text, fontSize: 14, fontWeight: '700' },
  navSubtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 14,
  },
  logoutText: { color: Colors.dark.danger, fontSize: 13, fontWeight: '700' },
});
