
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../../src/components/Header";
import colors from "../../src/constants/colors";

export default function AgregarPrenda() {
  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient as any}
    >
      <Header title="Agregar Prenda" />
      <View style={styles.container}>
        <Text style={styles.title}>🧥 Agregar nueva prenda</Text>
        <Text style={styles.subtitle}>
          Aquí podrás subir fotos o registrar información de tus prendas.
        </Text>
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
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  } as any,
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E1E1E",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
});
