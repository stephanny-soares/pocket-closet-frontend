import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import Header from "../components/Header";
import colors from "../constants/colors";

export default function ListaEquipaje() {
  return (
    <>
      {/* 🔥 Esto elimina el header blanco de Expo Router */}
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={colors.gradient}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Header title="Lista de Equipaje" />

        <View style={styles.center}>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              La funcionalidad de IA para ayudarte a hacer la maleta estará muy pronto disponible.
            </Text>
          </View>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: "90%",
    maxWidth: 700,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  cardText: {
    color: "#333",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
  },
});
