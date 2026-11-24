import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import UserDashboardScreen from '../screens/user/UserDashboardScreen';
import FoodMenuScreen from '../screens/user/FoodMenuScreen';
import ComplaintsScreen from '../screens/user/ComplaintsScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import { COLORS } from '../styles/theme';

const Tab = createBottomTabNavigator();

export default function UserTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.surface },
        headerTitleStyle: { fontWeight: '700', color: COLORS.textPrimary },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { paddingBottom: 6, paddingTop: 6, height: 60 },
        tabBarIcon: ({ focused }) => {
          let icon = '🏠';
          if (route.name === 'Home') icon = '🏠';
          if (route.name === 'FoodMenu') icon = '🍱';
          if (route.name === 'Complaints') icon = '⚠️';
          if (route.name === 'Profile') icon = '👤';
          return <Text style={{ fontSize: 20 }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={UserDashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="FoodMenu" component={FoodMenuScreen} options={{ title: 'Food Menu' }} />
      <Tab.Screen name="Complaints" component={ComplaintsScreen} options={{ title: 'Complaints' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    </Tab.Navigator>
  );
}
