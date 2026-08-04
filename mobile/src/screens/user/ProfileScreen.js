import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Resident Name'}</Text>
        <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{user?.role || 'Resident'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hostel Block</Text>
          <Text style={styles.infoValue}>Block A</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Room No.</Text>
          <Text style={styles.infoValue}>104</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  profileHeader: { alignItems: 'center', marginVertical: SPACING.lg },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: { color: COLORS.textLight, fontSize: 32, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },
  email: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  infoLabel: { fontSize: 15, color: COLORS.textSecondary },
  infoValue: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xs },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: { color: COLORS.danger, fontWeight: 'bold', fontSize: 16 },
});
