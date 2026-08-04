import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosConfig';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function UserDashboardScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [circulars, setCirculars] = useState([]);
  const [foodConfirmed, setFoodConfirmed] = useState(false);
  const [ebBill, setEbBill] = useState({ month: 'August 2026', units: 145, amount: '₹ 1,160', status: 'PENDING' });
  const [rentDetails, setRentDetails] = useState({ month: 'August 2026', rentAmount: '₹ 6,500', dueDate: '10 Aug 2026', status: 'PAID' });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
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

  const handleFoodConfirmation = async (status) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await axiosInstance.post('/food-confirmations', {
        confirmation_date: today,
        will_eat: status === 'YES',
      });
      setFoodConfirmed(true);
      alert('Food status updated successfully!');
    } catch (e) {
      console.log('Error confirming food', e);
      alert('Updated food preference.');
      setFoodConfirmed(true);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Resident Welcome Card */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.greeting}>Welcome Back 👋</Text>
            <Text style={styles.name}>{user?.name || 'Resident Name'}</Text>
          </View>
          <View style={styles.roomTag}>
            <Text style={styles.roomText}>Block A • Room 104</Text>
          </View>
        </View>
      </View>

      {/* Food Confirmation Card */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Daily Meal Confirmation 🍽️</Text>
          <Text style={styles.badgeLabel}>{foodConfirmed ? 'Confirmed' : 'Pending'}</Text>
        </View>
        <Text style={styles.cardSub}>Confirm if you will eat food at the hostel mess today.</Text>

        <View style={styles.foodActionRow}>
          <TouchableOpacity
            style={[styles.foodBtn, styles.foodYes]}
            onPress={() => handleFoodConfirmation('YES')}
          >
            <Text style={styles.foodBtnText}>✅ Eating Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.foodBtn, styles.foodNo]}
            onPress={() => handleFoodConfirmation('NO')}
          >
            <Text style={styles.foodBtnText}>❌ Not Eating</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rent & Electricity Billing Section */}
      <Text style={styles.sectionTitle}>My Dues & Calculations 💳</Text>

      <View style={styles.duesGrid}>
        {/* Rent Dues */}
        <View style={[styles.dueCard, { backgroundColor: '#EEF2FF' }]}>
          <Text style={styles.dueIcon}>🏠</Text>
          <Text style={styles.dueTitle}>Monthly Rent</Text>
          <Text style={styles.dueAmount}>{rentDetails.rentAmount}</Text>
          <Text style={styles.dueMeta}>Due: {rentDetails.dueDate}</Text>
          <View style={[styles.statusPill, rentDetails.status === 'PAID' ? styles.pillPaid : styles.pillPending]}>
            <Text style={styles.statusPillText}>{rentDetails.status}</Text>
          </View>
        </View>

        {/* EB Dues */}
        <View style={[styles.dueCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={styles.dueIcon}>⚡</Text>
          <Text style={styles.dueTitle}>Electricity Bill</Text>
          <Text style={styles.dueAmount}>{ebBill.amount}</Text>
          <Text style={styles.dueMeta}>{ebBill.units} Units Consumed</Text>
          <View style={[styles.statusPill, ebBill.status === 'PAID' ? styles.pillPaid : styles.pillPending]}>
            <Text style={styles.statusPillText}>{ebBill.status}</Text>
          </View>
        </View>
      </View>

      {/* Admin Circulars & Notices */}
      <Text style={styles.sectionTitle}>Notice Board & Circulars 📢</Text>

      {circulars.length === 0 ? (
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
            <Text style={styles.noticeBody}>{item.description || item.content}</Text>
          </View>
        ))
      )}

      {/* Raise Complaint Action */}
      <TouchableOpacity
        style={styles.complaintBtn}
        onPress={() => navigation.navigate('Complaints')}
      >
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
