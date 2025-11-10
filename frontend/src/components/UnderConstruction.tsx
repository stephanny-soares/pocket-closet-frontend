import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname } from "expo-router";
import colors from "../constants/colors";
import Header from "./Header";

export default function UnderConstruction() {
  const pathname = usePathname();

  // 🧠 Mapeo de títulos legibles según la ruta
  const pageTitle = useMemo(() => {
    if (pathname.includes("mi-armario")) return "Mi armario";
    if (pathname.includes("mis-outfits")) return "Mis outfits";
    if (pathname.includes("mis-eventos")) return "Mis eventos";
    if (pathname.includes("mis-viajes")) return "Mis viajes";
    if (pathname.includes("add-prenda")) return "Agregar prenda";
    if (pathname.includes("notificaciones")) return "Notificaciones";
    return "Sección";
  }, [pathname]);

  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      {/* Header */}
      <Header title={pageTitle} />

      {/* Contenido central */}
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.title}>{pageTitle}</Text>
          <Text style={styles.subtitle}>
            Esta sección está en construcción 🚧{"\n"}
            Pronto podrás acceder a todas sus funciones.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4B0082",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
  },
});
