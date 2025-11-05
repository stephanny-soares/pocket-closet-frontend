import React from 'react';
import { Stack, usePathname } from 'expo-router';
import { View } from 'react-native';
import ErrorBoundary from '../src/logger/ErrorBoundary';
import BottomNavigation from '../src/components/BottomNavigation';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  const pathname = usePathname();

  // Ocultar navbar en pantallas públicas
  const showNavbar =
    !pathname.includes('login') &&
    !pathname.includes('register') &&
    !pathname.includes('index');

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
        {showNavbar && <BottomNavigation />}
        <Toast position="top" topOffset={60} />
      </View>
    </ErrorBoundary>
  );
}
