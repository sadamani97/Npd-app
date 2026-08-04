import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import BlocksPage from '../screens/admin/BlocksPage';
import ResidentsListPage from '../screens/admin/ResidentsListPage';
import AddResidentScreen from '../screens/admin/AddResidentScreen';
import ManageRoomsPage from '../screens/admin/ManageRoomsPage';
import FoodMenuManagementScreen from '../screens/admin/FoodMenuManagementScreen';
import ElectricityBillingScreen from '../screens/admin/ElectricityBillingScreen';
import CircularManagementScreen from '../screens/admin/CircularManagementScreen';
import ComplaintsScreen from '../screens/user/ComplaintsScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import { COLORS } from '../styles/theme';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.surface },
        headerTitleStyle: { fontWeight: '700', color: COLORS.textPrimary },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { paddingBottom: 6, paddingTop: 6, height: 60 },
        tabBarIcon: ({ focused }) => {
          let icon = '📊';
          if (route.name === 'Dashboard') icon = '📊';
          if (route.name === 'Blocks') icon = '🏢';
          if (route.name === 'ResidentsList') icon = '👥';
          if (route.name === 'AddResident') icon = '➕';
          if (route.name === 'ManageRooms') icon = '🛏️';
          if (route.name === 'FoodMenu') icon = '🍲';
          if (route.name === 'Electricity') icon = '⚡';
          if (route.name === 'Circulars') icon = '📢';
          if (route.name === 'Complaints') icon = '⚠️';
          if (route.name === 'Profile') icon = '👤';
          return <Text style={{ fontSize: 20 }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ headerShown: false, title: 'Dashboard' }} />
      <Tab.Screen name="Blocks" component={BlocksPage} options={{ title: 'Blocks' }} />
      <Tab.Screen name="ResidentsList" component={ResidentsListPage} options={{ title: 'Residents' }} />
      <Tab.Screen name="AddResident" component={AddResidentScreen} options={{ title: 'Add Resident' }} />
      <Tab.Screen name="ManageRooms" component={ManageRoomsPage} options={{ title: 'Manage Rooms' }} />
      <Tab.Screen name="FoodMenu" component={FoodMenuManagementScreen} options={{ title: 'Mess Menu' }} />
      <Tab.Screen name="Electricity" component={ElectricityBillingScreen} options={{ title: 'EB Bill' }} />
      <Tab.Screen name="Circulars" component={CircularManagementScreen} options={{ title: 'Notice' }} />
      <Tab.Screen name="Complaints" component={ComplaintsScreen} options={{ title: 'Complaints' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
