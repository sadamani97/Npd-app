import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosConfig';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function UserDashboardScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [circulars, setCirculars] = useState([]);
  const [profile, setProfile] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState([]);
  const [foodConfirm, setFoodConfirm] = useState({ breakfast: false, lunch: false, dinner: false });
  const [foodConfirmed, setFoodConfirmed] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [user?.id]);

  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [circularRes, profileRes, paymentRes, foodRes] = await Promise.all([
        axiosInstance.get('/circulars'),
        axiosInstance.get(`/users/${user.id}`),
        axiosInstance.get(`/payments/history/${user.id}`),
        axiosInstance.get('/food-confirmations/user/date', {
          params: { confirmation_date: new Date().toISOString().split('T')[0] },
        }),
      ]);

      if (circularRes.data?.success) {
        setCirculars(Array.isArray(circularRes.data.data) ? circularRes.data.data : []);
      }

      if (profileRes.data?.success) {
        setProfile(profileRes.data.data || null);
      }

      if (paymentRes.data?.success) {
        const payments = Array.isArray(paymentRes.data.data?.payments) ? paymentRes.data.data.payments : [];
        setPaymentSummary(payments);
      }

      if (foodRes.data?.success && foodRes.data.data) {
        setFoodConfirm({
          breakfast: Boolean(foodRes.data.data.breakfast),
          lunch: Boolean(foodRes.data.data.lunch),
          dinner: Boolean(foodRes.data.data.dinner),
        });
        setFoodConfirmed(Boolean(foodRes.data.data.is_confirmed));
      }
    } catch (e) {
      console.log('Error fetching user dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const currentMonthPayment = paymentSummary[0] || null;
  const rentStatus = currentMonthPayment?.payment_status || 'PENDING';
  const rentAmount = profile?.rent_amount || 0;
  const electricityAmount = profile?.electricity_charges || 0;

  const handleFoodConfirmation = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await axiosInstance.post('/food-confirmations', {
        confirmation_date: today,
        breakfast: foodConfirm.breakfast,
        lunch: foodConfirm.lunch,
        dinner: foodConfirm.dinner,
        notes: 'Confirmed from mobile app',
      });
      setFoodConfirmed(true);
      alert('Food status updated successfully!');
    } catch (e) {
      console.log('Error confirming food', e);
      alert('Food status update failed. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.greeting}>Welcome Back 👋</Text>
            <Text style={styles.name}>{profile?.name || user?.name || 'Resident Name'}</Text>
          </View>
          <View style={styles.roomTag}>
            <Text style={styles.roomText}>{profile?.block_number ? `Block ${profile.block_number}` : 'Room'} • {profile?.room_number || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Daily Meal Confirmation 🍽️</Text>
          <Text style={styles.badgeLabel}>{foodConfirmed ? 'Confirmed' : 'Pending'}</Text>
        </View>
        <Text style={styles.cardSub}>Choose your meals for today and submit them to the hostel admin.</Text>

        <View style={styles.foodActionRow}>
          {['breakfast', 'lunch', 'dinner'].map((meal) => (
            <TouchableOpacity
              key={meal}
              style={[styles.foodBtn, foodConfirm[meal] ? styles.foodYes : styles.foodNo]}
              onPress={() => setFoodConfirm((prev) => ({ ...prev, [meal]: !prev[meal] }))}
            >
              <Text style={styles.foodBtnText}>{foodConfirm[meal] ? '✓' : '○'} {meal.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitFoodBtn} onPress={handleFoodConfirmation}>
          <Text style={styles.submitFoodBtnText}>Save Food Confirmation</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Dues & Calculations 💳</Text>

      <View style={styles.duesGrid}>
        <View style={[styles.dueCard, { backgroundColor: '#EEF2FF' }]}> 
          <Text style={styles.dueIcon}>🏠</Text>
          <Text style={styles.dueTitle}>Monthly Rent</Text>
          <Text style={styles.dueAmount}>₹{Number(rentAmount || 0).toFixed(2)}</Text>
          <Text style={styles.dueMeta}>Current status: {rentStatus}</Text>
          <View style={[styles.statusPill, rentStatus === 'PAID' ? styles.pillPaid : styles.pillPending]}>
            <Text style={styles.statusPillText}>{rentStatus}</Text>
          </View>
        </View>

        <View style={[styles.dueCard, { backgroundColor: '#FEF3C7' }]}> 
          <Text style={styles.dueIcon}>⚡</Text>
          <Text style={styles.dueTitle}>Electricity Bill</Text>
          <Text style={styles.dueAmount}>₹{Number(electricityAmount || 0).toFixed(2)}</Text>
          <Text style={styles.dueMeta}>Current month charges</Text>
          <View style={[styles.statusPill, currentMonthPayment?.payment_status === 'PAID' ? styles.pillPaid : styles.pillPending]}>
            <Text style={styles.statusPillText}>{currentMonthPayment?.payment_status || 'PENDING'}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Notice Board & Circulars 📢</Text>

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : circulars.length === 0 ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>📌 Hostel General Guidelines</Text>
          <Text style={styles.noticeBody}>
            Gate closes at 10:00 PM strictly. Keep your rooms clean and electricity switches turned off when going out.
          </Text>
        </View>
      ) : (
        circulars.map((item, idx) => (
          <View key={idx} style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>📢 {item.title || 'Admin Notice'}</Text>
            <Text style={styles.noticeBody}>{item.message || item.description || item.content}</Text>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.complaintBtn} onPress={() => navigation.navigate('Complaints')}>
        <Text style={styles.complaintBtnText}>📝 Raise a New Complaint</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  welcomeCard: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { color: '#C7D2FE', fontSize: 13, fontWeight: '600' },
  name: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  roomTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roomText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderRadius: 14,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  badgeLabel: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  cardSub: { fontSize: 13, color: '#64748B', marginVertical: 6 },
  foodActionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  foodBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  foodYes: { backgroundColor: '#10B981' },
  foodNo: { backgroundColor: '#EF4444' },
  foodBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  submitFoodBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  submitFoodBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: SPACING.md },
  duesGrid: { flexDirection: 'row', gap: 12, marginBottom: SPACING.lg },
  dueCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 14,
    ...SHADOWS.small,
  },
  dueIcon: { fontSize: 24 },
  dueTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginTop: 4 },
  dueAmount: { fontSize: 20, fontWeight: 'bold', color: '#0F172A', marginVertical: 4 },
  dueMeta: { fontSize: 12, color: '#64748B' },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 8,
  },
  pillPaid: { backgroundColor: '#D1FAE5' },
  pillPending: { backgroundColor: '#FEE2E2' },
  statusPillText: { fontSize: 10, fontWeight: 'bold', color: '#1E293B' },

  noticeCard: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.small,
  },
  noticeTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  noticeBody: { fontSize: 13, color: '#475569', lineHeight: 18 },

  complaintBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  complaintBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
});
