import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../styles/theme';

export default function Sidebar({ activeItem, onSelectItem, userRole = 'Admin' }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'residents', label: 'Resident Details', icon: '👥' },
    { id: 'rooms', label: 'Manage Rooms', icon: '🛏️' },
    { id: 'electricity', label: 'Electricity Billing', icon: '⚡' },
    { id: 'foodMenu', label: 'Food Menu', icon: '🍲' },
    { id: 'complaints', label: 'Complaint Management', icon: '📝' },
    { id: 'circulars', label: 'Circular Management', icon: '📢' },
    { id: 'foodConfirmations', label: 'Food Confirmations', icon: '🍽️' },
    { id: 'vacated', label: 'Vacated List', icon: '🚪' },
  ];

  return (
    <View style={styles.sidebar}>
      <View style={styles.brandContainer}>
        <Text style={styles.brandIcon}>🏠</Text>
        <Text style={styles.brandTitle}>Hostel</Text>
      </View>

      <View style={styles.adminBadge}>
        <Text style={styles.adminBadgeText}>👨‍✈️ {userRole}</Text>
      </View>

      <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => onSelectItem(item.id)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: COLORS.sidebarBg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    height: '100%',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  brandIcon: {
    fontSize: 28,
    marginRight: 8,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  adminBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xl,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  menuItemActive: {
    backgroundColor: COLORS.sidebarActiveBg,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 14,
    color: COLORS.sidebarText,
    fontWeight: '500',
  },
  menuLabelActive: {
    color: COLORS.sidebarTextActive,
    fontWeight: '700',
  },
});
