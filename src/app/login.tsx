import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';

export default function LoginScreen() {
  const { loginWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');
    try {
      await loginWithEmail(email.trim(), password);
    } catch (err) {
      console.error('Error de login:', err);
      setError('No se pudo iniciar sesión. Verifica tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    setInfo('');
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Error de login con Google:', err);
      setError('No se pudo iniciar sesión con Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Escribe tu correo arriba y vuelve a tocar "¿Olvidaste tu contraseña?".');
      return;
    }
    setResetting(true);
    setError('');
    setInfo('');
    try {
      await resetPassword(email.trim());
      setInfo(`Te enviamos un correo a ${email.trim()} para recuperar tu contraseña.`);
    } catch (err) {
      console.error('Error al recuperar contraseña:', err);
      setError('No se pudo enviar el correo de recuperación. Verifica el correo.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>E360 HUB · ACCESO EXCLUSIVO DE BROKERS</Text>
          <Text style={styles.title}>Torre de Control E360</Text>
          <Text style={styles.subtitle}>Autenticación unificada con E360 Firebase Auth & StartPoint CRM.</Text>

          <View style={styles.card}>
            <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="tu@correo.com"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
            />

            <Text style={[styles.label, styles.labelSpaced]}>CONTRASEÑA</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
            />

            {!!error && <Text style={styles.error}>{error}</Text>}
            {!!info && <Text style={styles.info}>{info}</Text>}

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>INGRESAR CON FIREBASE</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword} disabled={resetting} style={styles.forgotLink}>
              <Text style={styles.forgotLinkText}>
                {resetting ? 'Enviando...' : '¿Olvidaste tu contraseña? Recupérala aquí'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={googleLoading} activeOpacity={0.85}>
              {googleLoading ? (
                <ActivityIndicator color={Colors.dark.text} />
              ) : (
                <Text style={styles.googleButtonText}>Continuar con Google</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 6 },
  eyebrow: {
    color: Colors.dark.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: { color: Colors.dark.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 13, marginTop: 6, marginBottom: 28 },
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 20,
    gap: 6,
  },
  label: { color: Colors.dark.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  labelSpaced: { marginTop: 14 },
  input: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.dark.text,
    fontSize: 14,
    marginTop: 6,
  },
  error: { color: Colors.dark.danger, fontSize: 12, marginTop: 12 },
  info: { color: Colors.dark.success, fontSize: 12, marginTop: 12 },
  forgotLink: { marginTop: 16, alignItems: 'center' },
  forgotLinkText: { color: Colors.dark.accent, fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.dark.border, marginTop: 18, marginBottom: 4 },
  googleButton: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  googleButtonText: { color: Colors.dark.text, fontWeight: '700', fontSize: 13 },
  button: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#000', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});
