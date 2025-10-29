
import React from 'react';
import { Stack } from 'expo-router';
import ErrorBoundary from '../src/logger/ErrorBoundary';

// Opciones de navegación globales 
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false, 
        }}
      />
    </ErrorBoundary>
  );
}
