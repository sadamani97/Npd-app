import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import axiosInstance from '../../api/axiosConfig';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function FoodMenuScreen() {
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetchFoodMenu();
  }, []);

  const fetchFoodMenu = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axiosInstance.get('/food-menus/date', {
        params: { date: today },
      });

      if (res.data?.success) {
        const meals = Array.isArray(res.data.data) ? res.data.data : [];
        const menuMap = {};

        meals.forEach((item) => {
          const key = String(item.meal_type || '').toLowerCase();
          menuMap[key] = item.item_name || item.description || item.name || '';
        });

        setMenu({
          breakfast: menuMap.breakfast || '',
          lunch: menuMap.lunch || '',
          dinner: menuMap.dinner || '',
        });
      }
    } catch (e) {
      console.log('Failed to fetch food menu', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    setConfirmed(!confirmed);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Today's Food Menu 🍽️</Text>

      <View style={styles.mealCard}>
        <Text style={styles.mealHeader}>🌅 Breakfast</Text>
        <Text style={styles.mealText}>{menu?.breakfast || 'Idli, Dosa, Sambhar & Tea'}</Text>
      </View>

      <View style={styles.mealCard}>
        <Text style={styles.mealHeader}>☀️ Lunch</Text>
        <Text style={styles.mealText}>{menu?.lunch || 'Rice, Dal, Paneer Butter Masala, Roti & Curd'}</Text>
      </View>

      <View style={styles.mealCard}>
        <Text style={styles.mealHeader}>🌙 Dinner</Text>
        <Text style={styles.mealText}>{menu?.dinner || 'Chapati, Mix Veg Curry, Rice & Sweet'}</Text>
      </View>

      <TouchableOpacity
        style={[styles.confirmBtn, confirmed && styles.confirmedBtn]}
        onPress={handleConfirm}
      >
        <Text style={styles.confirmBtnText}>
          {confirmed ? '✓ Meal Attendance Confirmed' : 'Confirm Meal Attendance'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: SPACING.md },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
  mealCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  mealHeader: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.xs },
  mealText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  confirmedBtn: { backgroundColor: COLORS.success },
  confirmBtnText: { color: COLORS.textLight, fontWeight: '700', fontSize: 16 },
});
