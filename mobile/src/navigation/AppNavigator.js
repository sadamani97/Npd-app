import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import UserTabNavigator from './UserTabNavigator';
import AdminTabNavigator from './AdminTabNavigator';
import { COLORS } from '../styles/theme';

export default function AppNavigator() {
  const { token, loading, isAdmin } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!token ? (
        <AuthNavigator />
      ) : isAdmin ? (
        <AdminTabNavigator />
      ) : (
        <UserTabNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
