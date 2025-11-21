import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router, Stack } from "expo-router";
import Header from "components/Header";  // ⬅ EL MISMO HEADER QUE USA ADD-PRENDA
import colors from "../constants/colors";
import { apiFetch, apiRequest } from "../utils/apiClient";
import { useLoader } from "../context/LoaderContext";

export default function CrearOutfit() {
  const { prendaBase, modo } = useLocalSearchParams<{
    prendaBase?: string;
    modo?: string;
  }>();

  const { showLoader, hideLoader } = useLoader();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [prenda, setPrenda] = useState<any>(null);
  const [imagen, setImagen] = useState<string | null>(null);

  const [categoria, setCategoria] = useState("casual");
  const [estacion, setEstacion] = useState("primavera");
  const [generando, setGenerando] = useState(false);

  const HiddenHeader = (
    <Stack.Screen
      options={{
        headerShown: false,
      }}
    />
  );

  const obtenerTitulo = () => {
    if (modo === "evento") return "Outfit para evento";
    if (modo === "clima") return "Outfit para hoy";
    return "Outfit basado en prenda";
  };

  useEffect(() => {
    if (prendaBase) cargarPrendaBase();
  }, [prendaBase]);

  const cargarPrendaBase = async () => {
    showLoader("Cargando prenda base...");
    try {
      const data = await apiRequest<any>(`/api/prendas/${prendaBase}`, {
        method: "GET",
      });
      const p = data.prenda || data;
      setPrenda(p);
      setImagen(p.imagen);
    } catch {
      Alert.alert("Error", "No se pudo cargar la prenda base");
    } finally {
      hideLoader();
    }
  };

  const generarOutfitIA = async () => {
    if (!imagen) return;

    setGenerando(true);
    showLoader("Generando outfit con IA...");

    try {
      const response = await apiFetch("/api/prendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen }),
      });

      const resultado = await response.json();
      const p = resultado.prenda || resultado;

      setCategoria(p.ocasion || categoria);
      setEstacion(p.estacion || estacion);
      setImagen(p.imagen || imagen);

      Alert.alert("✨ Listo", "La IA generó una sugerencia");
    } catch {
      Alert.alert("Error", "La IA no pudo generar");
    } finally {
      hideLoader();
      setGenerando(false);
    }
  };

  const guardarOutfit = async () => {
    showLoader("Guardando outfit...");

    try {
      const prendasIds = prenda ? [prenda.id] : [];

      const body = {
        nombre: "Outfit generado",
        imagen,
        categoria,
        estacion,
        prendas: prendasIds,
      };

      const response = await apiFetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("No se pudo crear el outfit");

      Alert.alert("✔ Éxito", "Outfit creado");
      router.replace("/mis-outfits");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      hideLoader();
    }
  };

  return (
    <>
      {HiddenHeader}

      <LinearGradient
        colors={colors.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* 🔥 HEADER EXACTO DE ADD-PRENDA */}
        <Header title={obtenerTitulo()} />

        {/* 🔽 CONTENIDO */}
        <ScrollView contentContainerStyle={styles.scroll}>
          <View
            style={[
              styles.container,
              isWeb && { maxWidth: 500, alignSelf: "center" },
            ]}
          >
            {/* PREVIEW */}
            {imagen ? (
              <Image source={{ uri: imagen }} style={styles.preview} />
            ) : (
              <View style={styles.previewPlaceholder} />
            )}

            {/* CATEGORÍA */}
            <Text style={styles.label}>Categoría sugerida</Text>
            <View style={styles.row}>
              {["casual", "formal", "deporte", "fiesta"].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, categoria === c && styles.chipActive]}
                  onPress={() => setCategoria(c)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      categoria === c && styles.chipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ESTACIÓN */}
            <Text style={styles.label}>Estación sugerida</Text>
            <View style={styles.row}>
              {["primavera", "verano", "otoño", "invierno"].map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.chip, estacion === e && styles.chipActive]}
                  onPress={() => setEstacion(e)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      estacion === e && styles.chipTextActive,
                    ]}
                  >
                    {e}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* BOTÓN IA */}
            <TouchableOpacity
              style={[styles.btnPrimary, generando && { opacity: 0.6 }]}
              onPress={generarOutfitIA}
              disabled={generando}
            >
              <Ionicons name="sparkles-outline" size={20} color="#FFF" />
              <Text style={styles.btnPrimaryText}>
                {generando ? "Generando..." : "Generar con IA"}
              </Text>
            </TouchableOpacity>

            {/* BOTÓN GUARDAR */}
            <TouchableOpacity style={styles.btnSave} onPress={guardarOutfit}>
              <Text style={styles.btnSaveText}>Guardar outfit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

/* 🎨 ESTILOS EXACTOS COMO ADD-PRENDA */
const styles = StyleSheet.create({
  gradient: { flex: 1 },

  scroll: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },

  container: {
    width: "100%",
  },

  preview: {
    width: "100%",
    height: 250,
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    marginVertical: 20,
  },

  previewPlaceholder: {
    width: "100%",
    height: 250,
    borderRadius: 16,
    backgroundColor: "#DDD",
    marginVertical: 20,
  },

  label: {
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },

  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#EAEAEA",
    borderRadius: 20,
  },

  chipActive: {
    backgroundColor: colors.primary,
  },

  chipText: {
    color: "#333",
  },

  chipTextActive: {
    color: "#FFF",
  },

  btnPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
  },

  btnPrimaryText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },

  btnSave: {
    backgroundColor: "#4B0082",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
    marginBottom: 40,
  },

  btnSaveText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
