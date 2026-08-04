import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import axiosInstance from '../../api/axiosConfig';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function ManageRoomsPage() {
  const [loading, setLoading] = useState(true);
  const [roomStats, setRoomStats] = useState(null);
  const [blockSummary, setBlockSummary] = useState([]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/dashboard/stats');
      if (res.data?.success) {
        const payload = res.data.data || {};
        setRoomStats(payload.roomStats || null);
        setBlockSummary(Array.isArray(payload.blockGroups) ? payload.blockGroups : []);
      }
    } catch (e) {
      console.log('Failed to fetch rooms stats', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Manage Rooms & Occupancy 🛏️</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <View>
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Room Statistics</Text>
            <Text style={styles.cardDetail}>Total Rooms: {roomStats?.totalRooms ?? 0}</Text>
            <Text style={styles.cardDetail}>Occupied Rooms: {roomStats?.occupiedRooms ?? 0}</Text>
            <Text style={styles.cardDetail}>Vacant Rooms: {roomStats?.vacantRooms ?? 0}</Text>
          </View>

          {blockSummary.map((block) => (
            <View key={block.block} style={styles.card}>
              <Text style={styles.cardHeader}>Block {block.block}</Text>
              <Text style={styles.cardDetail}>Residents in block: {block.residents ?? 0}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
  card: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: 12, marginBottom: SPACING.md, ...SHADOWS.small },
  cardHeader: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.xs },
  cardDetail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
});
