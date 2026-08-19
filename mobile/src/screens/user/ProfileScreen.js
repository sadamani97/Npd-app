import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosConfig';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/users/${user.id}`);
      if (res.data?.success) {
        setProfile(res.data.data || null);
      }
    } catch (e) {
      console.log('Failed to fetch profile', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.name?.charAt(0) || user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.name}>{profile?.name || user?.name || 'Resident Name'}</Text>
        <Text style={styles.email}>{profile?.email || user?.email || 'email@example.com'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{profile?.role || user?.role || 'Resident'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hostel Block</Text>
            <Text style={styles.infoValue}>{profile?.block_number || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Room No.</Text>
            <Text style={styles.infoValue}>{profile?.room_number || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rent</Text>
            <Text style={styles.infoValue}>₹{profile?.rent_amount ?? 0}</Text>
          </View>
        </View>
      )}

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
