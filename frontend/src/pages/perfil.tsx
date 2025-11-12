import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import colors from "../constants/colors";
import { useAuth } from "../hooks/useAuth";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { useLoader } from "../context/LoaderContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Perfil() {
  const { logout, auth } = useAuth();
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();

  const [preferences, setPreferences] = useState<any>(null);

  // 🔹 Cargar preferencias almacenadas
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const saved = await AsyncStorage.getItem("user_preferences");
        if (saved) setPreferences(JSON.parse(saved));
      } catch (err) {
        console.warn("Error al cargar preferencias:", err);
      }
    };
    loadPreferences();
  }, []);

  const handleLogout = async () => {
    try {
      showLoader("Cerrando sesión...");
      await new Promise((resolve) => setTimeout(resolve, 600));
      await logout();
      hideLoader();

      Toast.show({
        type: "success",
        text1: "👋 Sesión cerrada",
        text2: "Has cerrado sesión correctamente.",
        position: "bottom",
        visibilityTime: 1500,
        bottomOffset: 70,
      });

      router.replace("/login?loggedOut=true");
    } catch (error) {
      hideLoader();
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo cerrar sesión correctamente.",
        position: "bottom",
        bottomOffset: 70,
      });
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Header title="Perfil" />

      <View style={styles.container}>
        <Text style={styles.welcome}>¡Hola {auth?.userName || "Usuario"}! 👋</Text>

        {/* 🔹 Bloque de preferencias del usuario */}
        {preferences ? (
          <View style={styles.preferencesBox}>
            <Text style={styles.prefTitle}>Tus preferencias:</Text>

            <View style={styles.prefItemRow}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={styles.prefItem}>
                Ciudad: {preferences.ciudad || "No especificada"}
              </Text>
            </View>

            <View style={styles.prefItemRow}>
              <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
              <Text style={styles.prefItem}>
                Entorno: {preferences.entorno || "No especificado"}
              </Text>
            </View>

            <View style={styles.prefItemRow}>
              <Ionicons name="shirt-outline" size={20} color={colors.primary} />
              <Text style={styles.prefItem}>
                Estilo:{" "}
                {Array.isArray(preferences.estilo)
                  ? preferences.estilo.join(", ")
                  : preferences.estilo || "No especificado"}
              </Text>
            </View>

            <View style={styles.prefItemRow}>
              <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
              <Text style={styles.prefItem}>
                Colores:{" "}
                {Array.isArray(preferences.colores)
                  ? preferences.colores.join(", ")
                  : preferences.colores || "No especificados"}
              </Text>
            </View>

            {/* Botón para editar preferencias */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push("/(protected)/questionnaire")}
            >
              <Ionicons name="create-outline" size={20} color="#FFF" />
              <Text style={styles.editText}>Editar preferencias</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.optionButton, { marginBottom: 20 }]}
            onPress={() => router.push("/(protected)/questionnaire")}
          >
            <Ionicons name="shirt-outline" size={24} color={colors.primary} />
            <Text style={styles.optionText}>Configurar preferencias</Text>
          </TouchableOpacity>
        )}

        {/* 🔹 Opciones generales */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() =>
              Toast.show({
                type: "info",
                text1: "Configuración",
                text2: "Función disponible próximamente",
                position: "bottom",
                bottomOffset: 70,
              })
            }
          >
            <Ionicons name="settings-outline" size={24} color={colors.primary} />
            <Text style={styles.optionText}>Configuración de cuenta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() =>
              Toast.show({
                type: "info",
                text1: "Notificaciones",
                text2: "Sección en desarrollo",
                position: "bottom",
                bottomOffset: 70,
              })
            }
          >
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            <Text style={styles.optionText}>Notificaciones</Text>
          </TouchableOpacity>

          {/* 🔹 Botón logout */}
          <TouchableOpacity
            style={[styles.optionButton, styles.logoutButton]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            <Text style={[styles.optionText, styles.logoutText]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "flex-start",
  },
  welcome: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E1E1E",
    marginBottom: 20,
  },
  preferencesBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  prefTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1E1E1E",
  },
  prefItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  prefItem: {
    fontSize: 15,
    color: "#333",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  editText: {
    color: "#FFF",
    fontWeight: "600",
  },
  section: {
    marginTop: 10,
    gap: 16,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: "#1E1E1E",
    fontWeight: "500",
  },
  logoutButton: {
    backgroundColor: colors.primary,
    justifyContent: "center",
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
