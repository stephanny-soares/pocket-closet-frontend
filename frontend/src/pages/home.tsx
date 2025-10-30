import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Header from '../components/Header';

export default function Home() {
  return (
    <View style={styles.container}>
      <Header title="PocketCloset" />
      <Text style={styles.subtitle}>Bienvenido a tu armario digital 👗👕</Text>
      <Text style={styles.appName}>{process.env.EXPO_PUBLIC_APP_NAME}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4B0082',
    ...(Platform.OS === 'web' && {
      width: '100%',
      minHeight: '100vh',
    }),
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  appName: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 10,
  },
});
