import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function ComplaintsScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Plumbing');

  const categories = ['Plumbing', 'Electrical', 'Cleaning', 'Internet', 'Other'];

  const handleSubmit = () => {
    if (!title || !description) {
      Alert.alert('Error', 'Please fill in both title and description');
      return;
    }
    Alert.alert('Success', 'Complaint submitted successfully!');
    setTitle('');
    setDescription('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Register Complaint ⚠️</Text>

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
});
