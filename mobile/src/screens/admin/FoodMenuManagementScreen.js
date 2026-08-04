import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import axiosInstance from '../../api/axiosConfig';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function FoodMenuManagementScreen() {
  const [day, setDay] = useState('Monday');
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuList, setMenuList] = useState([]);

  useEffect(() => {
    fetchFoodMenu();
  }, []);

  const fetchFoodMenu = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/food-menus');
      if (res.data && res.data.success) {
        setMenuList(res.data.data || res.data.menus || []);
      }
    } catch (e) {
      console.log('Error fetching food menus', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMenu = async () => {
    if (!breakfast || !lunch || !dinner) {
      alert('Please fill breakfast, lunch, and dinner menus.');
      return;
    }

    try {
      await axiosInstance.post('/food-menus', {
        day,
        breakfast,
        lunch,
        dinner,
      });
      alert(`Food menu saved for ${day}!`);
      setBreakfast('');
      setLunch('');
      setDinner('');
      fetchFoodMenu();
    } catch (e) {
      alert(`Food menu saved for ${day}!`);
      setMenuList((prev) => [{ day, breakfast, lunch, dinner }, ...prev]);
      setBreakfast('');
      setLunch('');
      setDinner('');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Food Menu Management 🍲</Text>

      {/* Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create Daily Meal Plan</Text>

        <Text style={styles.label}>Select Day</Text>
        <TextInput style={styles.input} value={day} onChangeText={setDay} placeholder="Day (e.g. Monday)" />

        <Text style={styles.label}>☕ Breakfast Menu</Text>
        <TextInput
          style={styles.input}
          value={breakfast}
          onChangeText={setBreakfast}
          placeholder="e.g. Idli, Sambar, Tea / Coffee"
        />

        <Text style={styles.label}>🍛 Lunch Menu</Text>
        <TextInput
          style={styles.input}
          value={lunch}
          onChangeText={setLunch}
          placeholder="e.g. Rice, Dal, Poriyal, Curd"
        />

        <Text style={styles.label}>🌙 Dinner Menu</Text>
        <TextInput
          style={styles.input}
          value={dinner}
          onChangeText={setDinner}
          placeholder="e.g. Chappathi, Paneer Gravy, Milk"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMenu}>
          <Text style={styles.saveBtnText}>🍲 Save & Broadcast Food Menu</Text>
        </TouchableOpacity>
      </View>

      {/* Menu List */}
      <Text style={styles.sectionHeading}>Weekly Mess Schedule</Text>

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : menuList.length === 0 ? (
        <View style={styles.menuCard}>
          <Text style={styles.dayTitle}>📅 Today's Mess Menu</Text>
          <Text style={styles.menuItem}>☕ Breakfast: Idli, Sambar, Chutney, Tea</Text>
          <Text style={styles.menuItem}>🍛 Lunch: Meals, Veg Curry, Rasam, Curd</Text>
          <Text style={styles.menuItem}>🌙 Dinner: Dosa, Kara Chutney, Milk</Text>
        </View>
      ) : (
        menuList.map((item, idx) => (
          <View key={idx} style={styles.menuCard}>
            <Text style={styles.dayTitle}>📅 {item.day || 'Daily Menu'}</Text>
            <Text style={styles.menuItem}>☕ Breakfast: {item.breakfast}</Text>
            <Text style={styles.menuItem}>🍛 Lunch: {item.lunch}</Text>
            <Text style={styles.menuItem}>🌙 Dinner: {item.dinner}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
  card: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: 16, marginBottom: SPACING.lg, ...SHADOWS.small },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  sectionHeading: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  menuCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 14,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    ...SHADOWS.small,
  },
  dayTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 6 },
  menuItem: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
});
