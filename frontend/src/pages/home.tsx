import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Header from '../components/Header';

export default function Home() {
  return (
    <View style={styles.container as any}>
      <Header title="PocketCloset" />
      <Text style={styles.subtitle as any}>Bienvenido a tu armario digital 👗👕</Text>
      <Text style={styles.appName as any}>{process.env.EXPO_PUBLIC_APP_NAME}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4B0082',
    width: '100%' as any,
    minHeight: Platform.OS === 'web' ? '100vh' : 'auto',
  } as any,
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center' as any,
  } as any,
  appName: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 10,
  } as any,
});
