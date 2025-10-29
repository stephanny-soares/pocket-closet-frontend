import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';

export default function Home() {
  return (
    <View style={styles.container}>
      <Header title="PocketCloset" />
      <Text style={styles.subtitle}>Bienvenido a tu armario digital 👗👕</Text>
      <Text>{process.env.EXPO_PUBLIC_APP_NAME}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
  },
});
