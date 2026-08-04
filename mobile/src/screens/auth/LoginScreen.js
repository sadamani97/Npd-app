import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View className="header" style={styles.header}>
          <Text style={styles.logoText}>Npd Hostel</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.card}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="user@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Quick Fill Demo Logins:</Text>
            <View style={styles.demoBtnRow}>
              <TouchableOpacity
                style={[styles.demoBtn, { backgroundColor: '#8B5CF6' }]}
                onPress={() => {
                  setEmail('admin@hostel.com');
                  setPassword('admin123');
                }}
              >
                <Text style={styles.demoBtnText}>👨‍✈️ Fill Admin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoBtn, { backgroundColor: '#10B981' }]}
                onPress={() => {
                  setEmail('user@hostel.com');
                  setPassword('user1234');
                }}
              >
                <Text style={styles.demoBtnText}>👨‍👩‍👧‍👦 Fill User</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.secondaryButtonText}>
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logoText: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: SPACING.xs },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 16,
    ...SHADOWS.medium,
  },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonText: { color: COLORS.textLight, fontSize: 16, fontWeight: '600' },
  secondaryButton: { marginTop: SPACING.md, alignItems: 'center' },
  secondaryButtonText: { color: COLORS.primary, fontSize: 14, fontWeight: '500' },
  errorText: { color: COLORS.danger, marginBottom: SPACING.md, textAlign: 'center' },
  demoBox: { marginTop: SPACING.lg, padding: SPACING.sm, backgroundColor: '#F4F5FB', borderRadius: 10 },
  demoTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, textAlign: 'center' },
  demoBtnRow: { flexDirection: 'row', gap: 8 },
  demoBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  demoBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
});
