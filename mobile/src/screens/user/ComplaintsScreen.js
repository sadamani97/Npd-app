import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosConfig';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function ComplaintsScreen() {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);

  const categories = ['Plumbing', 'Electrical', 'Cleaning', 'Internet', 'Other'];
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin' || user?.role?.toLowerCase() === 'hostel_admin';

  useEffect(() => {
    if (isAdmin) {
      fetchComplaints();
    }
  }, [isAdmin]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/complaints');
      if (res.data?.success) {
        setComplaints(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (e) {
      console.log('Failed to fetch complaints', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Please fill in both title and description');
      return;
    }

    try {
      await axiosInstance.post('/complaints', { title, description, category });
      Alert.alert('Success', 'Complaint submitted successfully!');
      setTitle('');
      setDescription('');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit complaint');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axiosInstance.put(`/complaints/${id}/status`, { status });
      fetchComplaints();
      Alert.alert('Updated', 'Complaint status has been changed');
    } catch (e) {
      Alert.alert('Error', 'Unable to update complaint status');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>{isAdmin ? 'Complaint Management ⚠️' : 'Register Complaint ⚠️'}</Text>

      {!isAdmin ? (
        <View style={styles.card}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, category === cat && styles.catChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Short issue title..."
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the issue in detail..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Submit Complaint</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : complaints.length === 0 ? (
            <Text style={styles.emptyText}>No complaints found.</Text>
          ) : (
            complaints.map((complaint) => (
              <View key={complaint.id} style={styles.adminCard}>
                <Text style={styles.adminTitle}>{complaint.title}</Text>
                <Text style={styles.adminText}>{complaint.description}</Text>
                <Text style={styles.adminMeta}>Category: {complaint.category} | By: {complaint.user?.name || 'Resident'}</Text>
                <View style={styles.statusRow}>
                  <TouchableOpacity style={styles.statusBtn} onPress={() => handleStatusChange(complaint.id, 'PENDING')}>
                    <Text style={styles.statusBtnText}>Pending</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.statusBtn} onPress={() => handleStatusChange(complaint.id, 'IN_PROGRESS')}>
                    <Text style={styles.statusBtnText}>In progress</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.statusBtn} onPress={() => handleStatusChange(complaint.id, 'RESOLVED')}>
                    <Text style={styles.statusBtnText}>Resolved</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
  card: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: 16, ...SHADOWS.medium },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginTop: SPACING.sm, marginBottom: SPACING.xs },
  catRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
    marginRight: 8,
  },
  catChipActive: { backgroundColor: COLORS.primary },
  catText: { fontSize: 13, color: COLORS.textSecondary },
  catTextActive: { color: COLORS.textLight, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitBtnText: { color: COLORS.textLight, fontWeight: 'bold', fontSize: 16 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  adminCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  adminTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  adminText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  adminMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  statusBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBtnText: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
});
