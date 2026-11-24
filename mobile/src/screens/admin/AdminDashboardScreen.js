import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosConfig';
import Sidebar from '../../components/Sidebar';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function AdminDashboardScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;

  const [activeNav, setActiveNav] = useState('dashboard');
  const [activeToggle, setActiveToggle] = useState('blocks');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResidents: 10,
    blocks: 2,
    vacantRooms: 40,
    pendingPayments: 14,
    vacantBeds: 113,
    foodCount: 0,
    growth: '+12%',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/dashboard/stats');
      if (res.data?.success) {
        const dashboardData = res.data.data || {};
        const roomStats = dashboardData.roomStats || {};
        const payments = dashboardData.payments || {};

        setStats((prev) => ({
          ...prev,
          totalResidents: dashboardData.totalResidents ?? prev.totalResidents,
          blocks: dashboardData.blockGroups?.length ?? prev.blocks,
          vacantRooms: roomStats.vacantRooms ?? prev.vacantRooms,
          vacantBeds: dashboardData.roomOccupancy?.reduce((sum, room) => sum + Math.max((room.capacity || 0) - (room.occupied || 0), 0), 0) ?? prev.vacantBeds,
          pendingPayments: payments.unpaidCount ?? prev.pendingPayments,
          foodCount: dashboardData.foodCount ?? prev.foodCount,
          growth: dashboardData.growth ?? prev.growth,
        }));
      }
    } catch (e) {
      console.log('Failed to fetch dashboard stats', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSidebarSelect = (itemId) => {
    setActiveNav(itemId);
    if (itemId === 'residents') navigation.navigate('ResidentsList');
    if (itemId === 'rooms') navigation.navigate('ManageRooms');
    if (itemId === 'complaints') navigation.navigate('Complaints');
    if (itemId === 'foodMenu') navigation.navigate('FoodMenu');
  };

  return (
    <View style={styles.rootContainer}>
      <ScrollView style={styles.mainContent} contentContainerStyle={styles.scrollPadding}>
        {/* Header Section */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Hostel Management Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Welcome back, {user?.name || 'Admin User'}!
            </Text>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search name, phone, block, room..."
              placeholderTextColor={COLORS.textMuted}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>

        {/* View Toggle Buttons */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeToggle === 'blocks' && styles.toggleBtnActive]}
            onPress={() => setActiveToggle('blocks')}
          >
            <Text style={[styles.toggleText, activeToggle === 'blocks' && styles.toggleTextActive]}>
              📈 Block Statistics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, activeToggle === 'vacant' && styles.toggleBtnActive]}
            onPress={() => setActiveToggle('vacant')}
          >
            <Text style={[styles.toggleText, activeToggle === 'vacant' && styles.toggleTextActive]}>
              🏗️ Vacant rooms
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, activeToggle === 'residents' && styles.toggleBtnActive]}
            onPress={() => setActiveToggle('residents')}
          >
            <Text style={[styles.toggleText, activeToggle === 'residents' && styles.toggleTextActive]}>
              👨‍👩‍👧‍👦 Residents List
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, activeToggle === 'growth' && styles.toggleBtnActive]}
            onPress={() => setActiveToggle('growth')}
          >
            <Text style={[styles.toggleText, activeToggle === 'growth' && styles.toggleTextActive]}>
              📊 Growth Insights
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4 Main Stat Metric Cards (Matching Purple, Blue, Emerald, Amber screenshot gradients) */}
        <View style={styles.statsGrid}>
          {/* Card 1: Total Residents */}
          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.statIcon}>👥</Text>
            </View>
            <View>
              <Text style={styles.statNumber}>{stats.totalResidents}</Text>
              <Text style={styles.statLabel}>TOTAL RESIDENTS</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Blocks */}
          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.statIcon}>🏠</Text>
            </View>
            <View>
              <Text style={styles.statNumber}>{stats.blocks}</Text>
              <Text style={styles.statLabel}>BLOCKS</Text>
            </View>
          </TouchableOpacity>

          {/* Card 3: Vacant Rooms */}
          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.statIcon}>🛏️</Text>
            </View>
            <View>
              <Text style={styles.statNumber}>{stats.vacantRooms}</Text>
              <Text style={styles.statLabel}>VACANT ROOMS</Text>
            </View>
          </TouchableOpacity>

          {/* Card 4: Pending Payments */}
          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.statIcon}>💳</Text>
            </View>
            <View>
              <Text style={styles.statNumber}>{stats.pendingPayments}</Text>
              <Text style={styles.statLabel}>PENDING PAYMENTS</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Dashboard Overview Section */}
        <Text style={styles.sectionHeading}>Dashboard Overview</Text>

        <View style={styles.overviewGrid}>
          {/* Overview Card 1 */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeaderRow}>
              <Text style={styles.overviewCardTitle}>Total Vacant Beds</Text>
              <Text style={styles.overviewIcon}>🛏️</Text>
            </View>
            <Text style={styles.overviewValue}>{stats.vacantBeds}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { backgroundColor: '#F59E0B', width: '70%' }]} />
            </View>
            <Text style={styles.overviewSubtext}>Across all blocks</Text>
          </View>

          {/* Overview Card 2 */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeaderRow}>
              <Text style={styles.overviewCardTitle}>Food Count (Today)</Text>
              <Text style={styles.overviewIcon}>🍽️</Text>
            </View>
            <Text style={styles.overviewValue}>{stats.foodCount}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { backgroundColor: '#E2E8F0', width: '10%' }]} />
            </View>
            <Text style={styles.overviewSubtext}>Confirmed daily requirements.</Text>
          </View>

          {/* Overview Card 3 */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeaderRow}>
              <Text style={styles.overviewCardTitle}>Monthly Growth</Text>
              <Text style={styles.overviewIcon}>🚀</Text>
            </View>
            <Text style={styles.overviewValue}>{stats.growth}</Text>
            <View style={styles.sparklineMock}>
              <Text style={{ color: '#0EA5E9', fontWeight: 'bold' }}>📈 ~~~~~</Text>
            </View>
            <Text style={styles.overviewSubtext}>Compared to last month</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },
  mainContent: {
    flex: 1,
  },
  scrollPadding: {
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  searchContainer: {
    minWidth: 260,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.small,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  toggleBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#1E293B',
  },
  toggleText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    ...SHADOWS.medium,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statIcon: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: SPACING.md,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  overviewCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  overviewCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  overviewIcon: {
    fontSize: 20,
  },
  overviewValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0F172A',
    marginVertical: SPACING.xs,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginVertical: SPACING.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  overviewSubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
  sparklineMock: {
    marginVertical: SPACING.sm,
  },
});
