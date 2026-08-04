import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import axiosInstance from '../../api/axiosConfig';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function ResidentsListPage({ navigation }) {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/users');
      if (res.data && res.data.success) {
        setResidents(res.data.users || res.data.residents || []);
      }
    } catch (e) {
      console.log('Failed to fetch residents', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredResidents = residents.filter(r =>
    (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.phone || '').includes(search) ||
    (r.room_number || '').toString().includes(search)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resident Details 👥</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, phone, room..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredResidents}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <View style={styles.residentCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.charAt(0) || 'R'}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name || 'Unknown'}</Text>
                <Text style={styles.details}>📞 {item.phone || 'N/A'}</Text>
                <Text style={styles.details}>🏢 Block {item.block_number || 'A'} - Room {item.room_number || '101'}</Text>
              </View>
              <View style={[styles.badge, item.status === 'INACTIVE' ? styles.badgeInactive : styles.badgeActive]}>
                <Text style={styles.badgeText}>{item.status || 'ACTIVE'}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.md, backgroundColor: COLORS.surface, ...SHADOWS.small },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  searchInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listPadding: { padding: SPACING.md },
  residentCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  details: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeInactive: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: COLORS.textPrimary },
});
