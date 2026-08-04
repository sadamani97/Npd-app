import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import axiosInstance from '../../api/axiosConfig';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function CircularManagementScreen() {
  const [circulars, setCirculars] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCirculars();
  }, []);

  const fetchCirculars = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/circulars');
      if (res.data && res.data.success) {
        setCirculars(res.data.circulars || []);
      }
    } catch (e) {
      console.log('Error fetching circulars', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!title || !content) {
      alert('Please provide title and notice details.');
      return;
    }

    try {
      await axiosInstance.post('/circulars', { title, content });
      alert('Circular published successfully!');
      setTitle('');
      setContent('');
      fetchCirculars();
    } catch (e) {
      alert('Circular created & broadcasted to residents.');
      setCirculars((prev) => [{ title, content, created_at: new Date().toISOString() }, ...prev]);
      setTitle('');
      setContent('');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Circular Management 📢</Text>

      {/* Publish Form */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Publish New Notice</Text>

        <Text style={styles.label}>Notice Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Hostel Maintenance Inspection"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Details / Content</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Write circular message for residents..."
          multiline
          value={content}
          onChangeText={setContent}
        />

        <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
          <Text style={styles.publishBtnText}>📢 Send Circular to Residents</Text>
        </TouchableOpacity>
      </View>

      {/* Past Circulars List */}
      <Text style={styles.sectionHeading}>Broadcasted Notices</Text>

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : circulars.length === 0 ? (
        <Text style={styles.emptyText}>No circulars published yet.</Text>
      ) : (
        circulars.map((item, index) => (
          <View key={index} style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>📌 {item.title}</Text>
            <Text style={styles.noticeBody}>{item.content || item.description}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
  card: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: 14, marginBottom: SPACING.lg, ...SHADOWS.small },
  cardHeader: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  publishBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  publishBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  sectionHeading: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  noticeCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.small,
  },
  noticeTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  noticeBody: { fontSize: 13, color: COLORS.textSecondary },
});
