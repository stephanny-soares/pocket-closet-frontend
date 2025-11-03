import React from 'react';
import { Stack, usePathname } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import ErrorBoundary from '../src/logger/ErrorBoundary';
import BottomNavigation from '../src/components/BottomNavigation';

export default function RootLayout() {
  const pathname = usePathname();
  
  const showNavbar = !pathname.includes('login') && !pathname.includes('register') && pathname !== '/';

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <Stack />
        {showNavbar && <BottomNavigation />}
      </View>
    </ErrorBoundary>
  );
}
