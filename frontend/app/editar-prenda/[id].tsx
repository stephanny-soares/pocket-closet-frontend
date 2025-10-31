import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../src/components/Header';
import colors from '../../src/constants/colors';

export default function EditarPrenda() {
  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient as any}
    >
      <Header title="Editar Prenda" />
      <View style={styles.container}>
        <Text>Editar Prenda - Próximamente</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  } as any,
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as any,
});
